import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Banknote, Smartphone, CreditCard } from "lucide-react";
import { formatPEN } from "@/lib/format";
import { toast } from "sonner";

const METODOS = [
  { value: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { value: "YAPE", label: "Yape", icon: Smartphone },
  { value: "PLIN", label: "Plin", icon: Smartphone },
  { value: "TARJETA_DEBITO", label: "Tarjeta Débito", icon: CreditCard },
  { value: "TARJETA_CREDITO", label: "Tarjeta Crédito", icon: CreditCard },
  { value: "TRANSFERENCIA", label: "Transferencia", icon: CreditCard },
] as const;

type Pago = { metodo: string; monto: number; referencia?: string };

export function CheckoutModal({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  onConfirm: (data: {
    tipo_comprobante: "BOLETA" | "FACTURA" | "TICKET";
    serie: string;
    documento_cliente?: string;
    pagos: Pago[];
  }) => void;
}) {
  const [tipo, setTipo] = useState<"BOLETA" | "FACTURA" | "TICKET">("BOLETA");
  const [doc, setDoc] = useState("");
  const [pagos, setPagos] = useState<Pago[]>([
    { metodo: "EFECTIVO", monto: total },
  ]);

  const totalPagado = pagos.reduce((s, p) => s + (p.monto || 0), 0);
  const vuelto = totalPagado - total;
  const falta = total - totalPagado;
  const serie =
    tipo === "BOLETA" ? "B001" : tipo === "FACTURA" ? "F001" : "T001";

  const updatePago = (i: number, patch: Partial<Pago>) =>
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const confirmar = () => {
    if (totalPagado < total - 0.01) {
      toast.error(`Falta ${formatPEN(falta)}`);
      return;
    }
    if (tipo === "FACTURA" && (!doc || doc.length !== 11)) {
      toast.error("Ingresa el RUC del cliente (11 dígitos)");
      return;
    }
    onConfirm({
      tipo_comprobante: tipo,
      serie,
      documento_cliente: doc || undefined,
      pagos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label>Tipo de comprobante</Label>
            <Tabs
              value={tipo}
              onValueChange={(v) => setTipo(v as typeof tipo)}
              className="mt-2"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="BOLETA">Boleta</TabsTrigger>
                <TabsTrigger value="FACTURA">Factura</TabsTrigger>
                <TabsTrigger value="TICKET">Ticket</TabsTrigger>
              </TabsList>
              <TabsContent value={tipo} className="mt-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Serie: <span className="font-mono font-semibold">{serie}</span>
                </div>
                {tipo !== "TICKET" && (
                  <div className="space-y-1.5">
                    <Label>{tipo === "FACTURA" ? "RUC" : "DNI / RUC / CE"}</Label>
                    <Input
                      value={doc}
                      onChange={(e) =>
                        setDoc(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder={tipo === "FACTURA" ? "20XXXXXXXXX" : "DNI 8 dígitos"}
                      maxLength={tipo === "FACTURA" ? 11 : 12}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-5 rounded-lg bg-muted p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Total a cobrar</span>
                <span className="font-bold">{formatPEN(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pagado</span>
                <span className="font-bold">{formatPEN(totalPagado)}</span>
              </div>
              {vuelto > 0 ? (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Vuelto</span>
                  <span className="font-bold">{formatPEN(vuelto)}</span>
                </div>
              ) : falta > 0 ? (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Falta</span>
                  <span className="font-bold">{formatPEN(falta)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Pagos {pagos.length > 1 && <Badge variant="secondary" className="ml-1">MIXTO</Badge>}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPagos((p) => [
                    ...p,
                    { metodo: "YAPE", monto: Math.max(0, falta) },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Pago
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pagos.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">Método</Label>
                    <Select
                      value={p.metodo}
                      onValueChange={(v) => updatePago(i, { metodo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Monto</Label>
                    <Input
                      type="number"
                      step="0.10"
                      min="0"
                      value={p.monto}
                      onChange={(e) =>
                        updatePago(i, { monto: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  {pagos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPagos((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar} className="min-w-[160px]">
            Confirmar {formatPEN(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}