let imageOverlay = null;
let imageModal = null;

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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImagePreview();
  });
  document.body.appendChild(overlay);
  imageOverlay = overlay;
  imageModal = modal;
  return { overlay, modal };
};

export const openImagePreview = (imageUrl) => {
  const { overlay, modal } = ensureImageLayer();
  modal.innerHTML = "";
  const img = document.createElement("img");
  img.src = imageUrl;
  img.className = "tm-preview-image";
  modal.appendChild(img);
  overlay.classList.add("show");
  document.body.classList.add("tm-image-open");
};

export const closeImagePreview = () => {
  if (!imageOverlay) return;
  imageOverlay.classList.remove("show");
  document.body.classList.remove("tm-image-open");
};
