import { escapeHTML, formatNumber } from "../utils/format.js";
import { getHighResAvatar } from "../utils/tweet.js";
import { processText } from "../utils/entity.js";

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

export const createProfileCard = (userData) => {
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

export const attachProfileCardHover = (element, userData) => {
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
