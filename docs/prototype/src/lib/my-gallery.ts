import { useCallback, useEffect, useState } from "react";

/** A photo the member has tagged from the events Gallery into their own My Gallery. */
export interface TaggedPhoto {
  id: string;
  caption: string;
  event: string;
  date: string;
  src: string;
}

const STORAGE_KEY = "forum500-my-gallery";
const EVENT = "my-gallery-changed";

export function loadTaggedPhotos(): TaggedPhoto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaggedPhoto[]) : [];
  } catch {
    return [];
  }
}

function saveTaggedPhotos(photos: TaggedPhoto[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  window.dispatchEvent(new Event(EVENT));
}

export function useTaggedGallery() {
  const [photos, setPhotos] = useState<TaggedPhoto[]>(() => loadTaggedPhotos());

  useEffect(() => {
    const refresh = () => setPhotos(loadTaggedPhotos());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isTagged = useCallback((id: string) => photos.some((p) => p.id === id), [photos]);

  const toggle = useCallback((photo: TaggedPhoto) => {
    const current = loadTaggedPhotos();
    if (current.some((p) => p.id === photo.id)) {
      saveTaggedPhotos(current.filter((p) => p.id !== photo.id));
      return false;
    }
    saveTaggedPhotos([photo, ...current]);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    saveTaggedPhotos(loadTaggedPhotos().filter((p) => p.id !== id));
  }, []);

  return { photos, isTagged, toggle, remove };
}
