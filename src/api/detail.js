import { API_ENDPOINTS, FEATURES, FIELD_TOGGLES } from "../config.js";
import { xhr, buildHeaders } from "../utils/xhr.js";
import { unwrapTweetResult } from "../utils/tweet.js";

/**
 * 构建 TweetDetail GraphQL 请求 URL
 * @param {string} focalTweetId - 目标推文 ID
 * @returns {string} 完整的请求 URL
 */
export const buildDetailUrl = (focalTweetId) => {
  const variables = {
    focalTweetId,
    with_rux_injections: false,
    includePromotedContent: true,
    withCommunity: true,
    withQuickPromoteEligibilityTweetFields: true,
    withBirdwatchNotes: true,
    withVoice: true,
    withV2Timeline: true,
  };
  const qs = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(FEATURES),
    fieldToggles: JSON.stringify(FIELD_TOGGLES),
  });
  return `${API_ENDPOINTS.TWEET_DETAIL}?${qs.toString()}`;
};

/**
 * 从 TweetDetail 响应中提取回复列表
 * 解析 conversationthread-* 条目，过滤掉推广推文
 * @param {object} data - TweetDetail GraphQL 响应
 * @param {string} focalTweetId - 焦点推文 ID，用于过滤
 * @returns {Array<object>} 回复推文数组（已 unwrapTweetResult）
 */
export const extractReplies = (data, focalTweetId) => {
  const instructions =
    data?.data?.threaded_conversation_with_injections_v2?.instructions || [];
  let entries = [];
  for (const ins of instructions) {
    if (ins.type === "TimelineAddEntries" && Array.isArray(ins.entries)) {
      entries = entries.concat(ins.entries);
    }
    if (ins.type === "TimelineReplaceEntry" && ins.entry) {
      entries.push(ins.entry);
    }
  }

  const replies = [];
  for (const entry of entries) {
    const content = entry?.content;
    if (!content) continue;

    // 回复线程：conversationthread-* → content.items[]
    if (
      content.entryType === "TimelineTimelineModule" &&
      typeof entry.entryId === "string" &&
      entry.entryId.startsWith("conversationthread-")
    ) {
      const items = content.items || [];
      for (const item of items) {
        const result = item?.item?.itemContent?.tweet_results?.result;
        if (!result) continue;
        // 过滤推广推文
        if (result.promotedMetadata) continue;
        const tweet = unwrapTweetResult(result);
        if (!tweet) continue;
        // 只收集同一会话内的回复
        const convId = tweet.legacy?.conversation_id_str;
        if (convId && convId !== focalTweetId) continue;
        replies.push(tweet);
      }
    }
  }
  return replies;
};

/**
 * 获取推文详情（含回复）
 * @param {string} focalTweetId - 目标推文 ID
 * @returns {Promise<object>} TweetDetail 响应 JSON
 */
export const fetchTweetDetail = async (focalTweetId) => {
  const url = buildDetailUrl(focalTweetId);
  const headers = buildHeaders();
  return xhr(url, { headers });
};
