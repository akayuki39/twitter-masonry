import { API_ENDPOINTS } from "../config.js";
import { xhr, buildHeaders } from "../utils/xhr.js";

export const favoriteTweet = async (tweetId) => {
  const body = JSON.stringify({
    variables: { tweet_id: String(tweetId) },
    queryId: "lI07N6Otwv1PhnEgXILM7A",
    features: {},
  });
  return xhr(API_ENDPOINTS.FAVORITE_TWEET, {
    method: "POST",
    body,
    headers: { ...buildHeaders(), "content-type": "application/json" },
  });
};

export const unfavoriteTweet = async (tweetId) => {
  const body = JSON.stringify({
    variables: { tweet_id: String(tweetId) },
    queryId: "ZYKSe-w7KEslx3JhSIk5LA",
    features: {},
  });
  return xhr(API_ENDPOINTS.UNFAVORITE_TWEET, {
    method: "POST",
    body,
    headers: { ...buildHeaders(), "content-type": "application/json" },
  });
};
