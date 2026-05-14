import { describe, it, expect, vi, beforeEach } from "vitest"
import { sendClaimedEmailJob, type ClaimedEmailJob } from "../sender"

// ── Mock all external dependencies ───────────────────────────────────────────

vi.mock("@sentry/nextjs", () => ({
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>test</html>"),
}))

vi.mock("../unsubscribe", () => ({
  createUnsubscribeToken: vi.fn().mockReturnValue("mock-token"),
}))

vi.mock("../client", () => ({
  getResendClient: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Makes a chainable Supabase query builder whose terminal call resolves to `response`. */
function makeQueryBuilder(response: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, unknown> = {}
  for (const m of ["select", "eq", "in", "update", "upsert", "insert", "maybeSingle"]) {
    builder[m] = vi.fn(() => builder)
  }
  // Make the builder awaitable (for queries that await the chain directly)
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(response).then(resolve, reject)
  return builder as Record<string, ReturnType<typeof vi.fn>> & {
    then: (r: (v: unknown) => void, j?: (e: unknown) => void) => Promise<unknown>
  }
}

const BASE_JOB: ClaimedEmailJob = {
  id:              "job-1",
  idempotency_key: "welcome:user-1",
  to_email:        "test@example.com",
  to_name:         null,
  reply_to:        null,
  template_id:     "welcome",
  template_props:  { firstName: "Alice" },
  category:        "transactional",
  attempt_count:   1,
  max_attempts:    5,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("sendClaimedEmailJob — suppression", () => {
  it("cancels the job and does not call Resend when the address is suppressed", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { getResendClient }   = await import("../client")

    const suppressionBuilder = makeQueryBuilder({
      data:  [{ reason: "bounce", category: "all" }],
      error: null,
    })
    const jobsBuilder = makeQueryBuilder({ data: null, error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "email_suppressions") return suppressionBuilder
        if (table === "email_jobs")         return jobsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    const mockSend = vi.fn()
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient>)

    await sendClaimedEmailJob(BASE_JOB)

    // Resend must NOT have been called
    expect(mockSend).not.toHaveBeenCalled()

    // Job must have been updated to 'cancelled'
    expect(jobsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" })
    )
  })
})

describe("sendClaimedEmailJob — DB update failure after successful send", () => {
  it("calls handleSendFailure and re-throws when the post-send DB update errors", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { getResendClient }   = await import("../client")
    const Sentry                = await import("@sentry/nextjs")

    // No suppressions
    const suppressionBuilder = makeQueryBuilder({ data: [], error: null })

    // First email_jobs.update (the success path) returns an error
    const dbUpdateError = { message: "DB update failed", code: "500" }
    const jobsBuilder   = makeQueryBuilder({ data: null, error: dbUpdateError })

    // Second call to createAdminClient (from handleSendFailure) needs its own builder
    let callCount = 0
    vi.mocked(createAdminClient).mockImplementation(() => {
      callCount++
      // Both the main sendClaimedEmailJob and handleSendFailure share the same mock
      return {
        from: vi.fn((table: string) => {
          if (table === "email_suppressions") return suppressionBuilder
          if (table === "email_jobs")         return jobsBuilder
          throw new Error(`Unexpected table: ${table}`)
        }),
      } as unknown as ReturnType<typeof createAdminClient>
    })

    // Resend succeeds
    vi.mocked(getResendClient).mockReturnValue({
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: "resend-msg-1" }, error: null }),
      },
    } as unknown as ReturnType<typeof getResendClient>)

    await expect(sendClaimedEmailJob(BASE_JOB)).rejects.toBeDefined()

    // Sentry should have captured the exception
    expect(Sentry.captureException).toHaveBeenCalled()

    // The retry/failure update must have been attempted (jobsBuilder.update called at least twice:
    // once for the success update that failed, and once by handleSendFailure)
    expect(jobsBuilder.update).toHaveBeenCalledTimes(2)

    // The second update (from handleSendFailure) uses 'pending' or 'failed' status
    const secondUpdateArgs = vi.mocked(jobsBuilder.update).mock.calls[1][0] as Record<
      string,
      unknown
    >
    expect(["pending", "failed"]).toContain(secondUpdateArgs.status)
  })
})

describe("sendClaimedEmailJob — happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("marks job as 'sent' with resend_message_id on success", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { getResendClient }   = await import("../client")

    const suppressionBuilder = makeQueryBuilder({ data: [], error: null })
    const jobsBuilder        = makeQueryBuilder({ data: null, error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "email_suppressions") return suppressionBuilder
        if (table === "email_jobs")         return jobsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as ReturnType<typeof createAdminClient>)

    vi.mocked(getResendClient).mockReturnValue({
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: "resend-msg-42" }, error: null }),
      },
    } as unknown as ReturnType<typeof getResendClient>)

    await sendClaimedEmailJob(BASE_JOB)

    expect(jobsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent", resend_message_id: "resend-msg-42" })
    )
  })
})
