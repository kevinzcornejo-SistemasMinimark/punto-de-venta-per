import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/productos")({
  head: () => ({ meta: [{ title: "Productos — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Productos" description="CRUD de productos con código de barras, stock e imagen" />,
});
