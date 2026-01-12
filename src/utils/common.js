export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const getCookie = (name) => {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
};
