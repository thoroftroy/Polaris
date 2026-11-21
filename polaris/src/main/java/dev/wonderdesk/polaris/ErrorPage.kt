package dev.wonderdesk.polaris

import org.mozilla.geckoview.WebRequestError

/** The page shown when a site can't be loaded: what happened in plain words, and what to do about it. */
object ErrorPage {
    private fun esc(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

    fun build(uri: String, e: WebRequestError): String {
        val host = runCatching { android.net.Uri.parse(uri).host }.getOrNull() ?: uri
        val (title, text) = when (e.code) {
            WebRequestError.ERROR_UNKNOWN_HOST -> "Can't find that site" to "There is no site called $host. Check the address for typing mistakes, then check your connection."
            WebRequestError.ERROR_CONNECTION_REFUSED, WebRequestError.ERROR_NET_RESET, WebRequestError.ERROR_NET_INTERRUPT ->
                "Can't connect to $host" to "The site is not accepting connections right now. It may be down, or it may not support secure (https) connections."
            WebRequestError.ERROR_NET_TIMEOUT -> "$host took too long to answer" to "The site may be busy or your connection may be slow. Try again in a moment."
            WebRequestError.ERROR_OFFLINE -> "You're offline" to "Turn on Wi-Fi or mobile data, then try again."
            WebRequestError.ERROR_REDIRECT_LOOP -> "The page keeps redirecting" to "The site sent you around in a circle. Clearing this site's cookies sometimes fixes it."
            WebRequestError.ERROR_PROXY_CONNECTION_REFUSED -> "The proxy isn't answering" to "Polaris is set to use Tor, but Orbot isn't running. Start Orbot or turn Tor off in Settings."
            else -> when (e.category) {
                WebRequestError.ERROR_CATEGORY_SECURITY -> "This connection isn't secure" to "$host's security certificate can't be trusted, so Polaris stopped to keep your information safe. If you're on public Wi-Fi, someone may be interfering. Check that your phone's date and time are right."
                WebRequestError.ERROR_CATEGORY_SAFEBROWSING -> "Blocked for your safety" to "$host is on a list of sites that spread harmful software or try to steal information."
                else -> "This page didn't load" to "Something went wrong while opening $host."
            }
        }
        val secure = e.category == WebRequestError.ERROR_CATEGORY_SECURITY || e.category == WebRequestError.ERROR_CATEGORY_SAFEBROWSING
        val http = if (uri.startsWith("https://") && !secure && e.code != WebRequestError.ERROR_UNKNOWN_HOST && e.code != WebRequestError.ERROR_OFFLINE)
            "<a class=b2 href=\"http://${esc(uri.removePrefix("https://"))}\">Try the unsecured (http) version</a><p class=s>Only do this for sites where you won't type a password.</p>" else ""
        val html = """<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>
:root{color-scheme:light dark}body{margin:0;font:17px/1.5 system-ui,sans-serif;background:linear-gradient(#e9f2fc,#cfe0f5);color:#1b2a3d;min-height:100vh;display:flex;align-items:center;justify-content:center}
@media(prefers-color-scheme:dark){body{background:linear-gradient(#162038,#0b1224);color:#e6edf8}.c{background:#1c2a47!important}.s,.t{color:#9fb2d0!important}.b2{color:#8ab4ff!important}}
.c{max-width:420px;margin:24px;padding:28px 24px;background:#fff;border-radius:22px;box-shadow:0 8px 30px #0003}h1{font-size:23px;margin:0 0 10px}p{margin:0 0 18px}.t{color:#5a6b82;font-size:13px}.s{color:#5a6b82;font-size:13px;margin:6px 0 0}
.b{display:block;text-align:center;padding:13px;border-radius:14px;background:linear-gradient(#5aa8ff,#1f6fe0);color:#fff;font-weight:600;text-decoration:none}.b2{display:block;text-align:center;margin-top:14px;color:#1f6fe0;text-decoration:none;font-weight:600}
</style></head><body><div class=c><h1>${esc(title)}</h1><p>${esc(text)}</p><a class=b href="${esc(uri)}">Try again</a>$http<p class=t style="margin-top:18px">${esc(uri.take(120))}</p></div></body></html>"""
        return "data:text/html;charset=utf-8," + java.net.URLEncoder.encode(html, "UTF-8").replace("+", "%20")
    }
}
