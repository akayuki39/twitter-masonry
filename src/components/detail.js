import { createLikeButton, setToast } from "./likeButton.js";
import { createCarousel } from "./carousel.js";
import { createReplyCard } from "./replyCard.js";
import { fetchTweetDetail, extractReplies } from "../api/detail.js";
import { formatTime, escapeHTML } from "../utils/format.js";
import { pickMedia, isNoteTweet, unwrapTweetResult, getFullTweetText, getEntities } from "../utils/tweet.js";
import { processText } from "../utils/entity.js";
import { openImagePreview } from "./imagePreview.js";
import { setDetailOpen } from "../utils/state.js";
import { pauseVideosInContainer, pauseTimelineVideos } from "../utils/videoObserver.js";

let activeCarouselControls = null;

const createDetailQuoteTweet = (quotedTweet) => {
  const quoteLegacy = quotedTweet.legacy || quotedTweet;
  const quoteCore = quotedTweet.core;
  const quoteUser = quoteCore?.user_results?.result?.core;
  const text = getFullTweetText(quotedTweet);
  const media = pickMedia(quotedTweet);
  const user = quoteUser?.screen_name || quoteLegacy.user_id_str || "unknown";
  const avatar = quoteCore?.user_results?.result?.avatar?.image_url;
  const name = quoteUser?.name || user;
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
  const entities = getEntities(quotedTweet);
  const displayRange = isNoteTweet(quotedTweet) ? null : quoteLegacy.display_text_range;
  const processedText = processText(text, entities, displayRange);
  textDiv.appendChild(processedText);

  quoteCard.appendChild(meta);
  if (text) quoteCard.appendChild(textDiv);

  if (media.length) {
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "tm-quote-media";
    if (media.length > 1) {
      const { el, controls } = createCarousel(media, 0);
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
    quoteCard.appendChild(mediaWrap);
  }

  return quoteCard;
};
let detailOverlay = null;
let detailModal = null;
let scrollBackup = 0;
let scrollbarWidth = 0;

export const setActiveCarouselControls = (controls) => {
  activeCarouselControls = controls;
};

export { openImagePreview } from "./imagePreview.js";

export const ensureDetailLayer = () => {
  if (detailOverlay && detailModal) return { overlay: detailOverlay, modal: detailModal };
  const overlay = document.createElement("div");
  overlay.className = "tm-detail-backdrop";
  const modal = document.createElement("div");
  modal.className = "tm-detail-modal";
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target === modal) closeDetail();
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
  // 暂停detail中的视频
  pauseVideosInContainer(detailModal);
  detailOverlay.classList.remove("show");
  document.body.classList.remove("tm-detail-open");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.documentElement.style.removeProperty("--tm-scrollbar-width");
  document.body.style.paddingRight = "";
  window.scrollTo({ top: scrollBackup, behavior: "auto" });
  activeCarouselControls = null;
  setDetailOpen(false);
};

/**
 * 创建 detail 卡片左侧：仅媒体区域（图片/视频）
 * @param {Array<{type:string,url:string}>} media - 媒体数组
 * @param {number} initialImageIndex - 初始图片索引
 * @returns {HTMLElement} 左侧媒体容器
 */
const createDetailLeft = (media, initialImageIndex = 0) => {
  const left = document.createElement("div");
  left.className = "tm-detail-left";
  if (media.length === 0) {
    // 无媒体时左列会被 CSS 隐藏，这里直接返回空容器
    return left;
  }
  if (media.length > 1) {
    const { el, controls } = createCarousel(media, initialImageIndex);
    left.appendChild(el);
    activeCarouselControls = controls;
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
        left.appendChild(img);
      } else if (m.type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.src = m.url;
        left.appendChild(v);
      }
    }
  }
  return left;
};

/**
 * 创建 detail 卡片右侧上半部分：原推文内容（meta + text + quote + actions）
 * @param {object} tweet - 原推文对象
 * @returns {HTMLElement} 右侧内容容器
 */
const createDetailRight = (tweet) => {
  const legacy = tweet.legacy || tweet;
  const isRetweet = legacy.retweeted_status_result;
  const retweetData = isRetweet ? unwrapTweetResult(legacy.retweeted_status_result.result) : null;
  const displayLegacy = retweetData?.legacy || legacy;
  const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
  const displayCore = retweetData?.core || tweet.core;
  const displayTweet = retweetData || tweet;
  const quotedDataRaw = retweetData?.quoted_status_result?.result || legacy.quoted_status_result?.result || tweet.quoted_status_result?.result;
  const quotedData = unwrapTweetResult(quotedDataRaw);

  const text = getFullTweetText(displayTweet);
  const user = displayUser?.screen_name || displayLegacy.user_id_str || "unknown";
  const avatar = displayCore?.user_results?.result?.avatar?.image_url;
  const name = displayUser?.name || user;
  const id = displayTweet.rest_id || displayLegacy.id_str;
  const profileUrl = `https://x.com/${encodeURIComponent(user)}`;

  const retweetUser = tweet.core?.user_results?.result?.core;
  const retweetName = retweetUser?.name || "";
  const retweetScreenName = retweetUser?.screen_name || "";
  const retweetProfileUrl = retweetScreenName ? `https://x.com/${encodeURIComponent(retweetScreenName)}` : "";

  const right = document.createElement("div");
  right.className = "tm-detail-right-top";

  if (isRetweet && retweetName) {
    const retweetInfo = document.createElement("div");
    retweetInfo.className = "retweet-info";
    retweetInfo.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${retweetProfileUrl ? `<a href="${retweetProfileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(retweetName)} 已转帖</a>` : `<span>${escapeHTML(retweetName)} 已转帖</span>`}
    `;
    right.appendChild(retweetInfo);
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
  right.appendChild(meta);

  if (text) {
    const textDiv = document.createElement("div");
    textDiv.className = "text";
    const entities = getEntities(displayTweet);
    const displayRange = isNoteTweet(displayTweet) ? null : displayLegacy.display_text_range;
    textDiv.appendChild(processText(text, entities, displayRange));
    right.appendChild(textDiv);
  }

  if (quotedData) {
    right.appendChild(createDetailQuoteTweet(quotedData));
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  const leftActions = document.createElement("div");
  leftActions.className = "tm-actions-left";
  const likeBtn = createLikeButton(displayLegacy, id);
  const rtChip = document.createElement("div");
  rtChip.className = "tm-count-chip";
  rtChip.textContent = `${displayLegacy.retweet_count || 0} 转推`;
  leftActions.appendChild(likeBtn);
  leftActions.appendChild(rtChip);

  const openLink = document.createElement("a");
  openLink.href = `https://x.com/${user}/status/${id}`;
  openLink.target = "_blank";
  openLink.textContent = "在 X 打开";
  actions.appendChild(leftActions);
  actions.appendChild(openLink);
  right.appendChild(actions);

  return right;
};

/**
 * 创建整体 detail 卡片（左图右内容 + 回复区）
 * 返回 { card, repliesList } 供 openDetail 异步填充回复
 * @param {object} tweet - 推文对象
 * @param {number} initialImageIndex - 初始图片索引
 * @returns {{card: HTMLElement, repliesList: HTMLElement, focalTweetId: string|null}}
 */
export const createDetailCard = (tweet, initialImageIndex = 0) => {
  activeCarouselControls = null;
  const legacy = tweet.legacy || tweet;
  const isRetweet = legacy.retweeted_status_result;
  const retweetData = isRetweet ? unwrapTweetResult(legacy.retweeted_status_result.result) : null;
  const displayTweet = retweetData || tweet;
  const displayLegacy = retweetData?.legacy || legacy;
  const media = pickMedia(displayTweet);
  const id = displayTweet.rest_id || displayLegacy.id_str;

  const wrapper = document.createElement("div");
  wrapper.className = "tm-detail-card";
  if (media.length === 0) wrapper.classList.add("no-media");

  const closeBtn = document.createElement("button");
  closeBtn.className = "tm-detail-close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.onclick = closeDetail;
  wrapper.appendChild(closeBtn);

  // 内部双列布局
  const layout = document.createElement("div");
  layout.className = "tm-detail-layout";

  // 左列：仅媒体
  const leftCol = createDetailLeft(media, initialImageIndex);
  layout.appendChild(leftCol);

  // 右列：内容 + 回复
  const rightCol = document.createElement("div");
  rightCol.className = "tm-detail-right";

  // 右列上半：原推文内容
  const rightTop = createDetailRight(tweet);
  rightCol.appendChild(rightTop);

  // 右列下半：回复列表
  const repliesHeader = document.createElement("div");
  repliesHeader.className = "tm-replies-header";
  repliesHeader.textContent = "回复";
  rightCol.appendChild(repliesHeader);

  const repliesList = document.createElement("div");
  repliesList.className = "tm-replies-list";
  const loadingHint = document.createElement("div");
  loadingHint.className = "tm-replies-loading";
  loadingHint.textContent = "正在加载回复…";
  repliesList.appendChild(loadingHint);
  rightCol.appendChild(repliesList);

  layout.appendChild(rightCol);
  wrapper.appendChild(layout);
  wrapper.addEventListener("click", (e) => e.stopPropagation());

  return { card: wrapper, repliesList, focalTweetId: id };
};

/**
 * 构建回复树
 * 根据 in_reply_to_status_id_str 建立父子关系
 * @param {object[]} replies - 平铺的回复数组
 * @param {string} focalTweetId - 焦点推文 ID
 * @param {number} [maxDepth=3] - 最大嵌套深度
 * @returns {Array<{tweet: object, children: Array}>} 树形结构
 */
const buildReplyTree = (replies, focalTweetId, maxDepth = 3) => {
  const byId = new Map();
  for (const r of replies) {
    const id = r.rest_id || r.legacy?.id_str;
    if (id) byId.set(id, { tweet: r, children: [] });
  }
  const roots = [];
  for (const r of replies) {
    const id = r.rest_id || r.legacy?.id_str;
    const parentId = r.legacy?.in_reply_to_status_id_str;
    const node = byId.get(id);
    if (!node) continue;
    // 父是焦点推文 或 找不到父回复 → 顶层
    if (parentId === focalTweetId || !parentId || !byId.has(parentId)) {
      roots.push(node);
    } else {
      byId.get(parentId).children.push(node);
    }
  }
  // 限制深度：超过 maxDepth 的子节点提升为顶层
  const flattenDeep = (node, depth) => {
    if (depth >= maxDepth) {
      for (const child of node.children) {
        roots.push({ ...child, children: [] });
        flattenDeep(child, depth + 1);
      }
      node.children = [];
      return;
    }
    for (const child of node.children) flattenDeep(child, depth + 1);
  };
  for (const root of roots) flattenDeep(root, 1);
  return roots;
};

/**
 * 递归渲染回复树为 DOM
 * @param {Array<{tweet: object, children: Array}>} nodes - 树节点数组
 * @param {number} depth - 当前深度
 * @returns {DocumentFragment} DOM 片段
 */
const renderReplyTree = (nodes, depth = 0) => {
  const frag = document.createDocumentFragment();
  for (const node of nodes) {
    const card = createReplyCard(node.tweet, depth);
    frag.appendChild(card);
    if (node.children.length > 0) {
      const childWrap = document.createElement("div");
      childWrap.className = "tm-reply-children";
      childWrap.appendChild(renderReplyTree(node.children, depth + 1));
      frag.appendChild(childWrap);
    }
  }
  return frag;
};

export const openDetail = (tweet, initialImageIndex = 0) => {
  // 暂停timeline中所有正在播放的视频，避免与detail中的视频同时播放
  pauseTimelineVideos();
  setDetailOpen(true);
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

  const { card, repliesList, focalTweetId } = createDetailCard(tweet, initialImageIndex);
  modal.appendChild(card);
  overlay.classList.add("show");
  document.body.classList.add("tm-detail-open");

  // 异步加载回复
  if (focalTweetId) {
    fetchTweetDetail(focalTweetId)
      .then((data) => {
        const replies = extractReplies(data, focalTweetId);
        repliesList.innerHTML = "";
        if (replies.length === 0) {
          const empty = document.createElement("div");
          empty.className = "tm-replies-empty";
          empty.textContent = "暂无回复";
          repliesList.appendChild(empty);
          return;
        }
        const tree = buildReplyTree(replies, focalTweetId);
        repliesList.appendChild(renderReplyTree(tree));
      })
      .catch((err) => {
        repliesList.innerHTML = "";
        const errEl = document.createElement("div");
        errEl.className = "tm-replies-empty";
        errEl.textContent = `回复加载失败: ${err.message || err}`;
        repliesList.appendChild(errEl);
      });
  } else {
    repliesList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "tm-replies-empty";
    empty.textContent = "无法获取回复";
    repliesList.appendChild(empty);
  }
};
