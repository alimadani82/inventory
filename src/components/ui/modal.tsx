"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="text-base font-semibold">{title}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            بستن
          </Button>
        </div>
        <div className={cn("p-5 space-y-4")}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
