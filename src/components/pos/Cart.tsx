import { Minus, Plus, Trash2, ShoppingCart, CreditCard } from "lucide-react";
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
      <div className="p-5 border-b flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-3 font-extrabold text-xl">
          <ShoppingCart className="h-7 w-7 text-primary" />
          Carrito
          <span className="text-sm text-muted-foreground font-semibold">
            · {totales.cantidadItems} ítems
          </span>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="lg" onClick={onClear} className="text-base text-destructive hover:bg-destructive/10">
            <Trash2 className="h-5 w-5 mr-1" /> Vaciar
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {items.length === 0 ? (
          <div className="text-center text-base text-muted-foreground py-20 px-4">
            <ShoppingCart className="h-16 w-16 mx-auto mb-3 opacity-20" />
            Toca un producto para agregarlo
          </div>
        ) : (
          items.map((i) => (
            <div key={i.producto.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold truncate">
                  {i.producto.nombre}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {formatPEN(i.producto.precio_venta)} c/u
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11"
                    onClick={() => onDec(i.producto.id)}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-12 text-center text-lg font-extrabold tabular-nums">
                    {i.cantidad}
                  </span>
                  <Button
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => onInc(i.producto.id)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="font-extrabold text-lg text-primary tabular-nums">
                  {formatPEN(i.producto.precio_venta * i.cantidad - i.descuento)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(i.producto.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-5 space-y-2 bg-muted/30">
        <div className="flex justify-between text-base text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPEN(totales.subtotal)}</span>
        </div>
        <div className="flex justify-between text-base text-muted-foreground">
          <span>IGV (18%)</span>
          <span className="tabular-nums">{formatPEN(totales.igv)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t mt-2">
          <span className="text-2xl font-extrabold">TOTAL</span>
          <span className="text-4xl font-black text-primary tabular-nums">{formatPEN(totales.total)}</span>
        </div>
        <Button
          className="w-full mt-4 h-20 text-2xl font-extrabold shadow-lg"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          <CreditCard className="h-7 w-7 mr-3" />
          COBRAR
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-1">Atajo: F2</p>
      </div>
    </div>
  );
}