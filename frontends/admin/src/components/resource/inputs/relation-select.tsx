"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";
import type { OptionItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useOptionLabels } from "@/components/resource/hooks";

export function RelationSelect({
  resource,
  value,
  onChange,
  initialLabel,
  disabled,
  clearable,
  id,
  invalid,
}: {
  resource: string;
  value: string;
  onChange: (v: string) => void;
  initialLabel?: string | null;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [picked, setPicked] = useState<OptionItem | null>(null);

  const options = useQuery({
    queryKey: ["options", resource, debounced],
    queryFn: () => api<OptionItem[]>(`/admin/options/${resource}`, { query: { search: debounced } }),
    enabled: open,
    staleTime: 30_000,
  });

  const knownLabel =
    (picked?.id === value ? picked.label : undefined) ??
    options.data?.find((o) => o.id === value)?.label ??
    initialLabel ??
    undefined;
  const resolved = useOptionLabels(resource, value && !knownLabel ? [value] : []);
  const label = knownLabel ?? resolved.data?.find((o) => o.id === value)?.label;

  return (
    <div className="flex gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-9 min-w-0 flex-1 justify-between bg-background px-3 font-normal hover:bg-background hover:text-foreground",
              !value && "text-muted-foreground",
              invalid && "border-destructive",
            )}
          >
            <span className="truncate">
              {value ? (label ?? (resolved.isLoading ? "Loading…" : value)) : "Select…"}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
            <CommandList>
              {options.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>{options.error ? "Could not load options." : "No results."}</CommandEmpty>
                  <CommandGroup>
                    {(options.data ?? []).map((o) => (
                      <CommandItem
                        key={o.id}
                        value={o.id}
                        onSelect={() => {
                          setPicked(o);
                          onChange(o.id);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("size-4", value === o.id ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{o.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && clearable && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label="Clear"
          className="shrink-0"
        >
          <X />
        </Button>
      )}
      {value && (
        <Button asChild type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Open record">
          <Link href={`/r/${resource}/${value}`} target="_blank">
            <ExternalLink />
          </Link>
        </Button>
      )}
    </div>
  );
}
