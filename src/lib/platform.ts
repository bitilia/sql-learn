function onMac() {
  if (typeof navigator === "undefined") return false;
  const platform = `${navigator.platform} ${navigator.userAgent}`;
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

const mac = onMac();

export const shortcut = {
  run: mac ? "⌘ Enter" : "Ctrl+Enter",
  format: mac ? "⌘ Shift F" : "Ctrl+Shift+F",
};
