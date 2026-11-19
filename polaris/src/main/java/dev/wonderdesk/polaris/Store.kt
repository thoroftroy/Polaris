package dev.wonderdesk.polaris

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/** One add-on from Mozilla's catalogue. */
data class Addon(val guid: String, val slug: String, val name: String, val summary: String, val iconUrl: String, val users: Long, val rating: Double, val version: String, val xpiUrl: String, val homepage: String)

/** Mozilla's add-on catalogue (addons.mozilla.org) and the update check for what is installed. */
object AddonStore {
    private const val API = "https://addons.mozilla.org/api/v5/addons"
    var updates by mutableStateOf<List<Pair<String, Addon>>>(emptyList())   // extension id -> newer version
    var checking by mutableStateOf(false)
    private val icons = HashMap<String, Bitmap>()

    private fun get(url: String): String {
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 15000; c.readTimeout = 20000; c.setRequestProperty("User-Agent", "Polaris")
        return c.inputStream.bufferedReader().use { it.readText() }
    }

    /** Mozilla sends some text keyed by language; take English, else the first one. */
    private fun text(o: JSONObject, k: String): String {
        val v = o.opt(k)
        return when (v) { is JSONObject -> v.optString("en-US").ifBlank { v.keys().asSequence().firstOrNull()?.let { v.optString(it) } ?: "" }; null, JSONObject.NULL -> ""; else -> v.toString() }
            .replace(Regex("<[^>]+>"), "").replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'").trim()
    }

    private fun parse(o: JSONObject): Addon? {
        val v = o.optJSONObject("current_version") ?: return null
        val file = v.optJSONObject("file") ?: v.optJSONObject("files")?.let { null } ?: return null
        return Addon(o.optString("guid"), o.optString("slug"), text(o, "name"), text(o, "summary"), o.optString("icon_url"), o.optLong("average_daily_users"),
            o.optJSONObject("ratings")?.optDouble("average") ?: 0.0, v.optString("version"), file.optString("url"), o.optString("homepage").takeIf { it != "null" } ?: "")
    }

    /** Search the catalogue; with no text, Mozilla's recommended extensions by popularity. */
    fun search(q: String, page: Int = 1): List<Addon> {
        val base = "$API/search/?app=firefox&type=extension&lang=en-US&sort=users&page_size=25&page=$page"
        val url = if (q.isBlank()) "$base&promoted=recommended" else "$base&q=" + URLEncoder.encode(q, "UTF-8")
        val arr = JSONObject(get(url)).optJSONArray("results") ?: return emptyList()
        return (0 until arr.length()).mapNotNull { parse(arr.getJSONObject(it)) }
    }

    fun byGuid(guid: String): Addon? = runCatching { parse(JSONObject(get("$API/addon/" + URLEncoder.encode(guid, "UTF-8") + "/?lang=en-US"))) }.getOrNull()

    fun icon(url: String): Bitmap? {
        icons[url]?.let { return it }
        return runCatching { BitmapFactory.decodeStream(URL(url).openStream())?.also { icons[url] = it } }.getOrNull()
    }

    /** True when [a] is a newer version than [installed] (numeric dotted compare). */
    fun newer(a: String, installed: String): Boolean {
        fun parts(v: String) = v.split('.', '-').map { it.takeWhile { c -> c.isDigit() }.toLongOrNull() ?: 0L }
        val x = parts(a); val y = parts(installed)
        for (i in 0 until maxOf(x.size, y.size)) { val d = (x.getOrElse(i) { 0 }).compareTo(y.getOrElse(i) { 0 }); if (d != 0) return d > 0 }
        return false
    }

    /** Looks up every installed extension in the catalogue and notes the ones with a newer version. */
    fun check(c: Context) {
        if (checking) return
        checking = true
        Thread {
            val found = mutableListOf<Pair<String, Addon>>()
            for (e in Gecko.extensions.toList()) {
                val a = byGuid(e.id) ?: continue
                if (newer(a.version, e.metaData.version)) found += e.id to a
            }
            updates = found
            Prefs.p(c).edit().putLong("addonCheck", System.currentTimeMillis()).apply()
            checking = false
            if (found.isNotEmpty() && Prefs.autoUpdateAddons(c)) found.forEach { (id, a) -> Gecko.installFromStore(a) }
        }.start()
    }

    /** Checks at most twice a day. */
    fun checkIfDue(c: Context) { if (System.currentTimeMillis() - Prefs.p(c).getLong("addonCheck", 0) > 12 * 3600_000L) check(c) }
}
