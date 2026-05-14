/**
 * Compliance-assistant drawer.
 *
 * Slides in from the right edge whenever {@link useChat}.isOpen is
 * true. Replaces the old standalone /chat page so the assistant is
 * reachable from any dashboard route. Three internal views, switched
 * via the top tab strip:
 *
 *   • "Chat"        — transcript + composer for the active conversation.
 *                     If no conversation is active, the composer is
 *                     still usable; sending creates a new conversation
 *                     on the fly.
 *   • "Threads"     — list of recent conversations + "+ New chat".
 *                     Default view when the drawer opens AND the user
 *                     has at least one prior thread (so they can
 *                     resume); otherwise jumps straight to "Chat".
 *   • "Suggestions" — pending TenantContextProposal rows. Each
 *                     row has Accept / Reject — proposals are NEVER
 *                     auto-applied. Badge in the tab strip reflects
 *                     the live count from the always-on SSE stream.
 *
 * Page-aware: every send embeds the current ChatPageContext (path +
 * derived recordKind/recordId) so the assistant can interpret "this"
 * correctly.
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type ChatCitation,
  type ChatConversation,
  type ChatMessage,
  type ChatStreamEvent,
  type TenantContextProposal,
} from "@/lib/api-client";
import { useChat } from "./chat-provider";

type DrawerView = "chat" | "threads" | "suggestions";

const CATEGORY_LABEL: Record<string, string> = {
  company: "Company",
  tech_stack: "Tech stack",
  processes: "Processes",
  data_handling: "Data handling",
  risk_appetite: "Risk appetite",
  team: "Team",
};

export function ChatDrawer() {
  const { isOpen, close, pageContext, proposals, setProposals } = useChat();

  const [view, setView] = useState<DrawerView>("chat");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingDelta, setStreamingDelta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalBusy, setProposalBusy] = useState<Record<string, boolean>>({});
  const [hasHydratedConversations, setHasHydratedConversations] = useState(false);

  const transcriptRef = useRef<HTMLDivElement | null>(null);

  // ── Load conversations once on first open ─────────────────────────
  // We load lazily so logged-out / non-chat-user sessions don't fire
  // the request. Pick the default view based on whether the user has
  // any prior threads (the user picked "ask" — show a thread picker
  // instead of silently resuming).
  useEffect(() => {
    if (!isOpen || hasHydratedConversations) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.listChatConversations();
        if (cancelled) return;
        setConversations(res.data);
        setHasHydratedConversations(true);
        setView(res.data.length > 0 ? "threads" : "chat");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chats");
          setHasHydratedConversations(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, hasHydratedConversations]);

  // ── Load messages whenever the active conversation changes ────────
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.listChatMessages(activeId);
        if (!cancelled) setMessages(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load messages");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Auto-scroll transcript on new content.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, streamingDelta, view]);

  // Escape closes the drawer (matches InfoDrawer convention).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // ── Conversation actions ──────────────────────────────────────────
  const newConversation = useCallback(() => {
    // Don't pre-create on the server; the next send will create it.
    setActiveId(null);
    setMessages([]);
    setView("chat");
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setView("chat");
  }, []);

  const archiveConversation = useCallback(
    async (id: string) => {
      try {
        await apiClient.updateChatConversation(id, { archive: true });
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to archive chat");
      }
    },
    [activeId],
  );

  // ── Send a turn (creates conversation lazily) ─────────────────────
  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;

    let conversationId = activeId;
    if (!conversationId) {
      try {
        const res = await apiClient.createChatConversation();
        conversationId = res.data.id;
        setConversations((prev) => [res.data, ...prev]);
        setActiveId(res.data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create chat");
        return;
      }
    }

    setSending(true);
    setStreamingDelta("");
    setError(null);

    const optimisticUserMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      tenantId: "",
      conversationId,
      role: "user",
      content: text,
      modelUsed: null,
      providerSource: null,
      groundingHash: null,
      citations: [],
      proposalIds: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setDraft("");

    try {
      let assembledDelta = "";
      const stream = apiClient.streamChatTurn(conversationId, text, {
        pageContext,
      });
      for await (const event of stream) {
        const e = event as ChatStreamEvent;
        if (e.type === "token") {
          assembledDelta += e.delta;
          setStreamingDelta(assembledDelta);
        } else if (e.type === "complete") {
          setStreamingDelta(null);
          // Refresh from server so optimistic placeholder is replaced
          // with authoritative ids/timestamps.
          const refreshed = await apiClient.listChatMessages(conversationId);
          setMessages(refreshed.data);
        } else if (e.type === "error") {
          setError(e.error);
          setStreamingDelta(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setStreamingDelta(null);
    } finally {
      setSending(false);
    }
  }, [draft, activeId, pageContext]);

  // ── Proposal actions ──────────────────────────────────────────────
  const handleAcceptProposal = useCallback(
    async (proposal: TenantContextProposal) => {
      setProposalBusy((prev) => ({ ...prev, [proposal.id]: true }));
      try {
        await apiClient.acceptOrganizationContextProposal(proposal.id);
        setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept");
      } finally {
        setProposalBusy((prev) => ({ ...prev, [proposal.id]: false }));
      }
    },
    [setProposals],
  );

  const handleRejectProposal = useCallback(
    async (proposalId: string) => {
      setProposalBusy((prev) => ({ ...prev, [proposalId]: true }));
      try {
        await apiClient.rejectOrganizationContextProposal(proposalId);
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setProposalBusy((prev) => ({ ...prev, [proposalId]: false }));
      }
    },
    [setProposals],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Compliance assistant"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
        aria-label="Close assistant"
        onClick={close}
      />

      <div className="relative flex h-full w-full max-w-[440px] flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <DrawerHeader
          title={
            view === "threads"
              ? "Your chats"
              : view === "suggestions"
                ? "Pending suggestions"
                : (activeConversation?.title ?? "Compliance assistant")
          }
          onClose={close}
        />

        <DrawerTabs view={view} onChange={setView} pendingCount={proposals.length} />

        {error && (
          <div className="mx-4 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {view === "chat" && (
          <ChatView
            transcriptRef={transcriptRef}
            messages={messages}
            streamingDelta={streamingDelta}
            draft={draft}
            sending={sending}
            pageContextBadge={<PageContextBadge />}
            activeConversationId={activeId}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
        )}

        {view === "threads" && (
          <ThreadsView
            conversations={conversations}
            activeId={activeId}
            onOpen={openConversation}
            onArchive={archiveConversation}
            onNew={newConversation}
          />
        )}

        {view === "suggestions" && (
          <SuggestionsView
            proposals={proposals}
            busy={proposalBusy}
            onAccept={handleAcceptProposal}
            onReject={handleRejectProposal}
          />
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Grounded in your policies, risks, vendors &amp;{" "}
          <Link
            href="/settings/ai-context"
            className="underline hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            AI context
          </Link>
          . Replies never mutate your data.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        aria-label="Close"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function DrawerTabs({
  view,
  onChange,
  pendingCount,
}: {
  view: DrawerView;
  onChange: (v: DrawerView) => void;
  pendingCount: number;
}) {
  const TabButton = ({ id, label, badge }: { id: DrawerView; label: string; badge?: number }) => {
    const active = view === id;
    return (
      <button
        type="button"
        onClick={() => onChange(id)}
        className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
          active
            ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
            : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
      >
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex border-b border-neutral-200 dark:border-neutral-800">
      <TabButton id="chat" label="Chat" />
      <TabButton id="threads" label="Threads" />
      <TabButton id="suggestions" label="Suggestions" badge={pendingCount} />
    </div>
  );
}

function PageContextBadge() {
  const { pageContext } = useChat();
  // Show only when we have a meaningful focus record so we don't pollute
  // the chat with "on /dashboard" noise.
  if (!pageContext.recordKind || !pageContext.recordId) return null;
  return (
    <div className="mb-2 inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      <span className="font-medium">Asking about</span>
      <code className="rounded bg-white px-1 dark:bg-neutral-900">
        {pageContext.recordKind}:{pageContext.recordId.slice(0, 8)}
      </code>
    </div>
  );
}

function ChatView({
  transcriptRef,
  messages,
  streamingDelta,
  draft,
  sending,
  pageContextBadge,
  activeConversationId,
  onDraftChange,
  onSend,
}: {
  transcriptRef: React.RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  streamingDelta: string | null;
  draft: string;
  sending: boolean;
  pageContextBadge: React.ReactNode;
  activeConversationId: string | null;
  onDraftChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <>
      <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !streamingDelta && (
          <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            <p className="font-medium text-neutral-700 dark:text-neutral-200">
              Start a conversation
            </p>
            <p className="mt-1">
              Try &ldquo;What policies do we still need for SOC 2?&rdquo; or &ldquo;Which vendors
              are missing a DPA?&rdquo;.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {streamingDelta !== null && (
          <MessageBubble
            message={{
              id: "streaming",
              tenantId: "",
              conversationId: activeConversationId ?? "",
              role: "assistant",
              content: streamingDelta || "…",
              modelUsed: null,
              providerSource: null,
              groundingHash: null,
              citations: [],
              proposalIds: [],
              createdAt: new Date().toISOString(),
            }}
            streaming
          />
        )}
      </div>

      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        {pageContextBadge}
        <Textarea
          id="chat-drawer-composer"
          label=""
          value={draft}
          placeholder="Ask anything about your compliance posture…"
          rows={3}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sending}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-neutral-400">⌘/Ctrl + Enter to send</p>
          <Button onClick={onSend} loading={sending} disabled={!draft.trim() || sending} size="sm">
            Send
          </Button>
        </div>
      </div>
    </>
  );
}

function ThreadsView({
  conversations,
  activeId,
  onOpen,
  onArchive,
  onNew,
}: {
  conversations: ChatConversation[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {conversations.length === 0
            ? "No chats yet"
            : `${conversations.length} ${conversations.length === 1 ? "chat" : "chats"}`}
        </span>
        <Button size="sm" variant="secondary" onClick={onNew}>
          + New chat
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-neutral-400">
            Start a new chat to ask the assistant a question.
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
              activeId === c.id
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
          >
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex-1 truncate text-left"
            >
              {c.title ?? "Untitled"}
            </button>
            <button
              type="button"
              onClick={() => onArchive(c.id)}
              className="ml-2 cursor-pointer opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
              aria-label="Archive conversation"
              title="Archive"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionsView({
  proposals,
  busy,
  onAccept,
  onReject,
}: {
  proposals: TenantContextProposal[];
  busy: Record<string, boolean>;
  onAccept: (p: TenantContextProposal) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <p className="border-b border-neutral-200 px-4 py-2 text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        Facts the assistant noticed in your turns. Nothing is added to your AI context until you
        accept it.
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {proposals.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-neutral-400">No suggestions yet.</p>
        )}
        {proposals.map((p) => {
          const isBusy = busy[p.id] === true;
          return (
            <div
              key={p.id}
              className="rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
            >
              <div className="mb-1 flex items-center gap-1 text-[11px] text-neutral-500">
                <Badge variant="neutral">{CATEGORY_LABEL[p.category] ?? p.category}</Badge>
                <span>{(p.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                {p.question}
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{p.answer}</p>
              {p.rationale && (
                <p className="mt-1 text-[11px] italic text-neutral-400">Why: {p.rationale}</p>
              )}
              <div className="mt-2 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onReject(p.id)} disabled={isBusy}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => onAccept(p)} loading={isBusy} disabled={isBusy}>
                  Accept
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        href="/settings/ai-context"
        className="border-t border-neutral-200 px-4 py-2 text-center text-[11px] text-neutral-500 underline hover:text-neutral-700 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        Manage all context →
      </Link>
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        }`}
      >
        {isUser ? (
          // User input is rendered verbatim — no markdown parsing — so the
          // bubble feels like an echo of what they typed.
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          // Assistant replies are markdown by contract (see system prompt
          // "Use Markdown (headings, bullets, code) where it improves
          // clarity"). Rendering through react-markdown turns **bold**,
          // lists, tables, fenced code, etc. into proper HTML.
          <MarkdownText>{message.content}</MarkdownText>
        )}
        {!isUser && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.citations.map((c: ChatCitation) => (
              <Badge key={`${c.kind}:${c.id}`} variant="info">
                {c.kind}: {c.label}
              </Badge>
            ))}
          </div>
        )}
        {!isUser && !streaming && (message.providerSource || message.groundingHash) && (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-200 pt-1 text-[10px] text-neutral-400 dark:border-neutral-700">
            {message.providerSource && <span>source {message.providerSource}</span>}
            {message.groundingHash && (
              <span>
                evidence{" "}
                <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
                  {message.groundingHash.slice(0, 8)}
                </code>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render a Markdown string inside an assistant bubble.
 *
 * Hard rules:
 *   • No raw HTML — `react-markdown` strips it by default and we do
 *     NOT pass `rehype-raw`. Treat assistant output as untrusted
 *     because the LLM can be coaxed into emitting `<script>`-like
 *     content; rendering as markdown only is the safe path.
 *   • All links open in a new tab with `noopener noreferrer` so they
 *     can't navigate the dashboard away or hijack the opener.
 *   • Code blocks scroll horizontally instead of overflowing the
 *     bubble. Inline `code` gets a soft chip background. We don't
 *     ship a syntax-highlighter today (keeps the bundle small);
 *     swap in `rehype-highlight` later if reviewers ask for it.
 *   • Spacing is tightened with prose-* utility overrides because the
 *     default `prose` rhythm is built for blog posts, not chat
 *     bubbles.
 */
function MarkdownText({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-pre:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props: ComponentPropsWithoutRef<"a">) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          pre: (props: ComponentPropsWithoutRef<"pre">) => (
            <pre
              {...props}
              className="overflow-x-auto rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-800"
            />
          ),
          code: ({
            className,
            children: codeChildren,
            ...rest
          }: ComponentPropsWithoutRef<"code">) => {
            // No language class → inline code. Style as a chip.
            // With a class (e.g. `language-ts`) it's a fenced block,
            // already wrapped in <pre> by remark; pass through.
            if (!className) {
              return (
                <code
                  className="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em] dark:bg-neutral-800"
                  {...rest}
                >
                  {codeChildren}
                </code>
              );
            }
            return (
              <code className={className} {...rest}>
                {codeChildren}
              </code>
            );
          },
          table: (props: ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
