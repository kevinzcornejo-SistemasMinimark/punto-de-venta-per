import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPEN } from "@/lib/format";

export const Route = createFileRoute("/_app/combos")({
  head: () => ({ meta: [{ title: "Combos — POS Minimarket" }] }),
  component: CombosPage,
});

function CombosPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("combos").select("id,nombre,descripcion,precio_combo,descuento_porcentaje,activo,combo_items(cantidad,productos(nombre))").order("nombre");
      setRows(data ?? []); setLoading(false);
    })();
  }, [user?.id, isDemo]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Package2 className="h-6 w-6 text-primary" /> Combos y promociones</h1>
        <p className="text-muted-foreground">Paquetes de productos con precio especial</p>
      </div>
      {loading ? <div className="text-muted-foreground">Cargando…</div>
      : rows.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Sin combos creados</Card>
      : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((c) => (
          <Card key={c.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="font-bold">{c.nombre}</div>
              <Badge variant={c.activo ? "default" : "secondary"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
            {c.descripcion && <p className="text-xs text-muted-foreground">{c.descripcion}</p>}
            <div className="text-2xl font-extrabold text-primary">{formatPEN(c.precio_combo)}</div>
            {c.descuento_porcentaje > 0 && <Badge className="bg-emerald-500">-{c.descuento_porcentaje}%</Badge>}
            <div className="border-t pt-2 text-xs space-y-1">
              {(c.combo_items ?? []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.productos?.nombre ?? "—"}</span>
                  <span className="font-mono">×{it.cantidad}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>}
    </div>
  );
}