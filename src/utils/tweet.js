export const getCleanText = (tweet) => {
  const legacy = tweet.legacy || tweet;
  const fullText = legacy.full_text || legacy.text || "";
  const displayRange = legacy.display_text_range;

  if (displayRange && Array.isArray(displayRange) && displayRange.length === 2) {
    return fullText.substring(displayRange[0], displayRange[1]);
  }
  return fullText;
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
