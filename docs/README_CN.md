# X/Twitter 主页瀑布流布局

一个零后端的浏览器用户脚本，将 X/Twitter 主页时间线改造成瀑布流布局（类似 Pinterest/小红书）。

[English](../README.md) | 简体中文

## 功能特性

- **瀑布流布局**：将传统的单列时间线改为多列瀑布流展示，更高效地浏览内容
- **无限滚动**：自动加载更多推文，无需手动翻页
- **完整媒体展示**：支持图片、视频等多媒体内容
- **完整信息**：显示头像、用户名、推文文本、点赞数、转推数等
- **快速访问**：提供「在 X 打开」链接，快速跳转到原始推文
- **自动更新**：脚本配置了自动更新功能
- **零后端**：直接调用 X GraphQL 接口，无需自建服务器

## 安装步骤

1. **安装 Tampermonkey 扩展**

   - Chrome/Edge: [Tampermonkey](https://www.tampermonkey.net/)
   - Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - 其他兼容的用户脚本管理器也可以

2. **安装脚本**

   - 点击下方链接一键安装：
     - [点击安装 X Home Masonry Timeline](https://raw.githubusercontent.com/akayuki39/twitter-masonry/main/home_timeline_masonry.user.js)
   - 或者在 Tampermonkey 中点击「新建脚本」，将仓库的 `home_timeline_masonry.user.js` 内容粘贴进去并保存

3. **使用脚本**

   - 打开 [https://x.com/home?tm-masonry=1](https://x.com/home?tm-masonry=1) 或 [https://twitter.com/home?tm-masonry=1](https://twitter.com/home?tm-masonry=1)
   - 或者先访问 [https://x.com/](https://x.com/)，页面右下角会出现「Home 瀑布流」按钮，点击即可在新标签页中打开瀑布流视图

## 使用说明

### 启动方式

- **URL 参数方式**：在 X 首页 URL 后添加 `?tm-masonry=1` 参数
- **按钮方式**：在 X 主页点击右下角的「Home 瀑布流」按钮

### 浏览内容

- 向下滚动自动加载更多推文
- 点击图片可以查看大图
- 点击用户名可以跳转到用户主页
- 点击「在 X 打开」可以在新标签页查看原始推文

## 常见问题

**Q: 脚本不工作怎么办？**

A: 请确保：
- 已登录 X 账号
- 浏览器已安装 Tampermonkey 并启用了此脚本
- 重新登录 X 后刷新页面

**Q: 显示 401 错误？**

A: 通常是 cookie 失效，重新登录 X 后刷新瀑布流页面即可。

**Q: 如何更新脚本？**

A: 脚本已配置自动更新，Tampermonkey 会定期检查并自动更新到最新版本。你也可以手动重新安装。

**Q: 支持哪些浏览器？**

A: 支持 Google Chrome、Microsoft Edge、Firefox、Safari 以及其他支持 Tampermonkey 的浏览器。

## 技术细节

- 直接调用 X GraphQL `HomeTimeline` 接口
- 使用你登录时的 cookie 和官方 bearer token
- 使用 Tampermonkey 的跨域能力发送请求
- 自动处理 CORS 和鉴权问题

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](../LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [GitHub 仓库](https://github.com/akayuki39/twitter-masonry)
- [Tampermonkey 官网](https://www.tampermonkey.net/)
