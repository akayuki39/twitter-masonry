export const createToast = () => {
  let el = null;
  return (msg, timeout = 2000) => {
    if (!el) {
      el = document.createElement("div");
      el.className = "tm-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), timeout);
  };
};
