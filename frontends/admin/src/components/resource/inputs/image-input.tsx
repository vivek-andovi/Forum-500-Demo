"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { errorMessage, uploadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ImageInput({
  value,
  onChange,
  disabled,
  id,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);

  async function onFile(file: File) {
    setUploading(true);
    try {
      const res = await uploadFile(file);
      onChange(res.url);
      setBroken(false);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-3">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground/60" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Input
          id={id}
          type="url"
          value={value}
          disabled={disabled}
          placeholder="https://…"
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
          className={cn("bg-background", invalid && "border-destructive")}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            Upload
          </Button>
          {value && !disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X /> Clear
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </div>
  );
}
