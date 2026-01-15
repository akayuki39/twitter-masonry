import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const userscriptMeta = `// ==UserScript==
// @name         X Home Masonry Timeline V2
// @namespace    https://github.com/akayuki39/twitter-masonry
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
