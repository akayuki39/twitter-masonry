export const injectStyles = () => {
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
