package dev.wonderdesk.polaris

import android.app.Activity
import android.net.Uri
import android.os.Bundle
import org.mozilla.geckoview.BasicSelectionActionDelegate
import org.mozilla.geckoview.GeckoView

/** A site installed on the home screen: just the page, full screen, no browser around it. */
class SiteActivity : Activity() {
    private var tab: Tab? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Hooks.appContext = applicationContext
        Library.init(this); Gecko.init(this)
        val url = intent.dataString ?: return finish()
        val t = Tab(-1, applicationContext, veil = false).also { tab = it }
        val gv = GeckoView(this).also { it.setAutofillEnabled(true) }
        t.ensureOpen(); gv.setSession(t.session); t.view = gv
        t.session.setSelectionActionDelegate(BasicSelectionActionDelegate(this))
        setContentView(gv)
        t.go(url)
        title = Uri.parse(url).host
    }
    @Deprecated("Deprecated in Java") override fun onBackPressed() { val t = tab; if (t != null && t.canBack) t.session.goBack() else finish() }
    override fun onDestroy() { tab?.destroy(); super.onDestroy() }
}
