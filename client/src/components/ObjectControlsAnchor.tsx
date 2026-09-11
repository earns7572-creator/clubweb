import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Position presentation beside the existing projected label; never touch the camera or scene. */
export default function ObjectControlsAnchor({ children, selectionKey, open, hidden }: {
  children: ReactNode;
  selectionKey: string;
  open: boolean;
  hidden: boolean;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const place = () => {
      if (window.innerWidth <= 760) return;
      const label = document.querySelector(".contextual-diagram-label");
      const rect = label?.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const x = rect ? (rect.right + width + 32 < window.innerWidth ? rect.right + 28 : rect.left - width - 28) : window.innerWidth - width - 28;
      const y = rect ? rect.top + 28 : window.innerHeight - height - 82;
      panel.style.left = `${Math.max(204, Math.min(x, window.innerWidth - width - 24))}px`;
      panel.style.top = `${Math.max(86, Math.min(y, window.innerHeight - height - 82))}px`;
    };
    // One frame lets Drei's existing Html label finish projecting after a view change.
    const frame = requestAnimationFrame(place);
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    window.addEventListener("resize", place);
    document.addEventListener("pointerup", place);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerup", place);
    };
  }, [selectionKey, hidden]);

  return <aside ref={panelRef} className={`spatial-inspector ${open ? "mobile-open" : ""}`} hidden={hidden} aria-label="Selected speaker">{children}</aside>;
}
