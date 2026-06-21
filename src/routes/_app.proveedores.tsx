import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/proveedores")({
  head: () => ({ meta: [{ title: "Proveedores — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Proveedores" description="CRUD de proveedores" />,
});
