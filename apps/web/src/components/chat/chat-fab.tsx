/**
 * Floating chat-assistant button.
 *
 * Fixed bottom-right of the dashboard layout. Two visual states:
 *   • Closed → speech-bubble icon. Optional pending-suggestions badge
 *     (count of TenantContextProposal rows in `pending` state).
 *   • Open   → "X" icon, same position, same color.
 *
 * The button is hidden until the user is authenticated to avoid a
 * flash on the login screen — `useChat()` is only mounted under the
 * dashboard layout but be defensive anyway.
 */

"use client";

import { useChat } from "./chat-provider";

export function ChatFab() {
  const { isOpen, toggle, proposals } = useChat();
  const pendingCount = proposals.length;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Close compliance assistant" : "Open compliance assistant"}
      title={isOpen ? "Close (⌘K)" : "Compliance assistant (⌘K)"}
      className="fixed bottom-6 right-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
    >
      {isOpen ? (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      {!isOpen && pendingCount > 0 && (
        <span
          className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white shadow ring-2 ring-white dark:ring-neutral-900"
          aria-label={`${pendingCount} pending suggestion${pendingCount === 1 ? "" : "s"}`}
        >
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      )}
    </button>
  );
}
