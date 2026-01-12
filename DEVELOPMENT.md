# Home Timeline Masonry - Userscript Development Setup

## 项目结构

```
twitter-ui/
├── src/
│   ├── api/              # API 调用相关
│   │   ├── interaction.js  # 点赞/取消点赞 API
│   │   └── timeline.js     # 时间线数据获取
│   ├── components/       # UI 组件
│   │   ├── card.js         # 卡片组件
│   │   ├── carousel.js     # 轮播组件
│   │   ├── detail.js       # 详情弹窗
│   │   ├── likeButton.js   # 点赞按钮
│   │   └── toast.js        # 提示消息
│   ├── utils/            # 工具函数
│   │   ├── common.js       # 通用工具 (sleep, getCookie)
│   │   ├── format.js       # 格式化 (escapeHTML, linkify, formatTime)
│   │   ├── tweet.js        # Tweet 相关 (pickMedia)
│   │   └── xhr.js          # HTTP 请求
│   ├── config.js         # 配置常量 (API, FEATURES, etc.)
│   ├── main.js           # 主入口
│   ├── masonry.js        # 瀑布流布局
│   └── style.js          # 样式注入
├── package.json
├── rollup.config.js
└── home_timeline_masonry.user.js  # 构建输出
```

## 开发

### 安装依赖

首先需要安装 Node.js 和 npm：

```bash
# macOS
brew install node

# 或访问 https://nodejs.org/ 下载安装
```

然后安装项目依赖：

```bash
npm install
```

### 构建脚本

```bash
# 构建
npm run build

# 监听模式（自动重新构建）
npm run watch

# 开发模式
npm run dev
```

### 工作流程

1. **修改代码**：在 `src/` 目录下修改对应模块
2. **自动构建**：运行 `npm run watch` 会自动监听文件变化并重新构建
3. **测试**：将 `home_timeline_masonry.user.js` 安装到油猴扩展中测试

## 模块说明

### config.js
- API 端点配置
- Twitter API features 和 field toggles
- 布局配置
- 参数标志

### utils/
- `common.js`: 基础工具函数
- `format.js`: HTML 转义、链接化、时间格式化
- `tweet.js`: 媒体提取
- `xhr.js`: HTTP 请求封装

### api/
- `timeline.js`: 时间线数据获取和解析
- `interaction.js`: 点赞/取消点赞 API

### components/
- `card.js`: 推文卡片组件
- `carousel.js`: 媒体轮播组件
- `detail.js`: 详情弹窗组件
- `likeButton.js`: 点赞按钮组件
- `toast.js`: 提示消息组件

### masonry.js
- 瀑布流布局计算
- 卡片放置
- 滚动锚点处理

### main.js
- 应用初始化
- 状态管理
- 事件绑定

## 维护优势

1. **模块化**：每个模块职责单一，易于理解和修改
2. **可复用**：工具函数和组件可以在多处复用
3. **易于调试**：问题可以快速定位到具体模块
4. **类型安全**：可以轻松添加 TypeScript 支持
5. **测试友好**：模块化结构便于单元测试

## 从旧版本迁移

原始的单文件版本已备份在项目中。新版本功能完全一致，只是代码组织更清晰。

如需回退到单文件版本，直接使用 `home_timeline_masonry.user.js` 即可。
