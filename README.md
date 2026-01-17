# Home Timeline Masonry (Tampermonkey)

一个零后端的浏览器端脚本，把 X/Twitter 主页时间线改造成瀑布流（类似 Pinterest/小红书）。

## 使用步骤
1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（或兼容的用户脚本管理器）。
2. 点击下面的链接一键安装脚本：
   - [点击安装 X Home Masonry Timeline V2](https://raw.githubusercontent.com/akayuki39/twitter-masonry/main/home_timeline_masonry.user.js)
   - 或者：在 Tampermonkey 中「新建脚本」，将本仓库的 `home_timeline_masonry.user.js` 全部内容粘贴进去并保存。
3. 打开 `https://x.com/home?tm-masonry=1`（或 `https://twitter.com/home?tm-masonry=1`），脚本会把页面替换成新的瀑布流 UI。
   - 也可以先随便打开 `https://x.com/`，界面右下角会出现「Home 瀑布流」按钮，点一下即可在新标签打开。

## 自动更新
- 脚本已配置自动更新功能，Tampermonkey 会定期检查并自动更新到最新版本。

## 主要功能
- 直接调用 X GraphQL `HomeTimeline` 接口（使用你的登录 cookie + 官方 bearer token），无需自建服务器。
- 使用 Tampermonkey 的跨域能力发请求，自动带上 cookie 与 `ct0`，避免 CORS/鉴权问题。
- Masonry 瀑布流布局，卡片含头像、文本、图片/视频、点赞/转推数，以及「在 X 打开」快捷入口。
- 无限下拉自动翻页。

## 小贴士
- 需要你已登录 X 并且 cookie 可用（包含 `ct0`、`auth_token` 等）。
- 如果遇到未加载或 401，多半是 cookie 失效；重新登录 X 后刷新瀑布流页面即可。
- 脚本使用的 `queryId` 与 `features` 写在 `src/config.js` 中，如官方接口更新，可按需替换。
