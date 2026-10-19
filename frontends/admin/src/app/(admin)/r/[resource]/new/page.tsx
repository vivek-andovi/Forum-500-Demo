"use client";

import { useParams } from "next/navigation";
import { ResourceGate } from "@/components/resource/resource-gate";
import { ResourceEditor } from "@/components/resource/resource-editor";

export default function NewResourcePage() {
  const { resource: name } = useParams<{ resource: string }>();
  return <ResourceGate name={name}>{(r) => <ResourceEditor key={r.name} resource={r} />}</ResourceGate>;
}
