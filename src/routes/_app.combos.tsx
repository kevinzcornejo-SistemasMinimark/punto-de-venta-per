import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Layers, Plus, Search, Pencil, Trash2, Eye, EyeOff, Package, X, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/hooks/useCatalog";
import { formatPEN } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/combos")({
  head: () => ({ meta: [{ title: "Combos — POS Minimarket" }] }),
  component: CombosPage,
});

type ComboItem = { producto_id: string; cantidad: number; descuenta_stock: boolean };
type Combo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_combo: number;
  activo: boolean;
  temporal: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  combo_items: Array<{
    cantidad: number;
    descuenta_stock: boolean;
    producto_id: string;
    productos: { nombre: string; precio_venta: number } | null;
  }>;
};

function CombosPage() {
  const { user, isDemo } = useAuth();
  const { productos } = useCatalog();
  const [rows, setRows] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Combo | null>(null);

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("combos")
        .select("id,nombre,descripcion,precio_combo,activo,temporal,fecha_inicio,fecha_fin,combo_items(cantidad,descuenta_stock,producto_id,productos(nombre,precio_venta))")
        .order("nombre");
      if (error) toast.error(error.message);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [user?.id, isDemo, tick]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) => c.nombre.toLowerCase().includes(s) || (c.descripcion ?? "").toLowerCase().includes(s));
  }, [rows, q]);

  const kpis = useMemo(() => ({
    total: rows.length,
    activos: rows.filter((r) => r.activo).length,
    temporales: rows.filter((r) => r.temporal).length,
  }), [rows]);

  async function toggleActivo(c: Combo) {
    const { error } = await supabase.from("combos").update({ activo: !c.activo }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(!c.activo ? "Combo activado" : "Combo desactivado");
    setTick((t) => t + 1);
  }
  async function eliminar(c: Combo) {
    if (!confirm(`¿Eliminar el combo "${c.nombre}"?`)) return;
    const { error } = await supabase.from("combos").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Combo eliminado");
    setTick((t) => t + 1);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Combos
          </h1>
          <p className="text-muted-foreground">Gestiona combos y paquetes promocionales</p>
        </div>
        <Button size="lg" className="bg-primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-5 w-5" /> Nuevo Combo
        </Button>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <b>¿Cómo funciona el descuento de stock?</b><br />
          Cuando vendes un combo, el sistema <b>descuenta automáticamente el stock</b> de cada producto que lo compone y que tenga "Descuenta stock" activado.
        </div>
      </Card>

      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar combos..." className="pl-9 h-11" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Kpi value={kpis.total} label="Total combos" color="text-orange-500" />
        <Kpi value={kpis.activos} label="Activos" color="text-emerald-600" />
        <Kpi value={kpis.temporales} label="Temporales" color="text-amber-500" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2 font-bold">
          <Layers className="h-5 w-5" /> Lista de Combos ({filtered.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Sin combos</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Componentes</TableHead>
                <TableHead className="text-right">Precio Combo</TableHead>
                <TableHead className="text-right">Ahorro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const totalIndiv = (c.combo_items ?? []).reduce(
                  (s, it) => s + (it.productos?.precio_venta ?? 0) * it.cantidad, 0,
                );
                const ahorro = Math.max(0, totalIndiv - Number(c.precio_combo));
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-bold">{c.nombre}</div>
                      {c.descripcion && <div className="text-xs text-muted-foreground">{c.descripcion}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-sm">
                        {(c.combo_items ?? []).map((it, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">{it.cantidad}x</span>
                            <span>{it.productos?.nombre ?? "—"}</span>
                            {it.descuenta_stock && <Badge variant="secondary" className="text-[10px] h-4">-stock</Badge>}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-primary">{formatPEN(c.precio_combo)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
                        -{formatPEN(ahorro)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge className={c.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"}>
                          {c.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        {c.temporal && <Badge className="bg-amber-100 text-amber-700">Temporal</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggleActivo(c)} title={c.activo ? "Desactivar" : "Activar"}>
                          {c.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => eliminar(c)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ComboFormDialog
        open={open}
        onClose={() => setOpen(false)}
        combo={editing}
        productos={productos}
        onSaved={() => { setOpen(false); setTick((t) => t + 1); }}
      />
    </div>
  );
}

function Kpi({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card className="p-5 text-center">
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}

function ComboFormDialog({
  open, onClose, combo, productos, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  combo: Combo | null;
  productos: ReturnType<typeof useCatalog>["productos"];
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState<number>(0);
  const [activo, setActivo] = useState(true);
  const [temporal, setTemporal] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [items, setItems] = useState<ComboItem[]>([]);
  const [busc, setBusc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (combo) {
      setNombre(combo.nombre);
      setDescripcion(combo.descripcion ?? "");
      setPrecio(Number(combo.precio_combo));
      setActivo(combo.activo);
      setTemporal(combo.temporal);
      setFechaInicio(combo.fecha_inicio?.slice(0, 10) ?? "");
      setFechaFin(combo.fecha_fin?.slice(0, 10) ?? "");
      setItems((combo.combo_items ?? []).map((it) => ({
        producto_id: it.producto_id, cantidad: it.cantidad, descuenta_stock: it.descuenta_stock,
      })));
    } else {
      setNombre(""); setDescripcion(""); setPrecio(0); setActivo(true);
      setTemporal(false); setFechaInicio(""); setFechaFin(""); setItems([]);
    }
    setBusc("");
  }, [open, combo?.id]);

  const totalIndiv = useMemo(() => items.reduce((s, it) => {
    const p = productos.find((x) => x.id === it.producto_id);
    return s + (p?.precio_venta ?? 0) * it.cantidad;
  }, 0), [items, productos]);
  const ahorro = Math.max(0, totalIndiv - precio);

  const candidatos = useMemo(() => {
    const s = busc.trim().toLowerCase();
    const ids = new Set(items.map((i) => i.producto_id));
    return productos.filter((p) => !ids.has(p.id) && (!s || p.nombre.toLowerCase().includes(s) || p.codigo_barras.includes(s))).slice(0, 8);
  }, [productos, busc, items]);

  function addItem(id: string) {
    setItems((prev) => [...prev, { producto_id: id, cantidad: 1, descuenta_stock: true }]);
    setBusc("");
  }

  async function guardar() {
    if (!nombre.trim()) return toast.error("Nombre requerido");
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    if (precio <= 0) return toast.error("Precio inválido");
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio_combo: precio,
        activo,
        temporal,
        fecha_inicio: temporal && fechaInicio ? fechaInicio : null,
        fecha_fin: temporal && fechaFin ? fechaFin : null,
      };
      let comboId = combo?.id;
      if (combo) {
        const { error } = await supabase.from("combos").update(payload).eq("id", combo.id);
        if (error) throw error;
        await supabase.from("combo_items").delete().eq("combo_id", combo.id);
      } else {
        const { data, error } = await supabase.from("combos").insert(payload).select("id").single();
        if (error) throw error;
        comboId = data.id;
      }
      const itemsPayload = items.map((it) => ({
        combo_id: comboId, producto_id: it.producto_id, cantidad: it.cantidad, descuenta_stock: it.descuenta_stock,
      }));
      const { error: e2 } = await supabase.from("combo_items").insert(itemsPayload);
      if (e2) throw e2;
      toast.success(combo ? "Combo actualizado" : "Combo creado");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> {combo ? "Editar combo" : "Nuevo combo"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Nombre *</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Combo Familiar" />
          </div>
          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Precio combo (S/) *</Label>
            <Input type="number" step="0.10" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={activo} onCheckedChange={setActivo} /> Activo</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={temporal} onCheckedChange={setTemporal} /> Temporal</label>
          </div>
          {temporal && (
            <>
              <div><Label>Inicio</Label><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
              <div><Label>Fin</Label><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
            </>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Productos del combo</Label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar producto por nombre o código..." value={busc} onChange={(e) => setBusc(e.target.value)} />
            {busc && candidatos.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {candidatos.map((p) => (
                  <button key={p.id} type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent flex justify-between text-sm"
                    onClick={() => addItem(p.id)}>
                    <span>{p.nombre}</span>
                    <span className="font-mono text-muted-foreground">{formatPEN(p.precio_venta)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded">
              Sin productos. Busca arriba para agregar.
            </div>
          ) : (
            <div className="border rounded divide-y">
              {items.map((it, idx) => {
                const p = productos.find((x) => x.id === it.producto_id);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{p?.nombre ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{formatPEN(p?.precio_venta ?? 0)} c/u</div>
                    </div>
                    <Input type="number" min={1} value={it.cantidad} className="w-20"
                      onChange={(e) => setItems((prev) => prev.map((x, i) => i === idx ? { ...x, cantidad: Math.max(1, Number(e.target.value)) } : x))} />
                    <label className="flex items-center gap-1 text-xs">
                      <Switch checked={it.descuenta_stock}
                        onCheckedChange={(v) => setItems((prev) => prev.map((x, i) => i === idx ? { ...x, descuenta_stock: v } : x))} />
                      stock
                    </label>
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Precio individual: <b>{formatPEN(totalIndiv)}</b></span>
            <span className="text-emerald-600 font-bold">Ahorro: {formatPEN(ahorro)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "Guardar combo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}