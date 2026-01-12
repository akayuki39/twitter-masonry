import { formatTime, escapeHTML, linkify } from "../utils/format.js";
import { pickMedia } from "../utils/tweet.js";
import { createLikeButton } from "./likeButton.js";

export const createCard = (tweet, openDetail) => {
  const legacy = tweet.legacy || tweet;
  const text = legacy.full_text || legacy.text || "";
  const media = pickMedia(tweet);
  const user = (tweet.core?.user_results?.result?.core?.screen_name) || legacy.user_id_str || "unknown";
  const avatar = tweet.core?.user_results?.result?.avatar?.image_url;
  const name = tweet.core?.user_results?.result?.core?.name || user;
  const id = tweet.rest_id || legacy.id_str;
  const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
  const card = document.createElement("article");
  card.className = "tm-card";
  card.dataset.tid = id;

  const meta = document.createElement("div");
  meta.className = "meta";
  const userSpan = document.createElement("div");
  userSpan.className = "user";
  userSpan.innerHTML = `
    ${avatar ? `<a class="tm-user-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer"><img class="tm-avatar" src="${avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"></a>` : ""}
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
  media.forEach((m, index) => {
    if (m.type === "photo") {
      const img = document.createElement("img");
      img.loading = "eager";
      img.src = m.url;
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetail(tweet, index);
      });
      mediaWrap.appendChild(img);
    } else if (m.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.src = m.url;
      mediaWrap.appendChild(v);
    }
  });

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

  const right = document.createElement("a");
  right.href = `https://x.com/${user}/status/${id}`;
  right.target = "_blank";
  right.textContent = "在 X 打开";
  actions.appendChild(left);
  actions.appendChild(right);

  card.appendChild(meta);
  if (text) card.appendChild(textDiv);
  if (media.length) card.appendChild(mediaWrap);
  card.appendChild(actions);

  card.addEventListener("click", (e) => {
    if (e.target.closest(".tm-like") || e.target.closest("a") || e.target.closest("video")) return;
    openDetail(tweet);
  });
  return card;
};
