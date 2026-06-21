import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/categorias")({
  head: () => ({ meta: [{ title: "Categorías — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Categorías" description="CRUD de categorías con icono y color" />,
});
