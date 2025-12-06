import { create } from "zustand";
import { Material, Product } from "@/types";

export type SelectedProduct = Product & { qty: number };

export type MaterialUsage = {
  id: string;
  name: string;
  unit: string;
  suggested: number;
  final: number;
  base_unit?: string;
  isExtra?: boolean;
  sourceProducts: string[];
};

type ProductionState = {
  selectedProducts: Record<string, SelectedProduct>;
  materials: Record<string, MaterialUsage>;
  setProductQuantity: (product: Product, qty: number) => void;
  setMaterials: (materials: MaterialUsage[]) => void;
  updateMaterialAmount: (id: string, amount: number) => void;
  addExtraMaterial: (material: Material) => void;
  reset: () => void;
};

export const useProductionStore = create<ProductionState>((set) => ({
  selectedProducts: {},
  materials: {},
  setProductQuantity: (product, qty) =>
    set((state) => {
      const next = { ...state.selectedProducts };
      if (qty <= 0) {
        delete next[product.id];
      } else {
        next[product.id] = { ...product, qty };
      }
      return { selectedProducts: next };
    }),
  setMaterials: (materials) =>
    set(() => {
      const map: Record<string, MaterialUsage> = {};
      materials.forEach((m) => {
        map[m.id] = m;
      });
      return { materials: map };
    }),
  updateMaterialAmount: (id, amount) =>
    set((state) => {
      const current = state.materials[id];
      if (!current) return state;
      return {
        materials: {
          ...state.materials,
          [id]: { ...current, final: amount }
        }
      };
    }),
  addExtraMaterial: (material) =>
    set((state) => {
      if (state.materials[material.id]) return state;
      return {
        materials: {
          ...state.materials,
          [material.id]: {
            id: material.id,
            name: material.name,
            unit: material.base_unit,
            suggested: 0,
            final: 0,
            base_unit: material.base_unit,
            isExtra: true,
            sourceProducts: []
          }
        }
      };
    }),
  reset: () => ({ selectedProducts: {}, materials: {} })
}));
