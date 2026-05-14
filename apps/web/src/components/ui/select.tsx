import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-neutral-800 dark:text-white ${
            error
              ? "border-red-400 focus:border-red-500 dark:border-red-600"
              : "border-neutral-300 focus:border-blue-500 dark:border-neutral-700"
          } ${className}`}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-neutral-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select, type SelectProps, type SelectOption };
