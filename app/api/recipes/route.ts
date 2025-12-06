import { NextRequest, NextResponse } from "next/server";
import { getRecipesByProductId } from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { message: "productId is required" },
        { status: 400 }
      );
    }
    const recipes = await getRecipesByProductId(productId);
    return NextResponse.json({ recipes });
  } catch (err: any) {
    console.error("recipes error", err);
    return NextResponse.json(
      { message: "Failed to load recipes" },
      { status: 500 }
    );
  }
}
