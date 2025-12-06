import { SelectedProduct, MaterialUsage } from "@/store/production-store";
import { formatNumber } from "@/lib/utils";

type Props = {
  products: SelectedProduct[];
  materials: MaterialUsage[];
};

export function SummaryView({ products, materials }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">محصولات</p>
          <span className="text-xs text-muted-foreground">
            {products.length} مورد
          </span>
        </div>
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
              </div>
              <p className="text-base font-semibold">{p.qty}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">مواد اولیه</p>
          <span className="text-xs text-muted-foreground">
            {materials.length} مورد
          </span>
        </div>
        <div className="space-y-2">
          {materials.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  پیشنهاد {formatNumber(m.suggested)} {m.unit}
                </p>
              </div>
              <p className="text-base font-semibold">
                {formatNumber(m.final)} {m.unit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
