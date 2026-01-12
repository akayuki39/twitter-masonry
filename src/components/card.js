import { formatTime, escapeHTML, linkify } from "../utils/format.js";
import { pickMedia } from "../utils/tweet.js";
import { createLikeButton } from "./likeButton.js";

export const createCard = (tweet, openDetail) => {
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
  
  const card = document.createElement("article");
  card.className = "tm-card";
  card.dataset.tid = id;

  if (isRetweet && retweetName) {
    const retweetInfo = document.createElement("div");
    retweetInfo.className = "retweet-info";
    retweetInfo.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${retweetProfileUrl ? `<a href="${retweetProfileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(retweetName)} 已转帖</a>` : `<span>${escapeHTML(retweetName)} 已转帖</span>`}
    `;
    card.appendChild(retweetInfo);
  }

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
  time.textContent = formatTime(displayLegacy.created_at);
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
        openDetail(displayTweet, index);
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

  const likeBtn = createLikeButton(displayLegacy, id);

  const rtChip = document.createElement("div");
  rtChip.className = "tm-count-chip";
  rtChip.textContent = `${displayLegacy.retweet_count || 0} 转推`;

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
    openDetail(displayTweet);
  });
  return card;
};
