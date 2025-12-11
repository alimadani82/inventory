import "server-only";

import { supabaseServer } from "./supabaseServer";

export type ProductionLogRow = {
  event_time: string; // ISO string
  batch_id: string;
  form_label?: string | null;
  product_id: string;
  product_name: string;
  quantity: number;
  material_id: string;
  material_name: string;
  material_amount: number;
  unit: string;
  source?: string;
};

export async function insertProductionLogRows(rows: ProductionLogRow[]) {
  const { error } = await supabaseServer
    .from("production_log")
    .insert(
      rows.map((r) => ({
        ...r,
        source: r.source ?? "webapp"
      }))
    );

  if (error) {
    console.error("supabase insertProductionLogRows error", error);
    throw new Error("Failed to write production log");
  }
}
