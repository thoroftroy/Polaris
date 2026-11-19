/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 26:
/***/ ((module) => {

const LIKED_STATE = "LIKED_STATE";
const DISLIKED_STATE = "DISLIKED_STATE";
const NEUTRAL_STATE = "NEUTRAL_STATE";

const LIKE_ACTION = "like";
const DISLIKE_ACTION = "dislike";

const TRANSITIONS = {
  [NEUTRAL_STATE]: {
    [LIKE_ACTION]: { nextState: LIKED_STATE, value: 1, likesDelta: 1, dislikesDelta: 0 },
    [DISLIKE_ACTION]: { nextState: DISLIKED_STATE, value: -1, likesDelta: 0, dislikesDelta: 1 },
  },
  [LIKED_STATE]: {
    [LIKE_ACTION]: { nextState: NEUTRAL_STATE, value: 0, likesDelta: -1, dislikesDelta: 0 },
    [DISLIKE_ACTION]: { nextState: DISLIKED_STATE, value: -1, likesDelta: -1, dislikesDelta: 1 },
  },
  [DISLIKED_STATE]: {
    [LIKE_ACTION]: { nextState: LIKED_STATE, value: 1, likesDelta: 1, dislikesDelta: -1 },
    [DISLIKE_ACTION]: { nextState: NEUTRAL_STATE, value: 0, likesDelta: 0, dislikesDelta: -1 },
  },
};

function resolveVoteTransition(previousState, action) {
  const transition = TRANSITIONS[previousState]?.[action];
  if (!transition) {
    throw new TypeError(`Unsupported vote transition: ${previousState} -> ${action}`);
  }
  return { ...transition };
}

function applyVoteTransitionCounts(likes, dislikes, transition) {
  if (!transition || !Number.isFinite(transition.likesDelta) || !Number.isFinite(transition.dislikesDelta)) {
    throw new TypeError("A valid vote transition is required");
  }

  const normalizedLikes = Number.isFinite(likes) ? likes : 0;
  const normalizedDislikes = Number.isFinite(dislikes) ? dislikes : 0;
  return {
    likes: Math.max(0, normalizedLikes + transition.likesDelta),
    dislikes: Math.max(0, normalizedDislikes + transition.dislikesDelta),
  };
}

function shouldSubmitVote({ disableVoteSubmission = false, signedOut = false } = {}) {
  return disableVoteSubmission !== true && signedOut !== true;
}

module.exports = {
  DISLIKED_STATE,
  DISLIKE_ACTION,
  LIKED_STATE,
  LIKE_ACTION,
  NEUTRAL_STATE,
  applyVoteTransitionCounts,
  resolveVoteTransition,
  shouldSubmitVote,
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./Extensions/combined/src/config.js
const PROD_API_URL = "https://returnyoutubedislikeapi.com";
const DEV_API_URL = PROD_API_URL;

const runtime = typeof chrome !== "undefined" ? chrome.runtime : null;
const manifest = typeof runtime?.getManifest === "function" ? runtime.getManifest() : null;
const isDevelopment = !manifest || !("update_url" in manifest);

const extensionChangelogUrl =
  runtime && typeof runtime.getURL === "function"
    ? runtime.getURL("changelog/4/changelog_4.1.html")
    : "https://returnyoutubedislike.com/changelog/4/changelog_4.1.html";

const config = {
  apiUrl: isDevelopment ? DEV_API_URL : PROD_API_URL,

  voteDisabledIconName: "icon_hold128.png",
  defaultIconName: "icon128.png",

  reviewPromptEnabled: false,

  links: {
    website: "https://returnyoutubedislike.com",
    github: "https://github.com/Anarios/return-youtube-dislike",
    discord: "https://discord.gg/mYnESY4Md5",
    donate: "https://returnyoutubedislike.com/donate",
    faq: "https://returnyoutubedislike.com/faq",
    help: "https://returnyoutubedislike.com/help",
    changelog: extensionChangelogUrl,
  },

  defaultExtConfig: {
    disableVoteSubmission: false,
    disableLogging: true,
    coloredThumbs: false,
    coloredBar: false,
    colorTheme: "classic",
    numberDisplayFormat: "compactShort",
    numberDisplayReformatLikes: false,
    hidePremiumTeaser: false,
    hideClutterButtons: false,
  },
};

function getApiUrl() {
  return config.apiUrl;
}

function getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



;// CONCATENATED MODULE: ./Extensions/common/vote-client.js
const DEFAULT_API_BASE_URL = "https://returnyoutubedislikeapi.com";
const USER_ID_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const VALID_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const VALID_VOTE_VALUES = new Set([-1, 0, 1]);

class VoteClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "VoteClientError";
    this.status = options.status;
    this.cause = options.cause;
  }
}

function countLeadingZeroes(bytes, limit = Infinity) {
  let zeroes = 0;

  for (const originalValue of bytes) {
    let value = originalValue;
    if (value === 0) {
      zeroes += 8;
    } else {
      let count = 1;
      if (value >>> 4 === 0) {
        count += 4;
        value <<= 4;
      }
      if (value >>> 6 === 0) {
        count += 2;
        value <<= 2;
      }
      zeroes += count - (value >>> 7);
      break;
    }

    if (zeroes >= limit) break;
  }

  return zeroes;
}

function generateUserId(cryptoImpl = globalThis.crypto, length = 36) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError("User ID length must be a positive integer");
  }
  if (!cryptoImpl?.getRandomValues) {
    throw new VoteClientError("Web Crypto random generation is unavailable");
  }

  const values = new Uint32Array(length);
  cryptoImpl.getRandomValues(values);
  let result = "";
  for (const value of values) {
    result += USER_ID_CHARSET[value % USER_ID_CHARSET.length];
  }
  return result;
}

function decodeBase64(value) {
  if (typeof atob !== "function") {
    throw new VoteClientError("Base64 decoding is unavailable");
  }
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function encodeBase64(bytes) {
  if (typeof btoa !== "function") {
    throw new VoteClientError("Base64 encoding is unavailable");
  }
  return btoa(String.fromCharCode(...bytes));
}

async function solvePuzzle(puzzle, cryptoImpl = globalThis.crypto, maxAttempts) {
  if (!puzzle || typeof puzzle.challenge !== "string" || !Number.isInteger(puzzle.difficulty)) {
    throw new VoteClientError("The API returned an invalid puzzle");
  }
  if (!cryptoImpl?.subtle?.digest) {
    throw new VoteClientError("Web Crypto hashing is unavailable");
  }

  const challenge = decodeBase64(puzzle.challenge);
  if (challenge.length !== 16) {
    throw new VoteClientError("The API returned an invalid puzzle challenge");
  }

  const attempts = maxAttempts ?? Math.pow(2, puzzle.difficulty) * 3;
  if (!Number.isSafeInteger(attempts) || attempts <= 0) {
    throw new VoteClientError("The puzzle attempt limit is invalid");
  }

  const buffer = new ArrayBuffer(20);
  const byteView = new Uint8Array(buffer);
  const integerView = new Uint32Array(buffer);
  byteView.set(challenge, 4);

  for (let counter = 0; counter < attempts; counter++) {
    integerView[0] = counter;
    const hash = await cryptoImpl.subtle.digest("SHA-512", buffer);
    if (countLeadingZeroes(new Uint8Array(hash), puzzle.difficulty) >= puzzle.difficulty) {
      return { solution: encodeBase64(byteView.slice(0, 4)) };
    }
  }

  return null;
}

function isConfirmedCredential(value) {
  return Boolean(value?.userId && value.registrationConfirmed === true);
}

function createVoteClient({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  fetchImpl = globalThis.fetch?.bind(globalThis),
  credentialStore,
  cryptoImpl = globalThis.crypto,
  puzzleAttempts = 2,
  votePuzzleAttempts = 3,
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required");
  if (!credentialStore?.load || !credentialStore?.save || !credentialStore?.clear) {
    throw new TypeError("credentialStore must provide load, save, and clear");
  }
  if (!Number.isInteger(puzzleAttempts) || puzzleAttempts <= 0) {
    throw new TypeError("puzzleAttempts must be a positive integer");
  }
  if (!Number.isInteger(votePuzzleAttempts) || votePuzzleAttempts <= 0) {
    throw new TypeError("votePuzzleAttempts must be a positive integer");
  }

  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  const voteQueues = new Map();
  let registrationPromise = null;
  let registrationIsForced = false;

  async function readJson(response, operation) {
    try {
      return await response.json();
    } catch (error) {
      throw new VoteClientError(`${operation} returned invalid JSON`, { status: response.status, cause: error });
    }
  }

  function isSuccessful(response) {
    if (typeof response.ok === "boolean") return response.ok;
    return response.status >= 200 && response.status < 300;
  }

  async function request(path, options, operation) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, options);
    } catch (error) {
      throw new VoteClientError(`${operation} request failed`, { cause: error });
    }

    if (!response || !Number.isInteger(response.status)) {
      throw new VoteClientError(`${operation} returned an invalid response`);
    }
    return response;
  }

  async function postJson(path, body, operation) {
    const response = await request(
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      operation,
    );
    return response;
  }

  async function registerNewCredential() {
    const userId = generateUserId(cryptoImpl);

    for (let attempt = 0; attempt < puzzleAttempts; attempt++) {
      const path = `/puzzle/registration?userId=${encodeURIComponent(userId)}`;
      const puzzleResponse = await request(
        path,
        { method: "GET", headers: { Accept: "application/json" } },
        "Registration puzzle",
      );
      if (!isSuccessful(puzzleResponse)) {
        throw new VoteClientError("Registration puzzle request was rejected", { status: puzzleResponse.status });
      }

      const puzzle = await readJson(puzzleResponse, "Registration puzzle");
      const solvedPuzzle = await solvePuzzle(puzzle, cryptoImpl);
      if (!solvedPuzzle) continue;

      const confirmResponse = await postJson(path, solvedPuzzle, "Registration confirmation");
      if (!isSuccessful(confirmResponse)) {
        throw new VoteClientError("Registration confirmation was rejected", { status: confirmResponse.status });
      }
      const confirmed = await readJson(confirmResponse, "Registration confirmation");
      if (confirmed !== true) {
        throw new VoteClientError("Registration confirmation failed");
      }

      const credential = { userId, registrationConfirmed: true };
      await credentialStore.save(credential);
      return { userId };
    }

    throw new VoteClientError("Unable to solve the registration puzzle");
  }

  async function ensureRegisteredInternal(force) {
    if (force) {
      await credentialStore.clear();
    } else {
      const credential = await credentialStore.load();
      if (isConfirmedCredential(credential)) return { userId: credential.userId };
    }
    return registerNewCredential();
  }

  function trackRegistration(work, force) {
    let trackedPromise;
    trackedPromise = work.finally(() => {
      if (registrationPromise === trackedPromise) {
        registrationPromise = null;
        registrationIsForced = false;
      }
    });
    registrationPromise = trackedPromise;
    registrationIsForced = force;
    return trackedPromise;
  }

  function ensureRegistered(options = {}) {
    const force = options.force === true;
    if (!registrationPromise) {
      return trackRegistration(ensureRegisteredInternal(force), force);
    }
    if (!force || registrationIsForced) return registrationPromise;

    const pendingRegistration = registrationPromise;
    return trackRegistration(
      pendingRegistration.catch(() => undefined).then(() => ensureRegisteredInternal(true)),
      true,
    );
  }

  async function performVote(videoId, value, authenticationRetriesRemaining) {
    let { userId } = await ensureRegistered();

    for (let attempt = 0; attempt < votePuzzleAttempts; attempt++) {
      const voteResponse = await postJson("/interact/vote", { userId, videoId, value }, "Vote submission");

      if (voteResponse.status === 401) {
        if (authenticationRetriesRemaining <= 0) {
          throw new VoteClientError("Vote submission was unauthorized after re-registration", { status: 401 });
        }
        ({ userId } = await ensureRegistered({ force: true }));
        return performVote(videoId, value, authenticationRetriesRemaining - 1);
      }
      if (!isSuccessful(voteResponse)) {
        throw new VoteClientError("Vote submission was rejected", { status: voteResponse.status });
      }

      const puzzle = await readJson(voteResponse, "Vote submission");
      const solvedPuzzle = await solvePuzzle(puzzle, cryptoImpl);
      if (!solvedPuzzle) continue;

      const confirmResponse = await postJson(
        "/interact/confirmVote",
        { ...solvedPuzzle, userId, videoId },
        "Vote confirmation",
      );
      if (confirmResponse.status === 401) {
        if (authenticationRetriesRemaining <= 0) {
          throw new VoteClientError("Vote confirmation was unauthorized after re-registration", { status: 401 });
        }
        await ensureRegistered({ force: true });
        return performVote(videoId, value, authenticationRetriesRemaining - 1);
      }
      if (!isSuccessful(confirmResponse)) {
        throw new VoteClientError("Vote confirmation was rejected", { status: confirmResponse.status });
      }

      const confirmed = await readJson(confirmResponse, "Vote confirmation");
      if (confirmed !== true) throw new VoteClientError("Vote confirmation failed");
      return true;
    }

    throw new VoteClientError("Unable to solve the vote puzzle");
  }

  function submitVote(videoId, value) {
    if (typeof videoId !== "string" || !VALID_VIDEO_ID.test(videoId)) {
      return Promise.reject(new TypeError("videoId must be an 11-character YouTube video ID"));
    }
    if (!VALID_VOTE_VALUES.has(value)) {
      return Promise.reject(new TypeError("value must be -1, 0, or 1"));
    }

    const previous = voteQueues.get(videoId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(() => performVote(videoId, value, 1));
    voteQueues.set(videoId, current);
    current.then(
      () => {
        if (voteQueues.get(videoId) === current) voteQueues.delete(videoId);
      },
      () => {
        if (voteQueues.get(videoId) === current) voteQueues.delete(videoId);
      },
    );
    return current;
  }

  async function getRegisteredUser() {
    const credential = await credentialStore.load();
    return isConfirmedCredential(credential) ? { userId: credential.userId } : null;
  }

  return { ensureRegistered, getRegisteredUser, submitVote };
}



;// CONCATENATED MODULE: ./Extensions/combined/src/vote-client-adapter.js
function createStorageCaller(storageArea, getLastError = () => undefined) {
  return function call(methodName, ...args) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback) => (value) => {
        if (settled) return;
        settled = true;
        callback(value);
      };
      const resolveOnce = finish(resolve);
      const rejectOnce = finish(reject);
      const callback = (result) => {
        const lastError = getLastError();
        if (lastError) {
          rejectOnce(new Error(lastError.message || String(lastError)));
        } else {
          resolveOnce(result);
        }
      };

      try {
        const maybePromise = storageArea[methodName](...args, callback);
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(resolveOnce, rejectOnce);
        }
      } catch (callbackError) {
        try {
          const maybePromise = storageArea[methodName](...args);
          Promise.resolve(maybePromise).then(resolveOnce, rejectOnce);
        } catch (promiseError) {
          rejectOnce(promiseError ?? callbackError);
        }
      }
    });
  };
}

function createBrowserCredentialStore(storageArea, getLastError) {
  if (!storageArea?.get || !storageArea?.set) {
    throw new TypeError("A browser storage area is required");
  }

  const call = createStorageCaller(storageArea, getLastError);
  return {
    async load() {
      const result = await call("get", ["userId", "registrationConfirmed"]);
      if (!result?.userId || result.registrationConfirmed !== true) return null;
      return { userId: result.userId, registrationConfirmed: true };
    },

    async save(credentials) {
      await call("set", {
        userId: credentials.userId,
        registrationConfirmed: credentials.registrationConfirmed === true,
      });
    },

    async clear() {
      if (typeof storageArea.remove === "function") {
        await call("remove", ["userId", "registrationConfirmed"]);
      } else {
        await call("set", { userId: null, registrationConfirmed: false });
      }
    },
  };
}

const SYNTHETIC_DISLIKE_KEY_PREFIX = "rydSyntheticDislikedShort:";

function syntheticDislikeKey(videoId) {
  if (typeof videoId !== "string" || videoId.length === 0) {
    throw new TypeError("videoId must be a non-empty string");
  }
  return `${SYNTHETIC_DISLIKE_KEY_PREFIX}${videoId}`;
}

function createBrowserSyntheticDislikeStore(storageArea, getLastError) {
  if (!storageArea?.get || !storageArea?.set) {
    throw new TypeError("A browser storage area is required");
  }

  const call = createStorageCaller(storageArea, getLastError);
  return {
    async isDisliked(videoId) {
      const key = syntheticDislikeKey(videoId);
      const result = await call("get", [key]);
      return result?.[key] === true;
    },

    async setDisliked(videoId, disliked) {
      const key = syntheticDislikeKey(videoId);
      if (typeof disliked !== "boolean") {
        throw new TypeError("disliked must be a boolean");
      }
      if (disliked || typeof storageArea.remove !== "function") {
        await call("set", { [key]: disliked });
      } else {
        await call("remove", [key]);
      }
    },
  };
}



;// CONCATENATED MODULE: ./Extensions/combined/src/github-auth.js


function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkce(cryptoApi = globalThis.crypto) {
  const verifier = base64Url(cryptoApi.getRandomValues(new Uint8Array(32)));
  const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

const API_ERRORS = new Set([
  "github_not_configured",
  "not_contributor",
  "github_pkce_required",
  "github_invalid_state",
  "github_token_exchange_failed",
  "github_identity_failed",
]);

async function readAuthResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error || data?.success === false) {
    if (API_ERRORS.has(data?.error)) throw new Error(data.error);
    if (data?.error === "Disallowed redirectUri") throw new Error("github_redirect_rejected");
    if (response.status === 404 || response.status === 503) throw new Error("github_unavailable");
    if (response.status === 429) throw new Error("github_rate_limited");
    throw new Error("github_login_failed");
  }
  if (!data) throw new Error("github_invalid_response");
  return data;
}

async function loginWithGitHub({
  redirectUri,
  launchWebAuthFlow,
  requireConsent,
  fetchImpl = globalThis.fetch,
  cryptoApi = globalThis.crypto,
}) {
  await requireConsent();
  const { verifier, challenge } = await createPkce(cryptoApi);
  await requireConsent();
  const start = await readAuthResponse(
    await fetchImpl(
      getApiEndpoint(
        `/api/auth/github/login?redirectUri=${encodeURIComponent(redirectUri)}&codeChallenge=${encodeURIComponent(challenge)}`,
      ),
    ),
  );
  let authUrl;
  try {
    authUrl = new URL(start.authUrl);
  } catch (_) {
    throw new Error("github_invalid_response");
  }
  if (
    authUrl.origin !== "https://github.com" ||
    authUrl.pathname !== "/login/oauth/authorize" ||
    typeof start.state !== "string" ||
    !start.state ||
    start.redirectUri !== redirectUri ||
    authUrl.searchParams.get("state") !== start.state ||
    authUrl.searchParams.get("redirect_uri") !== redirectUri ||
    authUrl.searchParams.get("code_challenge") !== challenge ||
    authUrl.searchParams.get("code_challenge_method") !== "S256"
  ) {
    throw new Error("github_invalid_response");
  }

  await requireConsent();
  const callback = new URL(await launchWebAuthFlow(authUrl.href));
  const expectedRedirect = new URL(redirectUri);
  if (
    callback.origin !== expectedRedirect.origin ||
    callback.pathname !== expectedRedirect.pathname ||
    callback.searchParams.get("state") !== start.state
  ) {
    throw new Error("github_invalid_state");
  }
  if (callback.searchParams.has("error")) throw new Error("github_authorization_denied");
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("github_invalid_response");

  await requireConsent();
  const account = await readAuthResponse(
    await fetchImpl(getApiEndpoint("/api/auth/github/exchange"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state: start.state, redirectUri, codeVerifier: verifier }),
    }),
  );
  await requireConsent();
  if (account.success !== true || !account.user || !account.sessionToken) throw new Error("github_invalid_response");
  return account;
}



;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/DefaultReconnectPolicy.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// 0, 2, 10, 30 second delays before reconnect attempts.
const DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2000, 10000, 30000, null];
/** @private */
class DefaultReconnectPolicy {
    constructor(retryDelays) {
        this._retryDelays = retryDelays !== undefined ? [...retryDelays, null] : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
    }
    nextRetryDelayInMilliseconds(retryContext) {
        return this._retryDelays[retryContext.previousRetryCount];
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HeaderNames.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
class HeaderNames {
}
HeaderNames.Authorization = "Authorization";
HeaderNames.Cookie = "Cookie";
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HttpClient.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
/** Represents an HTTP response. */
class HttpResponse {
    constructor(statusCode, statusText, content) {
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.content = content;
    }
}
/** Abstraction over an HTTP client.
 *
 * This class provides an abstraction over an HTTP client so that a different implementation can be provided on different platforms.
 */
class HttpClient {
    get(url, options) {
        return this.send({
            ...options,
            method: "GET",
            url,
        });
    }
    post(url, options) {
        return this.send({
            ...options,
            method: "POST",
            url,
        });
    }
    delete(url, options) {
        return this.send({
            ...options,
            method: "DELETE",
            url,
        });
    }
    /** Gets all cookies that apply to the specified URL.
     *
     * @param url The URL that the cookies are valid for.
     * @returns {string} A string containing all the key-value cookie pairs for the specified URL.
     */
    // @ts-ignore
    getCookieString(url) {
        return "";
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/AccessTokenHttpClient.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.


/** @private */
class AccessTokenHttpClient extends HttpClient {
    constructor(innerClient, accessTokenFactory) {
        super();
        this._innerClient = innerClient;
        this._accessTokenFactory = accessTokenFactory;
    }
    async send(request) {
        let allowRetry = true;
        if (this._accessTokenFactory && (!this._accessToken || (request.url && request.url.indexOf("/negotiate?") > 0))) {
            // don't retry if the request is a negotiate or if we just got a potentially new token from the access token factory
            allowRetry = false;
            this._accessToken = await this._accessTokenFactory();
        }
        this._setAuthorizationHeader(request);
        const response = await this._innerClient.send(request);
        if (allowRetry && response.statusCode === 401 && this._accessTokenFactory) {
            this._accessToken = await this._accessTokenFactory();
            this._setAuthorizationHeader(request);
            return await this._innerClient.send(request);
        }
        return response;
    }
    _setAuthorizationHeader(request) {
        if (!request.headers) {
            request.headers = {};
        }
        if (this._accessToken) {
            request.headers[HeaderNames.Authorization] = `Bearer ${this._accessToken}`;
        }
        // don't remove the header if there isn't an access token factory, the user manually added the header in this case
        else if (this._accessTokenFactory) {
            if (request.headers[HeaderNames.Authorization]) {
                delete request.headers[HeaderNames.Authorization];
            }
        }
    }
    getCookieString(url) {
        return this._innerClient.getCookieString(url);
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/Errors.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
/** Error thrown when an HTTP request fails. */
class HttpError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
     *
     * @param {string} errorMessage A descriptive error message.
     * @param {number} statusCode The HTTP status code represented by this error.
     */
    constructor(errorMessage, statusCode) {
        const trueProto = new.target.prototype;
        super(`${errorMessage}: Status code '${statusCode}'`);
        this.statusCode = statusCode;
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when a timeout elapses. */
class TimeoutError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
     *
     * @param {string} errorMessage A descriptive error message.
     */
    constructor(errorMessage = "A timeout occurred.") {
        const trueProto = new.target.prototype;
        super(errorMessage);
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when an action is aborted. */
class AbortError extends Error {
    /** Constructs a new instance of {@link AbortError}.
     *
     * @param {string} errorMessage A descriptive error message.
     */
    constructor(errorMessage = "An abort occurred.") {
        const trueProto = new.target.prototype;
        super(errorMessage);
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when the selected transport is unsupported by the browser. */
/** @private */
class UnsupportedTransportError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
     *
     * @param {string} message A descriptive error message.
     * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
     */
    constructor(message, transport) {
        const trueProto = new.target.prototype;
        super(message);
        this.transport = transport;
        this.errorType = 'UnsupportedTransportError';
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when the selected transport is disabled by the browser. */
/** @private */
class DisabledTransportError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
     *
     * @param {string} message A descriptive error message.
     * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
     */
    constructor(message, transport) {
        const trueProto = new.target.prototype;
        super(message);
        this.transport = transport;
        this.errorType = 'DisabledTransportError';
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when the selected transport cannot be started. */
/** @private */
class FailedToStartTransportError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
     *
     * @param {string} message A descriptive error message.
     * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
     */
    constructor(message, transport) {
        const trueProto = new.target.prototype;
        super(message);
        this.transport = transport;
        this.errorType = 'FailedToStartTransportError';
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when the negotiation with the server failed to complete. */
/** @private */
class FailedToNegotiateWithServerError extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
     *
     * @param {string} message A descriptive error message.
     */
    constructor(message) {
        const trueProto = new.target.prototype;
        super(message);
        this.errorType = 'FailedToNegotiateWithServerError';
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
/** Error thrown when multiple errors have occurred. */
/** @private */
class AggregateErrors extends Error {
    /** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
     *
     * @param {string} message A descriptive error message.
     * @param {Error[]} innerErrors The collection of errors this error is aggregating.
     */
    constructor(message, innerErrors) {
        const trueProto = new.target.prototype;
        super(message);
        this.innerErrors = innerErrors;
        // Workaround issue in Typescript compiler
        // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
        this.__proto__ = trueProto;
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/ILogger.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// These values are designed to match the ASP.NET Log Levels since that's the pattern we're emulating here.
/** Indicates the severity of a log message.
 *
 * Log Levels are ordered in increasing severity. So `Debug` is more severe than `Trace`, etc.
 */
var LogLevel;
(function (LogLevel) {
    /** Log level for very low severity diagnostic messages. */
    LogLevel[LogLevel["Trace"] = 0] = "Trace";
    /** Log level for low severity diagnostic messages. */
    LogLevel[LogLevel["Debug"] = 1] = "Debug";
    /** Log level for informational diagnostic messages. */
    LogLevel[LogLevel["Information"] = 2] = "Information";
    /** Log level for diagnostic messages that indicate a non-fatal problem. */
    LogLevel[LogLevel["Warning"] = 3] = "Warning";
    /** Log level for diagnostic messages that indicate a failure in the current operation. */
    LogLevel[LogLevel["Error"] = 4] = "Error";
    /** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
    LogLevel[LogLevel["Critical"] = 5] = "Critical";
    /** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
    LogLevel[LogLevel["None"] = 6] = "None";
})(LogLevel || (LogLevel = {}));
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/Loggers.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
/** A logger that does nothing when log messages are sent to it. */
class NullLogger {
    constructor() { }
    /** @inheritDoc */
    // eslint-disable-next-line
    log(_logLevel, _message) {
    }
}
/** The singleton instance of the {@link @microsoft/signalr.NullLogger}. */
NullLogger.instance = new NullLogger();
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/pkg-version.js
const VERSION = '9.0.6';
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/Utils.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.



// Version token that will be replaced by the prepack command
/** The version of the SignalR client. */

/** @private */
class Arg {
    static isRequired(val, name) {
        if (val === null || val === undefined) {
            throw new Error(`The '${name}' argument is required.`);
        }
    }
    static isNotEmpty(val, name) {
        if (!val || val.match(/^\s*$/)) {
            throw new Error(`The '${name}' argument should not be empty.`);
        }
    }
    static isIn(val, values, name) {
        // TypeScript enums have keys for **both** the name and the value of each enum member on the type itself.
        if (!(val in values)) {
            throw new Error(`Unknown ${name} value: ${val}.`);
        }
    }
}
/** @private */
class Platform {
    // react-native has a window but no document so we should check both
    static get isBrowser() {
        return !Platform.isNode && typeof window === "object" && typeof window.document === "object";
    }
    // WebWorkers don't have a window object so the isBrowser check would fail
    static get isWebWorker() {
        return !Platform.isNode && typeof self === "object" && "importScripts" in self;
    }
    // react-native has a window but no document
    static get isReactNative() {
        return !Platform.isNode && typeof window === "object" && typeof window.document === "undefined";
    }
    // Node apps shouldn't have a window object, but WebWorkers don't either
    // so we need to check for both WebWorker and window
    static get isNode() {
        return typeof process !== "undefined" && process.release && process.release.name === "node";
    }
}
/** @private */
function getDataDetail(data, includeContent) {
    let detail = "";
    if (isArrayBuffer(data)) {
        detail = `Binary data of length ${data.byteLength}`;
        if (includeContent) {
            detail += `. Content: '${formatArrayBuffer(data)}'`;
        }
    }
    else if (typeof data === "string") {
        detail = `String data of length ${data.length}`;
        if (includeContent) {
            detail += `. Content: '${data}'`;
        }
    }
    return detail;
}
/** @private */
function formatArrayBuffer(data) {
    const view = new Uint8Array(data);
    // Uint8Array.map only supports returning another Uint8Array?
    let str = "";
    view.forEach((num) => {
        const pad = num < 16 ? "0" : "";
        str += `0x${pad}${num.toString(16)} `;
    });
    // Trim of trailing space.
    return str.substr(0, str.length - 1);
}
// Also in signalr-protocol-msgpack/Utils.ts
/** @private */
function isArrayBuffer(val) {
    return val && typeof ArrayBuffer !== "undefined" &&
        (val instanceof ArrayBuffer ||
            // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
            (val.constructor && val.constructor.name === "ArrayBuffer"));
}
/** @private */
async function sendMessage(logger, transportName, httpClient, url, content, options) {
    const headers = {};
    const [name, value] = getUserAgentHeader();
    headers[name] = value;
    logger.log(LogLevel.Trace, `(${transportName} transport) sending data. ${getDataDetail(content, options.logMessageContent)}.`);
    const responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
    const response = await httpClient.post(url, {
        content,
        headers: { ...headers, ...options.headers },
        responseType,
        timeout: options.timeout,
        withCredentials: options.withCredentials,
    });
    logger.log(LogLevel.Trace, `(${transportName} transport) request complete. Response status: ${response.statusCode}.`);
}
/** @private */
function createLogger(logger) {
    if (logger === undefined) {
        return new ConsoleLogger(LogLevel.Information);
    }
    if (logger === null) {
        return NullLogger.instance;
    }
    if (logger.log !== undefined) {
        return logger;
    }
    return new ConsoleLogger(logger);
}
/** @private */
class SubjectSubscription {
    constructor(subject, observer) {
        this._subject = subject;
        this._observer = observer;
    }
    dispose() {
        const index = this._subject.observers.indexOf(this._observer);
        if (index > -1) {
            this._subject.observers.splice(index, 1);
        }
        if (this._subject.observers.length === 0 && this._subject.cancelCallback) {
            this._subject.cancelCallback().catch((_) => { });
        }
    }
}
/** @private */
class ConsoleLogger {
    constructor(minimumLogLevel) {
        this._minLevel = minimumLogLevel;
        this.out = console;
    }
    log(logLevel, message) {
        if (logLevel >= this._minLevel) {
            const msg = `[${new Date().toISOString()}] ${LogLevel[logLevel]}: ${message}`;
            switch (logLevel) {
                case LogLevel.Critical:
                case LogLevel.Error:
                    this.out.error(msg);
                    break;
                case LogLevel.Warning:
                    this.out.warn(msg);
                    break;
                case LogLevel.Information:
                    this.out.info(msg);
                    break;
                default:
                    // console.debug only goes to attached debuggers in Node, so we use console.log for Trace and Debug
                    this.out.log(msg);
                    break;
            }
        }
    }
}
/** @private */
function getUserAgentHeader() {
    let userAgentHeaderName = "X-SignalR-User-Agent";
    if (Platform.isNode) {
        userAgentHeaderName = "User-Agent";
    }
    return [userAgentHeaderName, constructUserAgent(VERSION, getOsName(), getRuntime(), getRuntimeVersion())];
}
/** @private */
function constructUserAgent(version, os, runtime, runtimeVersion) {
    // Microsoft SignalR/[Version] ([Detailed Version]; [Operating System]; [Runtime]; [Runtime Version])
    let userAgent = "Microsoft SignalR/";
    const majorAndMinor = version.split(".");
    userAgent += `${majorAndMinor[0]}.${majorAndMinor[1]}`;
    userAgent += ` (${version}; `;
    if (os && os !== "") {
        userAgent += `${os}; `;
    }
    else {
        userAgent += "Unknown OS; ";
    }
    userAgent += `${runtime}`;
    if (runtimeVersion) {
        userAgent += `; ${runtimeVersion}`;
    }
    else {
        userAgent += "; Unknown Runtime Version";
    }
    userAgent += ")";
    return userAgent;
}
// eslint-disable-next-line spaced-comment
/*#__PURE__*/ function getOsName() {
    if (Platform.isNode) {
        switch (process.platform) {
            case "win32":
                return "Windows NT";
            case "darwin":
                return "macOS";
            case "linux":
                return "Linux";
            default:
                return process.platform;
        }
    }
    else {
        return "";
    }
}
// eslint-disable-next-line spaced-comment
/*#__PURE__*/ function getRuntimeVersion() {
    if (Platform.isNode) {
        return process.versions.node;
    }
    return undefined;
}
function getRuntime() {
    if (Platform.isNode) {
        return "NodeJS";
    }
    else {
        return "Browser";
    }
}
/** @private */
function getErrorString(e) {
    if (e.stack) {
        return e.stack;
    }
    else if (e.message) {
        return e.message;
    }
    return `${e}`;
}
/** @private */
function getGlobalThis() {
    // globalThis is semi-new and not available in Node until v12
    if (typeof globalThis !== "undefined") {
        return globalThis;
    }
    if (typeof self !== "undefined") {
        return self;
    }
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof __webpack_require__.g !== "undefined") {
        return __webpack_require__.g;
    }
    throw new Error("could not find global");
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/FetchHttpClient.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.




class FetchHttpClient extends HttpClient {
    constructor(logger) {
        super();
        this._logger = logger;
        // Node added a fetch implementation to the global scope starting in v18.
        // We need to add a cookie jar in node to be able to share cookies with WebSocket
        if (typeof fetch === "undefined" || Platform.isNode) {
            // In order to ignore the dynamic require in webpack builds we need to do this magic
            // @ts-ignore: TS doesn't know about these names
            const requireFunc =  true ? require : 0;
            // Cookies aren't automatically handled in Node so we need to add a CookieJar to preserve cookies across requests
            this._jar = new (requireFunc("tough-cookie")).CookieJar();
            if (typeof fetch === "undefined") {
                this._fetchType = requireFunc("node-fetch");
            }
            else {
                // Use fetch from Node if available
                this._fetchType = fetch;
            }
            // node-fetch doesn't have a nice API for getting and setting cookies
            // fetch-cookie will wrap a fetch implementation with a default CookieJar or a provided one
            this._fetchType = requireFunc("fetch-cookie")(this._fetchType, this._jar);
        }
        else {
            this._fetchType = fetch.bind(getGlobalThis());
        }
        if (typeof AbortController === "undefined") {
            // In order to ignore the dynamic require in webpack builds we need to do this magic
            // @ts-ignore: TS doesn't know about these names
            const requireFunc =  true ? require : 0;
            // Node needs EventListener methods on AbortController which our custom polyfill doesn't provide
            this._abortControllerType = requireFunc("abort-controller");
        }
        else {
            this._abortControllerType = AbortController;
        }
    }
    /** @inheritDoc */
    async send(request) {
        // Check that abort was not signaled before calling send
        if (request.abortSignal && request.abortSignal.aborted) {
            throw new AbortError();
        }
        if (!request.method) {
            throw new Error("No method defined.");
        }
        if (!request.url) {
            throw new Error("No url defined.");
        }
        const abortController = new this._abortControllerType();
        let error;
        // Hook our abortSignal into the abort controller
        if (request.abortSignal) {
            request.abortSignal.onabort = () => {
                abortController.abort();
                error = new AbortError();
            };
        }
        // If a timeout has been passed in, setup a timeout to call abort
        // Type needs to be any to fit window.setTimeout and NodeJS.setTimeout
        let timeoutId = null;
        if (request.timeout) {
            const msTimeout = request.timeout;
            timeoutId = setTimeout(() => {
                abortController.abort();
                this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                error = new TimeoutError();
            }, msTimeout);
        }
        if (request.content === "") {
            request.content = undefined;
        }
        if (request.content) {
            // Explicitly setting the Content-Type header for React Native on Android platform.
            request.headers = request.headers || {};
            if (isArrayBuffer(request.content)) {
                request.headers["Content-Type"] = "application/octet-stream";
            }
            else {
                request.headers["Content-Type"] = "text/plain;charset=UTF-8";
            }
        }
        let response;
        try {
            response = await this._fetchType(request.url, {
                body: request.content,
                cache: "no-cache",
                credentials: request.withCredentials === true ? "include" : "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    ...request.headers,
                },
                method: request.method,
                mode: "cors",
                redirect: "follow",
                signal: abortController.signal,
            });
        }
        catch (e) {
            if (error) {
                throw error;
            }
            this._logger.log(LogLevel.Warning, `Error from HTTP request. ${e}.`);
            throw e;
        }
        finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (request.abortSignal) {
                request.abortSignal.onabort = null;
            }
        }
        if (!response.ok) {
            const errorMessage = await deserializeContent(response, "text");
            throw new HttpError(errorMessage || response.statusText, response.status);
        }
        const content = deserializeContent(response, request.responseType);
        const payload = await content;
        return new HttpResponse(response.status, response.statusText, payload);
    }
    getCookieString(url) {
        let cookies = "";
        if (Platform.isNode && this._jar) {
            // @ts-ignore: unused variable
            this._jar.getCookies(url, (e, c) => cookies = c.join("; "));
        }
        return cookies;
    }
}
function deserializeContent(response, responseType) {
    let content;
    switch (responseType) {
        case "arraybuffer":
            content = response.arrayBuffer();
            break;
        case "text":
            content = response.text();
            break;
        case "blob":
        case "document":
        case "json":
            throw new Error(`${responseType} is not supported.`);
        default:
            content = response.text();
            break;
    }
    return content;
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/XhrHttpClient.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.




class XhrHttpClient extends HttpClient {
    constructor(logger) {
        super();
        this._logger = logger;
    }
    /** @inheritDoc */
    send(request) {
        // Check that abort was not signaled before calling send
        if (request.abortSignal && request.abortSignal.aborted) {
            return Promise.reject(new AbortError());
        }
        if (!request.method) {
            return Promise.reject(new Error("No method defined."));
        }
        if (!request.url) {
            return Promise.reject(new Error("No url defined."));
        }
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(request.method, request.url, true);
            xhr.withCredentials = request.withCredentials === undefined ? true : request.withCredentials;
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if (request.content === "") {
                request.content = undefined;
            }
            if (request.content) {
                // Explicitly setting the Content-Type header for React Native on Android platform.
                if (isArrayBuffer(request.content)) {
                    xhr.setRequestHeader("Content-Type", "application/octet-stream");
                }
                else {
                    xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
                }
            }
            const headers = request.headers;
            if (headers) {
                Object.keys(headers)
                    .forEach((header) => {
                    xhr.setRequestHeader(header, headers[header]);
                });
            }
            if (request.responseType) {
                xhr.responseType = request.responseType;
            }
            if (request.abortSignal) {
                request.abortSignal.onabort = () => {
                    xhr.abort();
                    reject(new AbortError());
                };
            }
            if (request.timeout) {
                xhr.timeout = request.timeout;
            }
            xhr.onload = () => {
                if (request.abortSignal) {
                    request.abortSignal.onabort = null;
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
                }
                else {
                    reject(new HttpError(xhr.response || xhr.responseText || xhr.statusText, xhr.status));
                }
            };
            xhr.onerror = () => {
                this._logger.log(LogLevel.Warning, `Error from HTTP request. ${xhr.status}: ${xhr.statusText}.`);
                reject(new HttpError(xhr.statusText, xhr.status));
            };
            xhr.ontimeout = () => {
                this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                reject(new TimeoutError());
            };
            xhr.send(request.content);
        });
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/DefaultHttpClient.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.





/** Default implementation of {@link @microsoft/signalr.HttpClient}. */
class DefaultHttpClient extends HttpClient {
    /** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
    constructor(logger) {
        super();
        if (typeof fetch !== "undefined" || Platform.isNode) {
            this._httpClient = new FetchHttpClient(logger);
        }
        else if (typeof XMLHttpRequest !== "undefined") {
            this._httpClient = new XhrHttpClient(logger);
        }
        else {
            throw new Error("No usable HttpClient found.");
        }
    }
    /** @inheritDoc */
    send(request) {
        // Check that abort was not signaled before calling send
        if (request.abortSignal && request.abortSignal.aborted) {
            return Promise.reject(new AbortError());
        }
        if (!request.method) {
            return Promise.reject(new Error("No method defined."));
        }
        if (!request.url) {
            return Promise.reject(new Error("No url defined."));
        }
        return this._httpClient.send(request);
    }
    getCookieString(url) {
        return this._httpClient.getCookieString(url);
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/ITransport.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// This will be treated as a bit flag in the future, so we keep it using power-of-two values.
/** Specifies a specific HTTP transport type. */
var HttpTransportType;
(function (HttpTransportType) {
    /** Specifies no transport preference. */
    HttpTransportType[HttpTransportType["None"] = 0] = "None";
    /** Specifies the WebSockets transport. */
    HttpTransportType[HttpTransportType["WebSockets"] = 1] = "WebSockets";
    /** Specifies the Server-Sent Events transport. */
    HttpTransportType[HttpTransportType["ServerSentEvents"] = 2] = "ServerSentEvents";
    /** Specifies the Long Polling transport. */
    HttpTransportType[HttpTransportType["LongPolling"] = 4] = "LongPolling";
})(HttpTransportType || (HttpTransportType = {}));
/** Specifies the transfer format for a connection. */
var TransferFormat;
(function (TransferFormat) {
    /** Specifies that only text data will be transmitted over the connection. */
    TransferFormat[TransferFormat["Text"] = 1] = "Text";
    /** Specifies that binary data will be transmitted over the connection. */
    TransferFormat[TransferFormat["Binary"] = 2] = "Binary";
})(TransferFormat || (TransferFormat = {}));
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/AbortController.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// Rough polyfill of https://developer.mozilla.org/en-US/docs/Web/API/AbortController
// We don't actually ever use the API being polyfilled, we always use the polyfill because
// it's a very new API right now.
// Not exported from index.
/** @private */
class AbortController_AbortController {
    constructor() {
        this._isAborted = false;
        this.onabort = null;
    }
    abort() {
        if (!this._isAborted) {
            this._isAborted = true;
            if (this.onabort) {
                this.onabort();
            }
        }
    }
    get signal() {
        return this;
    }
    get aborted() {
        return this._isAborted;
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/LongPollingTransport.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.





// Not exported from 'index', this type is internal.
/** @private */
class LongPollingTransport {
    // This is an internal type, not exported from 'index' so this is really just internal.
    get pollAborted() {
        return this._pollAbort.aborted;
    }
    constructor(httpClient, logger, options) {
        this._httpClient = httpClient;
        this._logger = logger;
        this._pollAbort = new AbortController_AbortController();
        this._options = options;
        this._running = false;
        this.onreceive = null;
        this.onclose = null;
    }
    async connect(url, transferFormat) {
        Arg.isRequired(url, "url");
        Arg.isRequired(transferFormat, "transferFormat");
        Arg.isIn(transferFormat, TransferFormat, "transferFormat");
        this._url = url;
        this._logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
        // Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
        if (transferFormat === TransferFormat.Binary &&
            (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
            throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
        }
        const [name, value] = getUserAgentHeader();
        const headers = { [name]: value, ...this._options.headers };
        const pollOptions = {
            abortSignal: this._pollAbort.signal,
            headers,
            timeout: 100000,
            withCredentials: this._options.withCredentials,
        };
        if (transferFormat === TransferFormat.Binary) {
            pollOptions.responseType = "arraybuffer";
        }
        // Make initial long polling request
        // Server uses first long polling request to finish initializing connection and it returns without data
        const pollUrl = `${url}&_=${Date.now()}`;
        this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
        const response = await this._httpClient.get(pollUrl, pollOptions);
        if (response.statusCode !== 200) {
            this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
            // Mark running as false so that the poll immediately ends and runs the close logic
            this._closeError = new HttpError(response.statusText || "", response.statusCode);
            this._running = false;
        }
        else {
            this._running = true;
        }
        this._receiving = this._poll(this._url, pollOptions);
    }
    async _poll(url, pollOptions) {
        try {
            while (this._running) {
                try {
                    const pollUrl = `${url}&_=${Date.now()}`;
                    this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
                    const response = await this._httpClient.get(pollUrl, pollOptions);
                    if (response.statusCode === 204) {
                        this._logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
                        this._running = false;
                    }
                    else if (response.statusCode !== 200) {
                        this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
                        // Unexpected status code
                        this._closeError = new HttpError(response.statusText || "", response.statusCode);
                        this._running = false;
                    }
                    else {
                        // Process the response
                        if (response.content) {
                            this._logger.log(LogLevel.Trace, `(LongPolling transport) data received. ${getDataDetail(response.content, this._options.logMessageContent)}.`);
                            if (this.onreceive) {
                                this.onreceive(response.content);
                            }
                        }
                        else {
                            // This is another way timeout manifest.
                            this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                        }
                    }
                }
                catch (e) {
                    if (!this._running) {
                        // Log but disregard errors that occur after stopping
                        this._logger.log(LogLevel.Trace, `(LongPolling transport) Poll errored after shutdown: ${e.message}`);
                    }
                    else {
                        if (e instanceof TimeoutError) {
                            // Ignore timeouts and reissue the poll.
                            this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                        }
                        else {
                            // Close the connection with the error as the result.
                            this._closeError = e;
                            this._running = false;
                        }
                    }
                }
            }
        }
        finally {
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
            // We will reach here with pollAborted==false when the server returned a response causing the transport to stop.
            // If pollAborted==true then client initiated the stop and the stop method will raise the close event after DELETE is sent.
            if (!this.pollAborted) {
                this._raiseOnClose();
            }
        }
    }
    async send(data) {
        if (!this._running) {
            return Promise.reject(new Error("Cannot send until the transport is connected"));
        }
        return sendMessage(this._logger, "LongPolling", this._httpClient, this._url, data, this._options);
    }
    async stop() {
        this._logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
        // Tell receiving loop to stop, abort any current request, and then wait for it to finish
        this._running = false;
        this._pollAbort.abort();
        try {
            await this._receiving;
            // Send DELETE to clean up long polling on the server
            this._logger.log(LogLevel.Trace, `(LongPolling transport) sending DELETE request to ${this._url}.`);
            const headers = {};
            const [name, value] = getUserAgentHeader();
            headers[name] = value;
            const deleteOptions = {
                headers: { ...headers, ...this._options.headers },
                timeout: this._options.timeout,
                withCredentials: this._options.withCredentials,
            };
            let error;
            try {
                await this._httpClient.delete(this._url, deleteOptions);
            }
            catch (err) {
                error = err;
            }
            if (error) {
                if (error instanceof HttpError) {
                    if (error.statusCode === 404) {
                        this._logger.log(LogLevel.Trace, "(LongPolling transport) A 404 response was returned from sending a DELETE request.");
                    }
                    else {
                        this._logger.log(LogLevel.Trace, `(LongPolling transport) Error sending a DELETE request: ${error}`);
                    }
                }
            }
            else {
                this._logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request accepted.");
            }
        }
        finally {
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
            // Raise close event here instead of in polling
            // It needs to happen after the DELETE request is sent
            this._raiseOnClose();
        }
    }
    _raiseOnClose() {
        if (this.onclose) {
            let logMessage = "(LongPolling transport) Firing onclose event.";
            if (this._closeError) {
                logMessage += " Error: " + this._closeError;
            }
            this._logger.log(LogLevel.Trace, logMessage);
            this.onclose(this._closeError);
        }
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/ServerSentEventsTransport.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.



/** @private */
class ServerSentEventsTransport {
    constructor(httpClient, accessToken, logger, options) {
        this._httpClient = httpClient;
        this._accessToken = accessToken;
        this._logger = logger;
        this._options = options;
        this.onreceive = null;
        this.onclose = null;
    }
    async connect(url, transferFormat) {
        Arg.isRequired(url, "url");
        Arg.isRequired(transferFormat, "transferFormat");
        Arg.isIn(transferFormat, TransferFormat, "transferFormat");
        this._logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
        // set url before accessTokenFactory because this._url is only for send and we set the auth header instead of the query string for send
        this._url = url;
        if (this._accessToken) {
            url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(this._accessToken)}`;
        }
        return new Promise((resolve, reject) => {
            let opened = false;
            if (transferFormat !== TransferFormat.Text) {
                reject(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
                return;
            }
            let eventSource;
            if (Platform.isBrowser || Platform.isWebWorker) {
                eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials });
            }
            else {
                // Non-browser passes cookies via the dictionary
                const cookies = this._httpClient.getCookieString(url);
                const headers = {};
                headers.Cookie = cookies;
                const [name, value] = getUserAgentHeader();
                headers[name] = value;
                eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials, headers: { ...headers, ...this._options.headers } });
            }
            try {
                eventSource.onmessage = (e) => {
                    if (this.onreceive) {
                        try {
                            this._logger.log(LogLevel.Trace, `(SSE transport) data received. ${getDataDetail(e.data, this._options.logMessageContent)}.`);
                            this.onreceive(e.data);
                        }
                        catch (error) {
                            this._close(error);
                            return;
                        }
                    }
                };
                // @ts-ignore: not using event on purpose
                eventSource.onerror = (e) => {
                    // EventSource doesn't give any useful information about server side closes.
                    if (opened) {
                        this._close();
                    }
                    else {
                        reject(new Error("EventSource failed to connect. The connection could not be found on the server,"
                            + " either the connection ID is not present on the server, or a proxy is refusing/buffering the connection."
                            + " If you have multiple servers check that sticky sessions are enabled."));
                    }
                };
                eventSource.onopen = () => {
                    this._logger.log(LogLevel.Information, `SSE connected to ${this._url}`);
                    this._eventSource = eventSource;
                    opened = true;
                    resolve();
                };
            }
            catch (e) {
                reject(e);
                return;
            }
        });
    }
    async send(data) {
        if (!this._eventSource) {
            return Promise.reject(new Error("Cannot send until the transport is connected"));
        }
        return sendMessage(this._logger, "SSE", this._httpClient, this._url, data, this._options);
    }
    stop() {
        this._close();
        return Promise.resolve();
    }
    _close(e) {
        if (this._eventSource) {
            this._eventSource.close();
            this._eventSource = undefined;
            if (this.onclose) {
                this.onclose(e);
            }
        }
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/WebSocketTransport.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.




/** @private */
class WebSocketTransport {
    constructor(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
        this._logger = logger;
        this._accessTokenFactory = accessTokenFactory;
        this._logMessageContent = logMessageContent;
        this._webSocketConstructor = webSocketConstructor;
        this._httpClient = httpClient;
        this.onreceive = null;
        this.onclose = null;
        this._headers = headers;
    }
    async connect(url, transferFormat) {
        Arg.isRequired(url, "url");
        Arg.isRequired(transferFormat, "transferFormat");
        Arg.isIn(transferFormat, TransferFormat, "transferFormat");
        this._logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
        let token;
        if (this._accessTokenFactory) {
            token = await this._accessTokenFactory();
        }
        return new Promise((resolve, reject) => {
            url = url.replace(/^http/, "ws");
            let webSocket;
            const cookies = this._httpClient.getCookieString(url);
            let opened = false;
            if (Platform.isNode || Platform.isReactNative) {
                const headers = {};
                const [name, value] = getUserAgentHeader();
                headers[name] = value;
                if (token) {
                    headers[HeaderNames.Authorization] = `Bearer ${token}`;
                }
                if (cookies) {
                    headers[HeaderNames.Cookie] = cookies;
                }
                // Only pass headers when in non-browser environments
                webSocket = new this._webSocketConstructor(url, undefined, {
                    headers: { ...headers, ...this._headers },
                });
            }
            else {
                if (token) {
                    url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(token)}`;
                }
            }
            if (!webSocket) {
                // Chrome is not happy with passing 'undefined' as protocol
                webSocket = new this._webSocketConstructor(url);
            }
            if (transferFormat === TransferFormat.Binary) {
                webSocket.binaryType = "arraybuffer";
            }
            webSocket.onopen = (_event) => {
                this._logger.log(LogLevel.Information, `WebSocket connected to ${url}.`);
                this._webSocket = webSocket;
                opened = true;
                resolve();
            };
            webSocket.onerror = (event) => {
                let error = null;
                // ErrorEvent is a browser only type we need to check if the type exists before using it
                if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                    error = event.error;
                }
                else {
                    error = "There was an error with the transport";
                }
                this._logger.log(LogLevel.Information, `(WebSockets transport) ${error}.`);
            };
            webSocket.onmessage = (message) => {
                this._logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this._logMessageContent)}.`);
                if (this.onreceive) {
                    try {
                        this.onreceive(message.data);
                    }
                    catch (error) {
                        this._close(error);
                        return;
                    }
                }
            };
            webSocket.onclose = (event) => {
                // Don't call close handler if connection was never established
                // We'll reject the connect call instead
                if (opened) {
                    this._close(event);
                }
                else {
                    let error = null;
                    // ErrorEvent is a browser only type we need to check if the type exists before using it
                    if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                        error = event.error;
                    }
                    else {
                        error = "WebSocket failed to connect. The connection could not be found on the server,"
                            + " either the endpoint may not be a SignalR endpoint,"
                            + " the connection ID is not present on the server, or there is a proxy blocking WebSockets."
                            + " If you have multiple servers check that sticky sessions are enabled.";
                    }
                    reject(new Error(error));
                }
            };
        });
    }
    send(data) {
        if (this._webSocket && this._webSocket.readyState === this._webSocketConstructor.OPEN) {
            this._logger.log(LogLevel.Trace, `(WebSockets transport) sending data. ${getDataDetail(data, this._logMessageContent)}.`);
            this._webSocket.send(data);
            return Promise.resolve();
        }
        return Promise.reject("WebSocket is not in the OPEN state");
    }
    stop() {
        if (this._webSocket) {
            // Manually invoke onclose callback inline so we know the HttpConnection was closed properly before returning
            // This also solves an issue where websocket.onclose could take 18+ seconds to trigger during network disconnects
            this._close(undefined);
        }
        return Promise.resolve();
    }
    _close(event) {
        // webSocket will be null if the transport did not start successfully
        if (this._webSocket) {
            // Clear websocket handlers because we are considering the socket closed now
            this._webSocket.onclose = () => { };
            this._webSocket.onmessage = () => { };
            this._webSocket.onerror = () => { };
            this._webSocket.close();
            this._webSocket = undefined;
        }
        this._logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
        if (this.onclose) {
            if (this._isCloseEvent(event) && (event.wasClean === false || event.code !== 1000)) {
                this.onclose(new Error(`WebSocket closed with status code: ${event.code} (${event.reason || "no reason given"}).`));
            }
            else if (event instanceof Error) {
                this.onclose(event);
            }
            else {
                this.onclose();
            }
        }
    }
    _isCloseEvent(event) {
        return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HttpConnection.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.









const MAX_REDIRECTS = 100;
/** @private */
class HttpConnection {
    constructor(url, options = {}) {
        this._stopPromiseResolver = () => { };
        this.features = {};
        this._negotiateVersion = 1;
        Arg.isRequired(url, "url");
        this._logger = createLogger(options.logger);
        this.baseUrl = this._resolveUrl(url);
        options = options || {};
        options.logMessageContent = options.logMessageContent === undefined ? false : options.logMessageContent;
        if (typeof options.withCredentials === "boolean" || options.withCredentials === undefined) {
            options.withCredentials = options.withCredentials === undefined ? true : options.withCredentials;
        }
        else {
            throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
        }
        options.timeout = options.timeout === undefined ? 100 * 1000 : options.timeout;
        let webSocketModule = null;
        let eventSourceModule = null;
        if (Platform.isNode && "function" !== "undefined") {
            // In order to ignore the dynamic require in webpack builds we need to do this magic
            // @ts-ignore: TS doesn't know about these names
            const requireFunc =  true ? require : 0;
            webSocketModule = requireFunc("ws");
            eventSourceModule = requireFunc("eventsource");
        }
        if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) {
            options.WebSocket = WebSocket;
        }
        else if (Platform.isNode && !options.WebSocket) {
            if (webSocketModule) {
                options.WebSocket = webSocketModule;
            }
        }
        if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) {
            options.EventSource = EventSource;
        }
        else if (Platform.isNode && !options.EventSource) {
            if (typeof eventSourceModule !== "undefined") {
                options.EventSource = eventSourceModule;
            }
        }
        this._httpClient = new AccessTokenHttpClient(options.httpClient || new DefaultHttpClient(this._logger), options.accessTokenFactory);
        this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
        this._connectionStarted = false;
        this._options = options;
        this.onreceive = null;
        this.onclose = null;
    }
    async start(transferFormat) {
        transferFormat = transferFormat || TransferFormat.Binary;
        Arg.isIn(transferFormat, TransferFormat, "transferFormat");
        this._logger.log(LogLevel.Debug, `Starting connection with transfer format '${TransferFormat[transferFormat]}'.`);
        if (this._connectionState !== "Disconnected" /* ConnectionState.Disconnected */) {
            return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
        }
        this._connectionState = "Connecting" /* ConnectionState.Connecting */;
        this._startInternalPromise = this._startInternal(transferFormat);
        await this._startInternalPromise;
        // The TypeScript compiler thinks that connectionState must be Connecting here. The TypeScript compiler is wrong.
        if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
            // stop() was called and transitioned the client into the Disconnecting state.
            const message = "Failed to start the HttpConnection before stop() was called.";
            this._logger.log(LogLevel.Error, message);
            // We cannot await stopPromise inside startInternal since stopInternal awaits the startInternalPromise.
            await this._stopPromise;
            return Promise.reject(new AbortError(message));
        }
        else if (this._connectionState !== "Connected" /* ConnectionState.Connected */) {
            // stop() was called and transitioned the client into the Disconnecting state.
            const message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
            this._logger.log(LogLevel.Error, message);
            return Promise.reject(new AbortError(message));
        }
        this._connectionStarted = true;
    }
    send(data) {
        if (this._connectionState !== "Connected" /* ConnectionState.Connected */) {
            return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
        }
        if (!this._sendQueue) {
            this._sendQueue = new TransportSendQueue(this.transport);
        }
        // Transport will not be null if state is connected
        return this._sendQueue.send(data);
    }
    async stop(error) {
        if (this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
            this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnected state.`);
            return Promise.resolve();
        }
        if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
            this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
            return this._stopPromise;
        }
        this._connectionState = "Disconnecting" /* ConnectionState.Disconnecting */;
        this._stopPromise = new Promise((resolve) => {
            // Don't complete stop() until stopConnection() completes.
            this._stopPromiseResolver = resolve;
        });
        // stopInternal should never throw so just observe it.
        await this._stopInternal(error);
        await this._stopPromise;
    }
    async _stopInternal(error) {
        // Set error as soon as possible otherwise there is a race between
        // the transport closing and providing an error and the error from a close message
        // We would prefer the close message error.
        this._stopError = error;
        try {
            await this._startInternalPromise;
        }
        catch (e) {
            // This exception is returned to the user as a rejected Promise from the start method.
        }
        // The transport's onclose will trigger stopConnection which will run our onclose event.
        // The transport should always be set if currently connected. If it wasn't set, it's likely because
        // stop was called during start() and start() failed.
        if (this.transport) {
            try {
                await this.transport.stop();
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `HttpConnection.transport.stop() threw error '${e}'.`);
                this._stopConnection();
            }
            this.transport = undefined;
        }
        else {
            this._logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
        }
    }
    async _startInternal(transferFormat) {
        // Store the original base url and the access token factory since they may change
        // as part of negotiating
        let url = this.baseUrl;
        this._accessTokenFactory = this._options.accessTokenFactory;
        this._httpClient._accessTokenFactory = this._accessTokenFactory;
        try {
            if (this._options.skipNegotiation) {
                if (this._options.transport === HttpTransportType.WebSockets) {
                    // No need to add a connection ID in this case
                    this.transport = this._constructTransport(HttpTransportType.WebSockets);
                    // We should just call connect directly in this case.
                    // No fallback or negotiate in this case.
                    await this._startTransport(url, transferFormat);
                }
                else {
                    throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
                }
            }
            else {
                let negotiateResponse = null;
                let redirects = 0;
                do {
                    negotiateResponse = await this._getNegotiationResponse(url);
                    // the user tries to stop the connection when it is being started
                    if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */ || this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
                        throw new AbortError("The connection was stopped during negotiation.");
                    }
                    if (negotiateResponse.error) {
                        throw new Error(negotiateResponse.error);
                    }
                    if (negotiateResponse.ProtocolVersion) {
                        throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
                    }
                    if (negotiateResponse.url) {
                        url = negotiateResponse.url;
                    }
                    if (negotiateResponse.accessToken) {
                        // Replace the current access token factory with one that uses
                        // the returned access token
                        const accessToken = negotiateResponse.accessToken;
                        this._accessTokenFactory = () => accessToken;
                        // set the factory to undefined so the AccessTokenHttpClient won't retry with the same token, since we know it won't change until a connection restart
                        this._httpClient._accessToken = accessToken;
                        this._httpClient._accessTokenFactory = undefined;
                    }
                    redirects++;
                } while (negotiateResponse.url && redirects < MAX_REDIRECTS);
                if (redirects === MAX_REDIRECTS && negotiateResponse.url) {
                    throw new Error("Negotiate redirection limit exceeded.");
                }
                await this._createTransport(url, this._options.transport, negotiateResponse, transferFormat);
            }
            if (this.transport instanceof LongPollingTransport) {
                this.features.inherentKeepAlive = true;
            }
            if (this._connectionState === "Connecting" /* ConnectionState.Connecting */) {
                // Ensure the connection transitions to the connected state prior to completing this.startInternalPromise.
                // start() will handle the case when stop was called and startInternal exits still in the disconnecting state.
                this._logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
                this._connectionState = "Connected" /* ConnectionState.Connected */;
            }
            // stop() is waiting on us via this.startInternalPromise so keep this.transport around so it can clean up.
            // This is the only case startInternal can exit in neither the connected nor disconnected state because stopConnection()
            // will transition to the disconnected state. start() will wait for the transition using the stopPromise.
        }
        catch (e) {
            this._logger.log(LogLevel.Error, "Failed to start the connection: " + e);
            this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
            this.transport = undefined;
            // if start fails, any active calls to stop assume that start will complete the stop promise
            this._stopPromiseResolver();
            return Promise.reject(e);
        }
    }
    async _getNegotiationResponse(url) {
        const headers = {};
        const [name, value] = getUserAgentHeader();
        headers[name] = value;
        const negotiateUrl = this._resolveNegotiateUrl(url);
        this._logger.log(LogLevel.Debug, `Sending negotiation request: ${negotiateUrl}.`);
        try {
            const response = await this._httpClient.post(negotiateUrl, {
                content: "",
                headers: { ...headers, ...this._options.headers },
                timeout: this._options.timeout,
                withCredentials: this._options.withCredentials,
            });
            if (response.statusCode !== 200) {
                return Promise.reject(new Error(`Unexpected status code returned from negotiate '${response.statusCode}'`));
            }
            const negotiateResponse = JSON.parse(response.content);
            if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
                // Negotiate version 0 doesn't use connectionToken
                // So we set it equal to connectionId so all our logic can use connectionToken without being aware of the negotiate version
                negotiateResponse.connectionToken = negotiateResponse.connectionId;
            }
            if (negotiateResponse.useStatefulReconnect && this._options._useStatefulReconnect !== true) {
                return Promise.reject(new FailedToNegotiateWithServerError("Client didn't negotiate Stateful Reconnect but the server did."));
            }
            return negotiateResponse;
        }
        catch (e) {
            let errorMessage = "Failed to complete negotiation with the server: " + e;
            if (e instanceof HttpError) {
                if (e.statusCode === 404) {
                    errorMessage = errorMessage + " Either this is not a SignalR endpoint or there is a proxy blocking the connection.";
                }
            }
            this._logger.log(LogLevel.Error, errorMessage);
            return Promise.reject(new FailedToNegotiateWithServerError(errorMessage));
        }
    }
    _createConnectUrl(url, connectionToken) {
        if (!connectionToken) {
            return url;
        }
        return url + (url.indexOf("?") === -1 ? "?" : "&") + `id=${connectionToken}`;
    }
    async _createTransport(url, requestedTransport, negotiateResponse, requestedTransferFormat) {
        let connectUrl = this._createConnectUrl(url, negotiateResponse.connectionToken);
        if (this._isITransport(requestedTransport)) {
            this._logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
            this.transport = requestedTransport;
            await this._startTransport(connectUrl, requestedTransferFormat);
            this.connectionId = negotiateResponse.connectionId;
            return;
        }
        const transportExceptions = [];
        const transports = negotiateResponse.availableTransports || [];
        let negotiate = negotiateResponse;
        for (const endpoint of transports) {
            const transportOrError = this._resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, (negotiate === null || negotiate === void 0 ? void 0 : negotiate.useStatefulReconnect) === true);
            if (transportOrError instanceof Error) {
                // Store the error and continue, we don't want to cause a re-negotiate in these cases
                transportExceptions.push(`${endpoint.transport} failed:`);
                transportExceptions.push(transportOrError);
            }
            else if (this._isITransport(transportOrError)) {
                this.transport = transportOrError;
                if (!negotiate) {
                    try {
                        negotiate = await this._getNegotiationResponse(url);
                    }
                    catch (ex) {
                        return Promise.reject(ex);
                    }
                    connectUrl = this._createConnectUrl(url, negotiate.connectionToken);
                }
                try {
                    await this._startTransport(connectUrl, requestedTransferFormat);
                    this.connectionId = negotiate.connectionId;
                    return;
                }
                catch (ex) {
                    this._logger.log(LogLevel.Error, `Failed to start the transport '${endpoint.transport}': ${ex}`);
                    negotiate = undefined;
                    transportExceptions.push(new FailedToStartTransportError(`${endpoint.transport} failed: ${ex}`, HttpTransportType[endpoint.transport]));
                    if (this._connectionState !== "Connecting" /* ConnectionState.Connecting */) {
                        const message = "Failed to select transport before stop() was called.";
                        this._logger.log(LogLevel.Debug, message);
                        return Promise.reject(new AbortError(message));
                    }
                }
            }
        }
        if (transportExceptions.length > 0) {
            return Promise.reject(new AggregateErrors(`Unable to connect to the server with any of the available transports. ${transportExceptions.join(" ")}`, transportExceptions));
        }
        return Promise.reject(new Error("None of the transports supported by the client are supported by the server."));
    }
    _constructTransport(transport) {
        switch (transport) {
            case HttpTransportType.WebSockets:
                if (!this._options.WebSocket) {
                    throw new Error("'WebSocket' is not supported in your environment.");
                }
                return new WebSocketTransport(this._httpClient, this._accessTokenFactory, this._logger, this._options.logMessageContent, this._options.WebSocket, this._options.headers || {});
            case HttpTransportType.ServerSentEvents:
                if (!this._options.EventSource) {
                    throw new Error("'EventSource' is not supported in your environment.");
                }
                return new ServerSentEventsTransport(this._httpClient, this._httpClient._accessToken, this._logger, this._options);
            case HttpTransportType.LongPolling:
                return new LongPollingTransport(this._httpClient, this._logger, this._options);
            default:
                throw new Error(`Unknown transport: ${transport}.`);
        }
    }
    _startTransport(url, transferFormat) {
        this.transport.onreceive = this.onreceive;
        if (this.features.reconnect) {
            this.transport.onclose = async (e) => {
                let callStop = false;
                if (this.features.reconnect) {
                    try {
                        this.features.disconnected();
                        await this.transport.connect(url, transferFormat);
                        await this.features.resend();
                    }
                    catch {
                        callStop = true;
                    }
                }
                else {
                    this._stopConnection(e);
                    return;
                }
                if (callStop) {
                    this._stopConnection(e);
                }
            };
        }
        else {
            this.transport.onclose = (e) => this._stopConnection(e);
        }
        return this.transport.connect(url, transferFormat);
    }
    _resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, useStatefulReconnect) {
        const transport = HttpTransportType[endpoint.transport];
        if (transport === null || transport === undefined) {
            this._logger.log(LogLevel.Debug, `Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
            return new Error(`Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
        }
        else {
            if (transportMatches(requestedTransport, transport)) {
                const transferFormats = endpoint.transferFormats.map((s) => TransferFormat[s]);
                if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
                    if ((transport === HttpTransportType.WebSockets && !this._options.WebSocket) ||
                        (transport === HttpTransportType.ServerSentEvents && !this._options.EventSource)) {
                        this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it is not supported in your environment.'`);
                        return new UnsupportedTransportError(`'${HttpTransportType[transport]}' is not supported in your environment.`, transport);
                    }
                    else {
                        this._logger.log(LogLevel.Debug, `Selecting transport '${HttpTransportType[transport]}'.`);
                        try {
                            this.features.reconnect = transport === HttpTransportType.WebSockets ? useStatefulReconnect : undefined;
                            return this._constructTransport(transport);
                        }
                        catch (ex) {
                            return ex;
                        }
                    }
                }
                else {
                    this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it does not support the requested transfer format '${TransferFormat[requestedTransferFormat]}'.`);
                    return new Error(`'${HttpTransportType[transport]}' does not support ${TransferFormat[requestedTransferFormat]}.`);
                }
            }
            else {
                this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it was disabled by the client.`);
                return new DisabledTransportError(`'${HttpTransportType[transport]}' is disabled by the client.`, transport);
            }
        }
    }
    _isITransport(transport) {
        return transport && typeof (transport) === "object" && "connect" in transport;
    }
    _stopConnection(error) {
        this._logger.log(LogLevel.Debug, `HttpConnection.stopConnection(${error}) called while in state ${this._connectionState}.`);
        this.transport = undefined;
        // If we have a stopError, it takes precedence over the error from the transport
        error = this._stopError || error;
        this._stopError = undefined;
        if (this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
            this._logger.log(LogLevel.Debug, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is already in the disconnected state.`);
            return;
        }
        if (this._connectionState === "Connecting" /* ConnectionState.Connecting */) {
            this._logger.log(LogLevel.Warning, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is still in the connecting state.`);
            throw new Error(`HttpConnection.stopConnection(${error}) was called while the connection is still in the connecting state.`);
        }
        if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
            // A call to stop() induced this call to stopConnection and needs to be completed.
            // Any stop() awaiters will be scheduled to continue after the onclose callback fires.
            this._stopPromiseResolver();
        }
        if (error) {
            this._logger.log(LogLevel.Error, `Connection disconnected with error '${error}'.`);
        }
        else {
            this._logger.log(LogLevel.Information, "Connection disconnected.");
        }
        if (this._sendQueue) {
            this._sendQueue.stop().catch((e) => {
                this._logger.log(LogLevel.Error, `TransportSendQueue.stop() threw error '${e}'.`);
            });
            this._sendQueue = undefined;
        }
        this.connectionId = undefined;
        this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
        if (this._connectionStarted) {
            this._connectionStarted = false;
            try {
                if (this.onclose) {
                    this.onclose(error);
                }
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `HttpConnection.onclose(${error}) threw error '${e}'.`);
            }
        }
    }
    _resolveUrl(url) {
        // startsWith is not supported in IE
        if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
            return url;
        }
        if (!Platform.isBrowser) {
            throw new Error(`Cannot resolve '${url}'.`);
        }
        // Setting the url to the href propery of an anchor tag handles normalization
        // for us. There are 3 main cases.
        // 1. Relative path normalization e.g "b" -> "http://localhost:5000/a/b"
        // 2. Absolute path normalization e.g "/a/b" -> "http://localhost:5000/a/b"
        // 3. Networkpath reference normalization e.g "//localhost:5000/a/b" -> "http://localhost:5000/a/b"
        const aTag = window.document.createElement("a");
        aTag.href = url;
        this._logger.log(LogLevel.Information, `Normalizing '${url}' to '${aTag.href}'.`);
        return aTag.href;
    }
    _resolveNegotiateUrl(url) {
        const negotiateUrl = new URL(url);
        if (negotiateUrl.pathname.endsWith('/')) {
            negotiateUrl.pathname += "negotiate";
        }
        else {
            negotiateUrl.pathname += "/negotiate";
        }
        const searchParams = new URLSearchParams(negotiateUrl.searchParams);
        if (!searchParams.has("negotiateVersion")) {
            searchParams.append("negotiateVersion", this._negotiateVersion.toString());
        }
        if (searchParams.has("useStatefulReconnect")) {
            if (searchParams.get("useStatefulReconnect") === "true") {
                this._options._useStatefulReconnect = true;
            }
        }
        else if (this._options._useStatefulReconnect === true) {
            searchParams.append("useStatefulReconnect", "true");
        }
        negotiateUrl.search = searchParams.toString();
        return negotiateUrl.toString();
    }
}
function transportMatches(requestedTransport, actualTransport) {
    return !requestedTransport || ((actualTransport & requestedTransport) !== 0);
}
/** @private */
class TransportSendQueue {
    constructor(_transport) {
        this._transport = _transport;
        this._buffer = [];
        this._executing = true;
        this._sendBufferedData = new PromiseSource();
        this._transportResult = new PromiseSource();
        this._sendLoopPromise = this._sendLoop();
    }
    send(data) {
        this._bufferData(data);
        if (!this._transportResult) {
            this._transportResult = new PromiseSource();
        }
        return this._transportResult.promise;
    }
    stop() {
        this._executing = false;
        this._sendBufferedData.resolve();
        return this._sendLoopPromise;
    }
    _bufferData(data) {
        if (this._buffer.length && typeof (this._buffer[0]) !== typeof (data)) {
            throw new Error(`Expected data to be of type ${typeof (this._buffer)} but was of type ${typeof (data)}`);
        }
        this._buffer.push(data);
        this._sendBufferedData.resolve();
    }
    async _sendLoop() {
        while (true) {
            await this._sendBufferedData.promise;
            if (!this._executing) {
                if (this._transportResult) {
                    this._transportResult.reject("Connection stopped.");
                }
                break;
            }
            this._sendBufferedData = new PromiseSource();
            const transportResult = this._transportResult;
            this._transportResult = undefined;
            const data = typeof (this._buffer[0]) === "string" ?
                this._buffer.join("") :
                TransportSendQueue._concatBuffers(this._buffer);
            this._buffer.length = 0;
            try {
                await this._transport.send(data);
                transportResult.resolve();
            }
            catch (error) {
                transportResult.reject(error);
            }
        }
    }
    static _concatBuffers(arrayBuffers) {
        const totalLength = arrayBuffers.map((b) => b.byteLength).reduce((a, b) => a + b);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const item of arrayBuffers) {
            result.set(new Uint8Array(item), offset);
            offset += item.byteLength;
        }
        return result.buffer;
    }
}
class PromiseSource {
    constructor() {
        this.promise = new Promise((resolve, reject) => [this._resolver, this._rejecter] = [resolve, reject]);
    }
    resolve() {
        this._resolver();
    }
    reject(reason) {
        this._rejecter(reason);
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/TextMessageFormat.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// Not exported from index
/** @private */
class TextMessageFormat {
    static write(output) {
        return `${output}${TextMessageFormat.RecordSeparator}`;
    }
    static parse(input) {
        if (input[input.length - 1] !== TextMessageFormat.RecordSeparator) {
            throw new Error("Message is incomplete.");
        }
        const messages = input.split(TextMessageFormat.RecordSeparator);
        messages.pop();
        return messages;
    }
}
TextMessageFormat.RecordSeparatorCode = 0x1e;
TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HandshakeProtocol.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.


/** @private */
class HandshakeProtocol {
    // Handshake request is always JSON
    writeHandshakeRequest(handshakeRequest) {
        return TextMessageFormat.write(JSON.stringify(handshakeRequest));
    }
    parseHandshakeResponse(data) {
        let messageData;
        let remainingData;
        if (isArrayBuffer(data)) {
            // Format is binary but still need to read JSON text from handshake response
            const binaryData = new Uint8Array(data);
            const separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
            if (separatorIndex === -1) {
                throw new Error("Message is incomplete.");
            }
            // content before separator is handshake response
            // optional content after is additional messages
            const responseLength = separatorIndex + 1;
            messageData = String.fromCharCode.apply(null, Array.prototype.slice.call(binaryData.slice(0, responseLength)));
            remainingData = (binaryData.byteLength > responseLength) ? binaryData.slice(responseLength).buffer : null;
        }
        else {
            const textData = data;
            const separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
            if (separatorIndex === -1) {
                throw new Error("Message is incomplete.");
            }
            // content before separator is handshake response
            // optional content after is additional messages
            const responseLength = separatorIndex + 1;
            messageData = textData.substring(0, responseLength);
            remainingData = (textData.length > responseLength) ? textData.substring(responseLength) : null;
        }
        // At this point we should have just the single handshake message
        const messages = TextMessageFormat.parse(messageData);
        const response = JSON.parse(messages[0]);
        if (response.type) {
            throw new Error("Expected a handshake response from the server.");
        }
        const responseMessage = response;
        // multiple messages could have arrived with handshake
        // return additional data to be parsed as usual, or null if all parsed
        return [remainingData, responseMessage];
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/IHubProtocol.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
/** Defines the type of a Hub Message. */
var MessageType;
(function (MessageType) {
    /** Indicates the message is an Invocation message and implements the {@link @microsoft/signalr.InvocationMessage} interface. */
    MessageType[MessageType["Invocation"] = 1] = "Invocation";
    /** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
    MessageType[MessageType["StreamItem"] = 2] = "StreamItem";
    /** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
    MessageType[MessageType["Completion"] = 3] = "Completion";
    /** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
    MessageType[MessageType["StreamInvocation"] = 4] = "StreamInvocation";
    /** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
    MessageType[MessageType["CancelInvocation"] = 5] = "CancelInvocation";
    /** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
    MessageType[MessageType["Ping"] = 6] = "Ping";
    /** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
    MessageType[MessageType["Close"] = 7] = "Close";
    MessageType[MessageType["Ack"] = 8] = "Ack";
    MessageType[MessageType["Sequence"] = 9] = "Sequence";
})(MessageType || (MessageType = {}));
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/Subject.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

/** Stream implementation to stream items to the server. */
class Subject {
    constructor() {
        this.observers = [];
    }
    next(item) {
        for (const observer of this.observers) {
            observer.next(item);
        }
    }
    error(err) {
        for (const observer of this.observers) {
            if (observer.error) {
                observer.error(err);
            }
        }
    }
    complete() {
        for (const observer of this.observers) {
            if (observer.complete) {
                observer.complete();
            }
        }
    }
    subscribe(observer) {
        this.observers.push(observer);
        return new SubjectSubscription(this, observer);
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/MessageBuffer.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.


/** @private */
class MessageBuffer {
    constructor(protocol, connection, bufferSize) {
        this._bufferSize = 100000;
        this._messages = [];
        this._totalMessageCount = 0;
        this._waitForSequenceMessage = false;
        // Message IDs start at 1 and always increment by 1
        this._nextReceivingSequenceId = 1;
        this._latestReceivedSequenceId = 0;
        this._bufferedByteCount = 0;
        this._reconnectInProgress = false;
        this._protocol = protocol;
        this._connection = connection;
        this._bufferSize = bufferSize;
    }
    async _send(message) {
        const serializedMessage = this._protocol.writeMessage(message);
        let backpressurePromise = Promise.resolve();
        // Only count invocation messages. Acks, pings, etc. don't need to be resent on reconnect
        if (this._isInvocationMessage(message)) {
            this._totalMessageCount++;
            let backpressurePromiseResolver = () => { };
            let backpressurePromiseRejector = () => { };
            if (isArrayBuffer(serializedMessage)) {
                this._bufferedByteCount += serializedMessage.byteLength;
            }
            else {
                this._bufferedByteCount += serializedMessage.length;
            }
            if (this._bufferedByteCount >= this._bufferSize) {
                backpressurePromise = new Promise((resolve, reject) => {
                    backpressurePromiseResolver = resolve;
                    backpressurePromiseRejector = reject;
                });
            }
            this._messages.push(new BufferedItem(serializedMessage, this._totalMessageCount, backpressurePromiseResolver, backpressurePromiseRejector));
        }
        try {
            // If this is set it means we are reconnecting or resending
            // We don't want to send on a disconnected connection
            // And we don't want to send if resend is running since that would mean sending
            // this message twice
            if (!this._reconnectInProgress) {
                await this._connection.send(serializedMessage);
            }
        }
        catch {
            this._disconnected();
        }
        await backpressurePromise;
    }
    _ack(ackMessage) {
        let newestAckedMessage = -1;
        // Find index of newest message being acked
        for (let index = 0; index < this._messages.length; index++) {
            const element = this._messages[index];
            if (element._id <= ackMessage.sequenceId) {
                newestAckedMessage = index;
                if (isArrayBuffer(element._message)) {
                    this._bufferedByteCount -= element._message.byteLength;
                }
                else {
                    this._bufferedByteCount -= element._message.length;
                }
                // resolve items that have already been sent and acked
                element._resolver();
            }
            else if (this._bufferedByteCount < this._bufferSize) {
                // resolve items that now fall under the buffer limit but haven't been acked
                element._resolver();
            }
            else {
                break;
            }
        }
        if (newestAckedMessage !== -1) {
            // We're removing everything including the message pointed to, so add 1
            this._messages = this._messages.slice(newestAckedMessage + 1);
        }
    }
    _shouldProcessMessage(message) {
        if (this._waitForSequenceMessage) {
            if (message.type !== MessageType.Sequence) {
                return false;
            }
            else {
                this._waitForSequenceMessage = false;
                return true;
            }
        }
        // No special processing for acks, pings, etc.
        if (!this._isInvocationMessage(message)) {
            return true;
        }
        const currentId = this._nextReceivingSequenceId;
        this._nextReceivingSequenceId++;
        if (currentId <= this._latestReceivedSequenceId) {
            if (currentId === this._latestReceivedSequenceId) {
                // Should only hit this if we just reconnected and the server is sending
                // Messages it has buffered, which would mean it hasn't seen an Ack for these messages
                this._ackTimer();
            }
            // Ignore, this is a duplicate message
            return false;
        }
        this._latestReceivedSequenceId = currentId;
        // Only start the timer for sending an Ack message when we have a message to ack. This also conveniently solves
        // timer throttling by not having a recursive timer, and by starting the timer via a network call (recv)
        this._ackTimer();
        return true;
    }
    _resetSequence(message) {
        if (message.sequenceId > this._nextReceivingSequenceId) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._connection.stop(new Error("Sequence ID greater than amount of messages we've received."));
            return;
        }
        this._nextReceivingSequenceId = message.sequenceId;
    }
    _disconnected() {
        this._reconnectInProgress = true;
        this._waitForSequenceMessage = true;
    }
    async _resend() {
        const sequenceId = this._messages.length !== 0
            ? this._messages[0]._id
            : this._totalMessageCount + 1;
        await this._connection.send(this._protocol.writeMessage({ type: MessageType.Sequence, sequenceId }));
        // Get a local variable to the _messages, just in case messages are acked while resending
        // Which would slice the _messages array (which creates a new copy)
        const messages = this._messages;
        for (const element of messages) {
            await this._connection.send(element._message);
        }
        this._reconnectInProgress = false;
    }
    _dispose(error) {
        error !== null && error !== void 0 ? error : (error = new Error("Unable to reconnect to server."));
        // Unblock backpressure if any
        for (const element of this._messages) {
            element._rejector(error);
        }
    }
    _isInvocationMessage(message) {
        // There is no way to check if something implements an interface.
        // So we individually check the messages in a switch statement.
        // To make sure we don't miss any message types we rely on the compiler
        // seeing the function returns a value and it will do the
        // exhaustive check for us on the switch statement, since we don't use 'case default'
        switch (message.type) {
            case MessageType.Invocation:
            case MessageType.StreamItem:
            case MessageType.Completion:
            case MessageType.StreamInvocation:
            case MessageType.CancelInvocation:
                return true;
            case MessageType.Close:
            case MessageType.Sequence:
            case MessageType.Ping:
            case MessageType.Ack:
                return false;
        }
    }
    _ackTimer() {
        if (this._ackTimerHandle === undefined) {
            this._ackTimerHandle = setTimeout(async () => {
                try {
                    if (!this._reconnectInProgress) {
                        await this._connection.send(this._protocol.writeMessage({ type: MessageType.Ack, sequenceId: this._latestReceivedSequenceId }));
                    }
                    // Ignore errors, that means the connection is closed and we don't care about the Ack message anymore.
                }
                catch { }
                clearTimeout(this._ackTimerHandle);
                this._ackTimerHandle = undefined;
                // 1 second delay so we don't spam Ack messages if there are many messages being received at once.
            }, 1000);
        }
    }
}
class BufferedItem {
    constructor(message, id, resolver, rejector) {
        this._message = message;
        this._id = id;
        this._resolver = resolver;
        this._rejector = rejector;
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HubConnection.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.







const DEFAULT_TIMEOUT_IN_MS = 30 * 1000;
const DEFAULT_PING_INTERVAL_IN_MS = 15 * 1000;
const DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE = 100000;
/** Describes the current state of the {@link HubConnection} to the server. */
var HubConnectionState;
(function (HubConnectionState) {
    /** The hub connection is disconnected. */
    HubConnectionState["Disconnected"] = "Disconnected";
    /** The hub connection is connecting. */
    HubConnectionState["Connecting"] = "Connecting";
    /** The hub connection is connected. */
    HubConnectionState["Connected"] = "Connected";
    /** The hub connection is disconnecting. */
    HubConnectionState["Disconnecting"] = "Disconnecting";
    /** The hub connection is reconnecting. */
    HubConnectionState["Reconnecting"] = "Reconnecting";
})(HubConnectionState || (HubConnectionState = {}));
/** Represents a connection to a SignalR Hub. */
class HubConnection {
    /** @internal */
    // Using a public static factory method means we can have a private constructor and an _internal_
    // create method that can be used by HubConnectionBuilder. An "internal" constructor would just
    // be stripped away and the '.d.ts' file would have no constructor, which is interpreted as a
    // public parameter-less constructor.
    static create(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
        return new HubConnection(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize);
    }
    constructor(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
        this._nextKeepAlive = 0;
        this._freezeEventListener = () => {
            this._logger.log(LogLevel.Warning, "The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep");
        };
        Arg.isRequired(connection, "connection");
        Arg.isRequired(logger, "logger");
        Arg.isRequired(protocol, "protocol");
        this.serverTimeoutInMilliseconds = serverTimeoutInMilliseconds !== null && serverTimeoutInMilliseconds !== void 0 ? serverTimeoutInMilliseconds : DEFAULT_TIMEOUT_IN_MS;
        this.keepAliveIntervalInMilliseconds = keepAliveIntervalInMilliseconds !== null && keepAliveIntervalInMilliseconds !== void 0 ? keepAliveIntervalInMilliseconds : DEFAULT_PING_INTERVAL_IN_MS;
        this._statefulReconnectBufferSize = statefulReconnectBufferSize !== null && statefulReconnectBufferSize !== void 0 ? statefulReconnectBufferSize : DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE;
        this._logger = logger;
        this._protocol = protocol;
        this.connection = connection;
        this._reconnectPolicy = reconnectPolicy;
        this._handshakeProtocol = new HandshakeProtocol();
        this.connection.onreceive = (data) => this._processIncomingData(data);
        this.connection.onclose = (error) => this._connectionClosed(error);
        this._callbacks = {};
        this._methods = {};
        this._closedCallbacks = [];
        this._reconnectingCallbacks = [];
        this._reconnectedCallbacks = [];
        this._invocationId = 0;
        this._receivedHandshakeResponse = false;
        this._connectionState = HubConnectionState.Disconnected;
        this._connectionStarted = false;
        this._cachedPingMessage = this._protocol.writeMessage({ type: MessageType.Ping });
    }
    /** Indicates the state of the {@link HubConnection} to the server. */
    get state() {
        return this._connectionState;
    }
    /** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
     *  in the disconnected state or if the negotiation step was skipped.
     */
    get connectionId() {
        return this.connection ? (this.connection.connectionId || null) : null;
    }
    /** Indicates the url of the {@link HubConnection} to the server. */
    get baseUrl() {
        return this.connection.baseUrl || "";
    }
    /**
     * Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
     * Reconnecting states.
     * @param {string} url The url to connect to.
     */
    set baseUrl(url) {
        if (this._connectionState !== HubConnectionState.Disconnected && this._connectionState !== HubConnectionState.Reconnecting) {
            throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
        }
        if (!url) {
            throw new Error("The HubConnection url must be a valid url.");
        }
        this.connection.baseUrl = url;
    }
    /** Starts the connection.
     *
     * @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
     */
    start() {
        this._startPromise = this._startWithStateTransitions();
        return this._startPromise;
    }
    async _startWithStateTransitions() {
        if (this._connectionState !== HubConnectionState.Disconnected) {
            return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
        }
        this._connectionState = HubConnectionState.Connecting;
        this._logger.log(LogLevel.Debug, "Starting HubConnection.");
        try {
            await this._startInternal();
            if (Platform.isBrowser) {
                // Log when the browser freezes the tab so users know why their connection unexpectedly stopped working
                window.document.addEventListener("freeze", this._freezeEventListener);
            }
            this._connectionState = HubConnectionState.Connected;
            this._connectionStarted = true;
            this._logger.log(LogLevel.Debug, "HubConnection connected successfully.");
        }
        catch (e) {
            this._connectionState = HubConnectionState.Disconnected;
            this._logger.log(LogLevel.Debug, `HubConnection failed to start successfully because of error '${e}'.`);
            return Promise.reject(e);
        }
    }
    async _startInternal() {
        this._stopDuringStartError = undefined;
        this._receivedHandshakeResponse = false;
        // Set up the promise before any connection is (re)started otherwise it could race with received messages
        const handshakePromise = new Promise((resolve, reject) => {
            this._handshakeResolver = resolve;
            this._handshakeRejecter = reject;
        });
        await this.connection.start(this._protocol.transferFormat);
        try {
            let version = this._protocol.version;
            if (!this.connection.features.reconnect) {
                // Stateful Reconnect starts with HubProtocol version 2, newer clients connecting to older servers will fail to connect due to
                // the handshake only supporting version 1, so we will try to send version 1 during the handshake to keep old servers working.
                version = 1;
            }
            const handshakeRequest = {
                protocol: this._protocol.name,
                version,
            };
            this._logger.log(LogLevel.Debug, "Sending handshake request.");
            await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(handshakeRequest));
            this._logger.log(LogLevel.Information, `Using HubProtocol '${this._protocol.name}'.`);
            // defensively cleanup timeout in case we receive a message from the server before we finish start
            this._cleanupTimeout();
            this._resetTimeoutPeriod();
            this._resetKeepAliveInterval();
            await handshakePromise;
            // It's important to check the stopDuringStartError instead of just relying on the handshakePromise
            // being rejected on close, because this continuation can run after both the handshake completed successfully
            // and the connection was closed.
            if (this._stopDuringStartError) {
                // It's important to throw instead of returning a rejected promise, because we don't want to allow any state
                // transitions to occur between now and the calling code observing the exceptions. Returning a rejected promise
                // will cause the calling continuation to get scheduled to run later.
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                throw this._stopDuringStartError;
            }
            const useStatefulReconnect = this.connection.features.reconnect || false;
            if (useStatefulReconnect) {
                this._messageBuffer = new MessageBuffer(this._protocol, this.connection, this._statefulReconnectBufferSize);
                this.connection.features.disconnected = this._messageBuffer._disconnected.bind(this._messageBuffer);
                this.connection.features.resend = () => {
                    if (this._messageBuffer) {
                        return this._messageBuffer._resend();
                    }
                };
            }
            if (!this.connection.features.inherentKeepAlive) {
                await this._sendMessage(this._cachedPingMessage);
            }
        }
        catch (e) {
            this._logger.log(LogLevel.Debug, `Hub handshake failed with error '${e}' during start(). Stopping HubConnection.`);
            this._cleanupTimeout();
            this._cleanupPingTimer();
            // HttpConnection.stop() should not complete until after the onclose callback is invoked.
            // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
            await this.connection.stop(e);
            throw e;
        }
    }
    /** Stops the connection.
     *
     * @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
     */
    async stop() {
        // Capture the start promise before the connection might be restarted in an onclose callback.
        const startPromise = this._startPromise;
        this.connection.features.reconnect = false;
        this._stopPromise = this._stopInternal();
        await this._stopPromise;
        try {
            // Awaiting undefined continues immediately
            await startPromise;
        }
        catch (e) {
            // This exception is returned to the user as a rejected Promise from the start method.
        }
    }
    _stopInternal(error) {
        if (this._connectionState === HubConnectionState.Disconnected) {
            this._logger.log(LogLevel.Debug, `Call to HubConnection.stop(${error}) ignored because it is already in the disconnected state.`);
            return Promise.resolve();
        }
        if (this._connectionState === HubConnectionState.Disconnecting) {
            this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
            return this._stopPromise;
        }
        const state = this._connectionState;
        this._connectionState = HubConnectionState.Disconnecting;
        this._logger.log(LogLevel.Debug, "Stopping HubConnection.");
        if (this._reconnectDelayHandle) {
            // We're in a reconnect delay which means the underlying connection is currently already stopped.
            // Just clear the handle to stop the reconnect loop (which no one is waiting on thankfully) and
            // fire the onclose callbacks.
            this._logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
            clearTimeout(this._reconnectDelayHandle);
            this._reconnectDelayHandle = undefined;
            this._completeClose();
            return Promise.resolve();
        }
        if (state === HubConnectionState.Connected) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._sendCloseMessage();
        }
        this._cleanupTimeout();
        this._cleanupPingTimer();
        this._stopDuringStartError = error || new AbortError("The connection was stopped before the hub handshake could complete.");
        // HttpConnection.stop() should not complete until after either HttpConnection.start() fails
        // or the onclose callback is invoked. The onclose callback will transition the HubConnection
        // to the disconnected state if need be before HttpConnection.stop() completes.
        return this.connection.stop(error);
    }
    async _sendCloseMessage() {
        try {
            await this._sendWithProtocol(this._createCloseMessage());
        }
        catch {
            // Ignore, this is a best effort attempt to let the server know the client closed gracefully.
        }
    }
    /** Invokes a streaming hub method on the server using the specified name and arguments.
     *
     * @typeparam T The type of the items returned by the server.
     * @param {string} methodName The name of the server method to invoke.
     * @param {any[]} args The arguments used to invoke the server method.
     * @returns {IStreamResult<T>} An object that yields results from the server as they are received.
     */
    stream(methodName, ...args) {
        const [streams, streamIds] = this._replaceStreamingParams(args);
        const invocationDescriptor = this._createStreamInvocation(methodName, args, streamIds);
        // eslint-disable-next-line prefer-const
        let promiseQueue;
        const subject = new Subject();
        subject.cancelCallback = () => {
            const cancelInvocation = this._createCancelInvocation(invocationDescriptor.invocationId);
            delete this._callbacks[invocationDescriptor.invocationId];
            return promiseQueue.then(() => {
                return this._sendWithProtocol(cancelInvocation);
            });
        };
        this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
            if (error) {
                subject.error(error);
                return;
            }
            else if (invocationEvent) {
                // invocationEvent will not be null when an error is not passed to the callback
                if (invocationEvent.type === MessageType.Completion) {
                    if (invocationEvent.error) {
                        subject.error(new Error(invocationEvent.error));
                    }
                    else {
                        subject.complete();
                    }
                }
                else {
                    subject.next((invocationEvent.item));
                }
            }
        };
        promiseQueue = this._sendWithProtocol(invocationDescriptor)
            .catch((e) => {
            subject.error(e);
            delete this._callbacks[invocationDescriptor.invocationId];
        });
        this._launchStreams(streams, promiseQueue);
        return subject;
    }
    _sendMessage(message) {
        this._resetKeepAliveInterval();
        return this.connection.send(message);
    }
    /**
     * Sends a js object to the server.
     * @param message The js object to serialize and send.
     */
    _sendWithProtocol(message) {
        if (this._messageBuffer) {
            return this._messageBuffer._send(message);
        }
        else {
            return this._sendMessage(this._protocol.writeMessage(message));
        }
    }
    /** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
     *
     * The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
     * be processing the invocation.
     *
     * @param {string} methodName The name of the server method to invoke.
     * @param {any[]} args The arguments used to invoke the server method.
     * @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
     */
    send(methodName, ...args) {
        const [streams, streamIds] = this._replaceStreamingParams(args);
        const sendPromise = this._sendWithProtocol(this._createInvocation(methodName, args, true, streamIds));
        this._launchStreams(streams, sendPromise);
        return sendPromise;
    }
    /** Invokes a hub method on the server using the specified name and arguments.
     *
     * The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
     * resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
     * resolving the Promise.
     *
     * @typeparam T The expected return type.
     * @param {string} methodName The name of the server method to invoke.
     * @param {any[]} args The arguments used to invoke the server method.
     * @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
     */
    invoke(methodName, ...args) {
        const [streams, streamIds] = this._replaceStreamingParams(args);
        const invocationDescriptor = this._createInvocation(methodName, args, false, streamIds);
        const p = new Promise((resolve, reject) => {
            // invocationId will always have a value for a non-blocking invocation
            this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
                if (error) {
                    reject(error);
                    return;
                }
                else if (invocationEvent) {
                    // invocationEvent will not be null when an error is not passed to the callback
                    if (invocationEvent.type === MessageType.Completion) {
                        if (invocationEvent.error) {
                            reject(new Error(invocationEvent.error));
                        }
                        else {
                            resolve(invocationEvent.result);
                        }
                    }
                    else {
                        reject(new Error(`Unexpected message type: ${invocationEvent.type}`));
                    }
                }
            };
            const promiseQueue = this._sendWithProtocol(invocationDescriptor)
                .catch((e) => {
                reject(e);
                // invocationId will always have a value for a non-blocking invocation
                delete this._callbacks[invocationDescriptor.invocationId];
            });
            this._launchStreams(streams, promiseQueue);
        });
        return p;
    }
    on(methodName, newMethod) {
        if (!methodName || !newMethod) {
            return;
        }
        methodName = methodName.toLowerCase();
        if (!this._methods[methodName]) {
            this._methods[methodName] = [];
        }
        // Preventing adding the same handler multiple times.
        if (this._methods[methodName].indexOf(newMethod) !== -1) {
            return;
        }
        this._methods[methodName].push(newMethod);
    }
    off(methodName, method) {
        if (!methodName) {
            return;
        }
        methodName = methodName.toLowerCase();
        const handlers = this._methods[methodName];
        if (!handlers) {
            return;
        }
        if (method) {
            const removeIdx = handlers.indexOf(method);
            if (removeIdx !== -1) {
                handlers.splice(removeIdx, 1);
                if (handlers.length === 0) {
                    delete this._methods[methodName];
                }
            }
        }
        else {
            delete this._methods[methodName];
        }
    }
    /** Registers a handler that will be invoked when the connection is closed.
     *
     * @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
     */
    onclose(callback) {
        if (callback) {
            this._closedCallbacks.push(callback);
        }
    }
    /** Registers a handler that will be invoked when the connection starts reconnecting.
     *
     * @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
     */
    onreconnecting(callback) {
        if (callback) {
            this._reconnectingCallbacks.push(callback);
        }
    }
    /** Registers a handler that will be invoked when the connection successfully reconnects.
     *
     * @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
     */
    onreconnected(callback) {
        if (callback) {
            this._reconnectedCallbacks.push(callback);
        }
    }
    _processIncomingData(data) {
        this._cleanupTimeout();
        if (!this._receivedHandshakeResponse) {
            data = this._processHandshakeResponse(data);
            this._receivedHandshakeResponse = true;
        }
        // Data may have all been read when processing handshake response
        if (data) {
            // Parse the messages
            const messages = this._protocol.parseMessages(data, this._logger);
            for (const message of messages) {
                if (this._messageBuffer && !this._messageBuffer._shouldProcessMessage(message)) {
                    // Don't process the message, we are either waiting for a SequenceMessage or received a duplicate message
                    continue;
                }
                switch (message.type) {
                    case MessageType.Invocation:
                        this._invokeClientMethod(message)
                            .catch((e) => {
                            this._logger.log(LogLevel.Error, `Invoke client method threw error: ${getErrorString(e)}`);
                        });
                        break;
                    case MessageType.StreamItem:
                    case MessageType.Completion: {
                        const callback = this._callbacks[message.invocationId];
                        if (callback) {
                            if (message.type === MessageType.Completion) {
                                delete this._callbacks[message.invocationId];
                            }
                            try {
                                callback(message);
                            }
                            catch (e) {
                                this._logger.log(LogLevel.Error, `Stream callback threw error: ${getErrorString(e)}`);
                            }
                        }
                        break;
                    }
                    case MessageType.Ping:
                        // Don't care about pings
                        break;
                    case MessageType.Close: {
                        this._logger.log(LogLevel.Information, "Close message received from server.");
                        const error = message.error ? new Error("Server returned an error on close: " + message.error) : undefined;
                        if (message.allowReconnect === true) {
                            // It feels wrong not to await connection.stop() here, but processIncomingData is called as part of an onreceive callback which is not async,
                            // this is already the behavior for serverTimeout(), and HttpConnection.Stop() should catch and log all possible exceptions.
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            this.connection.stop(error);
                        }
                        else {
                            // We cannot await stopInternal() here, but subsequent calls to stop() will await this if stopInternal() is still ongoing.
                            this._stopPromise = this._stopInternal(error);
                        }
                        break;
                    }
                    case MessageType.Ack:
                        if (this._messageBuffer) {
                            this._messageBuffer._ack(message);
                        }
                        break;
                    case MessageType.Sequence:
                        if (this._messageBuffer) {
                            this._messageBuffer._resetSequence(message);
                        }
                        break;
                    default:
                        this._logger.log(LogLevel.Warning, `Invalid message type: ${message.type}.`);
                        break;
                }
            }
        }
        this._resetTimeoutPeriod();
    }
    _processHandshakeResponse(data) {
        let responseMessage;
        let remainingData;
        try {
            [remainingData, responseMessage] = this._handshakeProtocol.parseHandshakeResponse(data);
        }
        catch (e) {
            const message = "Error parsing handshake response: " + e;
            this._logger.log(LogLevel.Error, message);
            const error = new Error(message);
            this._handshakeRejecter(error);
            throw error;
        }
        if (responseMessage.error) {
            const message = "Server returned handshake error: " + responseMessage.error;
            this._logger.log(LogLevel.Error, message);
            const error = new Error(message);
            this._handshakeRejecter(error);
            throw error;
        }
        else {
            this._logger.log(LogLevel.Debug, "Server handshake complete.");
        }
        this._handshakeResolver();
        return remainingData;
    }
    _resetKeepAliveInterval() {
        if (this.connection.features.inherentKeepAlive) {
            return;
        }
        // Set the time we want the next keep alive to be sent
        // Timer will be setup on next message receive
        this._nextKeepAlive = new Date().getTime() + this.keepAliveIntervalInMilliseconds;
        this._cleanupPingTimer();
    }
    _resetTimeoutPeriod() {
        if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
            // Set the timeout timer
            this._timeoutHandle = setTimeout(() => this.serverTimeout(), this.serverTimeoutInMilliseconds);
            // Set keepAlive timer if there isn't one
            if (this._pingServerHandle === undefined) {
                let nextPing = this._nextKeepAlive - new Date().getTime();
                if (nextPing < 0) {
                    nextPing = 0;
                }
                // The timer needs to be set from a networking callback to avoid Chrome timer throttling from causing timers to run once a minute
                this._pingServerHandle = setTimeout(async () => {
                    if (this._connectionState === HubConnectionState.Connected) {
                        try {
                            await this._sendMessage(this._cachedPingMessage);
                        }
                        catch {
                            // We don't care about the error. It should be seen elsewhere in the client.
                            // The connection is probably in a bad or closed state now, cleanup the timer so it stops triggering
                            this._cleanupPingTimer();
                        }
                    }
                }, nextPing);
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    serverTimeout() {
        // The server hasn't talked to us in a while. It doesn't like us anymore ... :(
        // Terminate the connection, but we don't need to wait on the promise. This could trigger reconnecting.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
    }
    async _invokeClientMethod(invocationMessage) {
        const methodName = invocationMessage.target.toLowerCase();
        const methods = this._methods[methodName];
        if (!methods) {
            this._logger.log(LogLevel.Warning, `No client method with the name '${methodName}' found.`);
            // No handlers provided by client but the server is expecting a response still, so we send an error
            if (invocationMessage.invocationId) {
                this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                await this._sendWithProtocol(this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null));
            }
            return;
        }
        // Avoid issues with handlers removing themselves thus modifying the list while iterating through it
        const methodsCopy = methods.slice();
        // Server expects a response
        const expectsResponse = invocationMessage.invocationId ? true : false;
        // We preserve the last result or exception but still call all handlers
        let res;
        let exception;
        let completionMessage;
        for (const m of methodsCopy) {
            try {
                const prevRes = res;
                res = await m.apply(this, invocationMessage.arguments);
                if (expectsResponse && res && prevRes) {
                    this._logger.log(LogLevel.Error, `Multiple results provided for '${methodName}'. Sending error to server.`);
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `Client provided multiple results.`, null);
                }
                // Ignore exception if we got a result after, the exception will be logged
                exception = undefined;
            }
            catch (e) {
                exception = e;
                this._logger.log(LogLevel.Error, `A callback for the method '${methodName}' threw error '${e}'.`);
            }
        }
        if (completionMessage) {
            await this._sendWithProtocol(completionMessage);
        }
        else if (expectsResponse) {
            // If there is an exception that means either no result was given or a handler after a result threw
            if (exception) {
                completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `${exception}`, null);
            }
            else if (res !== undefined) {
                completionMessage = this._createCompletionMessage(invocationMessage.invocationId, null, res);
            }
            else {
                this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                // Client didn't provide a result or throw from a handler, server expects a response so we send an error
                completionMessage = this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null);
            }
            await this._sendWithProtocol(completionMessage);
        }
        else {
            if (res) {
                this._logger.log(LogLevel.Error, `Result given for '${methodName}' method but server is not expecting a result.`);
            }
        }
    }
    _connectionClosed(error) {
        this._logger.log(LogLevel.Debug, `HubConnection.connectionClosed(${error}) called while in state ${this._connectionState}.`);
        // Triggering this.handshakeRejecter is insufficient because it could already be resolved without the continuation having run yet.
        this._stopDuringStartError = this._stopDuringStartError || error || new AbortError("The underlying connection was closed before the hub handshake could complete.");
        // If the handshake is in progress, start will be waiting for the handshake promise, so we complete it.
        // If it has already completed, this should just noop.
        if (this._handshakeResolver) {
            this._handshakeResolver();
        }
        this._cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));
        this._cleanupTimeout();
        this._cleanupPingTimer();
        if (this._connectionState === HubConnectionState.Disconnecting) {
            this._completeClose(error);
        }
        else if (this._connectionState === HubConnectionState.Connected && this._reconnectPolicy) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._reconnect(error);
        }
        else if (this._connectionState === HubConnectionState.Connected) {
            this._completeClose(error);
        }
        // If none of the above if conditions were true were called the HubConnection must be in either:
        // 1. The Connecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail it.
        // 2. The Reconnecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail the current reconnect attempt
        //    and potentially continue the reconnect() loop.
        // 3. The Disconnected state in which case we're already done.
    }
    _completeClose(error) {
        if (this._connectionStarted) {
            this._connectionState = HubConnectionState.Disconnected;
            this._connectionStarted = false;
            if (this._messageBuffer) {
                this._messageBuffer._dispose(error !== null && error !== void 0 ? error : new Error("Connection closed."));
                this._messageBuffer = undefined;
            }
            if (Platform.isBrowser) {
                window.document.removeEventListener("freeze", this._freezeEventListener);
            }
            try {
                this._closedCallbacks.forEach((c) => c.apply(this, [error]));
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `An onclose callback called with error '${error}' threw error '${e}'.`);
            }
        }
    }
    async _reconnect(error) {
        const reconnectStartTime = Date.now();
        let previousReconnectAttempts = 0;
        let retryError = error !== undefined ? error : new Error("Attempting to reconnect due to a unknown error.");
        let nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, 0, retryError);
        if (nextRetryDelay === null) {
            this._logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
            this._completeClose(error);
            return;
        }
        this._connectionState = HubConnectionState.Reconnecting;
        if (error) {
            this._logger.log(LogLevel.Information, `Connection reconnecting because of error '${error}'.`);
        }
        else {
            this._logger.log(LogLevel.Information, "Connection reconnecting.");
        }
        if (this._reconnectingCallbacks.length !== 0) {
            try {
                this._reconnectingCallbacks.forEach((c) => c.apply(this, [error]));
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `An onreconnecting callback called with error '${error}' threw error '${e}'.`);
            }
            // Exit early if an onreconnecting callback called connection.stop().
            if (this._connectionState !== HubConnectionState.Reconnecting) {
                this._logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
                return;
            }
        }
        while (nextRetryDelay !== null) {
            this._logger.log(LogLevel.Information, `Reconnect attempt number ${previousReconnectAttempts} will start in ${nextRetryDelay} ms.`);
            await new Promise((resolve) => {
                this._reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
            });
            this._reconnectDelayHandle = undefined;
            if (this._connectionState !== HubConnectionState.Reconnecting) {
                this._logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
                return;
            }
            try {
                await this._startInternal();
                this._connectionState = HubConnectionState.Connected;
                this._logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
                if (this._reconnectedCallbacks.length !== 0) {
                    try {
                        this._reconnectedCallbacks.forEach((c) => c.apply(this, [this.connection.connectionId]));
                    }
                    catch (e) {
                        this._logger.log(LogLevel.Error, `An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${e}'.`);
                    }
                }
                return;
            }
            catch (e) {
                this._logger.log(LogLevel.Information, `Reconnect attempt failed because of error '${e}'.`);
                if (this._connectionState !== HubConnectionState.Reconnecting) {
                    this._logger.log(LogLevel.Debug, `Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`);
                    // The TypeScript compiler thinks that connectionState must be Connected here. The TypeScript compiler is wrong.
                    if (this._connectionState === HubConnectionState.Disconnecting) {
                        this._completeClose();
                    }
                    return;
                }
                retryError = e instanceof Error ? e : new Error(e.toString());
                nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, Date.now() - reconnectStartTime, retryError);
            }
        }
        this._logger.log(LogLevel.Information, `Reconnect retries have been exhausted after ${Date.now() - reconnectStartTime} ms and ${previousReconnectAttempts} failed attempts. Connection disconnecting.`);
        this._completeClose();
    }
    _getNextRetryDelay(previousRetryCount, elapsedMilliseconds, retryReason) {
        try {
            return this._reconnectPolicy.nextRetryDelayInMilliseconds({
                elapsedMilliseconds,
                previousRetryCount,
                retryReason,
            });
        }
        catch (e) {
            this._logger.log(LogLevel.Error, `IRetryPolicy.nextRetryDelayInMilliseconds(${previousRetryCount}, ${elapsedMilliseconds}) threw error '${e}'.`);
            return null;
        }
    }
    _cancelCallbacksWithError(error) {
        const callbacks = this._callbacks;
        this._callbacks = {};
        Object.keys(callbacks)
            .forEach((key) => {
            const callback = callbacks[key];
            try {
                callback(null, error);
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `Stream 'error' callback called with '${error}' threw error: ${getErrorString(e)}`);
            }
        });
    }
    _cleanupPingTimer() {
        if (this._pingServerHandle) {
            clearTimeout(this._pingServerHandle);
            this._pingServerHandle = undefined;
        }
    }
    _cleanupTimeout() {
        if (this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
        }
    }
    _createInvocation(methodName, args, nonblocking, streamIds) {
        if (nonblocking) {
            if (streamIds.length !== 0) {
                return {
                    target: methodName,
                    arguments: args,
                    streamIds,
                    type: MessageType.Invocation,
                };
            }
            else {
                return {
                    target: methodName,
                    arguments: args,
                    type: MessageType.Invocation,
                };
            }
        }
        else {
            const invocationId = this._invocationId;
            this._invocationId++;
            if (streamIds.length !== 0) {
                return {
                    target: methodName,
                    arguments: args,
                    invocationId: invocationId.toString(),
                    streamIds,
                    type: MessageType.Invocation,
                };
            }
            else {
                return {
                    target: methodName,
                    arguments: args,
                    invocationId: invocationId.toString(),
                    type: MessageType.Invocation,
                };
            }
        }
    }
    _launchStreams(streams, promiseQueue) {
        if (streams.length === 0) {
            return;
        }
        // Synchronize stream data so they arrive in-order on the server
        if (!promiseQueue) {
            promiseQueue = Promise.resolve();
        }
        // We want to iterate over the keys, since the keys are the stream ids
        // eslint-disable-next-line guard-for-in
        for (const streamId in streams) {
            streams[streamId].subscribe({
                complete: () => {
                    promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId)));
                },
                error: (err) => {
                    let message;
                    if (err instanceof Error) {
                        message = err.message;
                    }
                    else if (err && err.toString) {
                        message = err.toString();
                    }
                    else {
                        message = "Unknown error";
                    }
                    promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId, message)));
                },
                next: (item) => {
                    promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createStreamItemMessage(streamId, item)));
                },
            });
        }
    }
    _replaceStreamingParams(args) {
        const streams = [];
        const streamIds = [];
        for (let i = 0; i < args.length; i++) {
            const argument = args[i];
            if (this._isObservable(argument)) {
                const streamId = this._invocationId;
                this._invocationId++;
                // Store the stream for later use
                streams[streamId] = argument;
                streamIds.push(streamId.toString());
                // remove stream from args
                args.splice(i, 1);
            }
        }
        return [streams, streamIds];
    }
    _isObservable(arg) {
        // This allows other stream implementations to just work (like rxjs)
        return arg && arg.subscribe && typeof arg.subscribe === "function";
    }
    _createStreamInvocation(methodName, args, streamIds) {
        const invocationId = this._invocationId;
        this._invocationId++;
        if (streamIds.length !== 0) {
            return {
                target: methodName,
                arguments: args,
                invocationId: invocationId.toString(),
                streamIds,
                type: MessageType.StreamInvocation,
            };
        }
        else {
            return {
                target: methodName,
                arguments: args,
                invocationId: invocationId.toString(),
                type: MessageType.StreamInvocation,
            };
        }
    }
    _createCancelInvocation(id) {
        return {
            invocationId: id,
            type: MessageType.CancelInvocation,
        };
    }
    _createStreamItemMessage(id, item) {
        return {
            invocationId: id,
            item,
            type: MessageType.StreamItem,
        };
    }
    _createCompletionMessage(id, error, result) {
        if (error) {
            return {
                error,
                invocationId: id,
                type: MessageType.Completion,
            };
        }
        return {
            invocationId: id,
            result,
            type: MessageType.Completion,
        };
    }
    _createCloseMessage() {
        return { type: MessageType.Close };
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/JsonHubProtocol.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.





const JSON_HUB_PROTOCOL_NAME = "json";
/** Implements the JSON Hub Protocol. */
class JsonHubProtocol {
    constructor() {
        /** @inheritDoc */
        this.name = JSON_HUB_PROTOCOL_NAME;
        /** @inheritDoc */
        this.version = 2;
        /** @inheritDoc */
        this.transferFormat = TransferFormat.Text;
    }
    /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
     *
     * @param {string} input A string containing the serialized representation.
     * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
     */
    parseMessages(input, logger) {
        // The interface does allow "ArrayBuffer" to be passed in, but this implementation does not. So let's throw a useful error.
        if (typeof input !== "string") {
            throw new Error("Invalid input for JSON hub protocol. Expected a string.");
        }
        if (!input) {
            return [];
        }
        if (logger === null) {
            logger = NullLogger.instance;
        }
        // Parse the messages
        const messages = TextMessageFormat.parse(input);
        const hubMessages = [];
        for (const message of messages) {
            const parsedMessage = JSON.parse(message);
            if (typeof parsedMessage.type !== "number") {
                throw new Error("Invalid payload.");
            }
            switch (parsedMessage.type) {
                case MessageType.Invocation:
                    this._isInvocationMessage(parsedMessage);
                    break;
                case MessageType.StreamItem:
                    this._isStreamItemMessage(parsedMessage);
                    break;
                case MessageType.Completion:
                    this._isCompletionMessage(parsedMessage);
                    break;
                case MessageType.Ping:
                    // Single value, no need to validate
                    break;
                case MessageType.Close:
                    // All optional values, no need to validate
                    break;
                case MessageType.Ack:
                    this._isAckMessage(parsedMessage);
                    break;
                case MessageType.Sequence:
                    this._isSequenceMessage(parsedMessage);
                    break;
                default:
                    // Future protocol changes can add message types, old clients can ignore them
                    logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
                    continue;
            }
            hubMessages.push(parsedMessage);
        }
        return hubMessages;
    }
    /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
     *
     * @param {HubMessage} message The message to write.
     * @returns {string} A string containing the serialized representation of the message.
     */
    writeMessage(message) {
        return TextMessageFormat.write(JSON.stringify(message));
    }
    _isInvocationMessage(message) {
        this._assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
        if (message.invocationId !== undefined) {
            this._assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
        }
    }
    _isStreamItemMessage(message) {
        this._assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
        if (message.item === undefined) {
            throw new Error("Invalid payload for StreamItem message.");
        }
    }
    _isCompletionMessage(message) {
        if (message.result && message.error) {
            throw new Error("Invalid payload for Completion message.");
        }
        if (!message.result && message.error) {
            this._assertNotEmptyString(message.error, "Invalid payload for Completion message.");
        }
        this._assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
    }
    _isAckMessage(message) {
        if (typeof message.sequenceId !== 'number') {
            throw new Error("Invalid SequenceId for Ack message.");
        }
    }
    _isSequenceMessage(message) {
        if (typeof message.sequenceId !== 'number') {
            throw new Error("Invalid SequenceId for Sequence message.");
        }
    }
    _assertNotEmptyString(value, errorMessage) {
        if (typeof value !== "string" || value === "") {
            throw new Error(errorMessage);
        }
    }
}
;// CONCATENATED MODULE: ./node_modules/@microsoft/signalr/dist/esm/HubConnectionBuilder.js
// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.







const LogLevelNameMapping = {
    trace: LogLevel.Trace,
    debug: LogLevel.Debug,
    info: LogLevel.Information,
    information: LogLevel.Information,
    warn: LogLevel.Warning,
    warning: LogLevel.Warning,
    error: LogLevel.Error,
    critical: LogLevel.Critical,
    none: LogLevel.None,
};
function parseLogLevel(name) {
    // Case-insensitive matching via lower-casing
    // Yes, I know case-folding is a complicated problem in Unicode, but we only support
    // the ASCII strings defined in LogLevelNameMapping anyway, so it's fine -anurse.
    const mapping = LogLevelNameMapping[name.toLowerCase()];
    if (typeof mapping !== "undefined") {
        return mapping;
    }
    else {
        throw new Error(`Unknown log level: ${name}`);
    }
}
/** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
class HubConnectionBuilder {
    configureLogging(logging) {
        Arg.isRequired(logging, "logging");
        if (isLogger(logging)) {
            this.logger = logging;
        }
        else if (typeof logging === "string") {
            const logLevel = parseLogLevel(logging);
            this.logger = new ConsoleLogger(logLevel);
        }
        else {
            this.logger = new ConsoleLogger(logging);
        }
        return this;
    }
    withUrl(url, transportTypeOrOptions) {
        Arg.isRequired(url, "url");
        Arg.isNotEmpty(url, "url");
        this.url = url;
        // Flow-typing knows where it's at. Since HttpTransportType is a number and IHttpConnectionOptions is guaranteed
        // to be an object, we know (as does TypeScript) this comparison is all we need to figure out which overload was called.
        if (typeof transportTypeOrOptions === "object") {
            this.httpConnectionOptions = { ...this.httpConnectionOptions, ...transportTypeOrOptions };
        }
        else {
            this.httpConnectionOptions = {
                ...this.httpConnectionOptions,
                transport: transportTypeOrOptions,
            };
        }
        return this;
    }
    /** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
     *
     * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
     */
    withHubProtocol(protocol) {
        Arg.isRequired(protocol, "protocol");
        this.protocol = protocol;
        return this;
    }
    withAutomaticReconnect(retryDelaysOrReconnectPolicy) {
        if (this.reconnectPolicy) {
            throw new Error("A reconnectPolicy has already been set.");
        }
        if (!retryDelaysOrReconnectPolicy) {
            this.reconnectPolicy = new DefaultReconnectPolicy();
        }
        else if (Array.isArray(retryDelaysOrReconnectPolicy)) {
            this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
        }
        else {
            this.reconnectPolicy = retryDelaysOrReconnectPolicy;
        }
        return this;
    }
    /** Configures {@link @microsoft/signalr.HubConnection.serverTimeoutInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
     *
     * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
     */
    withServerTimeout(milliseconds) {
        Arg.isRequired(milliseconds, "milliseconds");
        this._serverTimeoutInMilliseconds = milliseconds;
        return this;
    }
    /** Configures {@link @microsoft/signalr.HubConnection.keepAliveIntervalInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
     *
     * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
     */
    withKeepAliveInterval(milliseconds) {
        Arg.isRequired(milliseconds, "milliseconds");
        this._keepAliveIntervalInMilliseconds = milliseconds;
        return this;
    }
    /** Enables and configures options for the Stateful Reconnect feature.
     *
     * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
     */
    withStatefulReconnect(options) {
        if (this.httpConnectionOptions === undefined) {
            this.httpConnectionOptions = {};
        }
        this.httpConnectionOptions._useStatefulReconnect = true;
        this._statefulReconnectBufferSize = options === null || options === void 0 ? void 0 : options.bufferSize;
        return this;
    }
    /** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
     *
     * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
     */
    build() {
        // If httpConnectionOptions has a logger, use it. Otherwise, override it with the one
        // provided to configureLogger
        const httpConnectionOptions = this.httpConnectionOptions || {};
        // If it's 'null', the user **explicitly** asked for null, don't mess with it.
        if (httpConnectionOptions.logger === undefined) {
            // If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
            httpConnectionOptions.logger = this.logger;
        }
        // Now create the connection
        if (!this.url) {
            throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
        }
        const connection = new HttpConnection(this.url, httpConnectionOptions);
        return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy, this._serverTimeoutInMilliseconds, this._keepAliveIntervalInMilliseconds, this._statefulReconnectBufferSize);
    }
}
function isLogger(logger) {
    return logger.log !== undefined;
}
;// CONCATENATED MODULE: ./Extensions/combined/src/discussion-config.js


const testOrigin =  true ? "" : 0;

const discussionConfig = Object.freeze({
  apiOrigin: testOrigin || getApiUrl(),
  testMode: Boolean(testOrigin),
  authStorageKey: testOrigin ? "rydDiscussionTestAuth" : null,
  credentialStorageKey: "rydDiscussionTestCredentials",
  stateStorageKey: testOrigin ? "rydDiscussionTestState" : "rydDiscussionState",
});

;// CONCATENATED MODULE: ./Extensions/combined/src/private-browsing.js
function extensionApi() {
  return typeof browser !== "undefined" ? browser : globalThis.chrome;
}

function isFirefoxExtension(api = extensionApi()) {
  return Boolean(api?.runtime?.getManifest?.()?.browser_specific_settings?.gecko);
}

function private_browsing_isPrivateBrowsingContext() {
  const api = extensionApi();
  return isFirefoxExtension(api) && api?.extension?.inIncognitoContext === true;
}

function isNormalMessageSender(api, sender) {
  if (!isFirefoxExtension(api)) return true;
  if (sender?.id !== api.runtime.id) return false;
  if (sender.tab) return sender.tab.incognito === false;
  try {
    const url = new URL(sender.url);
    if (!url.searchParams.get("rydContext")) return false;
    const views = api.extension.getViews().filter((view) => view.location.href === sender.url);
    return views.length === 1 && views[0].browser?.extension?.inIncognitoContext === false;
  } catch (_) {
    return false;
  }
}



;// CONCATENATED MODULE: ./Extensions/combined/src/discussion-background.js





const MEMBERSHIP_TIERS = Object.freeze(["none", "supporter", "commenter", "premium"]);
const ANONYMOUS_SESSION = Object.freeze({
  authenticated: false,
  profile: null,
  canPost: false,
  isModerator: false,
  membershipTier: "none",
});
const RECOVERY_DELAYS = [1000, 3000, 10000];
const REACTION_STORAGE_KEY = "rydDiscussionReactions";
const MAX_REACTION_VIDEOS = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIDEO_OPERATIONS = new Set([
  "comments",
  "replies",
  "comment",
  "createComment",
  "editComment",
  "deleteComment",
  "react",
  "report",
]);
const OPERATIONS = {
  cancelScope: [],
  capabilities: [],
  session: [],
  profile: ["nickname"],
  comments: ["videoId", "sort", "cursor"],
  replies: ["rootId", "cursor"],
  comment: ["id"],
  createComment: ["videoId", "text", "parentId", "replyToId", "requestId"],
  editComment: ["id", "text"],
  deleteComment: ["id"],
  react: ["id", "value"],
  report: ["id", "reason"],
  reports: ["cursor", "status"],
  dismissReport: ["id", "reason"],
  moderateComment: ["id", "hidden", "reason"],
  suspendProfile: ["id", "suspended", "reason"],
  notifications: ["cursor"],
  readNotifications: ["ids", "all"],
};

class DiscussionError extends Error {
  constructor(code, message = code, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function callBrowser(api, target, method, ...args) {
  return new Promise((resolve, reject) => {
    if (typeof target?.[method] !== "function") return resolve(undefined);
    const callback = (value) =>
      api.runtime?.lastError ? reject(new Error(api.runtime.lastError.message)) : resolve(value);
    try {
      const result = target[method](...args, callback);
      if (result?.then) result.then(resolve, reject);
    } catch (error) {
      try {
        Promise.resolve(target[method](...args)).then(resolve, reject);
      } catch (_) {
        reject(error);
      }
    }
  });
}

function isYouTubePage(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.youtube.com" &&
      (parsed.pathname === "/watch" || /^\/shorts\/[a-zA-Z0-9_-]{11}\/?$/.test(parsed.pathname))
    );
  } catch (_) {
    return false;
  }
}

function isYouTubeOrigin(url) {
  try {
    return new URL(url).origin === "https://www.youtube.com";
  } catch (_) {
    return false;
  }
}

function validateRequest(api, request, sender) {
  if (sender?.id !== api.runtime.id) throw new DiscussionError("invalid_sender");
  const extensionUrl = api.runtime.getURL?.("");
  const ownPage = extensionUrl && typeof sender.url === "string" && sender.url.startsWith(extensionUrl);
  const videoPage = sender.frameId === 0 && isYouTubeOrigin(sender.url) && isYouTubePage(sender.tab?.url);
  const operation = request?.operation;
  const topPage =
    ["capabilities", "session"].includes(operation) &&
    sender.frameId === 0 &&
    isYouTubeOrigin(sender.url) &&
    isYouTubeOrigin(sender.tab?.url);
  const cancellationPage =
    operation === "cancelScope" &&
    sender.frameId === 0 &&
    [sender.url, sender.tab?.url].every((value) => {
      try {
        return new URL(value).origin === "https://www.youtube.com";
      } catch (_) {
        return false;
      }
    });
  if (!ownPage && !videoPage && !cancellationPage && !topPage) throw new DiscussionError("invalid_sender");
  const fields = Object.hasOwn(OPERATIONS, operation) ? OPERATIONS[operation] : null;
  const payload = request.payload ?? {};
  if (
    !fields ||
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.keys(payload).some((key) => !fields.includes(key))
  )
    throw new DiscussionError("invalid_request");
  for (const key of ["id", "rootId", "parentId", "replyToId", "requestId"]) {
    if (payload[key] != null && (typeof payload[key] !== "string" || !UUID.test(payload[key])))
      throw new DiscussionError("invalid_request");
  }
  if (fields.includes("id") && !UUID.test(payload.id || "")) throw new DiscussionError("invalid_request");
  if (fields.includes("rootId") && !UUID.test(payload.rootId || "")) throw new DiscussionError("invalid_request");
  if (fields.includes("videoId") && !VIDEO_ID.test(payload.videoId || "")) throw new DiscussionError("invalid_request");
  if (operation === "createComment" && !UUID.test(payload.requestId || ""))
    throw new DiscussionError("invalid_request");
  for (const [key, max] of [
    ["text", 2000],
    ["nickname", 32],
    ["reason", 1000],
    ["cursor", 2048],
  ]) {
    if (payload[key] != null && (typeof payload[key] !== "string" || payload[key].length > max))
      throw new DiscussionError("invalid_request");
  }
  if (fields.includes("text") && !payload.text?.trim()) throw new DiscussionError("invalid_request");
  if (operation === "profile" && (typeof payload.nickname !== "string" || payload.nickname.trim().length < 3))
    throw new DiscussionError("invalid_request");
  if (operation === "report" && !payload.reason?.trim()) throw new DiscussionError("invalid_request");
  if (payload.sort != null && !["top", "new"].includes(payload.sort)) throw new DiscussionError("invalid_request");
  if (payload.status != null && !["open", "resolved"].includes(payload.status))
    throw new DiscussionError("invalid_request");
  if (operation === "react" && ![-1, 0, 1].includes(payload.value)) throw new DiscussionError("invalid_request");
  for (const key of ["hidden", "suspended"]) {
    if (fields.includes(key) && typeof payload[key] !== "boolean") throw new DiscussionError("invalid_request");
  }
  if (
    operation === "readNotifications" &&
    !(payload.all === true && payload.ids == null) &&
    !(
      payload.all == null &&
      Array.isArray(payload.ids) &&
      payload.ids.length > 0 &&
      payload.ids.length <= 100 &&
      payload.ids.every((id) => typeof id === "string" && UUID.test(id))
    )
  )
    throw new DiscussionError("invalid_request");
  const scope = request.scope;
  if (scope != null) {
    if (
      !scope ||
      typeof scope !== "object" ||
      Array.isArray(scope) ||
      Object.keys(scope).some((key) => !["id", "videoId"].includes(key)) ||
      typeof scope.id !== "string" ||
      !UUID.test(scope.id) ||
      typeof scope.videoId !== "string" ||
      !VIDEO_ID.test(scope.videoId) ||
      !Number.isInteger(sender.tab?.id) ||
      (!videoPage && !cancellationPage) ||
      (!VIDEO_OPERATIONS.has(operation) && operation !== "cancelScope")
    )
      throw new DiscussionError("invalid_scope");
    if (operation !== "cancelScope") {
      const current = new URL(sender.tab.url);
      const videoId = current.pathname === "/watch" ? current.searchParams.get("v") : current.pathname.split("/")[2];
      if (scope.videoId !== videoId || (payload.videoId && payload.videoId !== scope.videoId))
        throw new DiscussionError("navigation_changed");
    }
  } else if (operation === "cancelScope" || (videoPage && VIDEO_OPERATIONS.has(operation))) {
    throw new DiscussionError("scope_required");
  }
  return { operation, payload, scope };
}

function safeSession(data) {
  const profile = data.profile;
  return {
    authenticated: data.authenticated === true,
    profile: profile ? { id: profile.id, nickname: profile.nickname, suspended: profile.suspended === true } : null,
    canPost: data.canPost === true,
    isModerator: data.isModerator === true,
    membershipTier: MEMBERSHIP_TIERS.includes(data.membershipTier) ? data.membershipTier : "none",
  };
}

function discussionEvent(type, data) {
  return { message: "ryd_discussion_event", type, data };
}

function canReceiveLiveNotifications(session) {
  return (
    session.authenticated === true &&
    MEMBERSHIP_TIERS.indexOf(session.membershipTier) >= MEMBERSHIP_TIERS.indexOf("commenter") &&
    Boolean(session.profile?.nickname)
  );
}

function createConnection(url, accessTokenFactory, random = Math.random) {
  return new HubConnectionBuilder()
    .withUrl(url, { transport: HttpTransportType.WebSockets, skipNegotiation: true, accessTokenFactory })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds({ previousRetryCount }) {
        const delays = [500, 2000, 10000, 30000];
        const delay = delays[previousRetryCount];
        return delay == null ? null : Math.round(delay * (0.75 + random() * 0.5));
      },
    })
    .withKeepAliveInterval(15000)
    .withServerTimeout(45000)
    .configureLogging(LogLevel.None)
    .build();
}

function createDiscussionBackground({
  api,
  voteClient,
  fetchImpl = (...args) => fetch(...args),
  accountFetchImpl = fetchImpl,
  hasConsent = async () => true,
  hasFeatureConsent = (feature) => (feature === "account" ? hasConsent() : true),
  settings = discussionConfig,
  connectionFactory = createConnection,
  solve = solvePuzzle,
  random = Math.random,
} = {}) {
  const local = api.storage.local;
  const origin = settings.apiOrigin.replace(/\/$/, "");
  const pendingRequests = new Map();
  const reactionQueues = new Map();
  const navigationScopes = new Map();
  const cancelledScopes = new Set();
  let generation = 0;
  let accountEpoch = 0;
  let token = "";
  let session = { ...ANONYMOUS_SESSION };
  let connection = null;
  let connecting = null;
  let activityCatchup = null;
  let refreshing = null;
  let recoveryTimer = null;
  let recoveryRevision = 0;
  let recoveryAttempt = 0;
  let recoveryActive = false;
  let accountQueue = Promise.resolve();
  let catchupQueue = Promise.resolve();
  let stateQueue = Promise.resolve();
  let reactionStateQueue = Promise.resolve();
  let voterEpoch = 0;
  const permissionEpochs = { account: 0, voting: 0, counts: 0 };
  let rejectedToken = "";
  let accountBlocked = false;
  let hintedRevision = "0";
  let hasInboxSnapshot = false;
  let inbox = { items: [], unreadCount: 0, revision: "0", nextCursor: null };
  let stopped = false;

  const store = (method, ...args) => callBrowser(api, local, method, ...args);
  const writeState = (expected, method, ...args) => {
    const work = stateQueue
      .catch(() => {})
      .then(() => {
        if (expected !== generation) return;
        return store(method, ...args);
      });
    stateQueue = work;
    return work;
  };
  const credentials = settings.testMode
    ? createVoteClient({
        apiBaseUrl: origin,
        fetchImpl,
        credentialStore: {
          async load() {
            return (await store("get", [settings.credentialStorageKey]))?.[settings.credentialStorageKey] ?? null;
          },
          async save(value) {
            await store("set", { [settings.credentialStorageKey]: value });
          },
          async clear() {
            await store("remove", [settings.credentialStorageKey]);
          },
        },
        cryptoImpl: globalThis.crypto,
      })
    : voteClient;

  function assertCurrent(expected) {
    if (stopped || expected !== generation) throw new DiscussionError("session_changed");
  }

  function assertScope(scope) {
    if (scope?.cancelled) throw new DiscussionError("navigation_changed", "The video changed");
  }

  function scopeFor(value, sender) {
    if (!value) return null;
    const documentId = sender.documentId || "top-frame";
    const key = `${sender.tab.id}:${documentId}:${value.id}`;
    if (cancelledScopes.has(key)) throw new DiscussionError("navigation_changed");
    if (!navigationScopes.has(key))
      for (const [oldKey, oldScope] of navigationScopes)
        if (oldScope.tabId === sender.tab.id && oldKey !== key) {
          cancelScope(oldScope);
          navigationScopes.delete(oldKey);
        }
    if (!navigationScopes.has(key))
      navigationScopes.set(key, {
        tabId: sender.tab.id,
        key,
        documentId,
        videoId: value.videoId,
        cancelled: false,
        controllers: new Set(),
        authors: new Map(),
      });
    const scope = navigationScopes.get(key);
    if (scope.videoId !== value.videoId) throw new DiscussionError("invalid_scope");
    return scope;
  }

  function cancelScope(scope) {
    scope.cancelled = true;
    for (const controller of scope.controllers) controller.abort();
    navigationScopes.delete(scope.key);
    cancelledScopes.add(scope.key);
    while (cancelledScopes.size > 100) cancelledScopes.delete(cancelledScopes.values().next().value);
  }

  async function request(
    path,
    { method = "GET", body, auth = token, expected = generation, scope, accountBound = true, feature = "account" } = {},
  ) {
    const features = new Set([feature]);
    if (scope || /^\/(?:videos\/[^/]+\/comments(?:\/|$)|comments\/[^/]+(?:\/|$))/.test(path)) features.add("counts");
    const epochs = [...features].map((value) => [value, permissionEpochs[value]]);
    const assertRequest = () => {
      assertCurrent(accountBound ? expected : generation);
      for (const [value, epoch] of epochs)
        if (epoch !== permissionEpochs[value]) throw new DiscussionError(`${value}_consent_required`);
    };
    for (const value of features)
      if (!(await hasFeatureConsent(value))) throw new DiscussionError(`${value}_consent_required`);
    assertRequest();
    assertScope(scope);
    const controller = new AbortController();
    pendingRequests.set(controller, { accountBound, features });
    scope?.controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await (auth ? accountFetchImpl : fetchImpl)(`${origin}/api/discussion${path}`, {
        method,
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body == null ? {} : { "Content-Type": "application/json" }),
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        ...(body == null ? {} : { body: JSON.stringify(body) }),
      });
      assertRequest();
      assertScope(scope);
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      assertRequest();
      assertScope(scope);
      if (!response.ok) {
        if (
          response.status === 401 &&
          data?.code === "authentication_required" &&
          accountBound &&
          auth &&
          auth === token &&
          path !== "/me"
        ) {
          rejectedToken = token;
          clearSession();
        }
        throw new DiscussionError(data?.code || "request_failed", data?.message || "Request failed", response.status);
      }
      return data;
    } catch (error) {
      assertScope(scope);
      if (error instanceof DiscussionError) throw error;
      throw new DiscussionError(
        controller.signal.aborted ? "request_cancelled" : "network_error",
        "Discussion is unavailable",
      );
    } finally {
      clearTimeout(timeout);
      pendingRequests.delete(controller);
      scope?.controllers.delete(controller);
    }
  }

  async function broadcast(type, data, expected = generation) {
    const message = discussionEvent(type, data);
    if (expected !== generation || stopped) return;
    const tabs = await callBrowser(
      api,
      api.tabs,
      "query",
      type === "toast" ? { active: true, lastFocusedWindow: true } : {},
    );
    if (expected !== generation || stopped) return;
    const firefox = isFirefoxExtension(api);
    const targets = (tabs || []).filter(
      (tab) =>
        (type === "toast" ? isYouTubePage(tab.url) : isYouTubeOrigin(tab.url)) && (!firefox || tab.incognito === false),
    );
    await Promise.allSettled(
      (type === "toast" ? targets.slice(0, 1) : targets).map((tab) =>
        callBrowser(api, api.tabs, "sendMessage", tab.id, message),
      ),
    );
    if (type !== "toast" && expected === generation) {
      if (firefox) {
        try {
          const extensionUrl = api.runtime.getURL("");
          for (const view of api.extension?.getViews?.() || []) {
            try {
              if (
                view.browser?.extension?.inIncognitoContext === false &&
                view.location?.href?.startsWith(extensionUrl)
              )
                view.dispatchEvent(new view.CustomEvent("ryd-discussion-event", { detail: structuredClone(message) }));
            } catch (_) {}
          }
        } catch (_) {}
      } else {
        await callBrowser(api, api.runtime, "sendMessage", message).catch(() => {});
      }
    }
  }

  function badgeText() {
    return inbox.unreadCount ? String(Math.min(inbox.unreadCount, 99)) + (inbox.unreadCount > 99 ? "+" : "") : "";
  }

  async function updateTabBadge(tab, expected = generation) {
    if (expected !== generation || stopped || tab?.incognito !== false || !Number.isInteger(tab.id)) return;
    const action = api.action || api.browserAction;
    await callBrowser(api, action, "setBadgeText", { tabId: tab.id, text: badgeText() }).catch(() => {});
    if (expected === generation && !stopped)
      await callBrowser(api, action, "setBadgeBackgroundColor", { tabId: tab.id, color: "#cc0000" }).catch(() => {});
  }

  async function updateBadge(expected = generation) {
    if (expected !== generation || stopped) return;
    const action = api.action || api.browserAction;
    if (isFirefoxExtension(api)) {
      await callBrowser(api, action, "setBadgeText", { text: "" }).catch(() => {});
      if (expected !== generation || stopped) return;
      const tabs = await callBrowser(api, api.tabs, "query", {});
      if (expected !== generation || stopped) return;
      await Promise.allSettled((tabs || []).map((tab) => updateTabBadge(tab, expected)));
      return;
    }
    await callBrowser(api, action, "setBadgeText", {
      text: badgeText(),
    }).catch(() => {});
    if (expected === generation)
      await callBrowser(api, action, "setBadgeBackgroundColor", { color: "#cc0000" }).catch(() => {});
  }

  async function publishInbox(expected, changed = [], showToast = false) {
    assertCurrent(expected);
    await updateBadge(expected);
    await broadcast("inbox", inbox, expected);
    if (showToast) {
      const notification = changed.find((item) => !item.read && ["reply", "likes"].includes(item.type));
      if (notification) await broadcast("toast", notification, expected);
    }
  }

  function catchup(showToast = false, expected = generation) {
    const work = catchupQueue
      .catch(() => {})
      .then(async () => {
        assertCurrent(expected);
        if (!canReceiveLiveNotifications(session) || !token || !(await hasFeatureConsent("account"))) return;
        const since = inbox.revision;
        const isChanges = hasInboxSnapshot;
        const changed = [];
        let cursor = null;
        let page;
        do {
          const params = new URLSearchParams();
          if (isChanges) params.set("afterRevision", since);
          if (cursor) params.set("cursor", cursor);
          page = await request(`/notifications${params.size ? `?${params}` : ""}`, { expected });
          changed.push(...(page.items || []));
          cursor = page.nextCursor;
        } while (cursor && isChanges);
        assertCurrent(expected);
        if (!canReceiveLiveNotifications(session)) return;
        const previous = new Map(inbox.items.map((item) => [item.id, item]));
        const novel = changed.filter((item) => previous.get(item.id)?.revision !== item.revision);
        for (const item of changed) previous.set(item.id, item);
        inbox = {
          items: [...previous.values()]
            .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
            .slice(0, 100),
          nextCursor: isChanges ? inbox.nextCursor : page.nextCursor,
          unreadCount: page.unreadCount,
          revision: page.revision,
        };
        hasInboxSnapshot = true;
        await publishInbox(expected, novel, showToast && isChanges);
      });
    catchupQueue = work;
    return work;
  }

  function catchupOnActivity(expected = generation) {
    if (activityCatchup) return activityCatchup;
    const work = catchup(false, expected);
    activityCatchup = work;
    work
      .finally(() => {
        if (activityCatchup === work) activityCatchup = null;
      })
      .catch(() => {});
    return work;
  }

  function shareInbox(tabId) {
    if (!hasInboxSnapshot || !canReceiveLiveNotifications(session)) return;
    callBrowser(api, api.tabs, "sendMessage", tabId, discussionEvent("inbox", inbox)).catch(() => {});
  }

  function assertLiveNotifications(expected) {
    assertCurrent(expected);
    if (!canReceiveLiveNotifications(session)) throw new DiscussionError("notifications_unavailable");
  }

  async function connect(expected = generation) {
    if (connecting || connection || !canReceiveLiveNotifications(session) || !token || stopped) return connecting;
    if (!(await hasFeatureConsent("account"))) return;
    assertCurrent(expected);
    if (connecting || connection) return connecting;
    const work = (async () => {
      assertCurrent(expected);
      const activeToken = token;
      const socket = connectionFactory(`${origin}/api/discussion/notifications/hub`, async () => {
        assertLiveNotifications(expected);
        const ticket = await request("/notifications/ticket", { method: "POST", auth: activeToken, expected });
        return ticket.token;
      });
      connection = socket;
      socket.on("NotificationsChanged", (event) => {
        const revision = event?.revision;
        if (expected !== generation || typeof revision !== "string" || !/^(0|[1-9][0-9]*)$/.test(revision)) return;
        if (BigInt(revision) <= BigInt(inbox.revision) || BigInt(revision) <= BigInt(hintedRevision)) return;
        hintedRevision = revision;
        catchup(true, expected).catch(() => {
          if (expected === generation) hintedRevision = inbox.revision;
        });
      });
      socket.onclose(() => {
        if (connection === socket) connection = null;
      });
      socket.onreconnected(() => {
        if (expected !== generation || connection !== socket || stopped) return;
        catchup(false, expected).catch(() => {});
      });
      try {
        await socket.start();
        assertCurrent(expected);
        finishRecovery(recoveryRevision);
        await catchup(false, expected).catch(() => {});
      } catch (error) {
        if (connection === socket) connection = null;
        await socket.stop().catch(() => {});
        throw error;
      }
    })();
    connecting = work;
    try {
      await work;
    } finally {
      if (connecting === work) connecting = null;
    }
  }

  function resetLiveNotifications() {
    const previousConnection = connection;
    connection = null;
    connecting = null;
    activityCatchup = null;
    previousConnection?.stop().catch(() => {});
    hintedRevision = "0";
    hasInboxSnapshot = false;
    inbox = { items: [], unreadCount: 0, revision: "0", nextCursor: null };
  }

  function stopLiveNotifications() {
    if (!connection && !connecting && !hasInboxSnapshot) return;
    resetLiveNotifications();
    updateBadge().catch(() => {});
    broadcast("inbox", inbox).catch(() => {});
  }

  function clearSession(blockAccount = false, preserveQueuedRequests = false, preserveRecovery = false) {
    if (!preserveRecovery) {
      recoveryRevision++;
      finishRecovery(recoveryRevision);
      refreshing = null;
    }
    if (blockAccount) accountBlocked = true;
    if (!preserveQueuedRequests) accountEpoch++;
    generation++;
    for (const [controller, state] of pendingRequests) if (state.accountBound) controller.abort();
    resetLiveNotifications();
    token = "";
    session = { ...ANONYMOUS_SESSION };
    writeState(generation, "remove", [settings.stateStorageKey]).catch(() => {});
    updateBadge().catch(() => {});
    broadcast("session", session).catch(() => {});
    broadcast("inbox", inbox).catch(() => {});
  }

  function loadSession() {
    const work = accountQueue
      .catch(() => {})
      .then(async () => {
        const beforeRead = generation;
        if (stopped || accountBlocked) return session;
        const consent = await hasFeatureConsent("account");
        assertCurrent(beforeRead);
        let nextToken = "";
        if (consent) {
          if (settings.testMode) {
            const data = await store("get", [settings.authStorageKey]);
            nextToken = data?.[settings.authStorageKey]?.sessionToken || "";
          } else {
            const data = await callBrowser(api, api.storage.sync, "get", [
              "patreonAuthenticated",
              "patreonSessionToken",
            ]);
            nextToken = data?.patreonAuthenticated ? data.patreonSessionToken || "" : "";
          }
        }
        assertCurrent(beforeRead);
        if (
          (nextToken && nextToken === rejectedToken) ||
          (nextToken === token && (!nextToken || session.authenticated))
        )
          return session;
        if (token && token !== nextToken) clearSession(false, true, true);
        const expected = generation;
        token = nextToken;
        if (!token) return session;
        try {
          session = safeSession(await request("/me", { expected }));
        } catch (error) {
          assertCurrent(expected);
          if (error.status !== 401) throw error;
          rejectedToken = token;
          clearSession(false, true, true);
          return session;
        }
        assertCurrent(expected);
        await broadcast("session", session, expected);
        return session;
      });
    accountQueue = work;
    return work;
  }

  function finishRecovery(revision) {
    if (revision !== recoveryRevision) return;
    if (recoveryTimer !== null) clearTimeout(recoveryTimer);
    recoveryTimer = null;
    recoveryActive = false;
    recoveryAttempt = 0;
  }

  function scheduleRecovery(revision, error) {
    if (revision !== recoveryRevision || stopped || accountBlocked || !recoveryActive || recoveryTimer !== null) return;
    const permanent =
      ["session_changed", "account_consent_required", "notifications_unavailable"].includes(error?.code) ||
      (error?.status > 0 && error.status < 500 && error.status !== 408);
    const delay = RECOVERY_DELAYS[recoveryAttempt];
    if (permanent || delay == null) {
      finishRecovery(revision);
      return;
    }
    recoveryAttempt++;
    recoveryTimer = setTimeout(
      () => {
        recoveryTimer = null;
        if (revision === recoveryRevision && !stopped && !accountBlocked) refreshSession(true).catch(() => {});
      },
      Math.round(delay * (0.75 + random() * 0.5)),
    );
  }

  function refreshSession(retrying = false) {
    if (refreshing) return refreshing;
    if (stopped || accountBlocked || (!retrying && recoveryTimer !== null)) return Promise.resolve(session);
    if (!recoveryActive) {
      recoveryActive = true;
      recoveryAttempt = 0;
    }
    const revision = recoveryRevision;
    const work = loadSession().then(
      (value) => {
        if (revision !== recoveryRevision) throw new DiscussionError("session_changed");
        if (!canReceiveLiveNotifications(value)) {
          stopLiveNotifications();
          finishRecovery(revision);
        } else if (connection?.state === "Connected") {
          if (!hasInboxSnapshot && !connecting) catchupOnActivity().catch(() => {});
          finishRecovery(revision);
        } else {
          if (!connecting && (!retrying || !hasInboxSnapshot)) catchupOnActivity().catch(() => {});
          connect().catch((error) => scheduleRecovery(revision, error));
        }
        return value;
      },
      (error) => {
        scheduleRecovery(revision, error);
        throw error;
      },
    );
    refreshing = work;
    work
      .finally(() => {
        if (refreshing === work) refreshing = null;
      })
      .catch(() => {});
    return work;
  }

  async function withLocalReactions(result, single = false, scope) {
    assertScope(scope);
    const items = single ? [result] : result.items || [];
    if (!items.length) return result;
    for (const item of items) if (scope && item.author?.id) scope.authors.set(item.id, item.author.id);
    const epoch = voterEpoch;
    await reactionStateQueue.catch(() => {});
    try {
      const allowed = await hasFeatureConsent("voting");
      const data = allowed ? await store("get", [REACTION_STORAGE_KEY]) : {};
      assertScope(scope);
      const videos =
        epoch === voterEpoch && Array.isArray(data?.[REACTION_STORAGE_KEY]) ? data[REACTION_STORAGE_KEY] : [];
      for (const item of items) {
        const reactions = videos.find((entry) => entry.videoId === (scope?.videoId || item.videoId))?.reactions;
        item.myReaction = [-1, 1].includes(reactions?.[item.id]) ? reactions[item.id] : 0;
      }
    } catch (error) {
      assertScope(scope);
      for (const item of items) item.myReaction = 0;
    }
    return result;
  }

  function rememberReaction(videoId, commentId, value, epoch) {
    const work = reactionStateQueue
      .catch(() => {})
      .then(async () => {
        if (epoch !== voterEpoch || !VIDEO_ID.test(videoId || "") || ![-1, 0, 1].includes(value)) return;
        const data = await store("get", [REACTION_STORAGE_KEY]);
        if (epoch !== voterEpoch || !(await hasFeatureConsent("voting"))) return;
        const previous = Array.isArray(data?.[REACTION_STORAGE_KEY]) ? data[REACTION_STORAGE_KEY] : [];
        const reactions = { ...previous.find((item) => item.videoId === videoId)?.reactions };
        if (value === 0) delete reactions[commentId];
        else reactions[commentId] = value;
        const videos = previous.filter((item) => item.videoId !== videoId);
        if (Object.keys(reactions).length) videos.push({ videoId, reactions });
        await store("set", { [REACTION_STORAGE_KEY]: videos.slice(-MAX_REACTION_VIDEOS) });
      });
    reactionStateQueue = work;
    return work;
  }

  function clearReactions(invalidate = true) {
    if (invalidate) voterEpoch++;
    const work = reactionStateQueue.catch(() => {}).then(() => store("remove", [REACTION_STORAGE_KEY]));
    reactionStateQueue = work;
    return work;
  }

  function react(payload, expected, scope) {
    const epoch = voterEpoch;
    const browsingEpoch = permissionEpochs.counts;
    const assertReaction = () => {
      assertScope(scope);
      if (browsingEpoch !== permissionEpochs.counts) throw new DiscussionError("counts_consent_required");
      if (epoch !== voterEpoch) throw new DiscussionError("voting_consent_required");
      if (session.authenticated && scope?.authors.get(payload.id) === session.profile?.id)
        throw new DiscussionError("own_comment");
    };
    const previous = reactionQueues.get(payload.id) || Promise.resolve();
    const work = previous
      .catch(() => {})
      .then(async () => {
        assertReaction();
        if (!(await hasFeatureConsent("voting"))) throw new DiscussionError("voting_consent_required");
        assertReaction();
        const { userId } = await credentials.ensureRegistered();
        assertReaction();
        for (let attempt = 0; attempt < 3; attempt++) {
          const puzzle = await request(`/comments/${payload.id}/reaction/challenge`, {
            method: "POST",
            body: { userId, value: payload.value },
            expected,
            scope,
            auth: "",
            accountBound: false,
            feature: "voting",
          });
          const solved = await solve(puzzle);
          assertReaction();
          if (!solved) continue;
          const result = await request(`/comments/${payload.id}/reaction/confirm`, {
            method: "POST",
            body: { userId, challengeId: puzzle.challengeId, solution: solved.solution },
            expected,
            scope,
            auth: "",
            accountBound: false,
            feature: "voting",
          });
          assertReaction();
          await rememberReaction(scope?.videoId, payload.id, result.myReaction, epoch);
          return result;
        }
        throw new DiscussionError("puzzle_failed", "Please try the reaction again");
      });
    reactionQueues.set(payload.id, work);
    work
      .finally(() => {
        if (reactionQueues.get(payload.id) === work) reactionQueues.delete(payload.id);
      })
      .catch(() => {});
    return work;
  }

  async function execute(operation, payload, scope) {
    const queuedEpoch = accountEpoch;
    const browsingEpoch = permissionEpochs.counts;
    const assertBrowsing = () => {
      if (VIDEO_OPERATIONS.has(operation) && browsingEpoch !== permissionEpochs.counts)
        throw new DiscussionError("counts_consent_required");
    };
    assertScope(scope);
    if (VIDEO_OPERATIONS.has(operation)) {
      if (!(await hasFeatureConsent("counts"))) throw new DiscussionError("counts_consent_required");
      assertBrowsing();
    }
    const { id, cursor } = payload;
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const publicRead = (path) => request(path, { auth: "", accountBound: false, feature: "counts", scope });
    if (operation === "capabilities") return publicRead("/capabilities");
    if (operation === "comments")
      return withLocalReactions(
        await publicRead(
          `/videos/${payload.videoId}/comments?sort=${payload.sort || "top"}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        ),
        false,
        scope,
      );
    if (operation === "replies")
      return withLocalReactions(await publicRead(`/comments/${payload.rootId}/replies${query}`), false, scope);
    if (operation === "comment") return withLocalReactions(await publicRead(`/comments/${id}`), true, scope);
    if (operation === "react") return react(payload, generation, scope);
    if (operation !== "session" && !(await hasFeatureConsent("account")))
      throw new DiscussionError("account_consent_required");
    await refreshSession();
    assertBrowsing();
    if (queuedEpoch !== accountEpoch) throw new DiscussionError("session_changed");
    assertScope(scope);
    const expected = generation;
    const send = (path, options = {}) => request(path, { ...options, scope });
    switch (operation) {
      case "session":
        if (token && !session.authenticated) throw new DiscussionError("session_unavailable");
        return session;
      case "profile": {
        const data = safeSession(
          await send("/me/profile", { method: "PUT", body: { nickname: payload.nickname }, expected }),
        );
        session = data;
        await broadcast("session", session, expected);
        refreshSession().catch(() => {});
        return data;
      }
      case "createComment": {
        const { videoId, ...body } = payload;
        return send(`/videos/${videoId}/comments`, { method: "POST", body, expected });
      }
      case "editComment":
        return send(`/comments/${id}`, { method: "PATCH", body: { text: payload.text }, expected });
      case "deleteComment":
        return send(`/comments/${id}`, { method: "DELETE", expected });
      case "report":
        return send(`/comments/${id}/reports`, { method: "POST", body: { reason: payload.reason }, expected });
      case "reports":
        return request(
          `/moderation/reports?status=${payload.status || "open"}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
          { expected },
        );
      case "dismissReport":
        return request(`/moderation/reports/${id}/dismiss`, {
          method: "POST",
          body: { reason: payload.reason },
          expected,
        });
      case "moderateComment":
        return request(`/moderation/comments/${id}`, {
          method: "POST",
          body: { hidden: payload.hidden, reason: payload.reason },
          expected,
        });
      case "suspendProfile":
        return request(`/moderation/profiles/${id}/suspension`, {
          method: "POST",
          body: { suspended: payload.suspended, reason: payload.reason },
          expected,
        });
      case "notifications":
        return request(`/notifications${query}`, { expected });
      case "readNotifications": {
        const data = await request("/notifications/read", { method: "POST", body: payload, expected });
        await catchup(false, expected);
        return data;
      }
      default:
        throw new DiscussionError("invalid_request");
    }
  }

  async function handleMessage(requestMessage, sender) {
    try {
      if (!isNormalMessageSender(api, sender)) throw new DiscussionError("private_browsing");
      const { operation, payload, scope: scopeValue } = validateRequest(api, requestMessage, sender);
      const scope = scopeFor(scopeValue, sender);
      const browsingEpoch = permissionEpochs.counts;
      if (operation === "cancelScope") {
        cancelScope(scope);
        return { ok: true, data: { cancelled: true } };
      }
      const data = await execute(operation, payload, scope);
      if (operation === "session" && sender.tab) shareInbox(sender.tab.id);
      if (VIDEO_OPERATIONS.has(operation) && browsingEpoch !== permissionEpochs.counts)
        throw new DiscussionError("counts_consent_required");
      assertScope(scope);
      if (
        scope &&
        ((data?.videoId && data.videoId !== scope.videoId) ||
          data?.items?.some((item) => item.videoId && item.videoId !== scope.videoId))
      )
        throw new DiscussionError("navigation_changed");
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: error.code || "request_failed",
          message: error.message || "Request failed",
          status: error.status || 0,
        },
      };
    }
  }

  function onStorageChanged(changes, area) {
    if (
      (area === "sync" && changes.userId?.oldValue !== changes.userId?.newValue && changes.userId) ||
      (settings.testMode &&
        area === "local" &&
        changes[settings.credentialStorageKey] &&
        changes[settings.credentialStorageKey].oldValue?.userId !==
          changes[settings.credentialStorageKey].newValue?.userId)
    )
      clearReactions(
        Boolean(changes.userId?.oldValue || changes[settings.credentialStorageKey]?.oldValue?.userId),
      ).catch(() => {});
    const changed = settings.testMode
      ? area === "local" && changes[settings.authStorageKey]
      : area === "sync" && (changes.patreonAuthenticated || changes.patreonSessionToken || changes.patreonUser);
    if (changed) {
      rejectedToken = "";
      clearSession();
      refreshSession().catch(() => {});
    }
  }

  function initialize() {
    store("remove", [settings.stateStorageKey]).catch(() => {});
    if (isFirefoxExtension(api)) {
      api.tabs?.onCreated?.addListener((tab) => updateTabBadge(tab).catch(() => {}));
      api.tabs?.onUpdated?.addListener((tabId, change, tab) => updateTabBadge(tab).catch(() => {}));
      updateBadge().catch(() => {});
    }
    api.tabs?.onRemoved?.addListener((tabId) => {
      for (const [key, scope] of navigationScopes)
        if (scope.tabId === tabId) {
          cancelScope(scope);
          navigationScopes.delete(key);
        }
      for (const key of cancelledScopes) if (key.startsWith(`${tabId}:`)) cancelledScopes.delete(key);
    });
    api.runtime.onStartup?.addListener(() => refreshSession().catch(() => {}));
    refreshSession().catch(() => {});
  }

  return {
    handleMessage,
    refreshSession,
    clearSession,
    resumeSession() {
      accountBlocked = false;
      return refreshSession();
    },
    onStorageChanged,
    async onDataPermissionsChanged({ added = [], removed = [] } = {}) {
      const features = new Set();
      if (removed.includes("browsingActivity")) features.add("counts");
      if (removed.includes("websiteActivity")) features.add("voting");
      if (removed.some((category) => ["authenticationInfo", "personallyIdentifyingInfo"].includes(category)))
        features.add("account");
      for (const feature of features) permissionEpochs[feature]++;
      for (const [controller, state] of pendingRequests)
        if ([...state.features].some((feature) => features.has(feature))) controller.abort();
      const reactionsCleared = features.has("voting") || features.has("counts") ? clearReactions() : null;
      if (features.has("account")) clearSession();
      await broadcast("permissions", { added, removed });
      await reactionsCleared;
      if (added.some((category) => ["authenticationInfo", "personallyIdentifyingInfo"].includes(category)))
        await refreshSession().catch(() => {});
    },
    initialize,
    stop() {
      clearSession();
      stopped = true;
      for (const controller of pendingRequests.keys()) controller.abort();
    },
  };
}



;// CONCATENATED MODULE: ./Extensions/combined/src/core-data-consent.js



const FEATURE_DATA_PERMISSIONS = Object.freeze({
  counts: Object.freeze(["browsingActivity"]),
  likeCount: Object.freeze(["websiteContent"]),
  voting: Object.freeze(["browsingActivity", "websiteActivity"]),
  voteOptIn: Object.freeze(["browsingActivity", "websiteActivity", "websiteContent"]),
  account: Object.freeze(["authenticationInfo", "personallyIdentifyingInfo"]),
});

function core_data_consent_consentApi() {
  return typeof browser !== "undefined" ? browser : globalThis.chrome;
}

function usesFirefoxDataCollectionConsent() {
  return Boolean(core_data_consent_consentApi()?.runtime?.getManifest?.()?.browser_specific_settings?.gecko?.data_collection_permissions);
}

function coreConsentError() {
  return new Error("Data consent required for this feature.");
}

async function hasFeaturePermission(feature, { queryBackground = true } = {}) {
  const required = FEATURE_DATA_PERMISSIONS[feature];
  if (!required) return false;
  if (private_browsing_isPrivateBrowsingContext() && feature !== "counts") return false;
  if (!usesFirefoxDataCollectionConsent()) return true;
  const api = core_data_consent_consentApi();
  try {
    const requiredByManifest =
      api.runtime.getManifest().browser_specific_settings.gecko.data_collection_permissions.required;
    if (required.every((category) => requiredByManifest?.includes(category))) return true;
    if (api?.permissions) {
      if (typeof api.permissions.getAll !== "function") return false;
      const granted = (await api.permissions.getAll())?.data_collection;
      return Array.isArray(granted) && required.every((category) => granted.includes(category));
    }
    if (queryBackground) {
      return (await api.runtime.sendMessage({ message: "ryd_has_feature_consent", feature }))?.granted === true;
    }
  } catch (_) {}
  return false;
}

function requestFeaturePermission(feature) {
  const required = FEATURE_DATA_PERMISSIONS[feature];
  if (!required || isPrivateBrowsingContext()) return Promise.resolve(false);
  if (!usesFirefoxDataCollectionConsent()) return Promise.resolve(true);
  try {
    const pending = core_data_consent_consentApi().permissions.request({ data_collection: required });
    return Promise.resolve(pending).then(
      (granted) => granted === true && hasFeaturePermission(feature, { queryBackground: false }),
      () => false,
    );
  } catch (_) {
    return Promise.resolve(false);
  }
}

function core_data_consent_onDataPermissionsChanged(listener) {
  if (!usesFirefoxDataCollectionConsent()) return () => {};
  const api = core_data_consent_consentApi();
  const known = new Set(Object.values(FEATURE_DATA_PERMISSIONS).flat());
  const categories = (value) =>
    Array.isArray(value?.data_collection) ? value.data_collection.filter((category) => known.has(category)) : [];
  const added = (value) => {
    const values = categories(value);
    if (values.length) listener({ added: values, removed: [] });
  };
  const removed = (value) => {
    const values = categories(value);
    if (values.length) listener({ added: [], removed: values });
  };
  const message = (value) => {
    if (value?.message !== "ryd_data_permissions_changed") return;
    const values = {
      added: categories({ data_collection: value.added }),
      removed: categories({ data_collection: value.removed }),
    };
    if (values.added.length || values.removed.length) listener(values);
  };
  if (typeof api?.permissions?.onRemoved?.addListener === "function") {
    api.permissions.onAdded?.addListener?.(added);
    api.permissions.onRemoved.addListener(removed);
    return () => {
      api.permissions.onAdded?.removeListener?.(added);
      api.permissions.onRemoved.removeListener?.(removed);
    };
  }
  api?.runtime?.onMessage?.addListener(message);
  return () => api?.runtime?.onMessage?.removeListener(message);
}

function requestFeature(input, options = {}) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  const method = (options.method ?? input?.method ?? "GET").toUpperCase();
  const path = url.pathname;
  if (/\/(?:interact\/(?:vote|confirmVote)|puzzle\/registration)(?:\/|$)/i.test(path)) return "voting";
  if (/\/comments\/[^/]+\/reaction\/(?:challenge|confirm)$/.test(path)) return "voting";
  if (/\/api\/auth\//.test(path) || /\/api\/patreon\/analytics\//.test(path)) return "account";
  if (/\/api\/discussion\//.test(path)) {
    const resource = path.replace(/^.*\/api\/discussion/, "");
    if (method === "GET" && resource === "/capabilities") return "counts";
    if (
      method === "GET" &&
      (/^\/videos\/[^/]+\/comments$/.test(resource) || /^\/comments\/[^/]+(?:\/replies)?$/.test(resource))
    ) {
      const headers = new Headers(options.headers ?? input?.headers);
      return headers.has("Authorization") ? "account" : "counts";
    }
    return "account";
  }
  if (method === "GET" && ["/votes", "/configs/selectors"].includes(path)) return "counts";
  return null;
}

function requestNeedsBrowsingActivity(input) {
  const path = new URL(typeof input === "string" || input instanceof URL ? input : input.url).pathname;
  return (
    /\/interact\/(?:vote|confirmVote)(?:\/|$)/i.test(path) ||
    /\/api\/patreon\/analytics\/video\/[^/]+(?:\/|$)/.test(path) ||
    /\/api\/discussion\/(?:videos\/[^/]+\/comments(?:\/|$)|comments\/[^/]+(?:\/|$))/.test(path)
  );
}

function privateCountRequest(input, options) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  const method = options.method ?? input?.method ?? "GET";
  if (url.pathname === "/votes") url.searchParams.delete("likeCount");
  let allowedQuery = true;
  url.searchParams.forEach((value, key) => {
    if (url.pathname !== "/votes" || key !== "videoId") allowedQuery = false;
  });
  if (
    url.origin !== new URL(getApiUrl()).origin ||
    !["/votes", "/configs/selectors"].includes(url.pathname) ||
    method.toUpperCase() !== "GET" ||
    url.username ||
    url.password ||
    !allowedQuery ||
    options.body != null ||
    input?.body != null
  )
    throw new Error("Only count display is available in private windows.");
  return [
    url.href,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: options.signal,
    },
  ];
}

function fetchWithFeatureConsent(feature, input, options = {}, fetchImpl = globalThis.fetch) {
  if (!usesFirefoxDataCollectionConsent()) return fetchImpl(input, options);
  return (async () => {
    if (!FEATURE_DATA_PERMISSIONS[feature]) throw coreConsentError();
    options.signal?.throwIfAborted();
    if (private_browsing_isPrivateBrowsingContext()) {
      if (feature !== "counts") throw new Error("Only count display is available in private windows.");
      [input, options] = privateCountRequest(input, options);
    }
    const inferred = requestFeature(input, options);
    const features = new Set([feature, ...(inferred ? [inferred] : [])]);
    if (requestNeedsBrowsingActivity(input)) features.add("counts");
    if (new Headers(options.headers ?? input?.headers).has("Authorization")) features.add("account");
    const controller = new AbortController();
    const abortForCaller = () => controller.abort(options.signal.reason);
    let required = [...features].flatMap((value) => FEATURE_DATA_PERMISSIONS[value]);
    const unsubscribe = core_data_consent_onDataPermissionsChanged(({ removed }) => {
      if (removed.some((category) => required.includes(category))) controller.abort(coreConsentError());
    });
    options.signal?.addEventListener("abort", abortForCaller, { once: true });
    const assertPermitted = async () => {
      for (const value of features) if (!(await hasFeaturePermission(value))) throw coreConsentError();
      controller.signal.throwIfAborted();
    };
    try {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
      if (url.pathname === "/votes" && url.searchParams.has("likeCount")) {
        if (await hasFeaturePermission("likeCount")) {
          features.add("likeCount");
          required = [...features].flatMap((value) => FEATURE_DATA_PERMISSIONS[value]);
        } else {
          url.searchParams.delete("likeCount");
          input = url.href;
        }
      }
      await assertPermitted();
      const response = await fetchImpl(input, { ...options, signal: controller.signal });
      const payload = await response.arrayBuffer();
      await assertPermitted();
      return new Response([204, 205, 304].includes(response.status) ? null : payload, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } finally {
      unsubscribe();
      options.signal?.removeEventListener("abort", abortForCaller);
    }
  })();
}

function fetchWithCoreConsent(input, options = {}, fetchImpl = globalThis.fetch) {
  if (!usesFirefoxDataCollectionConsent()) return fetchImpl(input, options);
  if (private_browsing_isPrivateBrowsingContext()) return fetchWithFeatureConsent("counts", input, options, fetchImpl);
  const feature = requestFeature(input, options);
  if (!feature) return Promise.reject(coreConsentError());
  return fetchWithFeatureConsent(feature, input, options, fetchImpl);
}



;// CONCATENATED MODULE: ./Extensions/combined/src/account-data-consent.js


function fetchWithAccountConsent(input, options = {}, fetchImpl = globalThis.fetch) {
  if (!usesFirefoxDataCollectionConsent()) return fetchImpl(input, options);
  return (async () => {
    const controller = new AbortController();
    const abortForCaller = () => controller.abort(options.signal.reason);
    const messages = core_data_consent_consentApi()?.runtime?.onMessage;
    const onMessage = (message) => {
      if (message?.message === "patreon_status_changed" && message.authenticated === false)
        controller.abort(coreConsentError());
    };
    messages?.addListener?.(onMessage);
    options.signal?.addEventListener("abort", abortForCaller, { once: true });
    if (options.signal?.aborted) abortForCaller();
    try {
      return await fetchWithFeatureConsent("account", input, { ...options, signal: controller.signal }, fetchImpl);
    } finally {
      messages?.removeListener?.(onMessage);
      options.signal?.removeEventListener("abort", abortForCaller);
    }
  })();
}



;// CONCATENATED MODULE: ./Extensions/combined/src/browser-brand.js
function isMicrosoftEdge(navigatorLike = globalThis.navigator) {
  const brands = navigatorLike?.userAgentData?.brands;
  if (Array.isArray(brands) && brands.length > 0) return brands.some(({ brand }) => brand === "Microsoft Edge");
  return /\bEdg[A-Z]?\//.test(navigatorLike?.userAgent ?? "");
}



;// CONCATENATED MODULE: ./Extensions/combined/src/review-prompt-tracker.js


const STORAGE_KEY = "reviewPromptState";
const review_prompt_tracker_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_THRESHOLD = 5;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

function isVideoId(value) {
  return typeof value === "string" && review_prompt_tracker_VIDEO_ID.test(value);
}

function isValidState(state) {
  if (state === undefined) return true;
  if (!state || typeof state !== "object" || Array.isArray(state)) return false;
  const keys = Object.keys(state);
  if (keys.length !== 1) return false;
  if (keys[0] === "shown") return state.shown === true;
  if (keys[0] === "eligible") return state.eligible === true;
  return (
    keys[0] === "videoIds" &&
    Array.isArray(state.videoIds) &&
    state.videoIds.length > 0 &&
    state.videoIds.length < VIDEO_THRESHOLD &&
    state.videoIds.every(isVideoId) &&
    new Set(state.videoIds).size === state.videoIds.length
  );
}

function youtubePage(url) {
  try {
    const page = new URL(url);
    return ["https:", "http:"].includes(page.protocol) && YOUTUBE_HOSTS.has(page.hostname) ? page : null;
  } catch (_) {
    return null;
  }
}

function videoPageKey(url, videoId) {
  const page = youtubePage(url);
  if (!page) return null;
  if (
    (page.pathname === "/watch" && page.searchParams.get("v") === videoId) ||
    page.pathname === `/shorts/${videoId}` ||
    page.pathname === `/shorts/${videoId}/`
  )
    return `video:${videoId}`;
  const clip = /^\/clip\/([A-Za-z0-9_-]+)\/?$/.exec(page.pathname);
  return clip ? `clip:${clip[1]}` : null;
}

function isAllowedAction(api, action, sender) {
  const manifest = api?.runtime?.getManifest?.();
  return (
    manifest?.manifest_version === 3 &&
    typeof manifest.background?.service_worker === "string" &&
    manifest.background.service_worker.length > 0 &&
    !manifest.browser_specific_settings?.gecko &&
    !isMicrosoftEdge() &&
    typeof api.runtime.id === "string" &&
    api.runtime.id.length > 0 &&
    sender?.id === api.runtime.id &&
    sender.frameId === 0 &&
    Number.isInteger(sender.tab?.id) &&
    sender.tab.id >= 0 &&
    sender.tab.incognito === false &&
    api.extension?.inIncognitoContext !== true &&
    isVideoId(action?.videoId) &&
    (action.vote === 1 || action.vote === -1) &&
    youtubePage(sender.url) !== null &&
    videoPageKey(sender.tab.url ?? sender.url, action.videoId) !== null
  );
}

function createReviewPromptTracker(api) {
  let queue = Promise.resolve();
  let consumed = false;

  async function recordAction(action, sender) {
    const previous = queue;
    let release;
    queue = new Promise((resolve) => {
      release = resolve;
    });

    try {
      await previous;
      if (!isAllowedAction(api, action, sender)) return { showPrompt: false };
      if (consumed) return { showPrompt: false };

      const state = (await api.storage.local.get(STORAGE_KEY))?.[STORAGE_KEY];
      if (state?.shown === true) {
        consumed = true;
        return { showPrompt: false };
      }
      if (!isValidState(state)) return { showPrompt: false };
      if (state?.eligible === true) {
        if (action.vote !== -1 || action.canShow !== true) return { showPrompt: false };
        consumed = true;
        await api.storage.local.set({ [STORAGE_KEY]: { shown: true } });
        const confirmed = (await api.storage.local.get(STORAGE_KEY))?.[STORAGE_KEY];
        return { showPrompt: confirmed?.shown === true && isValidState(confirmed) };
      }

      const storedIds = state?.videoIds ?? [];
      if (storedIds.includes(action.videoId)) return { showPrompt: false };
      const videoIds = [...storedIds, action.videoId];
      if (videoIds.length >= VIDEO_THRESHOLD) {
        await api.storage.local.set({ [STORAGE_KEY]: { eligible: true } });
      } else {
        await api.storage.local.set({ [STORAGE_KEY]: { videoIds } });
      }
      return { showPrompt: false };
    } catch (_) {
      return { showPrompt: false };
    } finally {
      release();
    }
  }

  return { recordAction };
}

;// CONCATENATED MODULE: ./Extensions/combined/src/data-collection-permissions.js


const AUTHENTICATION_DATA_PERMISSION = "authenticationInfo";
const hasAuthenticationDataPermission = (options) => hasFeaturePermission("account", options);

function onAuthenticationDataPermissionRemoved(listener) {
  return onDataPermissionsChanged(({ removed }) => {
    if (removed.includes(AUTHENTICATION_DATA_PERMISSION)) listener();
  });
}



;// CONCATENATED MODULE: ./Extensions/common/vote-transition.js
const {
  DISLIKED_STATE,
  DISLIKE_ACTION,
  LIKED_STATE,
  LIKE_ACTION,
  NEUTRAL_STATE,
  applyVoteTransitionCounts,
  resolveVoteTransition,
  shouldSubmitVote,
} = __webpack_require__(26);



;// CONCATENATED MODULE: ./Extensions/combined/src/vote-submission-setting.js


const DISABLE_VOTE_SUBMISSION_STORAGE_KEY = "disableVoteSubmission";

function readVoteSubmissionDisabled() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([DISABLE_VOTE_SUBMISSION_STORAGE_KEY], (values) =>
      resolve(values?.[DISABLE_VOTE_SUBMISSION_STORAGE_KEY] === true),
    );
  });
}

function allowVoteSubmission() {
  chrome.storage.sync.set({ [DISABLE_VOTE_SUBMISSION_STORAGE_KEY]: false });
}

function onVoteSubmissionSettingChanged(listener) {
  const changed = (changes, area) => {
    if (area === "sync" && changes[DISABLE_VOTE_SUBMISSION_STORAGE_KEY]) listener();
  };
  chrome.storage.onChanged.addListener(changed);
  return () => chrome.storage.onChanged.removeListener(changed);
}

function votesCounted({ granted, submissionDisabled }) {
  return granted && shouldSubmitVote({ disableVoteSubmission: submissionDisabled });
}



;// CONCATENATED MODULE: ./Extensions/combined/src/vote-submission-intent.js


const VOTE_SUBMISSION_INTENT_MESSAGE = "ryd_vote_switch_on_grant";
const VOTE_SUBMISSION_INTENT_TTL_MS = 120000;

function createVoteSubmissionIntent({ hasVotingPermission, allowVoteSubmission, now = () => Date.now() }) {
  let intent = null;

  function isFresh(value) {
    return now() - value.rememberedAt <= VOTE_SUBMISSION_INTENT_TTL_MS;
  }

  function remember() {
    intent = { rememberedAt: now() };
  }

  function clear() {
    intent = null;
  }

  async function applyOnGrant() {
    const current = intent;
    if (!current) return false;
    if (!isFresh(current)) {
      clear();
      return false;
    }
    const granted = await hasVotingPermission();
    if (!granted || intent !== current || !isFresh(current)) return false;
    clear();
    allowVoteSubmission();
    return true;
  }

  return { applyOnGrant, clear, remember };
}

function sendVoteSubmissionIntent(request) {
  consentApi()
    .runtime.sendMessage(request)
    ?.catch?.(() => {});
}

function rememberVoteSubmissionIntent() {
  sendVoteSubmissionIntent({ message: VOTE_SUBMISSION_INTENT_MESSAGE });
}

function withdrawVoteSubmissionIntent() {
  sendVoteSubmissionIntent({ message: VOTE_SUBMISSION_INTENT_MESSAGE, withdraw: true });
}



;// CONCATENATED MODULE: ./Extensions/combined/ryd.background.js













const apiUrl = getApiUrl();
const voteDisabledIconName = config.voteDisabledIconName;
const defaultIconName = config.defaultIconName;
let api;
const CHANGELOG_STORAGE_KEY = "lastShownChangelogVersion";
const DATA_PERMISSIONS_MIGRATION_KEY = "featureDataPermissionsMigrated";

/** stores extension's global config */
let extConfig = { ...config.defaultExtConfig };
let authenticationGeneration = 0;
let accountStorageQueue = Promise.resolve();
let consentPageOpening = null;
let consentPageTabId = null;
let consentPromptPending = false;
let votingPermissionGeneration = 0;
let votingIconRevision = 0;

if (isChrome()) api = chrome;
else if (isFirefox()) api = browser;

const reviewPromptTracker = createReviewPromptTracker(api);
const voteSubmissionIntent = createVoteSubmissionIntent({
  hasVotingPermission: () => hasFeaturePermission("voting", { queryBackground: false }),
  allowVoteSubmission: allowVoteSubmission,
});

if (false) {}

const credentialStore = createBrowserCredentialStore(api.storage.sync, () => api.runtime?.lastError);
function createCurrentVoteClient() {
  const generation = votingPermissionGeneration;
  const assertCurrent = () => {
    if (generation !== votingPermissionGeneration) throw coreConsentError();
  };
  const guard = async () => {
    assertCurrent();
    await requireVotingConsent();
    assertCurrent();
  };
  return createVoteClient({
    apiBaseUrl: apiUrl,
    fetchImpl: async (input, options) => {
      if (usesFirefoxDataCollectionConsent()) await guard();
      return fetchWithFeatureConsent("voting", input, options);
    },
    credentialStore: Object.fromEntries(
      ["load", "save", "clear"].map((method) => [
        method,
        async (...args) => {
          if (usesFirefoxDataCollectionConsent()) await guard();
          const result = await credentialStore[method](...args);
          if (usesFirefoxDataCollectionConsent()) assertCurrent();
          return result;
        },
      ]),
    ),
    cryptoImpl: globalThis.crypto,
  });
}

let currentVoteClient = createCurrentVoteClient();
const voteClient = Object.fromEntries(
  ["ensureRegistered", "submitVote"].map((method) => [
    method,
    async (...args) => {
      const generation = votingPermissionGeneration;
      if (!currentVoteClient) currentVoteClient = createCurrentVoteClient();
      const result = await currentVoteClient[method](...args);
      if (usesFirefoxDataCollectionConsent() && generation !== votingPermissionGeneration) throw coreConsentError();
      return result;
    },
  ]),
);

const discussionBackground = createDiscussionBackground({
  api,
  voteClient,
  fetchImpl: fetchWithCoreConsent,
  accountFetchImpl: fetchWithAccountConsent,
  hasConsent: () => hasFeaturePermission("account", { queryBackground: false }),
  hasFeatureConsent: (feature) => hasFeaturePermission(feature, { queryBackground: false }),
});
discussionBackground.initialize();

initExtConfig();

function broadcastPatreonStatus(authenticated, user, sessionToken, generation = authenticationGeneration) {
  chrome.tabs.query({}, (tabs) => {
    if (generation !== authenticationGeneration) return;
    tabs
      .filter((tab) => {
        if (isFirefoxExtension(api) && tab.incognito !== false) return false;
        try {
          const hostname = new URL(tab.url).hostname;
          return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
        } catch {
          return false;
        }
      })
      .forEach((tab) => {
        const maybePromise = chrome.tabs.sendMessage(
          tab.id,
          {
            message: "patreon_status_changed",
            authenticated,
            user: authenticated ? user : null,
            sessionToken: authenticated ? sessionToken : null,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.debug("Patreon status broadcast skipped:", chrome.runtime.lastError.message);
            }
          },
        );

        if (maybePromise && typeof maybePromise.catch === "function") {
          maybePromise.catch((error) => {
            console.debug("Patreon status broadcast skipped:", error?.message ?? error);
          });
        }
      });
  });
}

function handlePatreonAuthComplete(user, sessionToken, generation, done) {
  if (!user || !sessionToken || generation !== authenticationGeneration) {
    done?.(false);
    return;
  }

  if (usesFirefoxDataCollectionConsent()) {
    hasAuthenticationDataPermission({ queryBackground: false }).then((granted) => {
      if (granted && generation === authenticationGeneration) persistPatreonAuth(user, sessionToken, generation, done);
      else done?.(false);
    });
    return;
  }

  persistPatreonAuth(user, sessionToken, generation, done);
}

function persistPatreonAuth(user, sessionToken, generation, done) {
  queueAccountStorageMutation((complete) => {
    if (generation !== authenticationGeneration) {
      complete();
      return;
    }
    chrome.storage.sync.set(
      {
        patreonAuthenticated: true,
        patreonUser: user,
        patreonSessionToken: sessionToken,
      },
      () => {
        if (chrome.runtime.lastError || generation !== authenticationGeneration) {
          complete();
          return;
        }
        chrome.storage.sync.set({ hidePremiumTeaser: false }, complete);
      },
    );
  })
    .then(() => {
      if (generation !== authenticationGeneration) {
        done?.(false);
        return;
      }
      broadcastPatreonStatus(true, user, sessionToken, generation);
      done?.(true);
    })
    .catch(() => done?.(false));
}

function queueAccountStorageMutation(operation) {
  const pending = accountStorageQueue.then(
    () =>
      new Promise((resolve, reject) => {
        operation(() => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      }),
  );
  accountStorageQueue = pending.catch(() => {});
  return pending;
}

function clearPatreonAuth(done) {
  const generation = ++authenticationGeneration;
  discussionBackground.clearSession(true);
  broadcastPatreonStatus(false, null, null, generation);
  queueAccountStorageMutation((complete) => {
    chrome.storage.sync.remove(["patreonAuthenticated", "patreonUser", "patreonSessionToken"], complete);
  })
    .then(() => {
      discussionBackground.resumeSession().catch(() => {});
      done?.();
    })
    .catch((error) => console.error("Account session cleanup failed", error));
}

core_data_consent_onDataPermissionsChanged((change) => {
  const voting = (category) => FEATURE_DATA_PERMISSIONS.voting.includes(category);
  if (change.removed.some(voting)) {
    votingPermissionGeneration++;
    currentVoteClient = null;
    voteSubmissionIntent.clear();
  }
  if (change.added.some(voting)) void voteSubmissionIntent.applyOnGrant();
  if (change.removed.includes("authenticationInfo")) clearPatreonAuth();
  discussionBackground.onDataPermissionsChanged(change).catch((error) => {
    console.debug("Discussion permission update failed", error);
  });
  if ([...change.added, ...change.removed].some(voting)) {
    void refreshVotingIcon();
  }
  api.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
    for (const tab of tabs) {
      let tabChange = change;
      if (isFirefoxExtension(api) && tab.incognito !== false) {
        if (tab.incognito !== true) continue;
        tabChange = {
          added: change.added.filter((category) => category === "browsingActivity"),
          removed: change.removed.filter((category) => category === "browsingActivity"),
        };
        if (!tabChange.added.length && !tabChange.removed.length) continue;
      }
      const result = api.tabs.sendMessage(tab.id, { message: "ryd_data_permissions_changed", ...tabChange }, () => {
        void api.runtime.lastError;
      });
      result?.catch?.(() => {});
    }
  });
});

async function requireVotingConsent() {
  if (!(await hasFeaturePermission("voting", { queryBackground: false }))) throw coreConsentError();
}

async function requireCurrentAuthenticationConsent(generation) {
  if (
    generation !== authenticationGeneration ||
    (usesFirefoxDataCollectionConsent() && !(await hasAuthenticationDataPermission({ queryBackground: false }))) ||
    generation !== authenticationGeneration
  ) {
    throw new Error("authentication data consent removed or sign-in cancelled");
  }
}

function getIdentityApi() {
  if (isFirefox() && browser.identity) return browser.identity;
  if (isChrome() && chrome.identity) return chrome.identity;
  return null;
}

function launchWebAuthFlow(url) {
  try {
    if (isFirefox() && browser.identity && typeof browser.identity.launchWebAuthFlow === "function") {
      return browser.identity.launchWebAuthFlow({ url, interactive: true });
    }
  } catch (_) {}
  return new Promise((resolve, reject) => {
    if (!isChrome() || !chrome.identity || typeof chrome.identity.launchWebAuthFlow !== "function") {
      reject(new Error("identity API not available"));
      return;
    }
    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(responseUrl);
    });
  });
}

function extractOAuthParams(responseUrl) {
  try {
    const u = new URL(responseUrl);
    let code = u.searchParams.get("code");
    let state = u.searchParams.get("state");
    if (!code && u.hash) {
      const hashParams = new URLSearchParams(u.hash.startsWith("#") ? u.hash.substring(1) : u.hash);
      code = hashParams.get("code");
      state = state || hashParams.get("state");
    }
    return { code, state };
  } catch (_) {
    return { code: null, state: null };
  }
}

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    (request?.message === "ryd_has_feature_consent" && request.feature === "counts") ||
    isNormalMessageSender(api, sender)
  ) {
    return handleMessage(request, sender, sendResponse);
  }
  sendResponse({
    success: false,
    ok: false,
    granted: false,
    error: { code: "private_browsing", message: "Only count display is available in private windows." },
  });
});

function isOwnPopupSender(sender) {
  try {
    const url = new URL(sender.url);
    const popup = new URL(api.runtime.getURL("popup.html"));
    return (
      sender.id === api.runtime.id &&
      sender.tab?.incognito !== true &&
      url.protocol === popup.protocol &&
      url.host === popup.host &&
      url.pathname === popup.pathname
    );
  } catch (_) {
    return false;
  }
}

function handleMessage(request, sender, sendResponse) {
  if (request?.message === "ryd_review_action") {
    void (async () => {
      sendResponse(await reviewPromptTracker.recordAction(request, sender));
    })();
    return true;
  } else if (request?.message === "ryd_open_consent_popup") {
    let validSender = false;
    try {
      const { protocol, hostname } = new URL(sender.url);
      validSender =
        usesFirefoxDataCollectionConsent() &&
        sender.id === api.runtime.id &&
        sender.tab?.incognito === false &&
        sender.frameId === 0 &&
        protocol === "https:" &&
        (hostname === "youtube.com" || hostname.endsWith(".youtube.com"));
    } catch (_) {}
    if (!validSender) {
      sendResponse({ success: false });
      return;
    }
    void (async () => {
      try {
        await browser.browserAction.openPopup({ windowId: sender.tab.windowId });
        sendResponse({ success: true });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  } else if (request?.message === "ryd_open_consent") {
    if (!usesFirefoxDataCollectionConsent()) {
      sendResponse({ success: false });
      return;
    }
    const consentUrl = api.runtime.getURL("consent.html");
    const isConsentPage = (url) => {
      try {
        const parsed = new URL(url);
        const target = new URL(consentUrl);
        return (
          parsed.protocol === target.protocol && parsed.host === target.host && parsed.pathname === target.pathname
        );
      } catch (_) {
        return false;
      }
    };
    const feature = ["voteOptIn", "account"].includes(request.feature) ? request.feature : "voteOptIn";
    const targetUrl = `${consentUrl}?feature=${feature}${request.details === true ? "#permission-details" : ""}`;
    let isYouTubeLauncher = false;
    if (sender.tab?.incognito === false && sender.frameId === 0) {
      try {
        const { protocol, hostname } = new URL(sender.url);
        isYouTubeLauncher = protocol === "https:" && (hostname === "youtube.com" || hostname.endsWith(".youtube.com"));
      } catch (_) {}
    }
    if (sender.id !== api.runtime.id || !isYouTubeLauncher) {
      sendResponse({ success: false });
      return;
    }
    if (!consentPageOpening) {
      consentPageOpening = (async () => {
        const tabs = (typeof browser !== "undefined" ? browser : api).tabs;
        if (consentPageTabId !== null) {
          try {
            const existing = await tabs.get(consentPageTabId);
            if (isConsentPage(existing.url) && existing.incognito === false) {
              if (!consentPromptPending && existing.url !== targetUrl) {
                await tabs.update(consentPageTabId, { url: targetUrl });
              }
              await tabs.update(consentPageTabId, { active: true });
              if (Number.isInteger(existing.windowId))
                await api.windows?.update?.(existing.windowId, { focused: true });
              return;
            }
          } catch (_) {}
        }
        const tab = await tabs.create({
          url: targetUrl,
          ...(Number.isInteger(sender.tab?.windowId) ? { windowId: sender.tab.windowId } : {}),
        });
        consentPageTabId = tab.id;
        consentPromptPending = false;
      })().finally(() => {
        consentPageOpening = null;
      });
    }
    consentPageOpening.then(
      () => sendResponse({ success: true }),
      () => sendResponse({ success: false }),
    );
    return true;
  } else if (request?.message === VOTE_SUBMISSION_INTENT_MESSAGE) {
    const accepted = usesFirefoxDataCollectionConsent() && isOwnPopupSender(sender);
    if (accepted && request.withdraw === true) voteSubmissionIntent.clear();
    else if (accepted) voteSubmissionIntent.remember();
    sendResponse({ success: accepted });
    return;
  } else if (request?.message === "ryd_consent_prompt_state") {
    if (
      usesFirefoxDataCollectionConsent() &&
      sender.id === api.runtime.id &&
      sender.tab?.id === consentPageTabId &&
      sender.url?.startsWith(`${api.runtime.getURL("consent.html")}?feature=`)
    ) {
      consentPromptPending = request.pending === true;
      sendResponse({ success: true });
    } else sendResponse({ success: false });
    return;
  } else if (request?.message === "ryd_has_feature_consent") {
    if (!usesFirefoxDataCollectionConsent()) {
      sendResponse({ granted: false });
      return;
    }
    hasFeaturePermission(request.feature, { queryBackground: false }).then((granted) => sendResponse({ granted }));
    return true;
  } else if (request?.message === "ryd_discussion") {
    discussionBackground
      .handleMessage(request, sender)
      .then(sendResponse)
      .catch(() =>
        sendResponse({ ok: false, error: { code: "consent_required", message: "Enable RYD to continue." } }),
      );
    return true;
  } else if (request.message === "patreon_logout") {
    clearPatreonAuth();
  } else if (request.message === "ryd_open_tab") {
    const targetUrl = typeof request?.url === "string" ? request.url : null;
    const allowedUrls = new Set([
      "https://www.patreon.com/join/returnyoutubedislike/checkout?rid=8008649",
      getChangelogUrl(),
    ]);
    if (!allowedUrls.has(targetUrl)) {
      sendResponse?.({ success: false, error: "invalid_url" });
      return;
    }

    try {
      if (api?.tabs?.create) {
        api.tabs.create({ url: targetUrl }, () => {
          if (api.runtime?.lastError) {
            console.debug("Tab open failed:", api.runtime.lastError.message);
          }
        });
        sendResponse?.({ success: true });
        return;
      }
    } catch (error) {
      console.debug("Tab open threw:", error?.message ?? error);
    }

    sendResponse?.({ success: false, error: "tabs_api_unavailable" });
    return;
  } else if (request.message == "send_vote") {
    const generation = votingPermissionGeneration;
    requireVotingConsent()
      .then(() => {
        if (usesFirefoxDataCollectionConsent() && generation !== votingPermissionGeneration) throw coreConsentError();
        if (extConfig.disableVoteSubmission) throw new Error("Vote submission is disabled.");
        return voteClient.submitVote(request.videoId, request.vote);
      })
      .then(() => sendResponse?.({ success: true }))
      .catch((error) => sendResponse?.({ success: false, error: error.message }));
    return true;
  } else if (request.message === "patreon_oauth_login") {
    const generation = ++authenticationGeneration;
    (async () => {
      try {
        await requireCurrentAuthenticationConsent(generation);

        const idApi = getIdentityApi();
        if (
          !idApi ||
          typeof (idApi.getRedirectURL || (isChrome() && chrome.identity && chrome.identity.getRedirectURL)) !==
            "function"
        ) {
          sendResponse({ success: false, error: "identity API not available" });
          return;
        }
        const redirectUri =
          isFirefox() && browser.identity.getRedirectURL
            ? browser.identity.getRedirectURL()
            : isChrome() && chrome.identity.getRedirectURL
              ? chrome.identity.getRedirectURL()
              : "";

        const startRes = await fetchWithAccountConsent(
          getApiEndpoint(`/api/auth/oauth/login?redirectUri=${encodeURIComponent(redirectUri)}`),
        );
        const startData = await startRes.json();

        await requireCurrentAuthenticationConsent(generation);
        const responseUrl = await launchWebAuthFlow(startData.authUrl);
        const { code, state } = extractOAuthParams(responseUrl);
        if (!code) {
          sendResponse({ success: false, error: "No authorization code received" });
          return;
        }

        await requireCurrentAuthenticationConsent(generation);

        const exchangeRes = await fetchWithAccountConsent(getApiEndpoint("/api/auth/oauth/exchange"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            state,
            expectedState: startData.state,
            redirectUri: startData.redirectUri || redirectUri,
          }),
        });
        const authData = await exchangeRes.json();
        if (authData && authData.success) {
          handlePatreonAuthComplete(authData.user, authData.sessionToken, generation, (stored) => {
            sendResponse(
              stored
                ? { success: true, user: authData.user }
                : { success: false, error: "authentication data consent removed" },
            );
          });
        } else {
          sendResponse({ success: false, error: (authData && authData.error) || "OAuth exchange failed" });
        }
      } catch (e) {
        console.error("patreon_oauth_login error", e);
        sendResponse({ success: false, error: String((e && e.message) || e) });
      }
    })();
    return true;
  } else if (request.message === "github_oauth_login") {
    const generation = ++authenticationGeneration;
    (async () => {
      try {
        await requireCurrentAuthenticationConsent(generation);

        const idApi = getIdentityApi();
        if (
          !idApi ||
          typeof (idApi.getRedirectURL || (isChrome() && chrome.identity && chrome.identity.getRedirectURL)) !==
            "function"
        ) {
          sendResponse({ success: false, error: "identity API not available" });
          return;
        }

        const redirectUri =
          isFirefox() && browser.identity.getRedirectURL
            ? browser.identity.getRedirectURL()
            : isChrome() && chrome.identity.getRedirectURL
              ? chrome.identity.getRedirectURL()
              : "";

        const authData = await loginWithGitHub({
          fetchImpl: fetchWithAccountConsent,
          redirectUri,
          launchWebAuthFlow,
          requireConsent: () => requireCurrentAuthenticationConsent(generation),
        });
        if (authData && authData.success) {
          handlePatreonAuthComplete(authData.user, authData.sessionToken, generation, (stored) => {
            sendResponse(
              stored
                ? { success: true, user: authData.user }
                : { success: false, error: "authentication data consent removed" },
            );
          });
        } else {
          sendResponse({ success: false, error: (authData && authData.error) || "OAuth exchange failed" });
        }
      } catch (e) {
        console.error("github_oauth_login error", e);
        sendResponse({ success: false, error: String((e && e.message) || e) });
      }
    })();
    return true;
  }
}

function openChangelogTab(version, { active } = {}) {
  try {
    const url = getChangelogUrl();
    api.tabs.create({ url, ...(active === false ? { active: false } : {}) }, () => {
      if (api.runtime.lastError) {
        console.debug("Changelog tab could not open:", api.runtime.lastError.message);
        return;
      }
      persistChangelogVersion(version);
    });
  } catch (error) {
    console.debug("Failed to open changelog tab", error);
  }
}

function persistChangelogVersion(version) {
  api.storage.local?.set?.({ [CHANGELOG_STORAGE_KEY]: version || true });
}

function readStorage(area, keys) {
  return new Promise((resolve, reject) => {
    const storage = api.storage[area];
    if (!storage?.get) return reject(new Error("Storage is unavailable."));
    storage.get(keys, (value) => {
      if (api.runtime.lastError) reject(new Error(api.runtime.lastError.message));
      else resolve(value ?? {});
    });
  });
}

async function refreshVotingIcon() {
  const current = ++votingIconRevision;
  const granted = await hasFeaturePermission("voting", { queryBackground: false });
  if (current !== votingIconRevision) return;
  const counted = votesCounted({ granted, submissionDisabled: extConfig.disableVoteSubmission });
  const name = api.i18n.getMessage("extensionName");
  setToolbarState(
    counted ? defaultIconName : voteDisabledIconName,
    counted ? name : `${name}\n${api.i18n.getMessage("vote_not_counted")}`,
  );
}

function markDataPermissionsMigrated() {
  api.storage.local?.set?.({ [DATA_PERMISSIONS_MIGRATION_KEY]: true });
}

async function migrateDataPermissions() {
  if (!usesFirefoxDataCollectionConsent()) return;
  const local = await readStorage("local", [DATA_PERMISSIONS_MIGRATION_KEY]);
  if (local[DATA_PERMISSIONS_MIGRATION_KEY]) return;
  const generation = authenticationGeneration;
  const previous = await readStorage("sync", ["patreonSessionToken"]);
  if (!previous.patreonSessionToken && generation === authenticationGeneration) {
    await api.permissions.remove({ data_collection: ["personallyIdentifyingInfo"] });
  }
  markDataPermissionsMigrated();
  await refreshVotingIcon();
}

async function handleInstallation(details) {
  api.storage.local?.remove?.("pendingChangelogVersion");
  if (details?.reason === "update") {
    try {
      await migrateDataPermissions();
    } catch (error) {
      console.debug("Permission settings migration could not finish", error);
    }
    return;
  }
  if (details?.reason !== "install") return;
  if (usesFirefoxDataCollectionConsent()) markDataPermissionsMigrated();
  const stored = await readStorage("local", [CHANGELOG_STORAGE_KEY]).catch(() => ({}));
  if (!stored[CHANGELOG_STORAGE_KEY]) openChangelogTab(api.runtime.getManifest()?.version);
}

api.runtime.onInstalled.addListener((details) => {
  void handleInstallation(details);
});

api.runtime.onStartup?.addListener?.(() => {
  api.storage.local?.remove?.("pendingChangelogVersion");
});

function storageChangeHandler(changes, area) {
  discussionBackground.onStorageChanged(changes, area);
  if (changes.disableVoteSubmission !== undefined) {
    voteSubmissionIntent.clear();
    handleDisableVoteSubmissionChangeEvent(changes.disableVoteSubmission.newValue);
  }
  if (changes.coloredThumbs !== undefined) {
    handleColoredThumbsChangeEvent(changes.coloredThumbs.newValue);
  }
  if (changes.coloredBar !== undefined) {
    handleColoredBarChangeEvent(changes.coloredBar.newValue);
  }
  if (changes.colorTheme !== undefined) {
    handleColorThemeChangeEvent(changes.colorTheme.newValue);
  }
  if (changes.numberDisplayFormat !== undefined) {
    handleNumberDisplayFormatChangeEvent(changes.numberDisplayFormat.newValue);
  }
  if (changes.numberDisplayReformatLikes !== undefined) {
    handleNumberDisplayReformatLikesChangeEvent(changes.numberDisplayReformatLikes.newValue);
  }
  if (changes.disableLogging !== undefined) {
    handleDisableLoggingChangeEvent(changes.disableLogging.newValue);
  }
  if (changes.showTooltipPercentage !== undefined) {
    handleShowTooltipPercentageChangeEvent(changes.showTooltipPercentage.newValue);
  }
  if (changes.numberDisplayReformatLikes !== undefined) {
    handleNumberDisplayReformatLikesChangeEvent(changes.numberDisplayReformatLikes.newValue);
  }
  if (changes.hidePremiumTeaser !== undefined) {
    handleHidePremiumTeaserChangeEvent(changes.hidePremiumTeaser.newValue);
  }
  if (changes.hideClutterButtons !== undefined) {
    handleHideClutterButtonsChangeEvent(changes.hideClutterButtons.newValue);
  }
}

function handleDisableVoteSubmissionChangeEvent(value) {
  extConfig.disableVoteSubmission = value;
  void refreshVotingIcon();
}

function handleDisableLoggingChangeEvent(value) {
  extConfig.disableLogging = value;
}

function handleNumberDisplayFormatChangeEvent(value) {
  extConfig.numberDisplayFormat = value;
}

function handleShowTooltipPercentageChangeEvent(value) {
  extConfig.showTooltipPercentage = value;
}

function handleTooltipPercentageModeChangeEvent(value) {
  if (!value) {
    value = "dash_like";
  }
  extConfig.tooltipPercentageMode = value;
}

function setToolbarState(iconName, title) {
  const toolbar = api.action ?? api.browserAction;
  if (toolbar === undefined) {
    console.log("changing icon is not supported");
    return;
  }
  toolbar.setIcon({ path: "/icons/" + iconName });
  toolbar.setTitle({ title });
}

function handleColoredThumbsChangeEvent(value) {
  extConfig.coloredThumbs = value;
}

function handleColoredBarChangeEvent(value) {
  extConfig.coloredBar = value;
}

function handleColorThemeChangeEvent(value) {
  if (!value) {
    value = "classic";
  }
  extConfig.colorTheme = value;
}

function handleNumberDisplayReformatLikesChangeEvent(value) {
  extConfig.numberDisplayReformatLikes = value;
}

function handleHidePremiumTeaserChangeEvent(value) {
  extConfig.hidePremiumTeaser = value === true;
}

function handleHideClutterButtonsChangeEvent(value) {
  extConfig.hideClutterButtons = value === true;
}

api.storage.onChanged.addListener(storageChangeHandler);

function initExtConfig() {
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeColoredThumbs();
  initializeColoredBar();
  initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeNumberDisplayReformatLikes();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeHidePremiumTeaser();
  initializeHideClutterButtons();
}

function initializeDisableVoteSubmission() {
  api.storage.sync.get(["disableVoteSubmission"], (res) => {
    if (res.disableVoteSubmission === undefined) {
      api.storage.sync.set({ disableVoteSubmission: false });
    } else {
      extConfig.disableVoteSubmission = res.disableVoteSubmission;
    }
    void refreshVotingIcon();
  });
}

function initializeDisableLogging() {
  api.storage.sync.get(["disableLogging"], (res) => {
    if (res.disableLogging === undefined) {
      api.storage.sync.set({ disableLogging: true });
    } else {
      extConfig.disableLogging = res.disableLogging;
    }
  });
}

function initializeColoredThumbs() {
  api.storage.sync.get(["coloredThumbs"], (res) => {
    if (res.coloredThumbs === undefined) {
      api.storage.sync.set({ coloredThumbs: false });
    } else {
      extConfig.coloredThumbs = res.coloredThumbs;
    }
  });
}

function initializeColoredBar() {
  api.storage.sync.get(["coloredBar"], (res) => {
    if (res.coloredBar === undefined) {
      api.storage.sync.set({ coloredBar: false });
    } else {
      extConfig.coloredBar = res.coloredBar;
    }
  });
}

function initializeColorTheme() {
  api.storage.sync.get(["colorTheme"], (res) => {
    if (res.colorTheme === undefined) {
      api.storage.sync.set({ colorTheme: false });
    } else {
      extConfig.colorTheme = res.colorTheme;
    }
  });
}

function initializeNumberDisplayFormat() {
  api.storage.sync.get(["numberDisplayFormat"], (res) => {
    if (res.numberDisplayFormat === undefined) {
      api.storage.sync.set({ numberDisplayFormat: "compactShort" });
    } else {
      extConfig.numberDisplayFormat = res.numberDisplayFormat;
    }
  });
}

function initializeTooltipPercentage() {
  api.storage.sync.get(["showTooltipPercentage"], (res) => {
    if (res.showTooltipPercentage === undefined) {
      api.storage.sync.set({ showTooltipPercentage: false });
    } else {
      extConfig.showTooltipPercentage = res.showTooltipPercentage;
    }
  });
}

function initializeTooltipPercentageMode() {
  api.storage.sync.get(["tooltipPercentageMode"], (res) => {
    if (res.tooltipPercentageMode === undefined) {
      api.storage.sync.set({ tooltipPercentageMode: "dash_like" });
    } else {
      extConfig.tooltipPercentageMode = res.tooltipPercentageMode;
    }
  });
}

function initializeNumberDisplayReformatLikes() {
  api.storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    if (res.numberDisplayReformatLikes === undefined) {
      api.storage.sync.set({ numberDisplayReformatLikes: false });
    } else {
      extConfig.numberDisplayReformatLikes = res.numberDisplayReformatLikes;
    }
  });
}

function initializeHidePremiumTeaser() {
  api.storage.sync.get(["hidePremiumTeaser"], (res) => {
    if (res.hidePremiumTeaser === undefined) {
      api.storage.sync.set({ hidePremiumTeaser: false });
      extConfig.hidePremiumTeaser = false;
    } else {
      extConfig.hidePremiumTeaser = res.hidePremiumTeaser === true;
    }
  });
}

function initializeHideClutterButtons() {
  api.storage.sync.get(["hideClutterButtons"], (res) => {
    if (res.hideClutterButtons === undefined) {
      api.storage.sync.set({ hideClutterButtons: false });
      extConfig.hideClutterButtons = false;
    } else {
      extConfig.hideClutterButtons = res.hideClutterButtons === true;
    }
  });
}

function isChrome() {
  return typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined";
}

function isFirefox() {
  return typeof browser !== "undefined" && typeof browser.runtime !== "undefined";
}

})();

/******/ })()
;