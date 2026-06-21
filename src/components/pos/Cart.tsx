import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/format";
import type { CartItem } from "@/hooks/usePOSCart";

export function Cart({
  items,
  onInc,
  onDec,
  onRemove,
  totales,
  onCheckout,
  onClear,
}: {
  items: CartItem[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  totales: { subtotal: number; igv: number; total: number; cantidadItems: number };
  onCheckout: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-card border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Carrito
          <span className="text-xs text-muted-foreground font-normal">
            ({totales.cantidadItems} ítems)
          </span>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Vaciar
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12 px-4">
            Toca un producto para agregarlo
          </div>
        ) : (
          items.map((i) => (
            <div key={i.producto.id} className="p-3 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {i.producto.nombre}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatPEN(i.producto.precio_venta)} × {i.cantidad}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onDec(i.producto.id)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {i.cantidad}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onInc(i.producto.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {formatPEN(i.producto.precio_venta * i.cantidad - i.descuento)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemove(i.producto.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPEN(totales.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>IGV (18%)</span>
          <span>{formatPEN(totales.igv)}</span>
        </div>
        <div className="flex justify-between text-xl font-extrabold pt-2">
          <span>Total</span>
          <span className="text-primary">{formatPEN(totales.total)}</span>
        </div>
        <Button
          className="w-full mt-3 h-12 text-base"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Cobrar · {formatPEN(totales.total)}
        </Button>
      </div>
    </div>
  );
}