package dev.wonderdesk.polaris

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONArray
import org.json.JSONObject
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
    /** 0 standard, 1 strict tracking protection. */
    fun strict(c: Context) = p(c).getBoolean("strict", false)
    fun tor(c: Context) = p(c).getBoolean("tor", false)
    fun autoUpdateAddons(c: Context) = p(c).getBoolean("addonAuto", true)
    fun flash(c: Context) = p(c).getBoolean("flash", true)
    fun upgradeHttps(c: Context) = p(c).getBoolean("https", true)
    fun uaKey(c: Context) = p(c).getString("ua", "default") ?: "default"
    fun clearOnExit(c: Context) = p(c).getBoolean("clearOnExit", false)
    fun textZoom(c: Context) = p(c).getInt("textZoom", 100)
    // Start page
    fun homePins(c: Context) = p(c).getBoolean("homePins", true)
    fun homeBookmarks(c: Context) = p(c).getBoolean("homeBookmarks", true)
    fun homeRecent(c: Context) = p(c).getBoolean("homeRecent", true)
    fun homeVeilSwitch(c: Context) = p(c).getBoolean("homeVeilSwitch", true)
    fun homeColumns(c: Context) = p(c).getInt("homeColumns", 4)
}

/** Which browser the page is told it is talking to. */
object UserAgents {
    val LIST = listOf(
        "default" to "Polaris (honest)", "chrome-win" to "Chrome on Windows", "firefox-linux" to "Firefox on Linux", "chrome-android" to "Chrome on Android",
        "safari-iphone" to "Safari on iPhone", "safari-mac" to "Safari on Mac",
    )
    private const val CHROME = "Chrome/131.0.0.0"
    /** The user-agent text for a disguise, or null to leave Firefox's own. */
    fun override(key: String): String? = when (key) { "default" -> null; else -> string(key, "", false) }
    fun string(key: String, default: String, desktopMode: Boolean): String = when (key) {
        "chrome-win" -> "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Safari/537.36"
        "firefox-linux" -> "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0"
        "chrome-android" -> "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Mobile Safari/537.36"
        "safari-iphone" -> "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        "safari-mac" -> "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
        else -> if (desktopMode) "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) $CHROME Safari/537.36" else default.replace("; wv", "")
    }
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
    /** Writing the whole file takes a moment, so it happens in the background a little after the last change, never while you are browsing. */
    private var pendingSave: java.util.concurrent.ScheduledFuture<*>? = null
    @Synchronized fun save() {
        pendingSave?.cancel(false)
        pendingSave = writer.schedule({ flushNow() }, 1500, java.util.concurrent.TimeUnit.MILLISECONDS)
    }
    private fun flushNow() {
        val snapshot = synchronized(this) { cache?.toList() } ?: return
        runCatching { file.writeText(JSONArray(snapshot.map { JSONObject().put("u", it.url).put("t", it.title).put("a", it.at) }).toString()) }
    }
    /** First few entries whose address or title contains [q], newest first. Stops as soon as it has enough. */
    fun search(q: String, max: Int): List<Entry> {
        val snapshot = synchronized(this) { all().toList() }
        val out = ArrayList<Entry>(max)
        for (e in snapshot) { if (e.url.contains(q, true) || e.title.contains(q, true)) { if (out.none { it.url == e.url }) out.add(e); if (out.size >= max) break } }
        return out
    }
    companion object { private val writer = java.util.concurrent.Executors.newSingleThreadScheduledExecutor { r -> Thread(r, "polaris-store").apply { isDaemon = true } } }
    @Synchronized fun add(e: Entry, unique: Boolean) { all(); val l = cache!!; if (unique) l.removeAll { it.url == e.url }; l.add(0, e); while (l.size > cap) l.removeAt(l.lastIndex); save() }
    @Synchronized fun remove(url: String) { all(); cache!!.removeAll { it.url == url }; save() }
    @Synchronized fun clear() { all(); cache!!.clear(); save() }
    @Synchronized fun updateTitle(url: String, title: String) { all(); val i = cache!!.indexOfFirst { it.url == url }; if (i >= 0 && title.isNotBlank()) { cache!![i] = cache!![i].copy(title = title); save() } }
}

object Library {
    lateinit var history: EntryStore
    lateinit var bookmarks: EntryStore
    lateinit var pins: EntryStore
    fun init(c: Context) { if (!::history.isInitialized) { history = EntryStore(File(c.filesDir, "history.json"), 20000); bookmarks = EntryStore(File(c.filesDir, "bookmarks.json"), 5000); pins = EntryStore(File(c.filesDir, "pins.json"), 40) } }

    /** Reads the standard bookmarks file every browser can export (Chrome, Firefox, Edge, Safari, Brave). */
    fun importHtml(html: String): List<Entry> = Regex("<A\\s+[^>]*?HREF=\"([^\"]+)\"[^>]*>(.*?)</A>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)).findAll(html)
        .map { Entry(it.groupValues[1], it.groupValues[2].replace(Regex("<[^>]+>"), "").trim(), System.currentTimeMillis()) }.filter { it.url.startsWith("http") }.toList()
}

