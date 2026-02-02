import { API_ENDPOINTS, FEATURES, FIELD_TOGGLES } from "../config.js";
import { xhr, buildHeaders } from "../utils/xhr.js";

export const buildUrl = (cursor, seenTweetIds = []) => {
  const variables = {
    count: 100,
    includePromotedContent: false,
    latestControlAvailable: true,
    withCommunity: true,
    seenTweetIds: seenTweetIds,
    withVoice: true,
    withV2Timeline: true,
  };
  if (cursor) variables.cursor = cursor;
  const qs = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(FEATURES),
    fieldToggles: JSON.stringify(FIELD_TOGGLES),
  });
  return `${API_ENDPOINTS.HOME_TIMELINE}?${qs.toString()}`;
};

export const extractEntries = (data) => {
  const instructions =
    data?.data?.home?.home_timeline_urt?.instructions ||
    data?.data?.home?.home_timeline_urt?.timelines?.instructions ||
    [];
  let entries = [];
  for (const ins of instructions) {
    if (ins.type === "TimelineAddEntries" && Array.isArray(ins.entries)) {
      entries = entries.concat(ins.entries);
    }
    if (ins.type === "TimelineReplaceEntry" && ins.entry) {
      entries.push(ins.entry);
    }
  }
  let cursor = null;
  for (const e of entries) {
    const entryType = e?.content?.entryType;
    if (entryType === "TimelineTimelineCursor" && e?.content?.cursorType === "Bottom") {
      cursor = e.content.value;
    }
  }
  const tweets = entries
    .map((e) => {
      const content = e?.content;
      if (content?.entryType !== "TimelineTimelineItem") return null;
      const item = content.itemContent;
      const res = item?.tweet_results?.result;
      if (!res) return null;
      const typename = res.__typename;
      if (typename === "TweetWithVisibilityResults") return res.tweet;
      if (typename === "Tweet") return res;
      return null;
    })
    .filter(Boolean);
  return { tweets, cursor };
};
