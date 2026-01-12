import { PARAM_FLAG } from "./config.js";
import { injectStyles } from "./style.js";
import { buildUrl, extractEntries } from "./api/timeline.js";
import { xhr, buildHeaders } from "./utils/xhr.js";
import { createCard } from "./components/card.js";
import { openDetail } from "./components/detail.js";
import { createToast } from "./components/toast.js";
import { setToast } from "./components/likeButton.js";
import { ensureLayout, placeCard, resetLayout, pickAnchor } from "./masonry.js";

const state = {
  cursor: null,
  loading: false,
  ended: false,
  seen: new Set(),
  detailOpen: false,
};

let detailOpen = false;

const setDetailOpen = (open) => {
  detailOpen = open;
};

const renderTweets = async (tweets, grid) => {
  for (const t of tweets) {
    const id = t.rest_id || t.legacy?.id_str;
    if (!id || state.seen.has(id)) continue;
    state.seen.add(id);
    const card = createCard(t, openDetail);
    await placeCard(card, grid);
  }
};

const loadMore = async (grid, reset = false) => {
  if (state.loading || state.ended || detailOpen) return;
  const anchor = reset ? null : pickAnchor();
  const startScroll = window.scrollY;
  state.loading = true;
  const loader = document.querySelector(".tm-loader");
  if (loader) loader.textContent = "加载中...";
  try {
    const url = buildUrl(reset ? null : state.cursor);
    const data = await xhr(url, { headers: buildHeaders() });
    const { tweets, cursor } = extractEntries(data);
    if (tweets.length) await renderTweets(tweets, grid);
    state.cursor = cursor || state.cursor;
    if (!cursor) {
      state.ended = true;
      if (loader) loader.textContent = "没有更多了";
    } else if (loader) {
      loader.textContent = "下滑加载更多";
    }
  } catch (err) {
    toast(`加载失败: ${err.message || err}`);
  } finally {
    state.loading = false;
    const scrollDelta = Math.abs(window.scrollY - startScroll);
    const movedFar = scrollDelta > 200;
    if (!movedFar && anchor && anchor.el.isConnected) {
      const nowTop = anchor.el.getBoundingClientRect().top;
      const diff = nowTop - anchor.top;
      if (diff !== 0) window.scrollBy({ top: diff, behavior: "auto" });
    }
  }
};

const mountApp = () => {
  if (!document.body) {
    document.body = document.createElement("body");
    document.documentElement.appendChild(document.body);
  }
  document.body.innerHTML = "";

  const app = document.createElement("div");
  app.className = "tm-app";
  const header = document.createElement("div");
  header.className = "tm-header";
  header.innerHTML = `<div class="tm-title">Home 瀑布流</div>`;
  const reloadBtn = document.createElement("button");
  reloadBtn.className = "tm-btn";
  reloadBtn.textContent = "刷新";
  reloadBtn.onclick = () => {
    state.cursor = null;
    state.ended = false;
    state.seen.clear();
    resetLayout();
    grid.innerHTML = "";
    loadMore(grid, true);
  };
  header.appendChild(reloadBtn);

  const grid = document.createElement("div");
  grid.className = "tm-grid";
  const loader = document.createElement("div");
  loader.className = "tm-loader";
  loader.textContent = "加载中...";

  app.appendChild(header);
  app.appendChild(grid);
  app.appendChild(loader);
  document.body.appendChild(app);

  const sentinel = document.createElement("div");
  sentinel.style.height = "1px";
  grid.after(sentinel);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !detailOpen) loadMore(grid);
      });
    },
    { rootMargin: "1600px 0px 0px 0px", threshold: 0 }
  );
  io.observe(sentinel);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (detailOpen) {
        ticking = false;
        return;
      }
      const rest = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (rest < 1200) loadMore(grid);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  loadMore(grid, true).catch((err) => toast(err.message || String(err)));
};

const addFloatingButton = () => {
  const btn = document.createElement("div");
  btn.className = "tm-pill";
  btn.textContent = "Home 瀑布流";
  btn.onclick = () => GM_openInTab(`https://x.com/home?${PARAM_FLAG}=1`, { active: true });
  document.body.appendChild(btn);
};

const ensureMenu = () => {
  GM_registerMenuCommand("打开 Home 瀑布流", () => {
    GM_openInTab(`https://x.com/home?${PARAM_FLAG}=1`, { active: true });
  });
};

const shouldMount = () => {
  const url = new URL(location.href);
  return url.searchParams.has(PARAM_FLAG) || url.hash.includes(PARAM_FLAG);
};

const toast = createToast();
setToast(toast);

const bootstrap = () => {
  console.info("[tm-masonry] script loaded");
  ensureMenu();
  injectStyles();
  if (shouldMount()) {
    mountApp();
  } else {
    addFloatingButton();
  }
};

bootstrap();
