import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — POS Minimarket" }] }),
  component: ConfigPage,
});

const CLAVES = [
  { k: "ruc_empresa", l: "RUC de la empresa" },
  { k: "razon_social", l: "Razón social" },
  { k: "direccion_fiscal", l: "Dirección fiscal" },
  { k: "telefono", l: "Teléfono" },
  { k: "serie_boleta", l: "Serie boleta", def: "B001" },
  { k: "serie_factura", l: "Serie factura", def: "F001" },
  { k: "moneda", l: "Moneda", def: "PEN" },
  { k: "igv_porcentaje", l: "IGV %", def: "18" },
];

function ConfigPage() {
  const { user, isDemo, isAdmin } = useAuth();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("configuracion").select("clave,valor");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.clave] = r.valor ?? ""; });
      CLAVES.forEach((c) => { if (!(c.k in map) && c.def) map[c.k] = c.def; });
      setVals(map); setLoading(false);
    })();
  }, [user?.id, isDemo]);

  const save = async () => {
    if (!isAdmin) return toast.error("Solo administradores");
    const upserts = CLAVES.map((c) => ({ clave: c.k, valor: vals[c.k] ?? "" }));
    const { error } = await supabase.from("configuracion").upsert(upserts, { onConflict: "clave" });
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configuración</h1>
        <p className="text-muted-foreground">Datos de la empresa y parámetros del sistema</p>
      </div>
      <Card className="p-6 space-y-3">
        {loading ? <div className="text-muted-foreground">Cargando…</div>
        : CLAVES.map((c) => (
          <div key={c.k} className="grid grid-cols-3 gap-3 items-center">
            <Label className="col-span-1">{c.l}</Label>
            <Input className="col-span-2" value={vals[c.k] ?? ""} onChange={(e) => setVals({ ...vals, [c.k]: e.target.value })} />
          </div>
        ))}
        <div className="flex justify-end pt-3 border-t">
          <Button onClick={save} disabled={loading || isDemo}><Save className="h-4 w-4 mr-1" />Guardar</Button>
        </div>
      </Card>
    </div>
  );
}