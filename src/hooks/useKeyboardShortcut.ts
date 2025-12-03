import { useEffect } from "react";

type KeyCombo = string; // Ex: "ctrl+s", "cmd+k", "esc"

export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = keyCombo.toLowerCase().split("+");
      const hasCtrl = keys.includes("ctrl") || keys.includes("cmd");
      const hasShift = keys.includes("shift");
      const hasAlt = keys.includes("alt");
      const mainKey = keys[keys.length - 1];

      const ctrlMatch = hasCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = hasShift ? event.shiftKey : !event.shiftKey;
      const altMatch = hasAlt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === mainKey;

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyCombo, callback, enabled]);
}

