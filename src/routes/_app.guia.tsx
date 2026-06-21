import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/guia")({
  head: () => ({ meta: [{ title: "Guía — POS Minimarket" }] }),
  component: () => <PagePlaceholder title="Guía" description="Manual de uso del POS" />,
});
