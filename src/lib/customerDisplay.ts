// Sincronización entre la ventana del cajero y la pantalla del cliente
import type { CartItem } from "@/hooks/usePOSCart";

export type DisplayPayload = {
  items: { id: string; nombre: string; cantidad: number; precio: number; subtotal: number }[];
  subtotal: number;
  igv: number;
  total: number;
  cantidadItems: number;
  estado: "venta" | "pagado" | "vacio";
  vuelto?: number;
  mensaje?: string;
};

const CHANNEL = "pos-customer-display";

let bc: BroadcastChannel | null = null;
function ch() {
  if (typeof window === "undefined") return null;
  if (!bc) bc = new BroadcastChannel(CHANNEL);
  return bc;
}

export function broadcastCart(items: CartItem[], totales: { subtotal: number; igv: number; total: number; cantidadItems: number }) {
  const payload: DisplayPayload = {
    items: items.map((i) => ({
      id: i.producto.id,
      nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precio: i.producto.precio_venta,
      subtotal: i.producto.precio_venta * i.cantidad - i.descuento,
    })),
    subtotal: totales.subtotal,
    igv: totales.igv,
    total: totales.total,
    cantidadItems: totales.cantidadItems,
    estado: items.length === 0 ? "vacio" : "venta",
  };
  ch()?.postMessage(payload);
  try { localStorage.setItem("pos-display-last", JSON.stringify(payload)); } catch {}
}

export function broadcastPagado(total: number, vuelto: number) {
  const payload: DisplayPayload = {
    items: [], subtotal: 0, igv: 0, total, cantidadItems: 0,
    estado: "pagado", vuelto, mensaje: "¡Gracias por su compra!",
  };
  ch()?.postMessage(payload);
  try { localStorage.setItem("pos-display-last", JSON.stringify(payload)); } catch {}
}

export function subscribeDisplay(cb: (p: DisplayPayload) => void) {
  const c = ch();
  if (!c) return () => {};
  const handler = (e: MessageEvent<DisplayPayload>) => cb(e.data);
  c.addEventListener("message", handler);
  // Recuperar último estado al abrir
  try {
    const last = localStorage.getItem("pos-display-last");
    if (last) cb(JSON.parse(last));
  } catch {}
  return () => c.removeEventListener("message", handler);
}

export function openCustomerDisplay() {
  window.open("/cliente-display", "pos-cliente", "width=1024,height=768");
}
