import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/inventario")({
  head: () => ({ meta: [{ title: "Inventario — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Inventario" description="Stock por tienda y movimientos" />,
});
