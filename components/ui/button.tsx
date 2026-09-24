import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants = cva("btn", { variants: { variant: { default: "btn--primary", outline: "ges-button-outline" } }, defaultVariants: { variant: "default" } });
export function Button({ className, variant, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>) {
  return <button type={type} className={cn(variants({ variant }), className)} {...props} />;
}
