"use client";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary ${className}`}
    />
  );
}
