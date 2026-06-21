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
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — POS Minimarket" }] }),
  component: ClientesPage,
});

type Cliente = {
  id: string;
  tipo_documento: string;
  numero_documento: string | null;
  nombres: string;
  apellidos: string | null;
  razon_social: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
};

const TIPOS_DOC = ["DNI", "RUC", "CE", "PASAPORTE", "SIN_DOCUMENTO"];

function ClientesPage() {
  const { isDemo, user } = useAuth();
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const load = async () => {
    if (isDemo || !user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,tipo_documento,numero_documento,nombres,apellidos,razon_social,telefono,correo,direccion,activo",
      )
      .order("creado_en", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Cliente[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [isDemo, user?.id]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter(
      (c) =>
        c.nombres.toLowerCase().includes(k) ||
        (c.apellidos ?? "").toLowerCase().includes(k) ||
        (c.numero_documento ?? "").includes(k) ||
        (c.telefono ?? "").includes(k),
    );
  }, [rows, q]);

  const onSave = async (c: Partial<Cliente>) => {
    if (isDemo || !user) {
      toast.info("Demo: no se guarda en la base de datos");
      setOpen(false);
      return;
    }
    const payload: any = {
      tipo_documento: c.tipo_documento ?? "DNI",
      numero_documento: c.numero_documento || null,
      nombres: c.nombres,
      apellidos: c.apellidos || null,
      razon_social: c.razon_social || null,
      telefono: c.telefono || null,
      correo: c.correo || null,
      direccion: c.direccion || null,
      activo: true,
    };
    const { error } = editing?.id
      ? await supabase.from("clientes").update(payload).eq("id", editing.id)
      : await supabase.from("clientes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Cliente guardado");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    void load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Clientes
          </h1>
          <p className="text-muted-foreground">Base de datos de clientes</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo cliente
        </Button>
      </div>

      {isDemo && (
        <Card className="p-4 text-sm border-amber-500/30 bg-amber-500/5">
          Modo demo activo · inicia sesión real para guardar clientes.
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, documento o teléfono…"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Documento</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Sin clientes
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-medium">
                    {c.razon_social ||
                      [c.nombres, c.apellidos].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {c.tipo_documento} {c.numero_documento ?? "—"}
                  </td>
                  <td className="px-4 py-2">{c.telefono ?? "—"}</td>
                  <td className="px-4 py-2">{c.correo ?? "—"}</td>
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

      <ClienteModal
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

function ClienteModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Cliente | null;
  onSave: (c: Partial<Cliente>) => void;
}) {
  const [f, setF] = useState<Partial<Cliente>>({});
  useEffect(() => {
    if (open) setF(initial ?? { tipo_documento: "DNI", nombres: "" });
  }, [open, initial]);
  const set = (patch: Partial<Cliente>) => setF((p) => ({ ...p, ...patch }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar" : "Nuevo"} cliente</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo doc.</Label>
            <Select
              value={f.tipo_documento ?? "DNI"}
              onValueChange={(v) => set({ tipo_documento: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOC.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Número doc.</Label>
            <Input
              value={f.numero_documento ?? ""}
              onChange={(e) => set({ numero_documento: e.target.value })}
            />
          </div>
          <div>
            <Label>Nombres</Label>
            <Input
              value={f.nombres ?? ""}
              onChange={(e) => set({ nombres: e.target.value })}
            />
          </div>
          <div>
            <Label>Apellidos</Label>
            <Input
              value={f.apellidos ?? ""}
              onChange={(e) => set({ apellidos: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Razón social (si es empresa)</Label>
            <Input
              value={f.razon_social ?? ""}
              onChange={(e) => set({ razon_social: e.target.value })}
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
          <Button onClick={() => onSave(f)} disabled={!f.nombres?.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}