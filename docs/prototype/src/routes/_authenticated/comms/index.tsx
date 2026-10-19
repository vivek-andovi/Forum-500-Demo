import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/comms/")({
  beforeLoad: async () => {
    throw redirect({ to: "/comms/messages" });
  },
});
