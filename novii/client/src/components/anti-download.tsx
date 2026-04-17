import { useEffect } from "react";

export function AntiDownload() {
  useEffect(() => {
    const isMediaTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "IMG" || tag === "VIDEO" || tag === "SOURCE" || tag === "PICTURE") return true;
      const closest = el.closest?.("img, video, picture, [data-protect-media]");
      return !!closest;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isMediaTarget(e.target)) e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      if (isMediaTarget(e.target)) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Ctrl/Cmd + S (Save Page)
      if ((e.ctrlKey || e.metaKey) && k === "s") {
        e.preventDefault();
      }
    };

    const hardenAllMedia = () => {
      document.querySelectorAll("video").forEach((v) => {
        v.setAttribute("controlsList", "nodownload noremoteplayback noplaybackrate");
        (v as any).disablePictureInPicture = true;
        v.setAttribute("disablePictureInPicture", "true");
      });
      document.querySelectorAll("img").forEach((img) => {
        img.setAttribute("draggable", "false");
      });
    };

    hardenAllMedia();
    const mo = new MutationObserver(hardenAllMedia);
    mo.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      mo.disconnect();
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
