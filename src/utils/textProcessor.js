export const TextProcessor = {
  processors: {
    htmlDecode: (text) => {
      const div = document.createElement('div');
      div.innerHTML = text;
      return div.textContent;
    },
    
    linkify: (text) => {
      return text.replace(/(https?:\/\/[\w./?=&%#-]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    },
    
    mentionify: (text) => {
      return text.replace(/@([\p{L}\p{N}_]{1,15})/gu, '<a href="https://x.com/$1" target="_blank" rel="noopener noreferrer">@$1</a>');
    },
    
    hashtagify: (text) => {
      return text.replace(/#([\p{L}\p{N}_]+)/gu, '<a href="https://x.com/hashtag/$1" target="_blank" rel="noopener noreferrer">#$1</a>');
    }
  },

  process(text, pipeline = ["linkify", "mentionify", "hashtagify"]) {
    let result = text;
    for (const processorName of pipeline) {
      const processor = this.processors[processorName];
      if (typeof processor === "function") {
        result = processor(result);
      }
    }
    return result;
  },

  addProcessor(name, processor) {
    if (typeof processor === "function") {
      this.processors[name] = processor;
    }
  },

  removeProcessor(name) {
    delete this.processors[name];
  }
};

export const processTweetText = (text) => {
  const decodedText = TextProcessor.processors.htmlDecode(text);
  return TextProcessor.process(decodedText);
};