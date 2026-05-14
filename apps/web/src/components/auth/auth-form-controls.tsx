"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Optional element rendered to the right of the label (e.g. "Forgot?" link). */
  trailingLabel?: ReactNode;
};

/**
 * Labelled input used throughout the auth screens. Wrapping the styling here
 * keeps the form components in `page.tsx` focused on behaviour, not classes.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, trailingLabel, id, className, ...inputProps },
  ref,
) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        {trailingLabel}
      </div>
      <input
        id={id}
        ref={ref}
        className={
          "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500" +
          (className ? ` ${className}` : "")
        }
        {...inputProps}
      />
    </div>
  );
});

/** Inline error banner for forms. */
export function AuthErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-none"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0Zm-7-4a1 1 0 10-2 0v4a1 1 0 102 0V6Zm-1 8a1 1 0 100-2 1 1 0 000 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/** Primary submit button (full-width). */
export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
  ...rest
}: InputHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || rest.disabled}
      className="group relative w-full overflow-hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-neutral-950"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner className="h-4 w-4" />
          {loadingLabel ?? "Please wait…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
