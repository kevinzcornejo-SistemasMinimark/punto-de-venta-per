import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { formatPEN } from "@/lib/format";
import { mockBusiness } from "@/data/mockData";
import type { CartItem } from "@/hooks/usePOSCart";

export interface TicketData {
  tipo: "BOLETA" | "FACTURA" | "TICKET";
  serie: string;
  correlativo: number | string;
  fecha: Date;
  items: CartItem[];
  subtotal: number;
  igv: number;
  total: number;
  metodoPago: string;
  cliente?: string;
  documentoCliente?: string;
}

const tipoLabel = (t: TicketData["tipo"]) =>
  t === "BOLETA" ? "BOLETA DE VENTA" : t === "FACTURA" ? "FACTURA ELECTRÓNICA" : "TICKET DE VENTA";

export function TicketModal({
  open,
  onOpenChange,
  ticket,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticket: TicketData | null;
}) {
  if (!ticket) return null;
  const correl = String(ticket.correlativo).padStart(4, "0");
  const fechaStr = ticket.fecha.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  const handlePrint = () => {
    const el = document.getElementById("ticket-print-area");
    if (!el) return;
    const w = window.open("", "_blank", "width=380,height=720");
    if (!w) return;
    w.document.write(`
      <html><head><title>Ticket ${ticket.serie}-${correl}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 8px; margin: 0; color: #000; }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; }
        .bold { font-weight: 700; }
        hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 1px 0; font-size: 11px; }
        th:last-child, td:last-child { text-align: right; }
        .total { font-size: 16px; font-weight: 700; }
      </style></head>
      <body>${el.innerHTML}${el.innerHTML}</body>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-5 w-5 text-primary" /> Ticket Generado
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5 bg-muted/40">
          <div
            id="ticket-print-area"
            className="bg-white text-black mx-auto p-4 rounded shadow-sm font-mono text-[12px] leading-tight"
            style={{ width: 300 }}
          >
            <div className="center text-center">
              <div className="bold font-bold text-base">{mockBusiness.nombre_comercial.toUpperCase()}</div>
              <div>R.U.C. : {mockBusiness.ruc}</div>
              <div>{mockBusiness.direccion}</div>
              <div>Tel: 01-234-5678</div>
              <hr className="my-2 border-t border-dashed border-black" />
              <div className="bold font-bold">{tipoLabel(ticket.tipo)}</div>
              <div className="bold font-bold mt-1">{ticket.serie}-{correl}</div>
            </div>
            <hr className="my-2 border-t border-dashed border-black" />
            <div>FECHA : {fechaStr}</div>
            <div>TIPO  : Venta</div>
            <div>CLIENTE : {ticket.cliente ?? "Cliente Genérico"}</div>
            {ticket.documentoCliente && <div>DOC : {ticket.documentoCliente}</div>}
            <div>PAGO  : {ticket.metodoPago}</div>
            <hr className="my-2 border-t border-dashed border-black" />
            <table className="w-full">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left">CANT</th>
                  <th className="text-left">DESCRIPCION</th>
                  <th className="text-right">PRECIO</th>
                  <th className="text-right">SUBT</th>
                </tr>
              </thead>
              <tbody>
                {ticket.items.map((i) => (
                  <tr key={i.producto.id}>
                    <td className="align-top">{i.cantidad}</td>
                    <td className="align-top pr-1">{i.producto.nombre}</td>
                    <td className="align-top text-right tabular-nums">{i.producto.precio_venta.toFixed(2)}</td>
                    <td className="align-top text-right tabular-nums">{(i.producto.precio_venta * i.cantidad - i.descuento).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="my-2 border-t border-dashed border-black" />
            <div className="row flex justify-between text-xs">
              <span>SUBTOTAL</span><span className="tabular-nums">{formatPEN(ticket.subtotal)}</span>
            </div>
            <div className="row flex justify-between text-xs">
              <span>IGV (18%)</span><span className="tabular-nums">{formatPEN(ticket.igv)}</span>
            </div>
            <hr className="my-2 border-t border-dashed border-black" />
            <div className="row flex justify-between total text-base font-bold">
              <span>TOTAL S/.</span>
              <span className="tabular-nums">{ticket.total.toFixed(2)}</span>
            </div>
            <hr className="my-2 border-t border-dashed border-black" />
            <div className="center text-center text-[11px]">
              ¡Gracias por su compra!
              <br />Conserve su ticket
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-card gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-14 px-6 text-base font-bold flex-1 sm:flex-initial"
          >
            <X className="h-5 w-5 mr-2" /> Sin imprimir
          </Button>
          <Button
            onClick={() => { handlePrint(); onOpenChange(false); }}
            className="h-14 px-6 text-base font-extrabold flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Printer className="h-5 w-5 mr-2" /> Imprimir 2 copias
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
