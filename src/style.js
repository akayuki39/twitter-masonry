export const injectStyles = () => {
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
    .tm-detail-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.65); display: none; align-items: center; justify-content: center; z-index: 99999; overflow: hidden; padding-top: 56px; padding-bottom: 16px; }
    .tm-detail-backdrop.show { display: flex; }
    .tm-detail-modal { position: relative; width: min(1400px, 96vw); height: calc(100vh - 72px); margin: auto; }
    .tm-detail-card { background: #fff; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,0.25); border: none; width: 100%; height: 100%; overflow: hidden; position: relative; box-sizing: border-box; }
    .tm-detail-layout { display: flex; align-items: stretch; height: 100%; width: 100%; }
    .tm-detail-left { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; background: #0b1220; overflow: hidden; }
    .tm-detail-left img, .tm-detail-left video { width: 100%; height: 100%; object-fit: contain; display: block; }
    .tm-detail-left .tm-carousel { width: 100%; height: 100%; border-radius: 0; background: transparent; flex: 1 1 auto; }
    .tm-detail-left .tm-carousel-track { height: 100%; }
    .tm-detail-left .tm-carousel-slide { height: 100%; }
    .tm-detail-left .tm-carousel-slide img, .tm-detail-left .tm-carousel-slide video { width: 100%; height: 100%; max-height: none; object-fit: contain; }
    .tm-detail-card.no-media { width: 680px; max-width: 96vw; margin: 0 auto; }
    .tm-detail-card.no-media .tm-detail-left { display: none; }
    .tm-detail-card.no-media .tm-detail-right { flex: 1 1 100%; width: 100%; max-width: none; margin: 0; }
    .tm-detail-right { flex: 0 0 440px; width: 440px; min-width: 0; display: flex; flex-direction: column; height: 100%; overflow-y: scroll; scrollbar-gutter: stable; }
    .tm-detail-right::-webkit-scrollbar { width: 6px; }
    .tm-detail-right::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.15); border-radius: 3px; }
    .tm-detail-right-top { flex-shrink: 0; }
    @media (max-width: 760px) {
      .tm-detail-modal { width: 96vw; height: auto; max-height: calc(100vh - 72px); }
      .tm-detail-card { height: auto; max-height: calc(100vh - 72px); }
      .tm-detail-layout { flex-direction: column; height: auto; }
      .tm-detail-left, .tm-detail-right { flex: 1 1 100%; width: 100%; height: auto; }
      .tm-detail-right { max-height: none; overflow-y: visible; }
      .tm-detail-left { min-height: 200px; }
      .tm-detail-left img, .tm-detail-left video, .tm-detail-left .tm-carousel-slide img, .tm-detail-left .tm-carousel-slide video { max-height: 60vh; }
      .tm-detail-card.no-media .tm-detail-left { display: none; }
      .tm-detail-card.no-media .tm-detail-right { flex: 1 1 100%; width: 100%; }
    }
    .tm-detail-card::-webkit-scrollbar { width: 0; height: 0; }
    .tm-detail-card { scrollbar-width: none; -ms-overflow-style: none; }
    .tm-replies-header { padding: 14px 20px 10px; font-size: 16px; font-weight: 800; color: #0f172a; border-top: 1px solid rgba(15,23,42,0.06); border-bottom: 1px solid rgba(15,23,42,0.06); position: sticky; top: 0; background: #fff; z-index: 1; }
    .tm-replies-list { padding: 4px 0 12px; }
    .tm-replies-loading { padding: 24px 20px; text-align: center; color: #94a3b8; font-size: 14px; font-weight: 500; }
    .tm-replies-empty { padding: 24px 20px; text-align: center; color: #94a3b8; font-size: 14px; }
    .tm-reply-card { padding: 12px 20px; transition: background 0.12s ease; }
    .tm-reply-card:hover { background: rgba(15,23,42,0.02); }
    .tm-reply-card.tm-reply-nested { padding-left: calc(20px + var(--tm-reply-depth, 0) * 16px); padding-top: 10px; padding-bottom: 10px; }
    .tm-reply-children { border-left: 2px solid rgba(15,23,42,0.08); margin-left: 28px; }
    .tm-reply-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .tm-reply-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .tm-reply-avatar.small { width: 28px; height: 28px; }
    .tm-reply-user { display: flex; flex-direction: column; gap: 1px; line-height: 1.2; flex: 1; min-width: 0; }
    .tm-reply-name { font-weight: 700; color: #0f172a; font-size: 14px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-reply-name:hover { text-decoration: underline; }
    .tm-reply-screen { color: #64748b; font-size: 12px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-reply-time { color: #94a3b8; font-size: 12px; flex-shrink: 0; }
    .tm-reply-text { padding: 4px 0 8px; line-height: 1.6; color: #1f2937; word-break: break-word; font-size: 15px; white-space: pre-wrap; }
    .tm-reply-media { display: grid; gap: 8px; margin-bottom: 8px; max-height: 300px; overflow: hidden; }
    .tm-reply-media img { width: 100%; border-radius: 12px; object-fit: cover; background: linear-gradient(180deg,#f8fafc,#e2e8f0); max-height: 300px; }
    .tm-reply-media video { width: 100%; border-radius: 12px; background: #0b1220; max-height: 300px; }
    .tm-reply-media .tm-carousel-slide img, .tm-reply-media .tm-carousel-slide video { max-height: 300px; }
    .tm-reply-actions { display: flex; align-items: center; gap: 16px; color: #64748b; font-size: 12px; }
    .tm-reply-count { color: #64748b; }
    .tm-detail-card .retweet-info { padding: 14px 20px 0; display: flex; align-items: center; gap: 6px; color: rgb(83, 100, 113); font-size: 13px; font-weight: 600; }
    .tm-detail-card .retweet-info svg { flex-shrink: 0; }
    .tm-detail-card .retweet-info a { color: inherit; text-decoration: none; transition: text-decoration 0.12s ease; }
    .tm-detail-card .retweet-info a:hover { text-decoration: underline; }
    .tm-detail-card .meta { padding: 16px 20px 0; display: flex; justify-content: space-between; gap: 14px; align-items: center; }
    .tm-detail-card .meta .user { font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 12px; min-width: 0; }
    .tm-detail-card .meta .user img { flex-shrink: 0; box-shadow: 0 6px 16px rgba(15,23,42,0.12); width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .tm-detail-card .meta .user .info { display: flex; flex-direction: column; gap: 3px; line-height: 1.25; min-width: 0; flex: 1; }
    .tm-detail-card .meta .user .name { font-weight: 800; color: #0f172a; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-detail-card .meta .user .screen { color: #64748b; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-detail-card .meta .time { color: #94a3b8; font-size: 12px; }
    .tm-detail-card .text { padding: 10px 20px 16px; line-height: 1.7; color: #1f2937; word-break: break-word; font-size: 16px; white-space: pre-wrap; }
    .tm-detail-card .actions { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px 14px; color: #64748b; font-size: 13px; border-top: 1px solid rgba(15,23,42,0.06); }
    .tm-detail-close { display: none; }
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
    .tm-card.no-text .media { padding-top: 14px; }
    .tm-image-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 999999; cursor: zoom-out; opacity: 0; transition: opacity 0.2s ease; }
    .tm-image-backdrop.show { display: flex; opacity: 1; }
    .tm-image-modal { position: relative; max-width: 95vw; max-height: 95vh; display: flex; align-items: center; justify-content: center; }
    .tm-preview-image { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 12px; box-shadow: 0 32px 80px rgba(0,0,0,0.4); cursor: zoom-out; transform: scale(0.9); transition: transform 0.15s ease; }
    .tm-image-backdrop.show .tm-preview-image { transform: scale(1); }
    .tm-preview-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%; border: none; background: rgba(15,23,42,0.65); color: #fff; cursor: pointer; display: grid; place-items: center; font-size: 22px; font-weight: 700; box-shadow: 0 10px 26px rgba(0,0,0,0.35); opacity: 0.6; transition: opacity 0.15s ease, background 0.15s ease; z-index: 2; }
    .tm-preview-arrow:hover:not(:disabled) { opacity: 1; background: rgba(15,23,42,0.8); }
    .tm-preview-arrow:disabled { opacity: 0; cursor: not-allowed; }
    .tm-preview-arrow.prev { left: 16px; }
    .tm-preview-arrow.next { right: 16px; }
    .tm-preview-counter { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); padding: 4px 12px; border-radius: 999px; background: rgba(15,23,42,0.6); color: #fff; font-size: 13px; font-weight: 500; pointer-events: none; z-index: 2; }
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
