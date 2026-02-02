/**
 * @fileoverview 时间线状态管理模块
 * 管理时间线加载状态、分页游标和已渲染推文的去重
 */

/** @type {string|null} 分页游标 */
let cursor = null;

/** @type {boolean} 是否正在加载中 */
let loading = false;

/** @type {boolean} 是否已加载完所有推文 */
let ended = false;

/** @type {Set<string>} 已渲染的推文ID集合（用于去重） */
const seen = new Set();

/**
 * 获取当前游标
 * @returns {string|null}
 */
export const getCursor = () => cursor;

/**
 * 设置游标
 * @param {string|null} value
 */
export const setCursor = (value) => {
  cursor = value;
};

/**
 * 获取加载状态
 * @returns {boolean}
 */
export const isLoading = () => loading;

/**
 * 设置加载状态
 * @param {boolean} value
 */
export const setLoading = (value) => {
  loading = value;
};

/**
 * 获取结束状态
 * @returns {boolean}
 */
export const isEnded = () => ended;

/**
 * 设置结束状态
 * @param {boolean} value
 */
export const setEnded = (value) => {
  ended = value;
};

/**
 * 检查推文是否已渲染过
 * @param {string} tweetId
 * @returns {boolean}
 */
export const hasSeen = (tweetId) => seen.has(tweetId);

/**
 * 标记推文为已渲染
 * @param {string} tweetId
 */
export const addSeen = (tweetId) => {
  seen.add(tweetId);
};

/**
 * 重置所有状态（用于刷新页面）
 */
export const resetState = () => {
  cursor = null;
  loading = false;
  ended = false;
  seen.clear();
};
