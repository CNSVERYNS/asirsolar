"use client";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

// Shadcn/Radix composition, styled with the existing Asır Solar design tokens.
export function Slider({ className, value, defaultValue = [0], label, ...props }:
  React.ComponentProps<typeof SliderPrimitive.Root> & { label: string }) {
  return <SliderPrimitive.Root className={cn("ges-slider", className)} value={value} defaultValue={defaultValue} {...props}>
    <SliderPrimitive.Track className="ges-slider-track"><SliderPrimitive.Range className="ges-slider-range" /></SliderPrimitive.Track>
    {(value ?? defaultValue).map((_, index) => <SliderPrimitive.Thumb key={index} className="ges-slider-thumb" aria-label={label} />)}
  </SliderPrimitive.Root>;
}
