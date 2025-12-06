import { NextRequest, NextResponse } from "next/server";
import { RecipeRow } from "@/types";

const recipes: Record<string, RecipeRow[]> = {
  espresso: [
    {
      product_id: "espresso",
      material_id: "beans",
      material_name: "Coffee Beans",
      amount_per_unit: 18,
      unit: "g",
      is_active: 1
    }
  ],
  latte: [
    {
      product_id: "latte",
      material_id: "beans",
      material_name: "Coffee Beans",
      amount_per_unit: 18,
      unit: "g",
      is_active: 1
    },
    {
      product_id: "latte",
      material_id: "milk",
      material_name: "Whole Milk",
      amount_per_unit: 220,
      unit: "ml",
      is_active: 1
    },
    {
      product_id: "latte",
      material_id: "syrup",
      material_name: "Vanilla Syrup",
      amount_per_unit: 15,
      unit: "ml",
      is_active: 1
    }
  ],
  mocha: [
    {
      product_id: "mocha",
      material_id: "beans",
      material_name: "Coffee Beans",
      amount_per_unit: 18,
      unit: "g",
      is_active: 1
    },
    {
      product_id: "mocha",
      material_id: "milk",
      material_name: "Whole Milk",
      amount_per_unit: 200,
      unit: "ml",
      is_active: 1
    },
    {
      product_id: "mocha",
      material_id: "chocolate",
      material_name: "Chocolate Sauce",
      amount_per_unit: 25,
      unit: "ml",
      is_active: 1
    }
  ],
  sandwich: [
    {
      product_id: "sandwich",
      material_id: "bread",
      material_name: "Ciabatta Bread",
      amount_per_unit: 1,
      unit: "piece",
      is_active: 1
    },
    {
      product_id: "sandwich",
      material_id: "pesto",
      material_name: "Basil Pesto",
      amount_per_unit: 25,
      unit: "g",
      is_active: 1
    }
  ],
  salad: [
    {
      product_id: "salad",
      material_id: "greens",
      material_name: "Mixed Greens",
      amount_per_unit: 70,
      unit: "g",
      is_active: 1
    }
  ]
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { message: "productId is required" },
      { status: 400 }
    );
  }

  return NextResponse.json(recipes[productId] ?? []);
}
