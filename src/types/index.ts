export type Product = {
  id: string;
  name: string;
  category: string;
  image_url: string;
  unit: string;
  is_active: number;
};

export type Material = {
  id: string;
  name: string;
  base_unit: string;
};

export type RecipeRow = {
  id?: number;
  product_id: string;
  material_id: string;
  material_name: string;
  amount_per_unit: number;
  unit: string;
  is_active: boolean;
};

export type ConsumedMaterial = {
  id: string;
  name: string;
  amount: number;
  unit: string;
};

export type ProductionPayload = {
  timestamp: string;
  operator_name: string;
  products: Array<{ id: string; name: string; qty: number; unit: string }>;
  consumed_materials: ConsumedMaterial[];
  source: string;
};
