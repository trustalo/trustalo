/**
 * Global chat-assistant provider.
 *
 * Mounted once per dashboard layout. Owns:
 *   • Drawer open/close state (so the floating button and any other
 *     "open chat" affordance share the same state).
 *   • Current page context (pathname + derived recordKind/recordId).
 *     Updated automatically on every Next.js route change so chat turns
 *     always carry the latest "where the user was" signal.
 *   • The org-wide pending-proposals SSE subscription. Kept always-on
 *     while the dashboard is mounted so the FAB badge reflects new
 *     suggestions even when the drawer is closed. One connection per
 *     browser tab — cheap.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { apiClient, type ChatPageContext, type TenantContextProposal } from "@/lib/api-client";
import { derivePageContext } from "./page-context";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  pageContext: ChatPageContext;
  proposals: TenantContextProposal[];
  /** Replace the local proposals list (used after accept/reject). */
  setProposals: (
    updater: TenantContextProposal[] | ((prev: TenantContextProposal[]) => TenantContextProposal[]),
  ) => void;
  proposalsError: string | null;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const [proposals, setProposalsState] = useState<TenantContextProposal[]>([]);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  const pageContext = useMemo<ChatPageContext>(() => {
    const docTitle = typeof document !== "undefined" && document.title ? document.title : null;
    return derivePageContext(pathname, docTitle ?? undefined);
  }, [pathname]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const setProposals = useCallback<ChatContextValue["setProposals"]>((updater) => {
    if (typeof updater === "function") {
      setProposalsState((prev) => updater(prev));
    } else {
      setProposalsState(updater);
    }
  }, []);

  // Always-on proposals stream: one SSE connection per browser tab.
  // Re-subscribes if the connection drops; we don't bother with
  // exponential backoff here because the server poll cadence is
  // already a soft heartbeat (3s).
  useEffect(() => {
    if (!apiClient.isAuthenticated()) return;
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        try {
          for await (const event of apiClient.streamChatProposals(controller.signal)) {
            if (cancelled) break;
            if (event.type === "proposals") {
              setProposalsState(event.proposals);
              setProposalsError(null);
            } else if (event.type === "error") {
              setProposalsError(event.error);
            }
          }
        } catch (err) {
          if (cancelled) break;
          setProposalsError(
            err instanceof Error ? err.message : "Lost connection to suggestions stream",
          );
        }
        if (cancelled) break;
        // Brief pause before reconnecting after a stream end / error.
        await new Promise((r) => setTimeout(r, 5_000));
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K toggles the chat drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo<ChatContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      pageContext,
      proposals,
      setProposals,
      proposalsError,
    }),
    [isOpen, open, close, toggle, pageContext, proposals, setProposals, proposalsError],
  );

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}
