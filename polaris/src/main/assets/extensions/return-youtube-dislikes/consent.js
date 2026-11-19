/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

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

function config_getApiUrl() {
  return config.apiUrl;
}

function getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



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



;// CONCATENATED MODULE: ./Extensions/combined/src/core-data-consent.js



const FEATURE_DATA_PERMISSIONS = Object.freeze({
  counts: Object.freeze(["browsingActivity"]),
  likeCount: Object.freeze(["websiteContent"]),
  voting: Object.freeze(["browsingActivity", "websiteActivity"]),
  voteOptIn: Object.freeze(["browsingActivity", "websiteActivity", "websiteContent"]),
  account: Object.freeze(["authenticationInfo", "personallyIdentifyingInfo"]),
});

function consentApi() {
  return typeof browser !== "undefined" ? browser : globalThis.chrome;
}

function usesFirefoxDataCollectionConsent() {
  return Boolean(consentApi()?.runtime?.getManifest?.()?.browser_specific_settings?.gecko?.data_collection_permissions);
}

function coreConsentError() {
  return new Error("Data consent required for this feature.");
}

async function hasFeaturePermission(feature, { queryBackground = true } = {}) {
  const required = FEATURE_DATA_PERMISSIONS[feature];
  if (!required) return false;
  if (private_browsing_isPrivateBrowsingContext() && feature !== "counts") return false;
  if (!usesFirefoxDataCollectionConsent()) return true;
  const api = consentApi();
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
  if (!required || private_browsing_isPrivateBrowsingContext()) return Promise.resolve(false);
  if (!usesFirefoxDataCollectionConsent()) return Promise.resolve(true);
  try {
    const pending = consentApi().permissions.request({ data_collection: required });
    return Promise.resolve(pending).then(
      (granted) => granted === true && hasFeaturePermission(feature, { queryBackground: false }),
      () => false,
    );
  } catch (_) {
    return Promise.resolve(false);
  }
}

function onDataPermissionsChanged(listener) {
  if (!usesFirefoxDataCollectionConsent()) return () => {};
  const api = consentApi();
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
    if (isPrivateBrowsingContext()) {
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
    const unsubscribe = onDataPermissionsChanged(({ removed }) => {
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
  if (isPrivateBrowsingContext()) return fetchWithFeatureConsent("counts", input, options, fetchImpl);
  const feature = requestFeature(input, options);
  if (!feature) return Promise.reject(coreConsentError());
  return fetchWithFeatureConsent(feature, input, options, fetchImpl);
}



;// CONCATENATED MODULE: ./Extensions/combined/src/data-permission-list.js


const DATA_PERMISSION_COPY = Object.freeze({
  browsingActivity: Object.freeze({ label: "consent_browsing_label", body: "consent_browsing_body" }),
  websiteActivity: Object.freeze({ label: "consent_activity_label", body: "consent_activity_body" }),
  websiteContent: Object.freeze({ label: "consent_content_label", body: "consent_content_body" }),
  authenticationInfo: Object.freeze({ label: "consent_auth_label", body: "consent_auth_body" }),
  personallyIdentifyingInfo: Object.freeze({ label: "consent_identity_label", body: "consent_identity_body" }),
});

function createTextNode(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function renderDataPermissionList(list, feature, message) {
  list.replaceChildren(
    ...FEATURE_DATA_PERMISSIONS[feature].flatMap((category) => [
      createTextNode("dt", message(DATA_PERMISSION_COPY[category].label)),
      createTextNode("dd", message(DATA_PERMISSION_COPY[category].body)),
    ]),
  );
}



;// CONCATENATED MODULE: ./Extensions/combined/consent.js




function localizeHtmlPage() {
  const locale = chrome.i18n.getMessage("@@ui_locale");
  if (locale) document.documentElement.lang = locale.replaceAll("_", "-");
  const direction = chrome.i18n.getMessage("@@bidi_dir");
  if (direction === "rtl" || direction === "ltr") document.documentElement.dir = direction;
  document.documentElement.innerHTML = document.documentElement.innerHTML.replace(/__MSG_(\w+)__/g, (_, key) =>
    chrome.i18n.getMessage(key),
  );
}

localizeHtmlPage();
const privateBrowsing = private_browsing_isPrivateBrowsingContext();
const CONSENT_PAGES = Object.freeze({
  voteOptIn: Object.freeze({ permission: "voteOptIn", grantedBy: "voting", copy: "vote" }),
  account: Object.freeze({ permission: "account", copy: "account" }),
});
const requestedFeature = new URLSearchParams(window.location.search).get("feature");
const page = Object.hasOwn(CONSENT_PAGES, requestedFeature) ? CONSENT_PAGES[requestedFeature] : CONSENT_PAGES.voteOptIn;
const feature = page.permission;
const grantedFeature = page.grantedBy ?? feature;
const continueButton = document.getElementById("consent-continue");
const declineButton = document.getElementById("consent-decline");
const actions = document.getElementById("consent-actions");
const consent_status = document.getElementById("consent-status");
const message = (key) => chrome.i18n.getMessage(key);
let permissionRevision = 0;
let promptPending = false;

document.getElementById("consent-title").textContent = message(`consent_${page.copy}_title`);
document.getElementById("consent-body").textContent = message(`consent_${page.copy}_body`);
renderDataPermissionList(document.getElementById("permission-list"), feature, message);

if (privateBrowsing) {
  document.getElementById("consent-title").textContent = message("extensionName");
  document.getElementById("consent-body").textContent = message("consent_private_counts");
  document.getElementById("consent-next-step").hidden = true;
  actions.hidden = true;
  document.getElementById("permission-details").hidden = true;
} else {
  void refreshPermissionState();
  const unsubscribe = onDataPermissionsChanged(({ added, removed }) => {
    const required = FEATURE_DATA_PERMISSIONS[grantedFeature];
    if (![...added, ...removed].some((category) => required.includes(category))) return;
    permissionRevision++;
    if (promptPending) return;
    if (removed.some((category) => required.includes(category))) {
      actions.hidden = false;
      consent_status.textContent = message("consent_declined_status");
    }
    void refreshPermissionState("consent_declined_status");
  });
  window.addEventListener("unload", unsubscribe, { once: true });

  continueButton.addEventListener("click", () => {
    promptPending = true;
    permissionRevision++;
    const request = requestFeaturePermission(feature);
    notifyPromptState(true);
    continueButton.disabled = true;
    declineButton.disabled = true;
    consent_status.textContent = message("consent_prompt_status");
    void finishRequest(request);
  });
  declineButton.addEventListener("click", () => {
    permissionRevision++;
    consent_status.textContent = message("consent_declined_status");
  });
}

async function finishRequest(request) {
  let deniedMessage = "consent_declined_status";
  try {
    await request;
  } catch (_) {
    deniedMessage = "consent_error_status";
  } finally {
    promptPending = false;
    notifyPromptState(false);
    await refreshPermissionState(deniedMessage);
    continueButton.disabled = false;
    declineButton.disabled = false;
  }
}

async function refreshPermissionState(deniedMessage = "") {
  const revision = ++permissionRevision;
  const granted = await hasFeaturePermission(grantedFeature);
  if (promptPending || revision !== permissionRevision) return;
  actions.hidden = granted;
  consent_status.textContent = granted ? message("consent_granted_status") : deniedMessage ? message(deniedMessage) : "";
}

function notifyPromptState(pending) {
  try {
    const result = browser.runtime.sendMessage({ message: "ryd_consent_prompt_state", pending });
    result?.catch?.(() => {});
  } catch (_) {}
}

/******/ })()
;