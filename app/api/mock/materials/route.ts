import { NextResponse } from "next/server";
import { Material } from "@/types";

const materials: Material[] = [
  { id: "MAT-1", name: "آرد", base_unit: "kg" },
  { id: "MAT-2", name: "نان", base_unit: "pcs" },
  { id: "MAT-3", name: "آب", base_unit: "L" },
  { id: "MAT-4", name: "شکر", base_unit: "kg" },
  { id: "MAT-5", name: "روغن", base_unit: "L" },
  { id: "MAT-6", name: "خمیر مایه", base_unit: "kg" },
  { id: "MAT-7", name: "نمک", base_unit: "kg" },
  { id: "MAT-8", name: "تخم مرغ", base_unit: "pcs" },
  { id: "MAT-9", name: "شیر", base_unit: "L" },
  { id: "MAT-10", name: "کره", base_unit: "kg" },
  { id: "MAT-11", name: "وانیل", base_unit: "kg" }
];

export async function GET() {
  return NextResponse.json(materials);
}
