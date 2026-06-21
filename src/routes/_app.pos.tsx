import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockCategorias, mockProductos, type MockProducto } from "@/data/mockData";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { usePOSCart } from "@/hooks/usePOSCart";
import { toast } from "sonner";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({ meta: [{ title: "Punto de Venta — POS Minimarket" }] }),
  component: POSPage,
});

function POSPage() {
  const cart = usePOSCart();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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
        const p = mockProductos.find((x) => x.codigo_barras === buf);
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
  }, [cart]);

  const productos = useMemo(() => {
    let list = mockProductos;
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
  }, [query, cat]);

  const handlePick = (p: MockProducto) => {
    cart.add(p);
  };

  const confirmarVenta = (data: {
    tipo_comprobante: string;
    serie: string;
    pagos: { metodo: string; monto: number }[];
  }) => {
    setCheckoutOpen(false);
    cart.clear();
    toast.success(
      `Venta registrada · ${data.tipo_comprobante} ${data.serie}`,
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] h-[calc(100vh-3.5rem)]">
      {/* Columna productos */}
      <div className="flex flex-col min-h-0">
        <div className="p-4 border-b bg-card/40 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto o código de barras… (F1)"
                className="pl-9 h-11"
              />
            </div>
            <Button variant="outline" className="h-11">
              <Barcode className="h-4 w-4 mr-2" />
              Escanear
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCat(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                cat === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              Todas
            </button>
            {mockCategorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                  cat === c.id
                    ? "text-white border-transparent"
                    : "bg-card hover:bg-muted"
                }`}
                style={
                  cat === c.id
                    ? { backgroundColor: c.color }
                    : { borderColor: c.color + "55", color: c.color }
                }
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid productos={productos} onPick={handlePick} />
        </div>

        <div className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Atajos: F1 buscar · F2 cobrar · Escanea para agregar</span>
          <span>
            {productos.length} producto{productos.length !== 1 && "s"} ·{" "}
            {formatPEN(cart.totales.total)} en carrito
          </span>
        </div>
      </div>

      {/* Columna carrito */}
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

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={cart.totales.total}
        onConfirm={confirmarVenta}
      />
    </div>
  );
}