import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layers, Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/hooks/useCatalog";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/lotes")({
  head: () => ({ meta: [{ title: "Lotes — POS Minimarket" }] }),
  component: LotesPage,
});

type Lote = {
  id: string;
  producto_id: string;
  numero_lote: string;
  fecha_produccion: string | null;
  fecha_vencimiento: string | null;
  cantidad_inicial: number;
  cantidad_actual: number;
  costo_unitario: number | null;
  productos: { nombre: string } | null;
};

function diasRestantes(f: string | null) {
  if (!f) return null;
  return Math.ceil((new Date(f).getTime() - Date.now()) / 86400000);
}

function LotesPage() {
  const { user, isDemo } = useAuth();
  const { productos } = useCatalog();
  const [rows, setRows] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({});

  const load = async () => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("lotes")
      .select("id,producto_id,numero_lote,fecha_produccion,fecha_vencimiento,cantidad_inicial,cantidad_actual,costo_unitario,productos(nombre)")
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user?.id, isDemo]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter((r) => r.numero_lote.toLowerCase().includes(k) || (r.productos?.nombre ?? "").toLowerCase().includes(k));
  }, [rows, q]);

  const save = async () => {
    if (!f.producto_id || !f.numero_lote || !f.cantidad_inicial) return toast.error("Completa los datos");
    const payload = {
      producto_id: f.producto_id,
      numero_lote: f.numero_lote,
      fecha_produccion: f.fecha_produccion || null,
      fecha_vencimiento: f.fecha_vencimiento || null,
      cantidad_inicial: Number(f.cantidad_inicial),
      cantidad_actual: Number(f.cantidad_inicial),
      costo_unitario: f.costo_unitario ? Number(f.costo_unitario) : null,
    };
    const { error } = await supabase.from("lotes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Lote registrado"); setOpen(false); setF({}); void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Lotes
          </h1>
          <p className="text-muted-foreground">Control de lotes y vencimientos</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Nuevo lote</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lote o producto…" className="pl-9" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Lote</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Producción</th>
              <th className="px-4 py-2">Vencimiento</th>
              <th className="px-4 py-2 text-right">Inicial</th>
              <th className="px-4 py-2 text-right">Actual</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin lotes</td></tr>
            : filtered.map((l) => {
              const d = diasRestantes(l.fecha_vencimiento);
              const estado = d === null ? null : d < 0 ? "vencido" : d <= 7 ? "porVencer" : d <= 30 ? "proximo" : "ok";
              return (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{l.numero_lote}</td>
                  <td className="px-4 py-2 font-medium">{l.productos?.nombre ?? "—"}</td>
                  <td className="px-4 py-2">{l.fecha_produccion ? formatDate(l.fecha_produccion) : "—"}</td>
                  <td className="px-4 py-2">{l.fecha_vencimiento ? formatDate(l.fecha_vencimiento) : "—"}</td>
                  <td className="px-4 py-2 text-right">{l.cantidad_inicial}</td>
                  <td className="px-4 py-2 text-right font-semibold">{l.cantidad_actual}</td>
                  <td className="px-4 py-2">
                    {estado === "vencido" ? <Badge variant="destructive">Vencido</Badge>
                      : estado === "porVencer" ? <Badge className="bg-destructive">{d}d</Badge>
                      : estado === "proximo" ? <Badge className="bg-amber-500">{d}d</Badge>
                      : estado === "ok" ? <Badge variant="secondary">{d}d</Badge>
                      : <Badge variant="outline">—</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo lote</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Producto</Label>
              <Select value={f.producto_id ?? ""} onValueChange={(v) => setF({ ...f, producto_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{productos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>N° Lote</Label><Input value={f.numero_lote ?? ""} onChange={(e) => setF({ ...f, numero_lote: e.target.value })} /></div>
            <div><Label>Cantidad</Label><Input type="number" value={f.cantidad_inicial ?? ""} onChange={(e) => setF({ ...f, cantidad_inicial: e.target.value })} /></div>
            <div><Label>Fecha producción</Label><Input type="date" value={f.fecha_produccion ?? ""} onChange={(e) => setF({ ...f, fecha_produccion: e.target.value })} /></div>
            <div><Label>Fecha vencimiento</Label><Input type="date" value={f.fecha_vencimiento ?? ""} onChange={(e) => setF({ ...f, fecha_vencimiento: e.target.value })} /></div>
            <div className="col-span-2"><Label>Costo unitario</Label><Input type="number" step="0.01" value={f.costo_unitario ?? ""} onChange={(e) => setF({ ...f, costo_unitario: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}