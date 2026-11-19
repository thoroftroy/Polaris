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

function getApiUrl() {
  return config.apiUrl;
}

function getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



;// CONCATENATED MODULE: ./Extensions/combined/src/github-login-error.js
const GITHUB_ERROR_MESSAGES = {
  github_not_configured: "githubLoginUnavailable",
  github_unavailable: "githubLoginUnavailable",
  not_contributor: "githubLoginNotContributor",
  github_redirect_rejected: "githubLoginBrowserUnavailable",
  github_invalid_state: "githubLoginExpired",
  github_pkce_required: "githubLoginUpdateRequired",
  github_rate_limited: "githubLoginRateLimited",
  github_authorization_denied: "githubLoginDenied",
};

function getGitHubLoginErrorMessage(error, getMessage) {
  const key = Object.prototype.hasOwnProperty.call(GITHUB_ERROR_MESSAGES, error)
    ? GITHUB_ERROR_MESSAGES[error]
    : "githubLoginCompleteFailed";
  return getMessage(key);
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



;// CONCATENATED MODULE: ./Extensions/combined/src/discussion/client.js


function runtimeApi() {
  return typeof chrome !== "undefined" ? chrome.runtime : globalThis.browser?.runtime;
}

function client_requestDiscussion(operation, payload = {}, scope) {
  return new Promise((resolve, reject) => {
    if (private_browsing_isPrivateBrowsingContext()) {
      reject(Object.assign(new Error("Discussion service unavailable"), { code: "private_browsing" }));
      return;
    }
    const runtime = runtimeApi();
    if (!runtime?.sendMessage) {
      reject(Object.assign(new Error("Discussion service unavailable"), { code: "unavailable" }));
      return;
    }
    let settled = false;
    const finish = (response) => {
      if (settled) return;
      settled = true;
      if (runtime.lastError) {
        reject(Object.assign(new Error(runtime.lastError.message), { code: "unavailable" }));
      } else if (response?.ok) {
        resolve(response.data);
      } else {
        reject(Object.assign(new Error(response?.error?.message || "Discussion request failed"), response?.error));
      }
    };
    try {
      const result = runtime.sendMessage(
        { message: "ryd_discussion", operation, payload, ...(scope ? { scope } : {}) },
        finish,
      );
      if (result?.then)
        result.then(finish, (error) => {
          if (!settled) {
            settled = true;
            reject(error);
          }
        });
    } catch (error) {
      reject(error);
    }
  });
}

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

function createDiscussionRequestScope(videoId, request = client_requestDiscussion) {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  const scope = {
    id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
    videoId,
  };
  let cancelled = false;
  const cancelledError = () => Object.assign(new Error("The video changed"), { code: "navigation_changed" });
  return {
    request(operation, payload = {}) {
      if (cancelled) return Promise.reject(cancelledError());
      return request(operation, payload, VIDEO_OPERATIONS.has(operation) ? scope : undefined).then((data) => {
        if (cancelled) throw cancelledError();
        return data;
      });
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      request("cancelScope", {}, scope).catch(() => {});
    },
  };
}

function subscribeDiscussionEvents(listener) {
  if (private_browsing_isPrivateBrowsingContext()) return () => {};
  const api = typeof browser !== "undefined" ? browser : globalThis.chrome;
  const extensionUrl = api?.runtime?.getURL?.("");
  if (
    isFirefoxExtension(api) &&
    typeof window !== "undefined" &&
    window.location.protocol === "moz-extension:" &&
    extensionUrl &&
    window.location.href.startsWith(extensionUrl)
  ) {
    const receive = (event) => {
      if (event.detail?.message === "ryd_discussion_event") listener(event.detail);
    };
    window.addEventListener("ryd-discussion-event", receive);
    return () => window.removeEventListener("ryd-discussion-event", receive);
  }
  const event = runtimeApi()?.onMessage;
  const receive = (message) => {
    if (message?.message === "ryd_discussion_event") listener(message);
  };
  event?.addListener(receive);
  return () => event?.removeListener(receive);
}

;// CONCATENATED MODULE: ./Extensions/combined/_locales/az/messages.json
const messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Bəyənməmə sayları hər kəs üçün pulsuz qalır. Ödənişli əlavələr onları işlədən serverlərin xərclərini ödəməyə kömək edir: 15 TB-dan çox məlumat və gündə təxminən 20 milyon istifadəçi, ayda bir neçə yüz dollarlıq büdcə ilə."},"discussion_title":{"message":"RYD şərhləri"},"discussion_subtitle":{"message":"Return YouTube Dislike tərəfindən təqdim olunan icma müzakirəsi."},"discussion_independent":{"message":"Bu şərhlər YouTube-dan ayrıdır."},"discussion_open":{"message":"RYD şərhlərini aç"},"discussion_close":{"message":"Bağla"},"discussion_new":{"message":"Ən yeni"},"discussion_top":{"message":"Ən populyar"},"discussion_sort":{"message":"Şərhləri sırala"},"discussion_refresh":{"message":"Yenilə"},"discussion_loading":{"message":"Şərhlər yüklənir…"},"discussion_empty":{"message":"Hələ şərh yoxdur. Söhbətə başlayın."},"discussion_comment":{"message":"Şərh"},"discussion_post":{"message":"Şərh paylaş"},"discussion_reply":{"message":"Cavab ver"},"discussion_postReply":{"message":"Cavab paylaş"},"discussion_cancel":{"message":"Ləğv et"},"discussion_save":{"message":"Saxla"},"discussion_edit":{"message":"Redaktə et"},"discussion_delete":{"message":"Sil"},"discussion_deleteConfirm":{"message":"Bu şərh silinsin?"},"discussion_deleted":{"message":"Şərh silindi"},"discussion_edited":{"message":"redaktə edilib"},"discussion_replies":{"message":"Cavablar ($1)"},"discussion_more":{"message":"Daha çox yüklə"},"discussion_like":{"message":"Bəyən"},"discussion_dislike":{"message":"Bəyənmə"},"discussion_signInRequired":{"message":"Davam etmək üçün genişlənmənin açılan pəncərəsindən daxil olun."},"discussion_tierRequired":{"message":"Şərh paylaşmaq aktiv Commenter və daha yüksək səviyyəli üzvlər üçün əlçatandır."},"discussion_join":{"message":"Commenter üzvü ol"},"discussion_gate":{"message":"Hər kəs oxuya və reaksiya verə bilər. Aktiv Commenter və daha yüksək səviyyəli üzvlər şərh paylaşa bilər."},"discussion_nicknameRequired":{"message":"Şərh paylaşmazdan əvvəl hamıya görünən RYD ləqəbinizi seçin."},"discussion_nicknameLabel":{"message":"Hamıya görünən RYD ləqəbi"},"discussion_nicknameHint":{"message":"3–32 hərf, rəqəm, boşluq, nöqtə, defis və ya alt xətt. Bu ad şərhlərinizlə birlikdə görünəcək."},"discussion_nicknameSave":{"message":"Ləqəbi saxla"},"discussion_nicknameTaken":{"message":"Bu ləqəb artıq istifadə olunur. Başqasını seçin."},"discussion_nicknameInvalid":{"message":"3–32 hərf, rəqəm, boşluq, nöqtə, defis və ya alt xətdən istifadə edin."},"discussion_nicknameChange":{"message":"Ləqəbi dəyiş"},"discussion_as":{"message":"$1 kimi şərh yazırsınız"},"discussion_placeholder":{"message":"Müzakirəyə qoşulun…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Şikayət et"},"discussion_reportTitle":{"message":"Şərhdən şikayət et"},"discussion_reportReason":{"message":"Səbəb"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Təqib və ya nifrət"},"discussion_reportOther":{"message":"Digər"},"discussion_reportDetails":{"message":"Əlavə təfərrüatlar (istəyə bağlı)"},"discussion_reportSend":{"message":"Şikayəti göndər"},"discussion_reportDone":{"message":"Şikayət alındı. Təşəkkür edirik."},"discussion_moderation":{"message":"Moderasiya"},"discussion_queueEmpty":{"message":"Baxılacaq şikayət yoxdur."},"discussion_hide":{"message":"Şərhi gizlət"},"discussion_restore":{"message":"Şərhi bərpa et"},"discussion_dismiss":{"message":"Şikayətləri rədd et"},"discussion_ban":{"message":"Müəllifi blokla"},"discussion_unban":{"message":"Müəllifin blokunu aç"},"discussion_moderationReason":{"message":"Moderasiya səbəbi"},"discussion_unavailable":{"message":"Bu video üçün RYD şərhləri əlçatan deyil."},"discussion_commentUnavailable":{"message":"Bu şərh artıq əlçatan deyil."},"discussion_error":{"message":"Bağlanmaq mümkün olmadı. Yenidən cəhd edin."},"discussion_rateLimited":{"message":"Yenidən cəhd etməzdən əvvəl bir az gözləyin."},"discussion_conflict":{"message":"Bu şərh dəyişib. Yeniləyin və yenidən cəhd edin."},"discussion_forbidden":{"message":"Bu əməliyyat hesabınız üçün əlçatan deyil."},"discussion_retry":{"message":"Yenidən cəhd et"},"discussion_notifications":{"message":"Bildirişlər"},"discussion_notificationEmpty":{"message":"Bütün yeniliklərdən xəbərdarsınız."},"discussion_notificationReply":{"message":"$1 şərhinizə cavab verdi"},"discussion_notificationLike":{"message":"Kimsə şərhinizi bəyəndi"},"discussion_notificationLikes":{"message":"Şərhiniz $1 bəyənmə aldı"},"discussion_someone":{"message":"Kimsə"},"discussion_markRead":{"message":"Oxunmuş kimi işarələ"},"discussion_markAllRead":{"message":"Hamısını oxunmuş kimi işarələ"},"discussion_view":{"message":"Müzakirəyə bax"},"discussion_signedOutInbox":{"message":"Şərhlərinizə verilən cavabları və bəyənmələri görmək üçün daxil olun."},"discussion_discussionTab":{"message":"Müzakirə"},"discussion_nickname":{"message":"Ləqəb"},"discussion_reportStatus":{"message":"Şikayət statusu"},"discussion_openReports":{"message":"Açıq şikayətlər"},"discussion_resolvedReports":{"message":"Rədd edilmiş şikayətlər"},"discussion_author":{"message":"Müəllif"},"discussion_saving":{"message":"Saxlanılır…"},"discussion_loadReplies":{"message":"Cavabları göstər ($1)"},"discussion_reactionConsentRequired":{"message":"Şərhlərə reaksiya vermək üçün səs paylaşımını aktivləşdirin. Reaksiyanız o aktiv olduqdan sonra göndəriləcək."},"discussion_consentContinue":{"message":"Davam et"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/be/messages.json
const be_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Колькасць непадабаек застаецца бясплатнай для ўсіх. Платныя дадаткі дапамагаюць аплачваць серверы, на якіх яна працуе: больш за 15 ТБ даных і каля 20 мільёнаў карыстальнікаў у дзень, а бюджэт — некалькі сотняў долараў на месяц."},"discussion_title":{"message":"Каментарыі RYD"},"discussion_subtitle":{"message":"Абмеркаванне супольнасці на платформе Return YouTube Dislike."},"discussion_independent":{"message":"Гэтыя каментарыі не звязаны з YouTube."},"discussion_open":{"message":"Адкрыць каментарыі RYD"},"discussion_close":{"message":"Закрыць"},"discussion_new":{"message":"Найноўшыя"},"discussion_top":{"message":"Найлепшыя"},"discussion_sort":{"message":"Сартаваць каментарыі"},"discussion_refresh":{"message":"Абнавіць"},"discussion_loading":{"message":"Загрузка каментарыяў…"},"discussion_empty":{"message":"Каментарыяў пакуль няма. Пачніце размову."},"discussion_comment":{"message":"Каментарый"},"discussion_post":{"message":"Апублікаваць каментарый"},"discussion_reply":{"message":"Адказаць"},"discussion_postReply":{"message":"Апублікаваць адказ"},"discussion_cancel":{"message":"Скасаваць"},"discussion_save":{"message":"Захаваць"},"discussion_edit":{"message":"Рэдагаваць"},"discussion_delete":{"message":"Выдаліць"},"discussion_deleteConfirm":{"message":"Выдаліць гэты каментарый?"},"discussion_deleted":{"message":"Каментарый выдалены"},"discussion_edited":{"message":"адрэдагавана"},"discussion_replies":{"message":"Адказы ($1)"},"discussion_more":{"message":"Загрузіць яшчэ"},"discussion_like":{"message":"Падабаецца"},"discussion_dislike":{"message":"Не падабаецца"},"discussion_signInRequired":{"message":"Каб працягнуць, увайдзіце праз усплывальнае акно пашырэння."},"discussion_tierRequired":{"message":"Публікацыя даступна ўдзельнікам з актыўнай падпіскай узроўню Commenter або вышэй."},"discussion_join":{"message":"Стаць удзельнікам узроўню Commenter"},"discussion_gate":{"message":"Усе могуць чытаць і рэагаваць. Удзельнікі з актыўнай падпіскай узроўню Commenter або вышэй могуць публікаваць каментарыі."},"discussion_nicknameRequired":{"message":"Перад публікацыяй выберыце публічны псеўданім RYD."},"discussion_nicknameLabel":{"message":"Публічны псеўданім RYD"},"discussion_nicknameHint":{"message":"3–32 літары, лічбы, прабелы, кропкі, злучкі або знакі падкрэслівання. Гэтае імя будзе паказана побач з вашымі каментарыямі."},"discussion_nicknameSave":{"message":"Захаваць псеўданім"},"discussion_nicknameTaken":{"message":"Гэты псеўданім ужо заняты. Выберыце іншы."},"discussion_nicknameInvalid":{"message":"Выкарыстоўвайце 3–32 літары, лічбы, прабелы, кропкі, злучкі або знакі падкрэслівання."},"discussion_nicknameChange":{"message":"Змяніць псеўданім"},"discussion_as":{"message":"Вы каментуеце як $1"},"discussion_placeholder":{"message":"Далучайцеся да абмеркавання…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Паскардзіцца"},"discussion_reportTitle":{"message":"Паскардзіцца на каментарый"},"discussion_reportReason":{"message":"Прычына"},"discussion_reportSpam":{"message":"Спам"},"discussion_reportAbuse":{"message":"Пераслед або варожасць"},"discussion_reportOther":{"message":"Іншае"},"discussion_reportDetails":{"message":"Дадатковыя звесткі (неабавязкова)"},"discussion_reportSend":{"message":"Адправіць скаргу"},"discussion_reportDone":{"message":"Скарга атрымана. Дзякуй."},"discussion_moderation":{"message":"Мадэрацыя"},"discussion_queueEmpty":{"message":"Няма скаргаў для разгляду."},"discussion_hide":{"message":"Схаваць каментарый"},"discussion_restore":{"message":"Аднавіць каментарый"},"discussion_dismiss":{"message":"Адхіліць скаргі"},"discussion_ban":{"message":"Заблакаваць аўтара"},"discussion_unban":{"message":"Разблакаваць аўтара"},"discussion_moderationReason":{"message":"Прычына мадэрацыі"},"discussion_unavailable":{"message":"Каментарыі RYD недаступны для гэтага відэа."},"discussion_commentUnavailable":{"message":"Гэты каментарый больш недаступны."},"discussion_error":{"message":"Не ўдалося падключыцца. Паспрабуйце зноў."},"discussion_rateLimited":{"message":"Пачакайце крыху перад наступнай спробай."},"discussion_conflict":{"message":"Гэты каментарый змяніўся. Абнавіце старонку і паспрабуйце зноў."},"discussion_forbidden":{"message":"Гэтае дзеянне недаступна для вашага ўліковага запісу."},"discussion_retry":{"message":"Паспрабаваць зноў"},"discussion_notifications":{"message":"Апавяшчэнні"},"discussion_notificationEmpty":{"message":"Усе апавяшчэнні прачытаны."},"discussion_notificationReply":{"message":"$1 адказвае на ваш каментарый"},"discussion_notificationLike":{"message":"Камусьці спадабаўся ваш каментарый"},"discussion_notificationLikes":{"message":"Ваш каментарый атрымаў падабайкі: $1"},"discussion_someone":{"message":"Хтосьці"},"discussion_markRead":{"message":"Пазначыць як прачытанае"},"discussion_markAllRead":{"message":"Пазначыць усё як прачытанае"},"discussion_view":{"message":"Паглядзець абмеркаванне"},"discussion_signedOutInbox":{"message":"Увайдзіце, каб бачыць адказы і падабайкі на вашы каментарыі."},"discussion_discussionTab":{"message":"Абмеркаванне"},"discussion_nickname":{"message":"Псеўданім"},"discussion_reportStatus":{"message":"Статус скаргі"},"discussion_openReports":{"message":"Адкрытыя скаргі"},"discussion_resolvedReports":{"message":"Адхіленыя скаргі"},"discussion_author":{"message":"Аўтар"},"discussion_saving":{"message":"Захаванне…"},"discussion_loadReplies":{"message":"Паказаць адказы ($1)"},"discussion_reactionConsentRequired":{"message":"Уключыце перадачу ацэнак, каб рэагаваць на каментарыі. Ваша рэакцыя будзе адпраўлена, калі яна ўключыцца."},"discussion_consentContinue":{"message":"Працягнуць"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/cs/messages.json
const cs_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Počty hodnocení Nelíbí se zůstávají zdarma pro všechny. Placené doplňky pomáhají platit servery, které je zajišťují: přes 15 TB dat a zhruba 20 milionů uživatelů denně s rozpočtem několika stovek dolarů měsíčně."},"discussion_title":{"message":"Komentáře RYD"},"discussion_subtitle":{"message":"Komunitní diskuze provozovaná službou Return YouTube Dislike."},"discussion_independent":{"message":"Tyto komentáře jsou oddělené od YouTube."},"discussion_open":{"message":"Otevřít komentáře RYD"},"discussion_close":{"message":"Zavřít"},"discussion_new":{"message":"Nejnovější"},"discussion_top":{"message":"Nejlepší"},"discussion_sort":{"message":"Seřadit komentáře"},"discussion_refresh":{"message":"Obnovit"},"discussion_loading":{"message":"Načítání komentářů…"},"discussion_empty":{"message":"Zatím tu nejsou žádné komentáře. Zahajte diskuzi."},"discussion_comment":{"message":"Komentář"},"discussion_post":{"message":"Zveřejnit komentář"},"discussion_reply":{"message":"Odpovědět"},"discussion_postReply":{"message":"Zveřejnit odpověď"},"discussion_cancel":{"message":"Zrušit"},"discussion_save":{"message":"Uložit"},"discussion_edit":{"message":"Upravit"},"discussion_delete":{"message":"Smazat"},"discussion_deleteConfirm":{"message":"Smazat tento komentář?"},"discussion_deleted":{"message":"Komentář smazán"},"discussion_edited":{"message":"upraveno"},"discussion_replies":{"message":"Odpovědi ($1)"},"discussion_more":{"message":"Načíst další"},"discussion_like":{"message":"To se mi líbí"},"discussion_dislike":{"message":"To se mi nelíbí"},"discussion_signInRequired":{"message":"Pro pokračování se přihlaste ve vyskakovacím okně rozšíření."},"discussion_tierRequired":{"message":"Komentáře mohou zveřejňovat členové s aktivním členstvím úrovně Commenter nebo vyšší."},"discussion_join":{"message":"Získat členství Commenter"},"discussion_gate":{"message":"Číst a reagovat mohou všichni. Komentáře mohou zveřejňovat členové s aktivním členstvím úrovně Commenter nebo vyšší."},"discussion_nicknameRequired":{"message":"Před zveřejněním komentáře si zvolte veřejnou přezdívku RYD."},"discussion_nicknameLabel":{"message":"Veřejná přezdívka RYD"},"discussion_nicknameHint":{"message":"3–32 písmen, číslic, mezer, teček, spojovníků nebo podtržítek. Toto jméno se zobrazí u vašich komentářů."},"discussion_nicknameSave":{"message":"Uložit přezdívku"},"discussion_nicknameTaken":{"message":"Tato přezdívka je již obsazená. Zvolte jinou."},"discussion_nicknameInvalid":{"message":"Použijte 3–32 písmen, číslic, mezer, teček, spojovníků nebo podtržítek."},"discussion_nicknameChange":{"message":"Změnit přezdívku"},"discussion_as":{"message":"Komentujete jako $1"},"discussion_placeholder":{"message":"Zapojte se do diskuze…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Nahlásit"},"discussion_reportTitle":{"message":"Nahlásit komentář"},"discussion_reportReason":{"message":"Důvod"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Obtěžování nebo nenávist"},"discussion_reportOther":{"message":"Jiné"},"discussion_reportDetails":{"message":"Další podrobnosti (nepovinné)"},"discussion_reportSend":{"message":"Odeslat hlášení"},"discussion_reportDone":{"message":"Hlášení přijato. Děkujeme."},"discussion_moderation":{"message":"Moderování"},"discussion_queueEmpty":{"message":"Žádná hlášení ke kontrole."},"discussion_hide":{"message":"Skrýt komentář"},"discussion_restore":{"message":"Obnovit komentář"},"discussion_dismiss":{"message":"Zamítnout hlášení"},"discussion_ban":{"message":"Zablokovat autora"},"discussion_unban":{"message":"Odblokovat autora"},"discussion_moderationReason":{"message":"Důvod moderování"},"discussion_unavailable":{"message":"Komentáře RYD nejsou pro toto video dostupné."},"discussion_commentUnavailable":{"message":"Tento komentář již není dostupný."},"discussion_error":{"message":"Nelze se připojit. Zkuste to znovu."},"discussion_rateLimited":{"message":"Před dalším pokusem chvíli počkejte."},"discussion_conflict":{"message":"Tento komentář se změnil. Obnovte zobrazení a zkuste to znovu."},"discussion_forbidden":{"message":"Tato akce není pro váš účet dostupná."},"discussion_retry":{"message":"Zkusit znovu"},"discussion_notifications":{"message":"Oznámení"},"discussion_notificationEmpty":{"message":"Máte přečtená všechna oznámení."},"discussion_notificationReply":{"message":"$1 odpovídá na váš komentář"},"discussion_notificationLike":{"message":"Někomu se líbil váš komentář"},"discussion_notificationLikes":{"message":"Váš komentář získal tento počet označení To se mi líbí: $1"},"discussion_someone":{"message":"Někdo"},"discussion_markRead":{"message":"Označit jako přečtené"},"discussion_markAllRead":{"message":"Označit vše jako přečtené"},"discussion_view":{"message":"Zobrazit diskuzi"},"discussion_signedOutInbox":{"message":"Přihlaste se a zobrazte odpovědi a označení líbí se u svých komentářů."},"discussion_discussionTab":{"message":"Diskuze"},"discussion_nickname":{"message":"Přezdívka"},"discussion_reportStatus":{"message":"Stav hlášení"},"discussion_openReports":{"message":"Otevřená hlášení"},"discussion_resolvedReports":{"message":"Zamítnutá hlášení"},"discussion_author":{"message":"Autor"},"discussion_saving":{"message":"Ukládání…"},"discussion_loadReplies":{"message":"Zobrazit odpovědi ($1)"},"discussion_reactionConsentRequired":{"message":"Zapněte sdílení hlasů, abyste mohli reagovat na komentáře. Vaše reakce se odešle po jeho zapnutí."},"discussion_consentContinue":{"message":"Pokračovat"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/de/messages.json
const de_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Dislike-Zahlen bleiben für alle kostenlos. Kostenpflichtige Extras helfen, die Server dahinter zu bezahlen: über 15 TB Daten und rund 20 Millionen Nutzer am Tag, bei einem Budget von ein paar hundert Dollar im Monat."},"discussion_title":{"message":"RYD-Kommentare"},"discussion_subtitle":{"message":"Eine Community-Diskussion von Return YouTube Dislike."},"discussion_independent":{"message":"Diese Kommentare sind unabhängig von YouTube."},"discussion_open":{"message":"RYD-Kommentare öffnen"},"discussion_close":{"message":"Schließen"},"discussion_new":{"message":"Neueste"},"discussion_top":{"message":"Beste"},"discussion_sort":{"message":"Kommentare sortieren"},"discussion_refresh":{"message":"Aktualisieren"},"discussion_loading":{"message":"Kommentare werden geladen…"},"discussion_empty":{"message":"Noch keine Kommentare. Beginne die Unterhaltung."},"discussion_comment":{"message":"Kommentar"},"discussion_post":{"message":"Kommentar posten"},"discussion_reply":{"message":"Antworten"},"discussion_postReply":{"message":"Antwort posten"},"discussion_cancel":{"message":"Abbrechen"},"discussion_save":{"message":"Speichern"},"discussion_edit":{"message":"Bearbeiten"},"discussion_delete":{"message":"Löschen"},"discussion_deleteConfirm":{"message":"Diesen Kommentar löschen?"},"discussion_deleted":{"message":"Kommentar gelöscht"},"discussion_edited":{"message":"bearbeitet"},"discussion_replies":{"message":"Antworten ($1)"},"discussion_more":{"message":"Mehr laden"},"discussion_like":{"message":"Gefällt mir"},"discussion_dislike":{"message":"Gefällt mir nicht"},"discussion_signInRequired":{"message":"Melde dich im Popup der Erweiterung an, um fortzufahren."},"discussion_tierRequired":{"message":"Aktive Mitglieder der Stufe Commenter und höher können Kommentare posten."},"discussion_join":{"message":"Commenter werden"},"discussion_gate":{"message":"Alle können lesen und reagieren. Aktive Mitglieder der Stufe Commenter und höher können Kommentare posten."},"discussion_nicknameRequired":{"message":"Wähle vor dem Posten deinen öffentlichen RYD-Nutzernamen."},"discussion_nicknameLabel":{"message":"Öffentlicher RYD-Nutzername"},"discussion_nicknameHint":{"message":"3–32 Buchstaben, Zahlen, Leerzeichen, Punkte, Bindestriche oder Unterstriche. Dieser Name wird bei deinen Kommentaren angezeigt."},"discussion_nicknameSave":{"message":"Nutzernamen speichern"},"discussion_nicknameTaken":{"message":"Dieser Nutzername ist bereits vergeben. Wähle einen anderen."},"discussion_nicknameInvalid":{"message":"Verwende 3–32 Buchstaben, Zahlen, Leerzeichen, Punkte, Bindestriche oder Unterstriche."},"discussion_nicknameChange":{"message":"Nutzernamen ändern"},"discussion_as":{"message":"Kommentieren als $1"},"discussion_placeholder":{"message":"Beteilige dich an der Diskussion…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Melden"},"discussion_reportTitle":{"message":"Kommentar melden"},"discussion_reportReason":{"message":"Grund"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Belästigung oder Hass"},"discussion_reportOther":{"message":"Sonstiges"},"discussion_reportDetails":{"message":"Weitere Angaben (optional)"},"discussion_reportSend":{"message":"Meldung senden"},"discussion_reportDone":{"message":"Meldung erhalten. Vielen Dank."},"discussion_moderation":{"message":"Moderation"},"discussion_queueEmpty":{"message":"Keine Meldungen zu prüfen."},"discussion_hide":{"message":"Kommentar ausblenden"},"discussion_restore":{"message":"Kommentar wiederherstellen"},"discussion_dismiss":{"message":"Meldungen verwerfen"},"discussion_ban":{"message":"Verfasser sperren"},"discussion_unban":{"message":"Verfasser entsperren"},"discussion_moderationReason":{"message":"Grund für die Moderation"},"discussion_unavailable":{"message":"RYD-Kommentare sind für dieses Video nicht verfügbar."},"discussion_commentUnavailable":{"message":"Dieser Kommentar ist nicht mehr verfügbar."},"discussion_error":{"message":"Verbindung nicht möglich. Bitte versuche es erneut."},"discussion_rateLimited":{"message":"Bitte warte einen Moment, bevor du es erneut versuchst."},"discussion_conflict":{"message":"Dieser Kommentar wurde geändert. Aktualisiere die Ansicht und versuche es erneut."},"discussion_forbidden":{"message":"Diese Aktion ist für dein Konto nicht verfügbar."},"discussion_retry":{"message":"Erneut versuchen"},"discussion_notifications":{"message":"Benachrichtigungen"},"discussion_notificationEmpty":{"message":"Du bist auf dem neuesten Stand."},"discussion_notificationReply":{"message":"$1 hat auf deinen Kommentar geantwortet"},"discussion_notificationLike":{"message":"Jemandem gefällt dein Kommentar"},"discussion_notificationLikes":{"message":"Dein Kommentar hat $1 Likes erhalten"},"discussion_someone":{"message":"Jemand"},"discussion_markRead":{"message":"Als gelesen markieren"},"discussion_markAllRead":{"message":"Alle als gelesen markieren"},"discussion_view":{"message":"Diskussion ansehen"},"discussion_signedOutInbox":{"message":"Melde dich an, um Antworten und Likes zu deinen Kommentaren zu sehen."},"discussion_discussionTab":{"message":"Diskussion"},"discussion_nickname":{"message":"Nutzername"},"discussion_reportStatus":{"message":"Meldungsstatus"},"discussion_openReports":{"message":"Offene Meldungen"},"discussion_resolvedReports":{"message":"Verworfene Meldungen"},"discussion_author":{"message":"Verfasser"},"discussion_saving":{"message":"Wird gespeichert…"},"discussion_loadReplies":{"message":"Antworten anzeigen ($1)"},"discussion_reactionConsentRequired":{"message":"Aktiviere das Teilen von Bewertungen, um auf Kommentare zu reagieren. Deine Reaktion wird gesendet, sobald es aktiviert ist."},"discussion_consentContinue":{"message":"Weiter"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/el/messages.json
const el_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Ο αριθμός των «Δεν μου αρέσει» παραμένει δωρεάν για όλους. Οι επί πληρωμή επιπλέον λειτουργίες βοηθούν να πληρώνονται οι διακομιστές που τον υποστηρίζουν: πάνω από 15 TB δεδομένων και περίπου 20 εκατομμύρια χρήστες την ημέρα, με προϋπολογισμό μερικών εκατοντάδων δολαρίων τον μήνα."},"discussion_title":{"message":"Σχόλια RYD"},"discussion_subtitle":{"message":"Μια συζήτηση της κοινότητας που φιλοξενείται από το Return YouTube Dislike."},"discussion_independent":{"message":"Αυτά τα σχόλια είναι ανεξάρτητα από το YouTube."},"discussion_open":{"message":"Άνοιγμα σχολίων RYD"},"discussion_close":{"message":"Κλείσιμο"},"discussion_new":{"message":"Νεότερα"},"discussion_top":{"message":"Κορυφαία"},"discussion_sort":{"message":"Ταξινόμηση σχολίων"},"discussion_refresh":{"message":"Ανανέωση"},"discussion_loading":{"message":"Φόρτωση σχολίων…"},"discussion_empty":{"message":"Δεν υπάρχουν ακόμη σχόλια. Ξεκινήστε τη συζήτηση."},"discussion_comment":{"message":"Σχόλιο"},"discussion_post":{"message":"Δημοσίευση σχολίου"},"discussion_reply":{"message":"Απάντηση"},"discussion_postReply":{"message":"Δημοσίευση απάντησης"},"discussion_cancel":{"message":"Ακύρωση"},"discussion_save":{"message":"Αποθήκευση"},"discussion_edit":{"message":"Επεξεργασία"},"discussion_delete":{"message":"Διαγραφή"},"discussion_deleteConfirm":{"message":"Να διαγραφεί αυτό το σχόλιο;"},"discussion_deleted":{"message":"Το σχόλιο διαγράφηκε"},"discussion_edited":{"message":"τροποποιήθηκε"},"discussion_replies":{"message":"Απαντήσεις ($1)"},"discussion_more":{"message":"Φόρτωση περισσότερων"},"discussion_like":{"message":"Μου αρέσει"},"discussion_dislike":{"message":"Δεν μου αρέσει"},"discussion_signInRequired":{"message":"Συνδεθείτε από το αναδυόμενο παράθυρο της επέκτασης για να συνεχίσετε."},"discussion_tierRequired":{"message":"Η δημοσίευση είναι διαθέσιμη σε ενεργά μέλη της βαθμίδας Commenter και άνω."},"discussion_join":{"message":"Γίνετε μέλος Commenter"},"discussion_gate":{"message":"Όλοι μπορούν να διαβάζουν και να αντιδρούν. Τα ενεργά μέλη της βαθμίδας Commenter και άνω μπορούν να δημοσιεύουν."},"discussion_nicknameRequired":{"message":"Επιλέξτε το δημόσιο ψευδώνυμό σας στο RYD πριν δημοσιεύσετε."},"discussion_nicknameLabel":{"message":"Δημόσιο ψευδώνυμο RYD"},"discussion_nicknameHint":{"message":"3–32 γράμματα, αριθμοί, κενά, τελείες, παύλες ή κάτω παύλες. Αυτό το όνομα θα εμφανίζεται μαζί με τα σχόλιά σας."},"discussion_nicknameSave":{"message":"Αποθήκευση ψευδωνύμου"},"discussion_nicknameTaken":{"message":"Αυτό το ψευδώνυμο χρησιμοποιείται ήδη. Επιλέξτε άλλο."},"discussion_nicknameInvalid":{"message":"Χρησιμοποιήστε 3–32 γράμματα, αριθμούς, κενά, τελείες, παύλες ή κάτω παύλες."},"discussion_nicknameChange":{"message":"Αλλαγή ψευδωνύμου"},"discussion_as":{"message":"Σχολιάζετε ως $1"},"discussion_placeholder":{"message":"Συμμετέχετε στη συζήτηση…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Αναφορά"},"discussion_reportTitle":{"message":"Αναφορά σχολίου"},"discussion_reportReason":{"message":"Αιτία"},"discussion_reportSpam":{"message":"Ανεπιθύμητο περιεχόμενο"},"discussion_reportAbuse":{"message":"Παρενόχληση ή μίσος"},"discussion_reportOther":{"message":"Άλλο"},"discussion_reportDetails":{"message":"Πρόσθετες λεπτομέρειες (προαιρετικά)"},"discussion_reportSend":{"message":"Αποστολή αναφοράς"},"discussion_reportDone":{"message":"Η αναφορά παραλήφθηκε. Ευχαριστούμε."},"discussion_moderation":{"message":"Συντονισμός"},"discussion_queueEmpty":{"message":"Δεν υπάρχουν αναφορές για έλεγχο."},"discussion_hide":{"message":"Απόκρυψη σχολίου"},"discussion_restore":{"message":"Επαναφορά σχολίου"},"discussion_dismiss":{"message":"Απόρριψη αναφορών"},"discussion_ban":{"message":"Αποκλεισμός συντάκτη"},"discussion_unban":{"message":"Άρση αποκλεισμού συντάκτη"},"discussion_moderationReason":{"message":"Αιτία ενέργειας συντονισμού"},"discussion_unavailable":{"message":"Τα σχόλια RYD δεν είναι διαθέσιμα για αυτό το βίντεο."},"discussion_commentUnavailable":{"message":"Αυτό το σχόλιο δεν είναι πλέον διαθέσιμο."},"discussion_error":{"message":"Δεν ήταν δυνατή η σύνδεση. Δοκιμάστε ξανά."},"discussion_rateLimited":{"message":"Περιμένετε λίγο πριν δοκιμάσετε ξανά."},"discussion_conflict":{"message":"Αυτό το σχόλιο άλλαξε. Ανανεώστε και δοκιμάστε ξανά."},"discussion_forbidden":{"message":"Αυτή η ενέργεια δεν είναι διαθέσιμη για τον λογαριασμό σας."},"discussion_retry":{"message":"Δοκιμάστε ξανά"},"discussion_notifications":{"message":"Ειδοποιήσεις"},"discussion_notificationEmpty":{"message":"Έχετε δει όλες τις ενημερώσεις."},"discussion_notificationReply":{"message":"$1 απάντησε στο σχόλιό σας"},"discussion_notificationLike":{"message":"Σε κάποιον άρεσε το σχόλιό σας"},"discussion_notificationLikes":{"message":"Το σχόλιό σας έλαβε $1 likes"},"discussion_someone":{"message":"Κάποιος"},"discussion_markRead":{"message":"Επισήμανση ως αναγνωσμένη"},"discussion_markAllRead":{"message":"Επισήμανση όλων ως αναγνωσμένων"},"discussion_view":{"message":"Προβολή συζήτησης"},"discussion_signedOutInbox":{"message":"Συνδεθείτε για να δείτε απαντήσεις και «Μου αρέσει» στα σχόλιά σας."},"discussion_discussionTab":{"message":"Συζήτηση"},"discussion_nickname":{"message":"Ψευδώνυμο"},"discussion_reportStatus":{"message":"Κατάσταση αναφοράς"},"discussion_openReports":{"message":"Ανοιχτές αναφορές"},"discussion_resolvedReports":{"message":"Αναφορές που απορρίφθηκαν"},"discussion_author":{"message":"Συντάκτης"},"discussion_saving":{"message":"Αποθήκευση…"},"discussion_loadReplies":{"message":"Εμφάνιση απαντήσεων ($1)"},"discussion_reactionConsentRequired":{"message":"Ενεργοποιήστε την κοινοποίηση ψήφων για να αντιδράτε σε σχόλια. Η αντίδρασή σας θα σταλεί μόλις ενεργοποιηθεί."},"discussion_consentContinue":{"message":"Συνέχεια"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/en/messages.json
const en_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Dislike counts stay free for everyone. Paid extras help pay for the servers behind them: over 15 TB of data and about 20 million users a day, on a budget of a few hundred dollars a month."},"discussion_title":{"message":"RYD comments"},"discussion_subtitle":{"message":"A community discussion hosted by Return YouTube Dislike."},"discussion_independent":{"message":"These comments are separate from YouTube."},"discussion_open":{"message":"Open RYD comments"},"discussion_close":{"message":"Close"},"discussion_new":{"message":"Newest"},"discussion_top":{"message":"Top"},"discussion_sort":{"message":"Sort comments"},"discussion_refresh":{"message":"Refresh"},"discussion_loading":{"message":"Loading comments…"},"discussion_empty":{"message":"No comments yet. Start the conversation."},"discussion_comment":{"message":"Comment"},"discussion_post":{"message":"Post comment"},"discussion_reply":{"message":"Reply"},"discussion_postReply":{"message":"Post reply"},"discussion_cancel":{"message":"Cancel"},"discussion_save":{"message":"Save"},"discussion_edit":{"message":"Edit"},"discussion_delete":{"message":"Delete"},"discussion_deleteConfirm":{"message":"Delete this comment?"},"discussion_deleted":{"message":"Comment deleted"},"discussion_edited":{"message":"edited"},"discussion_replies":{"message":"Replies ($1)"},"discussion_more":{"message":"Load more"},"discussion_like":{"message":"Like"},"discussion_dislike":{"message":"Dislike"},"discussion_signInRequired":{"message":"Sign in from the extension popup to continue."},"discussion_tierRequired":{"message":"Posting is available to active Commenter members and above."},"discussion_join":{"message":"Become a Commenter"},"discussion_gate":{"message":"Everyone can read and react. Active Commenter members and above can post."},"discussion_nicknameRequired":{"message":"Choose your public RYD nickname before posting."},"discussion_nicknameLabel":{"message":"Public RYD nickname"},"discussion_nicknameHint":{"message":"3–32 letters, numbers, spaces, dots, dashes or underscores. This name will appear with your comments."},"discussion_nicknameSave":{"message":"Save nickname"},"discussion_nicknameTaken":{"message":"This nickname is already taken. Choose another."},"discussion_nicknameInvalid":{"message":"Use 3–32 letters, numbers, spaces, dots, dashes or underscores."},"discussion_nicknameChange":{"message":"Change nickname"},"discussion_as":{"message":"Commenting as $1"},"discussion_placeholder":{"message":"Add to the discussion…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Report"},"discussion_reportTitle":{"message":"Report comment"},"discussion_reportReason":{"message":"Reason"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Harassment or hate"},"discussion_reportOther":{"message":"Other"},"discussion_reportDetails":{"message":"Additional details (optional)"},"discussion_reportSend":{"message":"Send report"},"discussion_reportDone":{"message":"Report received. Thank you."},"discussion_moderation":{"message":"Moderation"},"discussion_queueEmpty":{"message":"No reports to review."},"discussion_hide":{"message":"Hide comment"},"discussion_restore":{"message":"Restore comment"},"discussion_dismiss":{"message":"Dismiss reports"},"discussion_ban":{"message":"Ban author"},"discussion_unban":{"message":"Unban author"},"discussion_moderationReason":{"message":"Moderation reason"},"discussion_unavailable":{"message":"RYD comments are unavailable for this video."},"discussion_commentUnavailable":{"message":"This comment is no longer available."},"discussion_error":{"message":"Unable to connect. Please try again."},"discussion_rateLimited":{"message":"Please wait a moment before trying again."},"discussion_conflict":{"message":"This comment changed. Refresh and try again."},"discussion_forbidden":{"message":"This action is not available for your account."},"discussion_retry":{"message":"Try again"},"discussion_notifications":{"message":"Notifications"},"discussion_notificationEmpty":{"message":"You\'re all caught up."},"discussion_notificationReply":{"message":"$1 replied to your comment"},"discussion_notificationLike":{"message":"Someone liked your comment"},"discussion_notificationLikes":{"message":"Your comment received $1 likes"},"discussion_someone":{"message":"Someone"},"discussion_markRead":{"message":"Mark read"},"discussion_markAllRead":{"message":"Mark all read"},"discussion_view":{"message":"View discussion"},"discussion_signedOutInbox":{"message":"Sign in to see replies and likes on your comments."},"discussion_discussionTab":{"message":"Discussion"},"discussion_nickname":{"message":"Nickname"},"discussion_reportStatus":{"message":"Report status"},"discussion_openReports":{"message":"Open reports"},"discussion_resolvedReports":{"message":"Dismissed reports"},"discussion_author":{"message":"Author"},"discussion_saving":{"message":"Saving…"},"discussion_loadReplies":{"message":"Show replies ($1)"},"discussion_reactionConsentRequired":{"message":"Turn on vote sharing to react to comments. Your reaction is sent once it\'s on."},"discussion_consentContinue":{"message":"Continue"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/es/messages.json
const es_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"El número de «No me gusta» sigue siendo gratis para todos. Los extras de pago ayudan a pagar los servidores que lo hacen posible: más de 15 TB de datos y unos 20 millones de usuarios al día, con un presupuesto de unos pocos cientos de dólares al mes."},"discussion_title":{"message":"Comentarios de RYD"},"discussion_subtitle":{"message":"Una conversación de la comunidad alojada en Return YouTube Dislike."},"discussion_independent":{"message":"Estos comentarios son independientes de YouTube."},"discussion_open":{"message":"Abrir los comentarios de RYD"},"discussion_close":{"message":"Cerrar"},"discussion_new":{"message":"Más recientes"},"discussion_top":{"message":"Destacados"},"discussion_sort":{"message":"Ordenar comentarios"},"discussion_refresh":{"message":"Actualizar"},"discussion_loading":{"message":"Cargando comentarios…"},"discussion_empty":{"message":"Aún no hay comentarios. Inicia la conversación."},"discussion_comment":{"message":"Comentario"},"discussion_post":{"message":"Publicar comentario"},"discussion_reply":{"message":"Responder"},"discussion_postReply":{"message":"Publicar respuesta"},"discussion_cancel":{"message":"Cancelar"},"discussion_save":{"message":"Guardar"},"discussion_edit":{"message":"Editar"},"discussion_delete":{"message":"Eliminar"},"discussion_deleteConfirm":{"message":"¿Eliminar este comentario?"},"discussion_deleted":{"message":"Comentario eliminado"},"discussion_edited":{"message":"editado"},"discussion_replies":{"message":"Respuestas ($1)"},"discussion_more":{"message":"Cargar más"},"discussion_like":{"message":"Me gusta"},"discussion_dislike":{"message":"No me gusta"},"discussion_signInRequired":{"message":"Inicia sesión desde la ventana emergente de la extensión para continuar."},"discussion_tierRequired":{"message":"Los miembros activos del nivel Commenter o superior pueden publicar."},"discussion_join":{"message":"Únete al nivel Commenter"},"discussion_gate":{"message":"Todo el mundo puede leer y reaccionar. Los miembros activos del nivel Commenter o superior pueden publicar."},"discussion_nicknameRequired":{"message":"Elige tu apodo público de RYD antes de publicar."},"discussion_nicknameLabel":{"message":"Apodo público de RYD"},"discussion_nicknameHint":{"message":"Entre 3 y 32 letras, números, espacios, puntos, guiones o guiones bajos. Este nombre aparecerá junto a tus comentarios."},"discussion_nicknameSave":{"message":"Guardar apodo"},"discussion_nicknameTaken":{"message":"Este apodo ya está en uso. Elige otro."},"discussion_nicknameInvalid":{"message":"Usa entre 3 y 32 letras, números, espacios, puntos, guiones o guiones bajos."},"discussion_nicknameChange":{"message":"Cambiar apodo"},"discussion_as":{"message":"Comentando como $1"},"discussion_placeholder":{"message":"Participa en la conversación…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Denunciar"},"discussion_reportTitle":{"message":"Denunciar comentario"},"discussion_reportReason":{"message":"Motivo"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Acoso u odio"},"discussion_reportOther":{"message":"Otro"},"discussion_reportDetails":{"message":"Detalles adicionales (opcional)"},"discussion_reportSend":{"message":"Enviar denuncia"},"discussion_reportDone":{"message":"Denuncia recibida. Gracias."},"discussion_moderation":{"message":"Moderación"},"discussion_queueEmpty":{"message":"No hay denuncias que revisar."},"discussion_hide":{"message":"Ocultar comentario"},"discussion_restore":{"message":"Restaurar comentario"},"discussion_dismiss":{"message":"Descartar denuncias"},"discussion_ban":{"message":"Bloquear al autor"},"discussion_unban":{"message":"Desbloquear al autor"},"discussion_moderationReason":{"message":"Motivo de moderación"},"discussion_unavailable":{"message":"Los comentarios de RYD no están disponibles para este vídeo."},"discussion_commentUnavailable":{"message":"Este comentario ya no está disponible."},"discussion_error":{"message":"No se ha podido conectar. Inténtalo de nuevo."},"discussion_rateLimited":{"message":"Espera un momento antes de volver a intentarlo."},"discussion_conflict":{"message":"Este comentario ha cambiado. Actualiza y vuelve a intentarlo."},"discussion_forbidden":{"message":"Esta acción no está disponible para tu cuenta."},"discussion_retry":{"message":"Volver a intentar"},"discussion_notifications":{"message":"Notificaciones"},"discussion_notificationEmpty":{"message":"Estás al día."},"discussion_notificationReply":{"message":"$1 ha respondido a tu comentario"},"discussion_notificationLike":{"message":"A alguien le ha gustado tu comentario"},"discussion_notificationLikes":{"message":"Tu comentario ha recibido $1 me gusta"},"discussion_someone":{"message":"Alguien"},"discussion_markRead":{"message":"Marcar como leído"},"discussion_markAllRead":{"message":"Marcar todo como leído"},"discussion_view":{"message":"Ver conversación"},"discussion_signedOutInbox":{"message":"Inicia sesión para ver las respuestas y los Me gusta de tus comentarios."},"discussion_discussionTab":{"message":"Conversación"},"discussion_nickname":{"message":"Apodo"},"discussion_reportStatus":{"message":"Estado de la denuncia"},"discussion_openReports":{"message":"Denuncias pendientes"},"discussion_resolvedReports":{"message":"Denuncias descartadas"},"discussion_author":{"message":"Autor"},"discussion_saving":{"message":"Guardando…"},"discussion_loadReplies":{"message":"Mostrar respuestas ($1)"},"discussion_reactionConsentRequired":{"message":"Activa el uso compartido de votos para reaccionar a comentarios. Tu reacción se enviará cuando esté activado."},"discussion_consentContinue":{"message":"Continuar"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/fa/messages.json
const fa_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"تعداد dislikeها برای همه رایگان می‌ماند. امکانات پولی به پرداخت هزینهٔ سرورهای پشت آن کمک می‌کنند: بیش از ۱۵ ترابایت داده و حدود ۲۰ میلیون کاربر در روز، با بودجه‌ای چند صد دلاری در ماه."},"discussion_title":{"message":"نظرات RYD"},"discussion_subtitle":{"message":"بحث و گفتگوی جامعه کاربری به میزبانی Return YouTube Dislike."},"discussion_independent":{"message":"این نظرات جدا از YouTube هستند."},"discussion_open":{"message":"باز کردن نظرات RYD"},"discussion_close":{"message":"بستن"},"discussion_new":{"message":"جدیدترین"},"discussion_top":{"message":"برترین"},"discussion_sort":{"message":"مرتب‌سازی نظرات"},"discussion_refresh":{"message":"تازه‌سازی"},"discussion_loading":{"message":"در حال بارگذاری نظرات…"},"discussion_empty":{"message":"هنوز نظری ثبت نشده است. گفتگو را آغاز کنید."},"discussion_comment":{"message":"نظر"},"discussion_post":{"message":"ارسال نظر"},"discussion_reply":{"message":"پاسخ"},"discussion_postReply":{"message":"ارسال پاسخ"},"discussion_cancel":{"message":"انصراف"},"discussion_save":{"message":"ذخیره"},"discussion_edit":{"message":"ویرایش"},"discussion_delete":{"message":"حذف"},"discussion_deleteConfirm":{"message":"این نظر حذف شود؟"},"discussion_deleted":{"message":"نظر حذف شد"},"discussion_edited":{"message":"ویرایش‌شده"},"discussion_replies":{"message":"پاسخ‌ها ($1)"},"discussion_more":{"message":"بارگذاری بیشتر"},"discussion_like":{"message":"Like"},"discussion_dislike":{"message":"Dislike"},"discussion_signInRequired":{"message":"برای ادامه، از پنجره بازشوی افزونه وارد شوید."},"discussion_tierRequired":{"message":"ارسال نظر برای اعضای فعال Commenter و بالاتر در دسترس است."},"discussion_join":{"message":"عضویت به عنوان Commenter"},"discussion_gate":{"message":"همه می‌توانند بخوانند و واکنش نشان دهند. اعضای فعال Commenter و بالاتر می‌توانند نظر ارسال کنند."},"discussion_nicknameRequired":{"message":"قبل از ارسال نظر، نام مستعار عمومی RYD خود را انتخاب کنید."},"discussion_nicknameLabel":{"message":"نام مستعار عمومی RYD"},"discussion_nicknameHint":{"message":"۳ تا ۳۲ حرف، عدد، فاصله، نقطه، خط تیره یا زیرخط. این نام همراه با نظرات شما نمایش داده خواهد شد."},"discussion_nicknameSave":{"message":"ذخیره نام مستعار"},"discussion_nicknameTaken":{"message":"این نام مستعار قبلاً گرفته شده است. نام دیگری انتخاب کنید."},"discussion_nicknameInvalid":{"message":"از ۳ تا ۳۲ حرف، عدد، فاصله، نقطه، خط تیره یا زیرخط استفاده کنید."},"discussion_nicknameChange":{"message":"تغییر نام مستعار"},"discussion_as":{"message":"نظر دادن به عنوان $1"},"discussion_placeholder":{"message":"به گفتگو اضافه کنید…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"گزارش"},"discussion_reportTitle":{"message":"گزارش نظر"},"discussion_reportReason":{"message":"دلیل"},"discussion_reportSpam":{"message":"هرزنامه"},"discussion_reportAbuse":{"message":"آزار و اذیت یا سخنان نفرت‌پراکن"},"discussion_reportOther":{"message":"سایر"},"discussion_reportDetails":{"message":"جزئیات تکمیلی (اختیاری)"},"discussion_reportSend":{"message":"ارسال گزارش"},"discussion_reportDone":{"message":"گزارش دریافت شد. با تشکر."},"discussion_moderation":{"message":"مدیریت و نظارت"},"discussion_queueEmpty":{"message":"هیچ گزارشی برای بررسی وجود ندارد."},"discussion_hide":{"message":"مخفی کردن نظر"},"discussion_restore":{"message":"بازیابی نظر"},"discussion_dismiss":{"message":"رد کردن گزارش‌ها"},"discussion_ban":{"message":"مسدود کردن نویسنده"},"discussion_unban":{"message":"رفع مسدودیت نویسنده"},"discussion_moderationReason":{"message":"دلیل اقدام مدیریتی"},"discussion_unavailable":{"message":"نظرات RYD برای این ویدیو در دسترس نیست."},"discussion_commentUnavailable":{"message":"این نظر دیگر در دسترس نیست."},"discussion_error":{"message":"امکان اتصال وجود ندارد. لطفاً دوباره تلاش کنید."},"discussion_rateLimited":{"message":"لطفاً لحظه‌ای صبر کرده و دوباره تلاش کنید."},"discussion_conflict":{"message":"این نظر تغییر کرده است. صفحه را تازه‌سازی کرده و دوباره امتحان کنید."},"discussion_forbidden":{"message":"این عملیات برای حساب کاربری شما در دسترس نیست."},"discussion_retry":{"message":"تلاش مجدد"},"discussion_notifications":{"message":"اعلان‌ها"},"discussion_notificationEmpty":{"message":"همه چیز به‌روز است."},"discussion_notificationReply":{"message":"$1 به نظر شما پاسخ داد"},"discussion_notificationLike":{"message":"یک نفر نظر شما را like کرد"},"discussion_notificationLikes":{"message":"نظر شما $1 like دریافت کرد"},"discussion_someone":{"message":"یک نفر"},"discussion_markRead":{"message":"علامت‌گذاری به عنوان خوانده‌شده"},"discussion_markAllRead":{"message":"علامت‌گذاری همه به عنوان خوانده‌شده"},"discussion_view":{"message":"مشاهده گفتگو"},"discussion_signedOutInbox":{"message":"برای دیدن پاسخ‌ها و like‌هایی که نظرات شما دریافت کرده‌اند وارد شوید."},"discussion_discussionTab":{"message":"گفتگو"},"discussion_nickname":{"message":"نام مستعار"},"discussion_reportStatus":{"message":"وضعیت گزارش"},"discussion_openReports":{"message":"گزارش‌های باز"},"discussion_resolvedReports":{"message":"گزارش‌های رد شده"},"discussion_author":{"message":"نویسنده"},"discussion_saving":{"message":"در حال ذخیره…"},"discussion_loadReplies":{"message":"نمایش پاسخ‌ها ($1)"},"discussion_reactionConsentRequired":{"message":"برای واکنش به دیدگاه‌ها، اشتراک‌گذاری رأی‌ها را روشن کنید. واکنش شما پس از روشن شدن آن فرستاده می‌شود."},"discussion_consentContinue":{"message":"ادامه"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/fr/messages.json
const fr_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Le nombre de dislikes reste gratuit pour tout le monde. Les options payantes aident à financer les serveurs qui le font tourner : plus de 15 To de données et environ 20 millions d’utilisateurs par jour, avec un budget de quelques centaines de dollars par mois."},"discussion_title":{"message":"Commentaires RYD"},"discussion_subtitle":{"message":"Une discussion communautaire hébergée par Return YouTube Dislike."},"discussion_independent":{"message":"Ces commentaires sont indépendants de YouTube."},"discussion_open":{"message":"Ouvrir les commentaires RYD"},"discussion_close":{"message":"Fermer"},"discussion_new":{"message":"Les plus récents"},"discussion_top":{"message":"Les mieux notés"},"discussion_sort":{"message":"Trier les commentaires"},"discussion_refresh":{"message":"Actualiser"},"discussion_loading":{"message":"Chargement des commentaires…"},"discussion_empty":{"message":"Aucun commentaire pour le moment. Lancez la conversation."},"discussion_comment":{"message":"Commentaire"},"discussion_post":{"message":"Publier le commentaire"},"discussion_reply":{"message":"Répondre"},"discussion_postReply":{"message":"Publier la réponse"},"discussion_cancel":{"message":"Annuler"},"discussion_save":{"message":"Enregistrer"},"discussion_edit":{"message":"Modifier"},"discussion_delete":{"message":"Supprimer"},"discussion_deleteConfirm":{"message":"Supprimer ce commentaire ?"},"discussion_deleted":{"message":"Commentaire supprimé"},"discussion_edited":{"message":"modifié"},"discussion_replies":{"message":"Réponses ($1)"},"discussion_more":{"message":"Charger davantage"},"discussion_like":{"message":"J’aime"},"discussion_dislike":{"message":"Je n’aime pas"},"discussion_signInRequired":{"message":"Connectez-vous depuis la fenêtre de l’extension pour continuer."},"discussion_tierRequired":{"message":"Les membres actifs du niveau Commenter ou supérieur peuvent publier."},"discussion_join":{"message":"Devenir membre Commenter"},"discussion_gate":{"message":"Tout le monde peut lire et réagir. Les membres actifs du niveau Commenter ou supérieur peuvent publier."},"discussion_nicknameRequired":{"message":"Choisissez votre pseudonyme public RYD avant de publier."},"discussion_nicknameLabel":{"message":"Pseudonyme public RYD"},"discussion_nicknameHint":{"message":"3 à 32 lettres, chiffres, espaces, points, tirets ou tirets bas. Ce nom apparaîtra avec vos commentaires."},"discussion_nicknameSave":{"message":"Enregistrer le pseudonyme"},"discussion_nicknameTaken":{"message":"Ce pseudonyme est déjà utilisé. Choisissez-en un autre."},"discussion_nicknameInvalid":{"message":"Utilisez 3 à 32 lettres, chiffres, espaces, points, tirets ou tirets bas."},"discussion_nicknameChange":{"message":"Changer de pseudonyme"},"discussion_as":{"message":"Vous commentez en tant que $1"},"discussion_placeholder":{"message":"Participez à la discussion…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Signaler"},"discussion_reportTitle":{"message":"Signaler le commentaire"},"discussion_reportReason":{"message":"Motif"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Harcèlement ou haine"},"discussion_reportOther":{"message":"Autre"},"discussion_reportDetails":{"message":"Précisions supplémentaires (facultatif)"},"discussion_reportSend":{"message":"Envoyer le signalement"},"discussion_reportDone":{"message":"Signalement reçu. Merci."},"discussion_moderation":{"message":"Modération"},"discussion_queueEmpty":{"message":"Aucun signalement à examiner."},"discussion_hide":{"message":"Masquer le commentaire"},"discussion_restore":{"message":"Restaurer le commentaire"},"discussion_dismiss":{"message":"Rejeter les signalements"},"discussion_ban":{"message":"Bannir l’auteur"},"discussion_unban":{"message":"Débannir l’auteur"},"discussion_moderationReason":{"message":"Motif de modération"},"discussion_unavailable":{"message":"Les commentaires RYD ne sont pas disponibles pour cette vidéo."},"discussion_commentUnavailable":{"message":"Ce commentaire n’est plus disponible."},"discussion_error":{"message":"Connexion impossible. Veuillez réessayer."},"discussion_rateLimited":{"message":"Veuillez patienter un instant avant de réessayer."},"discussion_conflict":{"message":"Ce commentaire a été modifié. Actualisez et réessayez."},"discussion_forbidden":{"message":"Cette action n’est pas disponible pour votre compte."},"discussion_retry":{"message":"Réessayer"},"discussion_notifications":{"message":"Notifications"},"discussion_notificationEmpty":{"message":"Vous êtes à jour."},"discussion_notificationReply":{"message":"$1 a répondu à votre commentaire"},"discussion_notificationLike":{"message":"Quelqu’un a aimé votre commentaire"},"discussion_notificationLikes":{"message":"Votre commentaire a reçu $1 mentions J’aime"},"discussion_someone":{"message":"Quelqu’un"},"discussion_markRead":{"message":"Marquer comme lu"},"discussion_markAllRead":{"message":"Tout marquer comme lu"},"discussion_view":{"message":"Voir la discussion"},"discussion_signedOutInbox":{"message":"Connectez-vous pour voir les réponses et les mentions J’aime sur vos commentaires."},"discussion_discussionTab":{"message":"Discussion"},"discussion_nickname":{"message":"Pseudonyme"},"discussion_reportStatus":{"message":"Statut du signalement"},"discussion_openReports":{"message":"Signalements en attente"},"discussion_resolvedReports":{"message":"Signalements rejetés"},"discussion_author":{"message":"Auteur"},"discussion_saving":{"message":"Enregistrement…"},"discussion_loadReplies":{"message":"Afficher les réponses ($1)"},"discussion_reactionConsentRequired":{"message":"Activez le partage des votes pour réagir aux commentaires. Votre réaction sera envoyée une fois le partage activé."},"discussion_consentContinue":{"message":"Continuer"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/hu/messages.json
const hu_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"A nemtetszések száma továbbra is mindenki számára ingyenes. A fizetős extrák segítenek fedezni a mögötte álló szerverek költségeit: több mint 15 TB adat és naponta körülbelül 20 millió felhasználó, havi néhány száz dolláros költségvetésből."},"discussion_title":{"message":"RYD-hozzászólások"},"discussion_subtitle":{"message":"A Return YouTube Dislike által biztosított közösségi beszélgetés."},"discussion_independent":{"message":"Ezek a hozzászólások függetlenek a YouTube-tól."},"discussion_open":{"message":"RYD-hozzászólások megnyitása"},"discussion_close":{"message":"Bezárás"},"discussion_new":{"message":"Legújabbak"},"discussion_top":{"message":"Legnépszerűbbek"},"discussion_sort":{"message":"Hozzászólások rendezése"},"discussion_refresh":{"message":"Frissítés"},"discussion_loading":{"message":"Hozzászólások betöltése…"},"discussion_empty":{"message":"Még nincsenek hozzászólások. Indítsd el a beszélgetést."},"discussion_comment":{"message":"Hozzászólás"},"discussion_post":{"message":"Hozzászólás küldése"},"discussion_reply":{"message":"Válasz"},"discussion_postReply":{"message":"Válasz küldése"},"discussion_cancel":{"message":"Mégse"},"discussion_save":{"message":"Mentés"},"discussion_edit":{"message":"Szerkesztés"},"discussion_delete":{"message":"Törlés"},"discussion_deleteConfirm":{"message":"Törlöd ezt a hozzászólást?"},"discussion_deleted":{"message":"Hozzászólás törölve"},"discussion_edited":{"message":"szerkesztve"},"discussion_replies":{"message":"Válaszok ($1)"},"discussion_more":{"message":"Továbbiak betöltése"},"discussion_like":{"message":"Tetszik"},"discussion_dislike":{"message":"Nem tetszik"},"discussion_signInRequired":{"message":"A folytatáshoz jelentkezz be a bővítmény felugró ablakában."},"discussion_tierRequired":{"message":"Az aktív Commenter és magasabb szintű tagok szólhatnak hozzá."},"discussion_join":{"message":"Legyél Commenter tag"},"discussion_gate":{"message":"Mindenki olvashat és reagálhat. Az aktív Commenter és magasabb szintű tagok szólhatnak hozzá."},"discussion_nicknameRequired":{"message":"Hozzászólás előtt válaszd ki nyilvános RYD-becenevedet."},"discussion_nicknameLabel":{"message":"Nyilvános RYD-becenév"},"discussion_nicknameHint":{"message":"3–32 betű, szám, szóköz, pont, kötőjel vagy aláhúzás. Ez a név jelenik meg a hozzászólásaid mellett."},"discussion_nicknameSave":{"message":"Becenév mentése"},"discussion_nicknameTaken":{"message":"Ez a becenév már foglalt. Válassz másikat."},"discussion_nicknameInvalid":{"message":"Használj 3–32 betűt, számot, szóközt, pontot, kötőjelet vagy aláhúzást."},"discussion_nicknameChange":{"message":"Becenév módosítása"},"discussion_as":{"message":"Hozzászólás $1 néven"},"discussion_placeholder":{"message":"Szólj hozzá a beszélgetéshez…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Jelentés"},"discussion_reportTitle":{"message":"Hozzászólás jelentése"},"discussion_reportReason":{"message":"Indok"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Zaklatás vagy gyűlöletkeltés"},"discussion_reportOther":{"message":"Egyéb"},"discussion_reportDetails":{"message":"További részletek (nem kötelező)"},"discussion_reportSend":{"message":"Jelentés küldése"},"discussion_reportDone":{"message":"A jelentést megkaptuk. Köszönjük."},"discussion_moderation":{"message":"Moderálás"},"discussion_queueEmpty":{"message":"Nincsenek ellenőrzésre váró jelentések."},"discussion_hide":{"message":"Hozzászólás elrejtése"},"discussion_restore":{"message":"Hozzászólás visszaállítása"},"discussion_dismiss":{"message":"Jelentések elutasítása"},"discussion_ban":{"message":"Szerző kitiltása"},"discussion_unban":{"message":"Szerző kitiltásának feloldása"},"discussion_moderationReason":{"message":"Moderálás indoka"},"discussion_unavailable":{"message":"Ehhez a videóhoz nem érhetők el RYD-hozzászólások."},"discussion_commentUnavailable":{"message":"Ez a hozzászólás már nem érhető el."},"discussion_error":{"message":"Nem sikerült csatlakozni. Próbáld újra."},"discussion_rateLimited":{"message":"Várj egy kicsit, majd próbáld újra."},"discussion_conflict":{"message":"Ez a hozzászólás megváltozott. Frissíts, és próbáld újra."},"discussion_forbidden":{"message":"Ez a művelet nem érhető el a fiókoddal."},"discussion_retry":{"message":"Újrapróbálás"},"discussion_notifications":{"message":"Értesítések"},"discussion_notificationEmpty":{"message":"Nincsenek új értesítéseid."},"discussion_notificationReply":{"message":"$1 válaszolt a hozzászólásodra"},"discussion_notificationLike":{"message":"Valakinek tetszett a hozzászólásod"},"discussion_notificationLikes":{"message":"A hozzászólásod $1 kedvelést kapott"},"discussion_someone":{"message":"Valaki"},"discussion_markRead":{"message":"Megjelölés olvasottként"},"discussion_markAllRead":{"message":"Összes megjelölése olvasottként"},"discussion_view":{"message":"Beszélgetés megtekintése"},"discussion_signedOutInbox":{"message":"Jelentkezz be a hozzászólásaidra érkező válaszok és kedvelések megtekintéséhez."},"discussion_discussionTab":{"message":"Beszélgetés"},"discussion_nickname":{"message":"Becenév"},"discussion_reportStatus":{"message":"Jelentés állapota"},"discussion_openReports":{"message":"Nyitott jelentések"},"discussion_resolvedReports":{"message":"Elutasított jelentések"},"discussion_author":{"message":"Szerző"},"discussion_saving":{"message":"Mentés…"},"discussion_loadReplies":{"message":"Válaszok megjelenítése ($1)"},"discussion_reactionConsentRequired":{"message":"Kapcsold be a szavazatok megosztását a hozzászólásokra való reagáláshoz. A reakciód a bekapcsolás után kerül elküldésre."},"discussion_consentContinue":{"message":"Folytatás"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/id/messages.json
const id_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Jumlah tidak suka tetap gratis untuk semua orang. Fitur berbayar membantu membiayai server di baliknya: lebih dari 15 TB data dan sekitar 20 juta pengguna per hari, dengan anggaran beberapa ratus dolar per bulan."},"discussion_title":{"message":"Komentar RYD"},"discussion_subtitle":{"message":"Diskusi komunitas yang diselenggarakan oleh Return YouTube Dislike."},"discussion_independent":{"message":"Komentar ini terpisah dari YouTube."},"discussion_open":{"message":"Buka komentar RYD"},"discussion_close":{"message":"Tutup"},"discussion_new":{"message":"Terbaru"},"discussion_top":{"message":"Teratas"},"discussion_sort":{"message":"Urutkan komentar"},"discussion_refresh":{"message":"Muat ulang"},"discussion_loading":{"message":"Memuat komentar…"},"discussion_empty":{"message":"Belum ada komentar. Mulai percakapan."},"discussion_comment":{"message":"Komentar"},"discussion_post":{"message":"Kirim komentar"},"discussion_reply":{"message":"Balas"},"discussion_postReply":{"message":"Kirim balasan"},"discussion_cancel":{"message":"Batal"},"discussion_save":{"message":"Simpan"},"discussion_edit":{"message":"Edit"},"discussion_delete":{"message":"Hapus"},"discussion_deleteConfirm":{"message":"Hapus komentar ini?"},"discussion_deleted":{"message":"Komentar dihapus"},"discussion_edited":{"message":"diedit"},"discussion_replies":{"message":"Balasan ($1)"},"discussion_more":{"message":"Muat lebih banyak"},"discussion_like":{"message":"Suka"},"discussion_dislike":{"message":"Tidak suka"},"discussion_signInRequired":{"message":"Login melalui popup ekstensi untuk melanjutkan."},"discussion_tierRequired":{"message":"Anggota aktif tingkat Commenter ke atas dapat mengirim komentar."},"discussion_join":{"message":"Jadi anggota Commenter"},"discussion_gate":{"message":"Semua orang dapat membaca dan memberi reaksi. Anggota aktif tingkat Commenter ke atas dapat mengirim komentar."},"discussion_nicknameRequired":{"message":"Pilih nama panggilan RYD publik Anda sebelum mengirim komentar."},"discussion_nicknameLabel":{"message":"Nama panggilan RYD publik"},"discussion_nicknameHint":{"message":"3–32 karakter berupa huruf, angka, spasi, titik, tanda hubung, atau garis bawah. Nama ini akan ditampilkan bersama komentar Anda."},"discussion_nicknameSave":{"message":"Simpan nama panggilan"},"discussion_nicknameTaken":{"message":"Nama panggilan ini sudah digunakan. Pilih yang lain."},"discussion_nicknameInvalid":{"message":"Gunakan 3–32 karakter berupa huruf, angka, spasi, titik, tanda hubung, atau garis bawah."},"discussion_nicknameChange":{"message":"Ubah nama panggilan"},"discussion_as":{"message":"Berkomentar sebagai $1"},"discussion_placeholder":{"message":"Ikut berdiskusi…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Laporkan"},"discussion_reportTitle":{"message":"Laporkan komentar"},"discussion_reportReason":{"message":"Alasan"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Pelecehan atau kebencian"},"discussion_reportOther":{"message":"Lainnya"},"discussion_reportDetails":{"message":"Detail tambahan (opsional)"},"discussion_reportSend":{"message":"Kirim laporan"},"discussion_reportDone":{"message":"Laporan diterima. Terima kasih."},"discussion_moderation":{"message":"Moderasi"},"discussion_queueEmpty":{"message":"Tidak ada laporan untuk ditinjau."},"discussion_hide":{"message":"Sembunyikan komentar"},"discussion_restore":{"message":"Pulihkan komentar"},"discussion_dismiss":{"message":"Abaikan laporan"},"discussion_ban":{"message":"Blokir penulis"},"discussion_unban":{"message":"Buka blokir penulis"},"discussion_moderationReason":{"message":"Alasan moderasi"},"discussion_unavailable":{"message":"Komentar RYD tidak tersedia untuk video ini."},"discussion_commentUnavailable":{"message":"Komentar ini tidak lagi tersedia."},"discussion_error":{"message":"Tidak dapat terhubung. Coba lagi."},"discussion_rateLimited":{"message":"Tunggu sebentar sebelum mencoba lagi."},"discussion_conflict":{"message":"Komentar ini telah berubah. Muat ulang dan coba lagi."},"discussion_forbidden":{"message":"Tindakan ini tidak tersedia untuk akun Anda."},"discussion_retry":{"message":"Coba lagi"},"discussion_notifications":{"message":"Notifikasi"},"discussion_notificationEmpty":{"message":"Semua notifikasi sudah dibaca."},"discussion_notificationReply":{"message":"$1 membalas komentar Anda"},"discussion_notificationLike":{"message":"Seseorang menyukai komentar Anda"},"discussion_notificationLikes":{"message":"Komentar Anda mendapat $1 suka"},"discussion_someone":{"message":"Seseorang"},"discussion_markRead":{"message":"Tandai sudah dibaca"},"discussion_markAllRead":{"message":"Tandai semua sudah dibaca"},"discussion_view":{"message":"Lihat diskusi"},"discussion_signedOutInbox":{"message":"Login untuk melihat balasan dan suka pada komentar Anda."},"discussion_discussionTab":{"message":"Diskusi"},"discussion_nickname":{"message":"Nama panggilan"},"discussion_reportStatus":{"message":"Status laporan"},"discussion_openReports":{"message":"Laporan terbuka"},"discussion_resolvedReports":{"message":"Laporan yang diabaikan"},"discussion_author":{"message":"Penulis"},"discussion_saving":{"message":"Menyimpan…"},"discussion_loadReplies":{"message":"Tampilkan balasan ($1)"},"discussion_reactionConsentRequired":{"message":"Aktifkan berbagi suara untuk bereaksi terhadap komentar. Reaksi Anda dikirim setelah fitur ini aktif."},"discussion_consentContinue":{"message":"Lanjutkan"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/it/messages.json
const it_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Il numero di Non mi piace resta gratuito per tutti. Gli extra a pagamento aiutano a pagare i server che lo rendono possibile: oltre 15 TB di dati e circa 20 milioni di utenti al giorno, con un budget di poche centinaia di dollari al mese."},"discussion_title":{"message":"Commenti RYD"},"discussion_subtitle":{"message":"Una discussione della community ospitata da Return YouTube Dislike."},"discussion_independent":{"message":"Questi commenti sono indipendenti da YouTube."},"discussion_open":{"message":"Apri i commenti RYD"},"discussion_close":{"message":"Chiudi"},"discussion_new":{"message":"Più recenti"},"discussion_top":{"message":"Più apprezzati"},"discussion_sort":{"message":"Ordina i commenti"},"discussion_refresh":{"message":"Aggiorna"},"discussion_loading":{"message":"Caricamento dei commenti…"},"discussion_empty":{"message":"Ancora nessun commento. Avvia la conversazione."},"discussion_comment":{"message":"Commento"},"discussion_post":{"message":"Pubblica commento"},"discussion_reply":{"message":"Rispondi"},"discussion_postReply":{"message":"Pubblica risposta"},"discussion_cancel":{"message":"Annulla"},"discussion_save":{"message":"Salva"},"discussion_edit":{"message":"Modifica"},"discussion_delete":{"message":"Elimina"},"discussion_deleteConfirm":{"message":"Eliminare questo commento?"},"discussion_deleted":{"message":"Commento eliminato"},"discussion_edited":{"message":"modificato"},"discussion_replies":{"message":"Risposte ($1)"},"discussion_more":{"message":"Carica altri"},"discussion_like":{"message":"Mi piace"},"discussion_dislike":{"message":"Non mi piace"},"discussion_signInRequired":{"message":"Accedi dal popup dell’estensione per continuare."},"discussion_tierRequired":{"message":"I membri attivi del livello Commenter o superiore possono pubblicare."},"discussion_join":{"message":"Diventa membro Commenter"},"discussion_gate":{"message":"Tutti possono leggere e reagire. I membri attivi del livello Commenter o superiore possono pubblicare."},"discussion_nicknameRequired":{"message":"Scegli il tuo nickname pubblico RYD prima di pubblicare."},"discussion_nicknameLabel":{"message":"Nickname pubblico RYD"},"discussion_nicknameHint":{"message":"Da 3 a 32 lettere, numeri, spazi, punti, trattini o trattini bassi. Questo nome apparirà accanto ai tuoi commenti."},"discussion_nicknameSave":{"message":"Salva nickname"},"discussion_nicknameTaken":{"message":"Questo nickname è già in uso. Scegline un altro."},"discussion_nicknameInvalid":{"message":"Usa da 3 a 32 lettere, numeri, spazi, punti, trattini o trattini bassi."},"discussion_nicknameChange":{"message":"Cambia nickname"},"discussion_as":{"message":"Commenti come $1"},"discussion_placeholder":{"message":"Partecipa alla discussione…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Segnala"},"discussion_reportTitle":{"message":"Segnala commento"},"discussion_reportReason":{"message":"Motivo"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Molestie o odio"},"discussion_reportOther":{"message":"Altro"},"discussion_reportDetails":{"message":"Ulteriori dettagli (facoltativo)"},"discussion_reportSend":{"message":"Invia segnalazione"},"discussion_reportDone":{"message":"Segnalazione ricevuta. Grazie."},"discussion_moderation":{"message":"Moderazione"},"discussion_queueEmpty":{"message":"Nessuna segnalazione da esaminare."},"discussion_hide":{"message":"Nascondi commento"},"discussion_restore":{"message":"Ripristina commento"},"discussion_dismiss":{"message":"Respingi segnalazioni"},"discussion_ban":{"message":"Blocca autore"},"discussion_unban":{"message":"Sblocca autore"},"discussion_moderationReason":{"message":"Motivo della moderazione"},"discussion_unavailable":{"message":"I commenti RYD non sono disponibili per questo video."},"discussion_commentUnavailable":{"message":"Questo commento non è più disponibile."},"discussion_error":{"message":"Impossibile connettersi. Riprova."},"discussion_rateLimited":{"message":"Attendi un momento prima di riprovare."},"discussion_conflict":{"message":"Questo commento è stato modificato. Aggiorna e riprova."},"discussion_forbidden":{"message":"Questa azione non è disponibile per il tuo account."},"discussion_retry":{"message":"Riprova"},"discussion_notifications":{"message":"Notifiche"},"discussion_notificationEmpty":{"message":"Non ci sono novità."},"discussion_notificationReply":{"message":"$1 ha risposto al tuo commento"},"discussion_notificationLike":{"message":"A qualcuno piace il tuo commento"},"discussion_notificationLikes":{"message":"Il tuo commento ha ricevuto $1 Mi piace"},"discussion_someone":{"message":"Qualcuno"},"discussion_markRead":{"message":"Segna come letto"},"discussion_markAllRead":{"message":"Segna tutto come letto"},"discussion_view":{"message":"Visualizza discussione"},"discussion_signedOutInbox":{"message":"Accedi per vedere le risposte e i Mi piace ai tuoi commenti."},"discussion_discussionTab":{"message":"Discussione"},"discussion_nickname":{"message":"Nickname"},"discussion_reportStatus":{"message":"Stato della segnalazione"},"discussion_openReports":{"message":"Segnalazioni aperte"},"discussion_resolvedReports":{"message":"Segnalazioni respinte"},"discussion_author":{"message":"Autore"},"discussion_saving":{"message":"Salvataggio…"},"discussion_loadReplies":{"message":"Mostra risposte ($1)"},"discussion_reactionConsentRequired":{"message":"Attiva la condivisione dei voti per reagire ai commenti. La tua reazione verrà inviata una volta attivata."},"discussion_consentContinue":{"message":"Continua"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/ja/messages.json
const ja_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"低評価数はこれからも誰でも無料で確認できます。有料の追加機能の収益は、それを支えるサーバーの費用に充てられています。15 TB を超えるデータを保管し、1日約2,000万人のユーザーに対応するサーバーを、月数百ドルの予算で運営しています。"},"discussion_title":{"message":"RYD コメント"},"discussion_subtitle":{"message":"Return YouTube Dislike が提供するコミュニティディスカッションです。"},"discussion_independent":{"message":"これらのコメントは YouTube とは別のものです。"},"discussion_open":{"message":"RYD コメントを開く"},"discussion_close":{"message":"閉じる"},"discussion_new":{"message":"新しい順"},"discussion_top":{"message":"人気順"},"discussion_sort":{"message":"コメントを並べ替え"},"discussion_refresh":{"message":"更新"},"discussion_loading":{"message":"コメントを読み込み中…"},"discussion_empty":{"message":"まだコメントはありません。会話を始めましょう。"},"discussion_comment":{"message":"コメント"},"discussion_post":{"message":"コメントを投稿"},"discussion_reply":{"message":"返信"},"discussion_postReply":{"message":"返信を投稿"},"discussion_cancel":{"message":"キャンセル"},"discussion_save":{"message":"保存"},"discussion_edit":{"message":"編集"},"discussion_delete":{"message":"削除"},"discussion_deleteConfirm":{"message":"このコメントを削除しますか？"},"discussion_deleted":{"message":"コメントは削除されました"},"discussion_edited":{"message":"編集済み"},"discussion_replies":{"message":"返信（$1）"},"discussion_more":{"message":"さらに読み込む"},"discussion_like":{"message":"高評価"},"discussion_dislike":{"message":"低評価"},"discussion_signInRequired":{"message":"続行するには、拡張機能のポップアップからログインしてください。"},"discussion_tierRequired":{"message":"投稿は有効な Commenter 以上のメンバーが利用できます。"},"discussion_join":{"message":"Commenter になる"},"discussion_gate":{"message":"誰でも閲覧とリアクションができます。有効な Commenter 以上のメンバーは投稿できます。"},"discussion_nicknameRequired":{"message":"投稿する前に、公開する RYD ニックネームを選んでください。"},"discussion_nicknameLabel":{"message":"公開 RYD ニックネーム"},"discussion_nicknameHint":{"message":"文字、数字、スペース、ピリオド、ハイフン、アンダースコアを使用して 3～32 文字で入力してください。この名前はコメントとともに表示されます。"},"discussion_nicknameSave":{"message":"ニックネームを保存"},"discussion_nicknameTaken":{"message":"このニックネームはすでに使われています。別の名前を選んでください。"},"discussion_nicknameInvalid":{"message":"文字、数字、スペース、ピリオド、ハイフン、アンダースコアを使用して 3～32 文字で入力してください。"},"discussion_nicknameChange":{"message":"ニックネームを変更"},"discussion_as":{"message":"$1 としてコメント"},"discussion_placeholder":{"message":"ディスカッションに参加…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"報告"},"discussion_reportTitle":{"message":"コメントを報告"},"discussion_reportReason":{"message":"理由"},"discussion_reportSpam":{"message":"スパム"},"discussion_reportAbuse":{"message":"嫌がらせやヘイト"},"discussion_reportOther":{"message":"その他"},"discussion_reportDetails":{"message":"詳細（任意）"},"discussion_reportSend":{"message":"報告を送信"},"discussion_reportDone":{"message":"報告を受け付けました。ありがとうございます。"},"discussion_moderation":{"message":"モデレーション"},"discussion_queueEmpty":{"message":"確認する報告はありません。"},"discussion_hide":{"message":"コメントを非表示"},"discussion_restore":{"message":"コメントを再表示"},"discussion_dismiss":{"message":"報告を却下"},"discussion_ban":{"message":"投稿者を利用禁止"},"discussion_unban":{"message":"投稿者の利用禁止を解除"},"discussion_moderationReason":{"message":"モデレーションの理由"},"discussion_unavailable":{"message":"この動画では RYD コメントを利用できません。"},"discussion_commentUnavailable":{"message":"このコメントは利用できなくなりました。"},"discussion_error":{"message":"接続できません。もう一度お試しください。"},"discussion_rateLimited":{"message":"しばらく待ってからもう一度お試しください。"},"discussion_conflict":{"message":"このコメントは変更されています。更新してもう一度お試しください。"},"discussion_forbidden":{"message":"お使いのアカウントではこの操作を利用できません。"},"discussion_retry":{"message":"再試行"},"discussion_notifications":{"message":"通知"},"discussion_notificationEmpty":{"message":"未読の通知はありません。"},"discussion_notificationReply":{"message":"$1 があなたのコメントに返信しました"},"discussion_notificationLike":{"message":"誰かがあなたのコメントを高く評価しました"},"discussion_notificationLikes":{"message":"あなたのコメントが $1 件の高評価を受けました"},"discussion_someone":{"message":"誰か"},"discussion_markRead":{"message":"既読にする"},"discussion_markAllRead":{"message":"すべて既読にする"},"discussion_view":{"message":"ディスカッションを表示"},"discussion_signedOutInbox":{"message":"コメントへの返信や高評価を確認するにはログインしてください。"},"discussion_discussionTab":{"message":"ディスカッション"},"discussion_nickname":{"message":"ニックネーム"},"discussion_reportStatus":{"message":"報告の状態"},"discussion_openReports":{"message":"未対応の報告"},"discussion_resolvedReports":{"message":"却下した報告"},"discussion_author":{"message":"投稿者"},"discussion_saving":{"message":"保存中…"},"discussion_loadReplies":{"message":"返信を表示（$1）"},"discussion_reactionConsentRequired":{"message":"コメントにリアクションするには、評価の共有をオンにしてください。オンになると、リアクションが送信されます。"},"discussion_consentContinue":{"message":"続行"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/ko/messages.json
const ko_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"싫어요 수는 앞으로도 누구나 무료로 볼 수 있습니다. 유료 부가 기능은 이를 뒷받침하는 서버 비용을 충당하는 데 도움이 됩니다. 15TB가 넘는 데이터와 하루 약 2,000만 명의 사용자를 월 수백 달러의 예산으로 운영하고 있습니다."},"discussion_title":{"message":"RYD 댓글"},"discussion_subtitle":{"message":"Return YouTube Dislike에서 제공하는 커뮤니티 토론입니다."},"discussion_independent":{"message":"이 댓글은 YouTube와 별개입니다."},"discussion_open":{"message":"RYD 댓글 열기"},"discussion_close":{"message":"닫기"},"discussion_new":{"message":"최신순"},"discussion_top":{"message":"인기순"},"discussion_sort":{"message":"댓글 정렬"},"discussion_refresh":{"message":"새로고침"},"discussion_loading":{"message":"댓글 불러오는 중…"},"discussion_empty":{"message":"아직 댓글이 없습니다. 대화를 시작해 보세요."},"discussion_comment":{"message":"댓글"},"discussion_post":{"message":"댓글 게시"},"discussion_reply":{"message":"답글"},"discussion_postReply":{"message":"답글 게시"},"discussion_cancel":{"message":"취소"},"discussion_save":{"message":"저장"},"discussion_edit":{"message":"수정"},"discussion_delete":{"message":"삭제"},"discussion_deleteConfirm":{"message":"이 댓글을 삭제할까요?"},"discussion_deleted":{"message":"삭제된 댓글"},"discussion_edited":{"message":"수정됨"},"discussion_replies":{"message":"답글 ($1)"},"discussion_more":{"message":"더 불러오기"},"discussion_like":{"message":"좋아요"},"discussion_dislike":{"message":"싫어요"},"discussion_signInRequired":{"message":"계속하려면 확장 프로그램 팝업에서 로그인해 주세요."},"discussion_tierRequired":{"message":"Commenter 이상 등급의 활성 회원은 댓글을 게시할 수 있습니다."},"discussion_join":{"message":"Commenter 가입하기"},"discussion_gate":{"message":"누구나 읽고 반응을 남길 수 있습니다. Commenter 이상 등급의 활성 회원은 댓글을 게시할 수 있습니다."},"discussion_nicknameRequired":{"message":"게시하기 전에 공개 RYD 닉네임을 정해 주세요."},"discussion_nicknameLabel":{"message":"공개 RYD 닉네임"},"discussion_nicknameHint":{"message":"문자, 숫자, 공백, 마침표, 하이픈 또는 밑줄을 사용하여 3~32자로 입력하세요. 이 이름은 댓글과 함께 표시됩니다."},"discussion_nicknameSave":{"message":"닉네임 저장"},"discussion_nicknameTaken":{"message":"이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요."},"discussion_nicknameInvalid":{"message":"문자, 숫자, 공백, 마침표, 하이픈 또는 밑줄을 사용하여 3~32자로 입력하세요."},"discussion_nicknameChange":{"message":"닉네임 변경"},"discussion_as":{"message":"$1 이름으로 댓글 작성"},"discussion_placeholder":{"message":"토론에 참여해 보세요…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"신고"},"discussion_reportTitle":{"message":"댓글 신고"},"discussion_reportReason":{"message":"사유"},"discussion_reportSpam":{"message":"스팸"},"discussion_reportAbuse":{"message":"괴롭힘 또는 혐오"},"discussion_reportOther":{"message":"기타"},"discussion_reportDetails":{"message":"추가 정보 (선택 사항)"},"discussion_reportSend":{"message":"신고 제출"},"discussion_reportDone":{"message":"신고가 접수되었습니다. 감사합니다."},"discussion_moderation":{"message":"관리"},"discussion_queueEmpty":{"message":"검토할 신고가 없습니다."},"discussion_hide":{"message":"댓글 숨기기"},"discussion_restore":{"message":"댓글 복원"},"discussion_dismiss":{"message":"신고 기각"},"discussion_ban":{"message":"작성자 이용 정지"},"discussion_unban":{"message":"작성자 이용 정지 해제"},"discussion_moderationReason":{"message":"관리 조치 사유"},"discussion_unavailable":{"message":"이 동영상에서는 RYD 댓글을 사용할 수 없습니다."},"discussion_commentUnavailable":{"message":"더 이상 볼 수 없는 댓글입니다."},"discussion_error":{"message":"연결할 수 없습니다. 다시 시도해 주세요."},"discussion_rateLimited":{"message":"잠시 후에 다시 시도해 주세요."},"discussion_conflict":{"message":"이 댓글이 변경되었습니다. 새로고침 후 다시 시도해 주세요."},"discussion_forbidden":{"message":"이 계정으로는 이 작업을 수행할 수 없습니다."},"discussion_retry":{"message":"다시 시도"},"discussion_notifications":{"message":"알림"},"discussion_notificationEmpty":{"message":"모든 알림을 확인했습니다."},"discussion_notificationReply":{"message":"내 댓글에 $1의 답글이 달렸습니다"},"discussion_notificationLike":{"message":"누군가 내 댓글에 좋아요를 눌렀습니다"},"discussion_notificationLikes":{"message":"내 댓글이 좋아요 $1개를 받았습니다"},"discussion_someone":{"message":"누군가"},"discussion_markRead":{"message":"읽음으로 표시"},"discussion_markAllRead":{"message":"모두 읽음으로 표시"},"discussion_view":{"message":"토론 보기"},"discussion_signedOutInbox":{"message":"내 댓글에 달린 답글과 좋아요를 보려면 로그인해 주세요."},"discussion_discussionTab":{"message":"토론"},"discussion_nickname":{"message":"닉네임"},"discussion_reportStatus":{"message":"신고 상태"},"discussion_openReports":{"message":"미처리 신고"},"discussion_resolvedReports":{"message":"기각된 신고"},"discussion_author":{"message":"작성자"},"discussion_saving":{"message":"저장 중…"},"discussion_loadReplies":{"message":"답글 보기 ($1)"},"discussion_reactionConsentRequired":{"message":"댓글에 반응하려면 평가 공유를 켜세요. 켜지면 반응이 전송됩니다."},"discussion_consentContinue":{"message":"계속"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/nl/messages.json
const nl_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Het aantal dislikes blijft voor iedereen gratis. Betaalde extra’s helpen de servers erachter te betalen: meer dan 15 TB aan data en zo’n 20 miljoen gebruikers per dag, met een budget van een paar honderd dollar per maand."},"discussion_title":{"message":"RYD-reacties"},"discussion_subtitle":{"message":"Een discussie voor de community, gehost door Return YouTube Dislike."},"discussion_independent":{"message":"Deze reacties staan los van YouTube."},"discussion_open":{"message":"RYD-reacties openen"},"discussion_close":{"message":"Sluiten"},"discussion_new":{"message":"Nieuwste"},"discussion_top":{"message":"Beste"},"discussion_sort":{"message":"Reacties sorteren"},"discussion_refresh":{"message":"Vernieuwen"},"discussion_loading":{"message":"Reacties laden…"},"discussion_empty":{"message":"Nog geen reacties. Begin het gesprek."},"discussion_comment":{"message":"Reactie"},"discussion_post":{"message":"Reactie plaatsen"},"discussion_reply":{"message":"Beantwoorden"},"discussion_postReply":{"message":"Antwoord plaatsen"},"discussion_cancel":{"message":"Annuleren"},"discussion_save":{"message":"Opslaan"},"discussion_edit":{"message":"Bewerken"},"discussion_delete":{"message":"Verwijderen"},"discussion_deleteConfirm":{"message":"Deze reactie verwijderen?"},"discussion_deleted":{"message":"Reactie verwijderd"},"discussion_edited":{"message":"bewerkt"},"discussion_replies":{"message":"Antwoorden ($1)"},"discussion_more":{"message":"Meer laden"},"discussion_like":{"message":"Vind ik leuk"},"discussion_dislike":{"message":"Vind ik niet leuk"},"discussion_signInRequired":{"message":"Log in via het pop-upvenster van de extensie om verder te gaan."},"discussion_tierRequired":{"message":"Actieve leden op het niveau Commenter en hoger kunnen reacties plaatsen."},"discussion_join":{"message":"Word lid op het niveau Commenter"},"discussion_gate":{"message":"Iedereen kan lezen en waarderingen geven. Actieve leden op het niveau Commenter en hoger kunnen reacties plaatsen."},"discussion_nicknameRequired":{"message":"Kies je openbare RYD-bijnaam voordat je een reactie plaatst."},"discussion_nicknameLabel":{"message":"Openbare RYD-bijnaam"},"discussion_nicknameHint":{"message":"3–32 letters, cijfers, spaties, punten, streepjes of onderstrepingstekens. Deze naam verschijnt bij je reacties."},"discussion_nicknameSave":{"message":"Bijnaam opslaan"},"discussion_nicknameTaken":{"message":"Deze bijnaam is al in gebruik. Kies een andere."},"discussion_nicknameInvalid":{"message":"Gebruik 3–32 letters, cijfers, spaties, punten, streepjes of onderstrepingstekens."},"discussion_nicknameChange":{"message":"Bijnaam wijzigen"},"discussion_as":{"message":"Je reageert als $1"},"discussion_placeholder":{"message":"Neem deel aan de discussie…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Melden"},"discussion_reportTitle":{"message":"Reactie melden"},"discussion_reportReason":{"message":"Reden"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Intimidatie of haat"},"discussion_reportOther":{"message":"Overig"},"discussion_reportDetails":{"message":"Aanvullende informatie (optioneel)"},"discussion_reportSend":{"message":"Melding verzenden"},"discussion_reportDone":{"message":"Melding ontvangen. Bedankt."},"discussion_moderation":{"message":"Moderatie"},"discussion_queueEmpty":{"message":"Geen meldingen om te beoordelen."},"discussion_hide":{"message":"Reactie verbergen"},"discussion_restore":{"message":"Reactie herstellen"},"discussion_dismiss":{"message":"Meldingen afwijzen"},"discussion_ban":{"message":"Auteur verbannen"},"discussion_unban":{"message":"Verbanning van auteur opheffen"},"discussion_moderationReason":{"message":"Reden voor moderatie"},"discussion_unavailable":{"message":"RYD-reacties zijn niet beschikbaar voor deze video."},"discussion_commentUnavailable":{"message":"Deze reactie is niet meer beschikbaar."},"discussion_error":{"message":"Kan geen verbinding maken. Probeer het opnieuw."},"discussion_rateLimited":{"message":"Wacht even voordat je het opnieuw probeert."},"discussion_conflict":{"message":"Deze reactie is gewijzigd. Vernieuw en probeer het opnieuw."},"discussion_forbidden":{"message":"Deze actie is niet beschikbaar voor je account."},"discussion_retry":{"message":"Opnieuw proberen"},"discussion_notifications":{"message":"Meldingen"},"discussion_notificationEmpty":{"message":"Je bent weer helemaal bij."},"discussion_notificationReply":{"message":"$1 heeft je reactie beantwoord"},"discussion_notificationLike":{"message":"Iemand vindt je reactie leuk"},"discussion_notificationLikes":{"message":"Je reactie heeft $1 likes gekregen"},"discussion_someone":{"message":"Iemand"},"discussion_markRead":{"message":"Markeren als gelezen"},"discussion_markAllRead":{"message":"Alles markeren als gelezen"},"discussion_view":{"message":"Discussie bekijken"},"discussion_signedOutInbox":{"message":"Log in om antwoorden en likes op je reacties te zien."},"discussion_discussionTab":{"message":"Discussie"},"discussion_nickname":{"message":"Bijnaam"},"discussion_reportStatus":{"message":"Status van melding"},"discussion_openReports":{"message":"Openstaande meldingen"},"discussion_resolvedReports":{"message":"Afgewezen meldingen"},"discussion_author":{"message":"Auteur"},"discussion_saving":{"message":"Opslaan…"},"discussion_loadReplies":{"message":"Antwoorden tonen ($1)"},"discussion_reactionConsentRequired":{"message":"Schakel het delen van stemmen in om op opmerkingen te reageren. Je reactie wordt verstuurd zodra het is ingeschakeld."},"discussion_consentContinue":{"message":"Doorgaan"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/pl/messages.json
const pl_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Liczba łapek w dół pozostaje bezpłatna dla wszystkich. Płatne dodatki pomagają opłacić serwery, które za nią stoją: ponad 15 TB danych i około 20 milionów użytkowników dziennie przy budżecie kilkuset dolarów miesięcznie."},"discussion_title":{"message":"Komentarze RYD"},"discussion_subtitle":{"message":"Dyskusja społeczności prowadzona przez Return YouTube Dislike."},"discussion_independent":{"message":"Te komentarze są niezależne od YouTube."},"discussion_open":{"message":"Otwórz komentarze RYD"},"discussion_close":{"message":"Zamknij"},"discussion_new":{"message":"Najnowsze"},"discussion_top":{"message":"Najlepsze"},"discussion_sort":{"message":"Sortuj komentarze"},"discussion_refresh":{"message":"Odśwież"},"discussion_loading":{"message":"Wczytywanie komentarzy…"},"discussion_empty":{"message":"Nie ma jeszcze komentarzy. Rozpocznij rozmowę."},"discussion_comment":{"message":"Komentarz"},"discussion_post":{"message":"Opublikuj komentarz"},"discussion_reply":{"message":"Odpowiedz"},"discussion_postReply":{"message":"Opublikuj odpowiedź"},"discussion_cancel":{"message":"Anuluj"},"discussion_save":{"message":"Zapisz"},"discussion_edit":{"message":"Edytuj"},"discussion_delete":{"message":"Usuń"},"discussion_deleteConfirm":{"message":"Usunąć ten komentarz?"},"discussion_deleted":{"message":"Komentarz usunięty"},"discussion_edited":{"message":"edytowano"},"discussion_replies":{"message":"Odpowiedzi ($1)"},"discussion_more":{"message":"Wczytaj więcej"},"discussion_like":{"message":"Lubię to"},"discussion_dislike":{"message":"Nie podoba mi się"},"discussion_signInRequired":{"message":"Aby kontynuować, zaloguj się w oknie rozszerzenia."},"discussion_tierRequired":{"message":"Publikowanie jest dostępne dla osób z aktywnym członkostwem na poziomie Commenter lub wyższym."},"discussion_join":{"message":"Zostań członkiem na poziomie Commenter"},"discussion_gate":{"message":"Każdy może czytać i reagować. Osoby z aktywnym członkostwem na poziomie Commenter lub wyższym mogą publikować komentarze."},"discussion_nicknameRequired":{"message":"Przed opublikowaniem komentarza wybierz swój publiczny pseudonim RYD."},"discussion_nicknameLabel":{"message":"Publiczny pseudonim RYD"},"discussion_nicknameHint":{"message":"3–32 litery, cyfry, spacje, kropki, łączniki lub podkreślenia. Ta nazwa będzie widoczna przy Twoich komentarzach."},"discussion_nicknameSave":{"message":"Zapisz pseudonim"},"discussion_nicknameTaken":{"message":"Ten pseudonim jest już zajęty. Wybierz inny."},"discussion_nicknameInvalid":{"message":"Użyj 3–32 liter, cyfr, spacji, kropek, łączników lub podkreśleń."},"discussion_nicknameChange":{"message":"Zmień pseudonim"},"discussion_as":{"message":"Komentujesz jako $1"},"discussion_placeholder":{"message":"Dołącz do dyskusji…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Zgłoś"},"discussion_reportTitle":{"message":"Zgłoś komentarz"},"discussion_reportReason":{"message":"Powód"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Nękanie lub nienawiść"},"discussion_reportOther":{"message":"Inny"},"discussion_reportDetails":{"message":"Dodatkowe informacje (opcjonalnie)"},"discussion_reportSend":{"message":"Wyślij zgłoszenie"},"discussion_reportDone":{"message":"Zgłoszenie otrzymane. Dziękujemy."},"discussion_moderation":{"message":"Moderacja"},"discussion_queueEmpty":{"message":"Brak zgłoszeń do rozpatrzenia."},"discussion_hide":{"message":"Ukryj komentarz"},"discussion_restore":{"message":"Przywróć komentarz"},"discussion_dismiss":{"message":"Odrzuć zgłoszenia"},"discussion_ban":{"message":"Zablokuj autora"},"discussion_unban":{"message":"Odblokuj autora"},"discussion_moderationReason":{"message":"Powód moderacji"},"discussion_unavailable":{"message":"Komentarze RYD są niedostępne dla tego filmu."},"discussion_commentUnavailable":{"message":"Ten komentarz nie jest już dostępny."},"discussion_error":{"message":"Nie udało się połączyć. Spróbuj ponownie."},"discussion_rateLimited":{"message":"Poczekaj chwilę przed ponowną próbą."},"discussion_conflict":{"message":"Ten komentarz został zmieniony. Odśwież i spróbuj ponownie."},"discussion_forbidden":{"message":"To działanie jest niedostępne dla Twojego konta."},"discussion_retry":{"message":"Spróbuj ponownie"},"discussion_notifications":{"message":"Powiadomienia"},"discussion_notificationEmpty":{"message":"Wszystkie powiadomienia przeczytane."},"discussion_notificationReply":{"message":"$1 odpowiada na Twój komentarz"},"discussion_notificationLike":{"message":"Ktoś polubił Twój komentarz"},"discussion_notificationLikes":{"message":"Liczba polubień Twojego komentarza: $1"},"discussion_someone":{"message":"Ktoś"},"discussion_markRead":{"message":"Oznacz jako przeczytane"},"discussion_markAllRead":{"message":"Oznacz wszystkie jako przeczytane"},"discussion_view":{"message":"Zobacz dyskusję"},"discussion_signedOutInbox":{"message":"Zaloguj się, aby zobaczyć odpowiedzi i polubienia Twoich komentarzy."},"discussion_discussionTab":{"message":"Dyskusja"},"discussion_nickname":{"message":"Pseudonim"},"discussion_reportStatus":{"message":"Status zgłoszenia"},"discussion_openReports":{"message":"Otwarte zgłoszenia"},"discussion_resolvedReports":{"message":"Odrzucone zgłoszenia"},"discussion_author":{"message":"Autor"},"discussion_saving":{"message":"Zapisywanie…"},"discussion_loadReplies":{"message":"Pokaż odpowiedzi ($1)"},"discussion_reactionConsentRequired":{"message":"Włącz udostępnianie ocen, aby reagować na komentarze. Twoja reakcja zostanie wysłana po jego włączeniu."},"discussion_consentContinue":{"message":"Kontynuuj"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/pt_BR/messages.json
const pt_BR_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"O número de deslikes continua gratuito para todos. Os extras pagos ajudam a pagar os servidores por trás dele: mais de 15 TB de dados e cerca de 20 milhões de usuários por dia, com um orçamento de algumas centenas de dólares por mês."},"discussion_title":{"message":"Comentários do RYD"},"discussion_subtitle":{"message":"Uma discussão da comunidade hospedada pelo Return YouTube Dislike."},"discussion_independent":{"message":"Estes comentários são independentes do YouTube."},"discussion_open":{"message":"Abrir comentários do RYD"},"discussion_close":{"message":"Fechar"},"discussion_new":{"message":"Mais recentes"},"discussion_top":{"message":"Mais relevantes"},"discussion_sort":{"message":"Ordenar comentários"},"discussion_refresh":{"message":"Atualizar"},"discussion_loading":{"message":"Carregando comentários…"},"discussion_empty":{"message":"Ainda não há comentários. Comece a conversa."},"discussion_comment":{"message":"Comentário"},"discussion_post":{"message":"Publicar comentário"},"discussion_reply":{"message":"Responder"},"discussion_postReply":{"message":"Publicar resposta"},"discussion_cancel":{"message":"Cancelar"},"discussion_save":{"message":"Salvar"},"discussion_edit":{"message":"Editar"},"discussion_delete":{"message":"Excluir"},"discussion_deleteConfirm":{"message":"Excluir este comentário?"},"discussion_deleted":{"message":"Comentário excluído"},"discussion_edited":{"message":"editado"},"discussion_replies":{"message":"Respostas ($1)"},"discussion_more":{"message":"Carregar mais"},"discussion_like":{"message":"Curtir"},"discussion_dislike":{"message":"Não gostei"},"discussion_signInRequired":{"message":"Entre pela janela da extensão para continuar."},"discussion_tierRequired":{"message":"Membros ativos do nível Commenter ou superior podem publicar."},"discussion_join":{"message":"Torne-se membro do nível Commenter"},"discussion_gate":{"message":"Todos podem ler e reagir. Membros ativos do nível Commenter ou superior podem publicar."},"discussion_nicknameRequired":{"message":"Escolha seu apelido público do RYD antes de publicar."},"discussion_nicknameLabel":{"message":"Apelido público do RYD"},"discussion_nicknameHint":{"message":"De 3 a 32 letras, números, espaços, pontos, hífens ou sublinhados. Este nome aparecerá nos seus comentários."},"discussion_nicknameSave":{"message":"Salvar apelido"},"discussion_nicknameTaken":{"message":"Este apelido já está em uso. Escolha outro."},"discussion_nicknameInvalid":{"message":"Use de 3 a 32 letras, números, espaços, pontos, hífens ou sublinhados."},"discussion_nicknameChange":{"message":"Alterar apelido"},"discussion_as":{"message":"Comentando como $1"},"discussion_placeholder":{"message":"Participe da discussão…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Denunciar"},"discussion_reportTitle":{"message":"Denunciar comentário"},"discussion_reportReason":{"message":"Motivo"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Assédio ou ódio"},"discussion_reportOther":{"message":"Outro"},"discussion_reportDetails":{"message":"Detalhes adicionais (opcional)"},"discussion_reportSend":{"message":"Enviar denúncia"},"discussion_reportDone":{"message":"Denúncia recebida. Obrigado."},"discussion_moderation":{"message":"Moderação"},"discussion_queueEmpty":{"message":"Nenhuma denúncia para analisar."},"discussion_hide":{"message":"Ocultar comentário"},"discussion_restore":{"message":"Restaurar comentário"},"discussion_dismiss":{"message":"Rejeitar denúncias"},"discussion_ban":{"message":"Banir autor"},"discussion_unban":{"message":"Desbanir autor"},"discussion_moderationReason":{"message":"Motivo da moderação"},"discussion_unavailable":{"message":"Os comentários do RYD não estão disponíveis para este vídeo."},"discussion_commentUnavailable":{"message":"Este comentário não está mais disponível."},"discussion_error":{"message":"Não foi possível conectar. Tente novamente."},"discussion_rateLimited":{"message":"Aguarde um momento antes de tentar novamente."},"discussion_conflict":{"message":"Este comentário foi alterado. Atualize e tente novamente."},"discussion_forbidden":{"message":"Esta ação não está disponível para sua conta."},"discussion_retry":{"message":"Tentar novamente"},"discussion_notifications":{"message":"Notificações"},"discussion_notificationEmpty":{"message":"Você está em dia."},"discussion_notificationReply":{"message":"$1 respondeu ao seu comentário"},"discussion_notificationLike":{"message":"Alguém curtiu seu comentário"},"discussion_notificationLikes":{"message":"Seu comentário recebeu $1 curtidas"},"discussion_someone":{"message":"Alguém"},"discussion_markRead":{"message":"Marcar como lida"},"discussion_markAllRead":{"message":"Marcar todas como lidas"},"discussion_view":{"message":"Ver discussão"},"discussion_signedOutInbox":{"message":"Entre para ver respostas e curtidas nos seus comentários."},"discussion_discussionTab":{"message":"Discussão"},"discussion_nickname":{"message":"Apelido"},"discussion_reportStatus":{"message":"Status da denúncia"},"discussion_openReports":{"message":"Denúncias abertas"},"discussion_resolvedReports":{"message":"Denúncias rejeitadas"},"discussion_author":{"message":"Autor"},"discussion_saving":{"message":"Salvando…"},"discussion_loadReplies":{"message":"Mostrar respostas ($1)"},"discussion_reactionConsentRequired":{"message":"Ative o compartilhamento de votos para reagir a comentários. Sua reação será enviada assim que ele for ativado."},"discussion_consentContinue":{"message":"Continuar"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/ru/messages.json
const ru_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Дизлайки остаются бесплатными для всех. Платные дополнения помогают оплачивать серверы, на которых они работают: более 15 ТБ данных и около 20 миллионов пользователей в день, а бюджет — несколько сотен долларов в месяц."},"discussion_title":{"message":"Комментарии RYD"},"discussion_subtitle":{"message":"Обсуждение сообщества Return YouTube Dislike."},"discussion_independent":{"message":"Эти комментарии не связаны с комментариями YouTube."},"discussion_open":{"message":"Открыть комментарии RYD"},"discussion_close":{"message":"Закрыть"},"discussion_new":{"message":"Сначала новые"},"discussion_top":{"message":"Популярные"},"discussion_sort":{"message":"Сортировка комментариев"},"discussion_refresh":{"message":"Обновить"},"discussion_loading":{"message":"Загрузка комментариев…"},"discussion_empty":{"message":"Комментариев пока нет. Начните обсуждение."},"discussion_comment":{"message":"Комментарий"},"discussion_post":{"message":"Отправить"},"discussion_reply":{"message":"Ответить"},"discussion_postReply":{"message":"Отправить ответ"},"discussion_cancel":{"message":"Отмена"},"discussion_save":{"message":"Сохранить"},"discussion_edit":{"message":"Изменить"},"discussion_delete":{"message":"Удалить"},"discussion_deleteConfirm":{"message":"Удалить этот комментарий?"},"discussion_deleted":{"message":"Комментарий удалён"},"discussion_edited":{"message":"изменён"},"discussion_replies":{"message":"Ответы ($1)"},"discussion_more":{"message":"Показать ещё"},"discussion_like":{"message":"Нравится"},"discussion_dislike":{"message":"Не нравится"},"discussion_signInRequired":{"message":"Чтобы продолжить, войдите в аккаунт через меню расширения."},"discussion_tierRequired":{"message":"Писать могут участники с активным уровнем Commenter и выше."},"discussion_join":{"message":"Стать участником Commenter"},"discussion_gate":{"message":"Читать и оценивать могут все. Писать могут участники с активным уровнем Commenter и выше."},"discussion_nicknameRequired":{"message":"Перед отправкой выберите публичный псевдоним RYD."},"discussion_nicknameLabel":{"message":"Публичный псевдоним RYD"},"discussion_nicknameHint":{"message":"От 3 до 32 букв, цифр, пробелов, точек, дефисов или знаков подчёркивания. Это имя будет видно рядом с вашими комментариями."},"discussion_nicknameSave":{"message":"Сохранить псевдоним"},"discussion_nicknameTaken":{"message":"Этот псевдоним уже занят. Выберите другой."},"discussion_nicknameInvalid":{"message":"Используйте от 3 до 32 букв, цифр, пробелов, точек, дефисов или знаков подчёркивания."},"discussion_nicknameChange":{"message":"Изменить псевдоним"},"discussion_as":{"message":"Вы пишете как $1"},"discussion_placeholder":{"message":"Добавьте комментарий…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Пожаловаться"},"discussion_reportTitle":{"message":"Жалоба на комментарий"},"discussion_reportReason":{"message":"Причина"},"discussion_reportSpam":{"message":"Спам"},"discussion_reportAbuse":{"message":"Оскорбления или ненависть"},"discussion_reportOther":{"message":"Другое"},"discussion_reportDetails":{"message":"Дополнительные сведения (необязательно)"},"discussion_reportSend":{"message":"Отправить жалобу"},"discussion_reportDone":{"message":"Жалоба отправлена. Спасибо."},"discussion_moderation":{"message":"Модерация"},"discussion_queueEmpty":{"message":"Новых жалоб нет."},"discussion_hide":{"message":"Скрыть комментарий"},"discussion_restore":{"message":"Восстановить комментарий"},"discussion_dismiss":{"message":"Отклонить жалобы"},"discussion_ban":{"message":"Заблокировать автора"},"discussion_unban":{"message":"Разблокировать автора"},"discussion_moderationReason":{"message":"Причина модерации"},"discussion_unavailable":{"message":"Комментарии RYD недоступны для этого видео."},"discussion_commentUnavailable":{"message":"Этот комментарий больше недоступен."},"discussion_error":{"message":"Не удалось подключиться. Попробуйте ещё раз."},"discussion_rateLimited":{"message":"Немного подождите и попробуйте снова."},"discussion_conflict":{"message":"Комментарий изменился. Обновите страницу и попробуйте снова."},"discussion_forbidden":{"message":"Это действие недоступно для вашего аккаунта."},"discussion_retry":{"message":"Повторить"},"discussion_notifications":{"message":"Уведомления"},"discussion_notificationEmpty":{"message":"Новых уведомлений нет."},"discussion_notificationReply":{"message":"$1 ответил(а) на ваш комментарий"},"discussion_notificationLike":{"message":"Кому-то понравился ваш комментарий"},"discussion_notificationLikes":{"message":"Новых лайков у вашего комментария: $1"},"discussion_someone":{"message":"Кто-то"},"discussion_markRead":{"message":"Отметить прочитанным"},"discussion_markAllRead":{"message":"Прочитать все"},"discussion_view":{"message":"Открыть обсуждение"},"discussion_signedOutInbox":{"message":"Войдите, чтобы видеть ответы и лайки на ваши комментарии."},"discussion_discussionTab":{"message":"Обсуждение"},"discussion_nickname":{"message":"Псевдоним"},"discussion_reportStatus":{"message":"Статус жалоб"},"discussion_openReports":{"message":"Открытые жалобы"},"discussion_resolvedReports":{"message":"Закрытые жалобы"},"discussion_author":{"message":"Автор"},"discussion_saving":{"message":"Сохранение…"},"discussion_loadReplies":{"message":"Показать ответы ($1)"},"discussion_reactionConsentRequired":{"message":"Включите отправку оценок, чтобы реагировать на комментарии. Ваша реакция будет отправлена, как только она будет включена."},"discussion_consentContinue":{"message":"Продолжить"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/sl/messages.json
const sl_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Število nevšečkov ostaja brezplačno za vse. Plačljivi dodatki pomagajo plačevati strežnike, ki ga omogočajo: več kot 15 TB podatkov in približno 20 milijonov uporabnikov na dan ob proračunu nekaj sto dolarjev na mesec."},"discussion_title":{"message":"Komentarji RYD"},"discussion_subtitle":{"message":"Razprava skupnosti, ki jo gosti Return YouTube Dislike."},"discussion_independent":{"message":"Ti komentarji so ločeni od YouTuba."},"discussion_open":{"message":"Odpri komentarje RYD"},"discussion_close":{"message":"Zapri"},"discussion_new":{"message":"Najnovejši"},"discussion_top":{"message":"Najboljši"},"discussion_sort":{"message":"Razvrsti komentarje"},"discussion_refresh":{"message":"Osveži"},"discussion_loading":{"message":"Nalaganje komentarjev…"},"discussion_empty":{"message":"Komentarjev še ni. Začnite pogovor."},"discussion_comment":{"message":"Komentar"},"discussion_post":{"message":"Objavi komentar"},"discussion_reply":{"message":"Odgovori"},"discussion_postReply":{"message":"Objavi odgovor"},"discussion_cancel":{"message":"Prekliči"},"discussion_save":{"message":"Shrani"},"discussion_edit":{"message":"Uredi"},"discussion_delete":{"message":"Izbriši"},"discussion_deleteConfirm":{"message":"Želite izbrisati ta komentar?"},"discussion_deleted":{"message":"Komentar je izbrisan"},"discussion_edited":{"message":"urejeno"},"discussion_replies":{"message":"Odgovori ($1)"},"discussion_more":{"message":"Naloži več"},"discussion_like":{"message":"Všeč mi je"},"discussion_dislike":{"message":"Ni mi všeč"},"discussion_signInRequired":{"message":"Za nadaljevanje se prijavite v pojavnem oknu razširitve."},"discussion_tierRequired":{"message":"Objavljanje je na voljo članom z aktivnim članstvom na stopnji Commenter ali višji."},"discussion_join":{"message":"Pridobite članstvo Commenter"},"discussion_gate":{"message":"Vsi lahko berejo in se odzivajo. Člani z aktivnim članstvom na stopnji Commenter ali višji lahko objavljajo."},"discussion_nicknameRequired":{"message":"Pred objavo izberite svoj javni vzdevek RYD."},"discussion_nicknameLabel":{"message":"Javni vzdevek RYD"},"discussion_nicknameHint":{"message":"3–32 črk, številk, presledkov, pik, vezajev ali podčrtajev. To ime bo prikazano ob vaših komentarjih."},"discussion_nicknameSave":{"message":"Shrani vzdevek"},"discussion_nicknameTaken":{"message":"Ta vzdevek je že zaseden. Izberite drugega."},"discussion_nicknameInvalid":{"message":"Uporabite 3–32 črk, številk, presledkov, pik, vezajev ali podčrtajev."},"discussion_nicknameChange":{"message":"Spremeni vzdevek"},"discussion_as":{"message":"Komentirate kot $1"},"discussion_placeholder":{"message":"Pridružite se razpravi…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Prijavi"},"discussion_reportTitle":{"message":"Prijavi komentar"},"discussion_reportReason":{"message":"Razlog"},"discussion_reportSpam":{"message":"Neželena vsebina"},"discussion_reportAbuse":{"message":"Nadlegovanje ali sovraštvo"},"discussion_reportOther":{"message":"Drugo"},"discussion_reportDetails":{"message":"Dodatne podrobnosti (neobvezno)"},"discussion_reportSend":{"message":"Pošlji prijavo"},"discussion_reportDone":{"message":"Prijava je prejeta. Hvala."},"discussion_moderation":{"message":"Moderiranje"},"discussion_queueEmpty":{"message":"Ni prijav za pregled."},"discussion_hide":{"message":"Skrij komentar"},"discussion_restore":{"message":"Obnovi komentar"},"discussion_dismiss":{"message":"Zavrni prijave"},"discussion_ban":{"message":"Blokiraj avtorja"},"discussion_unban":{"message":"Odblokiraj avtorja"},"discussion_moderationReason":{"message":"Razlog moderiranja"},"discussion_unavailable":{"message":"Komentarji RYD za ta videoposnetek niso na voljo."},"discussion_commentUnavailable":{"message":"Ta komentar ni več na voljo."},"discussion_error":{"message":"Povezave ni bilo mogoče vzpostaviti. Poskusite znova."},"discussion_rateLimited":{"message":"Pred ponovnim poskusom malo počakajte."},"discussion_conflict":{"message":"Ta komentar je bil spremenjen. Osvežite in poskusite znova."},"discussion_forbidden":{"message":"To dejanje za vaš račun ni na voljo."},"discussion_retry":{"message":"Poskusi znova"},"discussion_notifications":{"message":"Obvestila"},"discussion_notificationEmpty":{"message":"Prebrali ste vsa obvestila."},"discussion_notificationReply":{"message":"$1 odgovarja na vaš komentar"},"discussion_notificationLike":{"message":"Nekomu je bil všeč vaš komentar"},"discussion_notificationLikes":{"message":"Vaš komentar ima toliko všečkov: $1"},"discussion_someone":{"message":"Nekdo"},"discussion_markRead":{"message":"Označi kot prebrano"},"discussion_markAllRead":{"message":"Označi vse kot prebrano"},"discussion_view":{"message":"Ogled razprave"},"discussion_signedOutInbox":{"message":"Prijavite se za ogled odgovorov in všečkov na svojih komentarjih."},"discussion_discussionTab":{"message":"Razprava"},"discussion_nickname":{"message":"Vzdevek"},"discussion_reportStatus":{"message":"Stanje prijave"},"discussion_openReports":{"message":"Odprte prijave"},"discussion_resolvedReports":{"message":"Zavrnjene prijave"},"discussion_author":{"message":"Avtor"},"discussion_saving":{"message":"Shranjevanje…"},"discussion_loadReplies":{"message":"Prikaži odgovore ($1)"},"discussion_reactionConsentRequired":{"message":"Vklopite deljenje glasov, da se boste lahko odzivali na komentarje. Vaš odziv bo poslan, ko bo deljenje vklopljeno."},"discussion_consentContinue":{"message":"Nadaljuj"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/sv_SE/messages.json
const sv_SE_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Antalet ogilla-markeringar förblir gratis för alla. Betalda extrafunktioner hjälper till att betala servrarna bakom dem: över 15 TB data och omkring 20 miljoner användare per dag, med en budget på några hundra dollar i månaden."},"discussion_title":{"message":"RYD-kommentarer"},"discussion_subtitle":{"message":"En diskussion för communityn som tillhandahålls av Return YouTube Dislike."},"discussion_independent":{"message":"Dessa kommentarer är fristående från YouTube."},"discussion_open":{"message":"Öppna RYD-kommentarer"},"discussion_close":{"message":"Stäng"},"discussion_new":{"message":"Senaste"},"discussion_top":{"message":"Populäraste"},"discussion_sort":{"message":"Sortera kommentarer"},"discussion_refresh":{"message":"Uppdatera"},"discussion_loading":{"message":"Läser in kommentarer…"},"discussion_empty":{"message":"Inga kommentarer ännu. Starta diskussionen."},"discussion_comment":{"message":"Kommentar"},"discussion_post":{"message":"Publicera kommentar"},"discussion_reply":{"message":"Svara"},"discussion_postReply":{"message":"Publicera svar"},"discussion_cancel":{"message":"Avbryt"},"discussion_save":{"message":"Spara"},"discussion_edit":{"message":"Redigera"},"discussion_delete":{"message":"Ta bort"},"discussion_deleteConfirm":{"message":"Vill du ta bort den här kommentaren?"},"discussion_deleted":{"message":"Kommentaren har tagits bort"},"discussion_edited":{"message":"redigerad"},"discussion_replies":{"message":"Svar ($1)"},"discussion_more":{"message":"Läs in fler"},"discussion_like":{"message":"Gilla"},"discussion_dislike":{"message":"Ogilla"},"discussion_signInRequired":{"message":"Logga in via tilläggets popupfönster för att fortsätta."},"discussion_tierRequired":{"message":"Aktiva medlemmar på nivån Commenter och högre kan publicera kommentarer."},"discussion_join":{"message":"Bli Commenter-medlem"},"discussion_gate":{"message":"Alla kan läsa och reagera. Aktiva medlemmar på nivån Commenter och högre kan publicera kommentarer."},"discussion_nicknameRequired":{"message":"Välj ditt offentliga RYD-smeknamn innan du publicerar."},"discussion_nicknameLabel":{"message":"Offentligt RYD-smeknamn"},"discussion_nicknameHint":{"message":"3–32 bokstäver, siffror, mellanslag, punkter, bindestreck eller understreck. Det här namnet visas vid dina kommentarer."},"discussion_nicknameSave":{"message":"Spara smeknamn"},"discussion_nicknameTaken":{"message":"Det här smeknamnet är redan upptaget. Välj ett annat."},"discussion_nicknameInvalid":{"message":"Använd 3–32 bokstäver, siffror, mellanslag, punkter, bindestreck eller understreck."},"discussion_nicknameChange":{"message":"Ändra smeknamn"},"discussion_as":{"message":"Kommenterar som $1"},"discussion_placeholder":{"message":"Delta i diskussionen…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Rapportera"},"discussion_reportTitle":{"message":"Rapportera kommentar"},"discussion_reportReason":{"message":"Orsak"},"discussion_reportSpam":{"message":"Skräppost"},"discussion_reportAbuse":{"message":"Trakasserier eller hat"},"discussion_reportOther":{"message":"Annat"},"discussion_reportDetails":{"message":"Ytterligare information (valfritt)"},"discussion_reportSend":{"message":"Skicka rapport"},"discussion_reportDone":{"message":"Rapporten har tagits emot. Tack."},"discussion_moderation":{"message":"Moderering"},"discussion_queueEmpty":{"message":"Inga rapporter att granska."},"discussion_hide":{"message":"Dölj kommentar"},"discussion_restore":{"message":"Återställ kommentar"},"discussion_dismiss":{"message":"Avfärda rapporter"},"discussion_ban":{"message":"Stäng av författaren"},"discussion_unban":{"message":"Häv författarens avstängning"},"discussion_moderationReason":{"message":"Orsak till moderering"},"discussion_unavailable":{"message":"RYD-kommentarer är inte tillgängliga för den här videon."},"discussion_commentUnavailable":{"message":"Den här kommentaren är inte längre tillgänglig."},"discussion_error":{"message":"Det gick inte att ansluta. Försök igen."},"discussion_rateLimited":{"message":"Vänta en stund innan du försöker igen."},"discussion_conflict":{"message":"Den här kommentaren har ändrats. Uppdatera och försök igen."},"discussion_forbidden":{"message":"Den här åtgärden är inte tillgänglig för ditt konto."},"discussion_retry":{"message":"Försök igen"},"discussion_notifications":{"message":"Aviseringar"},"discussion_notificationEmpty":{"message":"Du har sett allt nytt."},"discussion_notificationReply":{"message":"$1 svarade på din kommentar"},"discussion_notificationLike":{"message":"Någon gillade din kommentar"},"discussion_notificationLikes":{"message":"Din kommentar fick $1 gilla-markeringar"},"discussion_someone":{"message":"Någon"},"discussion_markRead":{"message":"Markera som läst"},"discussion_markAllRead":{"message":"Markera alla som lästa"},"discussion_view":{"message":"Visa diskussion"},"discussion_signedOutInbox":{"message":"Logga in för att se svar och gilla-markeringar på dina kommentarer."},"discussion_discussionTab":{"message":"Diskussion"},"discussion_nickname":{"message":"Smeknamn"},"discussion_reportStatus":{"message":"Rapportstatus"},"discussion_openReports":{"message":"Öppna rapporter"},"discussion_resolvedReports":{"message":"Avfärdade rapporter"},"discussion_author":{"message":"Författare"},"discussion_saving":{"message":"Sparar…"},"discussion_loadReplies":{"message":"Visa svar ($1)"},"discussion_reactionConsentRequired":{"message":"Aktivera röstdelning för att reagera på kommentarer. Din reaktion skickas när den har aktiverats."},"discussion_consentContinue":{"message":"Fortsätt"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/tr/messages.json
const tr_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Beğenmeme sayıları herkes için ücretsiz kalmaya devam ediyor. Ücretli ekstralar, bunları sağlayan sunucuların masraflarını karşılamaya yardımcı oluyor: 15 TB\'tan fazla veri ve günde yaklaşık 20 milyon kullanıcı, ayda birkaç yüz dolarlık bir bütçeyle."},"discussion_title":{"message":"RYD yorumları"},"discussion_subtitle":{"message":"Return YouTube Dislike tarafından barındırılan bir topluluk tartışması."},"discussion_independent":{"message":"Bu yorumlar YouTube yorumlarından ayrıdır."},"discussion_open":{"message":"RYD yorumlarını aç"},"discussion_close":{"message":"Kapat"},"discussion_new":{"message":"En yeni"},"discussion_top":{"message":"En popüler"},"discussion_sort":{"message":"Yorumları sırala"},"discussion_refresh":{"message":"Yenile"},"discussion_loading":{"message":"Yorumlar yükleniyor…"},"discussion_empty":{"message":"Henüz yorum yok. Sohbeti başlatın."},"discussion_comment":{"message":"Yorum"},"discussion_post":{"message":"Yorum gönder"},"discussion_reply":{"message":"Yanıtla"},"discussion_postReply":{"message":"Yanıt gönder"},"discussion_cancel":{"message":"İptal"},"discussion_save":{"message":"Kaydet"},"discussion_edit":{"message":"Düzenle"},"discussion_delete":{"message":"Sil"},"discussion_deleteConfirm":{"message":"Bu yorum silinsin mi?"},"discussion_deleted":{"message":"Yorum silindi"},"discussion_edited":{"message":"düzenlendi"},"discussion_replies":{"message":"Yanıtlar ($1)"},"discussion_more":{"message":"Daha fazla yükle"},"discussion_like":{"message":"Beğen"},"discussion_dislike":{"message":"Beğenme"},"discussion_signInRequired":{"message":"Devam etmek için uzantının açılır penceresinden giriş yapın."},"discussion_tierRequired":{"message":"Yorum gönderme, aktif Commenter ve üzeri seviyelerdeki üyelere açıktır."},"discussion_join":{"message":"Commenter üyesi olun"},"discussion_gate":{"message":"Herkes okuyabilir ve tepki verebilir. Aktif Commenter ve üzeri seviyelerdeki üyeler yorum gönderebilir."},"discussion_nicknameRequired":{"message":"Yorum göndermeden önce herkese açık RYD takma adınızı seçin."},"discussion_nicknameLabel":{"message":"Herkese açık RYD takma adı"},"discussion_nicknameHint":{"message":"3–32 harf, rakam, boşluk, nokta, kısa çizgi veya alt çizgi. Bu ad yorumlarınızla birlikte görünecektir."},"discussion_nicknameSave":{"message":"Takma adı kaydet"},"discussion_nicknameTaken":{"message":"Bu takma ad zaten kullanılıyor. Başka bir takma ad seçin."},"discussion_nicknameInvalid":{"message":"3–32 harf, rakam, boşluk, nokta, kısa çizgi veya alt çizgi kullanın."},"discussion_nicknameChange":{"message":"Takma adı değiştir"},"discussion_as":{"message":"$1 olarak yorum yapıyorsunuz"},"discussion_placeholder":{"message":"Tartışmaya katılın…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Şikayet et"},"discussion_reportTitle":{"message":"Yorumu şikayet et"},"discussion_reportReason":{"message":"Neden"},"discussion_reportSpam":{"message":"Spam"},"discussion_reportAbuse":{"message":"Taciz veya nefret"},"discussion_reportOther":{"message":"Diğer"},"discussion_reportDetails":{"message":"Ek ayrıntılar (isteğe bağlı)"},"discussion_reportSend":{"message":"Şikayeti gönder"},"discussion_reportDone":{"message":"Şikayet alındı. Teşekkür ederiz."},"discussion_moderation":{"message":"Moderasyon"},"discussion_queueEmpty":{"message":"İncelenecek şikayet yok."},"discussion_hide":{"message":"Yorumu gizle"},"discussion_restore":{"message":"Yorumu geri yükle"},"discussion_dismiss":{"message":"Şikayetleri reddet"},"discussion_ban":{"message":"Yazarı yasakla"},"discussion_unban":{"message":"Yazarın yasağını kaldır"},"discussion_moderationReason":{"message":"Moderasyon nedeni"},"discussion_unavailable":{"message":"Bu video için RYD yorumları kullanılamıyor."},"discussion_commentUnavailable":{"message":"Bu yorum artık kullanılamıyor."},"discussion_error":{"message":"Bağlantı kurulamadı. Lütfen tekrar deneyin."},"discussion_rateLimited":{"message":"Tekrar denemeden önce lütfen biraz bekleyin."},"discussion_conflict":{"message":"Bu yorum değişti. Yenileyip tekrar deneyin."},"discussion_forbidden":{"message":"Bu işlem hesabınız için kullanılamıyor."},"discussion_retry":{"message":"Tekrar dene"},"discussion_notifications":{"message":"Bildirimler"},"discussion_notificationEmpty":{"message":"Tüm yeni bildirimleri gördünüz."},"discussion_notificationReply":{"message":"$1 yorumunuza yanıt verdi"},"discussion_notificationLike":{"message":"Birisi yorumunuzu beğendi"},"discussion_notificationLikes":{"message":"Yorumunuz $1 beğeni aldı"},"discussion_someone":{"message":"Birisi"},"discussion_markRead":{"message":"Okundu olarak işaretle"},"discussion_markAllRead":{"message":"Tümünü okundu olarak işaretle"},"discussion_view":{"message":"Tartışmayı görüntüle"},"discussion_signedOutInbox":{"message":"Yorumlarınıza gelen yanıtları ve beğenileri görmek için giriş yapın."},"discussion_discussionTab":{"message":"Tartışma"},"discussion_nickname":{"message":"Takma ad"},"discussion_reportStatus":{"message":"Şikayet durumu"},"discussion_openReports":{"message":"Açık şikayetler"},"discussion_resolvedReports":{"message":"Reddedilen şikayetler"},"discussion_author":{"message":"Yazar"},"discussion_saving":{"message":"Kaydediliyor…"},"discussion_loadReplies":{"message":"Yanıtları göster ($1)"},"discussion_reactionConsentRequired":{"message":"Yorumlara tepki vermek için oy paylaşımını açın. Tepkiniz açıldığında gönderilir."},"discussion_consentContinue":{"message":"Devam et"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/uk/messages.json
const uk_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Кількість невподобань залишається безкоштовною для всіх. Платні доповнення допомагають оплачувати сервери, на яких вона працює: понад 15 ТБ даних і близько 20 мільйонів користувачів на день, а бюджет — кілька сотень доларів на місяць."},"discussion_title":{"message":"Коментарі RYD"},"discussion_subtitle":{"message":"Обговорення спільноти на платформі Return YouTube Dislike."},"discussion_independent":{"message":"Ці коментарі не пов’язані з YouTube."},"discussion_open":{"message":"Відкрити коментарі RYD"},"discussion_close":{"message":"Закрити"},"discussion_new":{"message":"Найновіші"},"discussion_top":{"message":"Найкращі"},"discussion_sort":{"message":"Сортувати коментарі"},"discussion_refresh":{"message":"Оновити"},"discussion_loading":{"message":"Завантаження коментарів…"},"discussion_empty":{"message":"Коментарів поки немає. Розпочніть розмову."},"discussion_comment":{"message":"Коментар"},"discussion_post":{"message":"Опублікувати коментар"},"discussion_reply":{"message":"Відповісти"},"discussion_postReply":{"message":"Опублікувати відповідь"},"discussion_cancel":{"message":"Скасувати"},"discussion_save":{"message":"Зберегти"},"discussion_edit":{"message":"Редагувати"},"discussion_delete":{"message":"Видалити"},"discussion_deleteConfirm":{"message":"Видалити цей коментар?"},"discussion_deleted":{"message":"Коментар видалено"},"discussion_edited":{"message":"відредаговано"},"discussion_replies":{"message":"Відповіді ($1)"},"discussion_more":{"message":"Завантажити ще"},"discussion_like":{"message":"Подобається"},"discussion_dislike":{"message":"Не подобається"},"discussion_signInRequired":{"message":"Щоб продовжити, увійдіть через спливне вікно розширення."},"discussion_tierRequired":{"message":"Публікація доступна учасникам з активною підпискою рівня Commenter або вище."},"discussion_join":{"message":"Стати учасником рівня Commenter"},"discussion_gate":{"message":"Усі можуть читати й реагувати. Учасники з активною підпискою рівня Commenter або вище можуть публікувати коментарі."},"discussion_nicknameRequired":{"message":"Перед публікацією виберіть свій публічний псевдонім RYD."},"discussion_nicknameLabel":{"message":"Публічний псевдонім RYD"},"discussion_nicknameHint":{"message":"3–32 літери, цифри, пробіли, крапки, дефіси або знаки підкреслення. Це ім’я відображатиметься біля ваших коментарів."},"discussion_nicknameSave":{"message":"Зберегти псевдонім"},"discussion_nicknameTaken":{"message":"Цей псевдонім уже зайнятий. Виберіть інший."},"discussion_nicknameInvalid":{"message":"Використовуйте 3–32 літери, цифри, пробіли, крапки, дефіси або знаки підкреслення."},"discussion_nicknameChange":{"message":"Змінити псевдонім"},"discussion_as":{"message":"Ви коментуєте як $1"},"discussion_placeholder":{"message":"Долучайтеся до обговорення…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Поскаржитися"},"discussion_reportTitle":{"message":"Поскаржитися на коментар"},"discussion_reportReason":{"message":"Причина"},"discussion_reportSpam":{"message":"Спам"},"discussion_reportAbuse":{"message":"Переслідування або ненависть"},"discussion_reportOther":{"message":"Інше"},"discussion_reportDetails":{"message":"Додаткові відомості (необов’язково)"},"discussion_reportSend":{"message":"Надіслати скаргу"},"discussion_reportDone":{"message":"Скаргу отримано. Дякуємо."},"discussion_moderation":{"message":"Модерація"},"discussion_queueEmpty":{"message":"Немає скарг для розгляду."},"discussion_hide":{"message":"Приховати коментар"},"discussion_restore":{"message":"Відновити коментар"},"discussion_dismiss":{"message":"Відхилити скарги"},"discussion_ban":{"message":"Заблокувати автора"},"discussion_unban":{"message":"Розблокувати автора"},"discussion_moderationReason":{"message":"Причина модерації"},"discussion_unavailable":{"message":"Коментарі RYD недоступні для цього відео."},"discussion_commentUnavailable":{"message":"Цей коментар більше недоступний."},"discussion_error":{"message":"Не вдалося під’єднатися. Спробуйте ще раз."},"discussion_rateLimited":{"message":"Зачекайте трохи перед наступною спробою."},"discussion_conflict":{"message":"Цей коментар змінився. Оновіть і спробуйте ще раз."},"discussion_forbidden":{"message":"Ця дія недоступна для вашого облікового запису."},"discussion_retry":{"message":"Спробувати ще раз"},"discussion_notifications":{"message":"Сповіщення"},"discussion_notificationEmpty":{"message":"Усі сповіщення прочитано."},"discussion_notificationReply":{"message":"$1 відповідає на ваш коментар"},"discussion_notificationLike":{"message":"Комусь сподобався ваш коментар"},"discussion_notificationLikes":{"message":"Кількість уподобань вашого коментаря: $1"},"discussion_someone":{"message":"Хтось"},"discussion_markRead":{"message":"Позначити як прочитане"},"discussion_markAllRead":{"message":"Позначити все як прочитане"},"discussion_view":{"message":"Переглянути обговорення"},"discussion_signedOutInbox":{"message":"Увійдіть, щоб бачити відповіді й уподобання ваших коментарів."},"discussion_discussionTab":{"message":"Обговорення"},"discussion_nickname":{"message":"Псевдонім"},"discussion_reportStatus":{"message":"Статус скарги"},"discussion_openReports":{"message":"Відкриті скарги"},"discussion_resolvedReports":{"message":"Відхилені скарги"},"discussion_author":{"message":"Автор"},"discussion_saving":{"message":"Збереження…"},"discussion_loadReplies":{"message":"Показати відповіді ($1)"},"discussion_reactionConsentRequired":{"message":"Увімкніть передавання оцінок, щоб реагувати на коментарі. Вашу реакцію буде надіслано, щойно його буде ввімкнено."},"discussion_consentContinue":{"message":"Продовжити"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/vi/messages.json
const vi_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"Số lượt không thích vẫn miễn phí cho mọi người. Các tính năng trả phí giúp chi trả cho máy chủ vận hành nó: hơn 15 TB dữ liệu và khoảng 20 triệu người dùng mỗi ngày, với ngân sách vài trăm đô la mỗi tháng."},"discussion_title":{"message":"Bình luận RYD"},"discussion_subtitle":{"message":"Cuộc thảo luận cộng đồng do Return YouTube Dislike tổ chức."},"discussion_independent":{"message":"Những bình luận này tách biệt với YouTube."},"discussion_open":{"message":"Mở bình luận RYD"},"discussion_close":{"message":"Đóng"},"discussion_new":{"message":"Mới nhất"},"discussion_top":{"message":"Hàng đầu"},"discussion_sort":{"message":"Sắp xếp bình luận"},"discussion_refresh":{"message":"Làm mới"},"discussion_loading":{"message":"Đang tải bình luận…"},"discussion_empty":{"message":"Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện."},"discussion_comment":{"message":"Bình luận"},"discussion_post":{"message":"Đăng bình luận"},"discussion_reply":{"message":"Phản hồi"},"discussion_postReply":{"message":"Đăng phản hồi"},"discussion_cancel":{"message":"Hủy"},"discussion_save":{"message":"Lưu"},"discussion_edit":{"message":"Chỉnh sửa"},"discussion_delete":{"message":"Xóa"},"discussion_deleteConfirm":{"message":"Xóa bình luận này?"},"discussion_deleted":{"message":"Bình luận đã bị xóa"},"discussion_edited":{"message":"đã chỉnh sửa"},"discussion_replies":{"message":"Phản hồi ($1)"},"discussion_more":{"message":"Tải thêm"},"discussion_like":{"message":"Thích"},"discussion_dislike":{"message":"Không thích"},"discussion_signInRequired":{"message":"Đăng nhập từ cửa sổ bật lên của tiện ích mở rộng để tiếp tục."},"discussion_tierRequired":{"message":"Thành viên đang hoạt động ở cấp Commenter trở lên có thể đăng bài."},"discussion_join":{"message":"Trở thành thành viên Commenter"},"discussion_gate":{"message":"Mọi người đều có thể đọc và bày tỏ cảm xúc. Thành viên đang hoạt động ở cấp Commenter trở lên có thể đăng bài."},"discussion_nicknameRequired":{"message":"Chọn biệt danh RYD công khai trước khi đăng bài."},"discussion_nicknameLabel":{"message":"Biệt danh RYD công khai"},"discussion_nicknameHint":{"message":"3–32 ký tự gồm chữ cái, chữ số, dấu cách, dấu chấm, dấu gạch ngang hoặc dấu gạch dưới. Tên này sẽ hiển thị cùng bình luận của bạn."},"discussion_nicknameSave":{"message":"Lưu biệt danh"},"discussion_nicknameTaken":{"message":"Biệt danh này đã được sử dụng. Hãy chọn biệt danh khác."},"discussion_nicknameInvalid":{"message":"Dùng 3–32 ký tự gồm chữ cái, chữ số, dấu cách, dấu chấm, dấu gạch ngang hoặc dấu gạch dưới."},"discussion_nicknameChange":{"message":"Đổi biệt danh"},"discussion_as":{"message":"Bình luận với tên $1"},"discussion_placeholder":{"message":"Tham gia thảo luận…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"Báo cáo"},"discussion_reportTitle":{"message":"Báo cáo bình luận"},"discussion_reportReason":{"message":"Lý do"},"discussion_reportSpam":{"message":"Nội dung rác"},"discussion_reportAbuse":{"message":"Quấy rối hoặc thù ghét"},"discussion_reportOther":{"message":"Khác"},"discussion_reportDetails":{"message":"Thông tin bổ sung (không bắt buộc)"},"discussion_reportSend":{"message":"Gửi báo cáo"},"discussion_reportDone":{"message":"Đã nhận được báo cáo. Cảm ơn bạn."},"discussion_moderation":{"message":"Kiểm duyệt"},"discussion_queueEmpty":{"message":"Không có báo cáo nào cần xem xét."},"discussion_hide":{"message":"Ẩn bình luận"},"discussion_restore":{"message":"Khôi phục bình luận"},"discussion_dismiss":{"message":"Bác bỏ báo cáo"},"discussion_ban":{"message":"Cấm tác giả"},"discussion_unban":{"message":"Bỏ cấm tác giả"},"discussion_moderationReason":{"message":"Lý do kiểm duyệt"},"discussion_unavailable":{"message":"Bình luận RYD không khả dụng cho video này."},"discussion_commentUnavailable":{"message":"Bình luận này không còn khả dụng."},"discussion_error":{"message":"Không thể kết nối. Vui lòng thử lại."},"discussion_rateLimited":{"message":"Vui lòng đợi một lát trước khi thử lại."},"discussion_conflict":{"message":"Bình luận này đã thay đổi. Hãy làm mới và thử lại."},"discussion_forbidden":{"message":"Tài khoản của bạn không thể thực hiện thao tác này."},"discussion_retry":{"message":"Thử lại"},"discussion_notifications":{"message":"Thông báo"},"discussion_notificationEmpty":{"message":"Bạn đã xem hết thông báo."},"discussion_notificationReply":{"message":"$1 đã phản hồi bình luận của bạn"},"discussion_notificationLike":{"message":"Có người đã thích bình luận của bạn"},"discussion_notificationLikes":{"message":"Bình luận của bạn nhận được $1 lượt thích"},"discussion_someone":{"message":"Ai đó"},"discussion_markRead":{"message":"Đánh dấu đã đọc"},"discussion_markAllRead":{"message":"Đánh dấu tất cả đã đọc"},"discussion_view":{"message":"Xem thảo luận"},"discussion_signedOutInbox":{"message":"Đăng nhập để xem phản hồi và lượt thích cho bình luận của bạn."},"discussion_discussionTab":{"message":"Thảo luận"},"discussion_nickname":{"message":"Biệt danh"},"discussion_reportStatus":{"message":"Trạng thái báo cáo"},"discussion_openReports":{"message":"Báo cáo chưa xử lý"},"discussion_resolvedReports":{"message":"Báo cáo đã bác bỏ"},"discussion_author":{"message":"Tác giả"},"discussion_saving":{"message":"Đang lưu…"},"discussion_loadReplies":{"message":"Hiện phản hồi ($1)"},"discussion_reactionConsentRequired":{"message":"Hãy bật chia sẻ lượt bình chọn để phản ứng với bình luận. Phản ứng của bạn sẽ được gửi khi tính năng này được bật."},"discussion_consentContinue":{"message":"Tiếp tục"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/zh_CN/messages.json
const zh_CN_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"点踩数将继续免费向所有人开放。付费功能帮助支付背后的服务器费用：超过 15 TB 的数据、每天约 2000 万用户，而每月预算只有几百美元。"},"discussion_title":{"message":"RYD 评论"},"discussion_subtitle":{"message":"由 Return YouTube Dislike 提供的社区讨论。"},"discussion_independent":{"message":"这些评论独立于 YouTube。"},"discussion_open":{"message":"打开 RYD 评论"},"discussion_close":{"message":"关闭"},"discussion_new":{"message":"最新"},"discussion_top":{"message":"热门"},"discussion_sort":{"message":"评论排序"},"discussion_refresh":{"message":"刷新"},"discussion_loading":{"message":"正在加载评论…"},"discussion_empty":{"message":"还没有评论。来开启讨论吧。"},"discussion_comment":{"message":"评论"},"discussion_post":{"message":"发表评论"},"discussion_reply":{"message":"回复"},"discussion_postReply":{"message":"发布回复"},"discussion_cancel":{"message":"取消"},"discussion_save":{"message":"保存"},"discussion_edit":{"message":"编辑"},"discussion_delete":{"message":"删除"},"discussion_deleteConfirm":{"message":"删除这条评论？"},"discussion_deleted":{"message":"评论已删除"},"discussion_edited":{"message":"已编辑"},"discussion_replies":{"message":"回复（$1）"},"discussion_more":{"message":"加载更多"},"discussion_like":{"message":"点赞"},"discussion_dislike":{"message":"点踩"},"discussion_signInRequired":{"message":"请在扩展弹出窗口中登录以继续。"},"discussion_tierRequired":{"message":"有效的 Commenter 及以上等级会员可以发言。"},"discussion_join":{"message":"成为 Commenter 会员"},"discussion_gate":{"message":"所有人都可以阅读和回应。有效的 Commenter 及以上等级会员可以发言。"},"discussion_nicknameRequired":{"message":"发言前请设置您的 RYD 公开昵称。"},"discussion_nicknameLabel":{"message":"RYD 公开昵称"},"discussion_nicknameHint":{"message":"可使用 3–32 个字母、数字、空格、句点、连字符或下划线。此昵称将随您的评论一起显示。"},"discussion_nicknameSave":{"message":"保存昵称"},"discussion_nicknameTaken":{"message":"此昵称已被使用。请选择其他昵称。"},"discussion_nicknameInvalid":{"message":"请使用 3–32 个字母、数字、空格、句点、连字符或下划线。"},"discussion_nicknameChange":{"message":"更改昵称"},"discussion_as":{"message":"以 $1 的身份评论"},"discussion_placeholder":{"message":"参与讨论…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"举报"},"discussion_reportTitle":{"message":"举报评论"},"discussion_reportReason":{"message":"原因"},"discussion_reportSpam":{"message":"垃圾信息"},"discussion_reportAbuse":{"message":"骚扰或仇恨"},"discussion_reportOther":{"message":"其他"},"discussion_reportDetails":{"message":"补充详情（可选）"},"discussion_reportSend":{"message":"提交举报"},"discussion_reportDone":{"message":"举报已收到。谢谢。"},"discussion_moderation":{"message":"内容管理"},"discussion_queueEmpty":{"message":"没有待审核的举报。"},"discussion_hide":{"message":"隐藏评论"},"discussion_restore":{"message":"恢复评论"},"discussion_dismiss":{"message":"驳回举报"},"discussion_ban":{"message":"封禁作者"},"discussion_unban":{"message":"解封作者"},"discussion_moderationReason":{"message":"管理操作原因"},"discussion_unavailable":{"message":"此视频无法使用 RYD 评论。"},"discussion_commentUnavailable":{"message":"此评论已不可用。"},"discussion_error":{"message":"无法连接。请重试。"},"discussion_rateLimited":{"message":"请稍等片刻后重试。"},"discussion_conflict":{"message":"此评论已被更改。请刷新后重试。"},"discussion_forbidden":{"message":"您的账户无法执行此操作。"},"discussion_retry":{"message":"重试"},"discussion_notifications":{"message":"通知"},"discussion_notificationEmpty":{"message":"您已查看所有通知。"},"discussion_notificationReply":{"message":"$1 回复了您的评论"},"discussion_notificationLike":{"message":"有人赞了您的评论"},"discussion_notificationLikes":{"message":"您的评论收到了 $1 个赞"},"discussion_someone":{"message":"有人"},"discussion_markRead":{"message":"标为已读"},"discussion_markAllRead":{"message":"全部标为已读"},"discussion_view":{"message":"查看讨论"},"discussion_signedOutInbox":{"message":"登录后可查看您评论收到的回复和赞。"},"discussion_discussionTab":{"message":"讨论"},"discussion_nickname":{"message":"昵称"},"discussion_reportStatus":{"message":"举报状态"},"discussion_openReports":{"message":"待处理举报"},"discussion_resolvedReports":{"message":"已驳回的举报"},"discussion_author":{"message":"作者"},"discussion_saving":{"message":"正在保存…"},"discussion_loadReplies":{"message":"显示回复（$1）"},"discussion_reactionConsentRequired":{"message":"请开启评价分享以回应评论。开启后，您的回应将会发送。"},"discussion_consentContinue":{"message":"继续"}}');
;// CONCATENATED MODULE: ./Extensions/combined/_locales/zh_TW/messages.json
const zh_TW_messages_namespaceObject = JSON.parse('{"paidFeaturesWhy":{"message":"不喜歡次數將持續免費提供給所有人。付費功能幫助支付背後的伺服器費用：超過 15 TB 的資料、每天約 2,000 萬名使用者，而每月預算只有幾百美元。"},"discussion_title":{"message":"RYD 留言"},"discussion_subtitle":{"message":"由 Return YouTube Dislike 提供的社群討論。"},"discussion_independent":{"message":"這些留言獨立於 YouTube。"},"discussion_open":{"message":"開啟 RYD 留言"},"discussion_close":{"message":"關閉"},"discussion_new":{"message":"最新"},"discussion_top":{"message":"熱門"},"discussion_sort":{"message":"留言排序"},"discussion_refresh":{"message":"重新整理"},"discussion_loading":{"message":"正在載入留言…"},"discussion_empty":{"message":"還沒有留言。來開啟討論吧。"},"discussion_comment":{"message":"留言"},"discussion_post":{"message":"發布留言"},"discussion_reply":{"message":"回覆"},"discussion_postReply":{"message":"發布回覆"},"discussion_cancel":{"message":"取消"},"discussion_save":{"message":"儲存"},"discussion_edit":{"message":"編輯"},"discussion_delete":{"message":"刪除"},"discussion_deleteConfirm":{"message":"要刪除此留言嗎？"},"discussion_deleted":{"message":"留言已刪除"},"discussion_edited":{"message":"已編輯"},"discussion_replies":{"message":"回覆（$1）"},"discussion_more":{"message":"載入更多"},"discussion_like":{"message":"按讚"},"discussion_dislike":{"message":"不喜歡"},"discussion_signInRequired":{"message":"請從擴充功能的彈出視窗登入以繼續。"},"discussion_tierRequired":{"message":"有效的 Commenter 及以上等級會員可以發言。"},"discussion_join":{"message":"成為 Commenter 會員"},"discussion_gate":{"message":"所有人都可以閱讀和表達反應。有效的 Commenter 及以上等級會員可以發言。"},"discussion_nicknameRequired":{"message":"發言前請設定您的 RYD 公開暱稱。"},"discussion_nicknameLabel":{"message":"RYD 公開暱稱"},"discussion_nicknameHint":{"message":"可使用 3–32 個字母、數字、空格、句點、連字號或底線。此暱稱會與您的留言一起顯示。"},"discussion_nicknameSave":{"message":"儲存暱稱"},"discussion_nicknameTaken":{"message":"此暱稱已被使用。請選擇其他暱稱。"},"discussion_nicknameInvalid":{"message":"請使用 3–32 個字母、數字、空格、句點、連字號或底線。"},"discussion_nicknameChange":{"message":"變更暱稱"},"discussion_as":{"message":"以 $1 的身分留言"},"discussion_placeholder":{"message":"參與討論…"},"discussion_characters":{"message":"$1 / $2"},"discussion_report":{"message":"檢舉"},"discussion_reportTitle":{"message":"檢舉留言"},"discussion_reportReason":{"message":"原因"},"discussion_reportSpam":{"message":"垃圾訊息"},"discussion_reportAbuse":{"message":"騷擾或仇恨"},"discussion_reportOther":{"message":"其他"},"discussion_reportDetails":{"message":"補充詳情（選填）"},"discussion_reportSend":{"message":"送出檢舉"},"discussion_reportDone":{"message":"已收到檢舉，謝謝。"},"discussion_moderation":{"message":"內容管理"},"discussion_queueEmpty":{"message":"沒有待審核的檢舉。"},"discussion_hide":{"message":"隱藏留言"},"discussion_restore":{"message":"還原留言"},"discussion_dismiss":{"message":"駁回檢舉"},"discussion_ban":{"message":"封鎖作者"},"discussion_unban":{"message":"解除封鎖作者"},"discussion_moderationReason":{"message":"管理操作原因"},"discussion_unavailable":{"message":"此影片無法使用 RYD 留言。"},"discussion_commentUnavailable":{"message":"此留言已無法查看。"},"discussion_error":{"message":"無法連線。請再試一次。"},"discussion_rateLimited":{"message":"請稍候再試。"},"discussion_conflict":{"message":"此留言已被變更。請重新整理後再試。"},"discussion_forbidden":{"message":"您的帳戶無法執行此操作。"},"discussion_retry":{"message":"再試一次"},"discussion_notifications":{"message":"通知"},"discussion_notificationEmpty":{"message":"您已查看所有通知。"},"discussion_notificationReply":{"message":"$1 回覆了您的留言"},"discussion_notificationLike":{"message":"有人對您的留言按讚"},"discussion_notificationLikes":{"message":"您的留言獲得了 $1 個讚"},"discussion_someone":{"message":"有人"},"discussion_markRead":{"message":"標示為已讀"},"discussion_markAllRead":{"message":"全部標示為已讀"},"discussion_view":{"message":"查看討論"},"discussion_signedOutInbox":{"message":"登入後即可查看您留言收到的回覆與讚。"},"discussion_discussionTab":{"message":"討論"},"discussion_nickname":{"message":"暱稱"},"discussion_reportStatus":{"message":"檢舉狀態"},"discussion_openReports":{"message":"待處理檢舉"},"discussion_resolvedReports":{"message":"已駁回的檢舉"},"discussion_author":{"message":"作者"},"discussion_saving":{"message":"正在儲存…"},"discussion_loadReplies":{"message":"顯示回覆（$1）"},"discussion_reactionConsentRequired":{"message":"請開啟評價分享以對留言做出反應。開啟後，您的反應將會傳送。"},"discussion_consentContinue":{"message":"繼續"}}');
;// CONCATENATED MODULE: ./Extensions/combined/src/discussion/localize.js


























const catalogs = {
  az: messages_namespaceObject,
  be: be_messages_namespaceObject,
  cs: cs_messages_namespaceObject,
  de: de_messages_namespaceObject,
  el: el_messages_namespaceObject,
  en: en_messages_namespaceObject,
  es: es_messages_namespaceObject,
  fa: fa_messages_namespaceObject,
  fr: fr_messages_namespaceObject,
  hu: hu_messages_namespaceObject,
  id: id_messages_namespaceObject,
  it: it_messages_namespaceObject,
  ja: ja_messages_namespaceObject,
  ko: ko_messages_namespaceObject,
  nl: nl_messages_namespaceObject,
  pl: pl_messages_namespaceObject,
  "pt-BR": pt_BR_messages_namespaceObject,
  ru: ru_messages_namespaceObject,
  sl: sl_messages_namespaceObject,
  "sv-SE": sv_SE_messages_namespaceObject,
  tr: tr_messages_namespaceObject,
  uk: uk_messages_namespaceObject,
  vi: vi_messages_namespaceObject,
  "zh-CN": zh_CN_messages_namespaceObject,
  "zh-TW": zh_TW_messages_namespaceObject,
};

function discussionLanguage(language = document.documentElement.lang || navigator.language) {
  if (typeof language !== "string") return "en";
  try {
    const locale = new Intl.Locale(language.trim().replace(/_/g, "-"));
    if (locale.language === "zh") {
      if (locale.script === "Hans") return "zh-CN";
      if (locale.script === "Hant" || ["TW", "HK", "MO"].includes(locale.region)) return "zh-TW";
      return "zh-CN";
    }
    if (locale.language === "pt") return "pt-BR";
    if (locale.language === "sv") return "sv-SE";
    return catalogs[locale.language] ? locale.language : "en";
  } catch {
    return "en";
  }
}

function catalogMessage(name, language) {
  return catalogs[discussionLanguage(language)][name]?.message || en_messages_namespaceObject[name]?.message;
}

function discussionText(key, substitutions = [], language) {
  const text = catalogMessage(`discussion_${key}`, language) || key;
  return text.replace(/\$(\d+)/g, (_, number) => String(substitutions[Number(number) - 1] ?? ""));
}

function extensionText(name, language) {
  return catalogMessage(name, language) || name;
}

function discussionError(error) {
  const keys = {
    nickname_required: "nicknameRequired",
    nickname_taken: "nicknameTaken",
    invalid_nickname: "nicknameInvalid",
    membership_tier_insufficient: "tierRequired",
    membership_inactive: "tierRequired",
    invalid_session: "signInRequired",
    session_upgrade_required: "signInRequired",
    unauthorized: "signInRequired",
    comments_not_allowed: "unavailable",
    comments_disabled_required: "unavailable",
    video_not_eligible: "unavailable",
    comment_not_found: "commentUnavailable",
    not_found: "commentUnavailable",
    rate_limited: "rateLimited",
    conflict: "conflict",
    forbidden: "forbidden",
  };
  const statusKey =
    error?.status === 401
      ? "signInRequired"
      : error?.status === 403
        ? "forbidden"
        : error?.status === 429
          ? "rateLimited"
          : "error";
  return discussionText(keys[error?.code] || statusKey);
}

;// CONCATENATED MODULE: ./Extensions/combined/src/discussion/dom.js
function dom_element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function dom_button(text, onClick, className = "ryd-discussion-button") {
  const node = dom_element("button", className, text);
  node.type = "button";
  if (onClick) node.addEventListener("click", onClick);
  return node;
}

function statusNode() {
  const node = dom_element("p", "ryd-discussion-status");
  node.setAttribute("role", "status");
  node.setAttribute("aria-live", "polite");
  return node;
}

function isDiscussionCommentId(value) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value || "");
}

function discussionLinkTarget(value = location.href) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "www.youtube.com") return null;
    const videoId =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : /^\/shorts\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
    const commentId = new URLSearchParams(url.hash.slice(1)).get("rydComment") || url.searchParams.get("rydComment");
    return /^[A-Za-z0-9_-]{11}$/.test(videoId || "") && isDiscussionCommentId(commentId)
      ? { videoId, commentId }
      : null;
  } catch {
    return null;
  }
}

function dom_threadUrl(notification) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(notification?.videoId || "") || !isDiscussionCommentId(notification?.commentId))
    return null;
  const url = new URL("https://www.youtube.com/watch");
  url.searchParams.set("v", notification.videoId);
  url.hash = new URLSearchParams({ rydComment: notification.commentId }).toString();
  return url.href;
}

function shortDate(value, language) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" });
}

function thumbIcon(dislike = false) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("ryd-discussion-thumb");
  if (dislike) icon.classList.add("is-down");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M7 10v12H2V10h5Zm2 12V10l5-8 1.1.4c.9.4 1.4 1.4 1.2 2.4L15.5 9H20a2 2 0 0 1 2 2v2l-3 9H9ZM3.5 11.5v9H5.5v-9h-2Zm7 9h7.4l2.6-7.7V11a.5.5 0 0 0-.5-.5h-6.3l1.1-6a.8.8 0 0 0-.2-.6L10.5 10.4v10.1Z",
  );
  icon.append(path);
  return icon;
}

;// CONCATENATED MODULE: ./Extensions/combined/src/discussion/inbox.js




function notificationText(notification) {
  return notification.type === "reply"
    ? discussionText("notificationReply", [notification.actorNickname || discussionText("someone")])
    : notification.likeCount > 1
      ? discussionText("notificationLikes", [notification.likeCount])
      : discussionText("notificationLike");
}

function notificationsLabel(unreadCount) {
  return `${discussionText("notifications")}${unreadCount ? ` (${unreadCount})` : ""}`;
}

function createDiscussionInbox({
  request = client_requestDiscussion,
  authenticated = true,
  onUnreadCount = () => {},
} = {}) {
  const node = dom_element("section", "ryd-discussion-inbox");
  const heading = dom_element("div", "ryd-discussion-toolbar");
  heading.append(dom_element("h3", "ryd-discussion-subtitle", discussionText("notifications")));
  const readAll = dom_button(discussionText("markAllRead"), async () => {
    readAll.disabled = true;
    try {
      await read({ all: true });
      await load();
    } catch (error) {
      status.textContent = discussionError(error);
    } finally {
      readAll.disabled = false;
    }
  });
  heading.append(readAll);
  const list = dom_element("div", "ryd-discussion-inbox-list");
  const status = statusNode();
  const more = dom_button(discussionText("more"), () => load(true));
  more.hidden = true;
  node.append(heading, status, list, more);
  let items = [];
  let cursor = null;
  let disposed = false;
  let generation = 0;
  let hasPage = false;
  let accountId = null;

  function render() {
    list.replaceChildren();
    readAll.hidden = !authenticated || !items.some((item) => !item.read);
    if (!authenticated) {
      status.textContent = discussionText("signedOutInbox");
      more.hidden = true;
      return;
    }
    status.textContent = items.length ? "" : discussionText("notificationEmpty");
    for (const item of items) {
      const row = dom_element("article", `ryd-discussion-notification${item.read ? "" : " is-unread"}`);
      row.dataset.notificationId = item.id;
      const link = dom_element("a", "ryd-discussion-notification-link", notificationText(item));
      const url = dom_threadUrl(item);
      if (url) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.addEventListener("click", () => {
          read({ ids: [item.id] })
            .then(() => {
              item.read = true;
              render();
            })
            .catch(() => {});
        });
      }
      const date = dom_element("time", "ryd-discussion-meta", shortDate(item.createdAt, discussionLanguage()));
      date.dateTime = item.createdAt;
      row.append(link, date);
      if (!item.read)
        row.append(
          dom_button(discussionText("markRead"), async (event) => {
            event.currentTarget.disabled = true;
            try {
              await read({ ids: [item.id] });
              item.read = true;
              render();
            } catch (error) {
              status.textContent = discussionError(error);
              event.target.disabled = false;
            }
          }),
        );
      list.append(row);
    }
    more.hidden = !cursor;
  }

  async function read(payload) {
    const current = generation;
    const result = await request("readNotifications", payload);
    if (!disposed && current === generation) onUnreadCount(result?.unreadCount);
  }

  async function load(append = false) {
    if (disposed || !authenticated) {
      render();
      return;
    }
    const current = ++generation;
    status.textContent = discussionText("loading");
    more.disabled = true;
    try {
      const result = await request("notifications", append && cursor ? { cursor } : {});
      if (disposed || current !== generation) return;
      const combined = append ? [...items, ...(result.items || [])] : result.items || [];
      items = [...new Map(combined.map((item) => [item.id, item])).values()];
      cursor = result.nextCursor;
      hasPage = true;
      onUnreadCount(result.unreadCount);
      render();
    } catch (error) {
      if (!disposed && current === generation) status.textContent = discussionError(error);
    } finally {
      more.disabled = false;
    }
  }

  return {
    node,
    load,
    setSession(session) {
      authenticated = session?.authenticated === true;
      const nextId = authenticated ? session.profile?.id || null : null;
      generation++;
      if (!authenticated || nextId !== accountId) {
        items = [];
        cursor = null;
        hasPage = false;
      }
      accountId = nextId;
      if (!authenticated) onUnreadCount(0);
      render();
    },
    update(inbox, { live = false } = {}) {
      if (disposed || !authenticated) return;
      generation++;
      if (live) {
        items = [...new Map([...items, ...(inbox?.items || [])].map((item) => [item.id, item])).values()].sort((a, b) =>
          String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)),
        );
      } else {
        items = inbox?.items || [];
      }
      if (!live || !hasPage) cursor = inbox?.nextCursor;
      hasPage = true;
      onUnreadCount(inbox?.unreadCount);
      render();
    },
    destroy() {
      disposed = true;
      generation++;
      node.remove();
    },
  };
}

function showDiscussionToast(notification) {
  document.querySelector(".ryd-discussion-toast")?.remove();
  const toast = element("aside", "ryd-discussion-toast");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  const copy = element("div");
  copy.append(element("strong", "", t("title")), element("p", "", notificationText(notification)));
  const url = threadUrl(notification);
  if (url) {
    const link = element("a", "ryd-discussion-button", t("view"));
    link.href = url;
    link.dataset.notificationId = notification.id;
    link.addEventListener("click", () =>
      requestDiscussion("readNotifications", { ids: [notification.id] }).catch(() => {}),
    );
    copy.append(link);
  }
  toast.append(
    copy,
    button("×", () => toast.remove(), "ryd-discussion-close"),
  );
  toast.lastChild.setAttribute("aria-label", t("close"));
  document.body.append(toast);
  setTimeout(() => toast.remove(), 10000);
}

;// CONCATENATED MODULE: ./Extensions/combined/src/discussion/popup.js






function initDiscussionPopup() {
  if (private_browsing_isPrivateBrowsingContext()) return;
  const root = document.getElementById("ryd-discussion-popup");
  if (!root) return;
  if (!document.documentElement.lang && chrome.i18n?.getUILanguage)
    document.documentElement.lang = chrome.i18n.getUILanguage();
  const toggle = document.getElementById("ryd-discussion-inbox-toggle");
  const inbox = createDiscussionInbox({
    authenticated: false,
    onUnreadCount: (count) => {
      toggle.textContent = notificationsLabel(count);
    },
  });
  const back = dom_button("←", () => setInboxOpen(false), "ryd-discussion-inbox-back");
  back.setAttribute("aria-label", discussionText("close"));
  const brand = dom_element("div", "ryd-discussion-inbox-brand");
  brand.append(back, dom_element("span", "", document.querySelector("h1")?.textContent));
  root.append(brand, inbox.node);
  root.hidden = true;
  root.inert = true;
  let open = false;
  let background = [];
  let homeScroll = [0, 0];

  function setInboxOpen(next) {
    if (next === open) return;
    if (next) homeScroll = [window.scrollX, window.scrollY];
    open = next;
    root.hidden = !open;
    root.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("ryd-discussion-inbox-open", open);
    if (open) {
      background = Array.from(document.body.children)
        .filter((node) => node !== root && !["SCRIPT", "STYLE", "LINK"].includes(node.tagName))
        .map((node) => ({ node, hidden: node.hidden, inert: node.inert }));
      for (const { node } of background) {
        node.hidden = true;
        node.inert = true;
      }
      back.focus({ preventScroll: true });
      void inbox.load();
    } else {
      for (const { node, hidden, inert } of background) {
        node.hidden = hidden;
        node.inert = inert;
      }
      background = [];
      toggle.focus({ preventScroll: true });
      window.scrollTo(...homeScroll);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setInboxOpen(false);
    }
  }

  toggle.textContent = discussionText("notifications");
  toggle.addEventListener("click", () => setInboxOpen(!open));
  document.addEventListener("keydown", onKeyDown);
  let generation = 0;
  const unsubscribe = subscribeDiscussionEvents((event) => {
    if (event.type === "session") {
      generation++;
      inbox.setSession(event.data);
    }
    if (event.type === "inbox") inbox.update(event.data, { live: true });
  });
  const initial = generation;
  client_requestDiscussion("session")
    .then((session) => {
      if (initial !== generation) return;
      inbox.setSession(session);
      if (session.authenticated)
        client_requestDiscussion("notifications")
          .then((value) => {
            if (initial !== generation) return;
            inbox.update(value);
          })
          .catch(() => {});
    })
    .catch(() => {});
  window.addEventListener(
    "unload",
    () => {
      document.removeEventListener("keydown", onKeyDown);
      inbox.destroy();
      unsubscribe();
    },
    { once: true },
  );
  return { close: () => setInboxOpen(false) };
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



;// CONCATENATED MODULE: ./Extensions/combined/src/account-data-consent.js


function fetchWithAccountConsent(input, options = {}, fetchImpl = globalThis.fetch) {
  if (!usesFirefoxDataCollectionConsent()) return fetchImpl(input, options);
  return (async () => {
    const controller = new AbortController();
    const abortForCaller = () => controller.abort(options.signal.reason);
    const messages = consentApi()?.runtime?.onMessage;
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



;// CONCATENATED MODULE: ./Extensions/combined/src/toolbar-popup.js
function isToolbarPopup() {
  try {
    return browser.extension?.getViews?.({ type: "popup" }).includes(window) === true;
  } catch (_) {
    return false;
  }
}

function closeToolbarPopup() {
  if (isToolbarPopup()) window.close();
}

function openPopupPageInTab(targetId) {
  return browser.tabs.create({ url: `${browser.runtime.getURL("popup.html")}#${targetId}`, active: true });
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



;// CONCATENATED MODULE: ./Extensions/combined/src/counts-consent-popup.js






const REQUESTED_FEATURE = "voteOptIn";

function initCountsConsentPopup({ beforeShow = () => {} } = {}) {
  if (!usesFirefoxDataCollectionConsent() || private_browsing_isPrivateBrowsingContext()) return;
  const section = document.getElementById("ryd-counts-consent");
  if (!section) return;
  const allow = document.getElementById("ryd-counts-consent-allow");
  const dismiss = document.getElementById("ryd-counts-consent-dismiss");
  const status = document.getElementById("ryd-counts-consent-status");
  const message = (key) => consentApi().i18n.getMessage(key);
  renderDataPermissionList(document.getElementById("ryd-counts-consent-permissions"), REQUESTED_FEATURE, message);
  let revision = 0;
  let dismissed = false;
  let pending = false;

  function show(visible) {
    if (visible) beforeShow();
    section.hidden = !visible;
    document.body.classList.toggle("ryd-counts-consent-open", visible);
  }

  async function refresh() {
    const current = ++revision;
    const granted = await hasFeaturePermission("counts");
    if (current !== revision || pending || dismissed) return;
    show(!granted);
  }

  allow.addEventListener("click", () => {
    if (pending) return;
    pending = true;
    revision++;
    const request = requestFeaturePermission(REQUESTED_FEATURE);
    withdrawVoteSubmissionIntent();
    allow.disabled = true;
    dismiss.disabled = true;
    status.textContent = message("consent_prompt_status");
    closeToolbarPopup();
    void (async () => {
      try {
        const granted = await request;
        status.textContent = message(granted ? "counts_consent_enabled" : "counts_consent_declined");
      } catch (_) {
        status.textContent = message("consent_error_status");
      } finally {
        pending = false;
        allow.disabled = false;
        dismiss.disabled = false;
        await refresh();
      }
    })();
  });
  dismiss.addEventListener("click", () => {
    dismissed = true;
    revision++;
    show(false);
  });
  const unsubscribe = onDataPermissionsChanged(({ added, removed }) => {
    if (![...added, ...removed].includes("browsingActivity")) return;
    if (removed.includes("browsingActivity")) dismissed = false;
    void refresh();
  });
  window.addEventListener("unload", unsubscribe, { once: true });
  void refresh();
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



;// CONCATENATED MODULE: ./Extensions/combined/src/vote-status-popup.js






function initVoteStatusPopup() {
  if (private_browsing_isPrivateBrowsingContext()) return;
  const section = document.getElementById("ryd-vote-status");
  if (!section) return;
  const action = document.getElementById("ryd-vote-status-action");
  const status = document.getElementById("ryd-vote-status-result");
  const message = (key) => chrome.i18n.getMessage(key);
  let revision = 0;
  let pending = false;
  let submissionDisabled = false;
  let granted = true;

  async function refresh() {
    const current = ++revision;
    const [disabled, allowed] = await Promise.all([readVoteSubmissionDisabled(), hasFeaturePermission("voting")]);
    if (current !== revision || pending) return;
    submissionDisabled = disabled;
    granted = allowed;
    section.hidden = votesCounted({ granted, submissionDisabled });
  }

  action.addEventListener("click", () => {
    if (pending) return;
    if (granted) {
      allowVoteSubmission();
      return;
    }
    pending = true;
    revision++;
    const request = requestFeaturePermission("voteOptIn");
    const switchIntent = submissionDisabled;
    if (switchIntent) rememberVoteSubmissionIntent();
    action.disabled = true;
    status.textContent = message("consent_prompt_status");
    closeToolbarPopup();
    void (async () => {
      try {
        const allowed = await request;
        if (!allowed && switchIntent) withdrawVoteSubmissionIntent();
        status.textContent = allowed ? "" : message("consent_declined_status");
      } finally {
        pending = false;
        action.disabled = false;
        await refresh();
      }
    })();
  });

  const unsubscribeSetting = onVoteSubmissionSettingChanged(() => void refresh());
  const unsubscribePermissions = onDataPermissionsChanged(({ added, removed }) => {
    if ([...added, ...removed].some((category) => FEATURE_DATA_PERMISSIONS.voting.includes(category))) void refresh();
  });
  window.addEventListener(
    "unload",
    () => {
      unsubscribePermissions();
      unsubscribeSetting();
    },
    { once: true },
  );
  void refresh();
}



;// CONCATENATED MODULE: ./Extensions/common/color-themes.js
const DEFAULT_CUSTOM_COLORS = Object.freeze({
  light: Object.freeze({ like: "#007600", dislike: "#b300b3" }),
  dark: Object.freeze({ like: "#00d000", dislike: "#ff77ff" }),
});

function normalizeCustomColors(value) {
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

function getThemeColor(themeName, voteIsLike, isDark = false, customColors) {
  const vote = voteIsLike ? "like" : "dislike";
  const theme = isDark ? "dark" : "light";
  switch (themeName) {
    case "custom":
      return normalizeCustomColors(customColors)[theme][vote];
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

function isYouTubeDarkTheme(ownerDocument = document) {
  return ownerDocument.documentElement.hasAttribute("dark");
}

function observeYouTubeTheme(onChange, ownerDocument = document) {
  let isDark = isYouTubeDarkTheme(ownerDocument);
  const observer = new MutationObserver(() => {
    const nextIsDark = isYouTubeDarkTheme(ownerDocument);
    if (nextIsDark === isDark) return;
    isDark = nextIsDark;
    onChange(isDark);
  });
  observer.observe(ownerDocument.documentElement, { attributes: true, attributeFilter: ["dark"] });
  return observer;
}



;// CONCATENATED MODULE: ./Extensions/combined/src/data-collection-permissions.js


const AUTHENTICATION_DATA_PERMISSION = "authenticationInfo";
const hasAuthenticationDataPermission = (options) => hasFeaturePermission("account", options);

function onAuthenticationDataPermissionRemoved(listener) {
  return onDataPermissionsChanged(({ removed }) => {
    if (removed.includes(AUTHENTICATION_DATA_PERMISSION)) listener();
  });
}



;// CONCATENATED MODULE: ./Extensions/combined/popup.js













/*   Config   */
const popup_config = {
  advanced: false,
  disableVoteSubmission: false,
  disableLogging: true,
  coloredThumbs: false,
  coloredBar: false,
  colorTheme: "classic",
  customColors: normalizeCustomColors(DEFAULT_CUSTOM_COLORS),
  numberDisplayFormat: "compactShort",
  showTooltipPercentage: false,
  tooltipPercentageMode: "dash_like",
  numberDisplayReformatLikes: false,
  hidePremiumTeaser: false,
  hideRydComments: false,
  hideClutterButtons: false,
  showAdvancedMessage:
    '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><rect fill="none" height="24" width="24"/><path d="M19.5,12c0-0.23-0.01-0.45-0.03-0.68l1.86-1.41c0.4-0.3,0.51-0.86,0.26-1.3l-1.87-3.23c-0.25-0.44-0.79-0.62-1.25-0.42 l-2.15,0.91c-0.37-0.26-0.76-0.49-1.17-0.68l-0.29-2.31C14.8,2.38,14.37,2,13.87,2h-3.73C9.63,2,9.2,2.38,9.14,2.88L8.85,5.19 c-0.41,0.19-0.8,0.42-1.17,0.68L5.53,4.96c-0.46-0.2-1-0.02-1.25,0.42L2.41,8.62c-0.25,0.44-0.14,0.99,0.26,1.3l1.86,1.41 C4.51,11.55,4.5,11.77,4.5,12s0.01,0.45,0.03,0.68l-1.86,1.41c-0.4,0.3-0.51,0.86-0.26,1.3l1.87,3.23c0.25,0.44,0.79,0.62,1.25,0.42 l2.15-0.91c0.37,0.26,0.76,0.49,1.17,0.68l0.29,2.31C9.2,21.62,9.63,22,10.13,22h3.73c0.5,0,0.93-0.38,0.99-0.88l0.29-2.31 c0.41-0.19,0.8-0.42,1.17-0.68l2.15,0.91c0.46,0.2,1,0.02,1.25-0.42l1.87-3.23c0.25-0.44,0.14-0.99-0.26-1.3l-1.86-1.41 C19.49,12.45,19.5,12.23,19.5,12z M12.04,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.97,15.5,12.04,15.5z"/></svg>',
  hideAdvancedMessage:
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none" opacity=".87"/><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm4.3 14.3c-.39.39-1.02.39-1.41 0L12 13.41 9.11 16.3c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41L10.59 12 7.7 9.11c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L12 10.59l2.89-2.89c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L13.41 12l2.89 2.89c.38.38.38 1.02 0 1.41z"/></svg>',
  links: config.links,
};
let colorThemeRevision = 0;
let customColorsRevision = 0;
let customColorsReady = false;

/*   Change language   */
function localizeHtmlPage() {
  const locale = chrome.i18n.getMessage("@@ui_locale");
  if (locale) document.documentElement.lang = locale.replaceAll("_", "-");
  const direction = chrome.i18n.getMessage("@@bidi_dir");
  if (direction === "rtl" || direction === "ltr") document.documentElement.dir = direction;
  localizePage((key) => chrome.i18n.getMessage(key));
}

localizeHtmlPage();
const privateBrowsing = private_browsing_isPrivateBrowsingContext();
const firefoxDataConsent = usesFirefoxDataCollectionConsent();
if (privateBrowsing) {
  const home = document.createElement("main");
  const header = document.createElement("header");
  const message = document.createElement("p");
  header.className = "popup-header";
  message.id = "ryd-private-counts-message";
  message.textContent = chrome.i18n.getMessage("consent_private_counts");
  header.append(
    document.querySelector(".popup-header .popup-logo").cloneNode(true),
    document.querySelector(".popup-header h1").cloneNode(true),
  );
  home.append(header, message);
  document.body.replaceChildren(home);
  if (firefoxDataConsent) {
    void hasFeaturePermission("counts").then((granted) => {
      if (!granted) message.textContent = chrome.i18n.getMessage("counts_consent_private");
    });
  }
} else {
  const discussionPopup = initDiscussionPopup();
  initCountsConsentPopup({ beforeShow: () => discussionPopup?.close() });
  initVoteStatusPopup();

  /*   Links   */
  createLink(popup_config.links.website, "link_website");
  createLink(popup_config.links.github, "link_github");
  createLink(popup_config.links.discord, "link_discord");
  createLink(popup_config.links.faq, "link_faq");
  createLink(popup_config.links.donate, "link_donate");
  createLink(popup_config.links.help, "link_help");
  createLink(popup_config.links.changelog, "link_changelog");
}

function createLink(url, id) {
  document.getElementById(id).addEventListener("click", () => {
    chrome.tabs.create({ url: url });
  });
}

if (!privateBrowsing) {
  document.getElementById("disable_vote_submission").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ disableVoteSubmission: ev.target.checked });
  });

  document.getElementById("disable_logging").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ disableLogging: ev.target.checked });
  });

  document.getElementById("colored_thumbs").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ coloredThumbs: ev.target.checked });
  });

  document.getElementById("colored_bar").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ coloredBar: ev.target.checked });
  });

  document.getElementById("color_theme").addEventListener("change", (ev) => {
    colorThemeRevision++;
    handleColorThemeChangeEvent(ev.target.value);
    chrome.storage.sync.set({ colorTheme: ev.target.value });
  });

  for (const mode of ["light", "dark"]) {
    for (const vote of ["like", "dislike"]) {
      const input = document.getElementById(`custom_color_${mode}_${vote}`);
      input.addEventListener("input", () => {
        if (!customColorsReady) return;
        customColorsRevision++;
        const colors = normalizeCustomColors(popup_config.customColors);
        colors[mode][vote] = input.value;
        handleCustomColorsChangeEvent(colors);
      });
      input.addEventListener("change", () => {
        if (!customColorsReady) return;
        const colors = normalizeCustomColors(popup_config.customColors);
        colors[mode][vote] = input.value;
        customColorsRevision++;
        handleCustomColorsChangeEvent(colors);
        chrome.storage.sync.set({ customColors: colors });
      });
    }
  }

  document.getElementById("number_format").addEventListener("change", (ev) => {
    chrome.storage.sync.set({ numberDisplayFormat: ev.target.value });
  });

  document.getElementById("show_tooltip_percentage").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ showTooltipPercentage: ev.target.checked });
  });

  document.getElementById("tooltip_percentage_mode").addEventListener("change", (ev) => {
    chrome.storage.sync.set({ tooltipPercentageMode: ev.target.value });
  });

  document.getElementById("number_reformat_likes").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ numberDisplayReformatLikes: ev.target.checked });
  });

  document.getElementById("hide_premium_teaser").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ hidePremiumTeaser: ev.target.checked });
  });

  document.getElementById("hide_ryd_comments").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ hideRydComments: ev.target.checked });
  });

  document.getElementById("hide_clutter_buttons").addEventListener("click", (ev) => {
    chrome.storage.sync.set({ hideClutterButtons: ev.target.checked });
  });
}

function initPatreonAuth() {
  const loggedOutView = document.getElementById("patreon-logged-out");
  const loggedInView = document.getElementById("patreon-logged-in");
  const loginBtn = document.getElementById("patreon-login-btn");
  const githubLoginBtn = document.getElementById("github-login-btn");
  const logoutBtn = document.getElementById("patreon-logout-btn");
  const userAvatar = document.getElementById("patreon-user-avatar");
  const userName = document.getElementById("patreon-user-name");
  const userTier = document.getElementById("patreon-tier");
  let authenticationGeneration = 0;
  let accountReadGeneration = 0;
  let openingPermissionPage = false;
  function refreshAccountView() {
    const initialGeneration = authenticationGeneration;
    const readGeneration = ++accountReadGeneration;
    const isCurrent = () => initialGeneration === authenticationGeneration && readGeneration === accountReadGeneration;
    chrome.storage.sync.get(["patreonUser", "patreonSessionToken"], async (data) => {
      if (!isCurrent()) return;
      const cachedUser = data.patreonUser;
      const sessionToken = data.patreonSessionToken;

      if (sessionToken && cachedUser) {
        const granted = await hasAuthenticationDataPermission();
        if (!isCurrent()) return;
        if (!granted) {
          showLoggedOutView();
          return;
        }

        // Show cached state immediately to avoid flicker on popup reopen.
        showLoggedInView(cachedUser);

        verifySession(sessionToken, initialGeneration).then(async (result) => {
          if (!isCurrent()) return;
          const stillGranted = await hasAuthenticationDataPermission();
          if (!isCurrent() || !stillGranted) return;
          if (result.status === "valid") {
            if (result.membershipTier && result.membershipTier !== cachedUser.membershipTier) {
              const updatedUser = { ...cachedUser, membershipTier: result.membershipTier, hasActiveMembership: true };
              showLoggedInView(updatedUser);
              chrome.storage.sync.set({ patreonUser: updatedUser });
            } else if (cachedUser.hasActiveMembership !== true) {
              const updatedUser = { ...cachedUser, hasActiveMembership: true };
              showLoggedInView(updatedUser);
              chrome.storage.sync.set({ patreonUser: updatedUser });
            }
          } else if (result.status === "inactive") {
            const updatedUser = {
              ...cachedUser,
              hasActiveMembership: false,
              membershipTier: result.membershipTier || cachedUser.membershipTier || "none",
            };
            showLoggedInView(updatedUser);
            chrome.storage.sync.set({ patreonUser: updatedUser });
          } else if (result.status === "error") {
            console.warn("Patreon session verification skipped:", result.reason || "network_error");
          } else {
            showLoggedOutView();
            chrome.storage.sync.remove(["patreonUser", "patreonSessionToken"]);
          }
        });
      } else {
        showLoggedOutView();
      }
    });
  }
  refreshAccountView();

  function showLoggedOutView() {
    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";
    userAvatar.removeAttribute("src");
    userAvatar.style.display = "none";
    userName.textContent = "";
    userTier.textContent = "";
    updateHidePremiumSettingLabel();
    document.getElementById("signin-next-click").hidden =
      !firefoxDataConsent || !["#patreon-login-btn", "#github-login-btn"].includes(window.location.hash);
    if (window.location.hash === "#patreon-login-btn") loginBtn.focus();
    if (window.location.hash === "#github-login-btn") githubLoginBtn?.focus();
  }

  function showLoggedInView(user) {
    document.getElementById("signin-next-click").hidden = true;
    loggedOutView.style.display = "none";
    loggedInView.style.display = "block";
    updateHidePremiumSettingLabel(user);

    userName.textContent = user.fullName || user.email || chrome.i18n.getMessage("patreonUserFallback");

    if (user.imageUrl) {
      userAvatar.src = user.imageUrl;
      userAvatar.style.display = "block";
    } else {
      userAvatar.src = "";
      userAvatar.style.display = "none";
    }

    const tierLabels = {
      premium: chrome.i18n.getMessage("patreonTierPremium"),
      commenter: chrome.i18n.getMessage("patreonTierCommenter"),
      supporter: chrome.i18n.getMessage("patreonTierSupporter"),
      basic: chrome.i18n.getMessage("patreonTierBasic"),
      none: chrome.i18n.getMessage("patreonTierNone"),
    };

    userTier.textContent = tierLabels[user.membershipTier] || chrome.i18n.getMessage("patreonTierChecking");

    if (user.hasActiveMembership) {
      userTier.style.color = "#f96854";
    } else {
      userTier.style.color = "var(--lightGrey)";
    }
  }

  function updateHidePremiumSettingLabel(user) {
    const hasPremiumAnalytics = user?.hasActiveMembership === true && user.membershipTier === "premium";
    const messageKey = hasPremiumAnalytics ? "hidePremiumAnalytics" : "hidePremiumTeaser";
    const label = document.getElementById("hide_premium_teaser").closest("label");
    label.querySelector(".switchLabel").textContent = chrome.i18n.getMessage(messageKey);
    label.dataset.hover = chrome.i18n.getMessage(`${messageKey}Hover`);
  }

  async function verifySession(token, generation) {
    try {
      if (!(await hasAuthenticationDataPermission()) || generation !== authenticationGeneration) {
        return { status: "consent_required" };
      }

      const response = await fetchWithAccountConsent(getApiEndpoint("/api/auth/verify"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken: token }),
      });

      const data = await response.json().catch(() => null);
      if (!data) {
        return { status: "error", reason: "invalid_response" };
      }

      const failureReason = typeof data.failureReason === "string" ? data.failureReason : null;
      const membershipTier = typeof data.membershipTier === "string" ? data.membershipTier : null;

      if (data.valid === true) {
        return { status: "valid", membershipTier };
      }

      if (failureReason === "membershipinactive") {
        return { status: "inactive", membershipTier };
      }

      if (failureReason === "expired" || failureReason === "legacyformat") {
        return { status: "expired", membershipTier };
      }

      if (failureReason === "invalid") {
        return { status: "invalid", membershipTier, failureReason };
      }

      if (!failureReason) {
        return { status: "error", reason: "unknown_failure" };
      }

      return { status: "error", reason: failureReason };
    } catch (error) {
      console.error("Session verification failed:", error);
      return { status: "error", reason: "network_error" };
    }
  }

  // Wrapper for cross-browser identity API
  function getIdentityApi() {
    if (typeof browser !== "undefined" && browser.identity) return browser.identity; // prefer Firefox promise API
    if (typeof chrome !== "undefined" && chrome.identity) return chrome.identity;
    return null;
  }

  function launchWebAuthFlow(url) {
    try {
      if (
        typeof browser !== "undefined" &&
        browser.identity &&
        typeof browser.identity.launchWebAuthFlow === "function"
      ) {
        // Promise-based API (Firefox)
        return browser.identity.launchWebAuthFlow({ url, interactive: true });
      }
    } catch (_) {}

    const chromeId = (typeof chrome !== "undefined" && chrome.identity) || null;
    if (!chromeId || typeof chromeId.launchWebAuthFlow !== "function") {
      return Promise.reject(new Error("identity API not available"));
    }
    // Callback-based API (Chrome)
    return new Promise((resolve, reject) => {
      chromeId.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
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

  // Request identity permission immediately within the user click (no awaits prior)
  function ensureIdentityPermission(onResult) {
    try {
      const mf = chrome && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : null;
      // If manifest cannot request identity dynamically (e.g., Firefox), proceed if API is available
      if (mf && (!Array.isArray(mf.optional_permissions) || !mf.optional_permissions.includes("identity"))) {
        const id = getIdentityApi();
        onResult(Boolean(id && typeof id.getRedirectURL === "function"));
        return;
      }

      const perms =
        (typeof chrome !== "undefined" && chrome.permissions) ||
        (typeof browser !== "undefined" && browser.permissions);
      if (!perms || !perms.contains) return onResult(false);
      const afterContains = (has) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) has = false;
        if (has) return onResult(true);
        if (!perms.request) return onResult(false);
        const reqResult = perms.request({ permissions: ["identity"] }, (granted) => {
          if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) return onResult(false);
          onResult(Boolean(granted));
        });
        // Firefox may return a promise
        if (reqResult && typeof reqResult.then === "function") {
          reqResult.then((granted) => onResult(Boolean(granted))).catch(() => onResult(false));
        }
      };
      const result = perms.contains({ permissions: ["identity"] }, afterContains);
      if (result && typeof result.then === "function") {
        result.then(afterContains).catch(() => onResult(false));
      }
    } catch (_) {
      onResult(false);
    }
  }

  function requestLoginConsent(buttonId, generation, continueLogin) {
    if (!usesFirefoxDataCollectionConsent()) {
      continueLogin(true);
      return;
    }
    if (!isToolbarPopup()) {
      void (async () => continueLogin(await requestFeaturePermission("account")))();
      return;
    }

    // Keep the native permission prompt and its continuation outside the toolbar popup.
    openingPermissionPage = true;
    void hasAuthenticationDataPermission()
      .then(async (granted) => {
        if (generation !== authenticationGeneration) return;
        if (granted) {
          continueLogin(true);
          return;
        }
        await openPopupPageInTab(buttonId);
        if (generation === authenticationGeneration) window.close();
      })
      .catch(() => {
        if (generation !== authenticationGeneration) return;
        alert(
          chrome.i18n.getMessage(
            buttonId === "github-login-btn" ? "githubLoginStartFailed" : "patreonLoginStartFailed",
          ),
        );
      })
      .finally(() => {
        openingPermissionPage = false;
      });
  }

  loginBtn.addEventListener("click", () => {
    if (openingPermissionPage) return;
    const generation = ++authenticationGeneration;
    const continueLogin = (consentGranted) => {
      if (generation !== authenticationGeneration) return;
      if (!consentGranted) {
        alert(chrome.i18n.getMessage("patreonPermissionRequired"));
        return;
      }

      ensureIdentityPermission((granted) => {
        if (generation !== authenticationGeneration) return;
        const identityNow = getIdentityApi();
        if (!granted || !identityNow || typeof identityNow.getRedirectURL !== "function") {
          alert(chrome.i18n.getMessage("patreonPermissionRequired"));
          return;
        }
        // Delegate OAuth to background so it persists if the popup closes
        chrome.runtime.sendMessage({ message: "patreon_oauth_login" }, async (resp) => {
          if (generation !== authenticationGeneration) return;
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error("Login failed:", chrome.runtime.lastError.message);
            alert(chrome.i18n.getMessage("patreonLoginStartFailed"));
            return;
          }
          if (resp && resp.success) {
            const stillGranted = await hasAuthenticationDataPermission();
            if (generation !== authenticationGeneration || !stillGranted) return;
            const user = resp.user;
            showLoggedInView(user);
          } else {
            console.error("Login failed:", resp && resp.error);
            alert(chrome.i18n.getMessage("patreonLoginCompleteFailed"));
          }
        });
      });
    };

    requestLoginConsent("patreon-login-btn", generation, continueLogin);
  });

  if (githubLoginBtn) {
    githubLoginBtn.addEventListener("click", () => {
      if (openingPermissionPage) return;
      const generation = ++authenticationGeneration;
      const continueLogin = (consentGranted) => {
        if (generation !== authenticationGeneration) return;
        if (!consentGranted) {
          alert(chrome.i18n.getMessage("patreonPermissionRequired"));
          return;
        }

        ensureIdentityPermission((granted) => {
          if (generation !== authenticationGeneration) return;
          const identityNow = getIdentityApi();
          if (!granted || !identityNow || typeof identityNow.getRedirectURL !== "function") {
            alert(chrome.i18n.getMessage("patreonPermissionRequired"));
            return;
          }

          chrome.runtime.sendMessage({ message: "github_oauth_login" }, async (resp) => {
            if (generation !== authenticationGeneration) return;
            if (chrome.runtime && chrome.runtime.lastError) {
              console.error("GitHub login failed:", chrome.runtime.lastError.message);
              alert(chrome.i18n.getMessage("githubLoginStartFailed"));
              return;
            }
            if (resp && resp.success) {
              const stillGranted = await hasAuthenticationDataPermission();
              if (generation !== authenticationGeneration || !stillGranted) return;
              const user = resp.user;
              showLoggedInView(user);
            } else {
              console.error("GitHub login failed:", resp && resp.error);
              alert(getGitHubLoginErrorMessage(resp?.error, (key) => chrome.i18n.getMessage(key)));
            }
          });
        });
      };

      requestLoginConsent("github-login-btn", generation, continueLogin);
    });
  }

  onAuthenticationDataPermissionRemoved(() => {
    authenticationGeneration++;
    chrome.storage.sync.remove(["patreonAuthenticated", "patreonUser", "patreonSessionToken"]);
    showLoggedOutView();
  });

  onDataPermissionsChanged(({ added, removed }) => {
    if (removed.includes("personallyIdentifyingInfo")) {
      authenticationGeneration++;
      showLoggedOutView();
    } else if (added.some((category) => ["authenticationInfo", "personallyIdentifyingInfo"].includes(category))) {
      refreshAccountView();
    }
  });

  logoutBtn.addEventListener("click", () => {
    authenticationGeneration++;
    showLoggedOutView();
    chrome.storage.sync.remove(["patreonAuthenticated", "patreonUser", "patreonSessionToken"]);
    chrome.runtime.sendMessage({ message: "patreon_logout" });
  });
}

if (!privateBrowsing) {
  initPatreonAuth();

  /*   Advanced Toggle   */
  const advancedToggle = document.getElementById("advancedToggle");
  advancedToggle.addEventListener("click", () => {
    const adv = document.getElementById("advancedSettings");
    if (popup_config.advanced) {
      adv.style.transform = "scale(1.1)";
      adv.style.pointerEvents = "none";
      adv.style.opacity = "0";
      advancedToggle.innerHTML = popup_config.showAdvancedMessage;
    } else {
      adv.style.transform = "scale(1)";
      adv.style.pointerEvents = "auto";
      adv.style.opacity = "1";
      advancedToggle.innerHTML = popup_config.hideAdvancedMessage;
    }
    popup_config.advanced = !popup_config.advanced;
    adv.inert = !popup_config.advanced;
  });

  chrome.storage.onChanged.addListener(storageChangeHandler);
  initConfig();
}

function initConfig() {
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeVersionNumber();
  initializeColoredThumbs();
  initializeColoredBar();
  initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeNumberDisplayReformatLikes();
  initializeHidePremiumTeaser();
  initializeHideRydComments();
  initializeHideClutterButtons();
}

function initializeVersionNumber() {
  const version = chrome.runtime.getManifest().version;
  document.getElementById("ext-version").innerHTML = "v" + version;
}

function initializeDisableVoteSubmission() {
  chrome.storage.sync.get(["disableVoteSubmission"], (res) => {
    handleDisableVoteSubmissionChangeEvent(res.disableVoteSubmission);
  });
}

function initializeDisableLogging() {
  chrome.storage.sync.get(["disableLogging"], (res) => {
    handleDisableLoggingChangeEvent(res.disableLogging);
  });
}

function initializeColoredThumbs() {
  chrome.storage.sync.get(["coloredThumbs"], (res) => {
    handleColoredThumbsChangeEvent(res.coloredThumbs);
  });
}

function initializeColoredBar() {
  chrome.storage.sync.get(["coloredBar"], (res) => {
    handleColoredBarChangeEvent(res.coloredBar);
  });
}

function initializeColorTheme() {
  const initialThemeRevision = colorThemeRevision;
  const initialColorsRevision = customColorsRevision;
  updateColorThemePreviewContent();
  chrome.storage.sync.get(["colorTheme", "customColors"], (res) => {
    if (initialColorsRevision === customColorsRevision) handleCustomColorsChangeEvent(res.customColors);
    customColorsReady = true;
    if (initialThemeRevision === colorThemeRevision) handleColorThemeChangeEvent(res.colorTheme);
    updateColorThemePreviewContent();
  });
}

function initializeTooltipPercentage() {
  chrome.storage.sync.get(["showTooltipPercentage"], (res) => {
    handleShowTooltipPercentageChangeEvent(res.showTooltipPercentage);
  });
}

function initializeTooltipPercentageMode() {
  chrome.storage.sync.get(["tooltipPercentageMode"], (res) => {
    handleTooltipPercentageModeChangeEvent(res.tooltipPercentageMode);
  });
}

function initializeNumberDisplayFormat() {
  chrome.storage.sync.get(["numberDisplayFormat"], (res) => {
    handleNumberDisplayFormatChangeEvent(res.numberDisplayFormat);
  });
  updateNumberDisplayFormatContent();
}

function updateNumberDisplayFormatContent() {
  let testValue = 123456;
  document.getElementById("number_format_compactShort").innerHTML =
    getNumberFormatter("compactShort").format(testValue);
  document.getElementById("number_format_compactLong").innerHTML = getNumberFormatter("compactLong").format(testValue);
  document.getElementById("number_format_standard").innerHTML = getNumberFormatter("standard").format(testValue);
}

function initializeNumberDisplayReformatLikes() {
  chrome.storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    handleNumberDisplayReformatLikesChangeEvent(res.numberDisplayReformatLikes);
  });
}

function initializeHidePremiumTeaser() {
  chrome.storage.sync.get(["hidePremiumTeaser"], (res) => {
    handleHidePremiumTeaserChangeEvent(res.hidePremiumTeaser);
  });
}

function initializeHideRydComments() {
  chrome.storage.sync.get(["hideRydComments"], (res) => {
    handleHideRydCommentsChangeEvent(res.hideRydComments);
  });
}

function initializeHideClutterButtons() {
  chrome.storage.sync.get(["hideClutterButtons"], (res) => {
    if (res.hideClutterButtons === undefined) {
      chrome.storage.sync.set({ hideClutterButtons: false });
    }
    handleHideClutterButtonsChangeEvent(res.hideClutterButtons);
  });
}

function storageChangeHandler(changes, area) {
  if (changes.disableVoteSubmission !== undefined) {
    handleDisableVoteSubmissionChangeEvent(changes.disableVoteSubmission.newValue);
  }
  if (changes.disableLogging !== undefined) {
    handleDisableLoggingChangeEvent(changes.disableLogging.newValue);
  }
  if (changes.coloredThumbs !== undefined) {
    handleColoredThumbsChangeEvent(changes.coloredThumbs.newValue);
  }
  if (changes.coloredBar !== undefined) {
    handleColoredBarChangeEvent(changes.coloredBar.newValue);
  }
  if (area === "sync" && changes.customColors !== undefined) {
    customColorsRevision++;
    handleCustomColorsChangeEvent(changes.customColors.newValue);
  }
  if (area === "sync" && changes.colorTheme !== undefined) {
    colorThemeRevision++;
    handleColorThemeChangeEvent(changes.colorTheme.newValue);
  }
  if (changes.numberDisplayFormat !== undefined) {
    handleNumberDisplayFormatChangeEvent(changes.numberDisplayFormat.newValue);
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
  if (changes.hideRydComments !== undefined) {
    handleHideRydCommentsChangeEvent(changes.hideRydComments.newValue);
  }
  if (changes.hideClutterButtons !== undefined) {
    handleHideClutterButtonsChangeEvent(changes.hideClutterButtons.newValue);
  }
}

function handleDisableVoteSubmissionChangeEvent(value) {
  popup_config.disableVoteSubmission = value;
  document.getElementById("disable_vote_submission").checked = value;
}

function handleDisableLoggingChangeEvent(value) {
  popup_config.disableLogging = value;
  document.getElementById("disable_logging").checked = value;
}

function handleColoredThumbsChangeEvent(value) {
  popup_config.coloredThumbs = value;
  document.getElementById("colored_thumbs").checked = value;
}

function handleColoredBarChangeEvent(value) {
  popup_config.coloredBar = value;
  document.getElementById("colored_bar").checked = value;
}

function handleColorThemeChangeEvent(value) {
  const select = document.getElementById("color_theme");
  popup_config.colorTheme = Array.from(select.options).some((option) => option.value === value) ? value : "classic";
  select.value = popup_config.colorTheme;
  updateColorThemePreviewContent();
}

function handleCustomColorsChangeEvent(value) {
  popup_config.customColors = normalizeCustomColors(value);
  updateColorThemePreviewContent();
}

function updateColorThemePreviewContent() {
  for (const mode of ["light", "dark"]) {
    document.getElementById(`custom_colors_${mode}`).hidden = popup_config.colorTheme !== "custom";
    for (const vote of ["like", "dislike"]) {
      const input = document.getElementById(`custom_color_${mode}_${vote}`);
      input.value = popup_config.customColors[mode][vote];
      input.disabled = !customColorsReady;
      document.getElementById(`color_theme_example_${mode}_${vote}`).style.backgroundColor = getThemeColor(
        popup_config.colorTheme,
        vote === "like",
        mode === "dark",
        popup_config.customColors,
      );
    }
  }
}

function handleNumberDisplayFormatChangeEvent(value = "compactShort") {
  popup_config.numberDisplayFormat = value;
  document.getElementById("number_format").querySelector('option[value="' + value + '"]').selected = true;
}

function handleShowTooltipPercentageChangeEvent(value) {
  popup_config.showTooltipPercentage = value;
  document.getElementById("show_tooltip_percentage").checked = value;
}

function handleTooltipPercentageModeChangeEvent(value) {
  if (!value) {
    value = "dash_like";
  }
  popup_config.tooltipPercentageMode = value;

  document.getElementById("tooltip_percentage_mode").querySelector('option[value="' + value + '"]').selected = true;
}

function handleNumberDisplayReformatLikesChangeEvent(value) {
  popup_config.numberDisplayReformatLikes = value;
  document.getElementById("number_reformat_likes").checked = value;
}

function handleHidePremiumTeaserChangeEvent(value) {
  const normalized = value === true;
  popup_config.hidePremiumTeaser = normalized;
  document.getElementById("hide_premium_teaser").checked = normalized;
}

function handleHideRydCommentsChangeEvent(value) {
  const normalized = value === true;
  popup_config.hideRydComments = normalized;
  document.getElementById("hide_ryd_comments").checked = normalized;
}

function handleHideClutterButtonsChangeEvent(value) {
  const normalized = value === true;
  popup_config.hideClutterButtons = normalized;
  document.getElementById("hide_clutter_buttons").checked = normalized;
}

function getNumberFormatter(optionSelect) {
  let formatterNotation;
  let formatterCompactDisplay;
  let userLocales;
  try {
    userLocales = new URL(
      Array.from(document.querySelectorAll("head > link[rel='search']"))
        ?.find((n) => n?.getAttribute("href")?.includes("?locale="))
        ?.getAttribute("href"),
    )?.searchParams?.get("locale");
  } catch {}

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
  const formatter = Intl.NumberFormat(document.documentElement.lang || userLocales || navigator.language, {
    notation: formatterNotation,
    compactDisplay: formatterCompactDisplay,
  });
  return formatter;
}

})();

/******/ })()
;