import { Plus } from "lucide-react";
import { formatPEN } from "@/lib/format";
import type { MockProducto } from "@/data/mockData";

export function ProductGrid({
  productos,
  onPick,
}: {
  productos: MockProducto[];
  onPick: (p: MockProducto) => void;
}) {
  if (productos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        No se encontraron productos.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {productos.map((p) => {
        const agotado = p.stock <= 0;
        const bajo = !agotado && p.stock <= p.stock_minimo;
        return (
          <div
            key={p.id}
            onClick={() => !agotado && onPick(p)}
            className={`relative rounded-2xl border bg-card p-3 transition shadow-sm hover:shadow-md hover:border-primary/50 active:scale-[0.98] flex flex-col ${
              agotado ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {/* Badge de stock visible */}
            <span
              className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-extrabold ring-2 ring-background shadow-sm text-white ${
                agotado ? "bg-destructive" : bajo ? "bg-amber-500" : "bg-emerald-500"
              }`}
              title={`Stock disponible: ${p.stock} ${p.unidad}`}
            >
              {agotado ? "AGOTADO" : `${p.stock} ${p.unidad}`}
            </span>
            <div className="aspect-square rounded-xl bg-muted/50 grid place-items-center mb-2 overflow-hidden">
              {p.imagen ? (
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-muted-foreground/50">
                  {p.nombre.slice(0, 2).toUpperCase()}
                </span>
              )}
              {agotado && (
                <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center py-1.5 rounded-md bg-destructive/90 text-white text-xs font-extrabold tracking-wider">
                  SIN STOCK
                </span>
              )}
            </div>
            <div className="text-sm font-bold leading-tight line-clamp-2 min-h-[2.4rem]">
              {p.nombre}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-extrabold text-lg text-primary tabular-nums">
                {formatPEN(p.precio_venta)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!agotado) onPick(p);
                }}
                disabled={agotado}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40"
                aria-label={`Agregar ${p.nombre}`}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}