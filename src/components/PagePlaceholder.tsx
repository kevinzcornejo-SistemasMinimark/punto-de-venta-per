import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">{title}</h1>
      {description && (
        <p className="text-muted-foreground mb-6">{description}</p>
      )}
      <Card className="p-10 text-center border-dashed">
        <Construction className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <div className="font-semibold">Módulo en construcción</div>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Esta sección se conectará a Supabase cuando corras la migración de
          base de datos. Mientras tanto puedes seguir probando el POS y el
          modo demo.
        </p>
      </Card>
    </div>
  );
}