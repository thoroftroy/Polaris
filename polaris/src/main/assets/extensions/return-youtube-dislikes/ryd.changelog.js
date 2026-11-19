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

function config_getApiUrl() {
  return config.apiUrl;
}

function config_getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



;// CONCATENATED MODULE: ./Extensions/combined/src/logging.js
let loggingDisabled = false;

function logging_setLoggingDisabled(value) {
  loggingDisabled = value;
}

const logging_logger = {
  log(...args) {
    if (!loggingDisabled) console.log(...args);
  },
  debug(...args) {
    if (!loggingDisabled) console.debug(...args);
  },
};

;// CONCATENATED MODULE: ./Extensions/combined/src/buttons.js






const buttonsVideoOwnership = new WeakMap();
const createdDislikeTextTypography = new WeakMap();
const COUNT_TYPOGRAPHY_ATTRIBUTE = "data-ryd-count-typography";
const COUNT_TYPOGRAPHY_PROPERTIES = (/* unused pure expression or super */ null && (["font-size", "font-weight", "font-family", "line-height"]));
const SYNTHETIC_SHORTS_DISLIKE_SELECTOR = "[data-ryd-synthetic-shorts-dislike]";
const EXTENSION_SHORTS_ACTION_SELECTOR = (/* unused pure expression or super */ null && (`${SYNTHETIC_SHORTS_DISLIKE_SELECTOR}, #${SHORTS_LAUNCHER_ID}`));
const SHORTS_DISLIKE_ICON_PATH =
  "m8.482 1.5.294.005a9.01 9.01 0 013.918 1.04l.257.143.203.116c.17.097.357.16.55.185l.194.012h1.477l.115.006c.53.054.95.475 1.004 1.005l.006.114v4.499c0 .621-.504 1.125-1.125 1.125h-1.343a.75.75 0 00-.66.395l-.048.107-2.24 6.402a.75.75 0 01-.832.491l-.78-.13a3 3 0 01-2.439-3.587L7.5 11.25H4.454a2.749 2.749 0 01-2.683-2.151 2.762 2.762 0 01.479-2.237l-.016-.065A2.862 2.862 0 013 4.125v-.032c0-.227.037-.453.108-.668l.08-.211A2.816 2.816 0 015.78 1.5h2.703ZM5.78 3c-.566 0-1.069.362-1.248.9a.613.613 0 00-.031.193v.654l-.44.44c-.333.332-.47.813-.364 1.271l.015.065.157.675-.413.557a1.248 1.248 0 00.999 1.995H7.5a1.501 1.501 0 011.467 1.815L8.5 13.742a1.5 1.5 0 001.22 1.794l.157.027 2.031-5.806a2.25 2.25 0 012.124-1.507H15V4.501h-1.102a3.001 3.001 0 01-1.489-.396l-.202-.116A7.504 7.504 0 008.482 3H5.78Z";

function hasRenderedBox(element) {
  if (!element?.isConnected || element.closest("[hidden], [aria-hidden='true'], [inert]")) {
    return false;
  }
  for (let current = element; current; current = current.parentElement) {
    const style = window.getComputedStyle(current);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number.parseFloat(style.opacity) === 0
    ) {
      return false;
    }
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function intersectsViewport(element) {
  const rect = element.getBoundingClientRect();
  const height = innerHeight || document.documentElement.clientHeight;
  const width = innerWidth || document.documentElement.clientWidth;
  return (
    rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width
  );
}

function hasMeaningfulViewportPresence(element) {
  const rect = element?.getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  const height = innerHeight || document.documentElement.clientHeight;
  const width = innerWidth || document.documentElement.clientWidth;
  const visibleWidth = Math.max(0, Math.min(rect.right, width) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
  return (visibleWidth * visibleHeight) / (rect.width * rect.height) >= 0.5;
}

function configuredMatches(selectors) {
  const matches = [];
  for (const selector of Array.isArray(selectors) ? selectors : [selectors]) {
    if (selector) matches.push(...document.querySelectorAll(selector));
  }
  return matches;
}

function getDesktopWatchButtonCandidates() {
  return Array.from(
    new Set([
      ...configuredMatches(extConfig.selectors.buttons.regular.desktopMenu),
      ...configuredMatches(extConfig.selectors.buttons.regular.desktopNoMenu),
    ]),
  ).filter((candidate) => {
    const segmented = querySelector(extConfig.selectors.buttons.segmentedContainer, candidate);
    const like = querySelector(extConfig.selectors.buttons.likeButton.notSegmented, candidate);
    return segmented !== undefined || like !== undefined;
  });
}

function markButtonsForVideo(buttons, videoId) {
  if (buttons && videoId) {
    buttonsVideoOwnership.set(buttons, videoId);
  }
}

function getButtonsVideoOwnership(candidate) {
  return (
    buttonsVideoOwnership.get(candidate) ??
    candidate.getAttribute("video-id") ??
    candidate.getAttribute("data-video-id")
  );
}

function selectCurrentWatchButtons(candidates) {
  const videoId = getVideoId(window.location.href);
  return (
    candidates
      .map((candidate, index) => {
        const watchRoot = candidate.closest("ytd-watch-flexy, ytd-watch-grid");
        const rootVideoId = watchRoot?.getAttribute("video-id");
        const rootMatches = Boolean(videoId && rootVideoId === videoId);
        const rootConflicts = Boolean(videoId && rootVideoId && rootVideoId !== videoId);
        const controlsVideoId = getButtonsVideoOwnership(candidate);
        const controlsMatch = Boolean(videoId && controlsVideoId === videoId);
        const controlsConflict = Boolean(videoId && controlsVideoId && controlsVideoId !== videoId);
        const rendered = hasRenderedBox(candidate);
        const inViewport = rendered && intersectsViewport(candidate);
        const usable = hasUsableButtonStructure(candidate);
        // Visible controls must win while YouTube is reusing a button tree across
        // videos. Ownership is supporting evidence, not a reason to prefer a
        // hidden duplicate or an unrelated unowned menu group.
        const tier =
          rootMatches && inViewport && !controlsConflict
            ? 10
            : rootMatches && inViewport
              ? 9
              : inViewport && !controlsConflict
                ? 8
                : inViewport
                  ? 7
                  : rootMatches && rendered && !controlsConflict
                    ? 6
                    : rootMatches && rendered
                      ? 5
                      : rendered && !controlsConflict
                        ? 4
                        : rendered
                          ? 3
                          : (rootMatches || controlsMatch) && !controlsConflict
                            ? 2
                            : !controlsConflict
                              ? 1
                              : 0;
        return { candidate, index, rendered, rootConflicts, tier, usable };
      })
      // Do not bind outgoing controls to the destination video while YouTube is
      // switching the current watch root during an SPA navigation.
      .filter(({ rendered, rootConflicts, usable }) => rendered && !rootConflicts && usable)
      .sort((left, right) => right.tier - left.tier || left.index - right.index)[0]?.candidate
  );
}

function buttons_getNativeButton(buttonContainer) {
  if (!buttonContainer) return undefined;
  if (buttonContainer.matches("button, tp-yt-paper-button#button")) return buttonContainer;
  const nativeToggle = buttonContainer.querySelector(":scope > toggle-button-view-model");
  if (nativeToggle) {
    return querySelector(extConfig.selectors.buttons.nativeButton, nativeToggle);
  }
  if (isShorts()) {
    const legacyToggle = querySelector(extConfig.selectors.buttons.shortsToggleButton, buttonContainer);
    if (legacyToggle) return legacyToggle;
  }
  const pressedButton = buttonContainer.querySelector("button[aria-pressed]");
  if (pressedButton) return pressedButton;
  if (isMobile()) {
    const mobileToggle = buttonContainer.querySelector("button[aria-label='true'], button[aria-label='false']");
    if (mobileToggle) return mobileToggle;
  }
  // Modern reaction hosts can contain unrelated controls before their native
  // toggle hydrates. Keep the selector fallback for older/mobile layouts only.
  if (buttonContainer.matches("like-button-view-model, dislike-button-view-model")) return undefined;
  return querySelector(extConfig.selectors.buttons.nativeButton, buttonContainer);
}

function isSegmentedButtonLayout(buttons = buttons_getButtons()) {
  return Boolean(buttons && querySelector(extConfig.selectors.buttons.segmentedContainer, buttons) !== undefined);
}

function getShortsRenderer(buttons) {
  return buttons?.closest("ytd-reel-video-renderer, ytm-reel-video-renderer") ?? null;
}

function getShortsCandidateVideoIds(buttons) {
  const renderer = getShortsRenderer(buttons);
  const videoIds = new Set();
  const rendererVideoId = renderer?.getAttribute("video-id");
  if (rendererVideoId) videoIds.add(rendererVideoId);

  for (const videoId of getShortsIdentityLinkVideoIds(renderer, window.location.href)) {
    videoIds.add(videoId);
  }

  return videoIds;
}

function getShortsCandidateVideoId(buttons) {
  const videoIds = getShortsCandidateVideoIds(buttons);
  return videoIds.size === 1 ? videoIds.values().next().value : null;
}

function getShortsControlSurfaceSignature(buttons) {
  return Array.from(getShortsCandidateVideoIds(buttons)).sort().join("|") || "identityless";
}

function getVisibleShortsControlSurfaceCount() {
  const elements = isMobile()
    ? querySelectorAll(extConfig.selectors.buttons.shorts.mobile)
    : querySelectorAll(extConfig.selectors.buttons.shorts.desktop);
  return Array.from(elements).filter(
    (candidate) => hasRenderedBox(candidate) && hasMeaningfulViewportPresence(candidate),
  ).length;
}

function shortsControlSurfaceIsReadyForMutation(
  buttons,
  currentVideoId,
  { allowUnhydratedFallback = false, isHydrated = false, isStable = false } = {},
) {
  return sharedShortsSurfaceIsReady({
    allowUnhydratedFallback,
    candidateVideoIds: getShortsCandidateVideoIds(buttons),
    currentVideoId,
    isConnected: buttons?.isConnected,
    isHydrated,
    isRendered: hasRenderedBox(buttons),
    isStable,
    isViewportIntersecting: hasMeaningfulViewportPresence(buttons),
    visibleCandidateCount: getVisibleShortsControlSurfaceCount(),
  });
}

function captureShortsNativeControlInventory(buttons) {
  return captureSharedShortsNativeControlInventory(buttons, {
    getNativeLikeButton: buttons_getNativeButton,
    syntheticSelector: EXTENSION_SHORTS_ACTION_SELECTOR,
  });
}

function shortsNativeControlInventoryIsReadyForFallback(inventory) {
  return sharedShortsNativeInventoryIsReadyForFallback(inventory, {
    getTopmostElement:
      typeof document.elementFromPoint === "function" ? (x, y) => document.elementFromPoint(x, y) : null,
    isMeaningfullyInViewport: hasMeaningfulViewportPresence,
    isRendered: hasRenderedBox,
  });
}

function selectCurrentShortsButtons(elements) {
  const currentVideoId = getVideoId(window.location.href);
  const candidates = Array.from(elements)
    .map((buttons) => {
      const renderer = getShortsRenderer(buttons);
      const rendered = hasRenderedBox(buttons);
      const videoIds = getShortsCandidateVideoIds(buttons);
      return {
        active: renderer?.hasAttribute("is-active") === true,
        ambiguous: videoIds.size > 1,
        buttons,
        intersectsViewport: rendered && intersectsViewport(buttons),
        rendered,
        videoId: videoIds.size === 1 ? videoIds.values().next().value : null,
      };
    })
    .filter(({ rendered }) => rendered);
  const unambiguousCandidates = candidates.filter(({ ambiguous }) => !ambiguous);

  const currentVideoCandidates = currentVideoId
    ? unambiguousCandidates.filter((candidate) => candidate.videoId === currentVideoId)
    : [];
  const exactActive = currentVideoCandidates.find(({ active }) => active);
  if (exactActive) return exactActive.buttons;

  const exactVisible = currentVideoCandidates.find(({ intersectsViewport: visible }) => visible);
  if (exactVisible) return exactVisible.buttons;

  const activeCandidate = unambiguousCandidates.find(({ active }) => active);
  if (activeCandidate) {
    // During a Shorts transition the URL can advance before YouTube switches
    // the active reel. Do not write the destination count into the outgoing
    // reel when both identities are known to differ.
    if (currentVideoId && activeCandidate.videoId && activeCandidate.videoId !== currentVideoId) {
      return undefined;
    }
    return activeCandidate.buttons;
  }

  if (currentVideoCandidates.length > 0) return currentVideoCandidates[0].buttons;

  // Some layouts omit a usable video identity. In that case prefer any
  // rendered control intersecting the viewport, then the first rendered
  // fallback. Hidden preloaded reels have already been excluded above.
  const visibleIdentitylessCandidates = unambiguousCandidates.filter(
    ({ intersectsViewport: visible, videoId }) => visible && !videoId,
  );
  return visibleIdentitylessCandidates.length === 1 ? visibleIdentitylessCandidates[0].buttons : undefined;
}

function buttons_getButtons() {
  //---   If Watching Youtube Shorts:   ---//
  if (isShorts()) {
    const elements = isMobile()
      ? querySelectorAll(extConfig.selectors.buttons.shorts.mobile)
      : querySelectorAll(extConfig.selectors.buttons.shorts.desktop);
    return selectCurrentShortsButtons(elements);
  }
  //---   If Watching On Mobile:   ---//
  if (isMobile()) {
    return document.querySelector(extConfig.selectors.buttons.regular.mobile);
  }
  return selectCurrentWatchButtons(getDesktopWatchButtonCandidates());
}

function buttons_getLikeButton(buttons = buttons_getButtons()) {
  if (!buttons) return undefined;
  return isSegmentedButtonLayout(buttons)
    ? querySelector(extConfig.selectors.buttons.likeButton.segmented, buttons) ??
        querySelector(extConfig.selectors.buttons.likeButton.segmentedGetButtons, buttons)
    : querySelector(extConfig.selectors.buttons.likeButton.notSegmented, buttons);
}

function buttons_getLikeTextContainer(likeButton = buttons_getLikeButton()) {
  if (!likeButton) return undefined;
  return querySelector(extConfig.selectors.likeTextContainer, likeButton);
}

function buttons_isSyntheticShortsDislike(dislikeButton) {
  return dislikeButton?.matches?.(SYNTHETIC_SHORTS_DISLIKE_SELECTOR) === true;
}

function buttons_setSyntheticShortsDislikePressed(pressed, dislikeButton = buttons_getDislikeButton()) {
  if (!buttons_isSyntheticShortsDislike(dislikeButton)) return false;
  if (isPrivateBrowsingContext()) pressed = false;

  dislikeButton.classList.toggle("style-default-active", pressed);
  dislikeButton.classList.toggle("style-text", !pressed);
  dislikeButton.querySelector("button")?.setAttribute("aria-pressed", String(pressed));
  return true;
}

function buttons_setSyntheticShortsDislikeEnabled(enabled, dislikeButton = buttons_getDislikeButton()) {
  if (!buttons_isSyntheticShortsDislike(dislikeButton)) return false;
  if (isPrivateBrowsingContext()) enabled = false;

  const button = dislikeButton.querySelector("button");
  if (!button) return false;
  button.disabled = !enabled;
  button.setAttribute("aria-disabled", String(!enabled));
  return true;
}

function ensureSyntheticShortsDislikeButton(
  buttons,
  {
    allowUnhydratedFallback = false,
    currentVideoId = getVideoId(window.location.href),
    isHydrated = false,
    isStable = false,
  } = {},
) {
  if (!buttons || !isShorts() || isMobile()) return undefined;

  const existingSynthetics = Array.from(buttons.querySelectorAll(SYNTHETIC_SHORTS_DISLIKE_SELECTOR));
  const existing = existingSynthetics[0];
  const nativeDislike = buttons.querySelector("dislike-button-view-model, #dislike-button");
  const candidateVideoId = getShortsCandidateVideoId(buttons);
  const readyForMutation = shortsControlSurfaceIsReadyForMutation(buttons, currentVideoId, {
    allowUnhydratedFallback,
    isHydrated: isHydrated && actionBarHasHydratedData(buttons),
    isStable,
  });
  if (nativeDislike) {
    if (readyForMutation) existingSynthetics.forEach((synthetic) => synthetic.remove());
    return nativeDislike;
  }

  // YouTube routes to the next Short before activating its pre-rendered reel.
  // Mutating that offscreen managed action tree can leave every native action
  // with valid layout but no painted compositor layer when the reel activates.
  if (!readyForMutation) return existing ?? undefined;

  const videoId = candidateVideoId ?? currentVideoId;
  if (existing) {
    existingSynthetics.slice(1).forEach((synthetic) => synthetic.remove());
    if (videoId && existing.getAttribute("data-ryd-video-id") !== videoId) {
      existing.setAttribute("data-ryd-video-id", videoId);
      buttons_setSyntheticShortsDislikePressed(false, existing);
      buttons_setSyntheticShortsDislikeEnabled(false, existing);
      const count = existing.querySelector("#text, [role='text']");
      if (count) count.textContent = "";
    }
    return existing;
  }

  const likeButton = buttons.querySelector("like-button-view-model");
  const nativeLikeButton = buttons_getNativeButton(likeButton);
  if (!likeButton || !nativeLikeButton) return undefined;

  const dislikeButton = document.createElement("div");
  dislikeButton.className = likeButton.getAttribute("class") || "";
  dislikeButton.classList.add("ryd-synthetic-shorts-dislike", "style-text");
  dislikeButton.setAttribute("data-ryd-role", "dislike");
  dislikeButton.setAttribute("data-ryd-synthetic-shorts-dislike", "true");
  if (videoId) dislikeButton.setAttribute("data-ryd-video-id", videoId);

  const label = document.createElement("label");
  label.className = nativeLikeButton.closest("label")?.getAttribute("class") || "ytSpecButtonShapeWithLabelHost";
  label.classList.add("ryd-synthetic-shorts-dislike-label");

  const button = document.createElement("button");
  button.type = "button";
  button.className = nativeLikeButton.getAttribute("class") || "ytSpecButtonShapeNextHost";
  button.setAttribute("aria-label", "Dislike this video");
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-disabled", "true");
  button.disabled = true;

  const icon = document.createElement("span");
  icon.className =
    nativeLikeButton
      .querySelector(".ytSpecButtonShapeNextIcon, .yt-spec-button-shape-next__icon")
      ?.getAttribute("class") || "ytSpecButtonShapeNextIcon";
  icon.setAttribute("aria-hidden", "true");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 18 18");
  svg.setAttribute("width", "24");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", SHORTS_DISLIKE_ICON_PATH);
  svg.appendChild(path);
  icon.appendChild(svg);
  button.appendChild(icon);

  const countContainer = document.createElement("div");
  countContainer.className =
    likeButton
      .querySelector(".ytSpecButtonShapeWithLabelLabel, .yt-spec-button-shape-with-label__label")
      ?.getAttribute("class") || "ytSpecButtonShapeWithLabelLabel";
  const count = document.createElement("span");
  count.id = "text";
  count.className =
    likeButton.querySelector("span[role='text']")?.getAttribute("class") ||
    "ytAttributedStringHost ytAttributedStringTextAlignmentCenter";
  count.setAttribute("role", "text");
  countContainer.appendChild(count);

  label.append(button, countContainer);
  dislikeButton.appendChild(label);
  likeButton.insertAdjacentElement("afterend", dislikeButton);
  return dislikeButton;
}

function buttons_getDislikeButton(buttons = buttons_getButtons()) {
  if (!buttons) return undefined;
  const syntheticShortsDislike = isShorts()
    ? buttons.querySelector(SYNTHETIC_SHORTS_DISLIKE_SELECTOR) ?? undefined
    : undefined;
  if (isSegmentedButtonLayout(buttons)) {
    return (
      querySelector(extConfig.selectors.buttons.dislikeButton.segmented, buttons) ??
      querySelector(extConfig.selectors.buttons.dislikeButton.segmentedGetButtons, buttons)
    );
  }

  if (isShorts()) {
    const semanticSelectors = extConfig.selectors.buttons.dislikeButton.notSegmented.filter(
      (selector) => selector !== ":nth-child(2)",
    );
    return (
      querySelector(semanticSelectors, buttons) ??
      querySelector(extConfig.selectors.buttons.dislikeButton.shortsFallback, buttons) ??
      syntheticShortsDislike
    );
  }

  const notSegmentedMatch = querySelector(extConfig.selectors.buttons.dislikeButton.notSegmented, buttons);

  if (notSegmentedMatch != null) {
    return notSegmentedMatch;
  }

  return null;
}

function getTextContainerTemplate(likeButton, buttons) {
  if (!likeButton || !buttons || !buttons.contains(likeButton)) return undefined;
  const parentTemplate =
    querySelector(extConfig.selectors.likeTextContainerTemplateParent, likeButton) ??
    querySelector(extConfig.selectors.likeTextContainerTemplateParent, buttons);

  return (
    querySelector(extConfig.selectors.likeTextContainerTemplate, likeButton) ??
    querySelector(extConfig.selectors.likeTextContainerTemplate, buttons) ??
    parentTemplate?.parentNode
  );
}

function findDislikeTextContainer(dislikeButton, nativeDislikeButton) {
  if (!dislikeButton) return undefined;
  for (const selector of extConfig.selectors.dislikeTextContainer) {
    const result = dislikeButton.querySelector(selector);
    if (result !== null && result !== nativeDislikeButton) {
      return matchesConfiguredSelector(result, extConfig.selectors.textContainerInner)
        ? result
        : querySelector(extConfig.selectors.textContainerInner, result) ?? result;
    }
  }
}

function isReactionControlHost(element) {
  const tagName = element?.tagName?.toLowerCase() ?? "";
  return tagName === "button" || tagName.includes("-") || element?.hasAttribute("data-ryd-role");
}

function matchesConfiguredSelector(element, selectors) {
  if (!element) return false;
  return (Array.isArray(selectors) ? selectors : [selectors]).some((selector) => selector && element.matches(selector));
}

function getSemanticControlSelectors(role) {
  const selectorConfig = extConfig.selectors.buttons[`${role}Button`];
  return [...selectorConfig.segmented, ...selectorConfig.notSegmented].filter(
    (selector) => selector && !selector.trim().startsWith(":"),
  );
}

function hasSemanticReactionStructure(buttons, likeButton, dislikeButton, nativeLikeButton, nativeDislikeButton) {
  const segmentedSelectors = extConfig.selectors.buttons.segmentedContainer;
  const hasSegmentedContainer =
    matchesConfiguredSelector(buttons, segmentedSelectors) || querySelector(segmentedSelectors, buttons) !== undefined;
  const hasSemanticPair =
    matchesConfiguredSelector(likeButton, getSemanticControlSelectors("like")) &&
    matchesConfiguredSelector(dislikeButton, getSemanticControlSelectors("dislike"));

  if (hasSegmentedContainer || hasSemanticPair) return true;

  // Older/mobile layouts can expose the pair only by position. Permit that
  // fallback solely inside a configured reaction root, and require both
  // controls to behave like toggle buttons. This excludes adjacent menu
  // groups such as Share/Download without relying on localized labels.
  const positionalRootSelectors = [
    ...extConfig.selectors.buttons.regular.desktopNoMenu,
    ...extConfig.selectors.buttons.regular.mobile,
    ...extConfig.selectors.buttons.shorts.desktop,
    ...extConfig.selectors.buttons.shorts.mobile,
  ];
  return (
    matchesConfiguredSelector(buttons, positionalRootSelectors) &&
    nativeLikeButton?.hasAttribute("aria-pressed") &&
    nativeDislikeButton?.hasAttribute("aria-pressed")
  );
}

function buttons_getButtonControls(buttons = buttons_getButtons()) {
  const likeButton = buttons_getLikeButton(buttons);
  const dislikeButton = buttons_getDislikeButton(buttons);
  const nativeLikeButton = buttons_getNativeButton(likeButton);
  const nativeDislikeButton = buttons_getNativeButton(dislikeButton);
  const dislikeTextContainer = findDislikeTextContainer(dislikeButton, nativeDislikeButton);
  const textContainerTemplate = getTextContainerTemplate(likeButton, buttons);
  const ready = Boolean(
    buttons?.isConnected &&
      likeButton?.isConnected &&
      dislikeButton?.isConnected &&
      nativeLikeButton?.isConnected &&
      nativeDislikeButton?.isConnected &&
      isReactionControlHost(likeButton) &&
      isReactionControlHost(dislikeButton) &&
      buttons.contains(likeButton) &&
      buttons.contains(dislikeButton) &&
      likeButton.contains(nativeLikeButton) &&
      dislikeButton.contains(nativeDislikeButton) &&
      hasSemanticReactionStructure(buttons, likeButton, dislikeButton, nativeLikeButton, nativeDislikeButton) &&
      (dislikeTextContainer || textContainerTemplate),
  );

  return {
    buttons,
    dislikeButton,
    dislikeTextContainer,
    likeButton,
    nativeDislikeButton,
    nativeLikeButton,
    ready,
    textContainerTemplate,
  };
}

function hasUsableButtonStructure(buttons) {
  return buttons_getButtonControls(buttons).ready;
}

function updateDislikeButtonShape(dislikeButton) {
  for (const className of extConfig.selectors.buttonClasses.iconButton) {
    dislikeButton.classList.remove(className);
  }

  for (const className of extConfig.selectors.buttonClasses.iconLeading) {
    dislikeButton.classList.add(className);
  }
}

function getNativeCountTypography(likeButton) {
  const root = buttons_getLikeTextContainer(likeButton);
  if (!root?.isConnected) return undefined;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!/\p{N}/u.test(node.data)) continue;
    const element = node.parentElement;
    if (element.closest("[hidden], [inert]")) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;
    const typography = window.getComputedStyle(element);
    let visible = true;
    for (let current = element; current && root.contains(current); current = current.parentElement) {
      const style = current === element ? typography : window.getComputedStyle(current);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse" ||
        Number.parseFloat(style.opacity) === 0 ||
        style.clip === "rect(0px, 0px, 0px, 0px)" ||
        style.clipPath === "inset(50%)" ||
        style.clipPath === "inset(100%)"
      ) {
        visible = false;
        break;
      }
    }
    if (visible) return typography;
  }
}

function getCreatedDislikeTextTypography(textContainer) {
  const existing = createdDislikeTextTypography.get(textContainer);
  if (existing) return existing;
  const saved = textContainer?.getAttribute(COUNT_TYPOGRAPHY_ATTRIBUTE);
  if (saved == null) return undefined;
  try {
    const entries = JSON.parse(saved);
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) return undefined;
    const overrides = new Map();
    for (const property of COUNT_TYPOGRAPHY_PROPERTIES) {
      const entry = entries[property];
      if (entry === undefined) continue;
      if (
        !entry ||
        typeof entry.value !== "string" ||
        typeof entry.computedValue !== "string" ||
        (entry.priority !== "" && entry.priority !== "important")
      ) {
        return undefined;
      }
      overrides.set(property, { value: entry.value, priority: entry.priority, computedValue: entry.computedValue });
    }
    createdDislikeTextTypography.set(textContainer, overrides);
    return overrides;
  } catch {
    return undefined;
  }
}

function buttons_refreshDislikeTextTypography(likeButton = buttons_getLikeButton(), dislikeButton = buttons_getDislikeButton()) {
  const textContainer = findDislikeTextContainer(dislikeButton, buttons_getNativeButton(dislikeButton));
  const overrides = getCreatedDislikeTextTypography(textContainer);
  if (!overrides) return;
  const nativeTypography = getNativeCountTypography(likeButton);
  if (!nativeTypography && overrides.size === 0) return;
  const currentTypography = window.getComputedStyle(textContainer);
  const currentValues = COUNT_TYPOGRAPHY_PROPERTIES.map((property) => currentTypography.getPropertyValue(property));
  COUNT_TYPOGRAPHY_PROPERTIES.forEach((property, index) => {
    const value = nativeTypography?.getPropertyValue(property);
    const previous = overrides.get(property);
    if (previous && (!value || value === previous.computedValue)) {
      if (previous.value) textContainer.style.setProperty(property, previous.value, previous.priority);
      else textContainer.style.removeProperty(property);
      overrides.delete(property);
    } else if (value && value !== currentValues[index]) {
      if (!previous) {
        overrides.set(property, {
          value: textContainer.style.getPropertyValue(property),
          priority: textContainer.style.getPropertyPriority(property),
          computedValue: currentValues[index],
        });
      }
      textContainer.style.setProperty(property, value);
    }
  });
  // Cloned action bars retain our inline styles and need their original values for restoration.
  const saved = JSON.stringify(Object.fromEntries(overrides));
  if (textContainer.getAttribute(COUNT_TYPOGRAPHY_ATTRIBUTE) !== saved) {
    textContainer.setAttribute(COUNT_TYPOGRAPHY_ATTRIBUTE, saved);
  }
}

function createDislikeTextContainer(controls = buttons_getButtonControls()) {
  const { dislikeButton, dislikeTextContainer, nativeDislikeButton, textContainerTemplate } = controls;
  if (dislikeTextContainer) return dislikeTextContainer;
  if (
    !controls.ready ||
    !nativeDislikeButton?.isConnected ||
    !dislikeButton?.contains(nativeDislikeButton) ||
    !textContainerTemplate?.isConnected
  ) {
    return undefined;
  }

  const textNodeClone = textContainerTemplate.cloneNode(true);
  let textContainer = matchesConfiguredSelector(textNodeClone, extConfig.selectors.textContainerInner)
    ? textNodeClone
    : querySelector(extConfig.selectors.textContainerInner, textNodeClone);
  if (textContainer === undefined) {
    textContainer = document.createElement("span");
    textContainer.setAttribute("role", "text");
    while (textNodeClone.firstChild) {
      textNodeClone.removeChild(textNodeClone.firstChild);
    }
    textNodeClone.appendChild(textContainer);
  }
  if (!textContainer.id) textContainer.id = "text";
  textContainer.innerText = "";
  nativeDislikeButton.insertBefore(textNodeClone, null);
  updateDislikeButtonShape(nativeDislikeButton);
  createdDislikeTextTypography.set(textContainer, new Map());
  textContainer.setAttribute(COUNT_TYPOGRAPHY_ATTRIBUTE, "{}");
  return textContainer;
}

function buttons_getDislikeTextContainer(controls = buttons_getButtonControls()) {
  const textContainer = controls.dislikeTextContainer ?? createDislikeTextContainer(controls);
  buttons_refreshDislikeTextTypography(controls.likeButton, controls.dislikeButton);
  return textContainer;
}

function checkForSignInButton() {
  if (querySelector(extConfig.selectors.signInButton)) {
    return true;
  } else {
    return false;
  }
}



;// CONCATENATED MODULE: ./Extensions/combined/src/bar.js





function closestConfigured(element, selectors) {
  for (const selector of Array.isArray(selectors) ? selectors : [selectors]) {
    const match = selector ? element?.closest(selector) : null;
    if (match) return match;
  }
  return null;
}

function findInCurrentWatchTree(buttons, selectors, fallbackScope = null) {
  const closest = closestConfigured(buttons, selectors);
  if (closest) return closest;
  const watchRoot = buttons?.closest("ytd-watch-flexy, ytd-watch-grid");
  const scope = fallbackScope ?? watchRoot;
  return scope ? querySelector(selectors, scope) : undefined;
}

function findRateBarOwner(buttons, rateBar) {
  let owner = rateBar;
  while (owner?.parentElement && owner.parentElement !== buttons) {
    owner = owner.parentElement;
  }
  return owner?.parentElement === buttons ? owner : rateBar;
}

function hasHiddenOrCollapsedStyle(element) {
  if (!element || element.hidden) return true;
  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse" ||
    Number.parseFloat(style.opacity || "1") === 0
  ) {
    return true;
  }

  const explicitWidth = element.style.width.trim();
  return explicitWidth !== "" && Number.parseFloat(explicitWidth) === 0;
}

function getRateBarParts(buttons) {
  const containers = buttons ? [...buttons.querySelectorAll("#ryd-bar-container")] : [];
  const rateBar = containers[0] ?? null;
  const owner = rateBar ? findRateBarOwner(buttons, rateBar) : null;
  const wrapper = rateBar?.closest(".ryd-tooltip") ?? null;
  return {
    containers,
    fill: rateBar?.querySelector("#ryd-bar") ?? null,
    owner,
    rateBar,
    tooltip: owner?.querySelector("#ryd-dislike-tooltip") ?? null,
    wrapper,
  };
}

function hasUsableRateBar(buttons = getButtons(), videoId = getVideoId(window.location.href)) {
  const { containers, fill, owner, rateBar, tooltip, wrapper } = getRateBarParts(buttons);
  return Boolean(
    videoId &&
      containers.length === 1 &&
      rateBar &&
      fill &&
      tooltip &&
      wrapper &&
      owner === wrapper &&
      wrapper.parentElement === buttons &&
      wrapper.getAttribute("data-ryd-video-id") === videoId &&
      !hasHiddenOrCollapsedStyle(wrapper) &&
      !hasHiddenOrCollapsedStyle(rateBar),
  );
}

function removeRateBarParts(buttons) {
  const owners = new Set(
    [...(buttons?.querySelectorAll("#ryd-bar-container") ?? [])].map((rateBar) => findRateBarOwner(buttons, rateBar)),
  );
  for (const owner of owners) owner?.remove();
}

function bar_createRateBar(likes, dislikes) {
  const buttons = getButtons();
  const videoId = getVideoId(window.location.href);
  for (const wrapper of document.querySelectorAll(".ryd-tooltip")) {
    if (!buttons?.contains(wrapper)) wrapper.remove();
  }
  let rateBar = buttons?.querySelector("#ryd-bar-container");
  if (!isShorts() && (!videoId || isMobile())) {
    return;
  }
  if (!isLikesDisabled()) {
    // YouTube can leave an extension-owned subtree connected while hiding,
    // collapsing, or partially replacing it. Treat that as missing so the
    // periodic lifecycle check can rebuild a complete control.
    if (rateBar && (!hasUsableRateBar(buttons, videoId) || !isInViewport(rateBar))) {
      removeRateBarParts(buttons);
      rateBar = null;
    }

    const widthPx =
      getElementWidth(getLikeButton()) + getElementWidth(getDislikeButton()) + (isRoundedDesign() ? 0 : 8);

    const widthPercent = likes + dislikes > 0 ? (likes / (likes + dislikes)) * 100 : 50;

    var likePercentage = parseFloat(widthPercent.toFixed(1));
    const dislikePercentage = (100 - likePercentage).toLocaleString();
    likePercentage = likePercentage.toLocaleString();

    if (extConfig.showTooltipPercentage) {
      var tooltipInnerHTML;
      switch (extConfig.tooltipPercentageMode) {
        case "dash_dislike":
          tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}&nbsp;&nbsp;-&nbsp;&nbsp;${dislikePercentage}%`;
          break;
        case "both":
          tooltipInnerHTML = `${likePercentage}%&nbsp;/&nbsp;${dislikePercentage}%`;
          break;
        case "only_like":
          tooltipInnerHTML = `${likePercentage}%`;
          break;
        case "only_dislike":
          tooltipInnerHTML = `${dislikePercentage}%`;
          break;
        default: // dash_like
          tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}&nbsp;&nbsp;-&nbsp;&nbsp;${likePercentage}%`;
      }
    } else {
      tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}`;
    }

    if (!isShorts()) {
      if (!rateBar) {
        let colorLikeStyle = "";
        let colorDislikeStyle = "";
        if (extConfig.coloredBar) {
          colorLikeStyle = "; background-color: " + getColorFromTheme(true);
          colorDislikeStyle = "; background-color: " + getColorFromTheme(false);
        }
        const actions = buttons;
        (actions || querySelector(extConfig.selectors.rateBar.mobileActionBar)).insertAdjacentHTML(
          "beforeend",
          `
              <div data-ryd-ratebar-wrapper class="ryd-tooltip ryd-tooltip-${isNewDesign() ? "new" : "old"}-design" style="width: ${widthPx}px">
              <div class="ryd-tooltip-bar-container">
                <div
                    id="ryd-bar-container"
                    data-ryd-liked="${isVideoLiked()}"
                    style="width: 100%; height: 2px;${colorDislikeStyle}"
                    >
                    <div
                      id="ryd-bar"
                      style="width: ${widthPercent}%; height: 100%${colorLikeStyle}"
                      ></div>
                </div>
              </div>
              <tp-yt-paper-tooltip position="top" id="ryd-dislike-tooltip" class="style-scope ytd-sentiment-bar-renderer" role="tooltip" tabindex="-1">
                <!--css-build:shady-->${tooltipInnerHTML}
              </tp-yt-paper-tooltip>
              </div>
          `,
        );

        getRateBarParts(buttons).wrapper?.setAttribute("data-ryd-video-id", videoId);

        if (isNewDesign()) {
          // Add border between info and comments
          const descriptionAndActionsElement = findInCurrentWatchTree(buttons, extConfig.selectors.rateBar.topRow);
          if (descriptionAndActionsElement) {
            descriptionAndActionsElement.style.borderBottom = "1px solid var(--yt-spec-10-percent-layer)";
            descriptionAndActionsElement.style.paddingBottom = "10px";
          }
        }
      } else {
        const currentParts = getRateBarParts(buttons);
        currentParts.wrapper.setAttribute("data-ryd-video-id", videoId);
        currentParts.rateBar.setAttribute("data-ryd-liked", String(isVideoLiked()));
        currentParts.wrapper.style.width = widthPx + "px";
        currentParts.fill.style.width = widthPercent + "%";
        const tooltipHost = buttons.querySelector("#ryd-dislike-tooltip");
        const tooltip = tooltipHost?.querySelector("#tooltip") ?? tooltipHost;
        if (tooltip) tooltip.innerHTML = tooltipInnerHTML;
        if (extConfig.coloredBar) {
          currentParts.rateBar.style.backgroundColor = getColorFromTheme(false);
          currentParts.fill.style.backgroundColor = getColorFromTheme(true);
        } else {
          currentParts.rateBar.style.removeProperty("background-color");
          currentParts.fill.style.removeProperty("background-color");
        }
      }
    }
  } else {
    logger.log("removing bar");
    if (rateBar) {
      (rateBar.closest(".ryd-tooltip") ?? rateBar).remove();
    }
  }
}



;// CONCATENATED MODULE: ./Extensions/common/vote-transition.js
const {
  DISLIKED_STATE: vote_transition_DISLIKED_STATE,
  DISLIKE_ACTION,
  LIKED_STATE: vote_transition_LIKED_STATE,
  LIKE_ACTION,
  NEUTRAL_STATE: vote_transition_NEUTRAL_STATE,
  applyVoteTransitionCounts,
  resolveVoteTransition,
  shouldSubmitVote: vote_transition_shouldSubmitVote,
} = __webpack_require__(26);



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

async function core_data_consent_hasFeaturePermission(feature, { queryBackground = true } = {}) {
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
      (granted) => granted === true && core_data_consent_hasFeaturePermission(feature, { queryBackground: false }),
      () => false,
    );
  } catch (_) {
    return Promise.resolve(false);
  }
}

function core_data_consent_onDataPermissionsChanged(listener) {
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
    const unsubscribe = core_data_consent_onDataPermissionsChanged(({ removed }) => {
      if (removed.some((category) => required.includes(category))) controller.abort(coreConsentError());
    });
    options.signal?.addEventListener("abort", abortForCaller, { once: true });
    const assertPermitted = async () => {
      for (const value of features) if (!(await core_data_consent_hasFeaturePermission(value))) throw coreConsentError();
      controller.signal.throwIfAborted();
    };
    try {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
      if (url.pathname === "/votes" && url.searchParams.has("likeCount")) {
        if (await core_data_consent_hasFeaturePermission("likeCount")) {
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

function core_data_consent_fetchWithCoreConsent(input, options = {}, fetchImpl = globalThis.fetch) {
  if (!usesFirefoxDataCollectionConsent()) return fetchImpl(input, options);
  if (isPrivateBrowsingContext()) return fetchWithFeatureConsent("counts", input, options, fetchImpl);
  const feature = requestFeature(input, options);
  if (!feature) return Promise.reject(coreConsentError());
  return fetchWithFeatureConsent(feature, input, options, fetchImpl);
}



;// CONCATENATED MODULE: ./Extensions/combined/src/vote-data-request.js




const WITHOUT_LIKE_COUNT = "without-like-count";
const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;
const LIVE_BUILD_ID_PATTERN = /^[a-f0-9]{32}$/;
const LIVE_ACCEPT_MEDIA_TYPE = "application/vnd.ryd-live+json";

const liveTestBuild = (/* unused pure expression or super */ null && ( true && false === true));
const compiledLiveBuildId = (/* unused pure expression or super */ null && ( false ? 0 : ""));

let activeVideoId = null;
let activeRequestController = null;
let requestsByLikeCount = new Map();
let latestRequest = null;

function currentExtensionId() {
  return globalThis.chrome?.runtime?.id ?? globalThis.browser?.runtime?.id ?? "";
}

function createVoteDataAcceptHeader({
  buildId = compiledLiveBuildId,
  extensionId = currentExtensionId(),
  isLiveTestBuild = liveTestBuild,
} = {}) {
  if (!isLiveTestBuild) return "application/json";
  if (!EXTENSION_ID_PATTERN.test(extensionId)) {
    throw new Error("A live-test vote-data request requires a valid extension ID.");
  }
  if (!LIVE_BUILD_ID_PATTERN.test(buildId)) {
    throw new Error("A live-test vote-data request requires a valid build ID.");
  }
  const header = `application/json, ${LIVE_ACCEPT_MEDIA_TYPE}; id=${extensionId}; build=${buildId}`;
  if (header.length > 128) throw new Error("The live-test vote-data fingerprint exceeds the CORS safelist limit.");
  return header;
}

function normalizeLikeCount(likeCount) {
  if (likeCount === null || likeCount === undefined || likeCount === false || likeCount === "") {
    return null;
  }

  const parsed = typeof likeCount === "number" ? likeCount : Number(likeCount);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? String(parsed) : null;
}

function resetForVideo(videoId) {
  if (activeVideoId === videoId) return;
  clearVoteDataRequestCache();
  activeVideoId = videoId;
  activeRequestController = new AbortController();
}

function removeFailedRequest(record) {
  if (requestsByLikeCount.get(record.key) === record) {
    requestsByLikeCount.delete(record.key);
  }
  if (latestRequest === record) {
    const remainingRequests = Array.from(requestsByLikeCount.values());
    latestRequest = remainingRequests[remainingRequests.length - 1] ?? null;
  }
}

function vote_data_request_requestVoteData(videoId, { fetchImpl = globalThis.fetch, likeCount = null } = {}) {
  if (typeof videoId !== "string" || videoId.length === 0) {
    return Promise.reject(new TypeError("A video ID is required to request vote data."));
  }
  if (typeof fetchImpl !== "function") {
    return Promise.reject(new TypeError("A fetch implementation is required to request vote data."));
  }

  resetForVideo(videoId);

  const normalizedLikeCount = normalizeLikeCount(likeCount);
  // A consumer that only needs aggregate counts can reuse a request carrying a
  // native Like count. That response is at least as informative as the base
  // request and avoids the premium teaser duplicating the main renderer's GET.
  if (normalizedLikeCount === null && latestRequest) {
    return latestRequest.promise;
  }

  const key = normalizedLikeCount ?? WITHOUT_LIKE_COUNT;
  const existing = requestsByLikeCount.get(key);
  if (existing) {
    return existing.promise;
  }

  const likeCountQuery = normalizedLikeCount === null ? "" : `&likeCount=${encodeURIComponent(normalizedLikeCount)}`;
  const url = getApiEndpoint(`/votes?videoId=${encodeURIComponent(videoId)}${likeCountQuery}`);
  const record = { key, promise: null };
  const { signal } = activeRequestController;

  let fetchResult;
  try {
    fetchResult = fetchWithCoreConsent(
      url,
      {
        method: "GET",
        headers: {
          Accept: createVoteDataAcceptHeader(),
        },
        signal,
        ...(isPrivateBrowsingContext() ? { credentials: "omit", cache: "no-store" } : {}),
      },
      fetchImpl,
    );
  } catch (error) {
    fetchResult = Promise.reject(error);
  }

  record.promise = Promise.resolve(fetchResult)
    .then((response) => {
      if (!response?.ok) {
        throw new Error(`Vote data request failed with HTTP ${response?.status ?? "unknown"}.`);
      }
      return response.json();
    })
    .then((payload) => {
      if (signal.aborted) {
        throw new DOMException("Vote data request cancelled by navigation.", "AbortError");
      }
      return payload;
    })
    .catch((error) => {
      removeFailedRequest(record);
      if (signal.aborted && error?.name !== "AbortError") {
        throw new DOMException("Vote data request cancelled by navigation.", "AbortError");
      }
      throw error;
    });

  requestsByLikeCount.set(key, record);
  latestRequest = record;
  return record.promise;
}

function clearVoteDataRequestCache() {
  activeRequestController?.abort();
  activeRequestController = null;
  activeVideoId = null;
  requestsByLikeCount = new Map();
  latestRequest = null;
}

function cancelObsoleteVoteDataRequests(videoId) {
  if (activeVideoId !== videoId) clearVoteDataRequestCache();
}



;// CONCATENATED MODULE: ./Extensions/common/color-themes.js
const DEFAULT_CUSTOM_COLORS = Object.freeze({
  light: Object.freeze({ like: "#007600", dislike: "#b300b3" }),
  dark: Object.freeze({ like: "#00d000", dislike: "#ff77ff" }),
});

function color_themes_normalizeCustomColors(value) {
  const colors = {};
  for (const theme of ["light", "dark"]) {
    colors[theme] = {};
    for (const vote of ["like", "dislike"]) {
      const color = value?.[theme]?.[vote];
      colors[theme][vote] =
        typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)
          ? color.toLowerCase()
          : DEFAULT_CUSTOM_COLORS[theme][vote];
    }
  }
  return colors;
}

function color_themes_getThemeColor(themeName, voteIsLike, isDark = false, customColors) {
  const vote = voteIsLike ? "like" : "dislike";
  const theme = isDark ? "dark" : "light";
  switch (themeName) {
    case "custom":
      return color_themes_normalizeCustomColors(customColors)[theme][vote];
    case "hibiscus":
      return DEFAULT_CUSTOM_COLORS[theme][vote];
    case "accessible":
      return voteIsLike ? "dodgerblue" : "gold";
    case "neon":
      return voteIsLike ? "aqua" : "magenta";
    case "classic":
    default:
      return voteIsLike ? "lime" : "red";
  }
}

function color_themes_isYouTubeDarkTheme(ownerDocument = document) {
  return ownerDocument.documentElement.hasAttribute("dark");
}

function observeYouTubeTheme(onChange, ownerDocument = document) {
  let isDark = color_themes_isYouTubeDarkTheme(ownerDocument);
  const observer = new MutationObserver(() => {
    const nextIsDark = color_themes_isYouTubeDarkTheme(ownerDocument);
    if (nextIsDark === isDark) return;
    isDark = nextIsDark;
    onChange(isDark);
  });
  observer.observe(ownerDocument.documentElement, { attributes: true, attributeFilter: ["dark"] });
  return observer;
}



;// CONCATENATED MODULE: ./Extensions/combined/src/state.js













const DEFAULT_SELECTORS = {
  dislikeTextContainer: [
    ".yt-spec-button-shape-next__button-text-content",
    ".ytSpecButtonShapeNextButtonTextContent",
    "#text",
    "yt-formatted-string",
    "span[role='text']",
  ],
  likeTextContainer: [
    ".yt-spec-button-shape-next__button-text-content",
    ".ytSpecButtonShapeNextButtonTextContent",
    "#text",
    "yt-formatted-string",
    "span[role='text']",
  ],
  likeTextContainerTemplate: [
    ".yt-spec-button-shape-next__button-text-content",
    ".ytSpecButtonShapeNextButtonTextContent",
    "button > div[class*='cbox']",
  ],
  likeTextContainerTemplateParent: [
    'div > span[role="text"]',
    'button > div.yt-spec-button-shape-next__button-text-content > span[role="text"]',
  ],
  textContainerInner: ["span[role='text']"],
  buttons: {
    shorts: {
      mobile: ["ytm-like-button-renderer"],
      desktop: ["reel-action-bar-view-model", "#like-button > ytd-like-button-renderer"],
    },
    regular: {
      mobile: [".slim-video-action-bar-actions"],
      desktopMenu: ["ytd-menu-renderer.ytd-watch-metadata > div"],
      desktopNoMenu: ["#top-level-buttons-computed"],
    },
    segmentedContainer: ["ytd-segmented-like-dislike-button-renderer"],
    nativeButton: ["button"],
    mobileText: [".button-renderer-text"],
    shortsToggleButton: ["tp-yt-paper-button#button"],
    smartimation: ["yt-smartimation"],
    likeButton: {
      segmented: ["#segmented-like-button"],
      segmentedGetButtons: [":first-child > :first-child"],
      notSegmented: ["like-button-view-model", ":first-child"],
    },
    dislikeButton: {
      segmented: ["#segmented-dislike-button"],
      segmentedGetButtons: [":first-child > :nth-child(2)"],
      notSegmented: ["dislike-button-view-model", ":nth-child(2)", "#dislike-button"],
      shortsFallback: ["#dislike-button"],
    },
  },
  buttonClasses: {
    iconButton: ["yt-spec-button-shape-next--icon-button", "ytSpecButtonShapeNextIconButton"],
    iconLeading: ["yt-spec-button-shape-next--icon-leading", "ytSpecButtonShapeNextIconLeading"],
  },
  activeButtonClasses: ["style-default-active"],
  likeCountButton: ["yt-formatted-string#text", "button"],
  videoLoaded: [
    "ytd-watch-grid[video-id='{videoId}']",
    "ytd-watch-flexy[video-id='{videoId}']",
    '#player[loading="false"]:not([hidden])',
  ],
  shortsLoaded: {
    containers: [".reel-video-in-sequence-new"],
    thumbnail: [".reel-video-in-sequence-thumbnail"],
    renderer: ["ytd-reel-video-renderer"],
    overlay: ["#experiment-overlay"],
  },
  rateBar: {
    newDesignActions: ["#top-level-buttons-computed"],
    oldDesignActions: ["#menu-container"],
    mobileActionBar: ["ytm-slim-video-action-bar-renderer"],
    topRow: ["#top-row"],
    actionsInner: ["#actions-inner"],
    actions: ["#actions"],
  },
  signInButton: ["a[href^='https://accounts.google.com/ServiceLogin']"],
  menuContainer: ["#menu-container"],
  roundedDesign: ["#segmented-like-button", "like-button-view-model"],
};
const SELECTOR_REQUEST_TIMEOUT_MS = 1500;

function cloneConfig(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function mergeConfig(defaultValue, apiValue) {
  if (apiValue === undefined || apiValue === null) {
    return cloneConfig(defaultValue);
  }

  if (Array.isArray(apiValue)) {
    return [...apiValue];
  }

  if (typeof apiValue !== "object" || Array.isArray(defaultValue)) {
    return apiValue;
  }

  const merged = cloneConfig(defaultValue ?? {});
  for (const [key, value] of Object.entries(apiValue)) {
    merged[key] = mergeConfig(defaultValue?.[key], value);
  }
  return merged;
}

let state_extConfig = {
  disableVoteSubmission: false,
  disableLogging: false,
  coloredThumbs: false,
  coloredBar: false,
  colorTheme: "classic",
  customColors: color_themes_normalizeCustomColors(),
  numberDisplayFormat: "compactShort",
  showTooltipPercentage: false,
  tooltipPercentageMode: "dash_like",
  numberDisplayReformatLikes: false,
  hidePremiumTeaser: false,
  hideClutterButtons: false,
  selectors: cloneConfig(DEFAULT_SELECTORS),
};

let storedData = {
  likes: 0,
  dislikes: 0,
  previousState: vote_transition_NEUTRAL_STATE,
  videoId: null,
};

function state_isMobile() {
  return location.hostname == "m.youtube.com";
}

function state_isShorts() {
  return location.pathname.startsWith("/shorts");
}

function state_isNewDesign() {
  return document.getElementById("comment-teaser") !== null;
}

function state_isRoundedDesign() {
  return querySelector(state_extConfig.selectors.roundedDesign) !== null;
}

let syntheticDislikeStore = null;

function getSyntheticDislikeStore() {
  if (isPrivateBrowsingContext()) return null;
  if (syntheticDislikeStore) return syntheticDislikeStore;
  const browserApi = getBrowser();
  if (!browserApi?.storage?.local) return null;
  syntheticDislikeStore = createBrowserSyntheticDislikeStore(
    browserApi.storage.local,
    () => browserApi.runtime?.lastError,
  );
  return syntheticDislikeStore;
}

async function readSyntheticShortsDislikeState(videoId) {
  const store = getSyntheticDislikeStore();
  if (!store) return false;
  try {
    return await store.isDisliked(videoId);
  } catch (error) {
    logger.debug("Could not restore the synthetic Shorts Dislike state.", error?.message ?? error);
    return false;
  }
}

async function persistSyntheticShortsDislikeState(videoId, disliked) {
  const store = getSyntheticDislikeStore();
  if (!store) return;
  await store.setDisliked(videoId, disliked);
}

function state_isLikesDisabled(controls = getButtonControls()) {
  // return true if the like button's text doesn't contain any number
  if (state_isMobile()) {
    const mobileLikeText = querySelector(state_extConfig.selectors.buttons.mobileText, controls.likeButton);
    return mobileLikeText ? /^\D*$/.test(mobileLikeText.innerText) : true;
  }
  const likeTextContainer = getLikeTextContainer(controls.likeButton);
  return likeTextContainer ? /^\D*$/.test(likeTextContainer.innerText) : true;
}

function state_isVideoLiked() {
  const likeButton = getNativeButton(getLikeButton());
  if (state_isMobile()) {
    return likeButton.getAttribute("aria-label") === "true";
  }
  return (
    state_extConfig.selectors.activeButtonClasses.some((className) => getLikeButton().classList.contains(className)) ||
    likeButton?.getAttribute("aria-pressed") === "true"
  );
}

function isVideoDisliked() {
  const dislikeButton = getNativeButton(getDislikeButton());
  if (state_isMobile()) {
    return dislikeButton.getAttribute("aria-label") === "true";
  }
  return (
    state_extConfig.selectors.activeButtonClasses.some((className) => getDislikeButton().classList.contains(className)) ||
    dislikeButton?.getAttribute("aria-pressed") === "true"
  );
}

function getState(storedData) {
  if (state_isVideoLiked()) {
    return { current: LIKED_STATE, previous: storedData.previousState };
  }
  if (isVideoDisliked()) {
    return { current: DISLIKED_STATE, previous: storedData.previousState };
  }
  return { current: NEUTRAL_STATE, previous: storedData.previousState };
}

//---   Sets The Likes And Dislikes Values   ---//
const reformattedLikeText = new WeakMap();

function getLikeTextNode() {
  const container = getLikeTextContainer();
  if (!container) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let result = null;
  while (walker.nextNode()) {
    if (!walker.currentNode.data.trim()) continue;
    // Do not flatten animated counters or other multi-node native content.
    if (result) return null;
    result = walker.currentNode;
  }
  return result;
}

function setLikes(likesCount) {
  const textNode = getLikeTextNode();
  if (!textNode) return false;
  const previous = reformattedLikeText.get(textNode);
  const formattedText = String(likesCount);
  reformattedLikeText.set(textNode, {
    nativeText: previous && textNode.data === previous.formattedText ? previous.nativeText : textNode.data,
    formattedText,
  });
  // YouTube retains this node when updating its count. Replacing it with
  // innerText leaves subsequent native updates writing to a detached node.
  if (textNode.data !== formattedText) textNode.data = formattedText;
  return true;
}

function refreshReactionPresentation() {
  refreshDislikeTextTypography();
  const rateBar = getButtons()?.querySelector("#ryd-bar-container");
  if (rateBar) {
    const liked = String(state_isVideoLiked());
    if (rateBar.getAttribute("data-ryd-liked") !== liked) rateBar.setAttribute("data-ryd-liked", liked);
  }
  const nativeLikeCount = readNativeLikeCount();
  const nativeLikes = nativeLikeCount?.likes ?? false;
  if (nativeLikes > 0 && nativeLikeCount.videoId === storedData.videoId && !nativeLikeCount.presented) {
    nativeLikeCount.presented = true;
    if (storedData.likes !== nativeLikes) {
      storedData.likes = nativeLikes;
      createRateBar(storedData.likes, storedData.dislikes);
    }
  }
  if (state_extConfig.numberDisplayReformatLikes === true) {
    if (nativeLikes !== false) setLikes(numberFormat(nativeLikes));
  } else {
    const textNode = getLikeTextNode();
    const previous = textNode && reformattedLikeText.get(textNode);
    if (previous) {
      if (textNode.data === previous.formattedText) textNode.data = previous.nativeText;
      reformattedLikeText.delete(textNode);
    }
  }

  for (const [host, isLike] of [
    [getLikeButton(), true],
    [getDislikeButton(), false],
  ]) {
    if (!host) continue;
    const button = getNativeButton(host) || host;
    if (!button) continue;
    const colored = state_extConfig.coloredThumbs === true && (!state_isShorts() || button.getAttribute("aria-pressed") === "true");
    if (colored) {
      const color = getColorFromTheme(isLike);
      if (button.style.getPropertyValue("--ryd-thumb-color") !== color) {
        button.style.setProperty("--ryd-thumb-color", color);
      }
      if (!button.hasAttribute("data-ryd-thumb-color")) button.setAttribute("data-ryd-thumb-color", "");
    } else if (button.hasAttribute("data-ryd-thumb-color")) {
      button.removeAttribute("data-ryd-thumb-color");
      button.style.removeProperty("--ryd-thumb-color");
    }
  }
}

function setDislikes(dislikesCount) {
  if (!isPrivateBrowsingContext()) logger.log(`SET dislikes ${dislikesCount}`);

  const controls = getButtonControls();
  const _container = getDislikeTextContainer(controls);
  if (!_container) return false;
  _container?.removeAttribute("is-empty");

  let _dislikeText;
  if (!state_isLikesDisabled(controls)) {
    _dislikeText = dislikesCount;
  } else {
    logger.log("likes count disabled by creator");
    _dislikeText = localize("textLikesDisabled");
  }

  // Compare raw text so CSS text transforms cannot retrigger the mutation observer indefinitely.
  if (_dislikeText != null && _container.textContent !== String(_dislikeText)) {
    _container.textContent = _dislikeText;
  }
  return true;
}

const nativeLikeCounts = new WeakMap();

function readNativeLikeCount() {
  try {
    if (state_isShorts()) {
      //Youtube Shorts don't work with this query. It's not necessary; we can skip it and still see the results.
      //It should be possible to fix this function, but it's not critical to showing the dislike count.
      return null;
    }

    const likeButton = querySelector(state_extConfig.selectors.likeCountButton, getLikeButton());
    const nativeLabel = likeButton.getAttribute("aria-label");
    const videoId = getVideoId(window.location.href);
    const previous = nativeLikeCounts.get(likeButton);
    // A reused button can retain the outgoing video's count after navigation.
    // Trust it again only after YouTube changes the label or replaces the node.
    if (previous && previous.videoId !== videoId && previous.nativeLabel === nativeLabel) return null;
    if (previous?.videoId === videoId && previous.nativeLabel === nativeLabel) return previous;

    const likesStr = nativeLabel?.replace(/\D/g, "") ?? "";
    const current = {
      likes: likesStr.length > 0 ? parseInt(likesStr) : false,
      nativeLabel,
      presented: false,
      videoId,
    };
    nativeLikeCounts.set(likeButton, current);
    return current;
  } catch {
    return null;
  }
}

function getLikeCountFromButton() {
  return readNativeLikeCount()?.likes ?? false;
}

function processResponse(response, storedData) {
  const formattedDislike = numberFormat(response.dislikes);
  if (!setDislikes(formattedDislike)) return false;
  // Prefer YouTube's positive count, including updates made while the request was pending.
  const nativeLikeCount = readNativeLikeCount();
  if (nativeLikeCount?.likes > 0) {
    storedData.likes = nativeLikeCount.likes;
    nativeLikeCount.presented = true;
  }
  refreshReactionPresentation();
  createRateBar(storedData.likes, storedData.dislikes);

  //Temporary disabling this - it breaks all places where getButtons()[1] is used
  // createStarRating(response.rating, isMobile());
  return true;
}

// Tells the user if the API is down
function displayError(error, videoId = getVideoId(window.location.href)) {
  if (getVideoId(window.location.href) !== videoId) {
    return;
  }
  const dislikeTextContainer = getDislikeTextContainer();
  if (!dislikeTextContainer) return false;
  dislikeTextContainer.innerText = localize("textTempUnavailable");
  return true;
}

async function setState(storedData) {
  if (typeof window !== "undefined") {
    window.__rydSetStateCalls = (window.__rydSetStateCalls || 0) + 1;
  }
  const videoId = getVideoId(window.location.href);
  const dislikeButton = getDislikeButton();
  if (isSyntheticShortsDislike(dislikeButton) && !isPrivateBrowsingContext()) {
    const storedDisliked = await readSyntheticShortsDislikeState(videoId);
    if (getVideoId(window.location.href) !== videoId) return;
    const liked = state_isVideoLiked();
    setSyntheticShortsDislikePressed(!liked && storedDisliked, dislikeButton);
    storedData.previousState = liked ? LIKED_STATE : storedDisliked ? DISLIKED_STATE : NEUTRAL_STATE;
    if (liked && storedDisliked) void persistSyntheticShortsDislikeState(videoId, false);
  } else {
    storedData.previousState = isVideoDisliked() ? DISLIKED_STATE : state_isVideoLiked() ? LIKED_STATE : NEUTRAL_STATE;
  }
  logger.log("Video is loaded. Adding buttons...");

  const likeCount = getLikeCountFromButton() || null;
  let response;
  try {
    response = await requestVoteData(videoId, { likeCount });
  } catch (error) {
    if (error?.name === "AbortError") return false;
    displayError(error, videoId);
    return;
  }
  if (!isPrivateBrowsingContext()) {
    logger.log("response from api:");
    logger.log(JSON.stringify(response));
  }
  if (getVideoId(window.location.href) !== videoId) {
    return;
  }
  if (!response || typeof response !== "object" || "traceId" in response) {
    displayError(response, videoId);
    return;
  }
  // Native reactions can change while counts load, before vote handling is
  // enabled. Use their current state as the next activation's starting point.
  const currentControls = getButtonControls();
  if (currentControls.ready) {
    const liked = state_isVideoLiked();
    if (isSyntheticShortsDislike(currentControls.dislikeButton)) {
      const disliked = storedData.previousState === DISLIKED_STATE;
      setSyntheticShortsDislikePressed(!liked && disliked, currentControls.dislikeButton);
      storedData.previousState = liked ? LIKED_STATE : disliked ? DISLIKED_STATE : NEUTRAL_STATE;
      if (liked && disliked) void persistSyntheticShortsDislikeState(videoId, false);
    } else {
      storedData.previousState = isVideoDisliked() ? DISLIKED_STATE : liked ? LIKED_STATE : NEUTRAL_STATE;
    }
  }
  // Keep a valid destination response even if YouTube replaces its controls
  // while the request is in flight. The next initialization attempt can then
  // render the cached state into the hydrated controls without refetching.
  storedData.dislikes = parseInt(response.dislikes);
  storedData.likes = parseInt(response.likes);
  storedData.videoId = videoId;
  return processResponse(response, storedData);
}

async function setInitialState() {
  return setState(storedData);
}

function hasLoadedStateForVideo(videoId) {
  return storedData.videoId === videoId;
}

function restoreCurrentState() {
  const dislikeButton = getDislikeButton();
  if (isSyntheticShortsDislike(dislikeButton)) {
    setSyntheticShortsDislikePressed(storedData.previousState === DISLIKED_STATE, dislikeButton);
  } else {
    storedData.previousState = isVideoDisliked() ? DISLIKED_STATE : state_isVideoLiked() ? LIKED_STATE : NEUTRAL_STATE;
  }
  if (!setDislikes(numberFormat(storedData.dislikes))) return false;
  const nativeLikeCount = readNativeLikeCount();
  if (nativeLikeCount?.likes > 0) {
    storedData.likes = nativeLikeCount.likes;
    nativeLikeCount.presented = true;
  }
  createRateBar(storedData.likes, storedData.dislikes);
  return true;
}

function clearRenderedVoteState(controls = getButtonControls()) {
  if (!controls) return;

  if (controls.dislikeTextContainer) {
    controls.dislikeTextContainer.innerText = "";
  }
  if (isSyntheticShortsDislike(controls.dislikeButton)) {
    setSyntheticShortsDislikeEnabled(false, controls.dislikeButton);
    setSyntheticShortsDislikePressed(false, controls.dislikeButton);
  }

  for (const wrapper of controls.buttons?.querySelectorAll?.(".ryd-tooltip") ?? []) {
    wrapper.remove();
  }
}

async function initExtConfig() {
  if (isPrivateBrowsingContext()) {
    await initializePrivateDisplayPreferences();
    await initializeSelectors();
    return;
  }
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeColoredThumbs();
  initializeColoredBar();
  await initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeNumberDisplayReformatLikes();
  initializeHidePremiumTeaser();
  await initializeHideClutterButtons();
  await initializeSelectors();
}

function initializePrivateDisplayPreferences() {
  const preferences = [
    "coloredThumbs",
    "coloredBar",
    "colorTheme",
    "customColors",
    "numberDisplayFormat",
    "showTooltipPercentage",
    "tooltipPercentageMode",
    "numberDisplayReformatLikes",
    HIDE_CLUTTER_BUTTONS_STORAGE_KEY,
  ];
  state_extConfig.disableLogging = true;
  initializeLogging();
  state_extConfig.hidePremiumTeaser = true;
  return new Promise((resolve) => {
    getBrowser().storage.sync.get(preferences, (values = {}) => {
      for (const key of preferences) {
        if (values[key] !== undefined) state_extConfig[key] = values[key];
      }
      state_extConfig.colorTheme = values.colorTheme || "classic";
      state_extConfig.customColors = normalizeCustomColors(values.customColors);
      state_extConfig.hideClutterButtons = publishHideClutterButtons(values[HIDE_CLUTTER_BUTTONS_STORAGE_KEY]);
      resolve();
    });
  });
}

let remoteSelectorsLoaded = false;
let remoteSelectorRequest = null;

function ensureRemoteSelectors() {
  if (remoteSelectorsLoaded) return Promise.resolve(true);
  if (!remoteSelectorRequest) {
    remoteSelectorRequest = initializeSelectors().finally(() => {
      remoteSelectorRequest = null;
    });
  }
  return remoteSelectorRequest;
}

function remoteSelectorsSettled() {
  return remoteSelectorRequest ?? Promise.resolve();
}

async function initializeSelectors() {
  const controller = new AbortController();
  const privateContext = isPrivateBrowsingContext();
  const abortOnPageHide = () => controller.abort();
  if (privateContext) window.addEventListener("pagehide", abortOnPageHide, { once: true });
  const timeout = setTimeout(() => controller.abort(), SELECTOR_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchWithCoreConsent(getApiEndpoint("/configs/selectors"), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      ...(privateContext ? { credentials: "omit", cache: "no-store" } : {}),
    });
    if (!response.ok) {
      throw new Error(`Selector request failed with HTTP ${response.status}`);
    }
    const result = await response.json();
    if (privateContext && controller.signal.aborted) return false;
    state_extConfig.selectors = mergeConfig(DEFAULT_SELECTORS, result);
    remoteSelectorsLoaded = true;
    if (!isPrivateBrowsingContext()) logger.log(result);
    return true;
  } catch (error) {
    state_extConfig.selectors = cloneConfig(DEFAULT_SELECTORS);
    logger.debug("Remote selectors unavailable; using bundled selectors.", error?.name ?? error);
    return false;
  } finally {
    clearTimeout(timeout);
    if (privateContext) window.removeEventListener("pagehide", abortOnPageHide);
  }
}

function initializeDisableVoteSubmission() {
  getBrowser().storage.sync.get(["disableVoteSubmission"], (res) => {
    if (res.disableVoteSubmission === undefined) {
      getBrowser().storage.sync.set({ disableVoteSubmission: false });
    } else {
      state_extConfig.disableVoteSubmission = res.disableVoteSubmission;
    }
  });
}

let loggingPreferenceRevision = 0;

function updateDisableLogging(value) {
  loggingPreferenceRevision += 1;
  state_extConfig.disableLogging = value ?? true;
  initializeLogging();
}

function initializeDisableLogging() {
  const revision = loggingPreferenceRevision;
  getBrowser().storage.sync.get(["disableLogging"], (res) => {
    if (revision !== loggingPreferenceRevision) return;
    if (res.disableLogging === undefined) {
      getBrowser().storage.sync.set({ disableLogging: true });
    }
    updateDisableLogging(res.disableLogging);
  });
}

function initializeColoredThumbs() {
  getBrowser().storage.sync.get(["coloredThumbs"], (res) => {
    if (res.coloredThumbs === undefined) {
      getBrowser().storage.sync.set({ coloredThumbs: false });
    } else {
      state_extConfig.coloredThumbs = res.coloredThumbs;
    }
  });
}

function initializeColoredBar() {
  getBrowser().storage.sync.get(["coloredBar"], (res) => {
    if (res.coloredBar === undefined) {
      getBrowser().storage.sync.set({ coloredBar: false });
    } else {
      state_extConfig.coloredBar = res.coloredBar;
    }
  });
}

function initializeColorTheme() {
  return new Promise((resolve) => {
    const storage = getBrowser().storage;
    const changedPreferences = {};
    const captureChanges = (changes, area) => {
      if (area !== "sync") return;
      for (const key of ["colorTheme", "customColors"]) {
        if (changes[key]) changedPreferences[key] = changes[key].newValue;
      }
    };
    storage.onChanged.addListener(captureChanges);
    storage.sync.get(["colorTheme", "customColors"], (res = {}) => {
      storage.onChanged.removeListener(captureChanges);
      const preferences = { ...res, ...changedPreferences };
      state_extConfig.colorTheme = preferences.colorTheme || "classic";
      state_extConfig.customColors = normalizeCustomColors(preferences.customColors);
      resolve();
    });
  });
}

function initializeNumberDisplayFormat() {
  getBrowser().storage.sync.get(["numberDisplayFormat"], (res) => {
    if (res.numberDisplayFormat === undefined) {
      getBrowser().storage.sync.set({ numberDisplayFormat: "compactShort" });
    } else {
      state_extConfig.numberDisplayFormat = res.numberDisplayFormat;
    }
  });
}

function initializeTooltipPercentage() {
  getBrowser().storage.sync.get(["showTooltipPercentage"], (res) => {
    if (res.showTooltipPercentage === undefined) {
      getBrowser().storage.sync.set({ showTooltipPercentage: false });
    } else {
      state_extConfig.showTooltipPercentage = res.showTooltipPercentage;
    }
  });
}

function initializeTooltipPercentageMode() {
  getBrowser().storage.sync.get(["tooltipPercentageMode"], (res) => {
    if (res.tooltipPercentageMode === undefined) {
      getBrowser().storage.sync.set({ tooltipPercentageMode: "dash_like" });
    } else {
      state_extConfig.tooltipPercentageMode = res.tooltipPercentageMode;
    }
  });
}

function initializeNumberDisplayReformatLikes() {
  getBrowser().storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    if (res.numberDisplayReformatLikes === undefined) {
      getBrowser().storage.sync.set({ numberDisplayReformatLikes: false });
    } else {
      state_extConfig.numberDisplayReformatLikes = res.numberDisplayReformatLikes;
    }
  });
}

function initializeHidePremiumTeaser() {
  getBrowser().storage.sync.get(["hidePremiumTeaser"], (res) => {
    if (res.hidePremiumTeaser === undefined) {
      getBrowser().storage.sync.set({ hidePremiumTeaser: false });
      state_extConfig.hidePremiumTeaser = false;
    } else {
      state_extConfig.hidePremiumTeaser = res.hidePremiumTeaser === true;
    }
  });
}

function initializeHideClutterButtons() {
  const storage = getBrowser()?.storage?.sync;
  if (!storage) {
    state_extConfig.hideClutterButtons = publishHideClutterButtons(false);
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    storage.get([HIDE_CLUTTER_BUTTONS_STORAGE_KEY], (res = {}) => {
      const storedValue = res[HIDE_CLUTTER_BUTTONS_STORAGE_KEY];
      const normalized = normalizeHideClutterButtons(storedValue);
      state_extConfig.hideClutterButtons = publishHideClutterButtons(normalized);
      if (storedValue === undefined && !isPrivateBrowsingContext()) {
        storage.set({ [HIDE_CLUTTER_BUTTONS_STORAGE_KEY]: false });
      }
      resolve(normalized);
    });
  });
}



;// CONCATENATED MODULE: ./Extensions/combined/src/utils.js





const DEFAULT_SHORTS_LOADED_SELECTORS = {
  containers: [".reel-video-in-sequence-new"],
  thumbnail: [".reel-video-in-sequence-thumbnail"],
  renderer: ["ytd-reel-video-renderer"],
  mobileRenderer: ["ytm-reel-video-renderer"],
  overlay: ["#experiment-overlay"],
};

const DEFAULT_VIDEO_LOADED_SELECTORS = (/* unused pure expression or super */ null && ([
  "ytd-watch-grid[video-id='{videoId}']",
  "ytd-watch-flexy[video-id='{videoId}']",
  '#player[loading="false"]:not([hidden])',
]));

function utils_numberFormat(numberState) {
  return getNumberFormatter(extConfig.numberDisplayFormat).format(numberState);
}

function getNumberFormatter(optionSelect) {
  let userLocales;
  if (document.documentElement.lang) {
    userLocales = document.documentElement.lang;
  } else if (navigator.language) {
    userLocales = navigator.language;
  } else {
    try {
      userLocales = new URL(
        Array.from(document.querySelectorAll("head > link[rel='search']"))
          ?.find((n) => n?.getAttribute("href")?.includes("?locale="))
          ?.getAttribute("href"),
      )?.searchParams?.get("locale");
    } catch {
      logger.log("Cannot find browser locale. Use en as default for number formatting.");
      userLocales = "en";
    }
  }

  let formatterNotation;
  let formatterCompactDisplay;
  switch (optionSelect) {
    case "compactLong":
      formatterNotation = "compact";
      formatterCompactDisplay = "long";
      break;
    case "standard":
      formatterNotation = "standard";
      formatterCompactDisplay = "short";
      break;
    case "compactShort":
    default:
      formatterNotation = "compact";
      formatterCompactDisplay = "short";
  }

  return Intl.NumberFormat(userLocales, {
    notation: formatterNotation,
    compactDisplay: formatterCompactDisplay,
  });
}

function utils_localize(localeString, substitutions) {
  try {
    if (typeof chrome !== "undefined" && chrome?.i18n?.getMessage) {
      const args = substitutions === undefined ? [localeString] : [localeString, substitutions];
      const message = chrome.i18n.getMessage(...args);
      if (message) {
        return message;
      }
    }
  } catch (error) {
    console.warn("Localization lookup failed for", localeString, error);
  }

  if (Array.isArray(substitutions)) {
    return substitutions.join(" ");
  }

  if (substitutions != null) {
    return `${substitutions}`;
  }

  return localeString;
}

function utils_getBrowser() {
  if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined") {
    return chrome;
  } else if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined") {
    return browser;
  } else {
    logging_logger.log("browser is not supported");
    return false;
  }
}

function utils_getVideoId(url) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  if (pathname.startsWith("/clip")) {
    return (document.querySelector("meta[itemprop='videoId']") || document.querySelector("meta[itemprop='identifier']"))
      .content;
  } else {
    if (pathname.startsWith("/shorts")) {
      return pathname.slice(8);
    }
    return urlObject.searchParams.get("v") ?? getLiveVideoId(pathname);
  }
}

function utils_isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const height = innerHeight || document.documentElement.clientHeight;
  const width = innerWidth || document.documentElement.clientWidth;
  return (
    // When short (channel) is ignored, the element (like/dislike AND short itself) is
    // hidden with a 0 DOMRect. In this case, consider it outside of Viewport
    !(rect.top == 0 && rect.left == 0 && rect.bottom == 0 && rect.right == 0) &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= height &&
    rect.right <= width
  );
}

function getShortsRendererVideoId(renderer) {
  const rendererVideoId = renderer?.getAttribute("video-id");
  if (rendererVideoId) return rendererVideoId;

  const href = renderer?.querySelector("a[href*='/shorts/']")?.getAttribute("href");
  if (!href) return null;
  try {
    return utils_getVideoId(new URL(href, window.location.href).href);
  } catch {
    return null;
  }
}

function isRenderedInViewport(element) {
  if (!element || element.closest("[hidden], [aria-hidden='true'], [inert]")) return false;

  for (let current = element; current; current = current.parentElement) {
    const style = window.getComputedStyle(current);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number.parseFloat(style.opacity || "1") === 0
    ) {
      return false;
    }
  }

  const rect = element.getBoundingClientRect();
  const height = innerHeight || document.documentElement.clientHeight;
  const width = innerWidth || document.documentElement.clientWidth;
  return (
    rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width
  );
}

function isShortsLoaded(videoId) {
  if (!videoId) return false;

  const selectors = extConfig.selectors.shortsLoaded ?? DEFAULT_SHORTS_LOADED_SELECTORS;

  // Mobile Shorts does not use the desktop sequence/thumbnail/experiment-overlay
  // readiness tree. Its active renderer is the stable identity and visibility
  // boundary; button readiness is validated separately before initialization.
  for (const renderer of utils_querySelectorAll(selectors.mobileRenderer ?? DEFAULT_SHORTS_LOADED_SELECTORS.mobileRenderer)) {
    if (!renderer.hasAttribute("is-active")) continue;
    if (getShortsRendererVideoId(renderer) !== videoId) continue;
    if (renderer.closest("[hidden], [aria-hidden='true'], [inert]")) continue;

    const style = window.getComputedStyle(renderer);
    const rect = renderer.getBoundingClientRect();
    if (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      Number.parseFloat(style.opacity || "1") !== 0 &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      return true;
    }
  }

  // On desktop the active reel can be partially clipped after YouTube scrolls
  // its action controls into view. Current YouTube variants can also omit both
  // `is-active` and `video-id`; in that topology the renderer's canonical
  // /shorts/ link is the only stable identity. Full viewport containment and
  // the active attribute are therefore not valid readiness requirements.
  for (const renderer of utils_querySelectorAll(selectors.renderer ?? DEFAULT_SHORTS_LOADED_SELECTORS.renderer)) {
    if (getShortsRendererVideoId(renderer) !== videoId) continue;
    if (isRenderedInViewport(renderer)) return true;
  }

  // Find all reel containers
  const reelContainers = utils_querySelectorAll(selectors.containers);

  for (const container of reelContainers) {
    // Check if this container's thumbnail matches our video ID
    const thumbnail = utils_querySelector(selectors.thumbnail, container);
    if (thumbnail) {
      const bgImage = thumbnail.style.backgroundImage;
      // YouTube thumbnail URLs contain the video ID in the format: /vi/VIDEO_ID/
      if ((bgImage && bgImage.includes(`/${videoId}/`)) || (!bgImage && utils_isInViewport(container))) {
        // Check if this container has the renderer with visible experiment-overlay
        const renderer = utils_querySelector(selectors.renderer, container);
        if (renderer) {
          const experimentOverlay = utils_querySelector(selectors.overlay, renderer);
          if (
            experimentOverlay &&
            !experimentOverlay.hidden &&
            window.getComputedStyle(experimentOverlay).display !== "none" &&
            experimentOverlay.hasChildNodes()
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function isVideoLoaded() {
  const videoId = utils_getVideoId(window.location.href);

  // Check if this is a Shorts URL
  if (isShorts()) {
    return isShortsLoaded(videoId);
  }

  const videoLoadedSelectors = extConfig.selectors.videoLoaded ?? DEFAULT_VIDEO_LOADED_SELECTORS;

  // Regular video checks
  return utils_querySelector(videoLoadedSelectors.map((selector) => selector.replace("{videoId}", videoId))) !== undefined;
}

function utils_initializeLogging() {
  setLoggingDisabled(extConfig.disableLogging);
}

function utils_getColorFromTheme(voteIsLike) {
  return getThemeColor(extConfig.colorTheme, voteIsLike, isYouTubeDarkTheme(), extConfig.customColors);
}

function utils_getElementWidth(element) {
  if (!element) return 0;
  // getComputedStyle().width resolves to "auto"/"" (→ NaN) for inline
  // elements such as YouTube's newer <like-button-view-model> /
  // <dislike-button-view-model> wrappers. Fall back to the rendered box width
  // so the ratio bar still gets a sensible size.
  const styleWidth = parseFloat(window.getComputedStyle(element).width);
  if (Number.isFinite(styleWidth)) return styleWidth;
  const rect = element.getBoundingClientRect?.();
  return rect ? rect.width : 0;
}

function utils_querySelector(selectors, element) {
  let result;
  for (const selector of Array.isArray(selectors) ? selectors : [selectors]) {
    if (!selector) continue;
    result = (element ?? document).querySelector(selector);
    if (result !== null) {
      return result;
    }
  }
}

function utils_querySelectorAll(selectors) {
  let result;
  for (const selector of Array.isArray(selectors) ? selectors : [selectors]) {
    if (!selector) continue;
    result = document.querySelectorAll(selector);
    if (result.length !== 0) {
      return result;
    }
  }
  return result ?? document.querySelectorAll("__ryd-missing-selector__");
}

function createObserver(options, callback) {
  const observerWrapper = new Object();
  observerWrapper.options = options;
  observerWrapper.observer = new MutationObserver(callback);
  observerWrapper.observe = function (element) {
    this.observer.observe(element, this.options);
  };
  observerWrapper.disconnect = function () {
    this.observer.disconnect();
  };
  return observerWrapper;
}



;// CONCATENATED MODULE: ./Extensions/combined/src/localize-page.js
function localizePage(getMessage) {
  const localize = (text) => text.replace(/__MSG_(\w+)__/g, (_, key) => getMessage(key));
  const title = document.querySelector("title");
  if (title?.title) title.title = localize(title.title);
  document.title = localize(document.title);
  const body = document.body.innerHTML;
  const localizedBody = localize(body);
  if (localizedBody !== body) document.body.innerHTML = localizedBody;
  document.documentElement.toggleAttribute("data-localized", true);
}

;// CONCATENATED MODULE: ./Extensions/combined/src/changelog/index.js




const PATREON_JOIN_URL = "https://www.patreon.com/join/returnyoutubedislike/checkout?rid=8008649";
const SUPPORT_DOC_URL = config.links?.help ?? "https://returnyoutubedislike.com/help";
const COMMUNITY_URL = config.links?.discord ?? "https://discord.gg/mYnESY4Md5";
const EXTERNAL_ACTIONS = {
  "ryd-changelog-appeal-join": PATREON_JOIN_URL,
  "ryd-changelog-upgrade": PATREON_JOIN_URL,
  "ryd-changelog-support": SUPPORT_DOC_URL,
  "ryd-changelog-contact": COMMUNITY_URL,
};

function initChangelogPage() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
}

function setup() {
  applyLocaleMetadata();
  localizePage(utils_localize);
  decorateScreenshotPlaceholders();
  bindActions();
}

function applyLocaleMetadata() {
  try {
    const browserLocale = chrome?.i18n?.getMessage?.("@@ui_locale");
    if (browserLocale) {
      document.documentElement.lang = browserLocale;
    }
    const direction = chrome?.i18n?.getMessage?.("@@bidi_dir");
    if (direction === "rtl" || direction === "ltr") document.documentElement.dir = direction;
  } catch (error) {
    console.debug("Unable to resolve UI locale", error);
  }
}

function decorateScreenshotPlaceholders() {
  document.querySelectorAll("[data-screenshot]").forEach((wrapper) => {
    const type = wrapper.getAttribute("data-screenshot");
    const labelKey = getPlaceholderLabelKey(type);
    if (!labelKey) return;

    const placeholder = wrapper.querySelector(".ryd-feature-card__placeholder");
    if (!placeholder) return;

    const label = utils_localize(labelKey);
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute("aria-label", label);
    placeholder.title = label;
  });
}

function getPlaceholderLabelKey(type) {
  switch (type) {
    case "timeline":
      return "changelog_screenshot_label_timeline";
    case "map":
      return "changelog_screenshot_label_map";
    case "teaser":
      return "changelog_screenshot_label_teaser";
    default:
      return null;
  }
}

function bindActions() {
  const browser = utils_getBrowser();
  for (const [id, url] of Object.entries(EXTERNAL_ACTIONS)) {
    document.getElementById(id)?.addEventListener("click", (event) => {
      event.preventDefault();
      openExternal(url, browser);
    });
  }
}

function openExternal(url, browser) {
  if (!url) return;

  try {
    if (browser && browser.tabs && typeof browser.tabs.create === "function") {
      browser.tabs.create({ url });
      return;
    }
  } catch (error) {
    console.debug("tabs.create unavailable, falling back", error);
  }

  try {
    window.open(url, "_blank", "noopener");
  } catch (error) {
    console.warn("Failed to open external url", url, error);
  }
}

;// CONCATENATED MODULE: ./Extensions/combined/src/data-collection-permissions.js


const AUTHENTICATION_DATA_PERMISSION = "authenticationInfo";
const hasAuthenticationDataPermission = (options) => hasFeaturePermission("account", options);

function onAuthenticationDataPermissionRemoved(listener) {
  return onDataPermissionsChanged(({ removed }) => {
    if (removed.includes(AUTHENTICATION_DATA_PERMISSION)) listener();
  });
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



;// CONCATENATED MODULE: ./Extensions/combined/ryd.changelog.js







const FIREFOX_OPT_IN_FEATURE = "voteOptIn";

initChangelogPage();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFirefoxOptIn);
} else {
  setupFirefoxOptIn();
}

function message(key) {
  return chrome.i18n.getMessage(key);
}

function setupFirefoxOptIn() {
  if (!usesFirefoxDataCollectionConsent() || private_browsing_isPrivateBrowsingContext()) return;
  const section = document.getElementById("ryd-firefox-optin");
  if (!section) return;
  const heroEyebrow = document.getElementById("ryd-hero-eyebrow");
  const heroBody = document.getElementById("ryd-hero-body");
  const allow = document.getElementById("ryd-firefox-consent-allow");
  const actions = document.getElementById("ryd-firefox-consent-actions");
  const status = document.getElementById("ryd-firefox-consent-status");
  let revision = 0;
  let outcome = "";

  function renderHero(countsGranted) {
    heroEyebrow.textContent = message(countsGranted ? "changelog_hero_eyebrow" : "changelog_hero_eyebrow_counts_off");
    heroBody.textContent = message(countsGranted ? "changelog_hero_body" : "changelog_hero_body_counts_off");
  }

  function settledMessage({ countsGranted, votesGranted, voteSubmissionDisabled }) {
    if (voteSubmissionDisabled) return countsGranted ? "counts_consent_enabled" : "";
    return votesGranted ? "changelog_firefox_vote_granted" : "";
  }

  async function render() {
    const current = ++revision;
    const [countsGranted, votesGranted, voteSubmissionDisabled] = await Promise.all([
      core_data_consent_hasFeaturePermission("counts"),
      core_data_consent_hasFeaturePermission("voting"),
      readVoteSubmissionDisabled(),
    ]);
    if (current !== revision) return;
    renderHero(countsGranted);
    const settled = settledMessage({ countsGranted, votesGranted, voteSubmissionDisabled });
    if (settled) outcome = "";
    actions.hidden = Boolean(settled);
    const key = settled || outcome;
    status.textContent = key ? message(key) : "";
    section.hidden = false;
  }

  allow.addEventListener("click", () => {
    const request = requestFeaturePermission(FIREFOX_OPT_IN_FEATURE);
    allow.disabled = true;
    void (async () => {
      try {
        outcome = (await request) ? "" : "consent_declined_status";
      } catch (_) {
        outcome = "consent_error_status";
      } finally {
        allow.disabled = false;
        await render();
      }
    })();
  });

  renderHero(false);
  renderDataPermissionList(document.getElementById("ryd-firefox-consent-permissions"), FIREFOX_OPT_IN_FEATURE, message);
  core_data_consent_onDataPermissionsChanged(() => void render());
  onVoteSubmissionSettingChanged(() => void render());
  void render();
}

})();

/******/ })()
;