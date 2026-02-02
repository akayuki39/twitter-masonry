/**
 * @fileoverview 推文可见性追踪模块
 * 使用 IntersectionObserver 和 5秒停留时间检测，追踪用户实际看到的推文
 */

/** @type {Set<string>} 已查看的推文ID集合（停留超过5秒） */
const viewed = new Set();

/** @type {Map<string, number>} 存储每个卡片的停留计时器 */
const timers = new Map();

/** 停留时间阈值（毫秒）。超过则记录为已查看 */
const DWELL_TIME = 5000;

/** 可见度阈值（0-1） */
const VISIBILITY_THRESHOLD = 0.5;

/**
 * IntersectionObserver 回调处理
 * @param {IntersectionObserverEntry[]} entries
 */
const handleIntersection = (entries) => {
  entries.forEach((entry) => {
    const tweetId = entry.target.dataset.tweetId;
    if (!tweetId) return;

    // 如果已经记录为已查看，不再处理
    if (viewed.has(tweetId)) {
      observer.unobserve(entry.target);
      return;
    }

    if (entry.isIntersecting) {
      // 卡片进入视口，启动停留计时器
      if (!timers.has(tweetId)) {
        const timerId = setTimeout(() => {
          viewed.add(tweetId);
          timers.delete(tweetId);
          observer.unobserve(entry.target);
        }, DWELL_TIME);
        timers.set(tweetId, timerId);
      }
    } else {
      // 卡片离开视口，清除计时器（如果存在）
      if (timers.has(tweetId)) {
        clearTimeout(timers.get(tweetId));
        timers.delete(tweetId);
      }
    }
  });
};

/** @type {IntersectionObserver} */
const observer = new IntersectionObserver(handleIntersection, {
  threshold: VISIBILITY_THRESHOLD,
});

/**
 * 开始观察卡片
 * @param {HTMLElement} card - 推文卡片元素
 */
export const observeCard = (card) => {
  observer.observe(card);
};

/**
 * 获取已查看的推文ID数组（用于发送给API）
 * @returns {string[]}
 */
export const getViewedTweetIds = () => {
  return Array.from(viewed);
};

/**
 * 清空已查看的推文记录（发送给API后调用）
 */
export const clearViewed = () => {
  viewed.clear();
};

/**
 * 重置所有状态（用于刷新页面）
 * 清理所有计时器防止内存泄漏
 */
export const resetViewed = () => {
  // 清理所有未完成的计时器
  timers.forEach((timerId) => clearTimeout(timerId));
  timers.clear();
  viewed.clear();
};
