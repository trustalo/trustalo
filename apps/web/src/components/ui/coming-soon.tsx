import { Card } from "@/components/ui/card";

export interface ComingSoonProps {
  title: string;
  description: string;
  // Optional bullet list of capabilities the upcoming page will expose.
  capabilities?: string[];
}

export function ComingSoon({ title, description, capabilities }: ComingSoonProps) {
  return (
    <Card className="p-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <svg
            className="h-6 w-6 text-amber-700 dark:text-amber-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        {capabilities && capabilities.length > 0 && (
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
            {capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
