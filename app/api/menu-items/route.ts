import { NextResponse } from "next/server";
import { getMenuItems } from "@/lib/googleSheets";

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("menu-items error", err);
    return NextResponse.json(
      { message: "Failed to load menu items" },
      { status: 500 }
    );
  }
}
