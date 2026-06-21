import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/tickets")({
  head: () => ({ meta: [{ title: "Tickets — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Tickets" description="Histórico de ventas y comprobantes" />,
});
