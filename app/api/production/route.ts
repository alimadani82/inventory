import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendProductionLogRows,
  createBatchId,
  updateInventoryStocks
} from "@/lib/googleSheets";

const payloadSchema = z.object({
  timestamp: z.string().datetime(),
  operator_name: z.string().min(1),
  source: z.literal("webapp"),
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
    const batchId = createBatchId();

    const productsJoined = payload.products.map((p) => p.id).join(",");
    const productNames = payload.products.map((p) => p.name).join(",");
    const productQuantities = payload.products.map((p) => p.qty).join(",");

    const rows = payload.consumed_materials.map((mat) => [
      payload.timestamp,
      batchId,
      payload.operator_name,
      productsJoined,
      productNames,
      productQuantities,
      mat.id,
      mat.name,
      mat.amount,
      mat.unit,
      payload.source
    ]);

    await appendProductionLogRows(rows);

    if (process.env.UPDATE_INVENTORY === "true") {
      try {
        await updateInventoryStocks(payload.consumed_materials);
      } catch (err: any) {
        return NextResponse.json(
          { message: err?.message ?? "Failed to update inventory" },
          { status: 400 }
        );
      }
    }

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
