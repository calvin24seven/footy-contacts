/**
 * Tests for POST /api/webhooks/resend
 *
 * Covers:
 *  - Duplicate event (same svix-id) → { received: true, duplicate: true }
 *  - Out-of-order delivery: email.delivered guard uses only non-terminal statuses
 *  - email.bounced guard uses correct predecessor statuses
 *  - Bounce auto-inserts a suppression row
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock next/server before importing the route ───────────────────────────────
vi.mock("next/server", () => ({
  NextRequest:  class extends Request {},
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      _data:  data,
      status: init?.status ?? 200,
      json:   () => Promise.resolve(data),
    }),
  },
}))

vi.mock("svix", () => ({
  Webhook: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verify(_body: string, _headers: Record<string, string>): unknown {
      // Overridden per-test via vi.spyOn
      throw new Error("Webhook.verify not configured for this test")
    }
  },
}))

vi.mock("@/lib/secrets", () => ({
  getSecret: vi.fn().mockReturnValue("test-resend-webhook-secret"),
}))

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage:   vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryBuilder(response: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  for (const m of ["select", "eq", "in", "update", "upsert", "maybeSingle"]) {
    builder[m] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(response).then(resolve, reject)
  return builder as Record<string, ReturnType<typeof vi.fn>> & {
    then: (r: (v: unknown) => void, j?: (e: unknown) => void) => Promise<unknown>
  }
}

function makeRequest(svixId: string, body: unknown) {
  return new Request("https://example.com/api/webhooks/resend", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers: {
      "svix-id":        svixId,
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,test",
      "content-type":   "application/json",
    },
  })
}

const EVENT_DELIVERED = {
  type:       "email.delivered",
  created_at: "2026-05-14T12:00:00Z",
  data:       { email_id: "msg-abc123", to: ["recipient@example.com"] },
}

const EVENT_BOUNCED = {
  type:       "email.bounced",
  created_at: "2026-05-14T12:00:00Z",
  data:       { email_id: "msg-abc123", to: ["recipient@example.com"] },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/resend — duplicate events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns { received: true, duplicate: true } when the same svix-id is replayed", async () => {
    const { Webhook }          = await import("svix")
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { POST }              = await import("../../../app/api/webhooks/resend/route")

    // Webhook verification passes
    vi.spyOn(Webhook.prototype, "verify").mockReturnValue(EVENT_DELIVERED)

    // email_events upsert with ignoreDuplicates returns null (already stored)
    const eventsBuilder = makeQueryBuilder({ data: null, error: null })
    // Make maybeSingle() resolve to null (duplicate)
    vi.mocked(eventsBuilder.maybeSingle).mockResolvedValue({ data: null, error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => eventsBuilder),
    } as unknown as ReturnType<typeof createAdminClient>)

    const req = makeRequest("svix-msg-duplicate-1", EVENT_DELIVERED)
    const res = await POST(req as unknown as import("next/server").NextRequest)

    expect((res as { _data: Record<string, unknown> })._data).toMatchObject({
      received:  true,
      duplicate: true,
    })
  })
})

describe("POST /api/webhooks/resend — webhook ordering (guarded transitions)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uses only ['sent', 'delivery_delayed'] as allowed prior statuses for email.delivered", async () => {
    const { Webhook }           = await import("svix")
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { POST }              = await import("../../../app/api/webhooks/resend/route")

    vi.spyOn(Webhook.prototype, "verify").mockReturnValue(EVENT_DELIVERED)

    // email_events upsert returns a stored row (not duplicate)
    const eventStored = { id: "ev-1" }
    const eventsUpsertBuilder = makeQueryBuilder({ data: eventStored, error: null })
    vi.mocked(eventsUpsertBuilder.maybeSingle).mockResolvedValue({
      data:  eventStored,
      error: null,
    })

    // email_jobs select for linking
    const jobLinkBuilder = makeQueryBuilder({ data: null, error: null })
    vi.mocked(jobLinkBuilder.maybeSingle).mockResolvedValue({ data: null, error: null })

    // email_jobs update (the guarded status transition)
    const jobUpdateBuilder = makeQueryBuilder({ data: null, error: null })

    let fromCallIndex = 0
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "email_events") {
          fromCallIndex++
          // First call: upsert (store event)
          // Second call: update (link job_id to event)
          return fromCallIndex === 1 ? eventsUpsertBuilder : eventsUpsertBuilder
        }
        if (table === "email_jobs") {
          // First call: select for linking; second call: update (guarded transition)
          return fromCallIndex <= 2 ? jobLinkBuilder : jobUpdateBuilder
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const req = makeRequest("svix-msg-ordering-1", EVENT_DELIVERED)
    await POST(req as unknown as import("next/server").NextRequest)

    // The update for email.delivered must guard with .in("status", [...])
    // We verify that .in() was called with exactly the non-terminal predecessor statuses
    const inCalls = [
      ...vi.mocked(jobLinkBuilder.in).mock.calls,
      ...vi.mocked(jobUpdateBuilder.in).mock.calls,
    ]
    const statusGuardCall = inCalls.find(
      ([col]) => col === "status"
    )
    expect(statusGuardCall).toBeDefined()
    // Must NOT include terminal states like 'bounced', 'complained', 'failed', 'cancelled'
    const allowedStatuses = statusGuardCall?.[1] as string[]
    expect(allowedStatuses).toContain("sent")
    expect(allowedStatuses).toContain("delivery_delayed")
    expect(allowedStatuses).not.toContain("bounced")
    expect(allowedStatuses).not.toContain("complained")
    expect(allowedStatuses).not.toContain("failed")
  })

  it("uses ['sent', 'delivered', 'delivery_delayed'] as guard statuses for email.bounced", async () => {
    const { Webhook }           = await import("svix")
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { POST }              = await import("../../../app/api/webhooks/resend/route")

    vi.spyOn(Webhook.prototype, "verify").mockReturnValue(EVENT_BOUNCED)

    const eventStored = { id: "ev-2" }
    const eventsBuilder = makeQueryBuilder({ data: eventStored, error: null })
    vi.mocked(eventsBuilder.maybeSingle).mockResolvedValue({
      data:  eventStored,
      error: null,
    })

    const jobBuilder = makeQueryBuilder({ data: null, error: null })
    vi.mocked(jobBuilder.maybeSingle).mockResolvedValue({ data: null, error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "email_events")       return eventsBuilder
        if (table === "email_jobs")         return jobBuilder
        if (table === "email_suppressions") return makeQueryBuilder({ data: null, error: null })
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const req = makeRequest("svix-msg-bounce-1", EVENT_BOUNCED)
    await POST(req as unknown as import("next/server").NextRequest)

    const inCalls = vi.mocked(jobBuilder.in).mock.calls
    const statusGuardCall = inCalls.find(([col]) => col === "status")
    expect(statusGuardCall).toBeDefined()

    const allowedStatuses = statusGuardCall?.[1] as string[]
    expect(allowedStatuses).toContain("sent")
    expect(allowedStatuses).toContain("delivered")
    expect(allowedStatuses).toContain("delivery_delayed")
    // Must NOT contain terminal states
    expect(allowedStatuses).not.toContain("bounced")
    expect(allowedStatuses).not.toContain("failed")
    expect(allowedStatuses).not.toContain("cancelled")
  })
})

describe("POST /api/webhooks/resend — suppression on bounce", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("upserts a suppression row with reason=bounce, category=all on email.bounced", async () => {
    const { Webhook }           = await import("svix")
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { POST }              = await import("../../../app/api/webhooks/resend/route")

    vi.spyOn(Webhook.prototype, "verify").mockReturnValue(EVENT_BOUNCED)

    const eventStored = { id: "ev-3" }
    const eventsBuilder = makeQueryBuilder({ data: eventStored, error: null })
    vi.mocked(eventsBuilder.maybeSingle).mockResolvedValue({
      data:  eventStored,
      error: null,
    })

    const jobBuilder = makeQueryBuilder({ data: null, error: null })
    vi.mocked(jobBuilder.maybeSingle).mockResolvedValue({ data: null, error: null })

    const suppressionsBuilder = makeQueryBuilder({ data: null, error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "email_events")       return eventsBuilder
        if (table === "email_jobs")         return jobBuilder
        if (table === "email_suppressions") return suppressionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const req = makeRequest("svix-msg-bounce-suppress", EVENT_BOUNCED)
    await POST(req as unknown as import("next/server").NextRequest)

    expect(suppressionsBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email:    "recipient@example.com",
        reason:   "bounce",
        category: "all",
      }),
      expect.anything()
    )
  })
})
