import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border bg-white px-5 py-4 text-base text-ink placeholder:text-ink/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
          error ? "border-bad" : "border-line"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
