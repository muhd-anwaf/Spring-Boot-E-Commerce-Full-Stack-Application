import { useId } from "react";

/** Label + input + error text. Pass `as="select"` or `as="textarea"` for other controls. */
export default function FormField({ label, error, as: Tag = "input", className = "", children, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
        {...props}
      >
        {children}
      </Tag>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
