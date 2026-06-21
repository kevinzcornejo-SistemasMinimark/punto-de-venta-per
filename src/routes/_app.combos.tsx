import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/combos")({
  head: () => ({ meta: [{ title: "Combos — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Combos" description="Agrupa productos con precio especial" />,
});
