import type { InputHTMLAttributes } from "react";

export const fieldControlClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-danger";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  name: string;
  label: string;
  error?: string;
  hint?: string;
}

export function Field({
  name,
  label,
  error,
  hint,
  className = "",
  ...props
}: FieldProps) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldControlClass} mt-1 ${className}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
