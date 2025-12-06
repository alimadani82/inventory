import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn"
});

export const metadata: Metadata = {
  title: "مدیریت تولید کافه",
  description: "ثبت تولید و مصرف مواد در کافه"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-100 font-[var(--font-vazirmatn)] text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
