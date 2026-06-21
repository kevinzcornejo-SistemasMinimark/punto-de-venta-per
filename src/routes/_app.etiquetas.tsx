import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/etiquetas")({
  head: () => ({ meta: [{ title: "Etiquetas — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Etiquetas" description="Impresión de etiquetas con código de barras" />,
});
