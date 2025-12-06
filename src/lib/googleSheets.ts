import "server-only";

import { google, sheets_v4 } from "googleapis";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { ConsumedMaterial, Material, Product, RecipeRow } from "@/types";

type CacheEntry<T> = { value: T; timestamp: number };

const TTL_MS = 300_000; // 5 minute cache for menu/materials

const cache: {
  menu?: CacheEntry<Product[]>;
  materials?: CacheEntry<Material[]>;
  recipes?: CacheEntry<RecipeRow[]>;
  localRecipes?: CacheEntry<RecipeRow[]>;
} = {};

const LOCAL_MENU_RAW = `
PROD-1	کوکی قهوه	نوشیدنی	cup	1
PROD-2	اسپرسو عربیکا	نوشیدنی	cup	1
PROD-3	چیکن الفردو	غذا	pcs	1
PROD-4	چیکن تریاکی	غذا	pcs	1
PROD-5	فرانسه	شیرینی	pcs	1
PROD-6	امریکن عربیکا	شیرینی	pcs	1
PROD-7	نرگسی	غذا	pcs	1
PROD-8	بورک پنیر اسفناج	نان	pcs	1
PROD-9	سیمیت پومودور	نان	pcs	1
PROD-10	آیس امریکن 70 عربیکا	نوشیدنی	cup	1
PROD-11	آیس امریکن عربیکا	نوشیدنی	cup	1
PROD-12	فراپاچینو کلاسیک	نوشیدنی	cup	1
PROD-13	فراپاچینو انتخابی	نوشیدنی	cup	1
PROD-14	فراپاچینو ویلیج	نوشیدنی	cup	1
PROD-15	100+	نوشیدنی	cup	1
PROD-16	تارت سیب رازیانه	شیرینی	pcs	1
PROD-17	سنتونوره	شیرینی	pcs	1
PROD-18	فرزیه	شیرینی	pcs	1
PROD-19	چیز کیک	شیرینی	pcs	1
PROD-20	تیرامیسو	نوشیدنی	cup	1
PROD-21	کیک شکلاتی	نوشیدنی	cup	1
PROD-22	کوکی	شیرینی	pcs	1
PROD-23	پالمیر	شیرینی	pcs	1
PROD-24	کوکی بادام	شیرینی	pcs	1
PROD-25	کوکی شکلات	شیرینی	pcs	1
PROD-26	کارامل	شیرینی	pcs	1
PROD-27	وانیل	شیرینی	pcs	1
PROD-28	شکلات	شیرینی	pcs	1
PROD-29	کارامل نمکی	شیرینی	pcs	1
PROD-30	فندوق	شیرینی	pcs	1
PROD-31	شکلات کوکی	شیرینی	pcs	1
PROD-32	نارگیل	شیرینی	pcs	1
PROD-33	پامکین اسپایسی	شیرینی	pcs	1
PROD-34	ایریش	شیرینی	pcs	1
PROD-35	افرا	شیرینی	pcs	1
PROD-36	ساید خامه	شیرینی	pcs	1
PROD-37	املت	غذا	pcs	1
PROD-38	املت بلوچیز	غذا	pcs	1
PROD-39	تست اسکرامبل	شیرینی	pcs	1
PROD-40	سیمیت ایرانی	نان	pcs	1
PROD-41	سیمیت اردشیر	نان	pcs	1
PROD-42	تست مولتی گرین	نوشیدنی	cup	1
PROD-43	کروسان بیکن	شیرینی	pcs	1
PROD-44	چاباتا بوقلمون	نان	pcs	1
PROD-45	چاباتا بیکن بره	نان	pcs	1
PROD-46	کروسان بیکن	شیرینی	pcs	1
PROD-47	تست گردو	شیرینی	pcs	1
PROD-48	آب معدنی	نوشیدنی	cup	1
PROD-49	چاپاتا	شیرینی	pcs	1
PROD-50	سیمیت	نان	pcs	1
PROD-51	فوکاچیا	نان	pcs	1
PROD-52	کروسان کره ای	شیرینی	pcs	1
PROD-53	جویس	شیرینی	pcs	1
PROD-54	جویس	شیرینی	pcs	1
PROD-55	کیک هویج	شیرینی	pcs	1
PROD-56	کیک هویج	شیرینی	pcs	1
PROD-57	دنیش میوه ای	شیرینی	pcs	1
PROD-58	دنیش لوتوس	شیرینی	pcs	1
PROD-59	بابونه	شیرینی	pcs	1
PROD-60	عسل	شیرینی	pcs	1
PROD-61	شیر گرم	شیرینی	pcs	1
PROD-62	شیر گیاهی	شیرینی	pcs	1
PROD-63	آویشن	شیرینی	pcs	1
PROD-64	کلد برو لیموناد	نوشیدنی	cup	1
PROD-65	فرانسه پرسنلی	شیرینی	pcs	1
PROD-66	آیس نوتلا لاته	نوشیدنی	cup	1
PROD-67	آیس باتر لاته	نوشیدنی	cup	1
PROD-68	آیس فدرال	نوشیدنی	cup	1
PROD-69	آیس فرانسه	نوشیدنی	cup	1
PROD-70	آیس چاکلت	نوشیدنی	cup	1
PROD-71	لاته کارامل	نوشیدنی	cup	1
PROD-72	آیس لاته کارامل	نوشیدنی	cup	1
PROD-73	کیک سه شیر	شیرینی	pcs	1
PROD-74	کیک سه شیر 1	شیرینی	pcs	1
PROD-75	دنیش بادام و سیب	شیرینی	pcs	1
PROD-76	آیس ماچا لاته	نوشیدنی	cup	1
PROD-77	کیوب کروسان اسنیکرز	شیرینی	pcs	1
PROD-78	سیمیت اسفناج	نان	pcs	1
PROD-79	لیوان 300 سی سی	نوشیدنی	cup	1
PROD-80	لیوان 400 سی سی	نوشیدنی	cup	1
PROD-81	لیوان اسپرسو	نوشیدنی	cup	1
PROD-82	لیوان کاپوچینو	نوشیدنی	cup	1
PROD-83	لیوان لاته	نوشیدنی	cup	1
PROD-84	بگ بزرگ	شیرینی	pcs	1
PROD-85	نیویورک رول موز	شیرینی	pcs	1
PROD-86	اوت میل وانیل	شیرینی	pcs	1
PROD-87	اوت میل وانیل	شیرینی	pcs	1
PROD-88	اوت میل شکلات	شیرینی	pcs	1
PROD-89	چاباتا چیکو	نان	pcs	1
PROD-90	فوکاچیا پپرونی	نان	pcs	1
PROD-91	فوکوری کوچیک	شیرینی	pcs	1
PROD-92	پک کارد و چنگال	شیرینی	pcs	1
PROD-93	پک کارد و چنگال	شیرینی	pcs	1
PROD-94	چیزکیک سن سباستین	نوشیدنی	cup	1
PROD-95	آیس کرتادو	نوشیدنی	cup	1
PROD-96	تیرامیسو	نوشیدنی	cup	1
PROD-97	سبله بورتون	شیرینی	pcs	1
PROD-98	تارت استوایی	شیرینی	pcs	1
PROD-99	*تارت استوایی	شیرینی	pcs	1
PROD-100	اب هندوانه	نوشیدنی	cup	1
PROD-101	ناهار پرسنلی	شیرینی	pcs	1
PROD-102	ناهار پرسنلی	شیرینی	pcs	1
PROD-103	ناهار پرسنلی	شیرینی	pcs	1
PROD-104	هولدر دوتایی	شیرینی	pcs	1
PROD-105	هولدر چهارتایی	شیرینی	pcs	1
PROD-106	دمنوش انتخابی	شیرینی	pcs	1
PROD-107	دمی 90 دو نفره	نوشیدنی	cup	1
PROD-108	شربت انتخابی	شیرینی	pcs	1
PROD-109	تارت شکلات فندق	شیرینی	pcs	1
PROD-110	سس دستساز	شیرینی	pcs	1
PROD-111	افزودنی	شیرینی	pcs	1
PROD-112	فرنچ تست	شیرینی	pcs	1
PROD-113	کلدبرو سیب	شیرینی	pcs	1
PROD-114	فوکوری بزرگ	شیرینی	pcs	1
PROD-115	فوکوری بزرگ	شیرینی	pcs	1
PROD-116	اسپرسو 70 عربیکا	نوشیدنی	cup	1
PROD-117	امریکانو 70 عربیکا	نوشیدنی	cup	1
PROD-118	لاته	نوشیدنی	cup	1
PROD-119	کاپوچینو	نوشیدنی	cup	1
PROD-120	موکا	نوشیدنی	cup	1
PROD-121	کن پانا	شیرینی	pcs	1
PROD-122	کرتادو	نوشیدنی	cup	1
PROD-123	باتر لاته	نوشیدنی	cup	1
PROD-124	لاته شیر گیاهی	نوشیدنی	cup	1
PROD-125	افوگاتو	شیرینی	pcs	1
PROD-126	افوگاتو غلات	شیرینی	pcs	1
PROD-127	فدرال	شیرینی	pcs	1
PROD-128	نوتلا لاته	نوشیدنی	cup	1
PROD-129	کن هیلو	شیرینی	pcs	1
PROD-130	آیس امریکن	نوشیدنی	cup	1
PROD-131	آیس لاته	نوشیدنی	cup	1
PROD-132	آیس موکا	نوشیدنی	cup	1
PROD-133	دمی 80+	نوشیدنی	cup	1
PROD-134	دمی 85+	نوشیدنی	cup	1
PROD-135	دمی 80+ دو نفره	نوشیدنی	cup	1
PROD-136	دمی 85+دو نفره	نوشیدنی	cup	1
PROD-137	دمی 90+	نوشیدنی	cup	1
PROD-138	دیکف	شیرینی	pcs	1
PROD-139	دمی رست خارج	شیرینی	pcs	1
PROD-140	برو ماشین	شیرینی	pcs	1
PROD-141	کلد برو	شیرینی	pcs	1
PROD-142	هات چاکلیت	شیرینی	pcs	1
PROD-143	هات چاکلیت فرانسوی	شیرینی	pcs	1
PROD-144	چای ماسالا	نوشیدنی	cup	1
PROD-145	چای کرک	نوشیدنی	cup	1
PROD-146	وایت چاکلیت	شیرینی	pcs	1
PROD-147	چای لاته	نوشیدنی	cup	1
PROD-148	ماچا لاته	نوشیدنی	cup	1
PROD-149	شکوفه یاس ژاپنی	شیرینی	pcs	1
PROD-150	نوستالژیک کودکانه	شیرینی	pcs	1
PROD-151	زمستان سرخ	شیرینی	pcs	1
PROD-152	شبنم صبحگاهی	شیرینی	pcs	1
PROD-153	ریبوس	شیرینی	pcs	1
PROD-154	بوته عسل	شیرینی	pcs	1
PROD-155	شکوفه گیلاس (دونفره)	شیرینی	pcs	1
PROD-156	نتوستالژیک کودکانه (دونفره)	شیرینی	pcs	1
PROD-157	زمستان سرخ (دونفره)	شیرینی	pcs	1
PROD-158	شبنم صبحگاهی (دونفره)	شیرینی	pcs	1
PROD-159	ریبوس (دونفره)	شیرینی	pcs	1
PROD-160	بوته عسل (دونفره)	شیرینی	pcs	1
PROD-161	بابا کوهی	شیرینی	pcs	1
PROD-162	شتر گلو	شیرینی	pcs	1
PROD-163	عتیق	نوشیدنی	cup	1
PROD-164	چهارطاق	شیرینی	pcs	1
PROD-165	قله رود خان	شیرینی	pcs	1
PROD-166	دلگشا	شیرینی	pcs	1
PROD-167	تاج محل	شیرینی	pcs	1
PROD-168	بابا کوهی (دونفره)	شیرینی	pcs	1
PROD-169	شتر گلو (دونفره)	شیرینی	pcs	1
PROD-170	عتیق (دونفره)	نوشیدنی	cup	1
PROD-171	چهارطاق (دونفره)	شیرینی	pcs	1
PROD-172	قله رود خان (دونفره)	شیرینی	pcs	1
PROD-173	دلگشا (دونفره)	شیرینی	pcs	1
PROD-174	تاج محل (دونفره)	شیرینی	pcs	1
PROD-175	چای دست چین فومن	نوشیدنی	cup	1
PROD-176	چای دست چین لاهیجان	نوشیدنی	cup	1
PROD-177	چای سبز دستچین	نوشیدنی	cup	1
PROD-178	چای دست چین فومن (دونفره)	نوشیدنی	cup	1
PROD-179	چای دست چین لاهیجان (دونفره)	نوشیدنی	cup	1
PROD-180	چای سبز دستچین  (دونفره)	نوشیدنی	cup	1
PROD-181	لیموناد	نوشیدنی	cup	1
PROD-182	موهیتو	شیرینی	pcs	1
PROD-183	چیل این گلک	شیرینی	pcs	1
PROD-184	شیرازی شاردونی	شیرینی	pcs	1
PROD-185	سیتروس ویت برو	شیرینی	pcs	1
PROD-186	جیمبو	شیرینی	pcs	1
PROD-187	رنگو	شیرینی	pcs	1
PROD-188	سالیوان	شیرینی	pcs	1
PROD-189	سیمبا	شیرینی	pcs	1
PROD-190	رنچو فارم	شیرینی	pcs	1
PROD-191	لیچی اسپریتز	شیرینی	pcs	1
PROD-192	وینو شیک	نوشیدنی	cup	1
PROD-193	چیتزو شیک	نوشیدنی	cup	1
PROD-194	برانو شیک	نوشیدنی	cup	1
PROD-195	اسپایسوتی	نوشیدنی	cup	1
PROD-196	فروتوتی	نوشیدنی	cup	1
PROD-197	فلاورتی	نوشیدنی	cup	1
PROD-198	کروسان کره ای	شیرینی	pcs	1
PROD-199	کروسان پسته	شیرینی	pcs	1
PROD-200	کروسان بادام	شیرینی	pcs	1
PROD-201	کروسان شکلات	شیرینی	pcs	1
PROD-202	نیویورک رول توتفرنگی	شیرینی	pcs	1
PROD-203	نیویورک رول وانیل	شیرینی	pcs	1
PROD-204	نیویورک رول شکلاتی	نوشیدنی	cup	1
PROD-205	رول دارچین	شیرینی	pcs	1
PROD-206	میل فوی	شیرینی	pcs	1
PROD-207	سبد میوه	شیرینی	pcs	1
PROD-208	گلت سیب	شیرینی	pcs	1
PROD-209	گلت موزکارامل	شیرینی	pcs	1
PROD-210	اکلر	شیرینی	pcs	1
PROD-211	کیوب کروسان لوتوس	شیرینی	pcs	1
PROD-212	پاریس برست	شیرینی	pcs	1
PROD-213	تارت شکلات سفید کاراملی	شیرینی	pcs	1
PROD-214	تارت شکلات فندوق	شیرینی	pcs	1
PROD-215	تارت پسته توتفرنگی	شیرینی	pcs	1
`;

const LOCAL_MENU: Product[] = LOCAL_MENU_RAW.trim().split("\n").map((line) => {
  const [id, name, category, unit, isActive] = line.split("\t");
  return {
    id,
    name,
    category,
    unit,
    is_active: toNumber(isActive ?? 0),
    image_url: ""
  } as Product;
});

const LOCAL_MATERIALS_RAW = `
MAT-1	آرد	kg
MAT-2	نان	pcs
MAT-3	آب	L
MAT-4	شکر	kg
MAT-5	روغن	L
MAT-6	خمیر مایه	kg
MAT-7	نمک	kg
MAT-8	تخم مرغ	pcs
MAT-9	شیر	L
MAT-10	کره	kg
MAT-11	وانیل	kg
`;

const LOCAL_MATERIALS: Material[] = LOCAL_MATERIALS_RAW.trim()
  .split("\n")
  .map((line) => {
    const [id, name, base_unit] = line.split("\t");
    return { id, name, base_unit };
  });

let sheetsApi: sheets_v4.Sheets | null = null;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

function getServiceAccountKey(): string {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64;
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return decoded.replace(/\r\n/g, "\n");
  }
  const raw = requireEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  return raw.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function getAuth() {
  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = getServiceAccountKey();

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

function getSheets() {
  if (sheetsApi) return sheetsApi;
  const auth = getAuth();
  sheetsApi = google.sheets({ version: "v4", auth });
  return sheetsApi;
}

function loadLocalRecipes(): RecipeRow[] | null {
  if (process.env.USE_LOCAL_RECIPES !== "true") return null;
  const localPath = process.env.LOCAL_RECIPES_PATH || "local-recipes.json";
  const absPath = path.isAbsolute(localPath)
    ? localPath
    : path.join(process.cwd(), localPath);

  if (!fs.existsSync(absPath)) {
    console.warn(`Local recipes file not found at ${absPath}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(absPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: any) => ({
      ...r,
      amount_per_unit: toNumber(r.amount_per_unit),
      is_active: toNumber(r.is_active ?? 0)
    }));
  } catch (err) {
    console.error("Failed to read local recipes", err);
    return [];
  }
}

function parseRows<T extends Record<string, any>>(values: string[][]): T[] {
  if (!values.length) return [];
  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, idx) => {
      obj[header.trim()] = row[idx];
    });
    return obj as T;
  });
}

function toNumber(value: any) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function getMenuItems(): Promise<Product[]> {
  const now = Date.now();
  if (cache.menu && now - cache.menu.timestamp < TTL_MS) {
    return cache.menu.value;
  }

  // Use local static menu to avoid Google Sheets call
  cache.menu = { value: LOCAL_MENU, timestamp: now };
  return LOCAL_MENU;
}

export async function getMaterials(): Promise<Material[]> {
  const now = Date.now();
  if (cache.materials && now - cache.materials.timestamp < TTL_MS) {
    return cache.materials.value;
  }

  cache.materials = { value: LOCAL_MATERIALS, timestamp: now };
  return LOCAL_MATERIALS;
}

export async function getRecipesByProductId(
  productId: string
): Promise<RecipeRow[]> {
  const now = Date.now();
  if (cache.recipes && now - cache.recipes.timestamp < TTL_MS) {
    return cache.recipes.value
      .filter((r) => r.product_id === productId)
      .filter((r) => toNumber((r as any).is_active ?? 0) === 1);
  }

  if (process.env.USE_LOCAL_RECIPES === "true") {
    if (!cache.localRecipes || now - cache.localRecipes.timestamp >= TTL_MS) {
      const local = loadLocalRecipes() ?? [];
      cache.localRecipes = { value: local, timestamp: now };
    }
    return (cache.localRecipes?.value ?? [])
      .filter((r) => r.product_id === productId)
      .filter((r) => toNumber((r as any).is_active ?? 0) === 1);
  }

  const sheets = getSheets();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Recipes!A1:F",
    valueRenderOption: "UNFORMATTED_VALUE"
  });

  const rows = parseRows<RecipeRow>(resp.data.values ?? []).map((r: any) => ({
    ...r,
    amount_per_unit: toNumber(r.amount_per_unit),
    is_active: toNumber(r.is_active ?? 0)
  }));

  cache.recipes = { value: rows, timestamp: now };

  return rows
    .filter((r) => r.product_id === productId)
    .filter((r) => toNumber((r as any).is_active ?? 0) === 1);
}

export async function appendProductionLogRows(rows: string[][]) {
  const sheets = getSheets();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "ProductionLog!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows
    }
  });
}

export async function updateInventoryStocks(
  consumed: ConsumedMaterial[]
): Promise<void> {
  if (!consumed.length) return;

  const sheets = getSheets();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Inventory!A1:Z"
  });
  const values = resp.data.values ?? [];
  if (!values.length) throw new Error("Inventory sheet is empty");

  const headers = values[0];
  const dataRows = values.slice(1);
  const idIdx = headers.indexOf("id");
  const baseUnitIdx = headers.indexOf("base_unit");
  const currentStockIdx = headers.indexOf("current_stock");

  if (idIdx === -1 || baseUnitIdx === -1 || currentStockIdx === -1) {
    throw new Error("Inventory sheet missing required headers");
  }

  const rowMap = new Map<
    string,
    { rowNumber: number; baseUnit: string; currentStock: number }
  >();

  dataRows.forEach((row, idx) => {
    const id = row[idIdx];
    if (!id) return;
    rowMap.set(id, {
      rowNumber: idx + 2, // +2 for 1-based index and header row
      baseUnit: row[baseUnitIdx],
      currentStock: toNumber(row[currentStockIdx])
    });
  });

  const updates: { range: string; values: any[][] }[] = [];

  consumed.forEach((item) => {
    const found = rowMap.get(item.id);
    if (!found) {
      throw new Error(`Material ${item.id} not found in Inventory sheet`);
    }
    if (found.baseUnit && item.unit && found.baseUnit !== item.unit) {
      throw new Error(
        `Unit mismatch for ${item.id}: expected ${found.baseUnit}, got ${item.unit}`
      );
    }
    const nextStock = found.currentStock - item.amount;
    updates.push({
      range: `Inventory!${columnLetter(
        currentStockIdx + 1
      )}${found.rowNumber}`,
      values: [[nextStock]]
    });
  });

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates
      }
    });
    cache.materials = undefined; // bust cache
  }
}

export function createBatchId() {
  return nanoid(10);
}

function columnLetter(column: number): string {
  let temp = "";
  let col = column;
  while (col > 0) {
    let rem = (col - 1) % 26;
    temp = String.fromCharCode(65 + rem) + temp;
    col = Math.floor((col - rem) / 26);
  }
  return temp;
}
