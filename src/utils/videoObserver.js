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
export const observeVideo = (video) => {
  if (!video || video.tagName !== "VIDEO") return;
  const observer = getVideoObserver();
  observer.observe(video);
};

/**
 * 观察容器中所有视频元素
 * @param {HTMLElement} container - 容器元素
 */
export const observeVideosInContainer = (container) => {
  if (!container) return;
  const videos = container.querySelectorAll("video");
  videos.forEach((video) => observeVideo(video));
};

/**
 * 停止观察视频元素
 * @param {HTMLVideoElement} video - 视频元素
 */
export const unobserveVideo = (video) => {
  if (!video || !videoObserver) return;
  videoObserver.unobserve(video);
};

/**
 * 停止观察容器中所有视频元素
 * @param {HTMLElement} container - 容器元素
 */
export const unobserveVideosInContainer = (container) => {
  if (!container || !videoObserver) return;
  const videos = container.querySelectorAll("video");
  videos.forEach((video) => videoObserver.unobserve(video));
};

/**
 * 暂停指定容器内的所有视频
 * @param {HTMLElement} container - 容器元素
 */
export const pauseVideosInContainer = (container) => {
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
export const pauseTimelineVideos = () => {
  const timelineContainer = document.querySelector(".tm-grid");
  if (timelineContainer) {
    pauseVideosInContainer(timelineContainer);
  }
};
