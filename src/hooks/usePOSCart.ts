import { useCallback, useMemo, useState } from "react";
import type { MockProducto } from "@/data/mockData";

export interface CartItem {
  producto: MockProducto;
  cantidad: number;
  descuento: number; // monto S/
}

export function usePOSCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);

  const add = useCallback((p: MockProducto, cantidad = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.producto.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }
      return [...prev, { producto: p, cantidad, descuento: 0 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== id));
  }, []);

  const setCantidad = useCallback((id: string, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.producto.id === id ? { ...i, cantidad: Math.max(0, cantidad) } : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }, []);

  const setDescuento = useCallback((id: string, descuento: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.producto.id === id ? { ...i, descuento: Math.max(0, descuento) } : i,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setDescuentoGlobal(0);
  }, []);

  const totales = useMemo(() => {
    const subtotal = items.reduce(
      (s, i) => s + i.producto.precio_venta * i.cantidad - i.descuento,
      0,
    );
    const totalSinDescGlobal = Math.max(0, subtotal);
    const total = Math.max(0, totalSinDescGlobal - descuentoGlobal);
    const igv = items.reduce((s, i) => {
      if (!i.producto.igv) return s;
      const linea = i.producto.precio_venta * i.cantidad - i.descuento;
      return s + (linea - linea / 1.18);
    }, 0);
    const cantidadItems = items.reduce((s, i) => s + i.cantidad, 0);
    return {
      subtotal: total - igv,
      igv,
      total,
      cantidadItems,
    };
  }, [items, descuentoGlobal]);

  return {
    items,
    add,
    remove,
    setCantidad,
    setDescuento,
    clear,
    descuentoGlobal,
    setDescuentoGlobal,
    totales,
  };
}