import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { uid } from "@/src/format";
import { storage } from "@/src/utils/storage";

export type PayStatus = "lunas" | "cicil" | "belum";
export type OpCost = { id: string; name: string; amount: number };
export type Category = { id: string; name: string; opCosts: OpCost[] };
export type Product = { id: string; name: string; sellPrice: number; costPrice: number; createdAt: string; categoryId?: string; buyPrice?: number; buyQty?: number };
export type TxItem = { productId: string; name: string; qty: number; price: number; cost: number; categoryId?: string; opCost?: number };
export type Payment = { amount: number; date: string };
export type Tx = {
  id: string;
  items: TxItem[];
  total: number;
  profit: number;
  status: PayStatus;
  customer: string;
  payments: Payment[];
  cash: number;
  change: number;
  createdAt: string;
};
export type AppData = { products: Product[]; transactions: Tx[]; categories: Category[] };

const KEY = "catatgrosir_data_v1";

export const opPerUnit = (c?: Category) => (c ? c.opCosts.reduce((a, o) => a + o.amount, 0) : 0);
export const txOp = (t: Tx) => t.items.reduce((a, i) => a + (i.opCost || 0) * i.qty, 0);
export const paidOf = (t: Tx) => t.payments.reduce((a, p) => a + p.amount, 0);
export const remainingOf = (t: Tx) => Math.max(0, t.total - paidOf(t));

type Ctx = {
  ready: boolean;
  data: AppData;
  soldCount: Record<string, number>;
  findByName: (name: string) => Product | undefined;
  createProduct: (name: string, sell: number, cost: number, extra?: Partial<Product>) => Product;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (t: Omit<Tx, "id" | "createdAt">) => Tx;
  deleteTransaction: (id: string) => void;
  addPayment: (txId: string, amount: number) => void;
  replaceAll: (d: AppData) => void;
  toast: (msg: string, tone?: "success" | "error") => void;
  toastMsg: { msg: string; tone: "success" | "error" } | null;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ products: [], transactions: [], categories: [] });
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<Ctx["toastMsg"]>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    storage.getItem(KEY, "").then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw as string);
          if (Array.isArray(d.products) && Array.isArray(d.transactions)) setData({ ...d, categories: d.categories || [] });
        } catch {}
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) storage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const toast = useCallback((msg: string, tone: "success" | "error" = "success") => {
    setToastMsg({ msg, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const soldCount = useMemo(() => {
    const m: Record<string, number> = {};
    data.transactions.forEach((t) => t.items.forEach((i) => (m[i.productId] = (m[i.productId] || 0) + i.qty)));
    return m;
  }, [data.transactions]);

  const findByName = useCallback(
    (name: string) => data.products.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()),
    [data.products],
  );

  const createProduct = (name: string, sell: number, cost: number, extra?: Partial<Product>) => {
    const p: Product = { ...extra, id: uid(), name: name.trim(), sellPrice: sell, costPrice: cost, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, products: [...d.products, p] }));
    return p;
  };

  const saveCategory = (c: Category) =>
    setData((d) => ({
      ...d,
      categories: d.categories.some((x) => x.id === c.id) ? d.categories.map((x) => (x.id === c.id ? c : x)) : [...d.categories, c],
    }));

  const deleteCategory = (id: string) =>
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      products: d.products.map((p) => (p.categoryId === id ? { ...p, categoryId: undefined } : p)),
    }));

  const updateProduct = (id: string, patch: Partial<Product>) =>
    setData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const deleteProduct = (id: string) => setData((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));

  const addTransaction = (t: Omit<Tx, "id" | "createdAt">) => {
    const tx: Tx = { ...t, id: uid(), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, transactions: [tx, ...d.transactions] }));
    return tx;
  };

  const deleteTransaction = (id: string) =>
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));

  const addPayment = (txId: string, amount: number) =>
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((t) => {
        if (t.id !== txId) return t;
        const nt = { ...t, payments: [...t.payments, { amount, date: new Date().toISOString() }] };
        if (remainingOf(nt) <= 0) nt.status = "lunas";
        else nt.status = "cicil";
        return nt;
      }),
    }));

  const replaceAll = (d: AppData) => setData({ ...d, categories: d.categories || [] });

  return (
    <StoreCtx.Provider
      value={{ ready, data, soldCount, findByName, createProduct, saveCategory, deleteCategory, updateProduct, deleteProduct, addTransaction, deleteTransaction, addPayment, replaceAll, toast, toastMsg }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
