import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/kardex")({
  head: () => ({ meta: [{ title: "Kardex — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Kardex" description="Historial de movimientos de inventario" />,
});
