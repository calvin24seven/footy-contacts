"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  reoon_task_id: string
  task_name: string | null
  status: string
  count_submitted: number | null
  count_processing: number | null
  progress_percentage: number | null
  results_applied: boolean | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface Stats {
  unverified: number
  verified: number
  total: number
}

interface ApplyResult {
  success: boolean
  verifiedCount: number
  unverifiedCount: number
  clearedCount: number
  totalProcessed: number
}

export default function EmailVerifyClient({
  stats,
  initialTasks,
}: {
  stats: Stats
  initialTasks: Task[]
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [starting, setStarting] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [applyResult, setApplyResult] = useState<(ApplyResult & { taskId: string }) | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Poll active tasks every 8 seconds
  const pollActiveTasks = useCallback(async () => {
    const active = tasks.filter((t) => t.status === "waiting" || t.status === "running")
    if (active.length === 0) return

    const updated = await Promise.all(
      active.map(async (t) => {
        try {
          const res = await fetch(`/api/admin/email-verify/status?id=${t.id}`)
          if (res.ok) return (await res.json()) as Task
        } catch { /* swallow */ }
        return t
      })
    )

    setTasks((prev) =>
      prev.map((t) => {
        const u = updated.find((u) => u && u.id === t.id)
        return u ?? t
      })
    )
  }, [tasks])

  useEffect(() => {
    const hasActive = tasks.some((t) => t.status === "waiting" || t.status === "running")
    if (!hasActive) return
    const interval = setInterval(pollActiveTasks, 8000)
    return () => clearInterval(interval)
  }, [tasks, pollActiveTasks])

  async function startVerification(scope: "unverified" | "all") {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/email-verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to start verification")
        return
      }
      // Immediately show the new task — don't wait on router.refresh() which can abort
      setTasks((prev) => [
        {
          id: data.taskId,
          reoon_task_id: String(data.reoonTaskId),
          task_name: null,
          status: data.status ?? "waiting",
          count_submitted: data.countSubmitted,
          count_processing: null,
          progress_percentage: null,
          results_applied: false,
          created_at: new Date().toISOString(),
          completed_at: null,
          error_message: null,
        },
        ...prev,
      ])
      // Best-effort background refresh for eventual consistency
      router.refresh()
    } catch {
      setError("Network error starting verification")
    } finally {
      setStarting(false)
    }
  }

  async function applyResults(taskId: string) {
    setApplying(taskId)
    setError(null)
    setApplyResult(null)
    try {
      const res = await fetch("/api/admin/email-verify/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to apply results")
        return
      }
      setApplyResult({ ...data, taskId })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, results_applied: true } : t))
      )
    } catch {
      setError("Network error applying results")
    } finally {
      setApplying(null)
    }
  }

  const hasActiveTask = tasks.some((t) => t.status === "waiting" || t.status === "running")

  return (
    <div className="space-y-6">
      {/* Start verification */}
      <div className="bg-navy-light rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">Run Bulk Verification</h2>
        <p className="text-gray-400 text-sm mb-5">
          Sends contact emails to Reoon for bulk validation. Results can be applied once the
          task completes to update verified status.
        </p>
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => startVerification("unverified")}
            disabled={starting || hasActiveTask}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? "Starting…" : `Verify unverified (${stats.unverified.toLocaleString()} emails)`}
          </button>
          <button
            onClick={() => startVerification("all")}
            disabled={starting || hasActiveTask}
            className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Re-verify all ({stats.total.toLocaleString()} emails)
          </button>
        </div>
        {hasActiveTask && (
          <p className="text-yellow-400 text-xs mt-3">
            A verification task is already running. Wait for it to complete before starting another.
          </p>
        )}
      </div>

      {/* Apply result banner */}
      {applyResult && (
        <div className="bg-green-900/30 border border-green-800 text-green-300 rounded-xl p-4 text-sm">
          <strong>Results applied!</strong> {applyResult.verifiedCount} verified,{" "}
          {applyResult.unverifiedCount} unverified, {applyResult.clearedCount} invalid emails
          cleared. Total contacts updated: {applyResult.totalProcessed}.
        </div>
      )}

      {/* Task history */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3">Task History</h2>
        {tasks.length === 0 ? (
          <div className="bg-navy-light rounded-xl p-8 text-center text-gray-500">
            No verification tasks yet
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isActive = task.status === "waiting" || task.status === "running"
              const progress = task.progress_percentage ?? 0
              return (
                <div
                  key={task.id}
                  className="bg-navy-light rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm truncate">
                          {task.task_name ?? `Task ${task.reoon_task_id}`}
                        </span>
                        <StatusBadge status={task.status} />
                        {task.results_applied && (
                          <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                            Applied
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {task.count_submitted?.toLocaleString() ?? "?"} emails submitted ·{" "}
                        {new Date(task.created_at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {isActive && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-2 bg-navy-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {task.error_message && (
                        <p className="text-red-400 text-xs mt-2">{task.error_message}</p>
                      )}
                    </div>

                    {task.status === "completed" && !task.results_applied && (
                      <button
                        onClick={() => applyResults(task.id)}
                        disabled={applying === task.id}
                        className="btn-primary text-xs shrink-0 disabled:opacity-50"
                      >
                        {applying === task.id ? "Applying…" : "Apply Results"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    waiting: "bg-gray-700 text-gray-300",
    running: "bg-yellow-900/40 text-yellow-400",
    completed: "bg-green-900/40 text-green-400",
    failed: "bg-red-900/40 text-red-400",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[status] ?? "bg-gray-700 text-gray-300"}`}>
      {status}
    </span>
  )
}
