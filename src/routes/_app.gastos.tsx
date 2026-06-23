import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatPEN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/gastos")({
  head: () => ({ meta: [{ title: "Gastos — POS Minimarket" }] }),
  component: GastosPage,
});

const CATEGORIAS = ["SERVICIOS","ALQUILER","PLANILLA","COMPRAS","TRANSPORTE","MARKETING","MANTENIMIENTO","IMPUESTOS","INSUMOS","EQUIPOS","BANCARIO","OTROS"] as const;
const METODOS = ["EFECTIVO","YAPE","PLIN","TARJETA_DEBITO","TARJETA_CREDITO","TRANSFERENCIA"] as const;

type Gasto = { id: string; categoria: string; concepto: string; monto: number; metodo_pago: string; fecha: string; numero_documento: string | null };

function GastosPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ categoria: "OTROS", metodo_pago: "EFECTIVO", fecha: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("gastos").select("id,categoria,concepto,monto,metodo_pago,fecha,numero_documento").order("fecha", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as any); setLoading(false);
  };
  useEffect(() => { void load(); }, [user?.id, isDemo]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter((r) => r.concepto.toLowerCase().includes(k) || r.categoria.toLowerCase().includes(k));
  }, [rows, q]);

  const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.monto), 0), [filtered]);

  const save = async () => {
    if (!f.concepto || !f.monto) return toast.error("Completa los datos");
    const payload = { categoria: f.categoria, concepto: f.concepto, monto: Number(f.monto), metodo_pago: f.metodo_pago, fecha: f.fecha, numero_documento: f.numero_documento || null, usuario_id: user?.id ?? null };
    const { error } = await supabase.from("gastos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Gasto registrado"); setOpen(false);
    setF({ categoria: "OTROS", metodo_pago: "EFECTIVO", fecha: new Date().toISOString().slice(0, 10) });
    void load();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar gasto?")) return;
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Gastos</h1>
          <p className="text-muted-foreground">Registro de egresos operativos</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Nuevo gasto</Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="pl-9" />
        </div>
        <Card className="p-3 px-4"><span className="text-xs text-muted-foreground mr-2">Total:</span><span className="font-bold text-destructive">{formatPEN(total)}</span></Card>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Categoría</th><th className="px-4 py-2">Concepto</th><th className="px-4 py-2">Método</th><th className="px-4 py-2">Doc.</th><th className="px-4 py-2 text-right">Monto</th><th className="px-4 py-2 w-12"></th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin gastos</td></tr>
            : filtered.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-4 py-2 text-xs">{formatDate(g.fecha)}</td>
                <td className="px-4 py-2"><Badge variant="secondary">{g.categoria}</Badge></td>
                <td className="px-4 py-2">{g.concepto}</td>
                <td className="px-4 py-2 text-xs">{g.metodo_pago}</td>
                <td className="px-4 py-2 font-mono text-xs">{g.numero_documento ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono">{formatPEN(g.monto)}</td>
                <td className="px-4 py-2"><Button size="icon" variant="ghost" onClick={() => del(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Concepto</Label><Input value={f.concepto ?? ""} onChange={(e) => setF({ ...f, concepto: e.target.value })} /></div>
            <div><Label>Categoría</Label>
              <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Método</Label>
              <Select value={f.metodo_pago} onValueChange={(v) => setF({ ...f, metodo_pago: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METODOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Monto</Label><Input type="number" step="0.01" value={f.monto ?? ""} onChange={(e) => setF({ ...f, monto: e.target.value })} /></div>
            <div><Label>Fecha</Label><Input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></div>
            <div className="col-span-2"><Label>N° Documento (opcional)</Label><Input value={f.numero_documento ?? ""} onChange={(e) => setF({ ...f, numero_documento: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}