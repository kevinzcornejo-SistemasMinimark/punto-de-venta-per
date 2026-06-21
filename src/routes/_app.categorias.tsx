import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/categorias")({
  head: () => ({ meta: [{ title: "Categorías — POS Minimarket" }] }),
  component: CategoriasPage,
});

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  orden: number;
  activa: boolean;
};

function CategoriasPage() {
  const { isDemo, user } = useAuth();
  const [rows, setRows] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);

  const load = async () => {
    if (isDemo || !user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("categorias")
      .select("id,nombre,descripcion,color,orden,activa")
      .order("orden");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Categoria[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [isDemo, user?.id]);

  const onSave = async (cat: Partial<Categoria>) => {
    if (isDemo || !user) {
      toast.info("En modo demo no se guarda en la base de datos");
      setOpen(false);
      return;
    }
    const payload = {
      nombre: cat.nombre,
      descripcion: cat.descripcion ?? null,
      color: cat.color ?? "#3B82F6",
      orden: cat.orden ?? 0,
      activa: cat.activa ?? true,
    };
    const { error } = editing?.id
      ? await supabase.from("categorias").update(payload).eq("id", editing.id)
      : await supabase.from("categorias").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Categoría guardada");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar categoría?")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary" /> Categorías
          </h1>
          <p className="text-muted-foreground">Organiza tu catálogo de productos</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nueva categoría
        </Button>
      </div>

      {isDemo && (
        <Card className="p-4 text-sm border-amber-500/30 bg-amber-500/5">
          Modo demo activo · inicia sesión real para guardar categorías en
          Supabase.
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Color</th>
              <th className="px-4 py-2">Orden</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Sin categorías aún
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{c.nombre}</td>
                  <td className="px-4 py-2">
                    <span
                      className="inline-block h-4 w-4 rounded-full border"
                      style={{ backgroundColor: c.color ?? "#3B82F6" }}
                    />
                  </td>
                  <td className="px-4 py-2">{c.orden}</td>
                  <td className="px-4 py-2">
                    {c.activa ? (
                      <span className="text-emerald-600 font-medium">Activa</span>
                    ) : (
                      <span className="text-muted-foreground">Inactiva</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(c.id)}
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

      <CategoriaModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSave={onSave}
      />
    </div>
  );
}

function CategoriaModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Categoria | null;
  onSave: (c: Partial<Categoria>) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [orden, setOrden] = useState(0);

  useEffect(() => {
    if (open) {
      setNombre(initial?.nombre ?? "");
      setDescripcion(initial?.descripcion ?? "");
      setColor(initial?.color ?? "#3B82F6");
      setOrden(initial?.orden ?? 0);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar" : "Nueva"} categoría</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({ nombre, descripcion, color, orden, activa: true })
            }
            disabled={!nombre.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
