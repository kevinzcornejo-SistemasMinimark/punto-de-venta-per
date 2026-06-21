import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/productos")({
  head: () => ({ meta: [{ title: "Productos — POS Minimarket" }] }),
  component: ProductosPage,
});

type Producto = {
  id: string;
  codigo_barras: string | null;
  nombre: string;
  precio_venta: number;
  precio_compra: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  categoria_id: string | null;
  afecto_igv: boolean;
  activo: boolean;
};
type Categoria = { id: string; nombre: string };

const UNIDADES = [
  "UNIDAD",
  "KILOGRAMO",
  "GRAMO",
  "LITRO",
  "MILILITRO",
  "CAJA",
  "PAQUETE",
  "DOCENA",
  "BOLSA",
];

function ProductosPage() {
  const { isDemo, user } = useAuth();
  const [rows, setRows] = useState<Producto[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);

  const load = async () => {
    if (isDemo || !user) {
      setRows([]);
      setCats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: ps, error: e1 }, { data: cs }] = await Promise.all([
      supabase
        .from("productos")
        .select(
          "id,codigo_barras,nombre,precio_venta,precio_compra,stock_actual,stock_minimo,unidad_medida,categoria_id,afecto_igv,activo",
        )
        .order("nombre"),
      supabase.from("categorias").select("id,nombre").order("nombre"),
    ]);
    if (e1) toast.error(e1.message);
    setRows((ps ?? []) as Producto[]);
    setCats((cs ?? []) as Categoria[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [isDemo, user?.id]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(k) ||
        (p.codigo_barras ?? "").includes(k),
    );
  }, [rows, q]);

  const onSave = async (p: Partial<Producto>) => {
    if (isDemo || !user) {
      toast.info("Demo: no se guarda en la base de datos");
      setOpen(false);
      return;
    }
    const payload: any = {
      codigo_barras: p.codigo_barras || null,
      nombre: p.nombre,
      precio_venta: p.precio_venta ?? 0,
      precio_compra: p.precio_compra ?? 0,
      stock_actual: p.stock_actual ?? 0,
      stock_minimo: p.stock_minimo ?? 0,
      unidad_medida: p.unidad_medida ?? "UNIDAD",
      categoria_id: p.categoria_id || null,
      afecto_igv: p.afecto_igv ?? true,
      activo: p.activo ?? true,
    };
    const { error } = editing?.id
      ? await supabase.from("productos").update(payload).eq("id", editing.id)
      : await supabase.from("productos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Producto guardado");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Productos
          </h1>
          <p className="text-muted-foreground">
            Precios, stock y código de barras
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo producto
        </Button>
      </div>

      {isDemo && (
        <Card className="p-4 text-sm border-amber-500/30 bg-amber-500/5">
          Modo demo activo · inicia sesión real para guardar productos en
          Supabase.
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2 text-right">P. Compra</th>
              <th className="px-4 py-2 text-right">P. Venta</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Sin productos
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {p.codigo_barras ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatPEN(Number(p.precio_compra))}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-primary">
                    {formatPEN(Number(p.precio_venta))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {Number(p.stock_actual)} {p.unidad_medida.slice(0, 3)}
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ProductoModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        categorias={cats}
        onSave={onSave}
      />
    </div>
  );
}

function ProductoModal({
  open,
  onOpenChange,
  initial,
  categorias,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Producto | null;
  categorias: Categoria[];
  onSave: (p: Partial<Producto>) => void;
}) {
  const [f, setF] = useState<Partial<Producto>>({});

  useEffect(() => {
    if (open) {
      setF(
        initial ?? {
          nombre: "",
          codigo_barras: "",
          precio_compra: 0,
          precio_venta: 0,
          stock_actual: 0,
          stock_minimo: 0,
          unidad_medida: "UNIDAD",
          afecto_igv: true,
          activo: true,
        },
      );
    }
  }, [open, initial]);

  const set = (patch: Partial<Producto>) => setF((p) => ({ ...p, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar" : "Nuevo"} producto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nombre</Label>
            <Input
              value={f.nombre ?? ""}
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </div>
          <div>
            <Label>Código de barras</Label>
            <Input
              value={f.codigo_barras ?? ""}
              onChange={(e) => set({ codigo_barras: e.target.value })}
            />
          </div>
          <div>
            <Label>Unidad</Label>
            <Select
              value={f.unidad_medida ?? "UNIDAD"}
              onValueChange={(v) => set({ unidad_medida: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categoría</Label>
            <Select
              value={f.categoria_id ?? "none"}
              onValueChange={(v) =>
                set({ categoria_id: v === "none" ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>IGV</Label>
            <Select
              value={String(f.afecto_igv ?? true)}
              onValueChange={(v) => set({ afecto_igv: v === "true" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Afecto (18%)</SelectItem>
                <SelectItem value="false">Exonerado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio compra</Label>
            <Input
              type="number"
              step="0.01"
              value={f.precio_compra ?? 0}
              onChange={(e) =>
                set({ precio_compra: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Precio venta</Label>
            <Input
              type="number"
              step="0.01"
              value={f.precio_venta ?? 0}
              onChange={(e) =>
                set({ precio_venta: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Stock actual</Label>
            <Input
              type="number"
              step="0.001"
              value={f.stock_actual ?? 0}
              onChange={(e) =>
                set({ stock_actual: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Stock mínimo</Label>
            <Input
              type="number"
              step="0.001"
              value={f.stock_minimo ?? 0}
              onChange={(e) =>
                set({ stock_minimo: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(f)} disabled={!f.nombre?.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}