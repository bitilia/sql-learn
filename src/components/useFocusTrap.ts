import { useEffect, type RefObject } from "react";

export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>("button, [href], textarea, input, select, [tabindex]:not([tabindex='-1'])")].filter(
        (node) => !node.hasAttribute("disabled"),
      );
    const frame = window.requestAnimationFrame(() => focusable()[0]?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [active, ref]);
}
