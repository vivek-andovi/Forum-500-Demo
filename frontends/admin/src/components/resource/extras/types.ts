import type { AdminRecord, ResourceMeta } from "@/lib/types";

/** Props every workflow panel receives. Call `onChanged` after an action so the editor reloads the record. */
export type ExtrasProps = {
  resource: ResourceMeta;
  record: AdminRecord;
  onChanged: () => Promise<void> | void;
};
