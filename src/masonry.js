import { LAYOUT_CONFIG } from "./config.js";

const layout = {
  colWidth: LAYOUT_CONFIG.colWidth,
  gutter: LAYOUT_CONFIG.gutter,
  cols: 0,
  heights: [],
  initialized: false,
};

export const ensureLayout = (grid) => {
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

export const resetLayout = () => {
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

export const placeCard = async (card, grid) => {
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

export const pickAnchor = () => {
  const cards = Array.from(document.querySelectorAll(".tm-card"));
  for (const c of cards) {
    const rect = c.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) return { el: c, top: rect.top };
  }
  return null;
};
