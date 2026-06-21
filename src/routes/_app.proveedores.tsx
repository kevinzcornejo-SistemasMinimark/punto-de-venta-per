import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Plus, Pencil, Trash2, Truck, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/proveedores")({
  head: () => ({ meta: [{ title: "Proveedores — POS Minimarket" }] }),
  component: ProveedoresPage,
});

type Proveedor = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  dias_credito: number;
  activo: boolean;
};

function ProveedoresPage() {
  const { isDemo, user } = useAuth();
  const [rows, setRows] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);

  const load = async () => {
    if (isDemo || !user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("proveedores")
      .select(
        "id,razon_social,nombre_comercial,ruc,contacto,telefono,correo,direccion,dias_credito,activo",
      )
      .order("razon_social");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Proveedor[]);
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
        p.razon_social.toLowerCase().includes(k) ||
        (p.ruc ?? "").includes(k) ||
        (p.nombre_comercial ?? "").toLowerCase().includes(k),
    );
  }, [rows, q]);

  const onSave = async (p: Partial<Proveedor>) => {
    if (isDemo || !user) {
      toast.info("Demo: no se guarda en la base de datos");
      setOpen(false);
      return;
    }
    const payload: any = {
      razon_social: p.razon_social,
      nombre_comercial: p.nombre_comercial || null,
      ruc: p.ruc || null,
      contacto: p.contacto || null,
      telefono: p.telefono || null,
      correo: p.correo || null,
      direccion: p.direccion || null,
      dias_credito: p.dias_credito ?? 0,
      activo: true,
    };
    const { error } = editing?.id
      ? await supabase
          .from("proveedores")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("proveedores").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Proveedor guardado");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    const { error } = await supabase.from("proveedores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Proveedores
          </h1>
          <p className="text-muted-foreground">Gestión de proveedores y compras</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo proveedor
        </Button>
      </div>

      {isDemo && (
        <Card className="p-4 text-sm border-amber-500/30 bg-amber-500/5">
          Modo demo activo · inicia sesión real para guardar proveedores.
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por razón social o RUC…"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Razón social</th>
              <th className="px-4 py-2">RUC</th>
              <th className="px-4 py-2">Contacto</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2 text-right">Días crédito</th>
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
                  Sin proveedores
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.razon_social}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.ruc ?? "—"}</td>
                  <td className="px-4 py-2">{p.contacto ?? "—"}</td>
                  <td className="px-4 py-2">{p.telefono ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{p.dias_credito}</td>
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

      <ProveedorModal
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

function ProveedorModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Proveedor | null;
  onSave: (p: Partial<Proveedor>) => void;
}) {
  const [f, setF] = useState<Partial<Proveedor>>({});
  useEffect(() => {
    if (open) setF(initial ?? { razon_social: "", dias_credito: 0 });
  }, [open, initial]);
  const set = (patch: Partial<Proveedor>) =>
    setF((p) => ({ ...p, ...patch }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar" : "Nuevo"} proveedor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Razón social</Label>
            <Input
              value={f.razon_social ?? ""}
              onChange={(e) => set({ razon_social: e.target.value })}
            />
          </div>
          <div>
            <Label>Nombre comercial</Label>
            <Input
              value={f.nombre_comercial ?? ""}
              onChange={(e) => set({ nombre_comercial: e.target.value })}
            />
          </div>
          <div>
            <Label>RUC</Label>
            <Input
              value={f.ruc ?? ""}
              onChange={(e) =>
                set({ ruc: e.target.value.replace(/\D/g, "").slice(0, 11) })
              }
              maxLength={11}
            />
          </div>
          <div>
            <Label>Contacto</Label>
            <Input
              value={f.contacto ?? ""}
              onChange={(e) => set({ contacto: e.target.value })}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={f.telefono ?? ""}
              onChange={(e) => set({ telefono: e.target.value })}
            />
          </div>
          <div>
            <Label>Correo</Label>
            <Input
              type="email"
              value={f.correo ?? ""}
              onChange={(e) => set({ correo: e.target.value })}
            />
          </div>
          <div>
            <Label>Días crédito</Label>
            <Input
              type="number"
              value={f.dias_credito ?? 0}
              onChange={(e) =>
                set({ dias_credito: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="col-span-2">
            <Label>Dirección</Label>
            <Input
              value={f.direccion ?? ""}
              onChange={(e) => set({ direccion: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(f)}
            disabled={!f.razon_social?.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}