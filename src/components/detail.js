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
  const isRetweet = legacy.retweeted_status_result;
  const retweetData = isRetweet ? legacy.retweeted_status_result.result : null;
  const displayLegacy = retweetData?.legacy || legacy;
  const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
  const displayCore = retweetData?.core || tweet.core;
  const displayTweet = retweetData || tweet;
  
  const text = displayLegacy.full_text || displayLegacy.text || "";
  const media = pickMedia(displayTweet);
  const user = displayUser?.screen_name || displayLegacy.user_id_str || "unknown";
  const avatar = displayCore?.user_results?.result?.avatar?.image_url;
  const name = displayUser?.name || user;
  const id = displayTweet.rest_id || displayLegacy.id_str;
  const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
  
  const retweetUser = tweet.core?.user_results?.result?.core;
  const retweetName = retweetUser?.name || "";
  const retweetScreenName = retweetUser?.screen_name || "";
  const retweetProfileUrl = retweetScreenName ? `https://x.com/${encodeURIComponent(retweetScreenName)}` : "";

  const wrapper = document.createElement("div");
  wrapper.className = "tm-detail-card";

  const closeBtn = document.createElement("button");
  closeBtn.className = "tm-detail-close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.onclick = closeDetail;

  if (isRetweet && retweetName) {
    const retweetInfo = document.createElement("div");
    retweetInfo.className = "retweet-info";
    retweetInfo.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${retweetProfileUrl ? `<a href="${retweetProfileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(retweetName)} 已转帖</a>` : `<span>${escapeHTML(retweetName)} 已转帖</span>`}
    `;
    wrapper.appendChild(retweetInfo);
  }

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
  time.textContent = formatTime(displayLegacy.created_at);
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

  const likeBtn = createLikeButton(displayLegacy, id);

  const rtChip = document.createElement("div");
  rtChip.className = "tm-count-chip";
  rtChip.textContent = `${displayLegacy.retweet_count || 0} 转推`;

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
