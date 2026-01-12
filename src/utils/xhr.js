import { BEARER_TOKEN } from "../config.js";
import { getCookie } from "./common.js";

export const xhr = (url, { method = "GET", body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      url,
      method,
      data: body,
      headers,
      responseType: "json",
      timeout: 20000,
      withCredentials: true,
      onload: (resp) => {
        if (resp.status >= 200 && resp.status < 300) return resolve(resp.response);
        reject(new Error(`Request failed: ${resp.status} ${resp.statusText}`));
      },
      onerror: (err) => reject(err),
      ontimeout: () => reject(new Error("Request timeout")),
    });
  });

export const buildHeaders = () => {
  const csrf = getCookie("ct0");
  return {
    authorization: BEARER_TOKEN,
    "x-csrf-token": csrf,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": getCookie("auth_token") ? "OAuth2Session" : "none",
    "x-twitter-client-language": "en",
    "user-agent": navigator.userAgent,
    referer: "https://x.com/",
    cookie: document.cookie,
  };
};
