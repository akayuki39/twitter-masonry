import { PARAM_FLAG } from "./config.js";
import { injectStyles } from "./style.js";
import { buildUrl, extractEntries } from "./api/timeline.js";
import { xhr, buildHeaders } from "./utils/xhr.js";
import { createCard } from "./components/card.js";
import { openDetail } from "./components/detail.js";
import { createToast } from "./components/toast.js";
import { setToast } from "./components/likeButton.js";
import { ensureLayout, placeCard, resetLayout, pickAnchor } from "./masonry.js";
import { isDetailOpen } from "./utils/state.js";

const state = {
  cursor: null,
  loading: false,
  ended: false,
  seen: new Set(),
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
  if (state.loading || state.ended || isDetailOpen()) return;
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
  const headerLeft = document.createElement("div");
  headerLeft.className = "tm-header-left";
  headerLeft.innerHTML = `<div class="tm-title">Twitter Masonry</div>`;
  const reloadBtn = document.createElement("button");
  reloadBtn.className = "tm-btn";
  reloadBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
  reloadBtn.onclick = () => {
    state.cursor = null;
    state.ended = false;
    state.seen.clear();
    resetLayout();
    grid.innerHTML = "";
    loadMore(grid, true);
  };
  headerLeft.appendChild(reloadBtn);
  const githubLink = document.createElement("a");
  githubLink.className = "tm-github-link";
  githubLink.href = "https://github.com/akayuki39/twitter-masonry";
  githubLink.target = "_blank";
  githubLink.rel = "noopener noreferrer";
  githubLink.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
  header.appendChild(headerLeft);
  header.appendChild(githubLink);

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
        if (e.isIntersecting && !isDetailOpen()) loadMore(grid);
      });
    },
    { rootMargin: "3000px 0px 0px 0px", threshold: 0 }
  );
  io.observe(sentinel);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (isDetailOpen()) {
        ticking = false;
        return;
      }
      const rest = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (rest < 2500) loadMore(grid);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  loadMore(grid, true).catch((err) => toast(err.message || String(err)));
};

const addFloatingButton = () => {
  const btn = document.createElement("div");
  btn.className = "tm-pill";
  btn.textContent = "Home Masonry";
  btn.onclick = () => GM_openInTab(`https://x.com/home?${PARAM_FLAG}=1`, { active: true });
  document.body.appendChild(btn);
};

const ensureMenu = () => {
  GM_registerMenuCommand("Open Home Masonry", () => {
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
