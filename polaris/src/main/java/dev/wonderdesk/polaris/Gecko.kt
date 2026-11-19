package dev.wonderdesk.polaris

import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONArray
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.ContentBlocking
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import java.io.File

/** The Firefox engine, one per app, and the extensions that ship with Polaris. */
object Gecko {
    lateinit var runtime: GeckoRuntime
    val extensions = mutableStateListOf<WebExtension>()
    var ubo by mutableStateOf<WebExtension?>(null)
    var uboAction by mutableStateOf<WebExtension.Action?>(null)
    val actions = androidx.compose.runtime.mutableStateMapOf<String, WebExtension.Action>()
    var popup by mutableStateOf<GeckoSession?>(null)
    var status by mutableStateOf("")

    const val UBO_ID = "uBlock0@raymondhill.net"
    const val RUFFLE_ID = "{b5501fd1-7084-45c5-9aa6-567c2fcf5dc6}"

    fun init(c: Context) {
        if (::runtime.isInitialized) return
        val app = c.applicationContext
        val cb = ContentBlocking.Settings.Builder()
            .antiTracking(if (Prefs.strict(app)) ContentBlocking.AntiTracking.STRICT else ContentBlocking.AntiTracking.DEFAULT)
            .enhancedTrackingProtectionLevel(if (Prefs.strict(app)) ContentBlocking.EtpLevel.STRICT else ContentBlocking.EtpLevel.DEFAULT)
            .cookieBehavior(ContentBlocking.CookieBehavior.ACCEPT_NON_TRACKERS)
            .cookieBehaviorPrivateMode(ContentBlocking.CookieBehavior.ACCEPT_FIRST_PARTY_AND_ISOLATE_OTHERS)
            .safeBrowsing(ContentBlocking.SafeBrowsing.DEFAULT).build()
        val b = GeckoRuntimeSettings.Builder().contentBlocking(cb).aboutConfigEnabled(true).consoleOutput(false).loginAutofillEnabled(true)
            .preferredColorScheme(GeckoRuntimeSettings.COLOR_SCHEME_SYSTEM)
        // Routing everything through Tor (Orbot's local proxy) is a startup setting.
        if (Prefs.tor(app)) {
            val f = File(app.filesDir, "geckoview-config.yaml")
            f.writeText("prefs:\n  network.proxy.type: 1\n  network.proxy.socks: \"127.0.0.1\"\n  network.proxy.socks_port: 9050\n  network.proxy.socks_version: 5\n  network.proxy.socks_remote_dns: true\n  network.proxy.no_proxies_on: \"\"\n  media.peerconnection.enabled: false\n")
            b.configFilePath(f.absolutePath)
        }
        runtime = GeckoRuntime.create(app, b.build())
        installBuiltIns(app)
    }

    private fun installBuiltIns(appCtx: Context) {
        val ctl = runtime.webExtensionController
        ctl.setPromptDelegate(object : WebExtensionController.PromptDelegate {
            override fun onInstallPromptRequest(ext: WebExtension, perms: Array<String>, origins: Array<String>): GeckoResult<org.mozilla.geckoview.WebExtension.PermissionPromptResponse>? {
                val r = GeckoResult<WebExtension.PermissionPromptResponse>()
                Hooks.ask = Ask("Add ${ext.metaData.name}?", "It will be able to: " + (perms + origins).joinToString(", ").ifBlank { "run on this browser" }, Ask.CONFIRM, "Add") { ok -> r.complete(WebExtension.PermissionPromptResponse(ok == true, false)) }
                return r
            }
        })
        // Every extension shipped in assets/extensions starts with the browser and is allowed in Veil (private) tabs too.
        val dirs = runCatching { appCtx.assets.list("extensions")?.toList() }.getOrNull() ?: emptyList()
        ctl.list().accept({ installed ->
            val have = installed?.filter { !it.isBuiltIn }?.map { it.id }?.toSet() ?: emptySet()
            installed?.forEach { watch(it) }
            loadBundled(appCtx, ctl, dirs, have)
        }, { loadBundled(appCtx, ctl, dirs, emptySet()) })
    }

    private fun loadBundled(appCtx: Context, ctl: WebExtensionController, dirs: List<String>, have: Set<String>) {
        for (dir in dirs) {
            val id = runCatching {
                val m = org.json.JSONObject(appCtx.assets.open("extensions/$dir/manifest.json").bufferedReader().readText())
                (m.optJSONObject("browser_specific_settings") ?: m.optJSONObject("applications"))?.optJSONObject("gecko")?.optString("id")
            }.getOrNull()?.takeIf { it.isNotBlank() } ?: continue
            if (id == RUFFLE_ID && !Prefs.flash(appCtx)) continue
            if (id in have) continue   // a newer copy from the store is already installed
            ctl.ensureBuiltIn("resource://android/assets/extensions/$dir/", id).accept({ ext ->
                if (ext != null) {
                    ctl.setAllowedInPrivateBrowsing(ext, true).accept({ e2 -> val x = e2 ?: ext; watch(x); if (x.id == UBO_ID) ubo = x }, { watch(ext); if (ext.id == UBO_ID) ubo = ext })
                }
            }, { e -> status = "Couldn't start $dir: ${e?.message}" })
        }
    }

    /** Keeps the list of extensions current and hands each one's toolbar button to the menu. */
    fun watch(ext: WebExtension) {
        if (extensions.none { it.id == ext.id }) extensions.add(ext)
        val actionDelegate = object : WebExtension.ActionDelegate {
            override fun onBrowserAction(e: WebExtension, session: GeckoSession?, action: WebExtension.Action) { actions[e.id] = action; if (e.id == UBO_ID) uboAction = action }
            override fun onTogglePopup(e: WebExtension, action: WebExtension.Action): GeckoResult<GeckoSession>? = openPopup()
            override fun onOpenPopup(e: WebExtension, action: WebExtension.Action): GeckoResult<GeckoSession>? = openPopup()
        }
        ext.setActionDelegate(actionDelegate)
        // Extensions can open tabs and their settings pages; those become Polaris tabs.
        ext.setTabDelegate(object : WebExtension.TabDelegate {
            override fun onNewTab(e: WebExtension, details: WebExtension.CreateTabDetails): GeckoResult<GeckoSession>? {
                val t = Browser.open(Hooks.appContext, null, veil = false, adopt = true)
                details.url?.let { u -> t.url = u }
                return GeckoResult.fromValue(t.session)
            }
            override fun onOpenOptionsPage(e: WebExtension) { e.metaData.optionsPageUrl?.let { Browser.open(Hooks.appContext, it, veil = false) } }
        })
        Browser.tabs.forEach { it.session.webExtensionController.setActionDelegate(ext, actionDelegate) }
        delegates[ext.id] = actionDelegate
    }

    val delegates = HashMap<String, WebExtension.ActionDelegate>()
    /** Tells every extension which tab is in front, so popups act on the page you are looking at. */
    fun markActive() { Browser.tabs.forEachIndexed { i, t -> runCatching { runtime.webExtensionController.setTabActive(t.session, i == Browser.current) } } }

    /** Installs (or updates to) a catalogue version, with the same Veil permission as the bundled ones. */
    fun installFromStore(a: Addon, done: (Boolean, String) -> Unit = { _, _ -> }) {
        runtime.webExtensionController.install(a.xpiUrl).accept({ ext ->
            if (ext == null) { done(false, "Couldn't add it"); return@accept }
            runtime.webExtensionController.setAllowedInPrivateBrowsing(ext, true).accept({ e2 -> watch(e2 ?: ext); done(true, a.name) }, { watch(ext); done(true, a.name) })
            AddonStore.updates = AddonStore.updates.filter { it.first != ext.id }
        }, { e -> done(false, e?.message ?: "Couldn't add it") })
    }

    private fun openPopup(): GeckoResult<GeckoSession> { val s = GeckoSession(); popup = s; return GeckoResult.fromValue(s) }

    fun refreshList() { runtime.webExtensionController.list().accept({ l -> extensions.clear(); l?.forEach { watch(it) } }, { }) }
}

/** A question for the person from the page or the engine: alert, confirm, text, choice, or an extension asking permission. */
class Ask(val title: String, val message: String, val kind: Int, val ok: String = "OK", val text: String = "", val choices: List<Pair<String, String>> = emptyList(), val multi: Boolean = false, val done: (Any?) -> Unit) {
    companion object { const val ALERT = 0; const val CONFIRM = 1; const val TEXT = 2; const val CHOICE = 3 }
}

/** One browser tab: a Gecko session (private for Veil tabs) and what the screen shows about it. */
class Tab(val id: Int, val appContext: Context, val veil: Boolean) {
    val session = GeckoSession(GeckoSessionSettings.Builder().usePrivateMode(veil).useTrackingProtection(true).build())
    var title by mutableStateOf("")
    var url by mutableStateOf("")
    var progress by mutableIntStateOf(0)
    var loading by mutableStateOf(false)
    var canBack by mutableStateOf(false)
    var canForward by mutableStateOf(false)
    var desktop by mutableStateOf(false)
    var secure by mutableStateOf(false)
    var findText by mutableStateOf<String?>(null)
    var findCount by mutableIntStateOf(0)
    var findIndex by mutableIntStateOf(0)
    var view: GeckoView? = null
    var adopted = false
    private var pendingUrl: String? = null
    val isStart get() = url.isEmpty()

    init { install(); Gecko.extensions.forEach { e -> Gecko.delegates[e.id]?.let { d -> session.webExtensionController.setActionDelegate(e, d) } } }

    fun ensureOpen() { if (!session.isOpen && !adopted) session.open(Gecko.runtime) }

    fun go(input: String) {
        val u = Browser.resolve(appContext, input)
        url = u; ensureOpen(); applyUa(Uri.parse(u).host); session.loadUri(u)
    }

    fun applyUa(host: String?) {
        val key = host?.let { SiteRules.ua(appContext, it) } ?: Prefs.uaKey(appContext)
        session.settings.userAgentOverride = UserAgents.override(key)
        session.settings.userAgentMode = if (desktop) GeckoSessionSettings.USER_AGENT_MODE_DESKTOP else GeckoSessionSettings.USER_AGENT_MODE_MOBILE
        session.settings.viewportMode = if (desktop) GeckoSessionSettings.VIEWPORT_MODE_DESKTOP else GeckoSessionSettings.VIEWPORT_MODE_MOBILE
    }

    fun toggleDesktop() { desktop = !desktop; applyUa(Uri.parse(url).host); session.reload() }

    fun find(text: String, backwards: Boolean = false) {
        if (text.isEmpty()) { session.finder.clear(); findCount = 0; return }
        session.finder.find(text, if (backwards) GeckoSession.FINDER_FIND_BACKWARDS else 0).accept({ r -> if (r != null) { findIndex = r.current; findCount = r.total } }, { })
    }

    fun destroy() { runCatching { view?.releaseSession() }; runCatching { if (session.isOpen) session.close() } }

    private fun install() {
        session.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStart(s: GeckoSession, u: String) { loading = true; url = u; progress = 5 }
            override fun onPageStop(s: GeckoSession, success: Boolean) { loading = false; progress = 100 }
            override fun onProgressChange(s: GeckoSession, p: Int) { progress = p }
            override fun onSecurityChange(s: GeckoSession, info: GeckoSession.ProgressDelegate.SecurityInformation) { secure = info.isSecure }
        }
        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onLocationChange(s: GeckoSession, u: String?, perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>, userGesture: Boolean) { if (u != null && !u.startsWith("about:")) url = u }
            override fun onCanGoBack(s: GeckoSession, v: Boolean) { canBack = v }
            override fun onCanGoForward(s: GeckoSession, v: Boolean) { canForward = v }
            override fun onLoadRequest(s: GeckoSession, req: GeckoSession.NavigationDelegate.LoadRequest): GeckoResult<AllowOrDeny>? {
                val u = Uri.parse(req.uri)
                if (u.scheme == "http" || u.scheme == "https") {
                    val host = u.host ?: return null
                    applyUa(host)
                    val rule = SiteRules.app(appContext, host)
                    if (rule == "always" || rule == "ask") {
                        val app = appFor(appContext, u)
                        if (app != null && req.target != GeckoSession.NavigationDelegate.TARGET_WINDOW_NEW) {
                            if (rule == "always") { runCatching { appContext.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, u).setPackage(app.first).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)) }; return GeckoResult.fromValue(AllowOrDeny.DENY) }
                            Hooks.appAsk = Hooks.AppAsk(req.uri, host, app.second, app.first); return GeckoResult.fromValue(AllowOrDeny.DENY)
                        }
                    }
                    return null
                }
                if (u.scheme == "about" || u.scheme == "moz-extension" || u.scheme == "data" || u.scheme == "blob" || u.scheme == "resource" || u.scheme == "javascript") return null
                // intent:, market:, mailto:, tel: and friends go to the apps that handle them.
                runCatching {
                    val i = if (u.scheme == "intent") android.content.Intent.parseUri(req.uri, android.content.Intent.URI_INTENT_SCHEME) else android.content.Intent(android.content.Intent.ACTION_VIEW, u)
                    i.addCategory(android.content.Intent.CATEGORY_BROWSABLE); i.component = null; i.selector = null; i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK); appContext.startActivity(i)
                }
                return GeckoResult.fromValue(AllowOrDeny.DENY)
            }
            override fun onNewSession(s: GeckoSession, uri: String): GeckoResult<GeckoSession>? {
                val t = Browser.open(appContext, null, veil = veil, adopt = true)
                return GeckoResult.fromValue(t.session)
            }
        }
        session.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onTitleChange(s: GeckoSession, t: String?) { title = t ?: ""; if (!veil && url.startsWith("http")) Library.history.updateTitle(url, title) }
            override fun onFullScreen(s: GeckoSession, full: Boolean) { Hooks.fullscreen = full }
            override fun onContextMenu(s: GeckoSession, x: Int, y: Int, e: GeckoSession.ContentDelegate.ContextElement) {
                val link = e.linkUri; val src = e.srcUri
                when {
                    link != null -> Hooks.ctxMenu = Hooks.Ctx(link, false, veil)
                    e.type == GeckoSession.ContentDelegate.ContextElement.TYPE_IMAGE && src != null -> Hooks.ctxMenu = Hooks.Ctx(src, true, veil)
                }
            }
            override fun onExternalResponse(s: GeckoSession, r: org.mozilla.geckoview.WebResponse) {
                runCatching {
                    val cd = r.headers["Content-Disposition"]; val mime = r.headers["Content-Type"]
                    val name = android.webkit.URLUtil.guessFileName(r.uri, cd, mime)
                    appContext.getSystemService(android.app.DownloadManager::class.java).enqueue(android.app.DownloadManager.Request(Uri.parse(r.uri)).setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED).setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, name))
                    Hooks.toast("Downloading $name")
                }.onFailure { Hooks.toast("Couldn't start the download") }
            }
            override fun onCrash(s: GeckoSession) { Hooks.toast("This tab crashed. Reloading"); runCatching { s.open(Gecko.runtime); if (url.isNotEmpty()) s.loadUri(url) } }
            override fun onKill(s: GeckoSession) { runCatching { s.open(Gecko.runtime); if (url.isNotEmpty()) s.loadUri(url) } }
        }
        session.historyDelegate = object : GeckoSession.HistoryDelegate {
            override fun onVisited(s: GeckoSession, u: String, last: String?, flags: Int): GeckoResult<Boolean>? {
                if (!veil && u.startsWith("http") && (flags and GeckoSession.HistoryDelegate.VISIT_UNRECOVERABLE_ERROR) == 0) Library.history.add(Entry(u, title, System.currentTimeMillis()), unique = false)
                return GeckoResult.fromValue(true)
            }
        }
        session.permissionDelegate = object : GeckoSession.PermissionDelegate {
            override fun onAndroidPermissionsRequest(s: GeckoSession, perms: Array<String>?, cb: GeckoSession.PermissionDelegate.Callback) { Hooks.androidPerms?.invoke(perms ?: emptyArray()) { ok -> if (ok) cb.grant() else cb.reject() } ?: cb.reject() }
            override fun onContentPermissionRequest(s: GeckoSession, p: GeckoSession.PermissionDelegate.ContentPermission): GeckoResult<Int>? {
                if (p.permission == GeckoSession.PermissionDelegate.PERMISSION_PERSISTENT_STORAGE || p.permission == GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE || p.permission == GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE)
                    return GeckoResult.fromValue(if (p.permission == GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE) GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW else GeckoSession.PermissionDelegate.ContentPermission.VALUE_DENY)
                val what = when (p.permission) { GeckoSession.PermissionDelegate.PERMISSION_GEOLOCATION -> "your location"; GeckoSession.PermissionDelegate.PERMISSION_DESKTOP_NOTIFICATION -> "send you notifications"; GeckoSession.PermissionDelegate.PERMISSION_MEDIA_KEY_SYSTEM_ACCESS -> "play protected video"; else -> "use a permission" }
                val r = GeckoResult<Int>()
                Hooks.ask = Ask("Allow ${Uri.parse(p.uri).host ?: "this site"}?", "It wants to $what.", Ask.CONFIRM, "Allow") { ok -> r.complete(if (ok == true) GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW else GeckoSession.PermissionDelegate.ContentPermission.VALUE_DENY) }
                return r
            }
            override fun onMediaPermissionRequest(s: GeckoSession, uri: String, video: Array<GeckoSession.PermissionDelegate.MediaSource>?, audio: Array<GeckoSession.PermissionDelegate.MediaSource>?, cb: GeckoSession.PermissionDelegate.MediaCallback) {
                Hooks.ask = Ask("Allow ${Uri.parse(uri).host ?: "this site"}?", "It wants to use your ${listOfNotNull(if (video?.isNotEmpty() == true) "camera" else null, if (audio?.isNotEmpty() == true) "microphone" else null).joinToString(" and ")}.", Ask.CONFIRM, "Allow") { ok ->
                    if (ok == true) cb.grant(video?.firstOrNull(), audio?.firstOrNull()) else cb.reject()
                }
            }
        }
        session.promptDelegate = object : GeckoSession.PromptDelegate {
            override fun onAlertPrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.AlertPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
                val r = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>(); Hooks.ask = Ask(p.title ?: "", p.message ?: "", Ask.ALERT) { r.complete(p.dismiss()) }; return r
            }
            override fun onButtonPrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.ButtonPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
                val r = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>(); Hooks.ask = Ask(p.title ?: "", p.message ?: "", Ask.CONFIRM) { ok -> r.complete(if (ok == true) p.confirm(GeckoSession.PromptDelegate.ButtonPrompt.Type.POSITIVE) else p.dismiss()) }; return r
            }
            override fun onTextPrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.TextPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
                val r = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>(); Hooks.ask = Ask(p.title ?: "", p.message ?: "", Ask.TEXT, text = p.defaultValue ?: "") { v -> r.complete(if (v is String) p.confirm(v) else p.dismiss()) }; return r
            }
            override fun onChoicePrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.ChoicePrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
                val r = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
                val multi = p.type == GeckoSession.PromptDelegate.ChoicePrompt.Type.MULTIPLE
                Hooks.ask = Ask(p.title ?: "", p.message ?: "", Ask.CHOICE, choices = p.choices.filter { !it.disabled }.map { it.id to it.label }, multi = multi) { v ->
                    @Suppress("UNCHECKED_CAST") r.complete(when (v) { is String -> p.confirm(v); is List<*> -> p.confirm((v as List<String>).toTypedArray()); else -> p.dismiss() })
                }; return r
            }
            override fun onFilePrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.FilePrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
                val r = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
                Hooks.pickFile?.invoke(p.mimeTypes ?: arrayOf("*/*"), p.type == GeckoSession.PromptDelegate.FilePrompt.Type.MULTIPLE) { uris -> r.complete(if (uris.isEmpty()) p.dismiss() else if (uris.size == 1) p.confirm(appContext, uris[0]) else p.confirm(appContext, uris.toTypedArray())) } ?: r.complete(p.dismiss())
                return r
            }
            override fun onPopupPrompt(s: GeckoSession, p: GeckoSession.PromptDelegate.PopupPrompt): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? = GeckoResult.fromValue(p.confirm(AllowOrDeny.ALLOW))
        }
    }
}

object Browser {
    val tabs = mutableStateListOf<Tab>()
    var current by mutableIntStateOf(0)
    private var next = 1
    val currentTab get() = tabs.getOrNull(current)

    fun resolve(c: Context, input: String): String {
        val s = input.trim()
        return when {
            s.matches(Regex("^[a-zA-Z][a-zA-Z0-9+.-]*://.*")) -> if (s.startsWith("http://") && Prefs.upgradeHttps(c)) "https://" + s.removePrefix("http://") else s
            s.startsWith("about:") || s.startsWith("file:") || s.startsWith("moz-extension:") -> s
            s.contains(' ') || !s.contains('.') && !s.startsWith("localhost") -> Prefs.searchUrl(c, s)
            else -> (if (Prefs.upgradeHttps(c)) "https://" else "http://") + s
        }
    }

    fun open(c: Context, url: String? = null, veil: Boolean = Prefs.veilDefault(c), select: Boolean = true, adopt: Boolean = false): Tab {
        Gecko.init(c)
        val t = Tab(next++, c.applicationContext, veil).also { it.adopted = adopt }
        tabs.add(t); if (select) current = tabs.lastIndex
        if (url != null) t.go(url)
        return t
    }

    fun close(i: Int) {
        val t = tabs.getOrNull(i) ?: return
        t.destroy(); tabs.removeAt(i)
        if (current >= tabs.size) current = tabs.lastIndex
    }

    /** Forgets everything (history, cookies, cache, site data). Veil tabs never store any of it in the first place. */
    fun wipeAll(c: Context) { runCatching { Gecko.runtime.storageController.clearData(org.mozilla.geckoview.StorageController.ClearFlags.ALL) } }

    fun saveSession(c: Context) {
        val urls = tabs.filter { !it.veil && it.url.isNotEmpty() }.map { it.url }
        Prefs.p(c).edit().putString("session", JSONArray(urls).toString()).apply()
    }
    fun restoreSession(c: Context) {
        if (tabs.isNotEmpty()) return
        val a = runCatching { JSONArray(Prefs.p(c).getString("session", "[]")) }.getOrDefault(JSONArray())
        for (i in 0 until a.length()) open(c, a.getString(i), veil = false, select = i == 0)
    }
}
