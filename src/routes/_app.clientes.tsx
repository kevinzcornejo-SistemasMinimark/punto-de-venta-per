import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Clientes" description="CRUD de clientes, créditos y puntos" />,
});
