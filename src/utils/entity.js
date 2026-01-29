/**
 * Twitter 文本实体处理模块
 * 
 * 处理推文文本中的各种实体（hashtag、mention、URL、symbol 等），
 * 支持显示范围截断（displayTextRange），考虑 Unicode code points（emoji）
 * 正确索引，渲染为 DOM 元素。
 * 
 * 主要函数：
 * - processText(): 主入口，处理文本并返回 DOM 元素
 */

import { escapeHTML } from "./format.js";

/**
 * HTML 解码
 * @param {string} text - 编码的 HTML 文本
 * @returns {string|null} 解码后的文本
 */
const htmlDecode = (text) => {
  if (!text) return text;
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || div.innerText || '';
};

/**
 * 创建实体链接元素
 * @param {string} text - 链接文本
 * @param {string} url - 链接地址
 * @param {boolean} [isExternal=true] - 是否外部链接（添加 target="_blank"）
 * @returns {HTMLAnchorElement} 链接元素
 */
export const createEntityLink = (text, url, isExternal = true) => {
  const link = document.createElement('a');
  link.href = url;
  link.textContent = text;
  if (isExternal) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
};

/**
 * 创建 hashtag 元素
 * @param {Object} hashtag - hashtag 数据（包含 text 字段）
 * @returns {HTMLAnchorElement} hashtag 链接元素
 */
export const createHashtag = (hashtag) => {
  const { text } = hashtag;
  return createEntityLink(`#${text}`, `https://x.com/hashtag/${encodeURIComponent(text)}`);
};

/**
 * 创建用户提及元素
 * @param {Object} mention - mention 数据（包含 screen_name 和 name 字段）
 * @returns {HTMLAnchorElement} mention 链接元素
 */
export const createUserMention = (mention) => {
  const { screen_name, name } = mention;
  const link = createEntityLink(`@${screen_name}`, `https://x.com/${screen_name}`);
  if (name) {
    link.title = htmlDecode(name);
  }
  return link;
};

/**
 * 创建 URL 元素
 * @param {Object} urlEntity - URL 数据（包含 display_url 和 expanded_url 字段）
 * @returns {HTMLAnchorElement} URL 链接元素
 */
export const createUrl = (urlEntity) => {
  const { display_url, expanded_url } = urlEntity;
  return createEntityLink(display_url, expanded_url);
};

/**
 * 创建 symbol 元素（如 $TSLA）
 * @param {Object} symbol - symbol 数据（包含 text 字段）
 * @returns {HTMLAnchorElement} symbol 链接元素
 */
export const createSymbol = (symbol) => {
  const { text } = symbol;
  return createEntityLink(`$${text}`, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
};

/**
 * 创建时间戳元素
 * @param {Object} timestamp - 时间戳数据（包含 text 字段）
 * @returns {HTMLAnchorElement} 时间戳链接元素
 */
export const createTimestamp = (timestamp) => {
  const { text } = timestamp;
  return createEntityLink(text, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
};

/**
 * 解析显示范围
 * @param {number[]|null} displayTextRange - 显示范围数组 [start, end]
 * @param {number} textLength - 文本总长度
 * @returns {number[]} 范围 [start, end]
 */
const parseRange = (displayTextRange, textLength) => {
  const start = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
    ? displayTextRange[0]
    : 0;
  const end = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
    ? displayTextRange[1]
    : textLength;
  return [start, end];
};

/**
 * 从文本中提取实体（正则匹配）
 * 当 Twitter API 没有提供 entities 数据时使用
 * @param {string} text - 文本内容
 * @returns {Array} 实体数组（包含 type、indices、data 字段）
 */
const extractEntitiesFromText = (text) => {
  const decodedText = htmlDecode(text);
  const mentionRegex = /@([\p{L}\p{N}_]{1,15})/gu;
  const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
  const urlRegex = /(https?:\/\/[\w./?=&%#-]+)/g;

  const allMatches = [];
  const patterns = [
    { regex: mentionRegex, type: 'user_mention' },
    { regex: hashtagRegex, type: 'hashtag' },
    { regex: urlRegex, type: 'url' }
  ];

  patterns.forEach(({ regex, type }) => {
    let match;
    const regexCopy = new RegExp(regex);
    while ((match = regexCopy.exec(decodedText)) !== null) {
      const rawStart = match.index;
      const rawEnd = regexCopy.lastIndex;
      
      if (type === 'user_mention') {
        const screenName = match[1];
        allMatches.push({
          type,
          indices: [rawStart, rawEnd],
          data: { screen_name: screenName, name: null }
        });
      } else if (type === 'hashtag') {
        const hashtagText = match[1];
        allMatches.push({
          type,
          indices: [rawStart, rawEnd],
          data: { text: hashtagText }
        });
      } else if (type === 'url') {
        allMatches.push({
          type,
          indices: [rawStart, rawEnd],
          data: { display_url: match[0], expanded_url: match[0] }
        });
      }
    }
  });

  allMatches.sort((a, b) => a.indices[0] - b.indices[0]);
  return allMatches;
};

/**
 * 标准化 Twitter API 实体格式
 * @param {Object} entities - Twitter API 实体对象（包含 hashtags、user_mentions、urls 等）
 * @returns {Array} 标准化后的实体数组
 */
const normalizeEntities = (entities) => {
  const { hashtags = [], user_mentions = [], urls = [], symbols = [], timestamps = [] } = entities || {};

  const allEntities = [];

  [...hashtags, ...user_mentions, ...urls, ...symbols, ...timestamps].forEach((entity) => {
    if (!entity.indices || !Array.isArray(entity.indices) || entity.indices.length !== 2) {
      return;
    }

    allEntities.push({
      type: entity.text ? 'hashtag' : entity.screen_name ? 'user_mention' : entity.display_url ? 'url' : entity.url ? 'media_url' : 'symbol',
      indices: entity.indices,
      data: entity
    });
  });

  allEntities.sort((a, b) => a.indices[0] - b.indices[0]);
  return allEntities;
};

/**
 * 渲染单个实体到容器
 * @param {Object} entity - 实体对象（包含 type 和 data 字段）
 * @param {HTMLElement} container - DOM 容器
 */
const renderEntity = (entity, container) => {
  switch (entity.type) {
    case 'hashtag':
      container.appendChild(createHashtag(entity.data));
      break;
    case 'user_mention':
      container.appendChild(createUserMention(entity.data));
      break;
    case 'url':
      container.appendChild(createUrl(entity.data));
      break;
    case 'symbol':
      container.appendChild(createSymbol(entity.data));
      break;
    case 'timestamp':
      container.appendChild(createTimestamp(entity.data));
      break;
  }
};

/**
 * 按 index 渲染文本和实体
 * @param {string[]} chars - 文本的 code points 数组
 * @param {Array} entities - 实体数组
 * @param {number} start - 起始索引
 * @param {number} end - 结束索引
 * @returns {HTMLSpanElement} 渲染后的 DOM 元素
 */
const renderWithIndex = (chars, entities, start, end) => {
  const container = document.createElement('span');
  let currentIndex = start;

  for (const entity of entities) {
    const [entityStart, entityEnd] = entity.indices;

    if (entityStart < currentIndex) {
      continue;
    }

    if (entityStart >= end) {
      break;
    }

    if (entityStart > currentIndex) {
      const rawChars = chars.slice(currentIndex, entityStart);
      const rawText = rawChars.join('');
      const decodedText = htmlDecode(rawText);
      container.appendChild(document.createTextNode(decodedText));
    }

    renderEntity(entity, container);
    currentIndex = entityEnd;
  }

  if (currentIndex < end) {
    const rawChars = chars.slice(currentIndex, end);
    const rawText = rawChars.join('');
    const decodedText = htmlDecode(rawText);
    container.appendChild(document.createTextNode(decodedText));
  }

  return container;
};

/**
 * 处理推文文本并渲染为 DOM
 * 
 * 主要逻辑：
 * 1. 使用 Array.from() 将文本转为 code points 数组（正确处理 emoji）
 * 2. 应用 displayTextRange 截断
 * 3. 如果有 entitiesArg，使用 Twitter API 提供的实体数据
 * 4. 否则，用正则从文本中提取实体
 * 5. 按 index 渲染文本和实体链接
 * 
 * @param {string} text - 原始文本
 * @param {Object|null} [entitiesArg=null] - Twitter API 实体对象（可选）
 * @param {number[]|null} [displayTextRange=null] - 显示范围 [start, end]（可选）
 * @returns {HTMLSpanElement} 渲染后的 DOM 元素
 * 
 * @example
 * const text = "Hello @user! Check #tag and https://example.com";
 * const result = processText(text, null, [0, text.length]);
 * document.body.appendChild(result);
 */
export const processText = (text, entitiesArg = null, displayTextRange = null) => {
  const container = document.createElement('span');

  if (!text) {
    return container;
  }

  const chars = Array.from(text);
  const length = chars.length;
  const [start, end] = parseRange(displayTextRange, length);

  const normalizedEntities = entitiesArg && Object.keys(entitiesArg).length > 0
    ? normalizeEntities(entitiesArg)
    : extractEntitiesFromText(chars.slice(start, end).join(''));

  return renderWithIndex(chars, normalizedEntities, start, end);
};
