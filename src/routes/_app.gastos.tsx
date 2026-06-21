import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/gastos")({
  head: () => ({ meta: [{ title: "Gastos — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Gastos" description="Registro de gastos del negocio" />,
});
