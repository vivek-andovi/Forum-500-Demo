import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · Forum500 Admin`;
  }, [title]);
}
