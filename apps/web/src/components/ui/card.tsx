import { forwardRef, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * When true, applies the dashboard's signature aurora hover glow:
   * pink (left) → orange (bottom) → blue (right). Opt-in so the effect
   * is only used on top-level dashboard panels, not inner/nested cards.
   */
  glow?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

// Aurora hover glow used across dashboard panels. Exported so callers can
// compose it with other classNames if they need finer control than the
// `glow` prop alone provides.
export const CARD_GLOW =
  "transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 " +
  "hover:shadow-[-18px_0_34px_-18px_rgba(236,72,153,0.9),0_18px_34px_-20px_rgba(249,115,22,0.8),18px_0_34px_-18px_rgba(59,130,246,0.9),0_8px_18px_-12px_rgba(15,23,42,0.25)] " +
  "dark:hover:border-pink-300/30 " +
  "dark:hover:shadow-[-18px_0_36px_-18px_rgba(244,114,182,0.72),0_18px_36px_-20px_rgba(251,146,60,0.5),18px_0_36px_-18px_rgba(96,165,250,0.72),0_8px_20px_-12px_rgba(0,0,0,0.5)]";

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "md", glow = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${paddingStyles[padding]} ${glow ? CARD_GLOW : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b border-neutral-200 px-6 py-4 dark:border-neutral-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-t border-neutral-200 px-6 py-4 dark:border-neutral-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardFooter, type CardProps };
