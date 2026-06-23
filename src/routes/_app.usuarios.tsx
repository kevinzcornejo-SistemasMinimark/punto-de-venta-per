import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — POS Minimarket" }] }),
  component: UsuariosPage,
});

type Row = { id: string; usuario_id: string; rol: string; creado_en: string; perfiles: { nombre: string | null; correo: string | null } | null };

function UsuariosPage() {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !user) { setRows([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("roles_usuario")
        .select("id,usuario_id,rol,creado_en")
        .order("creado_en", { ascending: false });
      if (error) toast.error(error.message);
      const ids = (data ?? []).map((r: any) => r.usuario_id);
      let perfilesMap: Record<string, any> = {};
      if (ids.length) {
        const { data: p } = await supabase.from("perfiles").select("id,nombre,correo").in("id", ids);
        (p ?? []).forEach((x: any) => { perfilesMap[x.id] = x; });
      }
      setRows((data ?? []).map((r: any) => ({ ...r, perfiles: perfilesMap[r.usuario_id] ?? null })));
      setLoading(false);
    })();
  }, [user?.id, isDemo]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Usuarios y roles</h1>
        <p className="text-muted-foreground">Cuentas registradas en el sistema</p>
      </div>
      <Card className="p-4 text-sm bg-muted/30">
        Los nuevos usuarios se crean desde el panel de Supabase Auth. Luego asigna el rol insertando una fila en <code className="font-mono text-xs bg-card px-1 py-0.5 rounded">roles_usuario</code>.
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Correo</th><th className="px-4 py-2">Rol</th><th className="px-4 py-2">Desde</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sin usuarios con rol</td></tr>
            : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-medium">{r.perfiles?.nombre ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{r.perfiles?.correo ?? r.usuario_id.slice(0, 8)}</td>
                <td className="px-4 py-2"><Badge>{r.rol}</Badge></td>
                <td className="px-4 py-2 text-xs">{new Date(r.creado_en).toLocaleDateString("es-PE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}