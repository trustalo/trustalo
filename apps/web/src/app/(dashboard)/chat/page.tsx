/**
 * /chat — legacy route kept for bookmarks.
 *
 * The compliance assistant is now a global drawer reachable from any
 * dashboard page (floating button bottom-right, or ⌘K). This page is
 * a thin shim that auto-opens the drawer on mount and explains the
 * change so users with bookmarks aren't left wondering where the UI
 * went. Safe to delete a release or two from now once analytics show
 * no traffic.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useChat } from "@/components/chat/chat-provider";

export default function LegacyChatRedirectPage() {
  const { open } = useChat();

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">
          The compliance assistant moved
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          You can now open the assistant from <strong>any</strong> page using the floating chat
          button in the bottom-right corner — or just press{" "}
          <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 text-xs dark:border-neutral-700 dark:bg-neutral-800">
            ⌘K
          </kbd>{" "}
          /{" "}
          <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 text-xs dark:border-neutral-700 dark:bg-neutral-800">
            Ctrl K
          </kbd>
          . The drawer should already be open on the right.
        </p>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Pending suggestions and your AI context still live under{" "}
          <Link className="underline" href="/settings/ai-context">
            Settings → AI context
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
