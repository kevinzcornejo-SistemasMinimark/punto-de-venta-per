import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/compras")({
  head: () => ({ meta: [{ title: "Compras — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Compras" description="Registro de compras a proveedores" />,
});
