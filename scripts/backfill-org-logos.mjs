#!/usr/bin/env node
/**
 * Backfills organisations.logo_url by downloading logos into Supabase Storage.
 *
 * All logos are stored permanently at org-logos/{org_id}.{ext} in Supabase Storage,
 * making the front-end completely self-contained — no runtime calls to Google/Wikipedia.
 *
 * Sources tried in order per org:
 *  1. Wikipedia REST page summary thumbnail — returns actual club crests/badges
 *  2. Google Favicon CDN at 128px          — reliable fallback for any domain
 *
 * Both sources are fetched ONCE at backfill time; the result is stored in Supabase
 * Storage and logo_url is set. Future renders hit only the Supabase CDN.
 *
 * Run (PowerShell):
 *   $env:SUPABASE_URL = "https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
 *   node scripts/backfill-org-logos.mjs
 *
 * Flags:
 *   --dry-run   Log what would happen, skip all writes
 *   --force     Re-fetch and overwrite even if logo_url is already set
 *
 * Resumable — checkpoint saved to scripts/backfill-org-logos-checkpoint.json
 * Safe to Ctrl+C and re-run; already-completed orgs are skipped automatically.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHECKPOINT_FILE = join(__dirname, 'backfill-org-logos-checkpoint.json')

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Set $env:SUPABASE_URL and $env:SUPABASE_SERVICE_ROLE_KEY before running.')
  process.exit(1)
}

const BUCKET             = 'org-logos'
const BUCKET_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`
const DELAY_MS           = 600   // ~1.6 req/sec — polite to Wikipedia
const MIN_IMAGE_BYTES    = 2048  // < 2 KB → generic browser icon, not useful
const DRY_RUN            = process.argv.includes('--dry-run')
const FORCE              = process.argv.includes('--force')

const WIKI_HEADERS = {
  'User-Agent': 'footy-contacts-logo-backfill/1.0 (internal; https://footy-contacts.com)',
  Accept: 'application/json',
}

// ── Checkpoint ────────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (!existsSync(CHECKPOINT_FILE)) return new Set()
  try {
    return new Set(JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8')).done ?? [])
  } catch { return new Set() }
}

function saveCheckpoint(done) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ done: [...done] }, null, 2))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * fetch with an AbortController timeout. Throws on timeout.
 */
async function fetchWithTimeout(url, opts = {}, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ── Name cleaning for Wikipedia lookup ───────────────────────────────────────
// Strips common legal suffixes that confuse the Wikipedia search API
function wikiName(name) {
  return name
    .replace(/\bEv\.?\b/gi, '')
    .replace(/\bA\/s\b/gi, '')
    .replace(/\bLtd\.?\b/gi, '')
    .replace(/\bInc\.?\b/gi, '')
    .replace(/\bLLC\.?\b/gi, '')
    .replace(/\bPLC\.?\b/gi, '')
    .replace(/\bS\.?p\.?A\.?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── Image sources ─────────────────────────────────────────────────────────────

/**
 * Wikipedia REST API — returns the page's lead image.
 * For football clubs this is almost always the club badge/crest.
 * https://www.mediawiki.org/wiki/API:REST_API/Reference#Get_page_summary
 */
async function tryWikipedia(name) {
  const cleaned = wikiName(name)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleaned)}`
  try {
    const res = await fetchWithTimeout(url, { headers: WIKI_HEADERS })
    if (!res.ok) return null
    const json = await res.json()
    if (json.type === 'disambiguation') return null
    if (!json.thumbnail?.source) return null

    const imgRes = await fetchWithTimeout(json.thumbnail.source, {
      headers: { 'User-Agent': WIKI_HEADERS['User-Agent'] },
    })
    if (!imgRes.ok) return null

    const buf = Buffer.from(await imgRes.arrayBuffer())
    if (buf.byteLength < MIN_IMAGE_BYTES) return null

    const ct = imgRes.headers.get('content-type') ?? 'image/jpeg'
    return { buffer: buf, contentType: ct, source: 'wikipedia' }
  } catch { return null }
}

/**
 * Google Favicon CDN — free, no API key, covers any indexed domain.
 * Returns up to 128×128 px. If the image is < MIN_IMAGE_BYTES it's a
 * generic fallback icon (e.g. globe), which we discard.
 */
async function tryGoogleFavicon(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength < MIN_IMAGE_BYTES) return null
    const ct = res.headers.get('content-type') ?? 'image/png'
    return { buffer: buf, contentType: ct, source: 'google-favicon' }
  } catch { return null }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function ensureBucket() {
  const getRes = await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  })
  if (getRes.ok) {
    console.log(`✓  Bucket "${BUCKET}" exists`)
    return
  }
  const createRes = await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 524288, // 512 KB per image
      allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    }),
  })
  if (!createRes.ok) {
    const t = await createRes.text()
    throw new Error(`Failed to create bucket "${BUCKET}": ${t}`)
  }
  console.log(`✓  Created bucket "${BUCKET}"`)
}

async function uploadToStorage(orgId, image) {
  const ext = image.contentType.includes('png')  ? 'png'
            : image.contentType.includes('gif')  ? 'gif'
            : image.contentType.includes('webp') ? 'webp'
            : 'jpg'
  const path = `${orgId}.${ext}`
  const res = await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': image.contentType,
      'x-upsert': 'true',
    },
    body: image.buffer,
  })
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`)
  return `${BUCKET_PUBLIC_BASE}/${path}`
}

async function updateLogoUrl(orgId, logoUrl) {
  const res = await fetchWithTimeout(
    `${SUPABASE_URL}/rest/v1/organisations?id=eq.${orgId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ logo_url: logoUrl }),
    }
  )
  if (!res.ok) throw new Error(`DB update failed (${res.status}): ${await res.text()}`)
}

async function fetchOrgs() {
  // If --force: fetch all orgs with a domain
  // Default:    only orgs where logo_url is still null
  const filter = FORCE ? '' : '&logo_url=is.null'
  const res = await fetchWithTimeout(
    `${SUPABASE_URL}/rest/v1/organisations?select=id,name,domain&domain=not.is.null${filter}&order=name&limit=10000`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    }
  )
  if (!res.ok) throw new Error(`Failed to fetch orgs: ${await res.text()}`)
  return res.json()
}

// ── Main ──────────────────────────────────────────────────────────────────────
const done = loadCheckpoint()
let stored = 0, noImage = 0, skipped = 0, errors = 0

console.log(`\n🔷 footy-contacts logo backfill${DRY_RUN ? '  [DRY RUN — no writes]' : ''}`)
console.log(`   Supabase : ${SUPABASE_URL}`)
console.log(`   Mode     : ${FORCE ? 'overwrite all' : 'fill missing only (use --force to overwrite)'}`)
console.log()

await ensureBucket()

const orgs = await fetchOrgs()
console.log(`Processing ${orgs.length} organisations...\n`)

for (let i = 0; i < orgs.length; i++) {
  const org = orgs[i]
  const prefix = `[${String(i + 1).padStart(orgs.length.toString().length)}/${orgs.length}]`
  const label  = org.name.slice(0, 38).padEnd(38)

  if (done.has(org.id)) {
    skipped++
    continue
  }

  process.stdout.write(`${prefix} ${label} `)

  // 1. Wikipedia (best for clubs — actual crests)
  let image = await tryWikipedia(org.name)
  await sleep(DELAY_MS)

  // 2. Google Favicon fallback
  if (!image) {
    image = await tryGoogleFavicon(org.domain)
  }

  if (!image) {
    process.stdout.write(`— no usable image\n`)
    done.add(org.id)
    saveCheckpoint(done)
    noImage++
    continue
  }

  const kb = Math.round(image.buffer.byteLength / 1024)

  if (DRY_RUN) {
    process.stdout.write(`✓ [dry] ${image.source} ${kb}KB\n`)
    stored++
    done.add(org.id)
    continue
  }

  try {
    const logoUrl = await uploadToStorage(org.id, image)
    await updateLogoUrl(org.id, logoUrl)
    process.stdout.write(`✓ ${image.source.padEnd(14)} ${kb}KB\n`)
    stored++
  } catch (err) {
    process.stdout.write(`✗ ${err.message.slice(0, 60)}\n`)
    errors++
  }

  done.add(org.id)
  saveCheckpoint(done)
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stored    : ${stored}
  No image  : ${noImage}
  Errors    : ${errors}
  Skipped   : ${skipped} (already done)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

if (noImage > 0) {
  console.log(`\nTip: orgs with no image have no Wikipedia page AND their domain returned`)
  console.log(`     a generic icon (< 2 KB). You can manually set logo_url for these in`)
  console.log(`     the admin panel, or upload images directly to Supabase Storage.`)
}
