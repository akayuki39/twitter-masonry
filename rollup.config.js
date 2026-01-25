import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

const userscriptMeta = `// ==UserScript==
// @name         X Home Masonry Timeline V2
// @namespace    https://github.com/akayuki39/twitter-masonry
// @version      ${packageJson.version}
// @description  在浏览器直接把 X/Twitter 主页渲染成瀑布流（类似 Pinterest/小红书），无需自建后端。
// @author       you
// @changelog    0.1.2 (2025-01-25)
//               - Add support for long tweets (note_tweet): Show complete text in detail view, display "Show more" link on homepage for tweets exceeding 140 characters. 
//               - 新增长推文（note_tweet）支持：详情页显示完整文字，主页超过140字的推文显示"显示更多"链接
//               0.1.1 (2025-01-25)
//               - 新增图片全屏预览功能：点击detail卡中的图片可全屏查看，背景虚化，点击外部或按ESC退出
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
