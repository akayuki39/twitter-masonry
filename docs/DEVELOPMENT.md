# 开发记录

## 0.1.11 (2026-02-02)

### 核心改动

**1. 状态管理重构**
- 新增 `src/state/timeline.js` - 分页状态、去重
- 新增 `src/state/viewed.js` - 可见性追踪
- `main.js` 精简至 180 行

**2. 可见性检测机制**
- 50% 可见度 + 5秒停留 = 已查看
- 离开视口立即清除计时器
- 发送 seenTweetIds 后立即清空

**3. 时间线重复问题修复**
- 准确的 seenTweetIds 让服务器返回个性化内容

### API 导出

```javascript
// timeline.js
getCursor, setCursor, isLoading, setLoading, isEnded, setEnded
hasSeen, addSeen, resetState

// viewed.js
observeCard, getViewedTweetIds, clearViewed, resetViewed
```

### 内存管理

- Map 存储计时器，便于清理
- 页面刷新时 resetViewed() 清理所有计时器

### 测试要点

1. 停留5秒以上才计入 seenTweetIds
2. 快速滚动不计入
3. 刷新后时间线应有变化
