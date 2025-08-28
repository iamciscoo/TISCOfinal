"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Option {
  id: string;
  label: string;
}

interface SearchSelectProps<T = any> {
  value: string;
  onChange: (value: string) => void;
  fetchUrl: string; // e.g. /api/users or /api/products
  placeholder?: string;
  emptyText?: string;
  itemToOption: (item: T) => Option;
  limit?: number; // default 10
  buttonClassName?: string;
}

export const SearchSelect = <T,>({
  value,
  onChange,
  fetchUrl,
  placeholder = "Search...",
  emptyText = "No results",
  itemToOption,
  limit = 10,
  buttonClassName,
}: SearchSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // keep a stable label for the selected value even if it falls out of current options
  useEffect(() => {
    if (!open) return;
    // when opening, try to sync selected from current options if present
    const found = options.find((o) => o.id === value);
    if (found) setSelected(found);
  }, [open]);

  const fetchOptions = useCallback(async (q: string) => {
    // cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const url = new URL(fetchUrl, window.location.origin);
      if (q) url.searchParams.set("q", q);
      if (limit) url.searchParams.set("limit", String(limit));
      const res = await fetch(url.toString(), { signal: controller.signal });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load options");
      const rows: T[] = (json?.data || []) as T[];
      const opts = rows.map(itemToOption);
      // only apply state updates if this is the latest request
      if (abortRef.current === controller) {
        setOptions(opts);
        const found = opts.find((o) => o.id === value);
        if (found) setSelected(found);
      }
    } catch (err: any) {
      // Ignore expected abort errors from race/debounce/unmount
      if (err?.name === "AbortError" || err?.code === 20) {
        return;
      }
      // Optional: console.warn('SearchSelect fetch error:', err);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [fetchUrl, itemToOption, limit, value]);

  // debounced fetch when query changes and popover is open
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      void fetchOptions(query);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, open, fetchOptions]);

  // initial load when opening
  useEffect(() => {
    if (!open) return;
    void fetchOptions("");
  }, [open, fetchOptions]);

  // abort in-flight request on unmount and when closing the popover
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setLoading(false);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  const currentLabel = useMemo(() => {
    if (selected && selected.id === value) return selected.label;
    const inList = options.find((o) => o.id === value);
    if (inList) return inList.label;
    return "";
  }, [options, selected, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={buttonClassName ?? "w-full justify-between"}
        >
          <span className="truncate">
            {value ? currentLabel || "Selected" : placeholder}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 opacity-60"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(90vw,360px)] p-3" align="start">
        <div className="space-y-2">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="border rounded-md">
            <ScrollArea className="h-56">
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground">Loading...</div>
              ) : options.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">{emptyText}</div>
              ) : (
                <ul className="divide-y">
                  {options.map((opt) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                        onClick={() => {
                          onChange(opt.id);
                          setSelected(opt);
                          setOpen(false);
                        }}
                        aria-selected={value === opt.id}
                        role="option"
                      >
                        <span className="block truncate">{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
