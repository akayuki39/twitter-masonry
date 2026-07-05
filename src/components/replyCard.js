import { createLikeButton } from "./likeButton.js";
import { createCarousel } from "./carousel.js";
import { formatTime, escapeHTML } from "../utils/format.js";
import { pickMedia, isNoteTweet, getFullTweetText, getEntities } from "../utils/tweet.js";
import { processText } from "../utils/entity.js";
import { openImagePreview } from "./imagePreview.js";

/**
 * 创建单条回复卡片（用于 detail 右侧回复列表）
 * @param {object} tweet - 回复推文对象（已 unwrapTweetResult）
 * @param {number} [depth=0] - 嵌套深度，影响缩进和头像大小
 * @returns {HTMLElement} 回复卡片 DOM 元素
 */
export const createReplyCard = (tweet, depth = 0) => {
  const legacy = tweet.legacy || tweet;
  const user = tweet.core?.user_results?.result?.core;
  const avatar = tweet.core?.user_results?.result?.avatar?.image_url;
  const name = user?.name || legacy.user_id_str || "unknown";
  const screenName = user?.screen_name || legacy.user_id_str || "unknown";
  const profileUrl = `https://x.com/${encodeURIComponent(screenName)}`;
  const id = tweet.rest_id || legacy.id_str;
  const text = getFullTweetText(tweet);
  const media = pickMedia(tweet);

  const card = document.createElement("div");
  card.className = "tm-reply-card";
  if (depth > 0) card.classList.add("tm-reply-nested");
  card.style.setProperty("--tm-reply-depth", depth);

  // 头部：头像 + 用户名 + 时间
  const header = document.createElement("div");
  header.className = "tm-reply-header";

  const avatarLink = document.createElement("a");
  avatarLink.href = profileUrl;
  avatarLink.target = "_blank";
  avatarLink.rel = "noopener noreferrer";
  const avatarImg = document.createElement("img");
  avatarImg.className = "tm-reply-avatar";
  if (depth > 0) avatarImg.classList.add("small");
  avatarImg.src = avatar || "";
  avatarImg.loading = "lazy";
  avatarLink.appendChild(avatarImg);

  const userInfo = document.createElement("div");
  userInfo.className = "tm-reply-user";
  const nameLink = document.createElement("a");
  nameLink.className = "tm-reply-name";
  nameLink.href = profileUrl;
  nameLink.target = "_blank";
  nameLink.rel = "noopener noreferrer";
  nameLink.textContent = name;
  const screenLink = document.createElement("a");
  screenLink.className = "tm-reply-screen";
  screenLink.href = profileUrl;
  screenLink.target = "_blank";
  screenLink.rel = "noopener noreferrer";
  screenLink.textContent = `@${screenName}`;
  userInfo.appendChild(nameLink);
  userInfo.appendChild(screenLink);

  const timeSpan = document.createElement("span");
  timeSpan.className = "tm-reply-time";
  timeSpan.textContent = legacy.created_at ? formatTime(legacy.created_at) : "";

  header.appendChild(avatarLink);
  header.appendChild(userInfo);
  header.appendChild(timeSpan);
  card.appendChild(header);

  // 文本内容
  if (text) {
    const textDiv = document.createElement("div");
    textDiv.className = "tm-reply-text";
    const entities = getEntities(tweet);
    const displayRange = isNoteTweet(tweet) ? null : legacy.display_text_range;
    textDiv.appendChild(processText(text, entities, displayRange));
    card.appendChild(textDiv);
  }

  // 媒体
  if (media.length) {
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "tm-reply-media";
    if (media.length > 1) {
      const { el } = createCarousel(media, 0);
      mediaWrap.appendChild(el);
    } else {
      const photoUrls = [];
      for (const m of media) {
        if (m.type === "photo") {
          photoUrls.push(m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`);
        }
      }
      for (const m of media) {
        if (m.type === "photo") {
          const img = document.createElement("img");
          const url = m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`;
          img.src = url;
          img.loading = "lazy";
          img.style.cursor = "pointer";
          img.addEventListener("click", (e) => {
            e.stopPropagation();
            openImagePreview(photoUrls, 0);
          });
          mediaWrap.appendChild(img);
        } else if (m.type === "video") {
          const v = document.createElement("video");
          v.controls = true;
          v.src = m.url;
          mediaWrap.appendChild(v);
        }
      }
    }
    card.appendChild(mediaWrap);
  }

  // 操作栏
  const actions = document.createElement("div");
  actions.className = "tm-reply-actions";
  const likeBtn = createLikeButton(legacy, id);
  actions.appendChild(likeBtn);

  const rtChip = document.createElement("span");
  rtChip.className = "tm-reply-count";
  rtChip.textContent = `${legacy.retweet_count || 0} 转推`;
  actions.appendChild(rtChip);

  card.appendChild(actions);
  return card;
};
