export function RiskMatrixHelpContent() {
  return (
    <div className="space-y-4">
      <p>
        The risk matrix plots <strong>likelihood</strong> (vertical axis) against{" "}
        <strong>impact</strong> (horizontal axis). Each cell shows the <strong>risk score</strong>{" "}
        for that combination: likelihood × impact (1–25).
      </p>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Inherent risk
        </h3>
        <p>
          Represents exposure <strong>before</strong> considering controls — the raw severity if the
          risk materializes. Update it from this tab or from the Overview tab; changes are recorded
          in <strong>Matrix change history</strong>.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Residual risk
        </h3>
        <p>
          Represents exposure <strong>after</strong> controls, treatment, or other mitigation.
          Select the cell that best matches your assessed residual position, then save. Until you
          save, the summary may still reflect the last stored values.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Risk reduction
        </h3>
        <p>
          Compares stored inherent and residual scores from the register. The percentage is{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
            (inherent − residual) / inherent
          </code>
          .
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          History
        </h3>
        <p>
          Every time inherent or residual matrix positions are saved (from this tab, Overview, or a
          formal assessment), an entry is appended so auditors can see who changed what and when.
        </p>
      </div>
    </div>
  );
}
