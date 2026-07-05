import { setDetailOpen } from "../utils/state.js";

let imageOverlay = null;
let imageModal = null;
let imageKeyHandler = null;

/**
 * 确保大图预览层存在，只创建一次
 * @returns {{overlay: HTMLElement, modal: HTMLElement}}
 */
export const ensureImageLayer = () => {
  if (imageOverlay && imageModal) return { overlay: imageOverlay, modal: imageModal };
  const overlay = document.createElement("div");
  overlay.className = "tm-image-backdrop";
  const modal = document.createElement("div");
  modal.className = "tm-image-modal";
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeImagePreview();
  });
  document.body.appendChild(overlay);
  imageOverlay = overlay;
  imageModal = modal;
  return { overlay, modal };
};

/**
 * 打开大图预览，支持多图左右切换
 * @param {string|string[]} images - 图片URL或URL数组
 * @param {number} [startIndex=0] - 起始图片索引（多图时生效）
 */
export const openImagePreview = (images, startIndex = 0) => {
  setDetailOpen(true);
  const { overlay, modal } = ensureImageLayer();

  // 统一为数组
  const list = Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean);
  if (list.length === 0) return;

  // 移除上一次的键盘监听
  if (imageKeyHandler) {
    document.removeEventListener("keydown", imageKeyHandler);
    imageKeyHandler = null;
  }

  modal.innerHTML = "";
  let idx = Math.min(Math.max(0, startIndex), list.length - 1);
  const total = list.length;

  const img = document.createElement("img");
  img.className = "tm-preview-image";
  img.addEventListener("click", closeImagePreview);
  modal.appendChild(img);

  // 多图时添加左右切换
  let prevBtn = null;
  let nextBtn = null;
  let counter = null;

  const clamp = (i) => Math.min(total - 1, Math.max(0, i));
  const render = () => {
    img.src = list[idx];
    if (total > 1) {
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === total - 1;
      counter.textContent = `${idx + 1} / ${total}`;
    }
  };

  const prev = () => { idx = clamp(idx - 1); render(); };
  const next = () => { idx = clamp(idx + 1); render(); };

  if (total > 1) {
    prevBtn = document.createElement("button");
    prevBtn.className = "tm-preview-arrow prev";
    prevBtn.type = "button";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.setAttribute("aria-label", "上一张");
    prevBtn.onclick = (e) => { e.stopPropagation(); prev(); };

    nextBtn = document.createElement("button");
    nextBtn.className = "tm-preview-arrow next";
    nextBtn.type = "button";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.setAttribute("aria-label", "下一张");
    nextBtn.onclick = (e) => { e.stopPropagation(); next(); };

    counter = document.createElement("div");
    counter.className = "tm-preview-counter";

    modal.appendChild(prevBtn);
    modal.appendChild(nextBtn);
    modal.appendChild(counter);
  }

  imageKeyHandler = (e) => {
    if (e.key === "Escape") {
      closeImagePreview();
      e.preventDefault();
    } else if (total > 1 && e.key === "ArrowRight") {
      next();
      e.preventDefault();
    } else if (total > 1 && e.key === "ArrowLeft") {
      prev();
      e.preventDefault();
    }
  };
  document.addEventListener("keydown", imageKeyHandler);

  render();
  overlay.classList.add("show");
  document.body.classList.add("tm-image-open");
};

export const closeImagePreview = () => {
  if (!imageOverlay) return;
  if (imageKeyHandler) {
    document.removeEventListener("keydown", imageKeyHandler);
    imageKeyHandler = null;
  }
  imageOverlay.classList.remove("show");
  document.body.classList.remove("tm-image-open");
  setDetailOpen(false);
};
