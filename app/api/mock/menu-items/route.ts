import { NextResponse } from "next/server";
import { Product } from "@/types";

const items: Product[] = [
  {
    id: "espresso",
    name: "Double Espresso",
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1510626176961-4b37d0b4e904?auto=format&fit=crop&w=800&q=80",
    unit: "cup",
    is_active: 1
  },
  {
    id: "latte",
    name: "Vanilla Latte",
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    unit: "cup",
    is_active: 1
  },
  {
    id: "mocha",
    name: "Mocha",
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    unit: "cup",
    is_active: 1
  },
  {
    id: "sandwich",
    name: "Pesto Sandwich",
    category: "Kitchen",
    image_url:
      "https://images.unsplash.com/photo-1604908177340-70c4e5c74950?auto=format&fit=crop&w=800&q=80",
    unit: "piece",
    is_active: 1
  },
  {
    id: "salad",
    name: "Quinoa Salad",
    category: "Kitchen",
    image_url:
      "https://images.unsplash.com/photo-1562003389-62c9ac0c9c91?auto=format&fit=crop&w=800&q=80",
    unit: "bowl",
    is_active: 0
  }
];

export async function GET() {
  return NextResponse.json(items);
}
