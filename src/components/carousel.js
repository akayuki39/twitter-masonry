export const createCarousel = (media, initialIndex = 0) => {
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
