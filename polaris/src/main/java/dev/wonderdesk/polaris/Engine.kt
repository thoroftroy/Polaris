package dev.wonderdesk.polaris

import android.annotation.SuppressLint
import android.content.Context
import android.content.MutableContextWrapper
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.net.URLEncoder

/* ------------------------------------------------------------------ settings */

object Prefs {
    fun p(c: Context) = c.getSharedPreferences("polaris", Context.MODE_PRIVATE)
    val ENGINES = listOf("DuckDuckGo" to "https://duckduckgo.com/?q=%s", "Brave Search" to "https://search.brave.com/search?q=%s", "Startpage" to "https://www.startpage.com/do/search?q=%s",
        "Qwant" to "https://www.qwant.com/?q=%s", "Ecosia" to "https://www.ecosia.org/search?q=%s", "Google" to "https://www.google.com/search?q=%s", "Bing" to "https://www.bing.com/search?q=%s")
    fun engine(c: Context) = p(c).getString("engine", "DuckDuckGo") ?: "DuckDuckGo"
    fun searchUrl(c: Context, q: String) = (ENGINES.firstOrNull { it.first == engine(c) } ?: ENGINES[0]).second.replace("%s", URLEncoder.encode(q, "UTF-8"))
    /** New tabs open as Veil tabs (nothing is remembered) unless this is switched off. */
    fun veilDefault(c: Context) = p(c).getBoolean("veilDefault", true)
    fun adBlock(c: Context) = p(c).getBoolean("adblock", true)
    fun hideCosmetic(c: Context) = p(c).getBoolean("cosmetic", true)
    fun blockThirdPartyCookies(c: Context) = p(c).getBoolean("tpc", true)
    fun upgradeHttps(c: Context) = p(c).getBoolean("https", true)
    fun uaKey(c: Context) = p(c).getString("ua", "default") ?: "default"
    fun clearOnExit(c: Context) = p(c).getBoolean("clearOnExit", false)
    fun textZoom(c: Context) = p(c).getInt("textZoom", 100)
}

/** Which browser the page is told it is talking to. */
object UserAgents {
    val LIST = listOf(
        "default" to "Polaris (honest)", "chrome-win" to "Chrome on Windows", "firefox-linux" to "Firefox on Linux", "chrome-android" to "Chrome on Android",
        "safari-iphone" to "Safari on iPhone", "safari-mac" to "Safari on Mac",
    )
    private const val CHROME = "Chrome/131.0.0.0"
    fun string(key: String, default: String, desktopMode: Boolean): String = when (key) {
        "chrome-win" -> "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Safari/537.36"
        "firefox-linux" -> "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0"
        "chrome-android" -> "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Mobile Safari/537.36"
        "safari-iphone" -> "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        "safari-mac" -> "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
        else -> if (desktopMode) "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Safari/537.36" else default.replace("; wv", "")
    }
}

/* ------------------------------------------------------------------ blocking */

/** Blocks ads and trackers by host. Ships with a core list and can load EasyList-style and hosts lists. */
object AdBlock {
    private val core = ("doubleclick.net googlesyndication.com googleadservices.com google-analytics.com googletagmanager.com googletagservices.com adservice.google.com pagead2.googlesyndication.com " +
        "adsystem.com adnxs.com adsrvr.org advertising.com amazon-adsystem.com taboola.com outbrain.com criteo.com criteo.net rubiconproject.com pubmatic.com openx.net casalemedia.com " +
        "moatads.com scorecardresearch.com quantserve.com chartbeat.com hotjar.com mixpanel.com segment.io segment.com fullstory.com mouseflow.com crazyegg.com optimizely.com " +
        "facebook.net connect.facebook.net an.facebook.com ads.twitter.com analytics.twitter.com ads.linkedin.com bat.bing.com ads.yahoo.com adtech.com smartadserver.com " +
        "yieldmo.com sharethrough.com 33across.com indexww.com lijit.com sovrn.com bidswitch.net contextweb.com spotxchat.com teads.tv inmobi.com unity3d.com applovin.com " +
        "adcolony.com vungle.com chartboost.com mopub.com ironsrc.com startapp.com tapjoy.com bluekai.com demdex.net krxd.net exelator.com agkn.com rlcdn.com tiqcdn.com " +
        "newrelic.com nr-data.net branch.io adjust.com appsflyer.com kochava.com singular.net clarity.ms stats.wp.com pixel.wp.com ads.pubmatic.com ad.doubleclick.net").split(' ').toHashSet()
    @Volatile private var extra: Set<String> = emptySet()
    @Volatile var count = 0
    fun file(c: Context) = File(c.filesDir, "filters.txt")

    fun load(c: Context) {
        val f = file(c)
        if (f.isFile) extra = runCatching { f.readLines().toHashSet() }.getOrDefault(emptySet())
    }
    fun listSize() = core.size + extra.size

    fun blocked(host: String): Boolean {
        var h = host.lowercase()
        while (true) {
            if (h in core || h in extra) return true
            val dot = h.indexOf('.'); if (dot < 0 || h.indexOf('.', dot + 1) < 0) return false
            h = h.substring(dot + 1)
        }
    }

    /** Reads `||domain^` rules (EasyList, uBlock) and hosts-file lines; ignores everything else. */
    fun parse(text: String): Set<String> {
        val out = HashSet<String>()
        for (raw in text.lineSequence()) {
            val l = raw.trim()
            if (l.isEmpty() || l[0] == '!' || l[0] == '#' || l[0] == '[') continue
            if (l.startsWith("||")) {
                val rule = l.substring(2); val end = rule.indexOfFirst { it == '^' || it == '/' || it == '$' || it == '*' }
                val dom = (if (end < 0) rule else rule.substring(0, end)).lowercase()
                if (end >= 0 && rule[end] == '/' ) continue
                if (dom.contains('.') && !dom.contains('*') && (!l.contains('$') || l.contains("third-party") && !l.contains("~"))) out.add(dom)
            } else if (l.startsWith("0.0.0.0 ") || l.startsWith("127.0.0.1 ")) {
                val dom = l.split(Regex("\\s+")).getOrNull(1)?.lowercase() ?: continue
                if (dom.contains('.') && dom != "localhost") out.add(dom)
            }
        }
        return out
    }

    /** Downloads the lists and keeps the result. Returns how many hosts were added. */
    fun update(c: Context): Int {
        val urls = listOf("https://easylist.to/easylist/easylist.txt", "https://easylist.to/easylist/easyprivacy.txt", "https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext")
        val all = HashSet<String>()
        for (u in urls) runCatching { all += parse(java.net.URL(u).openConnection().apply { connectTimeout = 15000; readTimeout = 30000 }.getInputStream().bufferedReader().readText()) }
        if (all.isEmpty()) error("Couldn't download the lists")
        file(c).writeText(all.joinToString("\n")); extra = all
        Prefs.p(c).edit().putLong("filtersAt", System.currentTimeMillis()).apply()
        return all.size
    }

    /** Hides the empty frames ad scripts leave behind. */
    const val CSS = "ins.adsbygoogle,.adsbygoogle,[id^='google_ads'],[id^='div-gpt-ad'],[class*='ad-banner'],[class*='advert'],[id*='sponsor'],iframe[src*='doubleclick'],iframe[src*='googlesyndication']{display:none!important}"
}

/** What to do when a link could open in an app: per site. */
object SiteRules {
    private fun f(c: Context) = File(c.filesDir, "site-rules.json")
    fun all(c: Context): Map<String, JSONObject> = runCatching { JSONObject(f(c).readText()).let { o -> o.keys().asSequence().associateWith { o.getJSONObject(it) } } }.getOrDefault(emptyMap())
    fun get(c: Context, host: String): JSONObject? = all(c).entries.firstOrNull { host == it.key || host.endsWith("." + it.key) }?.value
    fun app(c: Context, host: String) = get(c, host)?.optString("app", "")?.ifBlank { null }          // always | ask | never
    fun ua(c: Context, host: String) = get(c, host)?.optString("ua", "")?.ifBlank { null }
    fun set(c: Context, host: String, app: String?, ua: String?) {
        val m = all(c).toMutableMap()
        val o = (m[host] ?: JSONObject()); if (app != null) o.put("app", app); if (ua != null) o.put("ua", ua)
        m[host] = o
        f(c).writeText(JSONObject().also { r -> m.forEach { (k, v) -> r.put(k, v) } }.toString())
    }
    fun remove(c: Context, host: String) { val m = all(c).toMutableMap(); m.remove(host); f(c).writeText(JSONObject().also { r -> m.forEach { (k, v) -> r.put(k, v) } }.toString()) }
}

/* ------------------------------------------------------------------ history and bookmarks */

data class Entry(val url: String, val title: String, val at: Long)

class EntryStore(private val file: File, private val cap: Int) {
    private var cache: MutableList<Entry>? = null
    @Synchronized fun all(): List<Entry> = cache ?: (runCatching { JSONArray(file.readText()).let { a -> (0 until a.length()).map { a.getJSONObject(it).let { o -> Entry(o.getString("u"), o.optString("t"), o.optLong("a")) } } } }.getOrDefault(emptyList())).toMutableList().also { cache = it }
    @Synchronized fun save() { val l = cache ?: return; file.writeText(JSONArray(l.map { JSONObject().put("u", it.url).put("t", it.title).put("a", it.at) }).toString()) }
    @Synchronized fun add(e: Entry, unique: Boolean) { all(); val l = cache!!; if (unique) l.removeAll { it.url == e.url }; l.add(0, e); while (l.size > cap) l.removeAt(l.lastIndex); save() }
    @Synchronized fun remove(url: String) { all(); cache!!.removeAll { it.url == url }; save() }
    @Synchronized fun clear() { all(); cache!!.clear(); save() }
    @Synchronized fun updateTitle(url: String, title: String) { all(); val i = cache!!.indexOfFirst { it.url == url }; if (i >= 0 && title.isNotBlank()) { cache!![i] = cache!![i].copy(title = title); save() } }
}

object Library {
    lateinit var history: EntryStore
    lateinit var bookmarks: EntryStore
    fun init(c: Context) { if (!::history.isInitialized) { history = EntryStore(File(c.filesDir, "history.json"), 20000); bookmarks = EntryStore(File(c.filesDir, "bookmarks.json"), 5000) } }

    /** Reads the standard bookmarks file every browser can export (Chrome, Firefox, Edge, Safari, Brave). */
    fun importHtml(html: String): List<Entry> = Regex("<A\\s+[^>]*?HREF=\"([^\"]+)\"[^>]*>(.*?)</A>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)).findAll(html)
        .map { Entry(it.groupValues[1], it.groupValues[2].replace(Regex("<[^>]+>"), "").trim(), System.currentTimeMillis()) }.filter { it.url.startsWith("http") }.toList()
}

/* ------------------------------------------------------------------ tabs */

class Tab(val id: Int, val appContext: Context, val veil: Boolean) {
    val ctx = MutableContextWrapper(appContext)
    var title by mutableStateOf("")
    var url by mutableStateOf("")
    var progress by mutableIntStateOf(0)
    var loading by mutableStateOf(false)
    var canBack by mutableStateOf(false)
    var canForward by mutableStateOf(false)
    var desktop by mutableStateOf(false)
    var blocked by mutableIntStateOf(0)
    var favicon by mutableStateOf<Bitmap?>(null)
    var web: WebView? = null
    var findText by mutableStateOf<String?>(null)
    var findCount by mutableIntStateOf(0)
    var findIndex by mutableIntStateOf(0)
    var pendingUrl: String? = null
    val isStart get() = url.isEmpty()

    @SuppressLint("SetJavaScriptEnabled")
    fun webView(client: android.webkit.WebViewClient, chrome: android.webkit.WebChromeClient, downloads: android.webkit.DownloadListener): WebView {
        web?.let { return it }
        val w = WebView(ctx).apply {
            settings.javaScriptEnabled = true; settings.domStorageEnabled = true; settings.databaseEnabled = true
            settings.setSupportZoom(true); settings.builtInZoomControls = true; settings.displayZoomControls = false
            settings.loadWithOverviewMode = true; settings.useWideViewPort = true; settings.mediaPlaybackRequiresUserGesture = true
            settings.allowFileAccess = false; settings.setGeolocationEnabled(true); settings.javaScriptCanOpenWindowsAutomatically = true; settings.setSupportMultipleWindows(true); settings.safeBrowsingEnabled = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            settings.textZoom = Prefs.textZoom(appContext)
            settings.saveFormData = !veil
            importantForAutofill = android.view.View.IMPORTANT_FOR_AUTOFILL_YES
            webViewClient = client; webChromeClient = chrome; setDownloadListener(downloads)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, !Prefs.blockThirdPartyCookies(appContext))
            applyUa()
        }
        web = w
        return w
    }

    fun applyUa(host: String? = null) {
        val w = web ?: return
        val key = host?.let { SiteRules.ua(appContext, it) } ?: Prefs.uaKey(appContext)
        val ua = UserAgents.string(key, WebSettings.getDefaultUserAgent(appContext), desktop)
        if (w.settings.userAgentString != ua) w.settings.userAgentString = ua
        w.settings.useWideViewPort = true; w.settings.loadWithOverviewMode = true
    }

    fun go(input: String) {
        val u = Browser.resolve(appContext, input)
        url = u; web?.loadUrl(u) ?: run { pendingUrl = u }
    }
    fun destroy() { web?.let { it.stopLoading(); it.destroy() }; web = null }
}

object Browser {
    val tabs = mutableStateListOf<Tab>()
    var current by mutableIntStateOf(0)
    private var next = 1
    val currentTab get() = tabs.getOrNull(current)

    fun resolve(c: Context, input: String): String {
        val s = input.trim()
        return when {
            s.matches(Regex("^[a-zA-Z][a-zA-Z0-9+.-]*://.*")) -> s
            s.startsWith("about:") || s.startsWith("file:") -> s
            s.contains(' ') || !s.contains('.') && !s.startsWith("localhost") -> Prefs.searchUrl(c, s)
            else -> (if (Prefs.upgradeHttps(c)) "https://" else "http://") + s
        }
    }

    fun open(c: Context, url: String? = null, veil: Boolean = Prefs.veilDefault(c), select: Boolean = true): Tab {
        val t = Tab(next++, c.applicationContext, veil)
        tabs.add(t); if (select) current = tabs.lastIndex
        if (url != null) t.go(url)
        return t
    }

    fun close(i: Int) {
        val t = tabs.getOrNull(i) ?: return
        val wasVeil = t.veil
        t.destroy(); tabs.removeAt(i)
        if (current >= tabs.size) current = tabs.lastIndex
        if (wasVeil && tabs.none { it.veil }) wipeVeil(t.appContext)
    }

    /** When the last Veil tab goes, so does everything it left behind. */
    fun wipeVeil(c: Context) {
        CookieManager.getInstance().removeAllCookies(null); CookieManager.getInstance().flush()
        WebStorage.getInstance().deleteAllData()
        runCatching { WebView(c).apply { clearCache(true); clearFormData(); clearHistory(); destroy() } }
    }

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

fun emptyResponse() = WebResourceResponse("text/plain", "utf-8", ByteArrayInputStream(ByteArray(0)))
fun WebResourceRequest.hostOf(): String = url.host ?: ""
