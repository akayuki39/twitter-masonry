import { createLikeButton, setToast } from "./likeButton.js";
import { createCarousel } from "./carousel.js";
import { formatTime, escapeHTML, linkify } from "../utils/format.js";
import { pickMedia } from "../utils/tweet.js";

let activeCarouselControls = null;
let detailOverlay = null;
let detailModal = null;
let scrollBackup = 0;
let scrollbarWidth = 0;

export const setActiveCarouselControls = (controls) => {
  activeCarouselControls = controls;
};

export const ensureDetailLayer = () => {
  if (detailOverlay && detailModal) return { overlay: detailOverlay, modal: detailModal };
  const overlay = document.createElement("div");
  overlay.className = "tm-detail-backdrop";
  const modal = document.createElement("div");
  modal.className = "tm-detail-modal";
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDetail();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
    if (detailOverlay?.classList.contains("show") && activeCarouselControls) {
      if (e.key === "ArrowRight") {
        activeCarouselControls.next();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        activeCarouselControls.prev();
        e.preventDefault();
      }
    }
  });
  document.body.appendChild(overlay);
  detailOverlay = overlay;
  detailModal = modal;
  return { overlay, modal };
};

export const closeDetail = () => {
  if (!detailOverlay) return;
  detailOverlay.classList.remove("show");
  document.body.classList.remove("tm-detail-open");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.documentElement.style.removeProperty("--tm-scrollbar-width");
  document.body.style.paddingRight = "";
  window.scrollTo({ top: scrollBackup, behavior: "auto" });
  activeCarouselControls = null;
};

export const createDetailCard = (tweet, initialImageIndex = 0) => {
  activeCarouselControls = null;
  const legacy = tweet.legacy || tweet;
  const text = legacy.full_text || legacy.text || "";
  const media = pickMedia(tweet);
  const user = (tweet.core?.user_results?.result?.core?.screen_name) || legacy.user_id_str || "unknown";
  const avatar = tweet.core?.user_results?.result?.avatar?.image_url;
  const name = tweet.core?.user_results?.result?.core?.name || user;
  const id = tweet.rest_id || legacy.id_str;
  const profileUrl = `https://x.com/${encodeURIComponent(user)}`;

  const wrapper = document.createElement("div");
  wrapper.className = "tm-detail-card";

  const closeBtn = document.createElement("button");
  closeBtn.className = "tm-detail-close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.onclick = closeDetail;

  const meta = document.createElement("div");
  meta.className = "meta";
  const userSpan = document.createElement("div");
  userSpan.className = "user";
  userSpan.innerHTML = `
    ${avatar ? `<a class="tm-user-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer"><img class="tm-avatar" src="${avatar}" loading="lazy"></a>` : ""}
    <div class="info">
      <a class="name tm-name-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)}</a>
      <a class="screen tm-screen-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer">@${escapeHTML(user)}</a>
    </div>
  `;
  const time = document.createElement("div");
  time.className = "time";
  time.textContent = formatTime(legacy.created_at);
  meta.appendChild(userSpan);
  meta.appendChild(time);

  const textDiv = document.createElement("div");
  textDiv.className = "text";
  textDiv.innerHTML = linkify(text);

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "media";
  if (media.length > 1) {
    const { el, controls } = createCarousel(media, initialImageIndex);
    mediaWrap.appendChild(el);
    activeCarouselControls = controls;
  } else {
    for (const m of media) {
      if (m.type === "photo") {
        const img = document.createElement("img");
        const url = m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`;
        img.src = url;
        img.loading = "lazy";
        mediaWrap.appendChild(img);
      } else if (m.type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.src = m.url;
        mediaWrap.appendChild(v);
      }
    }
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  const left = document.createElement("div");
  left.className = "tm-actions-left";

  const likeBtn = createLikeButton(legacy, id);

  const rtChip = document.createElement("div");
  rtChip.className = "tm-count-chip";
  rtChip.textContent = `${legacy.retweet_count || 0} 转推`;

  left.appendChild(likeBtn);
  left.appendChild(rtChip);

  const openLink = document.createElement("a");
  openLink.href = `https://x.com/${user}/status/${id}`;
  openLink.target = "_blank";
  openLink.textContent = "在 X 打开";
  actions.appendChild(left);
  actions.appendChild(openLink);

  wrapper.appendChild(closeBtn);
  wrapper.appendChild(meta);
  if (text) wrapper.appendChild(textDiv);
  if (media.length) wrapper.appendChild(mediaWrap);
  wrapper.appendChild(actions);
  wrapper.addEventListener("click", (e) => e.stopPropagation());
  return wrapper;
};

export const openDetail = (tweet, initialImageIndex = 0) => {
  const { overlay, modal } = ensureDetailLayer();
  scrollBackup = window.scrollY;
  scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty("--tm-scrollbar-width", `${Math.max(scrollbarWidth, 0)}px`);
  document.body.style.paddingRight = `${Math.max(scrollbarWidth, 0)}px`;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.documentElement.scrollTop = scrollBackup;
  document.body.scrollTop = scrollBackup;
  window.scrollTo({ top: scrollBackup, behavior: "auto" });
  modal.innerHTML = "";
  modal.appendChild(createDetailCard(tweet, initialImageIndex));
  overlay.classList.add("show");
  document.body.classList.add("tm-detail-open");
};
