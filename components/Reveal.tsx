import type { ElementType, ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const Component = as as ElementType;

  return (
    <Component
      className={`reveal ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
