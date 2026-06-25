import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ScanLine,
  Pause,
  Maximize2,
  Smartphone,
  Zap,
  ShoppingBag,
  Package,
  CupSoda,
  Milk,
  Croissant,
  SprayCan,
  Cookie,
  Beef,
  Apple,
  ShoppingBasket,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const ICONS: Record<string, LucideIcon> = {
  ShoppingBasket,
  CupSoda,
  Milk,
  Croissant,
  SprayCan,
  Cookie,
  Beef,
  Apple,
  Layers,
};
import type { MockProducto } from "@/data/mockData";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { TicketModal, type TicketData } from "@/components/pos/TicketModal";
import { usePOSCart } from "@/hooks/usePOSCart";
import { toast } from "sonner";
import { formatPEN } from "@/lib/format";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { registrarVenta } from "@/lib/ventas";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({ meta: [{ title: "Punto de Venta — POS Minimarket" }] }),
  component: POSPage,
});

function POSPage() {
  const cart = usePOSCart();
  const { productos: allProductos, categorias, refresh } = useCatalog();
  const { user, isDemo } = useAuth();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        if (cart.items.length > 0) setCheckoutOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.items.length]);

  // Lector código de barras: input rápido seguido de Enter
  useEffect(() => {
    let buf = "";
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (isInput) return;
      const now = Date.now();
      if (now - last > 100) buf = "";
      last = now;
      if (e.key === "Enter" && buf.length >= 6) {
        const p = allProductos.find((x) => x.codigo_barras === buf);
        if (p) {
          cart.add(p);
          toast.success(`+ ${p.nombre}`);
        } else {
          toast.error("Código no encontrado");
        }
        buf = "";
      } else if (e.key.length === 1) {
        buf += e.key;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart, allProductos]);

  const productos = useMemo(() => {
    let list = allProductos;
    if (cat) list = list.filter((p) => p.categoria_id === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo_barras.includes(q),
      );
    }
    return list;
  }, [query, cat, allProductos]);

  const handlePick = (p: MockProducto) => {
    cart.add(p);
  };

  const confirmarVenta = async (data: {
    tipo_comprobante: string;
    serie: string;
    documento_cliente?: string;
    pagos: { metodo: string; monto: number }[];
  }) => {
    const metodoPrincipal = data.pagos.length > 1
      ? "MIXTO"
      : (data.pagos[0]?.metodo ?? "EFECTIVO");
    const baseTicket = {
      tipo: data.tipo_comprobante as TicketData["tipo"],
      serie: data.serie,
      fecha: new Date(),
      items: cart.items,
      subtotal: cart.totales.subtotal,
      igv: cart.totales.igv,
      total: cart.totales.total,
      metodoPago: metodoPrincipal.replace("_", " "),
      documentoCliente: data.documento_cliente,
    };
    if (isDemo || !user) {
      setCheckoutOpen(false);
      const correlativo = Math.floor(Math.random() * 9000 + 1000);
      setTicket({ ...baseTicket, correlativo });
      cart.clear();
      toast.success(
        `Venta demo · ${data.tipo_comprobante} ${data.serie}-${correlativo}`,
      );
      return;
    }
    try {
      const venta = await registrarVenta({
        items: cart.items,
        tipo_comprobante: data.tipo_comprobante as "BOLETA" | "FACTURA" | "TICKET",
        serie: data.serie,
        pagos: data.pagos,
        subtotal: cart.totales.subtotal,
        igv: cart.totales.igv,
        total: cart.totales.total,
        cajero_id: user.id,
      });
      setCheckoutOpen(false);
      setTicket({ ...baseTicket, correlativo: venta.correlativo });
      cart.clear();
      refresh();
      toast.success(
        `Venta registrada · ${venta.serie}-${String(venta.correlativo).padStart(8, "0")}`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar la venta");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-muted/30">
      {/* Columna productos */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="px-5 pt-4 pb-3 space-y-3">
          {/* Toolbar superior */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="h-11 px-4 border-2 border-amber-400/70 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold rounded-xl"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar Ticket
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 border-2 font-bold rounded-xl"
              onClick={() => document.documentElement.requestFullscreen?.()}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Modo Kiosco
            </Button>
          </div>

          {/* Barcode bar */}
          <div className="relative">
            <ScanLine className="h-6 w-6 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escanea o ingresa código de barras y presiona Enter"
              className="pl-12 h-14 text-base font-medium rounded-xl border-2 border-primary/30 focus-visible:border-primary bg-card"
            />
          </div>

          {/* Categorías (dark pills con icono) */}
          <div className="flex gap-2 overflow-x-auto pb-1 pr-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <CategoryPill
              label="Todas"
              icon={ShoppingBag}
              active={cat === null}
              onClick={() => setCat(null)}
            />
            {categorias.map((c) => {
              const Icon = ICONS[c.icono] ?? Package;
              return (
                <CategoryPill
                  key={c.id}
                  label={c.nombre}
                  icon={Icon}
                  active={cat === c.id}
                  onClick={() => setCat(c.id)}
                />
              );
            })}
          </div>

          {/* Buscador + accesos rápidos */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto (nombre, marca, categoría)…"
                className="pl-10 h-11 rounded-xl bg-card"
              />
            </div>
            <QuickAction icon={Smartphone} label="Recarga Celular" color="text-purple-600" />
            <QuickAction icon={Zap} label="Pago de Servicio" color="text-blue-600" />
            <QuickAction icon={ShoppingBag} label="Bolsa Plástica" color="text-emerald-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <ProductGrid productos={productos} onPick={handlePick} />
        </div>

        <div className="border-t bg-card px-5 py-2 text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Atajos: F1 buscar · F2 cobrar · Escanea para agregar</span>
          <span>
            {productos.length} producto{productos.length !== 1 && "s"} ·{" "}
            {formatPEN(cart.totales.total)} en carrito
          </span>
        </div>
      </div>

      {/* Columna carrito */}
      <div className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l">
      <Cart
        items={cart.items}
        onInc={(id) => {
          const it = cart.items.find((i) => i.producto.id === id);
          if (it) cart.setCantidad(id, it.cantidad + 1);
        }}
        onDec={(id) => {
          const it = cart.items.find((i) => i.producto.id === id);
          if (it) cart.setCantidad(id, it.cantidad - 1);
        }}
        onRemove={cart.remove}
        totales={cart.totales}
        onCheckout={() => setCheckoutOpen(true)}
        onClear={cart.clear}
      />
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={cart.totales.total}
        onConfirm={confirmarVenta}
      />

      <TicketModal
        open={!!ticket}
        onOpenChange={(o) => !o && setTicket(null)}
        ticket={ticket}
      />
    </div>
  );
}

function CategoryPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 px-2.5 h-8 rounded-md text-[11px] font-bold whitespace-nowrap border transition active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-slate-800 text-white border-slate-800 hover:bg-slate-700"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function QuickAction({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
}) {
  return (
    <button
      className="shrink-0 hidden md:inline-flex items-center gap-2 h-11 px-3 rounded-xl bg-card border text-sm font-bold hover:bg-muted transition"
      title={label}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      {label}
    </button>
  );
}