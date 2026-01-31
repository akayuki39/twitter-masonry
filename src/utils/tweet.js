// 判断是否为长推文
export const isNoteTweet = (tweet) => {
  return !!(tweet?.note_tweet?.note_tweet_results?.result?.text);
};


// 获取卡片显示的文本（普通推文截取，长推文完整）
export const getDisplayTweetText = (tweet) => {
  const legacy = tweet.legacy || tweet;
  const fullText = legacy.full_text || legacy.text || "";
  const displayRange = legacy.display_text_range;
  if (displayRange && Array.isArray(displayRange) && displayRange.length === 2) {
    const chars = Array.from(fullText);
    return chars.slice(displayRange[0], displayRange[1]).join("");
  }
  return fullText;
};


// 获取详情页完整文本
export const getFullTweetText = (tweet) => {
  if (isNoteTweet(tweet)) {
    return tweet.note_tweet.note_tweet_results.result.text;
  }
  const legacy = tweet.legacy || tweet;
  return legacy.full_text || legacy.text || "";
};


// 获取推文entities（hashtag、mention、URL等）
export const getEntities = (tweet) => {
  if (isNoteTweet(tweet)) {
    return tweet.note_tweet?.note_tweet_results?.result?.entity_set || {};
  }
  const legacy = tweet.legacy || tweet;
  return legacy.entities || {};
};

export const pickMedia = (tweet) => {
  const legacy = tweet.legacy || tweet;
  const media = legacy?.extended_entities?.media || [];
  if (!media.length) return [];
  const pics = [];
  for (const m of media) {
    if (m.type === "photo" && m.media_url_https) {
      pics.push({ type: "photo", url: `${m.media_url_https}?name=orig` });
    } else if (m.type === "video" || m.type === "animated_gif") {
      const variants = (m.video_info?.variants || []).filter((v) => v.bitrate || v.content_type?.startsWith("video"));
      if (variants.length) {
        variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        pics.push({ type: "video", url: variants[0].url });
      }
    }
  }
  return pics;
};

export const unwrapTweetResult = (result) => {
  if (!result) return null;
  if (result.__typename === "TweetWithVisibilityResults") return result.tweet || result;
  return result;
};

// 获取高清头像URL（将_normal替换为_200x200）
export const getHighResAvatar = (avatarUrl) => {
  if (!avatarUrl) return "";
  return avatarUrl.replace(/_normal\.(jpg|jpeg|png)$/i, "_200x200.$1");
};