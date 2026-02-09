// ==UserScript==
// @name         X Home Masonry Timeline V2
// @namespace    https://github.com/akayuki39/twitter-masonry
// @version      0.1.12
// @description  在浏览器直接把 X/Twitter 主页渲染成瀑布流（类似 Pinterest/小红书），无需自建后端。
// @author       akayuki39
// @homepage     https://github.com/akayuki39/twitter-masonry
// @changelog    0.1.12 (2026-02-09)
//                 - 新增视频自动暂停功能：当视频滑出可视区域时自动暂停，节省系统资源
//                 - 优化视频播放管理：打开/关闭detail时自动暂停相应区域的视频，避免多个视频同时播放
//                 - 新增videoObserver工具模块：集中管理视频观察、暂停、清理逻辑，提高代码可维护性
//                 - 修复内存泄漏：页面刷新时正确清理IntersectionObserver观察的视频元素
//                 0.1.11 (2026-02-02)
//                 - 修复时间线重复问题：通过准确的seenTweetIds让服务器返回更个性化的时间线
//                 - 重构状态管理模块，将时间线状态和可见性追踪逻辑提取到独立模块，提高可维护性
//                 - 新增"已查看推文"检测：用户需在卡片上停留5秒且50%可见才算已查看
//                 0.1.10 (2026-01-31)
//                 - 新增用户Profile Card功能：hover到头像0.5秒后显示用户资料卡片，显示banner、高清头像、简介、位置、关注数等信息
//                 0.1.9 (2026-01-29)
//                 - 修复无 entities 时不处理 displayTextRange 的问题（现在所有文本都会正确截断）
//                 - 重构文本处理模块
//                 - 统一处理有/无 entities 的情况，消除 displayRange 和 htmlDecode 的重复代码
//                 - 添加完整的文件级和函数级 JSDoc 注释，提高代码可维护性
//                 0.1.8 (2026-01-28)
//                 - 修复长推文（note_tweet）中的entities无法正确渲染的问题
//                 - 原因：长推文使用note_tweet.text和entity_set，与普通推文的legacy格式不同
//                 - 重构文本获取函数：添加getDisplayTweetText（卡片页）和getFullTweetText（详情页），语义更清晰
//                 - 简化getEntities函数：直接返回entity_set或legacy.entities，无需转换
//                 - 添加函数注释：提高代码可维护性
//                 0.1.7 (2026-01-27)
//                 - 调整detail卡片中文本字体大小：15px -> 17px，更接近X官网的显示效果
//                 0.1.6 (2026-01-26)
//                 - 新增entity处理模块：支持正确渲染推文文本中的hashtag、@提及、URL、股票符号等entities
//                 - 添加 processEntities 函数，根据Twitter API返回的entities数据正确渲染可交互链接
//                 - 支持 display_text_range 属性，只显示推文的实际显示文本部分
//                 - 移除旧的 processTweetText 处理方式，改用API提供的entities进行精确渲染
//                 0.1.5 (2026-01-26)
//                 - 修复转推（retweet）和引用推文（quote）有时无法显示原推内容的问题
//                 - 原因：Twitter API 部分响应使用 TweetWithVisibilityResults 包装类型，需要解包后访问
//                 - 添加 unwrapTweetResult 工具函数统一处理 Tweet 和 TweetWithVisibilityResults 两种类型
//                 0.1.4 (2026-01-26)
//                 - 统一图片预览界面的鼠标样式，图片区域也显示放大镜缩小图标
//                 0.1.3 (2026-01-25)
//                 - 修复点击detail中的图片打开预览时触发时间线加载新推文的问题
//                 - 增大预加载范围：IntersectionObserver从1600px提升到3000px，scroll监听从1200px提升到2500px
//                 - 图片预览现在点击图片本身也能关闭了
//                 0.1.2 (2025-01-25)
//                 - Add support for long tweets (note_tweet): Show complete text in detail view, display "Show more" link on homepage for tweets exceeding 140 characters. 
//                 - 新增长推文（note_tweet）支持：详情页显示完整文字，主页超过140字的推文显示"显示更多"链接
//                 0.1.1 (2025-01-25)
//                 - 新增图片全屏预览功能：点击detail卡中的图片可全屏查看，背景虚化，点击外部或按ESC退出
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
// @updateURL    https://raw.githubusercontent.com/akayuki39/twitter-masonry/main/home_timeline_masonry.user.js
// @downloadURL  https://raw.githubusercontent.com/akayuki39/twitter-masonry/main/home_timeline_masonry.user.js
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
    body.tm-image-open { overflow: hidden; }
    a { color: #0f7ae5; }
    .tm-app { min-height: 100vh; background: #f5f6f8; }
    .tm-header { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(15,23,42,0.06); box-shadow: 0 8px 20px rgba(15,23,42,0.05); }
    .tm-header-left { display: flex; align-items: center; gap: 12px; }
    .tm-github-link { display: grid; place-items: center; color: #64748b; transition: color 0.15s ease; }
    .tm-github-link:hover { color: #0f172a; }
    .tm-header .tm-btn { padding: 9px; display: grid; place-items: center; }
    body.tm-detail-open .tm-header { padding-right: calc(16px + var(--tm-scrollbar-width, 0px)); padding-left: calc(16px + var(--tm-scrollbar-width, 0px)); }
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
    .tm-user-link .tm-quote-avatar { transition: filter 0.12s ease; }
    .tm-user-link:hover .tm-quote-avatar { filter: brightness(0.9); }
    .tm-name-link { color: inherit; text-decoration: none; }
    .tm-name-link:hover { text-decoration: underline; }
    .tm-screen-link { color: inherit; text-decoration: none; }
    .tm-screen-link:hover { text-decoration: none; }
    .tm-card .meta .time { color: #94a3b8; font-size: 12px; }
    .tm-card .text { padding: 8px 16px 14px 16px; line-height: 1.6; color: #1f2937; word-break: break-word; white-space: pre-wrap; }
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
    .tm-pill { position: fixed; right: 16px; bottom: 150px; background: #fff; color: #0f172a; border-radius: 999px; padding: 10px 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(15,23,42,0.12); z-index: 9999; border: 1px solid rgba(15,23,42,0.1); transition: transform 0.12s ease, box-shadow 0.12s ease; font-size: 14px; }
    .tm-pill:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,0.15); border-color: rgba(15,23,42,0.15); }
    .tm-toast { position: fixed; top: 14px; right: 14px; background: #0f172a; color: #fff; padding: 11px 15px; border-radius: 12px; box-shadow: 0 16px 38px rgba(0,0,0,0.25); z-index: 9999; opacity: 0; transform: translateY(-8px); transition: all 0.25s ease; letter-spacing: 0.1px; pointer-events: none; }
    .tm-toast.show { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .tm-loader { padding: 20px; text-align: center; color: #94a3b8; font-weight: 600; }
    :root { --tm-detail-media-max-h: min(72vh, 880px); }
    .tm-detail-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.65); display: none; align-items: flex-start; justify-content: center; padding: 32px 18px; z-index: 99999; overflow-y: auto; }
    .tm-detail-backdrop.show { display: flex; }
    .tm-detail-modal { position: relative; width: min(960px, 96vw); margin: auto; }
    .tm-detail-card { background: #fff; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,0.25); border: 1px solid rgba(15,23,42,0.08); overflow-y: auto; max-height: calc(100vh - 64px); }
    .tm-detail-card::-webkit-scrollbar { width: 0; height: 0; }
    .tm-detail-card { scrollbar-width: none; -ms-overflow-style: none; }
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
    .tm-detail-card .text { padding: 10px 20px 18px; line-height: 1.7; color: #1f2937; word-break: break-word; font-size: 17px; white-space: pre-wrap; }
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
    .tm-quote-card { margin: 10px 16px 14px; padding: 14px; background: rgba(15,23,42,0.04); border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); transition: background 0.12s ease; }
    .tm-card:hover .tm-quote-card { background: rgba(15,23,42,0.06); }
    .tm-quote-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
    .tm-quote-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .tm-quote-avatar { width: 28px !important; height: 28px !important; border-radius: 50% !important; object-fit: cover !important; flex-shrink: 0; display: block; box-sizing: border-box; }
    .tm-quote-info { display: flex; flex-direction: column; gap: 2px; line-height: 1.2; min-width: 0; flex: 1; }
    .tm-quote-name-link { font-weight: 700; color: #0f172a; font-size: 14px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-quote-name-link:hover { text-decoration: underline; }
    .tm-quote-screen-link { color: #64748b; font-size: 12px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-quote-time { color: #94a3b8; font-size: 11px; flex-shrink: 0; }
    .tm-quote-text { padding: 4px 0; line-height: 1.6; color: #1f2937; word-break: break-word; font-size: 14px; white-space: pre-wrap; }
    .tm-quote-media { display: grid; gap: 8px; margin-top: 10px; }
    .tm-quote-media img, .tm-quote-media video { width: 100%; border-radius: 12px; object-fit: cover; background: linear-gradient(180deg,#f8fafc,#e2e8f0); display: block; }
    .tm-quote-media video { background: #0b1220; }
    .tm-detail-card .tm-quote-card { margin: 12px 20px 20px; padding: 16px; background: rgba(15,23,42,0.04); border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); }
    .tm-detail-card .tm-quote-meta { margin-bottom: 10px; }
    .tm-detail-card .tm-quote-avatar { width: 32px !important; height: 32px !important; }
    .tm-detail-card .tm-quote-name-link { font-size: 15px; }
    .tm-detail-card .tm-quote-screen-link { font-size: 13px; }
    .tm-detail-card .tm-quote-time { font-size: 12px; }
    .tm-detail-card .tm-quote-text { font-size: 15px; padding: 6px 0; white-space: pre-wrap; }
    .tm-detail-card .tm-quote-media { gap: 10px; margin-top: 12px; }
    .tm-detail-card .tm-quote-media img, .tm-detail-card .tm-quote-media video { border-radius: 14px; width: 100%; max-height: var(--tm-detail-media-max-h); object-fit: contain; background: linear-gradient(180deg,#f8fafc,#e2e8f0); }
    .tm-detail-card .tm-quote-media video { background: #0b1220; }
    .tm-detail-card .tm-quote-media .tm-carousel { border-radius: 14px; background: linear-gradient(180deg,#f8fafc,#e2e8f0); }
    .tm-detail-card .tm-quote-media .tm-carousel-slide img, .tm-detail-card .tm-quote-media .tm-carousel-slide video { border-radius: 14px; max-height: var(--tm-detail-media-max-h); object-fit: contain; }
    .tm-card.no-text .media, .tm-detail-card.no-text .media { padding-top: 14px; }
    .tm-image-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 999999; cursor: zoom-out; opacity: 0; transition: opacity 0.2s ease; }
    .tm-image-backdrop.show { display: flex; opacity: 1; }
    .tm-image-modal { position: relative; max-width: 95vw; max-height: 95vh; display: flex; align-items: center; justify-content: center; }
    .tm-preview-image { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 12px; box-shadow: 0 32px 80px rgba(0,0,0,0.4); cursor: zoom-out; transform: scale(0.9); transition: transform 0.15s ease; }
    .tm-image-backdrop.show .tm-preview-image { transform: scale(1); }
    .tm-show-more { color: #0f7ae5; cursor: pointer; font-size: 14px; font-weight: 500; transition: color 0.12s ease; }
    .tm-show-more:hover { color: #2563eb; }
    
    .tm-profile-card { position: absolute; z-index: 1000; width: 320px; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); border: 1px solid rgba(15,23,42,0.08); overflow: hidden; animation: tm-profile-card-fade-in 0.15s ease; }
    @keyframes tm-profile-card-fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .tm-profile-banner { width: 100%; height: 100px; overflow: hidden; background: linear-gradient(180deg,#f8fafc,#e2e8f0); border-radius: 16px 16px 0 0; }
    .tm-profile-banner img { width: 100%; height: 100%; object-fit: cover; }
    .tm-profile-content { padding: 0 16px 16px; }
    .tm-profile-header { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-end; }
    .tm-profile-header.with-banner { margin-top: -36px; }
    .tm-profile-header.no-banner { margin-top: 16px; }
    .tm-profile-avatar-link { display: block; flex-shrink: 0; }
    .tm-profile-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,0.15); background: #fff; }
    .tm-profile-names { flex: 1; min-width: 0; padding-bottom: 8px; padding-top: 44px; }
    .tm-profile-name-row { display: flex; align-items: center; gap: 4px; }
    .tm-profile-name { font-weight: 800; color: #0f172a; font-size: 16px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-profile-name:hover { text-decoration: underline; }
    .tm-profile-verified { color: #1d9bf0; display: flex; align-items: center; flex-shrink: 0; }
    .tm-profile-screen-name { color: #64748b; font-size: 14px; text-decoration: none; }
    .tm-profile-screen-name:hover { text-decoration: underline; }
    .tm-profile-description { color: #334155; font-size: 14px; line-height: 1.5; margin-bottom: 12px; word-break: break-word; white-space: pre-wrap; }
    .tm-profile-description a { color: #0f7ae5; text-decoration: none; }
    .tm-profile-description a:hover { text-decoration: underline; }
    .tm-profile-location { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 13px; margin-bottom: 12px; }
    .tm-profile-location svg { color: #94a3b8; flex-shrink: 0; }
    .tm-profile-stats { display: flex; gap: 16px; }
    .tm-profile-stat { display: flex; align-items: center; gap: 4px; text-decoration: none; color: inherit; }
    .tm-profile-stat:hover { text-decoration: underline; }
    .tm-profile-stat-value { font-weight: 700; color: #0f172a; font-size: 14px; }
    .tm-profile-stat-label { color: #64748b; font-size: 14px; }
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

  const buildUrl = (cursor, seenTweetIds = []) => {
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

  const formatTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (!isNaN(d)) return d.toLocaleString();
    const tryD = new Date(Date.parse(raw));
    return isNaN(tryD) ? raw : tryD.toLocaleString();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  // 判断是否为长推文
  const isNoteTweet = (tweet) => {
    return !!(tweet?.note_tweet?.note_tweet_results?.result?.text);
  };


  // 获取卡片显示的文本（普通推文截取，长推文完整）
  const getDisplayTweetText = (tweet) => {
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
  const getFullTweetText = (tweet) => {
    if (isNoteTweet(tweet)) {
      return tweet.note_tweet.note_tweet_results.result.text;
    }
    const legacy = tweet.legacy || tweet;
    return legacy.full_text || legacy.text || "";
  };


  // 获取推文entities（hashtag、mention、URL等）
  const getEntities = (tweet) => {
    if (isNoteTweet(tweet)) {
      return tweet.note_tweet?.note_tweet_results?.result?.entity_set || {};
    }
    const legacy = tweet.legacy || tweet;
    return legacy.entities || {};
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

  const unwrapTweetResult = (result) => {
    if (!result) return null;
    if (result.__typename === "TweetWithVisibilityResults") return result.tweet || result;
    return result;
  };

  // 获取高清头像URL（将_normal替换为_200x200）
  const getHighResAvatar = (avatarUrl) => {
    if (!avatarUrl) return "";
    return avatarUrl.replace(/_normal\.(jpg|jpeg|png)$/i, "_200x200.$1");
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

  /**
   * Twitter 文本实体处理模块
   * 
   * 处理推文文本中的各种实体（hashtag、mention、URL、symbol 等），
   * 支持显示范围截断（displayTextRange），考虑 Unicode code points（emoji）
   * 正确索引，渲染为 DOM 元素。
   * 
   * 主要函数：
   * - processText(): 主入口，处理文本并返回 DOM 元素
   */


  /**
   * HTML 解码
   * @param {string} text - 编码的 HTML 文本
   * @returns {string|null} 解码后的文本
   */
  const htmlDecode = (text) => {
    if (!text) return text;
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  };

  /**
   * 创建实体链接元素
   * @param {string} text - 链接文本
   * @param {string} url - 链接地址
   * @param {boolean} [isExternal=true] - 是否外部链接（添加 target="_blank"）
   * @returns {HTMLAnchorElement} 链接元素
   */
  const createEntityLink = (text, url, isExternal = true) => {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = text;
    if (isExternal) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  };

  /**
   * 创建 hashtag 元素
   * @param {Object} hashtag - hashtag 数据（包含 text 字段）
   * @returns {HTMLAnchorElement} hashtag 链接元素
   */
  const createHashtag = (hashtag) => {
    const { text } = hashtag;
    return createEntityLink(`#${text}`, `https://x.com/hashtag/${encodeURIComponent(text)}`);
  };

  /**
   * 创建用户提及元素
   * @param {Object} mention - mention 数据（包含 screen_name 和 name 字段）
   * @returns {HTMLAnchorElement} mention 链接元素
   */
  const createUserMention = (mention) => {
    const { screen_name, name } = mention;
    const link = createEntityLink(`@${screen_name}`, `https://x.com/${screen_name}`);
    if (name) {
      link.title = htmlDecode(name);
    }
    return link;
  };

  /**
   * 创建 URL 元素
   * @param {Object} urlEntity - URL 数据（包含 display_url 和 expanded_url 字段）
   * @returns {HTMLAnchorElement} URL 链接元素
   */
  const createUrl = (urlEntity) => {
    const { display_url, expanded_url } = urlEntity;
    return createEntityLink(display_url, expanded_url);
  };

  /**
   * 创建 symbol 元素（如 $TSLA）
   * @param {Object} symbol - symbol 数据（包含 text 字段）
   * @returns {HTMLAnchorElement} symbol 链接元素
   */
  const createSymbol = (symbol) => {
    const { text } = symbol;
    return createEntityLink(`$${text}`, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
  };

  /**
   * 创建时间戳元素
   * @param {Object} timestamp - 时间戳数据（包含 text 字段）
   * @returns {HTMLAnchorElement} 时间戳链接元素
   */
  const createTimestamp = (timestamp) => {
    const { text } = timestamp;
    return createEntityLink(text, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
  };

  /**
   * 解析显示范围
   * @param {number[]|null} displayTextRange - 显示范围数组 [start, end]
   * @param {number} textLength - 文本总长度
   * @returns {number[]} 范围 [start, end]
   */
  const parseRange = (displayTextRange, textLength) => {
    const start = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
      ? displayTextRange[0]
      : 0;
    const end = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
      ? displayTextRange[1]
      : textLength;
    return [start, end];
  };

  /**
   * 从文本中提取实体（正则匹配）
   * 当 Twitter API 没有提供 entities 数据时使用
   * @param {string} text - 文本内容
   * @returns {Array} 实体数组（包含 type、indices、data 字段）
   */
  const extractEntitiesFromText = (text) => {
    const decodedText = htmlDecode(text);
    const mentionRegex = /@([\p{L}\p{N}_]{1,15})/gu;
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const urlRegex = /(https?:\/\/[\w./?=&%#-]+)/g;

    const allMatches = [];
    const patterns = [
      { regex: mentionRegex, type: 'user_mention' },
      { regex: hashtagRegex, type: 'hashtag' },
      { regex: urlRegex, type: 'url' }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex);
      while ((match = regexCopy.exec(decodedText)) !== null) {
        const rawStart = match.index;
        const rawEnd = regexCopy.lastIndex;
        
        if (type === 'user_mention') {
          const screenName = match[1];
          allMatches.push({
            type,
            indices: [rawStart, rawEnd],
            data: { screen_name: screenName, name: null }
          });
        } else if (type === 'hashtag') {
          const hashtagText = match[1];
          allMatches.push({
            type,
            indices: [rawStart, rawEnd],
            data: { text: hashtagText }
          });
        } else if (type === 'url') {
          allMatches.push({
            type,
            indices: [rawStart, rawEnd],
            data: { display_url: match[0], expanded_url: match[0] }
          });
        }
      }
    });

    allMatches.sort((a, b) => a.indices[0] - b.indices[0]);
    return allMatches;
  };

  /**
   * 标准化 Twitter API 实体格式
   * @param {Object} entities - Twitter API 实体对象（包含 hashtags、user_mentions、urls 等）
   * @returns {Array} 标准化后的实体数组
   */
  const normalizeEntities = (entities) => {
    const { hashtags = [], user_mentions = [], urls = [], symbols = [], timestamps = [] } = entities || {};

    const allEntities = [];

    [...hashtags, ...user_mentions, ...urls, ...symbols, ...timestamps].forEach((entity) => {
      if (!entity.indices || !Array.isArray(entity.indices) || entity.indices.length !== 2) {
        return;
      }

      allEntities.push({
        type: entity.text ? 'hashtag' : entity.screen_name ? 'user_mention' : entity.display_url ? 'url' : entity.url ? 'media_url' : 'symbol',
        indices: entity.indices,
        data: entity
      });
    });

    allEntities.sort((a, b) => a.indices[0] - b.indices[0]);
    return allEntities;
  };

  /**
   * 渲染单个实体到容器
   * @param {Object} entity - 实体对象（包含 type 和 data 字段）
   * @param {HTMLElement} container - DOM 容器
   */
  const renderEntity = (entity, container) => {
    switch (entity.type) {
      case 'hashtag':
        container.appendChild(createHashtag(entity.data));
        break;
      case 'user_mention':
        container.appendChild(createUserMention(entity.data));
        break;
      case 'url':
        container.appendChild(createUrl(entity.data));
        break;
      case 'symbol':
        container.appendChild(createSymbol(entity.data));
        break;
      case 'timestamp':
        container.appendChild(createTimestamp(entity.data));
        break;
    }
  };

  /**
   * 按 index 渲染文本和实体
   * @param {string[]} chars - 文本的 code points 数组
   * @param {Array} entities - 实体数组
   * @param {number} start - 起始索引
   * @param {number} end - 结束索引
   * @returns {HTMLSpanElement} 渲染后的 DOM 元素
   */
  const renderWithIndex = (chars, entities, start, end) => {
    const container = document.createElement('span');
    let currentIndex = start;

    for (const entity of entities) {
      const [entityStart, entityEnd] = entity.indices;

      if (entityStart < currentIndex) {
        continue;
      }

      if (entityStart >= end) {
        break;
      }

      if (entityStart > currentIndex) {
        const rawChars = chars.slice(currentIndex, entityStart);
        const rawText = rawChars.join('');
        const decodedText = htmlDecode(rawText);
        container.appendChild(document.createTextNode(decodedText));
      }

      renderEntity(entity, container);
      currentIndex = entityEnd;
    }

    if (currentIndex < end) {
      const rawChars = chars.slice(currentIndex, end);
      const rawText = rawChars.join('');
      const decodedText = htmlDecode(rawText);
      container.appendChild(document.createTextNode(decodedText));
    }

    return container;
  };

  /**
   * 处理推文文本并渲染为 DOM
   * 
   * 主要逻辑：
   * 1. 使用 Array.from() 将文本转为 code points 数组（正确处理 emoji）
   * 2. 应用 displayTextRange 截断
   * 3. 如果有 entitiesArg，使用 Twitter API 提供的实体数据
   * 4. 否则，用正则从文本中提取实体
   * 5. 按 index 渲染文本和实体链接
   * 
   * @param {string} text - 原始文本
   * @param {Object|null} [entitiesArg=null] - Twitter API 实体对象（可选）
   * @param {number[]|null} [displayTextRange=null] - 显示范围 [start, end]（可选）
   * @returns {HTMLSpanElement} 渲染后的 DOM 元素
   * 
   * @example
   * const text = "Hello @user! Check #tag and https://example.com";
   * const result = processText(text, null, [0, text.length]);
   * document.body.appendChild(result);
   */
  const processText = (text, entitiesArg = null, displayTextRange = null) => {
    const container = document.createElement('span');

    if (!text) {
      return container;
    }

    const chars = Array.from(text);
    const length = chars.length;
    const [start, end] = parseRange(displayTextRange, length);

    const normalizedEntities = entitiesArg && Object.keys(entitiesArg).length > 0
      ? normalizeEntities(entitiesArg)
      : extractEntitiesFromText(chars.slice(start, end).join(''));

    return renderWithIndex(chars, normalizedEntities, start, end);
  };

  let activeCard = null;
  let hoverTimeout = null;
  let leaveTimeout = null;
  const HOVER_DELAY = 500;

  const removeActiveCard = () => {
    if (activeCard) {
      activeCard.remove();
      activeCard = null;
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      leaveTimeout = null;
    }
  };

  const createProfileCard = (userData) => {
    const card = document.createElement("div");
    card.className = "tm-profile-card";

    const core = userData?.core || {};
    const legacy = userData?.legacy || {};
    const avatar = userData?.avatar?.image_url;
    const banner = legacy?.profile_banner_url;
    const isVerified = userData?.is_blue_verified;

    const name = core.name || "";
    const screenName = core.screen_name || "";
    const description = legacy.description || "";
    const location = userData?.location?.location || "";
    const followersCount = legacy.followers_count || 0;
    const followingCount = legacy.friends_count || 0;

    const profileUrl = screenName ? `https://x.com/${encodeURIComponent(screenName)}` : "";

    const content = document.createElement("div");
    content.className = "tm-profile-content";

    const header = document.createElement("div");
    header.className = banner ? "tm-profile-header with-banner" : "tm-profile-header no-banner";

    if (banner) {
      const bannerEl = document.createElement("div");
      bannerEl.className = "tm-profile-banner";
      const bannerImg = document.createElement("img");
      bannerImg.src = banner;
      bannerEl.appendChild(bannerImg);
      card.appendChild(bannerEl);
    }

    if (avatar) {
      const avatarLink = document.createElement("a");
      avatarLink.href = profileUrl;
      avatarLink.target = "_blank";
      avatarLink.rel = "noopener noreferrer";
      avatarLink.className = "tm-profile-avatar-link";
      const avatarImg = document.createElement("img");
      avatarImg.src = getHighResAvatar(avatar);
      avatarImg.className = "tm-profile-avatar";
      avatarLink.appendChild(avatarImg);
      header.appendChild(avatarLink);
    }

    const nameSection = document.createElement("div");
    nameSection.className = "tm-profile-names";

    const nameRow = document.createElement("div");
    nameRow.className = "tm-profile-name-row";

    const nameLink = document.createElement("a");
    nameLink.href = profileUrl;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    nameLink.className = "tm-profile-name";
    nameLink.textContent = name;
    nameRow.appendChild(nameLink);

    if (isVerified) {
      const verifiedBadge = document.createElement("span");
      verifiedBadge.className = "tm-profile-verified";
      verifiedBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.084.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-3-3c-.293-.293-.293-.768 0-1.06.293-.294.768-.294 1.06 0l2.3 2.3 3.7-5.6c.19-.29.58-.35.87-.16.29.18.36.57.18.86z"/></svg>`;
      nameRow.appendChild(verifiedBadge);
    }

    nameSection.appendChild(nameRow);

    const screenNameEl = document.createElement("a");
    screenNameEl.href = profileUrl;
    screenNameEl.target = "_blank";
    screenNameEl.rel = "noopener noreferrer";
    screenNameEl.className = "tm-profile-screen-name";
    screenNameEl.textContent = `@${screenName}`;
    nameSection.appendChild(screenNameEl);

    header.appendChild(nameSection);
    content.appendChild(header);

    if (description) {
      const desc = document.createElement("div");
      desc.className = "tm-profile-description";
      
      const entities = legacy.entities?.description || {};
      const processedDesc = processText(description, entities, null);
      desc.appendChild(processedDesc);
      content.appendChild(desc);
    }

    if (location) {
      const loc = document.createElement("div");
      loc.className = "tm-profile-location";
      loc.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" width="14" height="14"><g><path d="M12 7c-1.93 0-3.5 1.57-3.5 3.5S10.07 14 12 14s3.5-1.57 3.5-3.5S13.93 7 12 7zm0 5c-.827 0-1.5-.673-1.5-1.5S11.173 9 12 9s1.5.673 1.5 1.5S12.827 12 12 12zm0-10c-4.687 0-8.5 3.813-8.5 8.5 0 5.967 7.621 11.116 7.945 11.332l.555.37.555-.37c.324-.216 7.945-5.365 7.945-11.332C20.5 5.813 16.687 2 12 2zm0 17.77c-1.665-1.241-6.5-5.196-6.5-9.27C5.5 6.916 8.416 4 12 4s6.5 2.916 6.5 6.5c0 4.073-4.835 8.028-6.5 9.27z"></path></g></svg><span>${escapeHTML(location)}</span>`;
      content.appendChild(loc);
    }

    const stats = document.createElement("div");
    stats.className = "tm-profile-stats";
    stats.innerHTML = `
    <a href="${profileUrl}/following" target="_blank" rel="noopener noreferrer" class="tm-profile-stat">
      <span class="tm-profile-stat-value">${formatNumber(followingCount)}</span>
      <span class="tm-profile-stat-label">正在关注</span>
    </a>
    <a href="${profileUrl}/followers" target="_blank" rel="noopener noreferrer" class="tm-profile-stat">
      <span class="tm-profile-stat-value">${formatNumber(followersCount)}</span>
      <span class="tm-profile-stat-label">关注者</span>
    </a>
  `;
    content.appendChild(stats);

    card.appendChild(content);

    card.addEventListener("mouseenter", () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
      }
    });

    card.addEventListener("mouseleave", () => {
      leaveTimeout = setTimeout(() => {
        removeActiveCard();
      }, 200);
    });

    return card;
  };

  const attachProfileCardHover = (element, userData) => {
    if (!element || !userData) return;

    element.addEventListener("mouseenter", (e) => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (leaveTimeout) clearTimeout(leaveTimeout);

      hoverTimeout = setTimeout(() => {
        removeActiveCard();

        const card = createProfileCard(userData);
        document.body.appendChild(card);
        activeCard = card;

        const rect = element.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        let left = rect.left + rect.width / 2 - cardRect.width / 2;
        let top = rect.bottom + 8;

        if (left < 10) left = 10;
        if (left + cardRect.width > window.innerWidth - 10) {
          left = window.innerWidth - cardRect.width - 10;
        }

        if (top + cardRect.height > window.innerHeight - 10) {
          top = rect.top - cardRect.height - 8;
        }

        card.style.left = `${left + window.scrollX}px`;
        card.style.top = `${top + window.scrollY}px`;
      }, HOVER_DELAY);
    });

    element.addEventListener("mouseleave", () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }

      leaveTimeout = setTimeout(() => {
        removeActiveCard();
      }, 200);
    });
  };

  const createQuoteTweet = (quotedTweet) => {
    const quoteLegacy = quotedTweet.legacy || quotedTweet;
    const quoteCore = quotedTweet.core;
    const quoteUser = quoteCore?.user_results?.result?.core;
    const quoteUserFull = quoteCore?.user_results?.result;
    const text = getDisplayTweetText(quotedTweet);
    const media = pickMedia(quotedTweet);
    const user = quoteUser?.screen_name || quoteLegacy.user_id_str || "unknown";
    const avatar = quoteCore?.user_results?.result?.avatar?.image_url;
    const name = quoteUser?.name || user;
    quotedTweet.rest_id || quoteLegacy.id_str;
    const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
    const createdAt = quoteLegacy.created_at || "";

    const quoteCard = document.createElement("div");
    quoteCard.className = "tm-quote-card";

    const meta = document.createElement("div");
    meta.className = "tm-quote-meta";

    const userSpan = document.createElement("div");
    userSpan.className = "tm-quote-user";
    if (avatar) {
      const avatarLink = document.createElement("a");
      avatarLink.href = profileUrl;
      avatarLink.target = "_blank";
      avatarLink.rel = "noopener noreferrer";
      avatarLink.className = "tm-user-link";
      const avatarImg = document.createElement("img");
      avatarImg.className = "tm-quote-avatar";
      avatarImg.src = avatar;
      avatarLink.appendChild(avatarImg);
      userSpan.appendChild(avatarLink);
      
      if (quoteUserFull) {
        attachProfileCardHover(avatarLink, quoteUserFull);
      }
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "tm-quote-info";

    const nameLink = document.createElement("a");
    nameLink.className = "tm-quote-name-link";
    nameLink.href = profileUrl;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    nameLink.textContent = name;

    const screenLink = document.createElement("a");
    screenLink.className = "tm-quote-screen-link";
    screenLink.href = profileUrl;
    screenLink.target = "_blank";
    screenLink.rel = "noopener noreferrer";
    screenLink.textContent = `@${user}`;

    infoDiv.appendChild(nameLink);
    infoDiv.appendChild(screenLink);
    userSpan.appendChild(infoDiv);
    
    if (quoteUserFull) {
      attachProfileCardHover(infoDiv, quoteUserFull);
    }

    const timeSpan = document.createElement("div");
    timeSpan.className = "tm-quote-time";
    timeSpan.textContent = createdAt ? formatTime(createdAt) : "";

    meta.appendChild(userSpan);
    meta.appendChild(timeSpan);

    const textDiv = document.createElement("div");
    textDiv.className = "tm-quote-text";
    const entities = getEntities(quotedTweet);
    const displayRange = isNoteTweet(quotedTweet) ? null : quoteLegacy.display_text_range;
    const processedText = processText(text, entities, displayRange);
    textDiv.appendChild(processedText);

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "tm-quote-media";
    media.forEach((m, index) => {
      if (m.type === "photo") {
        const img = document.createElement("img");
        img.src = m.url;
        img.loading = "eager";
        mediaWrap.appendChild(img);
      } else if (m.type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.src = m.url;
        mediaWrap.appendChild(v);
      }
    });

    quoteCard.appendChild(meta);
    if (text) quoteCard.appendChild(textDiv);
    if (media.length) quoteCard.appendChild(mediaWrap);

    return quoteCard;
  };

  const createCard = (tweet, openDetail) => {
    const legacy = tweet.legacy || tweet;
    const isRetweet = legacy.retweeted_status_result;
    const retweetData = isRetweet ? unwrapTweetResult(legacy.retweeted_status_result.result) : null;
    const displayLegacy = retweetData?.legacy || legacy;
    const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
    const displayCore = retweetData?.core || tweet.core;
    const displayTweet = retweetData || tweet;
    const displayUserFull = retweetData?.core?.user_results?.result || tweet.core?.user_results?.result;
    const quotedDataRaw = retweetData?.quoted_status_result?.result || legacy.quoted_status_result?.result || tweet.quoted_status_result?.result;
    const quotedData = unwrapTweetResult(quotedDataRaw);

    const text = getDisplayTweetText(displayTweet);
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
    if (!text) card.classList.add("no-text");
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

    if (avatar) {
      const avatarLink = document.createElement("a");
      avatarLink.href = profileUrl;
      avatarLink.target = "_blank";
      avatarLink.rel = "noopener noreferrer";
      avatarLink.className = "tm-user-link";
      const avatarImg = document.createElement("img");
      avatarImg.className = "tm-avatar";
      avatarImg.src = avatar;
      avatarImg.style.cssText = "width:36px;height:36px;border-radius:50%;object-fit:cover;";
      avatarLink.appendChild(avatarImg);
      userSpan.appendChild(avatarLink);
      
      if (displayUserFull) {
        attachProfileCardHover(avatarLink, displayUserFull);
      }
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "info";

    const nameLink = document.createElement("a");
    nameLink.className = "name tm-name-link";
    nameLink.href = profileUrl;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    nameLink.textContent = name;

    const screenLink = document.createElement("a");
    screenLink.className = "screen tm-screen-link";
    screenLink.href = profileUrl;
    screenLink.target = "_blank";
    screenLink.rel = "noopener noreferrer";
    screenLink.textContent = `@${user}`;

    infoDiv.appendChild(nameLink);
    infoDiv.appendChild(screenLink);
    userSpan.appendChild(infoDiv);

    if (displayUserFull) {
      attachProfileCardHover(infoDiv, displayUserFull);
    }
    
    const time = document.createElement("div");
    time.className = "time";
    time.textContent = formatTime(displayLegacy.created_at);
    meta.appendChild(userSpan);
    meta.appendChild(time);

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    const entities = getEntities(displayTweet);
    const displayRange = isNoteTweet(displayTweet) ? null : displayLegacy.display_text_range;
    const processedText = processText(text, entities, displayRange);
    textDiv.appendChild(processedText);
    if (isNoteTweet(displayTweet)) {
      const showMoreDiv = document.createElement("div");
      showMoreDiv.className = "tm-show-more";
      showMoreDiv.textContent = "显示更多";
      showMoreDiv.onclick = (e) => {
        e.stopPropagation();
        openDetail(displayTweet);
      };
      textDiv.appendChild(showMoreDiv);
    }

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
    if (quotedData) {
      const quoteCard = createQuoteTweet(quotedData);
      card.appendChild(quoteCard);
    }
    card.appendChild(actions);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".tm-like") || e.target.closest("a") || e.target.closest("video")) return;
      openDetail(displayTweet);
    });
    return card;
  };

  let detailOpen = false;

  const isDetailOpen = () => detailOpen;

  const setDetailOpen = (open) => {
    detailOpen = open;
  };

  let imageOverlay = null;
  let imageModal = null;

  const ensureImageLayer = () => {
    if (imageOverlay && imageModal) return { overlay: imageOverlay, modal: imageModal };
    const overlay = document.createElement("div");
    overlay.className = "tm-image-backdrop";
    const modal = document.createElement("div");
    modal.className = "tm-image-modal";
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeImagePreview();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeImagePreview();
    });
    document.body.appendChild(overlay);
    imageOverlay = overlay;
    imageModal = modal;
    return { overlay, modal };
  };

  const openImagePreview = (imageUrl) => {
    setDetailOpen(true);
    const { overlay, modal } = ensureImageLayer();
    modal.innerHTML = "";
    const img = document.createElement("img");
    img.src = imageUrl;
    img.className = "tm-preview-image";
    img.addEventListener("click", closeImagePreview);
    modal.appendChild(img);
    overlay.classList.add("show");
    document.body.classList.add("tm-image-open");
  };

  const closeImagePreview = () => {
    if (!imageOverlay) return;
    imageOverlay.classList.remove("show");
    document.body.classList.remove("tm-image-open");
    setDetailOpen(false);
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
        img.style.cursor = "pointer";
        img.addEventListener("click", (e) => {
          e.stopPropagation();
          openImagePreview(url);
        });
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

  /**
   * 视频可见性观察器
   * 当视频滑出可视区域时自动暂停
   */

  let videoObserver = null;

  /**
   * 获取或创建视频观察器实例
   * @returns {IntersectionObserver}
   */
  const getVideoObserver = () => {
    if (videoObserver) return videoObserver;

    videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          // 当视频可见比例低于10%时暂停（几乎完全滑出视口）
          if (entry.intersectionRatio < 0.1 && !video.paused) {
            video.pause();
          }
        });
      },
      {
        // 使用较大的rootMargin，在视频即将离开视口前就暂停
        rootMargin: "-10% 0px -10% 0px",
        threshold: [0, 0.1],
      }
    );

    return videoObserver;
  };

  /**
   * 观察视频元素，当滑出可视区域时自动暂停
   * @param {HTMLVideoElement} video - 视频元素
   */
  const observeVideo = (video) => {
    if (!video || video.tagName !== "VIDEO") return;
    const observer = getVideoObserver();
    observer.observe(video);
  };

  /**
   * 观察容器中所有视频元素
   * @param {HTMLElement} container - 容器元素
   */
  const observeVideosInContainer = (container) => {
    if (!container) return;
    const videos = container.querySelectorAll("video");
    videos.forEach((video) => observeVideo(video));
  };

  /**
   * 停止观察容器中所有视频元素
   * @param {HTMLElement} container - 容器元素
   */
  const unobserveVideosInContainer = (container) => {
    if (!container || !videoObserver) return;
    const videos = container.querySelectorAll("video");
    videos.forEach((video) => videoObserver.unobserve(video));
  };

  /**
   * 暂停指定容器内的所有视频
   * @param {HTMLElement} container - 容器元素
   */
  const pauseVideosInContainer = (container) => {
    if (!container) return;
    const videos = container.querySelectorAll("video");
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });
  };

  /**
   * 暂停timeline容器内所有正在播放的视频
   */
  const pauseTimelineVideos = () => {
    const timelineContainer = document.querySelector(".tm-grid");
    if (timelineContainer) {
      pauseVideosInContainer(timelineContainer);
    }
  };

  let activeCarouselControls = null;

  const createDetailQuoteTweet = (quotedTweet) => {
    const quoteLegacy = quotedTweet.legacy || quotedTweet;
    const quoteCore = quotedTweet.core;
    const quoteUser = quoteCore?.user_results?.result?.core;
    const text = getFullTweetText(quotedTweet);
    const media = pickMedia(quotedTweet);
    const user = quoteUser?.screen_name || quoteLegacy.user_id_str || "unknown";
    const avatar = quoteCore?.user_results?.result?.avatar?.image_url;
    const name = quoteUser?.name || user;
    const profileUrl = `https://x.com/${encodeURIComponent(user)}`;
    const createdAt = quoteLegacy.created_at || "";

    const quoteCard = document.createElement("div");
    quoteCard.className = "tm-quote-card";

    const meta = document.createElement("div");
    meta.className = "tm-quote-meta";

    const userSpan = document.createElement("div");
    userSpan.className = "tm-quote-user";
    if (avatar) {
      const avatarLink = document.createElement("a");
      avatarLink.href = profileUrl;
      avatarLink.target = "_blank";
      avatarLink.rel = "noopener noreferrer";
      avatarLink.className = "tm-user-link";
      const avatarImg = document.createElement("img");
      avatarImg.className = "tm-quote-avatar";
      avatarImg.src = avatar;
      avatarLink.appendChild(avatarImg);
      userSpan.appendChild(avatarLink);
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "tm-quote-info";

    const nameLink = document.createElement("a");
    nameLink.className = "tm-quote-name-link";
    nameLink.href = profileUrl;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    nameLink.textContent = name;

    const screenLink = document.createElement("a");
    screenLink.className = "tm-quote-screen-link";
    screenLink.href = profileUrl;
    screenLink.target = "_blank";
    screenLink.rel = "noopener noreferrer";
    screenLink.textContent = `@${user}`;

    infoDiv.appendChild(nameLink);
    infoDiv.appendChild(screenLink);
    userSpan.appendChild(infoDiv);

    const timeSpan = document.createElement("div");
    timeSpan.className = "tm-quote-time";
    timeSpan.textContent = createdAt ? formatTime(createdAt) : "";

    meta.appendChild(userSpan);
    meta.appendChild(timeSpan);

    const textDiv = document.createElement("div");
    textDiv.className = "tm-quote-text";
    const entities = getEntities(quotedTweet);
    const displayRange = isNoteTweet(quotedTweet) ? null : quoteLegacy.display_text_range;
    const processedText = processText(text, entities, displayRange);
    textDiv.appendChild(processedText);

    quoteCard.appendChild(meta);
    if (text) quoteCard.appendChild(textDiv);

    if (media.length) {
      const mediaWrap = document.createElement("div");
      mediaWrap.className = "tm-quote-media";
      if (media.length > 1) {
        const { el} = createCarousel(media, 0);
        mediaWrap.appendChild(el);
      } else {
        for (const m of media) {
          if (m.type === "photo") {
            const img = document.createElement("img");
            const url = m.url.includes("?name=orig") ? m.url : `${m.url}${m.url.includes("?") ? "&" : "?"}name=orig`;
            img.src = url;
            img.loading = "lazy";
            img.style.cursor = "pointer";
            img.addEventListener("click", (e) => {
              e.stopPropagation();
              openImagePreview(url);
            });
            mediaWrap.appendChild(img);
          } else if (m.type === "video") {
            const v = document.createElement("video");
            v.controls = true;
            v.src = m.url;
            mediaWrap.appendChild(v);
          }
        }
      }
      quoteCard.appendChild(mediaWrap);
    }

    return quoteCard;
  };
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
    // 暂停detail中的视频
    pauseVideosInContainer(detailModal);
    detailOverlay.classList.remove("show");
    document.body.classList.remove("tm-detail-open");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.documentElement.style.removeProperty("--tm-scrollbar-width");
    document.body.style.paddingRight = "";
    window.scrollTo({ top: scrollBackup, behavior: "auto" });
    activeCarouselControls = null;
    setDetailOpen(false);
  };

  const createDetailCard = (tweet, initialImageIndex = 0) => {
    activeCarouselControls = null;
    const legacy = tweet.legacy || tweet;
    const isRetweet = legacy.retweeted_status_result;
    const retweetData = isRetweet ? unwrapTweetResult(legacy.retweeted_status_result.result) : null;
    const displayLegacy = retweetData?.legacy || legacy;
    const displayUser = retweetData?.core?.user_results?.result?.core || tweet.core?.user_results?.result?.core;
    const displayCore = retweetData?.core || tweet.core;
    const displayTweet = retweetData || tweet;
    const quotedDataRaw = retweetData?.quoted_status_result?.result || legacy.quoted_status_result?.result || tweet.quoted_status_result?.result;
    const quotedData = unwrapTweetResult(quotedDataRaw);

    const text = getFullTweetText(displayTweet);
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
    if (!text) wrapper.classList.add("no-text");

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
    const entities = getEntities(displayTweet);
    const displayRange = isNoteTweet(displayTweet) ? null : displayLegacy.display_text_range;
    const processedText = processText(text, entities, displayRange);
    textDiv.appendChild(processedText);

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
          img.style.cursor = "pointer";
          img.addEventListener("click", (e) => {
            e.stopPropagation();
            openImagePreview(url);
          });
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
    if (quotedData) {
      const quoteCard = createDetailQuoteTweet(quotedData);
      wrapper.appendChild(quoteCard);
    }
    wrapper.appendChild(actions);
    wrapper.addEventListener("click", (e) => e.stopPropagation());
    return wrapper;
  };

  const openDetail = (tweet, initialImageIndex = 0) => {
    // 暂停timeline中所有正在播放的视频，避免与detail中的视频同时播放
    pauseTimelineVideos();
    setDetailOpen(true);
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

  const waitMedia = (card, timeout = 3000) => {
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

    const images = card.querySelectorAll("img");
    let allImagesLoaded = true;
    images.forEach((img) => {
      if (!img.complete || img.naturalHeight === 0) {
        allImagesLoaded = false;
      }
    });

    const heights = layout.heights;
    let target = 0;
    for (let i = 1; i < heights.length; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    const x = target * (layout.colWidth + layout.gutter);
    const y = heights[target];
    let h = card.offsetHeight;

    if (!allImagesLoaded) {
      const placeholderHeight = 200;
      h = Math.max(h, placeholderHeight);
    }

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.visibility = "visible";
    heights[target] = y + h + layout.gutter;
    grid.style.height = `${Math.max(...heights)}px`;

    // 为卡片中的视频元素添加可见性观察，滑出视口时自动暂停
    observeVideosInContainer(card);
  };

  const pickAnchor = () => {
    const cards = Array.from(document.querySelectorAll(".tm-card"));
    for (const c of cards) {
      const rect = c.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) return { el: c, top: rect.top };
    }
    return null;
  };

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
  const getCursor = () => cursor;

  /**
   * 设置游标
   * @param {string|null} value
   */
  const setCursor = (value) => {
    cursor = value;
  };

  /**
   * 获取加载状态
   * @returns {boolean}
   */
  const isLoading = () => loading;

  /**
   * 设置加载状态
   * @param {boolean} value
   */
  const setLoading = (value) => {
    loading = value;
  };

  /**
   * 获取结束状态
   * @returns {boolean}
   */
  const isEnded = () => ended;

  /**
   * 设置结束状态
   * @param {boolean} value
   */
  const setEnded = (value) => {
    ended = value;
  };

  /**
   * 检查推文是否已渲染过
   * @param {string} tweetId
   * @returns {boolean}
   */
  const hasSeen = (tweetId) => seen.has(tweetId);

  /**
   * 标记推文为已渲染
   * @param {string} tweetId
   */
  const addSeen = (tweetId) => {
    seen.add(tweetId);
  };

  /**
   * 重置所有状态（用于刷新页面）
   */
  const resetState = () => {
    cursor = null;
    loading = false;
    ended = false;
    seen.clear();
  };

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
  const observeCard = (card) => {
    observer.observe(card);
  };

  /**
   * 获取已查看的推文ID数组（用于发送给API）
   * @returns {string[]}
   */
  const getViewedTweetIds = () => {
    return Array.from(viewed);
  };

  /**
   * 清空已查看的推文记录（发送给API后调用）
   */
  const clearViewed = () => {
    viewed.clear();
  };

  /**
   * 重置所有状态（用于刷新页面）
   * 清理所有计时器防止内存泄漏
   */
  const resetViewed = () => {
    // 清理所有未完成的计时器
    timers.forEach((timerId) => clearTimeout(timerId));
    timers.clear();
    viewed.clear();
  };

  /**
   * 渲染推文列表到网格
   * @param {Array} tweets - 推文数据数组
   * @param {HTMLElement} grid - 网格容器元素
   */
  const renderTweets = async (tweets, grid) => {
    for (const t of tweets) {
      const id = t.rest_id || t.legacy?.id_str;
      if (!id || hasSeen(id)) continue;
      addSeen(id);
      const card = createCard(t, openDetail);
      card.dataset.tweetId = id;
      observeCard(card);
      await placeCard(card, grid);
    }
  };

  /**
   * 加载更多推文
   * @param {HTMLElement} grid - 网格容器元素
   * @param {boolean} reset - 是否重置状态（刷新页面）
   */
  const loadMore = async (grid, reset = false) => {
    if (isLoading() || isEnded() || isDetailOpen()) return;
    const anchor = reset ? null : pickAnchor();
    const startScroll = window.scrollY;
    setLoading(true);
    const loader = document.querySelector(".tm-loader");
    if (loader) loader.textContent = "加载中...";
    try {
      // 获取已查看的推文ID并清空，避免累积
      const seenTweetIds = reset ? [] : getViewedTweetIds();
      if (!reset && seenTweetIds.length > 0) {
        clearViewed();
      }
      const url = buildUrl(reset ? null : getCursor(), seenTweetIds);
      const data = await xhr(url, { headers: buildHeaders() });
      const { tweets, cursor } = extractEntries(data);
      if (tweets.length) await renderTweets(tweets, grid);
      setCursor(cursor || getCursor());
      if (!cursor) {
        setEnded(true);
        if (loader) loader.textContent = "没有更多了";
      } else if (loader) {
        loader.textContent = "下滑加载更多";
      }
    } catch (err) {
      toast(`加载失败: ${err.message || err}`);
    } finally {
      setLoading(false);
      const scrollDelta = Math.abs(window.scrollY - startScroll);
      const movedFar = scrollDelta > 200;
      if (!movedFar && anchor && anchor.el.isConnected) {
        const nowTop = anchor.el.getBoundingClientRect().top;
        const diff = nowTop - anchor.top;
        if (diff !== 0) window.scrollBy({ top: diff, behavior: "auto" });
      }
    }
  };

  /**
   * 挂载应用主体
   */
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
      // 清理视频观察器，避免内存泄漏
      unobserveVideosInContainer(grid);
      resetState();
      resetViewed();
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

  /**
   * 添加悬浮按钮（非Masonry页面）
   */
  const addFloatingButton = () => {
    const btn = document.createElement("div");
    btn.className = "tm-pill";
    btn.textContent = "Home Masonry";
    btn.onclick = () => GM_openInTab(`https://x.com/home?${PARAM_FLAG}=1`, { active: true });
    document.body.appendChild(btn);
  };

  /**
   * 注册Tampermonkey菜单命令
   */
  const ensureMenu = () => {
    GM_registerMenuCommand("Open Home Masonry", () => {
      GM_openInTab(`https://x.com/home?${PARAM_FLAG}=1`, { active: true });
    });
  };

  /**
   * 检查是否应该挂载Masonry应用
   * @returns {boolean}
   */
  const shouldMount = () => {
    const url = new URL(location.href);
    return url.searchParams.has(PARAM_FLAG) || url.hash.includes(PARAM_FLAG);
  };

  const toast = createToast();
  setToast(toast);

  /**
   * 启动应用
   */
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
