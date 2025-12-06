import { NextResponse } from "next/server";
import { getMaterials } from "@/lib/googleSheets";

export async function GET() {
  try {
    const materials = await getMaterials();
    return NextResponse.json({ materials });
  } catch (err: any) {
    console.error("materials error", err);
    return NextResponse.json(
      { message: "Failed to load materials" },
      { status: 500 }
    );
  }
}
