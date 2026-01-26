import { escapeHTML } from "./format.js";

const htmlDecode = (text) => {
  if (!text) return text;
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || div.innerText || '';
};

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

export const createHashtag = (hashtag) => {
  const { text } = hashtag;
  return createEntityLink(`#${text}`, `https://x.com/hashtag/${encodeURIComponent(text)}`);
};

export const createUserMention = (mention) => {
  const { screen_name, name } = mention;
  const link = createEntityLink(`@${screen_name}`, `https://x.com/${screen_name}`);
  if (name) {
    link.title = htmlDecode(name);
  }
  return link;
};

export const createUrl = (urlEntity) => {
  const { display_url, expanded_url, url } = urlEntity;
  return createEntityLink(display_url, expanded_url);
};

export const createSymbol = (symbol) => {
  const { text } = symbol;
  return createEntityLink(`$${text}`, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
};

export const createTimestamp = (timestamp) => {
  const { text } = timestamp;
  return createEntityLink(text, `https://x.com/search?q=%24${encodeURIComponent(text)}`);
};

export const processEntities = (text, entitiesArg = null, displayTextRange = null) => {
  const container = document.createElement('span');

  if (!text) {
    return container;
  }

  const entities = entitiesArg || {};
  const {hashtags = [], user_mentions = [], urls = [], symbols = [], timestamps = []} = entities;
  const hasEntities = hashtags.length > 0 || user_mentions.length > 0 || urls.length > 0 || symbols.length > 0 || timestamps.length > 0;

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

  const hasValidEntities = hasEntities && allEntities.length > 0;

  if (!hasValidEntities) {
    const decodedText = htmlDecode(text);

    const mentionRegex = /@([\p{L}\p{N}_]{1,15})/gu;
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const urlRegex = /(https?:\/\/[\w./?=&%#-]+)/g;

    const allMatches = [];

    const patterns = [
      { regex: mentionRegex, type: 'mention' },
      { regex: hashtagRegex, type: 'hashtag' },
      { regex: urlRegex, type: 'url' }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      let regexCopy = new RegExp(regex);
      while ((match = regexCopy.exec(decodedText)) !== null) {
        allMatches.push({
          start: match.index,
          end: regexCopy.lastIndex,
          match: match[0],
          type: type
        });
      }
    });

    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;

    for (const { start, end, match, type } of allMatches) {
      if (start < lastIndex) continue;
      if (start >= decodedText.length) break;

      if (start > lastIndex) {
        const plainText = decodedText.slice(lastIndex, start);
        container.appendChild(document.createTextNode(plainText));
      }

      switch (type) {
        case 'mention':
          const screenName = match.slice(1);
          container.appendChild(createEntityLink(match, `https://x.com/${screenName}`));
          break;
        case 'hashtag':
          const hashtag = match.slice(1);
          container.appendChild(createEntityLink(match, `https://x.com/hashtag/${encodeURIComponent(hashtag)}`));
          break;
        case 'url':
          container.appendChild(createEntityLink(match, match));
          break;
      }

      lastIndex = end;
    }

    if (lastIndex < decodedText.length) {
      const plainText = decodedText.slice(lastIndex);
      container.appendChild(document.createTextNode(plainText));
    }

    return container;
  }

  const chars = Array.from(text);
  const length = chars.length;

  let currentIndex = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
    ? displayTextRange[0]
    : 0;

  const finalEndIndex = displayTextRange && Array.isArray(displayTextRange) && displayTextRange.length === 2
    ? displayTextRange[1]
    : length;

  for (const entity of allEntities) {
    const [startIndex, endIndex] = entity.indices;

    if (startIndex < currentIndex) {
      continue;
    }

    if (startIndex >= finalEndIndex) {
      break;
    }

    if (startIndex > currentIndex) {
      const rawChars = chars.slice(currentIndex, startIndex);
      const rawText = rawChars.join('');
      const decodedText = htmlDecode(rawText);
      container.appendChild(document.createTextNode(decodedText));
    }

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

    currentIndex = endIndex;
  }

  if (currentIndex < finalEndIndex) {
    const rawChars = chars.slice(currentIndex, finalEndIndex);
    const rawText = rawChars.join('');
    const decodedText = htmlDecode(rawText);
    container.appendChild(document.createTextNode(decodedText));
  }

  return container;
};
