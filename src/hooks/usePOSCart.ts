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

  // Devuelve true si pudo agregar todo lo pedido, false si se topó con el stock.
  const add = useCallback((p: MockProducto, cantidad = 1): boolean => {
    let ok = true;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.producto.id === p.id);
      const actual = idx >= 0 ? prev[idx].cantidad : 0;
      const stock = Number(p.stock ?? 0);
      const disponible = Math.max(0, stock - actual);
      const aAgregar = Math.min(cantidad, disponible);
      if (aAgregar < cantidad) ok = false;
      if (aAgregar <= 0) return prev;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: actual + aAgregar };
        return copy;
      }
      return [...prev, { producto: p, cantidad: aAgregar, descuento: 0 }];
    });
    return ok;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== id));
  }, []);

  // Devuelve true si la cantidad pedida cabe en el stock disponible.
  const setCantidad = useCallback((id: string, cantidad: number): boolean => {
    let ok = true;
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== id) return i;
          const stock = Number(i.producto.stock ?? 0);
          const clamp = Math.min(Math.max(0, cantidad), stock);
          if (clamp < cantidad) ok = false;
          return { ...i, cantidad: clamp };
        })
        .filter((i) => i.cantidad > 0),
    );
    return ok;
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