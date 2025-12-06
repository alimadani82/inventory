"use client";

import { MaterialUsage } from "@/store/production-store";
import { formatNumber } from "@/lib/utils";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

type Props = {
  materials: MaterialUsage[];
  onChangeAmount: (id: string, value: number) => void;
};

export function MaterialsTable({ materials, onChangeAmount }: Props) {
  if (!materials.length) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        هنوز ماده‌ای برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((mat) => (
        <div
          key={mat.id}
          className="flex flex-col gap-3 rounded-xl border p-3 shadow-sm md:flex-row md:items-center md:gap-4"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">{mat.name}</p>
            <p className="text-xs text-muted-foreground">
              مصرف پیشنهادی {formatNumber(mat.suggested)} {mat.unit}
              {mat.sourceProducts.length
                ? ` • از ${mat.sourceProducts.length} محصول`
                : ""}
            </p>
            {mat.isExtra && (
              <Badge variant="secondary" className="mt-1">
                افزوده شده به‌صورت دستی
              </Badge>
            )}
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 md:w-80">
            <label className="text-xs font-medium text-muted-foreground">
              مقدار مصرف نهایی
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={mat.final}
                onChange={(e) =>
                  onChangeAmount(
                    mat.id,
                    Number(e.target.value) >= 0
                      ? Number(e.target.value)
                      : mat.final
                  )
                }
              />
              <span className="text-sm text-muted-foreground">{mat.unit}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{mat.base_unit || mat.unit}</Badge>
              <span>واحد پایه این ماده</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
