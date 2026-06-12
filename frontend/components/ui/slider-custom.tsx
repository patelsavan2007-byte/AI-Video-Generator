"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderCustomProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function SliderCustom({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
}: SliderCustomProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex w-full items-center select-none", className)}>
      <div className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        {/* Track Fill */}
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-full h-4 opacity-0 cursor-pointer"
        style={{ zIndex: 2 }}
      />
      {/* Thumb representation (visual only) */}
      <div
        className="absolute w-4 h-4 rounded-full bg-white border-2 border-purple-500 shadow-md shadow-purple-500/50 pointer-events-none transition-transform active:scale-125"
        style={{
          left: `calc(${percentage}% - 8px)`,
          zIndex: 1,
        }}
      />
    </div>
  );
}
