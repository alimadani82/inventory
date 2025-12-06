"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Product, Material, RecipeRow, ProductionPayload } from "@/types";
import { MaterialUsage, useProductionStore } from "@/store/production-store";
import { ProductCard } from "@/components/product-card";
import { SearchInput } from "@/components/search-input";
import { Stepper } from "@/components/stepper";
import { MaterialsTable } from "@/components/materials-table";
import { SummaryView } from "@/components/summary-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

const operatorSchema = z.object({
  operator_name: z.string().min(1, "نام اپراتور الزامی است")
});

const steps = [
  { id: 1, title: "انتخاب محصولات", description: "انتخاب آیتم و تعداد" },
  { id: 2, title: "مواد اولیه", description: "بازبینی و ویرایش مصرف" },
  { id: 3, title: "جمع‌بندی", description: "تایید و ثبت" }
];

const fetchMenuItems = async (): Promise<Product[]> => {
  const res = await fetch("/api/menu-items");
  if (!res.ok) throw new Error("خطا در دریافت منو");
  const data = await res.json();
  return data.items ?? [];
};

const fetchMaterials = async (): Promise<Material[]> => {
  const res = await fetch("/api/materials");
  if (!res.ok) throw new Error("خطا در دریافت موجودی");
  const data = await res.json();
  return data.materials ?? [];
};

const fetchRecipes = async (productId: string): Promise<RecipeRow[]> => {
  const res = await fetch(`/api/recipes?productId=${productId}`);
  if (!res.ok) throw new Error("خطا در دریافت دستور تولید");
  const data = await res.json();
  return data.recipes ?? [];
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraSearch, setExtraSearch] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const {
    selectedProducts,
    setProductQuantity,
    materials,
    setMaterials,
    updateMaterialAmount,
    addExtraMaterial,
    reset
  } = useProductionStore();

  const selectedProductsArr = useMemo(
    () => Object.values(selectedProducts),
    [selectedProducts]
  );
  const materialList = useMemo(() => Object.values(materials), [materials]);

  const form = useForm<z.infer<typeof operatorSchema>>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      operator_name: ""
    }
  });

  const menuQuery = useQuery<Product[]>({
    queryKey: ["menu-items"],
    queryFn: fetchMenuItems,
    staleTime: 300000,
    gcTime: 600000,
    retry: 1
  });

  const inventoryQuery = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: fetchMaterials,
    enabled: step >= 2,
    staleTime: 300000,
    gcTime: 600000,
    retry: 1
  });

  const recipeQuery = useQuery<Record<string, RecipeRow[]>>({
    queryKey: ["recipes", selectedProductsArr.map((p) => p.id)],
    queryFn: async () => {
      const results = await Promise.all(
        selectedProductsArr.map(async (product) => {
          const rows = await fetchRecipes(product.id);
          return { productId: product.id, rows };
        })
      );

      return results.reduce<Record<string, RecipeRow[]>>((acc, item) => {
        acc[item.productId] = item.rows;
        return acc;
      }, {});
    },
    enabled: step >= 2 && selectedProductsArr.length > 0
  });

  const filteredMenu = useMemo(() => {
    const data = menuQuery.data ?? [];
    return data
      .filter((item) => item.is_active === 1)
      .filter((item) =>
        search ? item.name.toLowerCase().includes(search) : true
      );
  }, [menuQuery.data, search]);

  const computeMaterials = useCallback(() => {
    if (!inventoryQuery.data || !recipeQuery.data) return;
    const aggregated: Record<string, MaterialUsage> = {};
    const currentMaterials = useProductionStore.getState().materials;

    selectedProductsArr.forEach((product) => {
      const rows = (recipeQuery.data?.[product.id] ?? []).filter(
        (row) => row.is_active === 1
      );

      rows.forEach((row) => {
        const suggested = product.qty * row.amount_per_unit;
        if (aggregated[row.material_id]) {
          aggregated[row.material_id] = {
            ...aggregated[row.material_id],
            suggested:
              aggregated[row.material_id].suggested + suggested,
            final: aggregated[row.material_id].final + suggested,
            sourceProducts: [
              ...new Set([
                ...aggregated[row.material_id].sourceProducts,
                product.id
              ])
            ]
          };
        } else {
          const inventory = inventoryQuery.data.find(
            (mat) => mat.id === row.material_id
          );
          const previous = currentMaterials[row.material_id];

          aggregated[row.material_id] = {
            id: row.material_id,
            name: row.material_name,
            unit: row.unit || inventory?.base_unit || "",
            suggested,
            final: previous?.final ?? suggested,
            base_unit: inventory?.base_unit,
            isExtra: previous?.isExtra ?? false,
            sourceProducts: [product.id]
          };
        }
      });
    });

    // Bring forward manual extras
    Object.values(currentMaterials)
      .filter((mat) => mat.isExtra && !aggregated[mat.id])
      .forEach((mat) => {
        aggregated[mat.id] = mat;
      });

    setMaterials(Object.values(aggregated));
  }, [inventoryQuery.data, recipeQuery.data, selectedProductsArr, setMaterials]);

  useEffect(() => {
    if (step === 2 && selectedProductsArr.length > 0) {
      computeMaterials();
    }
    if (step === 2 && selectedProductsArr.length === 0) {
      setMaterials([]);
    }
  }, [computeMaterials, step, selectedProductsArr, setMaterials]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitMessage("");
    setSubmitError("");

    const payload: ProductionPayload = {
      timestamp: new Date().toISOString(),
      operator_name: values.operator_name,
      source: "webapp",
      products: selectedProductsArr.map((p) => ({
        id: p.id,
        name: p.name,
        qty: p.qty,
        unit: p.unit
      })),
      consumed_materials: materialList.map((m) => ({
        id: m.id,
        name: m.name,
        amount: Number(m.final),
        unit: m.unit
      }))
    };

    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error("ثبت ناموفق بود");
      }
      setSubmitMessage("ثبت تولید با موفقیت انجام شد.");
      reset();
      setStep(1);
      form.reset();
    } catch (err) {
      setSubmitError("امکان ثبت وجود ندارد. دوباره تلاش کنید.");
    }
  });

  const disabledNextStep =
    step === 1 ? selectedProductsArr.length === 0 : step === 2 && materialList.length === 0;

  const availableExtras = (inventoryQuery.data ?? []).filter(
    (mat) => !materials[mat.id]
  );

  return (
    <main className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">فرآیند تولید کافه</p>
          <h1 className="text-2xl font-bold">برنامه‌ریزی تولید و مصرف مواد</h1>
          <p className="text-sm text-muted-foreground">
            متصل به Google Sheets و در صورت نیاز وب‌هوک n8n.
          </p>
        </div>
        <Badge variant="secondary" className="self-start">
          اتصال مستقیم به شیت
        </Badge>
      </div>

      <Stepper steps={steps} activeStep={step} />

      <section className="rounded-2xl border bg-white/80 p-4 shadow-sm sm:p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                placeholder="جستجوی نوشیدنی یا غذا..."
                onSearch={setSearch}
              />
              <p className="text-sm text-muted-foreground">
                انتخاب شده:{" "}
                <span className="font-semibold text-foreground">
                  {selectedProductsArr.length}
                </span>
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={disabledNextStep}
                className="inline-flex items-center gap-1"
              >
                ادامه
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {menuQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                در حال بارگذاری منو...
              </div>
            )}
            {menuQuery.isError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                بارگذاری منو انجام نشد.
              </div>
            )}
            {!menuQuery.isLoading && filteredMenu.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                چیزی پیدا نشد. دوباره جستجو کنید.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMenu.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  qty={selectedProducts[item.id]?.qty ?? 0}
                  onChange={(value) => setProductQuantity(item, value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {(recipeQuery.isLoading || inventoryQuery.isLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                در حال محاسبه مواد...
              </div>
            )}
            {(recipeQuery.isError || inventoryQuery.isError) && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                دریافت دستور یا موجودی انجام نشد.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                محصولات انتخاب‌شده: {selectedProductsArr.length}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                مواد اولیه: {materialList.length}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExtraModal(true)}
                className="inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                افزودن ماده اضافی
              </Button>
            </div>

            <MaterialsTable
              materials={materialList}
              onChangeAmount={(id, value) => updateMaterialAmount(id, value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
            <SummaryView
              products={selectedProductsArr}
              materials={materialList}
            />
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div>
                <label className="text-sm font-semibold" htmlFor="operator_name">
                  نام اپراتور
                </label>
                <Input
                  id="operator_name"
                  placeholder="چه کسی ثبت می‌کند؟"
                  {...form.register("operator_name")}
                />
                {form.formState.errors.operator_name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.operator_name.message}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                با ثبت، درخواست به <code>/api/production</code> ارسال می‌شود.
              </div>
              <Button type="submit" className="mt-2">
                ثبت تولید
              </Button>
              {submitMessage && (
                <p className="text-sm font-semibold text-emerald-600">
                  {submitMessage}
                </p>
              )}
              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}
            </form>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            مرحله {step} از ۳
            {step === 2 && (
              <span className="text-xs text-orange-500">
                مقادیر پیشنهادی قابل ویرایش هستند.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                بازگشت
              </Button>
            )}
            {step < 3 && step > 1 && (
              <Button
                type="button"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={disabledNextStep}
                className="inline-flex items-center gap-1"
              >
                ادامه
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={showExtraModal}
        onClose={() => setShowExtraModal(false)}
        title="افزودن ماده اضافی"
      >
        <Input
          placeholder="جستجوی موجودی..."
          value={extraSearch}
          onChange={(e) => setExtraSearch(e.target.value)}
        />
        <div className="max-h-64 space-y-2 overflow-auto pr-1">
          {availableExtras
            .filter((mat) =>
              extraSearch
                ? mat.name.toLowerCase().includes(extraSearch.toLowerCase())
                : true
            )
            .map((mat) => (
              <button
                key={mat.id}
                onClick={() => {
                  addExtraMaterial(mat);
                  setShowExtraModal(false);
                  setExtraSearch("");
                }}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5"
              >
                <div>
                  <p className="font-semibold">{mat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    واحد پایه: {mat.base_unit}
                  </p>
                </div>
                <Badge variant="outline">{mat.base_unit}</Badge>
              </button>
            ))}
          {availableExtras.length === 0 && (
            <p className="text-sm text-muted-foreground">
              همه مواد اضافه شده‌اند.
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          مواد اضافه‌شده با مقدار صفر شروع می‌شوند؛ مقدار دلخواه را وارد کنید.
        </p>
      </Modal>
    </main>
  );
}
