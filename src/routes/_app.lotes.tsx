import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/lotes")({
  head: () => ({ meta: [{ title: "Lotes — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Lotes" description="Control de lotes y fechas de vencimiento" />,
});
