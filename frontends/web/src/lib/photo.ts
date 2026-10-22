import { toast } from "sonner";
import type { GalleryPhoto } from "@/features/events/types";

/** Copies a gallery photo to the clipboard as PNG (the only image type browsers accept there). */
export async function copyPhoto(photo: GalleryPhoto) {
  try {
    const blob = await (await fetch(photo.url)).blob();
    const png = blob.type === "image/png" ? blob : await toPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    toast.success("Photo copied — paste it wherever you need it.");
  } catch {
    toast.error("Your browser blocked copying. Use Download instead.");
  }
}

/** Re-encodes any image blob as PNG via a canvas. */
export function toPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
    };
    img.onerror = () => reject(new Error("load failed"));
    img.src = URL.createObjectURL(blob);
  });
}

/** Downloads a gallery photo, named after its caption; opens it directly if the fetch is blocked. */
export async function downloadPhoto(photo: GalleryPhoto) {
  const name = `${(photo.caption || "forum500-photo").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
  let href = photo.url;
  let revoke = false;
  try {
    const blob = await (await fetch(photo.url)).blob();
    href = URL.createObjectURL(blob);
    revoke = true;
  } catch {
    // Cross-origin fetch blocked — fall back to opening the image directly.
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
