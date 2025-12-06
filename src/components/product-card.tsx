"use client";

import { Minus, Plus } from "lucide-react";
import { Product } from "@/types";
import { Button } from "./ui/button";

type Props = {
  product: Product;
  qty: number;
  onChange: (value: number) => void;
};

export function ProductCard({ product, qty, onChange }: Props) {
  const handleChange = (next: number) => {
    if (Number.isNaN(next)) return;
    onChange(Math.max(0, next));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              {product.category}
            </span>
            <p className="text-base font-semibold leading-tight">
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground">{product.unit}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between rounded-lg bg-muted px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleChange(qty - 1)}
            aria-label={`کم کردن ${product.name}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => handleChange(parseInt(e.target.value, 10) || 0)}
            className="h-10 w-16 rounded-md border border-input bg-background text-center text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleChange(qty + 1)}
            aria-label={`افزایش ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
