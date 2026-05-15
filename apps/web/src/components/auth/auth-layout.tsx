"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthLayoutProps = {
  /** Heading rendered above the form (e.g. "Sign in to your account"). */
  title: string;
  /** Optional supporting line shown directly under the title. */
  subtitle?: string;
  /** The form (or any other right-pane content). */
  children: ReactNode;
  /** Optional footer slot under the form (e.g. "Don't have an account?"). */
  footer?: ReactNode;
};

/**
 * Two-pane authentication shell.
 *
 * - Left pane: vibrant marketing area with floating product UI fragments
 *   that hint at what the platform actually feels like to use. Hidden on
 *   screens narrower than `lg` so mobile users see the form first.
 * - Right pane: title + form + optional footer.
 *
 * Both `/login` and `/register` use this layout so the experience stays
 * consistent and the marketing copy lives in exactly one place.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.25fr_1fr]">
      <MarketingPanel />

      <main className="relative flex min-h-screen flex-col bg-white dark:bg-neutral-950">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          {/* Compact logo for small screens; the marketing pane already shows
              the full lockup on lg+. */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 lg:invisible dark:text-white"
          >
            <BrandMark className="h-7 w-7" />
            <span>
              Trust<span className="text-blue-600">alo</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-2 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
              )}
            </div>

            <div className="space-y-5">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                {footer}
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 pb-6 text-center text-xs text-neutral-400 dark:text-neutral-500 lg:px-10">
          © {new Date().getFullYear()} Trustalo. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketing pane
// ─────────────────────────────────────────────────────────────────────────────

// FRAMEWORK_BADGES + the FrameworkMarquee that consumed them were
// removed when the static badge row was dropped from MarketingPanel.
// Reintroduce together if the marquee is revived.

// ─── Forti-inspired palette ──────────────────────────────────────────────────
// Near-black neutral base with a warm orange glow as the primary brand accent
// and supporting multi-color category hues (mint, purple, yellow). Mirrors
// play.forti.io's visual language: dark canvas + vivid orange primary + a
// system of distinct per-category accents rather than a single hue family.

function MarketingPanel() {
  return (
    <aside
      aria-label="Trustalo platform highlights"
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 70% 55% at 82% 12%, rgba(255, 122, 26, 0.22), transparent 70%)", // orange (top right) — primary
          "radial-gradient(ellipse 55% 45% at 12% 78%, rgba(167, 139, 250, 0.16), transparent 70%)", // purple (bottom left)
          "radial-gradient(ellipse 50% 40% at 75% 92%, rgba(52, 211, 153, 0.12), transparent 70%)", // mint (bottom right)
          "radial-gradient(ellipse 40% 35% at 5% 25%, rgba(245, 197, 24, 0.08), transparent 70%)", // yellow whisper (top left)
          "linear-gradient(160deg, #0a0a0c 0%, #111114 50%, #0a0a0c 100%)", // near-black neutral base
        ].join(", "),
      }}
    >
      <AuroraOrbs />
      <DotPattern />
      <FloatingUiFragments />

      <div className="relative z-10 flex flex-col gap-10 px-12 py-12 xl:px-16 xl:py-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white"
        >
          <BrandMark className="h-8 w-8" />
          <span>
            Trust
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              alo
            </span>
          </span>
        </Link>

        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/[0.08] px-3 py-1 text-xs font-medium uppercase tracking-wider text-orange-200 backdrop-blur">
            <span className="auth-pulse-dot h-1.5 w-1.5 rounded-full bg-orange-400" />
            Compliance Platform
          </span>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white xl:text-[2.5rem] xl:leading-[1.1]">
            Run every audit from a single,{" "}
            <span className="auth-shimmer-text bg-clip-text text-transparent [background-image:linear-gradient(90deg,#fdba74_0%,#fb923c_25%,#f97316_50%,#fb923c_75%,#fdba74_100%)]">
              always-current
            </span>{" "}
            source of truth.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-neutral-300/85">
            Trustalo unifies controls, evidence and policies across the frameworks your customers
            ask for — so your team spends less time chasing screenshots and more time shipping.
          </p>
        </div>
      </div>

      {/* Hidden until we ship coverage for all listed frameworks. */}
      {/* <FrameworkMarquee /> */}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating UI fragments — small mock pieces of the product, scattered and
// gently drifting to suggest "this is what the app feels like" without
// requiring real screenshots. Decorative only: aria-hidden, pointer-events
// disabled, and they sit between the orbs (z-0) and the readable copy (z-10).
// ─────────────────────────────────────────────────────────────────────────────

function FloatingUiFragments() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] hidden xl:block">
      {/* Control passing — top right */}
      <ControlRowCard className="auth-float-1 absolute right-6 top-[42%] w-[260px]" />
      {/* Framework readiness gauge — middle, slightly offset */}
      <FrameworkGaugeCard
        className="auth-float-2 absolute right-28 top-[58%] w-[220px]"
        style={{ animationDelay: "1.2s" }}
      />
      {/* AI assistant bubble — bottom right */}
      <AiBubbleCard
        className="auth-float-3 absolute right-10 top-[74%] w-[260px]"
        style={{ animationDelay: "2.4s" }}
      />
    </div>
  );
}

type FragmentProps = { className?: string; style?: React.CSSProperties };

// Each fragment uses ONE category accent so the trio reads as a system —
// Forti's signature look: mint = success, orange = primary brand, purple =
// AI/secondary. Borders, icon backgrounds and drop-shadow glows all share
// that fragment's hue.

function ControlRowCard({ className, style }: FragmentProps) {
  return (
    <div
      className={`rounded-xl border border-emerald-400/25 bg-neutral-900/70 p-4 shadow-[0_20px_50px_-20px_rgba(52,211,153,0.55)] backdrop-blur-md ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-300/40">
          <CheckIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">A.12.1.2 — Change Mgmt</p>
          <p className="text-[11px] uppercase tracking-wider text-emerald-300/85">Effective</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
          ISO 27001
        </span>
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
          SOC 2
        </span>
        <span className="text-[10px] text-neutral-400">8 controls mapped</span>
      </div>
    </div>
  );
}

function FrameworkGaugeCard({ className, style }: FragmentProps) {
  const percent = 92;
  const circumference = 2 * Math.PI * 24;
  const dash = (percent / 100) * circumference;

  return (
    <div
      className={`rounded-xl border border-orange-400/30 bg-neutral-900/70 p-4 shadow-[0_20px_50px_-20px_rgba(255,122,26,0.6)] backdrop-blur-md ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="url(#gaugeGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="56" y2="56">
              <stop stopColor="#fdba74" />
              <stop offset="0.5" stopColor="#fb923c" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-300/85">SOC 2 Type II</p>
          <p className="text-2xl font-bold leading-none text-white">{percent}%</p>
          <p className="mt-1 text-[11px] text-neutral-400">audit-ready</p>
        </div>
      </div>
    </div>
  );
}

function AiBubbleCard({ className, style }: FragmentProps) {
  return (
    <div
      className={`rounded-xl border border-purple-400/30 bg-neutral-900/70 p-4 shadow-[0_20px_50px_-20px_rgba(167,139,250,0.55)] backdrop-blur-md ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-purple-400/15 text-purple-300 ring-1 ring-inset ring-purple-300/35">
          <SparklesIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-purple-300/85">
            Trustalo AI
          </p>
          <p className="mt-1 text-sm text-white/95">
            Drafted your Access Control policy from 14 evidence items.{" "}
            <span className="text-purple-300">Review?</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// FrameworkMarquee + its FRAMEWORK_BADGES source list were prototyped
// here but never wired into the auth layout. Both removed to silence
// noUnusedLocals; the CSS classes `auth-marquee` and `auth-marquee-mask`
// are still defined in globals.css if the animation is revived later.

// ─────────────────────────────────────────────────────────────────────────────
// Decorative + icon SVGs (kept inline to avoid an icon-library dependency)
// ─────────────────────────────────────────────────────────────────────────────

function DotPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10] mix-blend-screen"
    >
      <defs>
        <pattern id="auth-dot-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-dot-pattern)" />
    </svg>
  );
}

/**
 * Three blurred orbs in Forti's category palette (orange / purple / mint)
 * that overlap and bleed into the near-black base so the surface reads as
 * one continuous, alive wash rather than a flat panel. The orange orb is
 * the dominant primary, others are supporting accents.
 */
function AuroraOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="auth-orb-1 absolute -right-24 top-1/4 h-[30rem] w-[30rem] rounded-full bg-orange-500/25 blur-[120px] will-change-transform" />
      <div className="auth-orb-2 absolute -left-32 top-2/3 h-[26rem] w-[26rem] rounded-full bg-purple-500/22 blur-[120px] will-change-transform" />
      <div className="auth-orb-3 absolute bottom-[-6rem] right-1/4 h-[22rem] w-[22rem] rounded-full bg-emerald-400/18 blur-[120px] will-change-transform" />
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 2.5 4.5 7v8.6c0 7 4.9 12.6 11.5 14 6.6-1.4 11.5-7 11.5-14V7L16 2.5Z"
        fill="url(#brand-gradient)"
      />
      <path
        d="m11 16.2 3.4 3.4 6.6-7"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="brand-gradient"
          x1="4.5"
          y1="2.5"
          x2="27.5"
          y2="29.6"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fdba74" />
          <stop offset="0.55" stopColor="#fb923c" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type IconProps = { className?: string };

function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12 5 5L20 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.5 6.5 4 4M20 20l-2.5-2.5M6.5 17.5 4 20M20 4l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
