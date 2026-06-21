import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Ajustes" description="Configuración del negocio, pantalla cliente, impresora" />,
});
