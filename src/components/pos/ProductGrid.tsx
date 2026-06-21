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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {productos.map((p) => {
        const lowStock = p.stock <= p.stock_minimo;
        return (
          <button key={p.id} onClick={() => onPick(p)} className="text-left">
            <Card className="p-3 hover:border-primary hover:shadow-md transition group cursor-pointer h-full flex flex-col">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 grid place-items-center mb-2 text-3xl font-bold text-primary/70">
                {p.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-xs font-semibold line-clamp-2 min-h-[2rem]">
                {p.nombre}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold text-primary">
                  {formatPEN(p.precio_venta)}
                </span>
                <Badge
                  variant={lowStock ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
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