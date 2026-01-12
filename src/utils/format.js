export const escapeHTML = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const linkify = (text = "") =>
  escapeHTML(text).replace(/(https?:\/\/[\w./?=&%#-]+)/g, '<a href="$1" target="_blank">$1</a>');

export const formatTime = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d)) return d.toLocaleString();
  const tryD = new Date(Date.parse(raw));
  return isNaN(tryD) ? raw : tryD.toLocaleString();
};
