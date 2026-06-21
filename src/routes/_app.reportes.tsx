import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({ meta: [{ title: "Reportes — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Reportes" description="Ventas, productos, categorías y métodos de pago" />,
});
