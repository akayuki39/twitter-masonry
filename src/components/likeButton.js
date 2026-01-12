import { favoriteTweet, unfavoriteTweet } from "../api/interaction.js";

let toastFn;

export const setToast = (fn) => {
  toastFn = fn;
};

export const updateLikeDisplays = (tweetId, favorited, count) => {
  const btns = document.querySelectorAll(`.tm-like[data-tid="${tweetId}"]`);
  btns.forEach((btn) => {
    btn.classList.toggle("is-liked", favorited);
    btn.setAttribute("aria-pressed", favorited ? "true" : "false");
    const span = btn.querySelector("span");
    if (span) span.textContent = String(count);
  });
};

export const createLikeButton = (legacy, tweetId) => {
  const btn = document.createElement("button");
  btn.className = "tm-like";
  btn.dataset.tid = tweetId;
  btn.type = "button";
  btn.innerHTML = `❤ <span>${legacy.favorite_count || 0}</span>`;
  let favorited = !!legacy.favorited;
  const likeCountSpan = btn.querySelector("span");
  const setLikedStyle = () => {
    btn.classList.toggle("is-liked", favorited);
    btn.setAttribute("aria-pressed", favorited ? "true" : "false");
  };
  setLikedStyle();
  btn.dataset.loading = "0";
  btn.disabled = false;

  btn.onclick = async () => {
    if (btn.dataset.loading === "1") return;
    favorited = !!legacy.favorited;
    btn.dataset.loading = "1";
    btn.disabled = true;
    try {
      if (!favorited) {
        await favoriteTweet(tweetId);
        favorited = true;
        legacy.favorite_count = (legacy.favorite_count || 0) + 1;
        if (toastFn) toastFn("已点赞");
      } else {
        await unfavoriteTweet(tweetId);
        favorited = false;
        legacy.favorite_count = Math.max(0, (legacy.favorite_count || 1) - 1);
        if (toastFn) toastFn("已取消点赞");
      }
      legacy.favorited = favorited;
      likeCountSpan.textContent = String(legacy.favorite_count);
      setLikedStyle();
      updateLikeDisplays(tweetId, favorited, legacy.favorite_count);
    } catch (err) {
      if (toastFn) toastFn(`${favorited ? "取消点赞失败" : "点赞失败"}: ${err.message || err}`);
    } finally {
      btn.dataset.loading = "0";
      btn.disabled = false;
    }
  };

  return btn;
};
