import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

const CHANGELOG = `
  0.1.6 (2026-01-26)
  - 新增entity处理模块：支持正确渲染推文文本中的hashtag、@提及、URL、股票符号等entities
  - 添加 processEntities 函数，根据Twitter API返回的entities数据正确渲染可交互链接
  - 支持 display_text_range 属性，只显示推文的实际显示文本部分
  - 移除旧的 processTweetText 处理方式，改用API提供的entities进行精确渲染
  0.1.5 (2026-01-26)
  - 修复转推（retweet）和引用推文（quote）有时无法显示原推内容的问题
  - 原因：Twitter API 部分响应使用 TweetWithVisibilityResults 包装类型，需要解包后访问
  - 添加 unwrapTweetResult 工具函数统一处理 Tweet 和 TweetWithVisibilityResults 两种类型
  0.1.4 (2026-01-26)
  - 统一图片预览界面的鼠标样式，图片区域也显示放大镜缩小图标
  0.1.3 (2026-01-25)
  - 修复点击detail中的图片打开预览时触发时间线加载新推文的问题
  - 增大预加载范围：IntersectionObserver从1600px提升到3000px，scroll监听从1200px提升到2500px
  - 图片预览现在点击图片本身也能关闭了
  0.1.2 (2025-01-25)
  - Add support for long tweets (note_tweet): Show complete text in detail view, display "Show more" link on homepage for tweets exceeding 140 characters. 
  - 新增长推文（note_tweet）支持：详情页显示完整文字，主页超过140字的推文显示"显示更多"链接
  0.1.1 (2025-01-25)
  - 新增图片全屏预览功能：点击detail卡中的图片可全屏查看，背景虚化，点击外部或按ESC退出
`;

const changelogFormatted = CHANGELOG.trim().replace(/\n/g, "\n//               ");

const userscriptMeta = `// ==UserScript==
// @name         X Home Masonry Timeline V2
// @namespace    https://github.com/akayuki39/twitter-masonry
// @version      ${packageJson.version}
// @description  在浏览器直接把 X/Twitter 主页渲染成瀑布流（类似 Pinterest/小红书），无需自建后端。
// @author       you
// @changelog    ${changelogFormatted}
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

`;

export default {
  input: "src/main.js",
  output: {
    file: "home_timeline_masonry.user.js",
    format: "iife",
    name: "HomeTimelineMasonry",
    strict: false,
    banner: userscriptMeta,
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
  ],
};
