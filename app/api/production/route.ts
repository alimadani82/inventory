import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  insertProductionLogRows,
  ProductionLogRow
} from "@/lib/productionLog";

const payloadSchema = z.object({
  timestamp: z.string().datetime(),
  operator_name: z.string().min(1),
  source: z.literal("webapp"),
  batch_id: z.string().optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        qty: z.number().nonnegative(),
        unit: z.string()
      })
    )
    .nonempty(),
  consumed_materials: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number().nonnegative(),
      unit: z.string()
    })
  )
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const eventTime = new Date().toISOString();
    const batchId = payload.batch_id ?? crypto.randomUUID();

    const productsJoined = payload.products.map((p) => p.id).join(",");
    const productNames = payload.products.map((p) => p.name).join(",");
    const totalQuantity = payload.products.reduce(
      (sum, p) => sum + p.qty,
      0
    );

    const rows: ProductionLogRow[] = payload.consumed_materials.map((mat) => ({
      event_time: eventTime,
      batch_id: batchId,
      form_label: payload.operator_name,
      product_id: productsJoined,
      product_name: productNames,
      quantity: totalQuantity,
      material_id: mat.id,
      material_name: mat.name,
      material_amount: mat.amount,
      unit: mat.unit,
      source: payload.source
    }));

    await insertProductionLogRows(rows);

    const webhook = process.env.N8N_WEBHOOK_URL;
    if (webhook) {
      const resp = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        throw new Error(`n8n webhook failed (${resp.status})`);
      }
    }

    return NextResponse.json({ ok: true, batch_id: batchId });
  } catch (err: any) {
    console.error("production error", err);
    return NextResponse.json(
      { message: "Failed to submit production" },
      { status: 500 }
    );
  }
}
