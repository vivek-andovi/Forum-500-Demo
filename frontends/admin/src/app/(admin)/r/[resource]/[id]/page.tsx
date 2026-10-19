"use client";

import { useParams } from "next/navigation";
import { ResourceGate } from "@/components/resource/resource-gate";
import { ResourceEditor } from "@/components/resource/resource-editor";

export default function EditResourcePage() {
  const { resource: name, id } = useParams<{ resource: string; id: string }>();
  return (
    <ResourceGate name={name}>
      {(r) => <ResourceEditor key={`${r.name}-${id}`} resource={r} id={id} />}
    </ResourceGate>
  );
}
