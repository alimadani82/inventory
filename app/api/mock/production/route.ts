import { NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  timestamp: z.string(),
  operator_name: z.string().min(1),
  source: z.string(),
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
  const data = await req.json();
  const parsed = payloadSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.format() },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
