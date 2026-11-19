package dev.wonderdesk.polaris

import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout

/** A site installed on the home screen: just the page, full screen, no browser around it. */
class SiteActivity : Activity() {
    private var tab: Tab? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Library.init(this); AdBlock.load(this)
        val url = intent.dataString ?: return finish()
        val t = Tab(-1, applicationContext, veil = false).also { tab = it }
        t.ctx.setBaseContext(this)
        val (c, ch, d) = clients(this, t)
        val w = t.webView(c, ch, d)
        setContentView(FrameLayout(this).apply { addView(w, ViewGroup.LayoutParams(-1, -1)) })
        w.loadUrl(url)
        title = Uri.parse(url).host
    }
    @Deprecated("Deprecated in Java") override fun onBackPressed() { val w = tab?.web; if (w != null && w.canGoBack()) w.goBack() else finish() }
    override fun onDestroy() { tab?.destroy(); super.onDestroy() }
}
