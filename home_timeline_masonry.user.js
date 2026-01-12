// ==UserScript==
// @name         X Home Masonry Timeline V2
// @namespace    https://github.com/akayuki/twitter-media-collector-simple
// @version      0.1.0
// @description  在浏览器直接把 X/Twitter 主页渲染成瀑布流（类似 Pinterest/小红书），无需自建后端。
// @author       you
// @match        https://x.com/*
// @match        https://*.x.com/*
// @match        https://twitter.com/*
// @match        https://*.twitter.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @connect      x.com
// ==/UserScript==


(function () {

  const API_ENDPOINTS = {
    HOME_TIMELINE: "https://x.com/i/api/graphql/cch4haXSDkHZ2Bp5sXb9NQ/HomeTimeline",
    FAVORITE_TWEET: "https://x.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet",
    UNFAVORITE_TWEET: "https://x.com/i/api/graphql/ZYKSe-w7KEslx3JhSIk5LA/UnfavoriteTweet",
  };

  const BEARER_TOKEN =
    "Bearer " +
    "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D" +
    "1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

  const FEATURES = {
    rweb_video_screen_enabled: false,
    profile_label_improvements_pcf_label_in_post_enabled: true,
    responsive_web_profile_redirect_enabled: false,
    rweb_tipjar_consumption_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: false,
    responsive_web_jetfuel_frame: true,
    responsive_web_grok_share_attachment_enabled: true,
    responsive_web_grok_annotations_enabled: false,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    responsive_web_grok_show_grok_translated_post: false,
    responsive_web_grok_analysis_button_from_backend: true,
    post_ctas_fetch_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_grok_image_annotation_enabled: true,
    responsive_web_grok_imagine_annotation_enabled: true,
    responsive_web_grok_community_note_auto_translation_is_enabled: false,
    responsive_web_enhance_cards_enabled: false,
  };

  const FIELD_TOGGLES = {
    withArticleRichContentState: false,
    withArticlePlainText: false,
    withGrokAnalyzeButton: false,
  };

  const PARAM_FLAG = "tm-masonry";

  const LAYOUT_CONFIG = {
    colWidth: 320,
    gutter: 18,
  };

  const injectStyles = () => {
    GM_addStyle(`
    :root { color-scheme: light; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f6f8; color: #1f2d3d; }
    body.tm-detail-open { overflow: hidden; padding-right: var(--tm-scrollbar-width, 0px); }
    a { color: #0f7ae5; }
    .tm-app { min-height: 100vh; background: #f5f6f8; }
    .tm-header { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(15,23,42,0.06); box-shadow: 0 8px 20px rgba(15,23,42,0.05); }
    body.tm-detail-open .tm-header { padding-right: calc(16px + var(--tm-scrollbar-width, 0px)); }
    .tm-title { font-weight: 700; font-size: 18px; letter-spacing: 0.1px; color: #0f172a; }
    .tm-btn { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border: none; border-radius: 999px; padding: 9px 16px; font-weight: 600; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; box-shadow: 0 8px 18px rgba(37,99,235,0.25); }
    .tm-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(37,99,235,0.3); }
    .tm-grid { position: relative; padding: 18px; max-width: 1480px; margin: 0 auto; }
    .tm-card { position: absolute; width: 320px; background: #fff; border: 1px solid rgba(15,23,42,0.06); border-radius: 18px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,23,42,0.08); transition: transform 0.15s ease, box-shadow 0.15s ease; will-change: transform; }
    .tm-card:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(15,23,42,0.12); }
    .tm-card .retweet-info { padding: 10px 16px 0; display: flex; align-items: center; gap: 6px; color: rgb(83, 100, 113); font-size: 13px; font-weight: 600; }
    .tm-card .retweet-info svg { flex-shrink: 0; }
    .tm-card .retweet-info a { color: inherit; text-decoration: none; transition: text-decoration 0.12s ease; }
    .tm-card .retweet-info a:hover { text-decoration: underline; }
    .tm-card .meta { padding: 14px 16px 0 16px; display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .tm-card .meta .user { font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; min-width: 0; }
    .tm-card .meta .user img { flex-shrink: 0; box-shadow: 0 4px 12px rgba(15,23,42,0.08); }
    .tm-card .meta .user .info { display: flex; flex-direction: column; gap: 2px; line-height: 1.25; min-width: 0; flex: 1; }
    .tm-card .meta .user .name { font-weight: 700; color: #0f172a; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-card .meta .user .screen { color: #64748b; font-size: 13px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-user-link { display: inline-flex; align-items: center; }
    .tm-user-link .tm-avatar { transition: filter 0.12s ease; }
    .tm-user-link:hover .tm-avatar { filter: brightness(0.9); }
    .tm-name-link { color: inherit; text-decoration: none; }
    .tm-name-link:hover { text-decoration: underline; }
    .tm-screen-link { color: inherit; text-decoration: none; }
    .tm-screen-link:hover { text-decoration: none; }
    .tm-card .meta .time { color: #94a3b8; font-size: 12px; }
    .tm-card .text { padding: 8px 16px 14px 16px; line-height: 1.6; color: #1f2937; word-break: break-word; }
    .tm-card .media { display: grid; gap: 10px; padding: 0 14px 14px 14px; }
    .tm-card img { width: 100%; border-radius: 14px; object-fit: cover; background: linear-gradient(180deg,#f8fafc,#e2e8f0); display: block; }
    .tm-card video { width: 100%; border-radius: 14px; background: #0b1220; display: block; }
    .tm-card .actions { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px 14px; color: #64748b; font-size: 13px; border-top: 1px solid rgba(15,23,42,0.06); }
    .tm-actions-left { display: flex; align-items: center; gap: 12px; }
    .tm-like { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(37,99,235,0.2); background: rgba(37,99,235,0.06); color: #1d4ed8; border-radius: 999px; padding: 7px 12px; cursor: pointer; font-weight: 600; transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease; }
    .tm-like.is-liked { background: linear-gradient(135deg,#fb7185,#f43f5e); color: #fff; border-color: rgba(244,63,94,0.4); }
    .tm-like.is-liked:hover { box-shadow: 0 8px 18px rgba(244,63,94,0.2); transform: translateY(-1px); }
    .tm-like:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(37,99,235,0.15); border-color: rgba(37,99,235,0.35); }
    .tm-like[data-loading="1"] { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
    .tm-count-chip { display: inline-flex; align-items: center; gap: 6px; background: rgba(15,23,42,0.04); color: #475569; border-radius: 999px; padding: 6px 10px; font-weight: 600; }
    .tm-pill { position: fixed; right: 16px; bottom: 16px; background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border-radius: 999px; padding: 12px 16px; font-weight: 700; cursor: pointer; box-shadow: 0 12px 26px rgba(37,99,235,0.35); z-index: 9999; border: none; }
    .tm-toast { position: fixed; top: 14px; right: 14px; background: #0f172a; color: #fff; padding: 11px 15px; border-radius: 12px; box-shadow: 0 16px 38px rgba(0,0,0,0.25); z-index: 9999; opacity: 0; transform: translateY(-8px); transition: all 0.25s ease; letter-spacing: 0.1px; }
    .tm-toast.show { opacity: 1; transform: translateY(0); }
    .tm-loader { padding: 20px; text-align: center; color: #94a3b8; font-weight: 600; }
    :root { --tm-detail-media-max-h: min(72vh, 880px); }
    .tm-detail-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.65); display: none; align-items: flex-start; justify-content: center; padding: 32px 18px; z-index: 99999; overflow-y: auto; }
    .tm-detail-backdrop.show { display: flex; }
    .tm-detail-modal { position: relative; width: min(960px, 96vw); margin: auto; }
    .tm-detail-card { background: #fff; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,0.25); border: 1px solid rgba(15,23,42,0.08); overflow: hidden; max-height: calc(100vh - 64px); }
    .tm-detail-card .retweet-info { padding: 12px 20px 0; display: flex; align-items: center; gap: 6px; color: rgb(83, 100, 113); font-size: 13px; font-weight: 600; }
    .tm-detail-card .retweet-info svg { flex-shrink: 0; }
    .tm-detail-card .retweet-info a { color: inherit; text-decoration: none; transition: text-decoration 0.12s ease; }
    .tm-detail-card .retweet-info a:hover { text-decoration: underline; }
    .tm-detail-card .meta { padding: 18px 20px 0; display: flex; justify-content: space-between; gap: 14px; align-items: center; }
    .tm-detail-card .meta .user { font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 12px; min-width: 0; }
    .tm-detail-card .meta .user img { flex-shrink: 0; box-shadow: 0 6px 16px rgba(15,23,42,0.12); width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .tm-detail-card .meta .user .info { display: flex; flex-direction: column; gap: 3px; line-height: 1.25; min-width: 0; flex: 1; }
    .tm-detail-card .meta .user .name { font-weight: 800; color: #0f172a; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-detail-card .meta .user .screen { color: #64748b; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-detail-card .meta .time { color: #94a3b8; font-size: 12px; }
    .tm-detail-card .text { padding: 10px 20px 18px; line-height: 1.7; color: #1f2937; word-break: break-word; font-size: 15px; }
    .tm-detail-card .media { display: grid; gap: 12px; padding: 0 18px 20px; max-height: var(--tm-detail-media-max-h); overflow-y: auto; }
    .tm-detail-card .media img { width: 100%; border-radius: 16px; object-fit: contain; background: linear-gradient(180deg,#f8fafc,#e2e8f0); max-height: var(--tm-detail-media-max-h); }
    .tm-detail-card .media video { width: 100%; border-radius: 16px; background: #0b1220; max-height: var(--tm-detail-media-max-h); object-fit: contain; }
    .tm-detail-card .actions { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px 18px; color: #64748b; font-size: 13px; border-top: 1px solid rgba(15,23,42,0.06); }
    .tm-detail-close { position: absolute; top: -12px; right: -12px; width: 40px; height: 40px; border-radius: 999px; border: none; background: #fff; box-shadow: 0 12px 30px rgba(0,0,0,0.18); cursor: pointer; display: grid; place-items: center; font-size: 18px; font-weight: 700; color: #0f172a; }
    .tm-detail-close:hover { transform: translateY(-1px); box-shadow: 0 16px 40px rgba(0,0,0,0.2); }
    .tm-carousel { position: relative; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg,#f8fafc,#e2e8f0); }
    .tm-carousel-track { display: flex; transition: transform 0.28s ease; width: 100%; }
    .tm-carousel-slide { flex: 0 0 100%; display: flex; justify-content: center; align-items: center; }
    .tm-carousel-slide img, .tm-carousel-slide video { width: 100%; max-height: var(--tm-detail-media-max-h); object-fit: contain; }
    .tm-carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border-radius: 50%; border: none; background: rgba(15,23,42,0.65); color: #fff; cursor: pointer; display: grid; place-items: center; font-size: 18px; font-weight: 700; box-shadow: 0 10px 26px rgba(0,0,0,0.22); opacity: 0; transition: opacity 0.15s ease; }
    .tm-carousel:hover .tm-carousel-arrow, .tm-carousel:focus-within .tm-carousel-arrow { opacity: 1; }
    .tm-carousel-arrow:disabled { opacity: 0; cursor: not-allowed; box-shadow: none; }
    .tm-carousel:hover .tm-carousel-arrow:disabled, .tm-carousel:focus-within .tm-carousel-arrow:disabled { opacity: 0.3; }
    .tm-carousel-arrow.prev { left: 12px; }
    .tm-carousel-arrow.next { right: 12px; }
  `);
  };

  const getCookie = (name) => {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  };

  const xhr = (url, { method = "GET", body, headers = {} } = {}) =>
    new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        url,
        method,
        data: body,
        headers,
        responseType: "json",
        timeout: 20000,
        withCredentials: true,
        onload: (resp) => {
          if (resp.status >= 200 && resp.status < 300) return resolve(resp.response);
          reject(new Error(`Request failed: ${resp.status} ${resp.statusText}`));
        },
        onerror: (err) => reject(err),
        ontimeout: () => reject(new Error("Request timeout")),
      });
    });

  const buildHeaders = () => {
    const csrf = getCookie("ct0");
    return {
      authorization: BEARER_TOKEN,
      "x-csrf-token": csrf,
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": getCookie("auth_token") ? "OAuth2Session" : "none",
      "x-twitter-client-language": "en",
      "user-agent": navigator.userAgent,
      referer: "https://x.com/",
      cookie: document.cookie,
    };
  };

  const buildUrl = (cursor) => {
    const variables = {
      count: 100,
      includePromotedContent: false,
      latestControlAvailable: true,
      withCommunity: true,
      seenTweetIds: [],
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

  const extractEntries = (data) => {
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

  const escapeHTML = (str = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const linkify = (text = "") =>
    escapeHTML(text).replace(/(https?:\/\/[\w./?=&%#-]+)/g, '<a href="$1" target="_blank">$1</a>');

  const formatTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (!isNaN(d)) return d.toLocaleString();
    const tryD = new Date(Date.parse(raw));
    return isNaN(tryD) ? raw : tryD.toLocaleString();
  };

  const pickMedia = (tweet) => {
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

  const favoriteTweet = async (tweetId) => {
    const body = JSON.stringify({
      variables: { tweet_id: String(tweetId) },
      queryId: "lI07N6Otwv1PhnEgXILM7A",
      features: {},
    });
    return xhr(API_ENDPOINTS.FAVORITE_TWEET, {
      method: "POST",
      body,
      headers: { ...buildHeaders(), "content-type": "application/json" },
    });
  };

  const unfavoriteTweet = async (tweetId) => {
    const body = JSON.stringify({
      variables: { tweet_id: String(tweetId) },
      queryId: "ZYKSe-w7KEslx3JhSIk5LA",
      features: {},
    });
    return xhr(API_ENDPOINTS.UNFAVORITE_TWEET, {
      method: "POST",
      body,
      headers: { ...buildHeaders(), "content-type": "application/json" },
    });
  };

  let toastFn;

  const setToast = (fn) => {
    toastFn = fn;
  };

  const updateLikeDisplays = (tweetId, favorited, count) => {
    const btns = document.querySelectorAll(`.tm-like[data-tid="${tweetId}"]`);
    btns.forEach((btn) => {
      btn.classList.toggle("is-liked", favorited);
      btn.setAttribute("aria-pressed", favorited ? "true" : "false");
      const span = btn.querySelector("span");
      if (span) span.textContent = String(count);
    });
  };

  const createLikeButton = (legacy, tweetId) => {
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

  const createCard = (tweet, openDetail) => {
    const legacy = tweet.legacy || tweet;
    const isRetweet = legacy.retweeted_status_result;
    const retweetData = isRetweet ? legacy.retweeted_status_result.result : null;
    const displayLegacy = retweetData?.legacy || legacy;
    const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
    const displayCore = retweetData?.core || tweet.core;
    const displayTweet = retweetData || tweet;
    
    const text = displayLegacy.full_text || displayLegacy.text || "";
    const media = pickMedia(displayTweet);
    const user = displayUser?.screen_name || displayLegacy.user_id_str || "unknown";
    const avatar = displayCore?.user_results?.result?.avatar?.image_url;
    const name = displayUser?.name || user;
    const id = displayTweet.rest_id || displayLegacy.id_str;
    const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
    
    const retweetUser = tweet.core?.user_results?.result?.core;
    const retweetName = retweetUser?.name || "";
    const retweetScreenName = retweetUser?.screen_name || "";
    const retweetProfileUrl = retweetScreenName ? `https://x.com/${encodeURIComponent(retweetScreenName)}` : "";
    
    const card = document.createElement("article");
    card.className = "tm-card";
    card.dataset.tid = id;

    if (isRetweet && retweetName) {
      const retweetInfo = document.createElement("div");
      retweetInfo.className = "retweet-info";
      retweetInfo.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${retweetProfileUrl ? `<a href="${retweetProfileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(retweetName)} 已转帖</a>` : `<span>${escapeHTML(retweetName)} 已转帖</span>`}
    `;
      card.appendChild(retweetInfo);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    const userSpan = document.createElement("div");
    userSpan.className = "user";
    userSpan.innerHTML = `
    ${avatar ? `<a class="tm-user-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer"><img class="tm-avatar" src="${avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"></a>` : ""}
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

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.innerHTML = linkify(text);

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "media";
    media.forEach((m, index) => {
      if (m.type === "photo") {
        const img = document.createElement("img");
        img.loading = "eager";
        img.src = m.url;
        img.addEventListener("click", (e) => {
          e.stopPropagation();
          openDetail(displayTweet, index);
        });
        mediaWrap.appendChild(img);
      } else if (m.type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.src = m.url;
        mediaWrap.appendChild(v);
      }
    });

    const actions = document.createElement("div");
    actions.className = "actions";
    const left = document.createElement("div");
    left.className = "tm-actions-left";

    const likeBtn = createLikeButton(displayLegacy, id);

    const rtChip = document.createElement("div");
    rtChip.className = "tm-count-chip";
    rtChip.textContent = `${displayLegacy.retweet_count || 0} 转推`;

    left.appendChild(likeBtn);
    left.appendChild(rtChip);

    const right = document.createElement("a");
    right.href = `https://x.com/${user}/status/${id}`;
    right.target = "_blank";
    right.textContent = "在 X 打开";
    actions.appendChild(left);
    actions.appendChild(right);

    card.appendChild(meta);
    if (text) card.appendChild(textDiv);
    if (media.length) card.appendChild(mediaWrap);
    card.appendChild(actions);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".tm-like") || e.target.closest("a") || e.target.closest("video")) return;
      openDetail(displayTweet);
    });
    return card;
  };

  const createCarousel = (media, initialIndex = 0) => {
    const carousel = document.createElement("div");
    carousel.className = "tm-carousel";
    carousel.tabIndex = 0;
    const track = document.createElement("div");
    track.className = "tm-carousel-track";
    carousel.appendChild(track);

    media.forEach((m) => {
      const slide = document.createElement("div");
      slide.className = "tm-carousel-slide";
      if (m.type === "photo") {
        const img = document.createElement("img");
        const url = m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`;
        img.src = url;
        img.loading = "lazy";
        slide.appendChild(img);
      } else if (m.type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.src = m.url;
        slide.appendChild(v);
      }
      track.appendChild(slide);
    });

    let idx = initialIndex;
    const total = media.length;
    const clamp = (i) => Math.min(total - 1, Math.max(0, i));
    const update = () => {
      track.style.transform = `translateX(-${idx * 100}%)`;
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === total - 1;
    };

    const prev = () => {
      idx = clamp(idx - 1);
      update();
    };
    const next = () => {
      idx = clamp(idx + 1);
      update();
    };

    const prevBtn = document.createElement("button");
    prevBtn.className = "tm-carousel-arrow prev";
    prevBtn.type = "button";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      prev();
    };

    const nextBtn = document.createElement("button");
    nextBtn.className = "tm-carousel-arrow next";
    nextBtn.type = "button";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      next();
    };

    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        next();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        prev();
        e.preventDefault();
      }
    });

    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    update();

    return { el: carousel, controls: { prev, next } };
  };

  let activeCarouselControls = null;
  let detailOverlay = null;
  let detailModal = null;
  let scrollBackup = 0;
  let scrollbarWidth = 0;

  const ensureDetailLayer = () => {
    if (detailOverlay && detailModal) return { overlay: detailOverlay, modal: detailModal };
    const overlay = document.createElement("div");
    overlay.className = "tm-detail-backdrop";
    const modal = document.createElement("div");
    modal.className = "tm-detail-modal";
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDetail();
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

  const closeDetail = () => {
    if (!detailOverlay) return;
    detailOverlay.classList.remove("show");
    document.body.classList.remove("tm-detail-open");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.documentElement.style.removeProperty("--tm-scrollbar-width");
    document.body.style.paddingRight = "";
    window.scrollTo({ top: scrollBackup, behavior: "auto" });
    activeCarouselControls = null;
  };

  const createDetailCard = (tweet, initialImageIndex = 0) => {
    activeCarouselControls = null;
    const legacy = tweet.legacy || tweet;
    const isRetweet = legacy.retweeted_status_result;
    const retweetData = isRetweet ? legacy.retweeted_status_result.result : null;
    const displayLegacy = retweetData?.legacy || legacy;
    const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
    const displayCore = retweetData?.core || tweet.core;
    const displayTweet = retweetData || tweet;
    
    const text = displayLegacy.full_text || displayLegacy.text || "";
    const media = pickMedia(displayTweet);
    const user = displayUser?.screen_name || displayLegacy.user_id_str || "unknown";
    const avatar = displayCore?.user_results?.result?.avatar?.image_url;
    const name = displayUser?.name || user;
    const id = displayTweet.rest_id || displayLegacy.id_str;
    const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
    
    const retweetUser = tweet.core?.user_results?.result?.core;
    const retweetName = retweetUser?.name || "";
    const retweetScreenName = retweetUser?.screen_name || "";
    const retweetProfileUrl = retweetScreenName ? `https://x.com/${encodeURIComponent(retweetScreenName)}` : "";

    const wrapper = document.createElement("div");
    wrapper.className = "tm-detail-card";

    const closeBtn = document.createElement("button");
    closeBtn.className = "tm-detail-close";
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.onclick = closeDetail;

    if (isRetweet && retweetName) {
      const retweetInfo = document.createElement("div");
      retweetInfo.className = "retweet-info";
      retweetInfo.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${retweetProfileUrl ? `<a href="${retweetProfileUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(retweetName)} 已转帖</a>` : `<span>${escapeHTML(retweetName)} 已转帖</span>`}
    `;
      wrapper.appendChild(retweetInfo);
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

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.innerHTML = linkify(text);

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "media";
    if (media.length > 1) {
      const { el, controls } = createCarousel(media, initialImageIndex);
      mediaWrap.appendChild(el);
      activeCarouselControls = controls;
    } else {
      for (const m of media) {
        if (m.type === "photo") {
          const img = document.createElement("img");
          const url = m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`;
          img.src = url;
          img.loading = "lazy";
          mediaWrap.appendChild(img);
        } else if (m.type === "video") {
          const v = document.createElement("video");
          v.controls = true;
          v.src = m.url;
          mediaWrap.appendChild(v);
        }
      }
    }

    const actions = document.createElement("div");
    actions.className = "actions";
    const left = document.createElement("div");
    left.className = "tm-actions-left";

    const likeBtn = createLikeButton(displayLegacy, id);

    const rtChip = document.createElement("div");
    rtChip.className = "tm-count-chip";
    rtChip.textContent = `${displayLegacy.retweet_count || 0} 转推`;

    left.appendChild(likeBtn);
    left.appendChild(rtChip);

    const openLink = document.createElement("a");
    openLink.href = `https://x.com/${user}/status/${id}`;
    openLink.target = "_blank";
    openLink.textContent = "在 X 打开";
    actions.appendChild(left);
    actions.appendChild(openLink);

    wrapper.appendChild(closeBtn);
    wrapper.appendChild(meta);
    if (text) wrapper.appendChild(textDiv);
    if (media.length) wrapper.appendChild(mediaWrap);
    wrapper.appendChild(actions);
    wrapper.addEventListener("click", (e) => e.stopPropagation());
    return wrapper;
  };

  const openDetail = (tweet, initialImageIndex = 0) => {
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
    modal.appendChild(createDetailCard(tweet, initialImageIndex));
    overlay.classList.add("show");
    document.body.classList.add("tm-detail-open");
  };

  const createToast = () => {
    let el = null;
    return (msg, timeout = 2000) => {
      if (!el) {
        el = document.createElement("div");
        el.className = "tm-toast";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), timeout);
    };
  };

  const layout = {
    colWidth: LAYOUT_CONFIG.colWidth,
    gutter: LAYOUT_CONFIG.gutter,
    cols: 0,
    heights: [],
    initialized: false,
  };

  const ensureLayout = (grid) => {
    if (layout.initialized) return;
    const width = grid.clientWidth || grid.offsetWidth || 1200;
    const cols = Math.max(1, Math.floor((width + layout.gutter) / (layout.colWidth + layout.gutter)));
    layout.cols = cols;
    layout.heights = new Array(cols).fill(0);
    layout.initialized = true;
    const totalWidth = cols * layout.colWidth + (cols - 1) * layout.gutter;
    grid.style.width = `${totalWidth}px`;
    grid.style.marginLeft = "auto";
    grid.style.marginRight = "auto";
  };

  const resetLayout = () => {
    layout.initialized = false;
    layout.heights = [];
  };

  const waitMedia = (card, timeout = 1200) => {
    const media = card.querySelectorAll("img,video");
    if (!media.length) return Promise.resolve();
    return Promise.race([
      Promise.all(
        Array.from(media).map(
          (m) =>
            m.complete || m.readyState >= 2
              ? Promise.resolve()
              : new Promise((res) => {
                  const done = () => res();
                  m.addEventListener("load", done, { once: true });
                  m.addEventListener("loadeddata", done, { once: true });
                  m.addEventListener("error", done, { once: true });
                })
        )
      ),
      new Promise((res) => setTimeout(res, timeout)),
    ]);
  };

  const placeCard = async (card, grid) => {
    ensureLayout(grid);
    card.style.position = "absolute";
    card.style.width = `${layout.colWidth}px`;
    card.style.visibility = "hidden";
    grid.appendChild(card);
    await waitMedia(card);
    const heights = layout.heights;
    let target = 0;
    for (let i = 1; i < heights.length; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    const x = target * (layout.colWidth + layout.gutter);
    const y = heights[target];
    const h = card.offsetHeight;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.visibility = "visible";
    heights[target] = y + h + layout.gutter;
    grid.style.height = `${Math.max(...heights)}px`;
  };

  const pickAnchor = () => {
    const cards = Array.from(document.querySelectorAll(".tm-card"));
    for (const c of cards) {
      const rect = c.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) return { el: c, top: rect.top };
    }
    return null;
  };

  const state = {
    cursor: null,
    loading: false,
    ended: false,
    seen: new Set(),
    detailOpen: false,
  };

  let detailOpen = false;

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
      { rootMargin: "3600px 0px 3600px 0px", threshold: 0 }
    );
    io.observe(sentinel);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rest = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (rest < 3200) loadMore(grid);
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

})();
