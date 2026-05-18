/**
 * Migrates WordPress blog posts to Sanity.
 *
 * Setup:
 *   Set environment variables before running:
 *     $env:SANITY_PROJECT_ID  = "your_project_id"   (from sanity.io/manage)
 *     $env:SANITY_DATASET     = "production"          (or "development")
 *     $env:SANITY_TOKEN       = "your_write_token"   (Settings > API > Tokens, Editor role)
 *     $env:WP_BASE_URL        = "https://wordpress-1462830-5513879.cloudwaysapps.com"
 *
 * Run:    node scripts/migrate-wordpress.mjs
 *
 * Safe to re-run — uses _id based on WP post ID so it will overwrite (createOrReplace).
 */

import { load } from 'cheerio'
import { createReadStream } from 'fs'

// ── Config ────────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET    = process.env.SANITY_DATASET ?? 'production'
const TOKEN      = process.env.SANITY_TOKEN
const WP_BASE    = (process.env.WP_BASE_URL ?? 'https://wordpress-1462830-5513879.cloudwaysapps.com').replace(/\/$/, '')
const API_VER    = '2024-01-01'

if (!PROJECT_ID) { console.error('ERROR: Set $env:SANITY_PROJECT_ID'); process.exit(1) }
if (!TOKEN)      { console.error('ERROR: Set $env:SANITY_TOKEN (needs write access)'); process.exit(1) }

// ── WordPress REST API fetch ──────────────────────────────────────────────────

async function fetchWpPosts() {
  const url = `${WP_BASE}/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,title,content,excerpt,date,modified,featured_media,categories`
  console.log(`Fetching WP posts from ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WP API error: ${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchWpMedia(mediaId) {
  if (!mediaId) return null
  const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media/${mediaId}`)
  if (!res.ok) return null
  return res.json()
}

// ── HTML → Portable Text ──────────────────────────────────────────────────────

/**
 * Converts an HTML string to a Sanity Portable Text array.
 * Handles: p, h1-h6, ul/ol/li, strong, em, a, blockquote, br.
 */
function htmlToPortableText(html) {
  const $ = load(`<div id="root">${html}</div>`)
  const blocks = []

  function parseInlineMarks(el, $) {
    const spans = []
    $(el).contents().each((_, node) => {
      if (node.type === 'text') {
        const text = node.data
        if (text) spans.push({ _type: 'span', _key: uid(), text, marks: [] })
      } else if (node.type === 'tag') {
        const tag = node.name.toLowerCase()
        const childSpans = parseInlineMarks(node, $)
        const mark = tag === 'strong' || tag === 'b' ? 'strong'
                   : tag === 'em'    || tag === 'i' ? 'em'
                   : tag === 'u' ? 'underline'
                   : tag === 'a' ? $(node).attr('href') : null
        childSpans.forEach(s => {
          if (mark) s.marks = [...(s.marks || []), mark]
        })
        spans.push(...childSpans)
      }
    })
    return spans
  }

  function makeBlock(style, $el) {
    const children = parseInlineMarks($el[0], $)
    if (!children.length) return null
    return {
      _type: 'block',
      _key: uid(),
      style,
      markDefs: [],
      children: children.length ? children : [{ _type: 'span', _key: uid(), text: '', marks: [] }],
    }
  }

  $('#root').children().each((_, el) => {
    const tag = el.name?.toLowerCase()
    const $el = $(el)

    if (!tag) return

    if (tag === 'p' || tag === 'div') {
      const block = makeBlock('normal', $el)
      if (block) blocks.push(block)
    } else if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10)
      const style = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
      const block = makeBlock(style, $el)
      if (block) blocks.push(block)
    } else if (tag === 'blockquote') {
      const block = makeBlock('blockquote', $el)
      if (block) blocks.push(block)
    } else if (tag === 'ul' || tag === 'ol') {
      $el.find('li').each((_, li) => {
        const children = parseInlineMarks(li, $)
        if (!children.length) return
        blocks.push({
          _type: 'block',
          _key: uid(),
          style: 'normal',
          listItem: tag === 'ol' ? 'number' : 'bullet',
          level: 1,
          markDefs: [],
          children,
        })
      })
    } else if (tag === 'br') {
      // skip standalone br
    } else if (tag === 'figure') {
      // skip images (no binary upload in this script — add manually in Studio)
    }
  })

  return blocks
}

// ── Sanity Mutations API ──────────────────────────────────────────────────────

async function sanityMutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/data/mutate/${DATASET}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Sanity error: ${JSON.stringify(json)}`)
  return json
}

// ── Slug helpers ──────────────────────────────────────────────────────────────

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

let _counter = 0
function uid() {
  return `key-${(++_counter).toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const wpPosts = await fetchWpPosts()
  console.log(`Found ${wpPosts.length} WP posts\n`)

  for (const wp of wpPosts) {
    const title      = decodeHtmlEntities(wp.title?.rendered ?? '')
    const slug       = wp.slug
    const body       = htmlToPortableText(wp.content?.rendered ?? '')
    const rawExcerpt = wp.excerpt?.rendered ?? ''
    const excerpt    = decodeHtmlEntities(
      rawExcerpt.replace(/<[^>]+>/g, '').trim()
    ).slice(0, 295)
    const publishedAt = wp.date   // ISO string
    const sanityId    = `wp-post-${wp.id}`

    // Fetch featured image if present
    let mainImage = undefined
    if (wp.featured_media) {
      const media = await fetchWpMedia(wp.featured_media)
      if (media?.source_url) {
        // Images must be uploaded separately — store source URL as a note for now
        console.log(`  ⚠  Post "${title}" has a featured image: ${media.source_url}`)
        console.log(`     Upload it manually in Sanity Studio or extend this script.`)
      }
    }

    const doc = {
      _id:         sanityId,
      _type:       'post',
      title,
      slug:        { _type: 'slug', current: slug },
      publishedAt,
      excerpt:     excerpt || title,
      body,
    }

    console.log(`Importing: "${title}" (${slug})`)

    await sanityMutate([{ createOrReplace: doc }])
    console.log(`  ✓ Done (Sanity ID: ${sanityId})\n`)
  }

  console.log('Migration complete!')
  console.log('Next steps:')
  console.log('  1. Open Sanity Studio and review each post.')
  console.log('  2. Upload any featured images noted above.')
  console.log('  3. Add SEO title/description fields as needed.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
