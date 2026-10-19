import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/media/")({
  beforeLoad: () => {
    throw redirect({ to: "/media/inforum" });
  },
  component: () => null,
});
