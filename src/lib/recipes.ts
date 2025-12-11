import "server-only";

import { supabaseServer } from "./supabaseServer";

export type RecipeRow = {
  id: number;
  product_id: string;
  material_id: string;
  material_name: string;
  amount_per_unit: number;
  unit: string;
  is_active: boolean;
};

export async function getRecipesByProductId(
  productId: string
): Promise<RecipeRow[]> {
  const { data, error } = await supabaseServer
    .from("recipes")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) {
    console.error("supabase getRecipesByProductId error", error);
    throw new Error("Failed to load recipes");
  }

  return (data ?? []) as RecipeRow[];
}
