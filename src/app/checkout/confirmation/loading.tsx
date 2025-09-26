/**
 * Loading spinner
 *
 * Purpose:
 *   - Shown by Next.js App Router while this route (or its children)
 *     is loading/suspending (e.g., fetching order/PI data).
 *
 * Behavior:
 *   - Displays a simple spinner + status text.
 *   - Purely presentational; no side effects.
 */

export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-3 text-gray-700">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#7a0d0d]" />
        <span>Finalizing your order…</span>
      </div>
    </main>
  );
}