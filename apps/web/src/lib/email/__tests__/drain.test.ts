import { describe, it, expect, vi, beforeEach } from "vitest"
import { drainEmailQueue } from "../drain"

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock("../sender", () => ({
  sendClaimedEmailJob: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRpcMock(rpcResults: Record<string, { data: unknown; error: unknown }>) {
  return vi.fn((rpcName: string) => {
    const result = rpcResults[rpcName] ?? { data: null, error: null }
    return Promise.resolve(result)
  })
}

function makeFromMock(response: { data: unknown; error: unknown; count?: number | null }) {
  const builder: Record<string, unknown> = {}
  for (const m of ["select", "eq", "in"]) {
    builder[m] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(response).then(resolve, reject)
  return builder as Record<string, ReturnType<typeof vi.fn>> & {
    then: (r: (v: unknown) => void, j?: (e: unknown) => void) => Promise<unknown>
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("drainEmailQueue — stuck job recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls requeue_stuck_email_jobs with lock_minutes = 5", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")

    const rpc  = makeRpcMock({
      requeue_stuck_email_jobs: { data: 3, error: null },
      claim_email_jobs:         { data: [],  error: null },
    })
    const from = makeFromMock({ data: null, error: null, count: 0 })

    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
      from: vi.fn(() => from),
    } as unknown as ReturnType<typeof createAdminClient>)

    const result = await drainEmailQueue()

    expect(rpc).toHaveBeenCalledWith("requeue_stuck_email_jobs", { lock_minutes: 5 })
    expect(result.requeued).toBe(3)
  })

  it("calls claim_email_jobs with batch_size = 25", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")

    const rpc  = makeRpcMock({
      requeue_stuck_email_jobs: { data: 0,  error: null },
      claim_email_jobs:         { data: [], error: null },
    })
    const from = makeFromMock({ data: null, error: null, count: 0 })

    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
      from: vi.fn(() => from),
    } as unknown as ReturnType<typeof createAdminClient>)

    await drainEmailQueue()

    expect(rpc).toHaveBeenCalledWith("claim_email_jobs", { batch_size: 25 })
  })
})

describe("drainEmailQueue — counts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns correct sent/failed counts based on sendClaimedEmailJob outcomes", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const { sendClaimedEmailJob } = await import("../sender")

    const fakeJobs = [
      { id: "job-1", template_id: "welcome" },
      { id: "job-2", template_id: "welcome" },
      { id: "job-3", template_id: "welcome" },
    ]

    let callN = 0
    vi.mocked(sendClaimedEmailJob).mockImplementation(async () => {
      callN++
      if (callN === 2) throw new Error("send failed")
    })

    const rpc  = makeRpcMock({
      requeue_stuck_email_jobs: { data: 0,       error: null },
      claim_email_jobs:         { data: fakeJobs, error: null },
    })
    const from = makeFromMock({ data: null, error: null, count: 0 })

    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
      from: vi.fn(() => from),
    } as unknown as ReturnType<typeof createAdminClient>)

    const result = await drainEmailQueue()

    expect(result.claimed).toBe(3)
    expect(result.sent).toBe(2)
    expect(result.failed).toBe(1)
  })

  it("returns 0 counts and logs to Sentry when claim_email_jobs errors", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const Sentry                = await import("@sentry/nextjs")

    const rpc  = makeRpcMock({
      requeue_stuck_email_jobs: { data: 0,    error: null },
      claim_email_jobs:         { data: null, error: { message: "RPC failed" } },
    })
    const from = makeFromMock({ data: null, error: null, count: 0 })

    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
      from: vi.fn(() => from),
    } as unknown as ReturnType<typeof createAdminClient>)

    const result = await drainEmailQueue()

    expect(result.claimed).toBe(0)
    expect(result.sent).toBe(0)
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})
