import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export function buttonClasses(variant: Variant = "primary") {
  const base =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60";
  return variant === "primary"
    ? `${base} bg-brand text-white hover:bg-brand/90 border border-brand`
    : `${base} bg-white text-brand border border-brand hover:bg-brand/5`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant)} ${className}`}
      {...props}
    />
  );
}
