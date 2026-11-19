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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.focus.focusRequester
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
    class Ctx(val url: String, val image: Boolean, val veil: Boolean)
    var ctxMenu by mutableStateOf<Ctx?>(null)
    var ask by mutableStateOf<Ask?>(null)
    var fullscreen by mutableStateOf(false)
    var typing by mutableStateOf("")
    var toast: (String) -> Unit = {}
    lateinit var appContext: android.content.Context
    var pickFile: ((Array<String>, Boolean, (List<Uri>) -> Unit) -> Unit)? = null
    var androidPerms: ((Array<String>, (Boolean) -> Unit) -> Unit)? = null
}

class MainActivity : WonderActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        Hooks.appContext = applicationContext
        Library.init(this); Gecko.init(this)
        super.onCreate(savedInstanceState)
        handle(intent, first = true)
    }
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); handle(intent, first = false) }
    override fun onPause() { super.onPause(); Browser.saveSession(this) }
    override fun onDestroy() { if (isFinishing && Prefs.clearOnExit(this)) { Library.history.clear(); Browser.wipeAll(this) }; super.onDestroy() }

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

enum class Screen { Browser, Tabs, History, Bookmarks, Downloads, Extensions, Settings, Sites }

/** An installed app (not a browser) that handles this link, if any: package and name. */
fun appFor(c: android.content.Context, u: Uri): Pair<String, String>? {
    val pm = c.packageManager
    val browsers = pm.queryIntentActivities(Intent(Intent.ACTION_VIEW, Uri.parse("https://example.invalid/")).addCategory(Intent.CATEGORY_BROWSABLE), PackageManager.MATCH_ALL).map { it.activityInfo.packageName }.toSet()
    val handlers = pm.queryIntentActivities(Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE), PackageManager.MATCH_ALL).map { it.activityInfo.packageName }.filter { it !in browsers && it != c.packageName }.distinct()
    val pkg = handlers.firstOrNull() ?: return null
    return pkg to (runCatching { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() }.getOrDefault(pkg))
}

fun screenshot(c: android.content.Context, tab: Tab) {
    val v = tab.view ?: return Hooks.toast("Open a page first")
    v.capturePixels().accept({ b ->
        val ok = runCatching {
            val values = ContentValues().apply { put(MediaStore.Images.Media.DISPLAY_NAME, "Polaris " + System.currentTimeMillis() + ".png"); put(MediaStore.Images.Media.MIME_TYPE, "image/png"); put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Polaris") }
            val uri = c.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)!!
            c.contentResolver.openOutputStream(uri)!!.use { b!!.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }.isSuccess
        Hooks.toast(if (ok) "Saved to Pictures/Polaris" else "Couldn't save the screenshot")
    }, { Hooks.toast("Couldn't save the screenshot") })
}

fun addToHome(c: android.content.Context, tab: Tab) {
    val url = tab.url; if (!url.startsWith("http")) return
    val name = tab.title.ifBlank { Uri.parse(url).host ?: "Site" }.take(24)
    val icon = IconCompat.createWithBitmap(letterIcon(name))
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
    LaunchedEffect(Browser.current, Browser.tabs.size) { Gecko.markActive() }
    LaunchedEffect(Unit) { Hooks.toast = { m -> android.widget.Toast.makeText(context, m, android.widget.Toast.LENGTH_SHORT).show() } }
    // File picker, Android permissions and full-screen video, for the engine.
    var pickCb by remember { mutableStateOf<((List<Uri>) -> Unit)?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris -> pickCb?.invoke(uris); pickCb = null }
    var permCb by remember { mutableStateOf<((Boolean) -> Unit)?>(null) }
    val permLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res -> permCb?.invoke(res.values.all { it }); permCb = null }
    LaunchedEffect(Unit) {
        Hooks.pickFile = { types, _, cb -> pickCb?.invoke(emptyList()); pickCb = cb; picker.launch(types.filter { it.isNotBlank() }.toTypedArray().ifEmpty { arrayOf("*/*") }) }
        Hooks.androidPerms = { perms, cb -> permCb = cb; permLauncher.launch(perms) }
    }
    LaunchedEffect(Hooks.fullscreen) {
        val c = androidx.core.view.WindowCompat.getInsetsController(act.window, act.window.decorView)
        if (Hooks.fullscreen) { c.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars()); c.systemBarsBehavior = androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE } else c.show(androidx.core.view.WindowInsetsCompat.Type.systemBars())
    }
    BackHandler(enabled = screen != Screen.Browser || tab?.canBack == true || tab?.findText != null || Hooks.fullscreen) {
        when { Hooks.fullscreen -> tab?.session?.exitFullScreen(); tab?.findText != null -> { tab.find(""); tab.findText = null }; screen != Screen.Browser -> screen = Screen.Browser; else -> tab?.session?.goBack() }
    }
    Box(Modifier.fillMaxSize().background(p.window)) {
        when (screen) {
            Screen.Tabs -> TabsScreen(onBack = { screen = Screen.Browser })
            Screen.History -> HistoryScreen(onBack = { screen = Screen.Browser }, open = { Browser.currentTab?.go(it); screen = Screen.Browser })
            Screen.Extensions -> ExtensionsScreen(onBack = { screen = Screen.Browser })
            Screen.Downloads -> DownloadsScreen(onBack = { screen = Screen.Browser })
            Screen.Bookmarks -> BookmarksScreen(onBack = { screen = Screen.Browser }, open = { Browser.currentTab?.go(it); screen = Screen.Browser })
            Screen.Settings -> SettingsScreen(onBack = { screen = Screen.Browser }, sites = { screen = Screen.Sites })
            Screen.Sites -> SitesScreen(onBack = { screen = Screen.Settings })
            Screen.Browser -> Column(Modifier.fillMaxSize()) {
                if (tab != null) {
                    if (!Hooks.fullscreen) TopBar(tab, onMenu = { menu = true }, onHome = { tab.session.stop(); tab.url = ""; tab.title = "" })
                    Box(Modifier.weight(1f).fillMaxWidth()) {
                        if (tab.isStart) StartPage(tab) else key(tab.id) {
                            AndroidView({ ctx -> org.mozilla.geckoview.GeckoView(ctx).also { gv -> gv.setAutofillEnabled(true); tab.ensureOpen(); gv.setSession(tab.session); tab.view = gv
                                tab.session.setSelectionActionDelegate(org.mozilla.geckoview.BasicSelectionActionDelegate(act)) } },
                                Modifier.fillMaxSize(), update = { gv -> if (gv.session !== tab.session) { gv.releaseSession(); tab.ensureOpen(); gv.setSession(tab.session); tab.view = gv } })
                        }
                        if (Hooks.typing.isNotBlank()) Suggestions(tab)
                        DropdownMenu(menu, { menu = false }, Modifier.background(p.panel)) { BrowserMenu(tab, { menu = false }, { screen = it }, { siteDialog = true }) }
                    }
                    tab.findText?.let { FindBar(tab) }
                    BottomBar(tab, onTabs = { screen = Screen.Tabs })
                }
            }
        }
    }
    Hooks.appAsk?.let { a ->
        WonderDialog(onDismissRequest = { Hooks.appAsk = null }, title = { Text("Open in ${a.label}?") }, text = { Text("${a.host} can open in the ${a.label} app.") }, confirmButton = {
            TextButton(onClick = { Hooks.appAsk = null; runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(a.url)).setPackage(a.pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }) { Text("Open app") }
        }, dismissButton = {
            Row { TextButton(onClick = { Hooks.appAsk = null; Browser.currentTab?.session?.loadUri(a.url) }) { Text("Stay here") }
                TextButton(onClick = { SiteRules.set(context, a.host, "always", null); Hooks.appAsk = null; runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(a.url)).setPackage(a.pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }) { Text("Always") }
                TextButton(onClick = { SiteRules.set(context, a.host, "never", null); Hooks.appAsk = null; Browser.currentTab?.session?.loadUri(a.url) }) { Text("Never") } }
        })
    }
    if (siteDialog && tab != null) SiteDialog(tab) { siteDialog = false }
    Hooks.ctxMenu?.let { c -> LinkMenu(c) { Hooks.ctxMenu = null } }
    Hooks.ask?.let { a -> AskDialog(a) { Hooks.ask = null } }
    Gecko.popup?.let { ps -> PopupDialog(ps) { Gecko.popup = null } }
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
                BasicTextField(if (focused) text else (Uri.parse(tab.url).host?.removePrefix("www.") ?: tab.url), { text = it; Hooks.typing = it }, Modifier.weight(1f).onFocusChanged { focused = it.isFocused; if (!it.isFocused) Hooks.typing = "" else { text = ""; Hooks.typing = "" } },
                    singleLine = true, textStyle = androidx.compose.ui.text.TextStyle(color = Color(0xFF111111), fontSize = 15.sp), cursorBrush = SolidColor(p.accent),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go), keyboardActions = KeyboardActions(onGo = { Hooks.typing = ""; tab.go(text) }))
                if (tab.url.startsWith("http")) { var star by remember(tab.url) { mutableStateOf(Library.bookmarks.all().any { it.url == tab.url }) }
                    IconButton(onClick = { if (star) Library.bookmarks.remove(tab.url) else Library.bookmarks.add(Entry(tab.url, tab.title.ifBlank { tab.url }, System.currentTimeMillis()), unique = true); star = !star }, Modifier.size(28.dp)) { Icon(if (star) WonderIcons.Star else WonderIcons.StarBorder, "Bookmark", Modifier.size(18.dp), tint = if (star) Color(0xFFF2A516) else Color(0xFF444444)) } }
                IconButton(onClick = { if (tab.loading) tab.session.stop() else tab.session.reload() }, Modifier.size(28.dp)) { Icon(if (tab.loading) WonderIcons.Close else WonderIcons.Refresh, null, Modifier.size(18.dp), tint = Color(0xFF444444)) }
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
        IconButton(onClick = { tab.session.goBack() }, enabled = tab.canBack) { Icon(WonderIcons.ArrowBack, "Back", tint = if (tab.canBack) p.accent else p.secondaryText.copy(alpha = .4f)) }
        IconButton(onClick = { tab.session.goForward() }, enabled = tab.canForward) { Icon(WonderIcons.ArrowForward, "Forward", tint = if (tab.canForward) p.accent else p.secondaryText.copy(alpha = .4f)) }
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
    item("Downloads", WonderIcons.Download) { go(Screen.Downloads) }()
    HorizontalDivider()
    DropdownMenuItem({ Text(if (tab.desktop) "Mobile site" else "Desktop site") }, { close(); tab.toggleDesktop() }, leadingIcon = { Icon(WonderIcons.Language, null) })
    item("This site…", WonderIcons.Tune, site)()
    item("Find in page", WonderIcons.Search) { tab.findText = "" }()
    item("uBlock Origin", WonderIcons.Shield) { Gecko.ubo?.let { u -> Browser.open(context, u.metaData.baseUrl + "dashboard.html", veil = false) } ?: Hooks.toast("uBlock Origin is still starting") }()
    item("Extensions", WonderIcons.Apps) { go(Screen.Extensions) }()
    item("Add to home screen", WonderIcons.Apps) { addToHome(context, tab) }()
    item("Screenshot", WonderIcons.PhotoCamera) { screenshot(context, tab) }()
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
                UserAgents.LIST.forEach { (k, l) -> Chip(l, ua == k, { ua = k; SiteRules.set(context, host, null, k); tab.applyUa(host); tab.session.reload() }) }
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
    var strict by remember { mutableStateOf(Prefs.strict(context)) }
    var tor by remember { mutableStateOf(Prefs.tor(context)) }
    var flash by remember { mutableStateOf(Prefs.flash(context)) }
    var https by remember { mutableStateOf(Prefs.upgradeHttps(context)) }
    var clearExit by remember { mutableStateOf(Prefs.clearOnExit(context)) }
    var ua by remember { mutableStateOf(Prefs.uaKey(context)) }
    var zoom by remember { mutableIntStateOf(Prefs.textZoom(context)) }
    fun put(k: String, v: Boolean) = Prefs.p(context).edit().putBoolean(k, v).apply()
    WonderScreen("Settings", onBack) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Panel(title = "Search") {
                Row(Modifier.padding(14.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Prefs.ENGINES.forEach { (n, _) -> Chip(n, engine == n, { engine = n; Prefs.p(context).edit().putString("engine", n).apply() }) } }
            }
            Panel(title = "Privacy") {
                SwitchRow("Open new tabs as Veil tabs", veil, { veil = it; put("veilDefault", it) }, subtitle = "Nothing from a Veil tab is kept: no history, cookies or form data. Turn off to start in normal tabs", icon = WonderIcons.VisibilityOff, tint = Color(0xFF5B4BC4))
                PanelDivider()
                ListRow("uBlock Origin", subtitle = "Blocks ads and trackers. Open its dashboard to choose lists and rules", icon = WonderIcons.Shield, tint = Color(0xFF2E9E44), chevron = true, onClick = { Gecko.ubo?.let { u -> Browser.open(context, u.metaData.baseUrl + "dashboard.html", veil = false) } })
                PanelDivider()
                SwitchRow("Strict tracking protection", strict, { strict = it; put("strict", it); Hooks.toast("Applies the next time Polaris starts") }, subtitle = "Firefox's strict mode: blocks more trackers, may break a few sites", icon = WonderIcons.Security, tint = Color(0xFFE39A12))
                PanelDivider()
                SwitchRow("Route everything through Tor", tor, { tor = it; put("tor", it); Hooks.toast("Install Orbot and start it; applies the next time Polaris starts") }, subtitle = "Uses Orbot's local Tor proxy. Needs the Orbot app running", icon = WonderIcons.VisibilityOff, tint = Color(0xFF5B4BC4))
                PanelDivider()
                SwitchRow("Flash support (Ruffle)", flash, { flash = it; put("flash", it); Hooks.toast("Applies the next time Polaris starts") }, subtitle = "Plays old Flash games and animations", icon = WonderIcons.Language, tint = Color(0xFFE5483C))
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
                    Slider(zoom.toFloat(), { zoom = (it / 10).toInt() * 10 }, valueRange = 70f..180f, onValueChangeFinished = { Prefs.p(context).edit().putInt("textZoom", zoom).apply(); Gecko.runtime.settings.fontSizeFactor = zoom / 100f; Gecko.runtime.settings.automaticFontSizeAdjustment = false })
                }
                PanelDivider()
                ListRow("Site settings", subtitle = "Open-in-app and browser disguise, per site", icon = WonderIcons.Tune, tint = Color(0xFF1E7FE8), chevron = true, onClick = sites)
            }
            Panel(title = "Polaris") {
                ListRow("Make Polaris your default browser", subtitle = "Links from other apps open here", icon = WonderIcons.Home, tint = Color(0xFF1E7FE8), chevron = true, onClick = { runCatching { context.startActivity(Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } })
                PanelDivider()
                ListRow("Passwords", subtitle = "Wonderdesk Vault fills and saves them through Android autofill", icon = WonderIcons.Key, tint = Color(0xFFF2A516), chevron = true, onClick = { runCatching { context.startActivity(Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } })
                PanelDivider()
                ListRow("Clear cookies and site data", icon = WonderIcons.Delete, tint = Color(0xFFE5483C), onClick = { Browser.wipeAll(context); Hooks.toast("Cleared") })
            }
        }
    }
}

@Composable
private fun FindBar(tab: Tab) {
    val p = wonderPalette()
    val focus = remember { androidx.compose.ui.focus.FocusRequester() }
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }
    Row(Modifier.fillMaxWidth().background(p.panel).padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicTextField(tab.findText ?: "", { tab.findText = it; tab.find(it) }, Modifier.weight(1f).androidx_focus(focus).clip(RoundedCornerShape(10.dp)).background(p.window).padding(10.dp), singleLine = true,
            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 16.sp, color = p.text), cursorBrush = SolidColor(p.accent), keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), keyboardActions = KeyboardActions(onSearch = { tab.find(tab.findText ?: "") }))
        Text(if (tab.findCount == 0) "0" else "${tab.findIndex}/${tab.findCount}", Modifier.padding(horizontal = 8.dp), color = p.secondaryText)
        IconButton(onClick = { tab.find(tab.findText ?: "", backwards = true) }) { Icon(WonderIcons.ArrowBack, "Previous", Modifier.rotate(90f)) }
        IconButton(onClick = { tab.find(tab.findText ?: "") }) { Icon(WonderIcons.ArrowBack, "Next", Modifier.rotate(-90f)) }
        IconButton(onClick = { tab.find(""); tab.findText = null }) { Icon(WonderIcons.Close, "Close") }
    }
}

@Composable
private fun Suggestions(tab: Tab) {
    val p = wonderPalette()
    val q = Hooks.typing.trim()
    val hits = remember(q) {
        (Library.bookmarks.all() + Library.history.all()).filter { it.url.contains(q, true) || it.title.contains(q, true) }.distinctBy { it.url }.take(6)
    }
    Column(Modifier.fillMaxWidth().background(p.window).border(1.dp, p.panelBorder)) {
        Row(Modifier.fillMaxWidth().clickable { Hooks.typing = ""; tab.go(q) }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(WonderIcons.Search, null, tint = p.accent); Spacer(Modifier.width(12.dp)); Text("Search for “$q”", maxLines = 1, overflow = TextOverflow.Ellipsis) }
        hits.forEach { e -> Row(Modifier.fillMaxWidth().clickable { Hooks.typing = ""; tab.go(e.url) }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(WonderIcons.History, null, tint = p.secondaryText); Spacer(Modifier.width(12.dp))
            Column { Text(e.title.ifBlank { e.url }, maxLines = 1, overflow = TextOverflow.Ellipsis); Text(e.url, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText) } } }
    }
}

@Composable
private fun LinkMenu(c: Hooks.Ctx, close: () -> Unit) {
    val context = LocalContext.current
    WonderDialog(onDismissRequest = close, title = { Text(c.url.take(80), maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleSmall) }, text = {
        Panel {
            if (!c.image) {
                ListRow("Open in a new tab", icon = WonderIcons.Add, onClick = { close(); Browser.open(context, c.url, veil = c.veil) }); PanelDivider()
                ListRow("Open in a new Veil tab", icon = WonderIcons.VisibilityOff, onClick = { close(); Browser.open(context, c.url, veil = true) }); PanelDivider()
            } else { ListRow("Open image in a new tab", icon = WonderIcons.Add, onClick = { close(); Browser.open(context, c.url, veil = c.veil) }); PanelDivider()
                ListRow("Download image", icon = WonderIcons.Download, onClick = { close(); runCatching { context.getSystemService(DownloadManager::class.java).enqueue(DownloadManager.Request(Uri.parse(c.url)).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED).setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, android.webkit.URLUtil.guessFileName(c.url, null, null))) ; Hooks.toast("Downloading") } }); PanelDivider() }
            ListRow("Copy address", icon = WonderIcons.ContentCopy, onClick = { close(); context.getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("Link", c.url)); Hooks.toast("Copied") }); PanelDivider()
            ListRow("Share", icon = WonderIcons.Share, onClick = { close(); context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, c.url), "Share").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) })
        }
    }, confirmButton = { TextButton(onClick = close) { Text("Close") } })
}

@Composable
private fun DownloadsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    var tick by remember { mutableIntStateOf(0) }
    val items = remember(tick) {
        val out = mutableListOf<Triple<String, String, Long>>()
        runCatching { context.getSystemService(DownloadManager::class.java).query(DownloadManager.Query().setFilterByStatus(DownloadManager.STATUS_SUCCESSFUL or DownloadManager.STATUS_RUNNING or DownloadManager.STATUS_PENDING or DownloadManager.STATUS_FAILED))?.use { c ->
            while (c.moveToNext()) out += Triple(c.getString(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE)) ?: "File", c.getString(c.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)) ?: "", c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_ID)))
        } }
        out.reversed()
    }
    WonderScreen("Downloads", onBack, actions = { TextButton(onClick = { runCatching { context.startActivity(Intent(DownloadManager.ACTION_VIEW_DOWNLOADS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }) { Text("Open folder", color = Color.White) } }) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp)) {
            items(items, key = { it.third }) { (name, uri, id) ->
                Row(Modifier.fillMaxWidth().clickable { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(context.getSystemService(DownloadManager::class.java).getUriForDownloadedFile(id), context.getSystemService(DownloadManager::class.java).getMimeTypeForDownloadedFile(id)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)) } }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(WonderIcons.Download, null, tint = p.accent); Spacer(Modifier.width(12.dp)); Text(name, Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    IconButton(onClick = { context.getSystemService(DownloadManager::class.java).remove(id); tick++ }) { Icon(WonderIcons.Delete, "Remove") }
                }
            }
            if (items.isEmpty()) item { Text("No downloads yet.", color = p.secondaryText, modifier = Modifier.padding(24.dp)) }
        }
    }
}

private fun Modifier.androidx_focus(f: androidx.compose.ui.focus.FocusRequester) = this.then(Modifier.focusRequester(f))


@Composable
private fun AskDialog(a: Ask, close: () -> Unit) {
    var text by remember { mutableStateOf(a.text) }
    val picked = remember { mutableStateListOf<String>() }
    fun finish(v: Any?) { close(); a.done(v) }
    WonderDialog(onDismissRequest = { finish(if (a.kind == Ask.ALERT) null else false.takeIf { a.kind == Ask.CONFIRM }) }, title = { Text(a.title.ifBlank { when (a.kind) { Ask.CHOICE -> "Choose"; else -> "Polaris" } }) }, text = {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (a.message.isNotBlank()) Text(a.message)
            if (a.kind == Ask.TEXT) Field(text, { text = it }, "")
            if (a.kind == Ask.CHOICE) a.choices.forEach { (id, label) ->
                ListRow(label, selected = id in picked, onClick = { if (a.multi) { if (id in picked) picked.remove(id) else picked.add(id) } else finish(id) })
            }
        }
    }, confirmButton = {
        when (a.kind) {
            Ask.ALERT -> TextButton(onClick = { finish(null) }) { Text("OK") }
            Ask.CONFIRM -> TextButton(onClick = { finish(true) }) { Text(a.ok) }
            Ask.TEXT -> TextButton(onClick = { finish(text) }) { Text("OK") }
            else -> if (a.multi) TextButton(onClick = { finish(picked.toList()) }) { Text("OK") }
        }
    }, dismissButton = { if (a.kind != Ask.ALERT) TextButton(onClick = { finish(if (a.kind == Ask.CONFIRM) false else null) }) { Text("Cancel") } })
}

@Composable
private fun PopupDialog(session: org.mozilla.geckoview.GeckoSession, close: () -> Unit) {
    androidx.compose.ui.window.Dialog(onDismissRequest = close) {
        Box(Modifier.fillMaxWidth().height(520.dp).clip(RoundedCornerShape(16.dp)).background(Color.White)) {
            AndroidView({ ctx -> org.mozilla.geckoview.GeckoView(ctx).also { gv -> if (!session.isOpen) session.open(Gecko.runtime); gv.setSession(session) } }, Modifier.fillMaxSize())
        }
    }
}

@Composable
private fun ExtensionsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    LaunchedEffect(Unit) { Gecko.refreshList() }
    val install = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val f = java.io.File(context.cacheDir, "install.xpi"); context.contentResolver.openInputStream(uri)?.use { i -> f.outputStream().use { o -> i.copyTo(o) } }
            Gecko.runtime.webExtensionController.install(Uri.fromFile(f).toString()).accept({ e -> if (e != null) { Gecko.watch(e); Hooks.toast("Added ${e.metaData.name}") } }, { e -> Hooks.toast("Couldn't add it: ${e?.message}") })
        }
    }
    WonderScreen("Extensions", onBack, actions = { TextButton(onClick = { install.launch(arrayOf("*/*")) }) { Text("Add from file", color = Color.White) } }) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { Text("Polaris runs real Firefox extensions. uBlock Origin, Ruffle, Video DownloadHelper, FastForward, ClearURLs, SponsorBlock, Return YouTube Dislike and Improve YouTube come with it, and work in Veil tabs too. To make your own, write a normal WebExtension (manifest.json plus scripts), zip it as an .xpi file and add it here. Mozilla's WebExtension guide on developer.mozilla.org explains how.", color = p.secondaryText, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 6.dp)) }
            items(Gecko.extensions.toList(), key = { it.id }) { e ->
                val builtIn = e.isBuiltIn
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.panel).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) { Text(e.metaData.name ?: e.id, style = MaterialTheme.typography.titleSmall); Text("Version ${e.metaData.version}" + (if (builtIn) " · comes with Polaris" else "") + (if (e.metaData.allowedInPrivateBrowsing) " · on in Veil tabs" else ""), style = MaterialTheme.typography.bodySmall, color = p.secondaryText) }
                    Gecko.actions[e.id]?.let { a -> TextButton(onClick = { Gecko.markActive(); a.click() }) { Text("Open") } }
                    if (!builtIn) TextButton(onClick = { Gecko.runtime.webExtensionController.uninstall(e).accept({ Gecko.extensions.removeAll { it.id == e.id } }, { }) }) { Text("Remove") }
                }
            }
        }
    }
}
