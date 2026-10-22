"use client";

import { resourceConfig } from "@/lib/resource-registry";
import type { ExtrasProps } from "@/components/resource/extras/types";

/** Renders the resource's workflow panel (registered as `Extras` in lib/resource-registry), if any. */
export function ResourceExtras(props: ExtrasProps) {
  const Extras = resourceConfig(props.resource.name).Extras;
  return Extras ? <Extras {...props} /> : null;
}
