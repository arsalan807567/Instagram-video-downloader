import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,21,28,0.04),0_8px_24px_rgba(16,21,28,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
