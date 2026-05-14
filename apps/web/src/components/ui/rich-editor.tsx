"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import { Extension, Node as TipTapNode, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: { setPageBreak: () => ReturnType };
  }
}

const PageBreak = TipTapNode.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "div[data-page-break]" }, { tag: "hr.page-break" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-page-break": "", class: "page-break-node" }),
      ["span", { class: "page-break-label" }, "Page Break"],
    ];
  },
  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    };
  },
});

function sanitizeLinkUrl(raw: string): string | null {
  try {
    const normalized = raw.trim();
    if (!normalized) return null;
    const parsed = new URL(normalized, window.location.origin);
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeImageUrl(raw: string): string | null {
  try {
    const normalized = raw.trim();
    if (!normalized) return null;
    const parsed = new URL(normalized, window.location.origin);
    if (["http:", "https:"].includes(parsed.protocol)) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// ProseMirror plugin for comment highlight decorations
const commentHighlightKey = new PluginKey("commentHighlight");

const CommentHighlightExtension = Extension.create({
  name: "commentHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: commentHighlightKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            const meta = tr.getMeta(commentHighlightKey);
            if (meta !== undefined) {
              if (meta === null) return DecorationSet.empty;
              const { from, to } = meta;
              const clampedFrom = Math.max(0, Math.min(from, tr.doc.content.size));
              const clampedTo = Math.max(clampedFrom, Math.min(to, tr.doc.content.size));
              if (clampedFrom === clampedTo) return DecorationSet.empty;
              const deco = Decoration.inline(clampedFrom, clampedTo, {
                class: "comment-highlight-active",
              });
              return DecorationSet.create(tr.doc, [deco]);
            }
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export interface RichEditorHandle {
  scrollToRange: (from: number, to: number) => void;
  clearHighlight: () => void;
}

interface RichEditorProps {
  content: string;
  onChange?: (html: string) => void;
  onSave?: (html: string) => void;
  onComment?: (selectedText: string, from: number, to: number) => void;
  onAiGenerate?: (prompt: string, context: string, action: string) => Promise<string | null>;
  onImportFile?: (file: File) => Promise<string | null>;
  placeholder?: string;
  editable?: boolean;
  autoSaveMs?: number;
}

export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor(
  {
    content,
    onChange,
    onSave,
    onComment,
    onAiGenerate,
    onImportFile,
    placeholder = "Type '/' for commands…",
    editable = true,
    autoSaveMs = 3000,
  },
  ref,
) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slashMenuState, setSlashMenuState] = useState<{
    open: boolean;
    pos: { top: number; left: number };
  }>({ open: false, pos: { top: 0, left: 0 } });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<string>("generate");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      CommentHighlightExtension,
      PageBreak,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: "doc-page prose prose-sm max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange?.(html);

      if (onSave && autoSaveMs > 0) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          if (html !== lastSavedRef.current) {
            lastSavedRef.current = html;
            onSave(html);
          }
        }, autoSaveMs);
      }
    },
  });

  // Expose scroll-to and highlight methods to parent
  useImperativeHandle(
    ref,
    () => ({
      scrollToRange(from: number, to: number) {
        if (!editor) return;
        const docSize = editor.state.doc.content.size;
        const clampedFrom = Math.max(0, Math.min(from, docSize));
        const clampedTo = Math.max(clampedFrom, Math.min(to, docSize));
        if (clampedFrom === clampedTo) return;

        // Set the decoration
        editor.view.dispatch(
          editor.state.tr.setMeta(commentHighlightKey, { from: clampedFrom, to: clampedTo }),
        );

        // Scroll into view
        requestAnimationFrame(() => {
          try {
            const domAtPos = editor.view.domAtPos(clampedFrom);
            const node =
              domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
            node?.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch {
            /* position may be invalid after edits */
          }
        });
      },
      clearHighlight() {
        if (!editor) return;
        editor.view.dispatch(editor.state.tr.setMeta(commentHighlightKey, null));
      },
    }),
    [editor],
  );

  // Slash command detection: listen for "/" key on the editor DOM
  useEffect(() => {
    if (!editor || !editable) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Get cursor position relative to container
        const editorDom = editor!.view.dom;
        const containerEl = containerRef.current;
        if (!editorDom || !containerEl) return;

        const coords = editor!.view.coordsAtPos(editor!.state.selection.from);
        const containerRect = containerEl.getBoundingClientRect();

        setSlashMenuState({
          open: true,
          pos: {
            top: coords.bottom - containerRect.top + 4,
            left: coords.left - containerRect.left,
          },
        });
      }
    }

    const dom = editor.view.dom;
    dom.addEventListener("keydown", handleKeyDown);
    return () => dom.removeEventListener("keydown", handleKeyDown);
  }, [editor, editable]);

  // Close slash menu on click outside or Escape
  useEffect(() => {
    if (!slashMenuState.open) return;
    function handleClose(e: KeyboardEvent) {
      if (e.key === "Escape") setSlashMenuState((s) => ({ ...s, open: false }));
    }
    function handleClickOutside() {
      setSlashMenuState((s) => ({ ...s, open: false }));
    }
    document.addEventListener("keydown", handleClose);
    // Delay to prevent immediate close
    const timer = setTimeout(() => document.addEventListener("click", handleClickOutside), 100);
    return () => {
      document.removeEventListener("keydown", handleClose);
      document.removeEventListener("click", handleClickOutside);
      clearTimeout(timer);
    };
  }, [slashMenuState.open]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const PAGE_HEIGHT = 1056;
  const PAGE_GAP = 40;

  useEffect(() => {
    const wrap = paperRef.current;
    if (!wrap) return;
    const editorEl = wrap.querySelector(".doc-page") as HTMLElement | null;
    if (!editorEl) return;

    function recalcPages() {
      if (!editorEl) return;
      const contentHeight = editorEl.scrollHeight;
      const pages = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));
      setPageCount(pages);
      const totalHeight = pages * PAGE_HEIGHT + (pages - 1) * PAGE_GAP;
      wrap!.style.minHeight = `${totalHeight}px`;
    }

    const observer = new ResizeObserver(recalcPages);
    observer.observe(editorEl);
    recalcPages();
    return () => observer.disconnect();
  }, [editor]);

  const handleFileImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImportFile || !editor) return;
      setImporting(true);
      try {
        const html = await onImportFile(file);
        if (html) editor.commands.setContent(html, { emitUpdate: true });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor, onImportFile],
  );

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div
      ref={containerRef}
      className="doc-editor-root relative rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950"
    >
      {editable && (
        <Toolbar
          editor={editor}
          onAiClick={() => {
            setAiAction("generate");
            setAiModalOpen(true);
          }}
        />
      )}

      <div className="doc-canvas overflow-y-auto">
        <div ref={paperRef} className="doc-paper-wrap">
          {/* Render page backgrounds */}
          {Array.from({ length: pageCount }, (_, i) => (
            <div key={`page-${i}`}>
              <div className="page-sheet" style={{ top: i * (PAGE_HEIGHT + PAGE_GAP) }} />
              {i > 0 && (
                <div
                  className="page-gap-label"
                  style={{ top: i * (PAGE_HEIGHT + PAGE_GAP) - PAGE_GAP }}
                >
                  <span>Page {i + 1}</span>
                </div>
              )}
            </div>
          ))}
          {/* Editor content overlaid on pages */}
          <EditorContent editor={editor} />

          {/* Bubble menu on text selection — inside paper wrap so it positions correctly */}
          {(editable || onComment) && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ state, from, to }) => {
                const hasText = !!state.doc.textBetween(from, to).length;
                const notEmpty = !state.selection.empty;
                return hasText && notEmpty;
              }}
              className="z-50 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1.5 py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
            >
              {editable && (
                <>
                  <BBtn
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </BBtn>
                  <BBtn
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                  >
                    <em>I</em>
                  </BBtn>
                  <BBtn
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline"
                  >
                    <span className="underline">U</span>
                  </BBtn>
                  <BBtn
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strike"
                  >
                    <span className="line-through">S</span>
                  </BBtn>
                  <BBtn
                    active={editor.isActive("highlight")}
                    onClick={() =>
                      editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()
                    }
                    title="Highlight"
                  >
                    <span className="rounded bg-yellow-200 px-0.5 text-neutral-900">H</span>
                  </BBtn>
                  <div className="mx-0.5 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                  <BBtn
                    active={editor.isActive("link")}
                    onClick={() => {
                      const url = window.prompt("URL", editor.getAttributes("link").href || "");
                      if (url === null) return;
                      if (url === "") {
                        editor.chain().focus().unsetLink().run();
                        return;
                      }
                      const safe = sanitizeLinkUrl(url);
                      if (safe) editor.chain().focus().setLink({ href: safe }).run();
                    }}
                    title="Link"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                    </svg>
                  </BBtn>
                </>
              )}
              {onComment && (
                <>
                  {editable && (
                    <div className="mx-0.5 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                  )}
                  <BBtn
                    onClick={() => {
                      const { from, to } = editor.state.selection;
                      const selectedText = editor.state.doc.textBetween(from, to, " ");
                      if (selectedText.trim()) onComment(selectedText, from, to);
                    }}
                    title="Comment"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.75.75 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </BBtn>
                  {!editable && (
                    <span className="ml-1 text-[10px] font-medium text-neutral-400">Comment</span>
                  )}
                </>
              )}
              {editable && onAiGenerate && (
                <>
                  <div className="mx-0.5 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                  <BBtn
                    onClick={() => {
                      setAiAction("improve");
                      setAiModalOpen(true);
                    }}
                    title="AI Improve"
                  >
                    <span className="text-purple-500">✨</span>
                  </BBtn>
                </>
              )}
            </BubbleMenu>
          )}
        </div>
      </div>

      {/* Slash commands menu — positioned absolutely within container */}
      {slashMenuState.open && editable && (
        <SlashCommandMenu
          editor={editor}
          position={slashMenuState.pos}
          onClose={() => setSlashMenuState((s) => ({ ...s, open: false }))}
          onAi={() => {
            setSlashMenuState((s) => ({ ...s, open: false }));
            setAiAction("generate");
            setAiModalOpen(true);
          }}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.pdf"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Footer with word count, import & export */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800">
        <span>
          {wordCount} words · {charCount} characters · {pageCount}{" "}
          {pageCount === 1 ? "page" : "pages"}
          {importing && " · Importing…"}
        </span>
        <div className="flex items-center gap-3">
          {editable && onImportFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Import DOCX or PDF"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              {importing ? "Importing…" : "Import"}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            title="Export / Print PDF"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.75v3.25A1.75 1.75 0 0113.25 20h-6.5A1.75 1.75 0 015 18.25V15h-.75A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm8.5 0v3.378a47.89 47.89 0 00-7 0V2.75a.25.25 0 01.25-.25h6.5a.25.25 0 01.25.25zm-7 11.5v3.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25v-3.5H6.5z"
                clipRule="evenodd"
              />
            </svg>
            Export PDF
          </button>
          {editable && onAiGenerate && (
            <button
              type="button"
              onClick={() => {
                setAiAction("generate");
                setAiModalOpen(true);
              }}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-purple-500 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
            >
              ✨ AI Write
            </button>
          )}
        </div>
      </div>

      {/* AI Modal */}
      {aiModalOpen && onAiGenerate && (
        <AiWriteModal
          editor={editor}
          action={aiAction}
          onGenerate={onAiGenerate}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </div>
  );
});

// ─── Slash Command Menu ──────────────────────────────────────

const SLASH_COMMANDS = [
  {
    id: "h1",
    label: "Heading 1",
    desc: "Large heading",
    icon: "H1",
    run: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    desc: "Medium heading",
    icon: "H2",
    run: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    desc: "Small heading",
    icon: "H3",
    run: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bullet List",
    desc: "Unordered list",
    icon: "•",
    run: (e: Editor) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered",
    label: "Numbered List",
    desc: "Ordered list",
    icon: "1.",
    run: (e: Editor) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "todo",
    label: "Task List",
    desc: "Checklist items",
    icon: "☑",
    run: (e: Editor) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    desc: "Block quote",
    icon: "❝",
    run: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code Block",
    desc: "Code snippet",
    icon: "<>",
    run: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    desc: "Horizontal rule",
    icon: "—",
    run: (e: Editor) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "pagebreak",
    label: "Page Break",
    desc: "Insert page break for PDF",
    icon: "⤓",
    run: (e: Editor) => e.chain().focus().setPageBreak().run(),
  },
  {
    id: "table",
    label: "Table",
    desc: "Insert table",
    icon: "⊞",
    run: (e: Editor) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "image",
    label: "Image",
    desc: "Embed image",
    icon: "🖼",
    run: (e: Editor) => {
      const url = window.prompt("Image URL");
      if (!url) return;
      const safe = sanitizeImageUrl(url);
      if (safe) e.chain().focus().setImage({ src: safe }).run();
    },
  },
  { id: "ai", label: "AI Write", desc: "Generate with AI", icon: "✨", run: () => {} },
];

function SlashCommandMenu({
  editor,
  position,
  onClose,
  onAi,
}: {
  editor: Editor;
  position: { top: number; left: number };
  onClose: () => void;
  onAi: () => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [filter, setFilter] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(filter.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIdx(0);
  }, [filter]);

  // Track keystrokes for filtering after the initial "/" was typed
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && filtered[selectedIdx]) {
        e.preventDefault();
        executeSlashCommand(editor, filtered[selectedIdx], onAi);
        onClose();
        return;
      }
      if (e.key === "Escape" || e.key === " ") {
        onClose();
        return;
      }
      if (e.key === "Backspace") {
        setFilter((f) => {
          const nf = f.slice(0, -1);
          if (nf === "" && f === "") onClose();
          return nf;
        });
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setFilter((f) => f + e.key);
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [editor, filtered, selectedIdx, onClose, onAi]);

  if (filtered.length === 0) {
    onClose();
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-600 dark:bg-neutral-800"
      style={{ top: position.top, left: Math.min(position.left, 200) }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-80 overflow-y-auto p-1.5">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Blocks
        </p>
        {filtered.map((cmd, idx) => (
          <button
            key={cmd.id}
            type="button"
            className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${idx === selectedIdx ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"}`}
            onMouseEnter={() => setSelectedIdx(idx)}
            onClick={() => {
              executeSlashCommand(editor, cmd, onAi);
              onClose();
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-sm font-medium dark:bg-neutral-700">
              {cmd.icon}
            </span>
            <div>
              <p className="font-medium leading-tight">{cmd.label}</p>
              <p className="text-[11px] text-neutral-400">{cmd.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function executeSlashCommand(
  editor: Editor,
  cmd: (typeof SLASH_COMMANDS)[number],
  onAi: () => void,
) {
  // Delete the "/" character that triggered the menu
  const { from } = editor.state.selection;
  const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from);
  const slashIdx = textBefore.lastIndexOf("/");
  if (slashIdx >= 0) {
    const deleteFrom = from - (textBefore.length - slashIdx);
    editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
  }

  if (cmd.id === "ai") onAi();
  else cmd.run(editor);
}

// ─── AI Write Modal ──────────────────────────────────────────

function AiWriteModal({
  editor,
  action,
  onGenerate,
  onClose,
}: {
  editor: Editor;
  action: string;
  onGenerate: (prompt: string, context: string, action: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [currentAction, setCurrentAction] = useState(action);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " ",
  );
  const contextHint = selectedText.trim()
    ? `Selected: "${selectedText.slice(0, 100)}${selectedText.length > 100 ? "…" : ""}"`
    : "";

  const actions = [
    { value: "generate", label: "Generate" },
    { value: "rewrite", label: "Rewrite" },
    { value: "expand", label: "Expand" },
    { value: "summarize", label: "Summarize" },
    { value: "improve", label: "Improve" },
  ];

  async function handleGenerate() {
    if (!prompt.trim() && !selectedText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const context = selectedText || editor.getHTML();
      const result = await onGenerate(
        prompt || `${currentAction} this content`,
        context,
        currentAction,
      );
      if (result) setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleInsert() {
    if (!preview) return;
    if (selectedText.trim()) {
      editor.chain().focus().deleteSelection().insertContent(preview).run();
    } else {
      editor.chain().focus().insertContent(preview).run();
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-neutral-900 dark:text-white">AI Write</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {contextHint && <p className="mb-2 text-xs text-neutral-400">{contextHint}</p>}

        <div className="mb-3 flex flex-wrap gap-1">
          {actions.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setCurrentAction(a.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${currentAction === a.value ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"}`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            currentAction === "generate"
              ? "Describe what to write… e.g. 'Write an access control policy section'"
              : `Describe how to ${currentAction} the content…`
          }
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        {preview && (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Preview
            </p>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview) }}
            />
          </div>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          {preview ? (
            <button
              type="button"
              onClick={handleInsert}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              Insert
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────

function Toolbar({ editor, onAiClick }: { editor: Editor; onAiClick?: () => void }) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else {
      const safe = sanitizeLinkUrl(url);
      if (safe) editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
      <select
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : "p"
        }
        onChange={(e) => {
          const val = e.target.value;
          if (val === "p") editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .toggleHeading({ level: parseInt(val.replace("h", "")) as 1 | 2 | 3 })
              .run();
        }}
        className="mr-1 h-7 rounded border border-neutral-300 bg-white px-1.5 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <TDiv />
      <TBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <strong>B</strong>
      </TBtn>
      <TBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <em>I</em>
      </TBtn>
      <TBtn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <span className="underline">U</span>
      </TBtn>
      <TBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strike"
      >
        <span className="line-through">S</span>
      </TBtn>
      <ColorPicker
        label="A"
        title="Text color"
        currentColor={editor.getAttributes("textStyle").color || "#000000"}
        onSelect={(color) => {
          if (color === "default") editor.chain().focus().unsetColor().run();
          else editor.chain().focus().setColor(color).run();
        }}
        onClear={() => editor.chain().focus().unsetColor().run()}
        type="text"
      />
      <ColorPicker
        label="A"
        title="Background color"
        currentColor={editor.getAttributes("highlight").color || "transparent"}
        onSelect={(color) => {
          if (color === "default") editor.chain().focus().unsetHighlight().run();
          else editor.chain().focus().toggleHighlight({ color }).run();
        }}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
        type="bg"
      />
      <TDiv />
      <TBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        •≡
      </TBtn>
      <TBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1≡
      </TBtn>
      <TBtn
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task list"
      >
        ☑
      </TBtn>
      <TDiv />
      <TBtn
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Left"
      >
        ⫷
      </TBtn>
      <TBtn
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Center"
      >
        ⫿
      </TBtn>
      <TBtn
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Right"
      >
        ⫸
      </TBtn>
      <TDiv />
      <TBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        ❝
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        —
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setPageBreak().run()} title="Page Break">
        ⤓
      </TBtn>
      <TBtn
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code"
      >
        &lt;/&gt;
      </TBtn>
      <TDiv />
      <TBtn active={editor.isActive("link")} onClick={setLink} title="Link">
        🔗
      </TBtn>
      <TBtn
        onClick={() => {
          const url = window.prompt("Image URL");
          if (!url) return;
          const safe = sanitizeImageUrl(url);
          if (safe) editor.chain().focus().setImage({ src: safe }).run();
        }}
        title="Image"
      >
        🖼
      </TBtn>
      <TBtn
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Table"
      >
        ⊞
      </TBtn>
      <ToolbarEmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />
      <TDiv />
      <TBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        ↩
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        ↪
      </TBtn>

      {onAiClick && (
        <>
          <TDiv />
          <button
            type="button"
            onClick={onAiClick}
            title="AI Write"
            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30"
          >
            ✨ AI
          </button>
        </>
      )}
    </div>
  );
}

// ─── Color Picker ─────────────────────────────────────────────

const TEXT_COLORS = [
  { label: "Default", value: "default" },
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#4b5563" },
  { label: "Gray", value: "#9ca3af" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
];

const BG_COLORS = [
  { label: "None", value: "default" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Gray", value: "#e5e7eb" },
  { label: "Cyan", value: "#a5f3fc" },
  { label: "Lime", value: "#d9f99d" },
];

function ColorPicker({
  label,
  title,
  currentColor,
  onSelect,
  onClear,
  type,
}: {
  label: string;
  title: string;
  currentColor: string;
  onSelect: (color: string) => void;
  onClear: () => void;
  type: "text" | "bg";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = type === "text" ? TEXT_COLORS : BG_COLORS;

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const indicatorColor =
    type === "text"
      ? currentColor && currentColor !== "#000000"
        ? currentColor
        : undefined
      : currentColor && currentColor !== "transparent"
        ? currentColor
        : undefined;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onClick={() => setOpen(!open)}
        className={`flex h-7 w-7 flex-col items-center justify-center rounded text-xs transition-colors ${open ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"}`}
      >
        <span
          className={type === "bg" ? "rounded px-0.5" : ""}
          style={
            type === "bg"
              ? { backgroundColor: indicatorColor || "#fef08a" }
              : { color: indicatorColor || "inherit" }
          }
        >
          {label}
        </span>
        <span
          className="mt-[-2px] block h-[3px] w-3.5 rounded-sm"
          style={{ backgroundColor: indicatorColor || (type === "text" ? "#000" : "#fef08a") }}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            {title}
          </p>
          <div className="grid grid-cols-6 gap-1">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => {
                  onSelect(c.value);
                  setOpen(false);
                }}
                className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 transition-transform hover:scale-110 dark:border-neutral-600"
                style={{
                  backgroundColor:
                    c.value === "default" ? (type === "bg" ? "transparent" : "#000") : c.value,
                }}
              >
                {c.value === "default" && type === "bg" && (
                  <span className="text-[10px] text-neutral-400">∅</span>
                )}
                {c.value === currentColor && (
                  <span
                    className="text-[10px]"
                    style={{ color: type === "text" ? "#fff" : "#000" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          {type === "text" &&
            currentColor &&
            currentColor !== "default" &&
            currentColor !== "#000000" && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="mt-2 w-full rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Reset to default
              </button>
            )}
          {type === "bg" &&
            currentColor &&
            currentColor !== "default" &&
            currentColor !== "transparent" && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="mt-2 w-full rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Remove background
              </button>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar Emoji Picker ─────────────────────────────────────

const TOOLBAR_EMOJIS = [
  ["😀", "😂", "🥰", "😎", "🤔", "😮", "🥳", "🤩", "😴", "🤗"],
  ["👍", "👎", "👏", "🙌", "💪", "🤝", "✌️", "🫡", "❤️", "🔥"],
  ["✅", "❌", "⭐", "💡", "📌", "🎯", "🚀", "⚡", "🎉", "💯"],
  ["📝", "📎", "📊", "🔒", "🛡️", "⚙️", "🔔", "📅", "✏️", "🗂️"],
];

function ToolbarEmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Insert emoji"
        className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${open ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
      >
        😀
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
          {TOOLBAR_EMOJIS.map((row, ri) => (
            <div key={ri} className="flex gap-0.5">
              {row.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onSelect(e);
                    setOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded text-base transition-transform hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {e}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TBtn({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${active ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"} ${disabled ? "cursor-not-allowed opacity-30" : ""}`}
    >
      {children}
    </button>
  );
}

function BBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${active ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"}`}
    >
      {children}
    </button>
  );
}

function TDiv() {
  return <div className="mx-1 h-5 w-px bg-neutral-300 dark:bg-neutral-600" />;
}
