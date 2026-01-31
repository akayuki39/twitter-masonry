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

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};
