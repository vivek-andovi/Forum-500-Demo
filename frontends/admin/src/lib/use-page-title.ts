import { useEffect } from "react";

/** Sets the browser tab title, e.g. "Members · Forum500 Admin". */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · Forum500 Admin`;
  }, [title]);
}
