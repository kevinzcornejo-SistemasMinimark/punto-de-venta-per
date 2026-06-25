import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {productos.map((p) => {
        const lowStock = p.stock <= p.stock_minimo;
        return (
          <button key={p.id} onClick={() => onPick(p)} className="text-left active:scale-95 transition-transform">
            <Card className="p-4 hover:border-primary hover:shadow-xl border-2 transition group cursor-pointer h-full flex flex-col">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 grid place-items-center mb-3 text-5xl font-black text-primary/70">
                {p.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-base font-bold line-clamp-2 min-h-[3rem] leading-tight">
                {p.nombre}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-extrabold text-xl text-primary tabular-nums">
                  {formatPEN(p.precio_venta)}
                </span>
                <Badge
                  variant={lowStock ? "destructive" : "secondary"}
                  className="text-xs px-2 py-0.5 font-bold"
                >
                  {p.stock} {p.unidad}
                </Badge>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}