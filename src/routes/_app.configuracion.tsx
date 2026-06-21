import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Configuración" description="Gestión del sistema (backup, reset)" />,
});
