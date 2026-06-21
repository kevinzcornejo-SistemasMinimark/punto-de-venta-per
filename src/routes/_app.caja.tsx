import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/caja")({
  head: () => ({ meta: [{ title: "Caja — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Caja" description="Apertura, cierre, cuadre y caja chica" />,
});
