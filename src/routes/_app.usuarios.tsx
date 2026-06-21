import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Usuarios" description="Gestión de usuarios y roles del sistema" />,
});
