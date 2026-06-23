import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, LockOpen, Lock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/caja")({
  head: () => ({ meta: [{ title: "Caja — POS Minimarket" }] }),
  component: CajaPage,
});

type Caja = { id: string; numero: number; estado: string; monto_apertura: number; monto_cierre: number | null; total_ventas: number; abierta_en: string; cerrada_en: string | null };
type Mov = { id: string; tipo: string; metodo_pago: string | null; monto: number; concepto: string; creado_en: string };

function CajaPage() {
  const { user, isDemo } = useAuth();
  const [caja, setCaja] = useState<Caja | null>(null);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [historial, setHistorial] = useState<Caja[]>([]);
  const [openAp, setOpenAp] = useState(false);
  const [openMov, setOpenMov] = useState<"INGRESO" | "EGRESO" | null>(null);
  const [openCi, setOpenCi] = useState(false);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [metodo, setMetodo] = useState("EFECTIVO");

  const load = async () => {
    if (isDemo || !user) return;
    const { data: ab } = await supabase.from("cajas").select("*").eq("cajero_id", user.id).eq("estado", "ABIERTA").maybeSingle();
    setCaja((ab as any) ?? null);
    if (ab) {
      const { data: m } = await supabase.from("movimientos_caja").select("*").eq("caja_id", (ab as any).id).order("creado_en", { ascending: false });
      setMovs((m ?? []) as any);
    } else setMovs([]);
    const { data: h } = await supabase.from("cajas").select("*").order("abierta_en", { ascending: false }).limit(20);
    setHistorial((h ?? []) as any);
  };
  useEffect(() => { void load(); }, [user?.id, isDemo]);

  const abrir = async () => {
    if (!user) return;
    const { error } = await supabase.from("cajas").insert({ cajero_id: user.id, monto_apertura: Number(monto) || 0, estado: "ABIERTA" });
    if (error) return toast.error(error.message);
    toast.success("Caja abierta"); setOpenAp(false); setMonto(""); void load();
  };

  const movimiento = async () => {
    if (!caja || !openMov) return;
    const { error } = await supabase.from("movimientos_caja").insert({
      caja_id: caja.id, tipo: openMov, metodo_pago: metodo, monto: Number(monto), concepto, usuario_id: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Movimiento registrado"); setOpenMov(null); setMonto(""); setConcepto(""); void load();
  };

  const cerrar = async () => {
    if (!caja) return;
    const cierre = Number(monto) || 0;
    const { error } = await supabase.from("cajas").update({
      estado: "CERRADA", monto_cierre: cierre, cerrada_en: new Date().toISOString(),
    }).eq("id", caja.id);
    if (error) return toast.error(error.message);
    toast.success("Caja cerrada"); setOpenCi(false); setMonto(""); void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Caja</h1>
        <p className="text-muted-foreground">Apertura, ingresos/egresos y cierre</p>
      </div>
      {isDemo && <Card className="p-4 text-sm border-amber-500/30 bg-amber-500/5">Modo demo · funciones de caja requieren sesión real</Card>}

      {!caja ? (
        <Card className="p-8 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-semibold">No tienes una caja abierta</div>
          <Button onClick={() => setOpenAp(true)} disabled={isDemo || !user}><LockOpen className="h-4 w-4 mr-1" />Abrir caja</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Caja N°</div><div className="text-2xl font-bold">#{caja.numero}</div><Badge className="mt-1 bg-emerald-500">ABIERTA</Badge></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Apertura</div><div className="text-2xl font-bold">{formatPEN(caja.monto_apertura)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Ventas</div><div className="text-2xl font-bold">{formatPEN(caja.total_ventas)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Desde</div><div className="text-sm">{new Date(caja.abierta_en).toLocaleString("es-PE")}</div></Card>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setOpenMov("INGRESO"); setMetodo("EFECTIVO"); }}><ArrowDownRight className="h-4 w-4 mr-1 text-emerald-600" />Ingreso</Button>
            <Button variant="outline" onClick={() => { setOpenMov("EGRESO"); setMetodo("EFECTIVO"); }}><ArrowUpRight className="h-4 w-4 mr-1 text-destructive" />Egreso</Button>
            <Button variant="destructive" className="ml-auto" onClick={() => setOpenCi(true)}><Lock className="h-4 w-4 mr-1" />Cerrar caja</Button>
          </div>

          <Card className="overflow-hidden">
            <div className="p-3 font-semibold border-b">Movimientos</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase"><tr><th className="px-4 py-2 text-left">Fecha</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Método</th><th className="px-4 py-2 text-left">Concepto</th><th className="px-4 py-2 text-right">Monto</th></tr></thead>
              <tbody>
                {movs.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin movimientos</td></tr>
                : movs.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2 text-xs">{new Date(m.creado_en).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-2 text-center"><Badge variant={m.tipo === "EGRESO" || m.tipo === "GASTO" ? "destructive" : "secondary"}>{m.tipo}</Badge></td>
                    <td className="px-4 py-2 text-center text-xs">{m.metodo_pago ?? "—"}</td>
                    <td className="px-4 py-2">{m.concepto}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatPEN(m.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card className="overflow-hidden">
        <div className="p-3 font-semibold border-b">Historial de cajas</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase"><tr><th className="px-4 py-2 text-left">N°</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Apertura</th><th className="px-4 py-2">Cierre</th><th className="px-4 py-2 text-right">Ventas</th></tr></thead>
          <tbody>
            {historial.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sin historial</td></tr>
            : historial.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-bold">#{c.numero}</td>
                <td className="px-4 py-2 text-center"><Badge variant={c.estado === "ABIERTA" ? "default" : "secondary"}>{c.estado}</Badge></td>
                <td className="px-4 py-2 text-xs">{new Date(c.abierta_en).toLocaleString("es-PE")}</td>
                <td className="px-4 py-2 text-xs">{c.cerrada_en ? new Date(c.cerrada_en).toLocaleString("es-PE") : "—"}</td>
                <td className="px-4 py-2 text-right font-mono">{formatPEN(c.total_ventas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={openAp} onOpenChange={setOpenAp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir caja</DialogTitle></DialogHeader>
          <div><Label>Monto de apertura (efectivo)</Label><Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenAp(false)}>Cancelar</Button><Button onClick={abrir}>Abrir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openMov} onOpenChange={(o) => !o && setOpenMov(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{openMov === "INGRESO" ? "Ingreso de caja" : "Egreso de caja"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
            <div><Label>Método</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["EFECTIVO","YAPE","PLIN","TARJETA_DEBITO","TARJETA_CREDITO","TRANSFERENCIA"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Concepto</Label><Input value={concepto} onChange={(e) => setConcepto(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenMov(null)}>Cancelar</Button><Button onClick={movimiento}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCi} onOpenChange={setOpenCi}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cerrar caja</DialogTitle></DialogHeader>
          <div><Label>Monto contado (efectivo)</Label><Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenCi(false)}>Cancelar</Button><Button variant="destructive" onClick={cerrar}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}