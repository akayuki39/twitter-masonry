import { formatTime, escapeHTML } from "../utils/format.js";
import { getCleanText, pickMedia } from "../utils/tweet.js";
import { createLikeButton } from "./likeButton.js";
import { processTweetText } from "../utils/textProcessor.js";

export const createQuoteTweet = (quotedTweet) => {
  const quoteLegacy = quotedTweet.legacy || quotedTweet;
  const quoteCore = quotedTweet.core;
  const quoteUser = quoteCore?.user_results?.result?.core;
  const text = getCleanText(quotedTweet);
  const media = pickMedia(quotedTweet);
  const user = quoteUser?.screen_name || quoteLegacy.user_id_str || "unknown";
  const avatar = quoteCore?.user_results?.result?.avatar?.image_url;
  const name = quoteUser?.name || user;
  const id = quotedTweet.rest_id || quoteLegacy.id_str;
  const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
  const createdAt = quoteLegacy.created_at || "";

  const quoteCard = document.createElement("div");
  quoteCard.className = "tm-quote-card";

  const meta = document.createElement("div");
  meta.className = "tm-quote-meta";

  const userSpan = document.createElement("div");
  userSpan.className = "tm-quote-user";
  if (avatar) {
    const avatarLink = document.createElement("a");
    avatarLink.href = profileUrl;
    avatarLink.target = "_blank";
    avatarLink.rel = "noopener noreferrer";
    avatarLink.className = "tm-user-link";
    const avatarImg = document.createElement("img");
    avatarImg.className = "tm-quote-avatar";
    avatarImg.src = avatar;
    avatarLink.appendChild(avatarImg);
    userSpan.appendChild(avatarLink);
  }

  const infoDiv = document.createElement("div");
  infoDiv.className = "tm-quote-info";

  const nameLink = document.createElement("a");
  nameLink.className = "tm-quote-name-link";
  nameLink.href = profileUrl;
  nameLink.target = "_blank";
  nameLink.rel = "noopener noreferrer";
  nameLink.textContent = name;

  const screenLink = document.createElement("a");
  screenLink.className = "tm-quote-screen-link";
  screenLink.href = profileUrl;
  screenLink.target = "_blank";
  screenLink.rel = "noopener noreferrer";
  screenLink.textContent = `@${user}`;

  infoDiv.appendChild(nameLink);
  infoDiv.appendChild(screenLink);
  userSpan.appendChild(infoDiv);

  const timeSpan = document.createElement("div");
  timeSpan.className = "tm-quote-time";
  timeSpan.textContent = createdAt ? formatTime(createdAt) : "";

  meta.appendChild(userSpan);
  meta.appendChild(timeSpan);

  const textDiv = document.createElement("div");
  textDiv.className = "tm-quote-text";
  textDiv.innerHTML = processTweetText(text);

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "tm-quote-media";
  media.forEach((m, index) => {
    if (m.type === "photo") {
      const img = document.createElement("img");
      img.src = m.url;
      img.loading = "eager";
      mediaWrap.appendChild(img);
    } else if (m.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.src = m.url;
      mediaWrap.appendChild(v);
    }
  });

  quoteCard.appendChild(meta);
  if (text) quoteCard.appendChild(textDiv);
  if (media.length) quoteCard.appendChild(mediaWrap);

  return quoteCard;
};

export const createCard = (tweet, openDetail) => {
  const legacy = tweet.legacy || tweet;
  const isRetweet = legacy.retweeted_status_result;
  const retweetData = isRetweet ? legacy.retweeted_status_result.result : null;
  const displayLegacy = retweetData?.legacy || legacy;
  const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
  const displayCore = retweetData?.core || tweet.core;
  const displayTweet = retweetData || tweet;
  const quotedData = retweetData?.quoted_status_result?.result || legacy.quoted_status_result?.result || tweet.quoted_status_result?.result;

  const text = getCleanText(displayTweet);
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
  if (!text) card.classList.add("no-text");
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
  textDiv.innerHTML = processTweetText(text);

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
  if (quotedData) {
    const quoteCard = createQuoteTweet(quotedData);
    card.appendChild(quoteCard);
  }
  card.appendChild(actions);

  card.addEventListener("click", (e) => {
    if (e.target.closest(".tm-like") || e.target.closest("a") || e.target.closest("video")) return;
    openDetail(displayTweet);
  });
  return card;
};
