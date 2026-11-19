package dev.wonderdesk.polaris

import android.Manifest
import android.app.Activity
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import dev.wonderdesk.shared.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.DateFormat
import java.util.Date

/** Things the page asks for that need the screen: leaving for an app, full-screen video, permissions, file pickers. */
object Hooks {
    class AppAsk(val url: String, val host: String, val label: String, val pkg: String)
    var appAsk by mutableStateOf<AppAsk?>(null)
    var customView by mutableStateOf<View?>(null)
    var customCallback: WebChromeClient.CustomViewCallback? = null
    var toast: (String) -> Unit = {}
    var filePick: ((Array<String>, ValueCallback<Array<Uri>>?) -> Unit)? = null
    var permAsk: ((PermissionRequest) -> Unit)? = null
    var geoAsk: ((String, GeolocationPermissions.Callback) -> Unit)? = null
}

class MainActivity : WonderActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        Library.init(this); AdBlock.load(this)
        super.onCreate(savedInstanceState)
        handle(intent, first = true)
    }
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); handle(intent, first = false) }
    override fun onPause() { super.onPause(); Browser.saveSession(this) }
    override fun onDestroy() { if (isFinishing && Prefs.clearOnExit(this)) { Library.history.clear(); Browser.wipeVeil(this) }; super.onDestroy() }

    private fun handle(i: Intent?, first: Boolean) {
        val url = when (i?.action) {
            Intent.ACTION_VIEW -> i.dataString
            Intent.ACTION_WEB_SEARCH -> i.getStringExtra("query")
            Intent.ACTION_SEND -> i.getStringExtra(Intent.EXTRA_TEXT)
            else -> null
        }
        if (url != null) Browser.open(this, url) else if (first) { Browser.restoreSession(this); if (Browser.tabs.isEmpty()) Browser.open(this) }
    }

    @Composable override fun Content() = PolarisApp(this)
}

enum class Screen { Browser, Tabs, History, Bookmarks, Settings, Sites }

/** One client per tab: blocks ads, hands links to apps, keeps history, and reports progress. */
fun clients(act: Activity, tab: Tab): Triple<WebViewClient, WebChromeClient, DownloadListener> {
    val client = object : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
            if (!Prefs.adBlock(act)) return null
            val host = request.url.host ?: return null
            if (host != Uri.parse(tab.url).host && AdBlock.blocked(host)) { tab.blocked++; return emptyResponse() }
            return null
        }
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val u = request.url; val scheme = u.scheme ?: return false
            if (scheme == "http" || scheme == "https") {
                val host = u.host ?: return false
                if (!request.isForMainFrame) return false
                val rule = SiteRules.app(act, host)
                if (rule == "never") { tab.applyUa(host); return false }
                if (rule == "always" || rule == "ask") {
                    val app = appFor(act, u)
                    if (app != null) {
                        if (rule == "always") { runCatching { act.startActivity(Intent(Intent.ACTION_VIEW, u).setPackage(app.first).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }; return true }
                        Hooks.appAsk = Hooks.AppAsk(u.toString(), host, app.second, app.first); return true
                    }
                }
                tab.applyUa(host)
                return false
            }
            // intent:, market:, mailto:, tel: and friends
            runCatching {
                val i = if (scheme == "intent") Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME) else Intent(Intent.ACTION_VIEW, u)
                i.addCategory(Intent.CATEGORY_BROWSABLE); i.component = null; i.selector = null; i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                act.startActivity(i)
            }.onFailure { (u.getQueryParameter("browser_fallback_url") ?: u.toString().substringAfter("S.browser_fallback_url=", "").substringBefore(";").takeIf { it.isNotBlank() }?.let { Uri.decode(it) })?.let { view.loadUrl(it) } }
            return true
        }
        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) { tab.loading = true; tab.url = url; tab.blocked = 0; tab.favicon = favicon ?: tab.favicon; tab.canBack = view.canGoBack(); tab.canForward = view.canGoForward() }
        override fun onPageFinished(view: WebView, url: String) {
            tab.loading = false; tab.url = url; tab.title = view.title ?: tab.title; tab.canBack = view.canGoBack(); tab.canForward = view.canGoForward()
            if (Prefs.adBlock(act) && Prefs.hideCosmetic(act)) view.evaluateJavascript("(function(){var s=document.createElement('style');s.textContent=\"${AdBlock.CSS}\";document.head&&document.head.appendChild(s)})()", null)
            if (!tab.veil && url.startsWith("http")) Library.history.add(Entry(url, tab.title, System.currentTimeMillis()), unique = false)
        }
        override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) { tab.canBack = view.canGoBack(); tab.canForward = view.canGoForward() }
    }
    val chrome = object : WebChromeClient() {
        override fun onProgressChanged(view: WebView, p: Int) { tab.progress = p }
        override fun onReceivedTitle(view: WebView, title: String) { tab.title = title; if (!tab.veil) Library.history.updateTitle(view.url ?: "", title) }
        override fun onReceivedIcon(view: WebView, icon: Bitmap?) { tab.favicon = icon }
        override fun onShowCustomView(v: View, cb: CustomViewCallback) { Hooks.customView = v; Hooks.customCallback = cb }
        override fun onHideCustomView() { Hooks.customView = null; Hooks.customCallback?.onCustomViewHidden(); Hooks.customCallback = null }
        override fun onPermissionRequest(r: PermissionRequest) { Hooks.permAsk?.invoke(r) ?: r.deny() }
        override fun onGeolocationPermissionsShowPrompt(origin: String, cb: GeolocationPermissions.Callback) { Hooks.geoAsk?.invoke(origin, cb) ?: cb.invoke(origin, false, false) }
        override fun onShowFileChooser(w: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean { Hooks.filePick?.invoke(p.acceptTypes.filter { it.isNotBlank() }.toTypedArray().ifEmpty { arrayOf("*/*") }, cb); return true }
        override fun onJsAlert(v: WebView, url: String, message: String, r: JsResult): Boolean { android.app.AlertDialog.Builder(act).setMessage(message).setPositiveButton("OK") { _, _ -> r.confirm() }.setOnCancelListener { r.cancel() }.show(); return true }
        override fun onJsConfirm(v: WebView, url: String, message: String, r: JsResult): Boolean { android.app.AlertDialog.Builder(act).setMessage(message).setPositiveButton("OK") { _, _ -> r.confirm() }.setNegativeButton("Cancel") { _, _ -> r.cancel() }.setOnCancelListener { r.cancel() }.show(); return true }
        override fun onCreateWindow(v: WebView, dialog: Boolean, userGesture: Boolean, msg: android.os.Message): Boolean {
            val t = Browser.open(act, null, veil = tab.veil)
            val w = t.webView(clients(act, t).first, clients(act, t).second, clients(act, t).third)
            (msg.obj as WebView.WebViewTransport).webView = w; msg.sendToTarget(); return true
        }
    }
    val dl = DownloadListener { url, ua, cd, mime, _ ->
        runCatching {
            val name = URLUtil.guessFileName(url, cd, mime)
            val req = DownloadManager.Request(Uri.parse(url)).setMimeType(mime).addRequestHeader("User-Agent", ua)
                .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url) ?: "").setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
            act.getSystemService(DownloadManager::class.java).enqueue(req)
            Hooks.toast("Downloading $name")
        }.onFailure { Hooks.toast("Couldn't start the download") }
    }
    return Triple(client, chrome, dl)
}

/** An installed app (not a browser) that handles this link, if any: package and name. */
fun appFor(c: android.content.Context, u: Uri): Pair<String, String>? {
    val pm = c.packageManager
    val browsers = pm.queryIntentActivities(Intent(Intent.ACTION_VIEW, Uri.parse("https://example.invalid/")).addCategory(Intent.CATEGORY_BROWSABLE), PackageManager.MATCH_ALL).map { it.activityInfo.packageName }.toSet()
    val handlers = pm.queryIntentActivities(Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE), PackageManager.MATCH_ALL).map { it.activityInfo.packageName }.filter { it !in browsers && it != c.packageName }.distinct()
    val pkg = handlers.firstOrNull() ?: return null
    return pkg to (runCatching { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() }.getOrDefault(pkg))
}

fun screenshot(c: android.content.Context, w: WebView): Boolean = runCatching {
    val b = Bitmap.createBitmap(w.width, w.height, Bitmap.Config.ARGB_8888); w.draw(Canvas(b))
    val values = ContentValues().apply { put(MediaStore.Images.Media.DISPLAY_NAME, "Polaris " + System.currentTimeMillis() + ".png"); put(MediaStore.Images.Media.MIME_TYPE, "image/png"); put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Polaris") }
    val uri = c.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)!!
    c.contentResolver.openOutputStream(uri)!!.use { b.compress(Bitmap.CompressFormat.PNG, 100, it) }
}.isSuccess

fun addToHome(c: android.content.Context, tab: Tab) {
    val url = tab.url; if (!url.startsWith("http")) return
    val name = tab.title.ifBlank { Uri.parse(url).host ?: "Site" }.take(24)
    val icon = tab.favicon?.let { IconCompat.createWithBitmap(Bitmap.createScaledBitmap(it, 192, 192, true)) } ?: IconCompat.createWithBitmap(letterIcon(name))
    val info = ShortcutInfoCompat.Builder(c, "site-" + url.hashCode()).setShortLabel(name).setIcon(icon)
        .setIntent(Intent(c, SiteActivity::class.java).setAction(Intent.ACTION_VIEW).setData(Uri.parse(url))).build()
    ShortcutManagerCompat.requestPinShortcut(c, info, null)
}

fun letterIcon(name: String): Bitmap {
    val b = Bitmap.createBitmap(192, 192, Bitmap.Config.ARGB_8888); val c = Canvas(b)
    val p = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG); p.color = 0xFF1E7FE8.toInt(); c.drawRoundRect(0f, 0f, 192f, 192f, 44f, 44f, p)
    p.color = android.graphics.Color.WHITE; p.textSize = 110f; p.textAlign = android.graphics.Paint.Align.CENTER; p.isFakeBoldText = true
    c.drawText(name.firstOrNull()?.uppercase() ?: "P", 96f, 132f, p); return b
}

@Composable
fun PolarisApp(act: MainActivity) = WonderKitTheme {
    val context = LocalContext.current
    val p = wonderPalette()
    var screen by remember { mutableStateOf(Screen.Browser) }
    var menu by remember { mutableStateOf(false) }
    var siteDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val tab = Browser.currentTab
    LaunchedEffect(Unit) { Hooks.toast = { m -> android.widget.Toast.makeText(context, m, android.widget.Toast.LENGTH_SHORT).show() } }
    // File picker and permissions the page may ask for.
    var fileCb by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris -> fileCb?.onReceiveValue(uris.toTypedArray()); fileCb = null }
    var permReq by remember { mutableStateOf<PermissionRequest?>(null) }
    var geo by remember { mutableStateOf<Pair<String, GeolocationPermissions.Callback>?>(null) }
    val permLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
        permReq?.let { r -> if (res.values.all { it }) r.grant(r.resources) else r.deny() }; permReq = null
        geo?.let { (o, cb) -> cb.invoke(o, res.values.any { it }, false) }; geo = null
    }
    LaunchedEffect(Unit) {
        Hooks.filePick = { types, cb -> fileCb?.onReceiveValue(null); fileCb = cb; picker.launch(types) }
        Hooks.permAsk = { r ->
            val need = r.resources.mapNotNull { when (it) { PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA; PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO; else -> null } }.filter { context.checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
            if (need.isEmpty()) r.grant(r.resources) else { permReq = r; permLauncher.launch(need.toTypedArray()) }
        }
        Hooks.geoAsk = { o, cb -> if (context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) cb.invoke(o, true, false) else { geo = o to cb; permLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)) } }
    }
    BackHandler(enabled = Hooks.customView != null || screen != Screen.Browser || tab?.canBack == true) {
        when { Hooks.customView != null -> Hooks.customCallback?.onCustomViewHidden().also { Hooks.customView = null }; screen != Screen.Browser -> screen = Screen.Browser; else -> tab?.web?.goBack() }
    }
    Box(Modifier.fillMaxSize().background(p.window)) {
        when (screen) {
            Screen.Tabs -> TabsScreen(onBack = { screen = Screen.Browser })
            Screen.History -> HistoryScreen(onBack = { screen = Screen.Browser }, open = { Browser.currentTab?.go(it); screen = Screen.Browser })
            Screen.Bookmarks -> BookmarksScreen(onBack = { screen = Screen.Browser }, open = { Browser.currentTab?.go(it); screen = Screen.Browser })
            Screen.Settings -> SettingsScreen(onBack = { screen = Screen.Browser }, sites = { screen = Screen.Sites })
            Screen.Sites -> SitesScreen(onBack = { screen = Screen.Settings })
            Screen.Browser -> Column(Modifier.fillMaxSize()) {
                if (tab != null) {
                    TopBar(tab, onMenu = { menu = true }, onHome = { tab.web?.stopLoading(); tab.url = ""; tab.title = "" })
                    Box(Modifier.weight(1f).fillMaxWidth()) {
                        if (tab.isStart) StartPage(tab) else key(tab.id) {
                            AndroidView({ _ -> tab.ctx.baseContext.let { tab.ctx.setBaseContext(act) }; val (c, ch, d) = clients(act, tab); tab.webView(c, ch, d).also { w -> (w.parent as? android.view.ViewGroup)?.removeView(w); tab.pendingUrl?.let { u -> w.loadUrl(u); tab.pendingUrl = null } } }, Modifier.fillMaxSize())
                        }
                        Hooks.customView?.let { v -> AndroidView({ _ -> FrameLayout(act).apply { setBackgroundColor(android.graphics.Color.BLACK); (v.parent as? android.view.ViewGroup)?.removeView(v); addView(v) } }, Modifier.fillMaxSize()) }
                        DropdownMenu(menu, { menu = false }, Modifier.background(p.panel)) { BrowserMenu(tab, { menu = false }, { screen = it }, { siteDialog = true }) }
                    }
                    BottomBar(tab, onTabs = { screen = Screen.Tabs })
                }
            }
        }
    }
    Hooks.appAsk?.let { a ->
        WonderDialog(onDismissRequest = { Hooks.appAsk = null }, title = { Text("Open in ${a.label}?") }, text = { Text("${a.host} can open in the ${a.label} app.") }, confirmButton = {
            TextButton(onClick = { Hooks.appAsk = null; runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(a.url)).setPackage(a.pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }) { Text("Open app") }
        }, dismissButton = {
            Row { TextButton(onClick = { Hooks.appAsk = null; Browser.currentTab?.web?.loadUrl(a.url) }) { Text("Stay here") }
                TextButton(onClick = { SiteRules.set(context, a.host, "always", null); Hooks.appAsk = null; runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(a.url)).setPackage(a.pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }) { Text("Always") }
                TextButton(onClick = { SiteRules.set(context, a.host, "never", null); Hooks.appAsk = null; Browser.currentTab?.web?.loadUrl(a.url) }) { Text("Never") } }
        })
    }
    if (siteDialog && tab != null) SiteDialog(tab) { siteDialog = false }
}

@Composable
private fun TopBar(tab: Tab, onMenu: () -> Unit, onHome: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    var text by remember(tab.id, tab.url) { mutableStateOf(tab.url) }
    var focused by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(p.accent.lighten(.25f), p.accent, p.accent.darken(.12f)))).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onHome) { Icon(WonderIcons.Home, "Start page", tint = Color.White) }
            Row(Modifier.weight(1f).height(40.dp).clip(RoundedCornerShape(20.dp)).background(Color.White.copy(alpha = .92f)).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(if (tab.url.startsWith("https")) WonderIcons.Lock else WonderIcons.Language, null, Modifier.size(16.dp), tint = if (tab.url.startsWith("https")) Color(0xFF2E9E44) else Color(0xFF666666))
                Spacer(Modifier.width(8.dp))
                if (tab.veil) Text("Veil", Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFF5B4BC4)).padding(horizontal = 6.dp, vertical = 1.dp), color = Color.White, fontSize = 11.sp).also { Spacer(Modifier.width(6.dp)) }
                BasicTextField(if (focused) text else (Uri.parse(tab.url).host?.removePrefix("www.") ?: tab.url), { text = it }, Modifier.weight(1f).onFocusChanged { focused = it.isFocused },
                    singleLine = true, textStyle = androidx.compose.ui.text.TextStyle(color = Color(0xFF111111), fontSize = 15.sp), cursorBrush = SolidColor(p.accent),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go), keyboardActions = KeyboardActions(onGo = { tab.go(text) }))
                IconButton(onClick = { if (tab.loading) tab.web?.stopLoading() else tab.web?.reload() }, Modifier.size(28.dp)) { Icon(if (tab.loading) WonderIcons.Close else WonderIcons.Refresh, null, Modifier.size(18.dp), tint = Color(0xFF444444)) }
            }
            IconButton(onClick = onMenu) { Icon(WonderIcons.MoreVert, "Menu", tint = Color.White) }
        }
        if (tab.loading) LinearProgressIndicator(progress = { tab.progress / 100f }, Modifier.fillMaxWidth().height(2.dp), color = Color.White, trackColor = Color.Transparent)
        else Spacer(Modifier.height(2.dp))
    }
}

@Composable
private fun BottomBar(tab: Tab, onTabs: () -> Unit) {
    val p = wonderPalette()
    Row(Modifier.fillMaxWidth().background(p.panel).navigationBarsPadding().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceAround, verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = { tab.web?.goBack() }, enabled = tab.canBack) { Icon(WonderIcons.ArrowBack, "Back", tint = if (tab.canBack) p.accent else p.secondaryText.copy(alpha = .4f)) }
        IconButton(onClick = { tab.web?.goForward() }, enabled = tab.canForward) { Icon(WonderIcons.ArrowForward, "Forward", tint = if (tab.canForward) p.accent else p.secondaryText.copy(alpha = .4f)) }
        if (tab.blocked > 0) Text("${tab.blocked} blocked", color = p.secondaryText, fontSize = 12.sp)
        Box(Modifier.size(34.dp).clip(RoundedCornerShape(9.dp)).border(2.dp, p.accent, RoundedCornerShape(9.dp)).clickable(onClick = onTabs), contentAlignment = Alignment.Center) { Text("${Browser.tabs.size}", color = p.accent, fontWeight = FontWeight.Bold, fontSize = 14.sp) }
    }
}

@Composable
private fun BrowserMenu(tab: Tab, close: () -> Unit, go: (Screen) -> Unit, site: () -> Unit) {
    val context = LocalContext.current
    val bookmarked = Library.bookmarks.all().any { it.url == tab.url }
    fun item(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) = @Composable { DropdownMenuItem({ Text(label) }, { close(); onClick() }, leadingIcon = { Icon(icon, null) }) }
    item("New tab", WonderIcons.Add) { Browser.open(context, veil = false) }()
    item("New Veil tab", WonderIcons.VisibilityOff) { Browser.open(context, veil = true) }()
    if (tab.url.startsWith("http")) item(if (bookmarked) "Remove bookmark" else "Bookmark this page", if (bookmarked) WonderIcons.Bookmark else WonderIcons.BookmarkBorder) {
        if (bookmarked) Library.bookmarks.remove(tab.url) else Library.bookmarks.add(Entry(tab.url, tab.title.ifBlank { tab.url }, System.currentTimeMillis()), unique = true)
    }()
    item("Bookmarks", WonderIcons.Star) { go(Screen.Bookmarks) }()
    item("History", WonderIcons.History) { go(Screen.History) }()
    HorizontalDivider()
    DropdownMenuItem({ Text(if (tab.desktop) "Mobile site" else "Desktop site") }, { close(); tab.desktop = !tab.desktop; tab.applyUa(Uri.parse(tab.url).host); tab.web?.reload() }, leadingIcon = { Icon(WonderIcons.Language, null) })
    item("This site…", WonderIcons.Tune, site)()
    item("Add to home screen", WonderIcons.Apps) { addToHome(context, tab) }()
    item("Screenshot", WonderIcons.PhotoCamera) { Hooks.toast(if (tab.web?.let { screenshot(context, it) } == true) "Saved to Pictures/Polaris" else "Couldn't save the screenshot") }()
    item("Share", WonderIcons.Share) { context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, tab.url), "Share").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }()
    HorizontalDivider()
    item("Passwords (Vault)", WonderIcons.Key) { context.packageManager.getLaunchIntentForPackage("dev.wonderdesk.vault")?.let { context.startActivity(it) } ?: Hooks.toast("Install Wonderdesk Vault to manage passwords") }()
    item("Settings", WonderIcons.Settings) { go(Screen.Settings) }()
}

@Composable
private fun SiteDialog(tab: Tab, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val host = Uri.parse(tab.url).host ?: return onDismiss()
    var app by remember { mutableStateOf(SiteRules.app(context, host) ?: "default") }
    var ua by remember { mutableStateOf(SiteRules.ua(context, host) ?: "default") }
    WonderDialog(onDismissRequest = onDismiss, title = { Text(host) }, text = {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Links to this site", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("default" to "Stay in Polaris", "always" to "Always open the app", "ask" to "Ask me", "never" to "Never open the app").forEach { (k, l) -> Chip(l, app == k, { app = k; SiteRules.set(context, host, k, null) }) }
            }
            Text("Pretend to be", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                UserAgents.LIST.forEach { (k, l) -> Chip(l, ua == k, { ua = k; SiteRules.set(context, host, null, k); tab.applyUa(host); tab.web?.reload() }) }
            }
        }
    }, confirmButton = { TextButton(onClick = onDismiss) { Text("Done") } })
}

@Composable
private fun StartPage(tab: Tab) {
    val context = LocalContext.current
    val p = wonderPalette()
    var q by remember { mutableStateOf("") }
    val marks = remember { Library.bookmarks.all().take(8) }
    val recent = remember { Library.history.all().distinctBy { it.url }.take(5) }
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(p.accent.darken(.45f), p.accent.darken(.2f), p.window)))) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(36.dp))
            Image(androidx.compose.ui.res.painterResource(dev.wonderdesk.shared.R.drawable.wonderdesk_polaris_icon), "Polaris", Modifier.size(96.dp))
            Text("Polaris", Modifier.padding(top = 8.dp), style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.SemiBold), color = Color.White)
            Text(if (tab.veil) "Veil tab: nothing from here is remembered" else "Search with ${Prefs.engine(context)}", color = Color.White.copy(alpha = .75f), style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(20.dp))
            Row(Modifier.fillMaxWidth().height(50.dp).clip(RoundedCornerShape(25.dp)).background(Color.White.copy(alpha = .95f)).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(WonderIcons.Search, null, tint = Color(0xFF666666)); Spacer(Modifier.width(10.dp))
                BasicTextField(q, { q = it }, Modifier.weight(1f), singleLine = true, textStyle = androidx.compose.ui.text.TextStyle(fontSize = 17.sp, color = Color(0xFF111111)), cursorBrush = SolidColor(p.accent),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), keyboardActions = KeyboardActions(onSearch = { if (q.isNotBlank()) tab.go(q) }),
                    decorationBox = { inner -> if (q.isEmpty()) Text("Search or type a web address", color = Color(0xFF888888), fontSize = 17.sp); inner() })
            }
            if (marks.isNotEmpty()) {
                Spacer(Modifier.height(26.dp))
                Text("Bookmarks", Modifier.align(Alignment.Start), color = Color.White.copy(alpha = .8f), style = MaterialTheme.typography.labelLarge)
                marks.chunked(4).forEach { row ->
                    Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { m -> Column(Modifier.weight(1f).clip(RoundedCornerShape(14.dp)).clickable { tab.go(m.url) }.padding(6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(Modifier.size(48.dp).clip(CircleShape).background(Color.White.copy(alpha = .2f)), contentAlignment = Alignment.Center) { Text((m.title.firstOrNull() ?: '•').uppercase(), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold) }
                            Text(m.title.ifBlank { m.url }, color = Color.White, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
                        } }
                        repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
            if (recent.isNotEmpty() && !tab.veil) {
                Spacer(Modifier.height(22.dp))
                Text("Recently visited", Modifier.align(Alignment.Start), color = Color.White.copy(alpha = .8f), style = MaterialTheme.typography.labelLarge)
                recent.forEach { e -> Text(e.title.ifBlank { e.url }, Modifier.fillMaxWidth().clickable { tab.go(e.url) }.padding(vertical = 8.dp), color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis) }
            }
        }
    }
}

@Composable
private fun TabsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    WonderScreen("Tabs (${Browser.tabs.size})", onBack, actions = {
        TextButton(onClick = { Browser.open(context, veil = false); onBack() }) { Text("New", color = Color.White) }
        TextButton(onClick = { Browser.open(context, veil = true); onBack() }) { Text("New Veil", color = Color.White) }
    }) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(Browser.tabs.toList(), key = { it.id }) { t ->
                val on = Browser.tabs.indexOf(t) == Browser.current
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(if (on) p.accent.copy(alpha = .18f) else p.panel).border(1.dp, if (on) p.accent else p.panelBorder, RoundedCornerShape(14.dp))
                    .clickable { Browser.current = Browser.tabs.indexOf(t); onBack() }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) { if (t.veil) Text("Veil  ", color = Color(0xFF8E7BE8), fontWeight = FontWeight.Bold, fontSize = 12.sp); Text(t.title.ifBlank { if (t.isStart) "Start page" else t.url }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleSmall) }
                        Text(t.url.ifBlank { "Polaris" }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText)
                    }
                    IconButton(onClick = { Browser.close(Browser.tabs.indexOf(t)); if (Browser.tabs.isEmpty()) { Browser.open(context); onBack() } }) { Icon(WonderIcons.Close, "Close tab") }
                }
            }
        }
    }
}

@Composable
fun WonderScreen(title: String, onBack: () -> Unit, actions: @Composable RowScope.() -> Unit = {}, content: @Composable () -> Unit) {
    val p = wonderPalette()
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(p.accent.lighten(.25f), p.accent, p.accent.darken(.12f)))).statusBarsPadding().padding(horizontal = 4.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(WonderIcons.ArrowBack, "Back", tint = Color.White) }
            Text(title, Modifier.weight(1f), color = Color.White, style = MaterialTheme.typography.titleLarge, maxLines = 1)
            actions()
        }
        Box(Modifier.weight(1f)) { content() }
    }
}

@Composable
private fun HistoryScreen(onBack: () -> Unit, open: (String) -> Unit) {
    val p = wonderPalette()
    var q by remember { mutableStateOf("") }
    var tick by remember { mutableIntStateOf(0) }
    val list = remember(q, tick) { Library.history.all().filter { q.isBlank() || it.title.contains(q, true) || it.url.contains(q, true) } }
    val byDay = remember(list) { list.groupBy { DateFormat.getDateInstance(DateFormat.FULL).format(Date(it.at)) } }
    WonderScreen("History", onBack, actions = { TextButton(onClick = { Library.history.clear(); tick++ }) { Text("Clear", color = Color.White) } }) {
        Column(Modifier.fillMaxSize()) {
            Box(Modifier.padding(12.dp)) { Field(q, { q = it }, "Search your history") }
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 12.dp)) {
                byDay.forEach { (day, entries) ->
                    item(key = "d$day") { SectionLabel(day, Modifier.padding(top = 10.dp, bottom = 4.dp)) }
                    items(entries.take(300), key = { "${it.at}-${it.url}" }) { e ->
                        Column(Modifier.fillMaxWidth().clickable { open(e.url) }.padding(vertical = 8.dp)) {
                            Text(e.title.ifBlank { e.url }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyLarge)
                            Text(DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(e.at)) + " · " + e.url, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText)
                        }
                    }
                }
                if (list.isEmpty()) item { Text(if (q.isBlank()) "Nothing here yet. Pages you visit in normal tabs are listed here; Veil tabs leave nothing." else "No matches", Modifier.padding(24.dp), color = p.secondaryText) }
            }
        }
    }
}

@Composable
private fun BookmarksScreen(onBack: () -> Unit, open: (String) -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    var tick by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) scope.launch {
            val n = withContext(Dispatchers.IO) { runCatching { Library.importHtml(context.contentResolver.openInputStream(uri)!!.bufferedReader().readText()).also { l -> l.forEach { Library.bookmarks.add(it, unique = true) } }.size }.getOrDefault(0) }
            Hooks.toast(if (n > 0) "Imported $n bookmarks" else "No bookmarks found in that file"); tick++
        }
    }
    val list = remember(tick) { Library.bookmarks.all() }
    WonderScreen("Bookmarks", onBack, actions = { TextButton(onClick = { importer.launch(arrayOf("text/html", "*/*")) }) { Text("Import", color = Color.White) } }) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp)) {
            item { if (list.isEmpty()) Panel(footer = "Export bookmarks as an HTML file from Chrome, Firefox, Edge, Safari or Brave, then choose Import.") { ListRow("Import bookmarks", subtitle = "From any other browser", icon = WonderIcons.UploadFile, tint = Color(0xFF1E7FE8), onClick = { importer.launch(arrayOf("text/html", "*/*")) }) } }
            items(list, key = { it.url }) { e ->
                Row(Modifier.fillMaxWidth().clickable { open(e.url) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) { Text(e.title.ifBlank { e.url }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyLarge); Text(e.url, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText) }
                    IconButton(onClick = { Library.bookmarks.remove(e.url); tick++ }) { Icon(WonderIcons.Delete, "Remove") }
                }
            }
        }
    }
}

@Composable
private fun SitesScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    var tick by remember { mutableIntStateOf(0) }
    val rules = remember(tick) { SiteRules.all(context) }
    WonderScreen("Site settings", onBack) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp)) {
            item { Text("Per-site choices: whether links open the site's app, and which browser the site is told you are. Set them from a page's menu, “This site…”.", Modifier.padding(bottom = 10.dp), color = p.secondaryText, style = MaterialTheme.typography.bodySmall) }
            items(rules.entries.toList(), key = { it.key }) { (host, o) ->
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) { Text(host, style = MaterialTheme.typography.bodyLarge); Text(listOfNotNull(o.optString("app").takeIf { it.isNotBlank() }?.let { "App: $it" }, o.optString("ua").takeIf { it.isNotBlank() }?.let { k -> "As ${UserAgents.LIST.firstOrNull { it.first == k }?.second ?: k}" }).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = p.secondaryText) }
                    IconButton(onClick = { SiteRules.remove(context, host); tick++ }) { Icon(WonderIcons.Delete, "Forget") }
                }
            }
            if (rules.isEmpty()) item { Text("No sites yet.", color = p.secondaryText) }
        }
    }
}

@Composable
private fun SettingsScreen(onBack: () -> Unit, sites: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var engine by remember { mutableStateOf(Prefs.engine(context)) }
    var veil by remember { mutableStateOf(Prefs.veilDefault(context)) }
    var ads by remember { mutableStateOf(Prefs.adBlock(context)) }
    var cosmetic by remember { mutableStateOf(Prefs.hideCosmetic(context)) }
    var tpc by remember { mutableStateOf(Prefs.blockThirdPartyCookies(context)) }
    var https by remember { mutableStateOf(Prefs.upgradeHttps(context)) }
    var clearExit by remember { mutableStateOf(Prefs.clearOnExit(context)) }
    var ua by remember { mutableStateOf(Prefs.uaKey(context)) }
    var zoom by remember { mutableIntStateOf(Prefs.textZoom(context)) }
    var status by remember { mutableStateOf("${AdBlock.listSize()} hosts blocked") }
    var busy by remember { mutableStateOf(false) }
    fun put(k: String, v: Boolean) = Prefs.p(context).edit().putBoolean(k, v).apply()
    WonderScreen("Settings", onBack) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Panel(title = "Search") {
                Row(Modifier.padding(14.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Prefs.ENGINES.forEach { (n, _) -> Chip(n, engine == n, { engine = n; Prefs.p(context).edit().putString("engine", n).apply() }) } }
            }
            Panel(title = "Privacy") {
                SwitchRow("Open new tabs as Veil tabs", veil, { veil = it; put("veilDefault", it) }, subtitle = "Nothing from a Veil tab is kept: no history, cookies or form data. Turn off to start in normal tabs", icon = WonderIcons.VisibilityOff, tint = Color(0xFF5B4BC4))
                PanelDivider()
                SwitchRow("Block ads and trackers", ads, { ads = it; put("adblock", it) }, subtitle = status, icon = WonderIcons.Shield, tint = Color(0xFF2E9E44))
                PanelDivider()
                ListRow(if (busy) "Updating the lists…" else "Update the block lists", subtitle = "Downloads EasyList, EasyPrivacy and a tracker host list", icon = WonderIcons.Download, tint = Color(0xFF1E7FE8), onClick = {
                    if (!busy) { busy = true; scope.launch { val r = withContext(Dispatchers.IO) { runCatching { AdBlock.update(context) } }; busy = false; status = r.fold({ "${AdBlock.listSize()} hosts blocked" }, { "Couldn't update: ${it.message}" }) } }
                })
                PanelDivider()
                SwitchRow("Hide empty ad boxes", cosmetic, { cosmetic = it; put("cosmetic", it) }, icon = WonderIcons.Visibility, tint = Color(0xFF8E44AD))
                PanelDivider()
                SwitchRow("Block third-party cookies", tpc, { tpc = it; put("tpc", it) }, icon = WonderIcons.Security, tint = Color(0xFFE39A12))
                PanelDivider()
                SwitchRow("Prefer secure (HTTPS) addresses", https, { https = it; put("https", it) }, icon = WonderIcons.Lock, tint = Color(0xFF2E9E44))
                PanelDivider()
                SwitchRow("Clear history and data when closing", clearExit, { clearExit = it; put("clearOnExit", it) }, icon = WonderIcons.Delete, tint = Color(0xFFE5483C))
            }
            Panel(title = "Browsing") {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Pretend to be (all sites)", style = MaterialTheme.typography.labelLarge)
                    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) { UserAgents.LIST.forEach { (k, l) -> Chip(l, ua == k, { ua = k; Prefs.p(context).edit().putString("ua", k).apply() }) } }
                    Text("Page text size $zoom%", style = MaterialTheme.typography.labelLarge)
                    Slider(zoom.toFloat(), { zoom = (it / 10).toInt() * 10 }, valueRange = 70f..180f, onValueChangeFinished = { Prefs.p(context).edit().putInt("textZoom", zoom).apply(); Browser.tabs.forEach { it.web?.settings?.textZoom = zoom } })
                }
                PanelDivider()
                ListRow("Site settings", subtitle = "Open-in-app and browser disguise, per site", icon = WonderIcons.Tune, tint = Color(0xFF1E7FE8), chevron = true, onClick = sites)
            }
            Panel(title = "Polaris") {
                ListRow("Make Polaris your default browser", subtitle = "Links from other apps open here", icon = WonderIcons.Home, tint = Color(0xFF1E7FE8), chevron = true, onClick = { runCatching { context.startActivity(Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } })
                PanelDivider()
                ListRow("Passwords", subtitle = "Wonderdesk Vault fills and saves them through Android autofill", icon = WonderIcons.Key, tint = Color(0xFFF2A516), chevron = true, onClick = { runCatching { context.startActivity(Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } })
                PanelDivider()
                ListRow("Clear cookies and site data", icon = WonderIcons.Delete, tint = Color(0xFFE5483C), onClick = { Browser.wipeVeil(context); Hooks.toast("Cleared") })
            }
        }
    }
}
