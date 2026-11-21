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
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.focus.focusRequester
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.asImageBitmap
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
    var extQuick by mutableStateOf(false)
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
    /** Vault: pick a saved login for a site (null result = none chosen), and offer to save a new one. */
    var pickLogin: ((String, (Pair<String, String>?) -> Unit) -> Unit)? = null
    var saveLogin: ((String, String, String) -> Unit)? = null
    val loginSkipUntil = HashMap<String, Long>()
}

class MainActivity : WonderActivity() {
    private var loginDone: ((Pair<String, String>?) -> Unit)? = null
    private val loginResult = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        val cb = loginDone; loginDone = null
        cb?.invoke(if (r.resultCode == RESULT_OK && r.data != null) (r.data!!.getStringExtra("user").orEmpty() to r.data!!.getStringExtra("pass").orEmpty()) else null)
    }
    private fun vaultIntent(host: String) = Intent().setClassName("dev.wonderdesk.vault", "dev.wonderdesk.vault.LoginPickActivity").putExtra("web", host).putExtra("pkg", packageName)
    override fun onCreate(savedInstanceState: Bundle?) {
        Hooks.appContext = applicationContext
        Hooks.pickLogin = { host, done ->
            loginDone = done
            if (runCatching { loginResult.launch(vaultIntent(host).putExtra("login", true)) }.isFailure) { loginDone = null; done(null) }
        }
        Hooks.saveLogin = { host, user, pass -> runCatching { startActivity(vaultIntent(host).putExtra("save", true).putExtra("userValue", user).putExtra("passValue", pass)) } }
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
        if (url != null) Browser.open(this, url) else if (first) { Browser.startUp(this) }
    }

    @Composable override fun Content() = PolarisApp(this)
}

enum class Screen { Browser, Tabs, History, Bookmarks, Downloads, Extensions, Store, Settings, Sites }

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
    LaunchedEffect(Unit) { kotlinx.coroutines.delay(15_000); AddonStore.checkIfDue(context) }
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
            Screen.Store -> StoreScreen(onBack = { screen = Screen.Extensions })
            Screen.Extensions -> ExtensionsScreen(onBack = { screen = Screen.Browser }, store = { screen = Screen.Store })
            Screen.Downloads -> DownloadsScreen(onBack = { screen = Screen.Browser })
            Screen.Bookmarks -> BookmarksScreen(onBack = { screen = Screen.Browser }, open = { Browser.currentTab?.go(it); screen = Screen.Browser })
            Screen.Settings -> SettingsScreen(onBack = { screen = Screen.Browser }, sites = { screen = Screen.Sites })
            Screen.Sites -> SitesScreen(onBack = { screen = Screen.Settings })
            // The page shrinks to what is above the keyboard (Gecko then scrolls the box you tapped into view), and the bottom bar steps aside while typing.
            Screen.Browser -> Column(Modifier.fillMaxSize().imePadding()) {
                val imeUp = androidx.compose.foundation.layout.WindowInsets.ime.getBottom(androidx.compose.ui.platform.LocalDensity.current) > 0
                if (tab != null) {
                    androidx.compose.animation.AnimatedVisibility(!Hooks.fullscreen && !(tab.barsHidden && !tab.isStart && screen == Screen.Browser && menu.not()), enter = androidx.compose.animation.EnterTransition.None, exit = androidx.compose.animation.ExitTransition.None) { TopBar(tab, onMenu = { menu = true }, onHome = { tab.session.stop(); tab.url = ""; tab.title = "" }, menuOpen = menu, menuContent = { DropdownMenu(menu, { menu = false }, Modifier.background(p.panel)) { BrowserMenu(tab, { menu = false }, { screen = it }, { siteDialog = true }) } }) }
                    val barsAway = tab.barsHidden && !tab.isStart && !Hooks.fullscreen
                    Box(Modifier.weight(1f).fillMaxWidth().then(if (barsAway) Modifier.statusBarsPadding().navigationBarsPadding() else Modifier)) {
                        if (tab.isStart) StartPage(tab) else key(tab.id) {
                            AndroidView({ ctx -> org.mozilla.geckoview.GeckoView(ctx).also { gv -> gv.setAutofillEnabled(false); gv.importantForAutofill = android.view.View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS; tab.ensureOpen(); gv.setSession(tab.session); tab.view = gv
                                tab.session.setSelectionActionDelegate(org.mozilla.geckoview.BasicSelectionActionDelegate(act)) } },
                                Modifier.fillMaxSize(), update = { gv -> if (gv.session !== tab.session) { gv.releaseSession(); tab.ensureOpen(); gv.setSession(tab.session); tab.view = gv } })
                        }
                        Suggestions(tab)
                    }
                    tab.findText?.let { FindBar(tab) }
                    androidx.compose.animation.AnimatedVisibility((!tab.barsHidden || tab.isStart) && !imeUp, enter = androidx.compose.animation.EnterTransition.None, exit = androidx.compose.animation.ExitTransition.None) { BottomBar(tab, onTabs = { tab.capture(); screen = Screen.Tabs }) }
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
    if (Hooks.extQuick) WonderDialog(onDismissRequest = { Hooks.extQuick = false }, title = { Text("Extension buttons") }, text = {
        Panel {
            val list = Gecko.extensions.toList().filter { Gecko.actions[it.id] != null }
            if (list.isEmpty()) Text("No extension has a button yet.", Modifier.padding(14.dp))
            list.forEachIndexed { i, e -> if (i > 0) PanelDivider(); ListRow(e.metaData.name ?: e.id, icon = WonderIcons.Widgets, onClick = { Hooks.extQuick = false; Gecko.markActive(); Gecko.actions[e.id]?.click() }) }
        }
    }, confirmButton = { TextButton(onClick = { Hooks.extQuick = false }) { Text("Close") } })
    Hooks.ctxMenu?.let { c -> LinkMenu(c) { Hooks.ctxMenu = null } }
    Hooks.ask?.let { a -> AskDialog(a) { Hooks.ask = null } }
    Gecko.popup?.let { ps -> PopupDialog(ps) { Gecko.popup = null } }
}

@Composable
private fun TopBar(tab: Tab, onMenu: () -> Unit, onHome: () -> Unit, menuOpen: Boolean = false, menuContent: @Composable () -> Unit = {}) {
    val context = LocalContext.current
    val p = wonderPalette()
    var text by remember(tab.id, tab.url) { mutableStateOf(tab.url) }
    var focused by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { Hooks.typing = "" }
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
            Box { IconButton(onClick = onMenu) { Icon(WonderIcons.MoreVert, "Menu", tint = Color.White) }; menuContent() }
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
    if (tab.url.startsWith("http")) { val pinned = Library.pins.all().any { it.url == tab.url }
        item(if (pinned) "Unpin from start page" else "Pin to start page", WonderIcons.PushPin) { if (pinned) Library.pins.remove(tab.url) else Library.pins.add(Entry(tab.url, tab.title.ifBlank { tab.url }, System.currentTimeMillis()), unique = true) }() }
    item("Bookmarks", WonderIcons.Star) { go(Screen.Bookmarks) }()
    item("History", WonderIcons.History) { go(Screen.History) }()
    item("Downloads", WonderIcons.Download) { go(Screen.Downloads) }()
    HorizontalDivider()
    DropdownMenuItem({ Text(if (tab.desktop) "Mobile site" else "Desktop site") }, { close(); tab.toggleDesktop() }, leadingIcon = { Icon(WonderIcons.Language, null) })
    item("This site…", WonderIcons.Tune, site)()
    item("Find in page", WonderIcons.Search) { tab.findText = "" }()
    item("uBlock Origin", WonderIcons.Shield) { Gecko.ubo?.let { u -> Browser.open(context, u.metaData.baseUrl + "dashboard.html", veil = false) } ?: Hooks.toast("uBlock Origin is still starting") }()
    item("Extension buttons", WonderIcons.Widgets) { Hooks.extQuick = true }()
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

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
private fun StartPage(tab: Tab) {
    val context = LocalContext.current
    val p = wonderPalette()
    var q by remember { mutableStateOf("") }
    var rev by remember { mutableStateOf(0) }
    var customize by remember { mutableStateOf(false) }
    val importMarks = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val n = runCatching { Library.importHtml(context.contentResolver.openInputStream(uri)!!.bufferedReader().readText()).also { l -> l.forEach { Library.bookmarks.add(it, unique = true) } }.size }.getOrDefault(0)
            Hooks.toast(if (n > 0) "Imported $n bookmarks" else "No bookmarks found in that file"); rev++
        }
    }
    val cols = remember(rev) { Prefs.homeColumns(context) }
    val pins = remember(rev) { if (Prefs.homePins(context)) Library.pins.all().take(cols * 3) else emptyList() }
    val marks = remember(rev) { if (Prefs.homeBookmarks(context)) Library.bookmarks.all().filter { m -> pins.none { it.url == m.url } }.take(cols * 2) else emptyList() }
    val recent = remember(rev) { if (Prefs.homeRecent(context)) Library.history.all().distinctBy { it.url }.take(5) else emptyList() }
    // Most visited sites from history, like Firefox's top sites. Off in Veil tabs and when switched off.
    val top = remember(rev) {
        if (!Prefs.homeTop(context) || tab.veil) emptyList() else {
            fun host(u: String) = runCatching { java.net.URI(u).host?.removePrefix("www.") }.getOrNull().orEmpty()
            val known = (Library.pins.all() + Library.bookmarks.all()).map { host(it.url) }.toSet()
            Library.history.all().filter { it.url.startsWith("http") }.groupBy { host(it.url) }.filter { it.key.isNotEmpty() && it.key !in known }
                .entries.sortedByDescending { it.value.size }.take(cols * 2).map { (h, l) -> Entry("https://$h/", h.substringBeforeLast(".").substringAfterLast(".").replaceFirstChar { c -> c.uppercase() }, l.first().at) }
        }
    }
    var menuFor by remember { mutableStateOf<Pair<Entry, Int>?>(null) }
    @Composable fun ColumnScope.tiles(title: String, list: List<Entry>, kind: Int) {
        if (list.isEmpty()) return
        Spacer(Modifier.height(22.dp))
        Text(title, Modifier.align(Alignment.Start), color = Color.White.copy(alpha = .8f), style = MaterialTheme.typography.labelLarge)
        list.chunked(cols).forEach { row ->
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { m -> Column(Modifier.weight(1f).clip(RoundedCornerShape(14.dp)).combinedClickable(onClick = { tab.go(m.url) }, onLongClick = { menuFor = m to kind }).padding(6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(48.dp).clip(CircleShape).background(Color.White.copy(alpha = .2f)), contentAlignment = Alignment.Center) { Text((m.title.firstOrNull() ?: '•').uppercase(), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold) }
                    Text(m.title.ifBlank { m.url }, color = Color.White, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
                } }
                repeat(cols - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(p.accent.darken(.45f), p.accent.darken(.2f), p.window)))) {
        // The same living background as the Wonderdesk Launcher: follows your look, the time of day, and bubbles pop when tapped.
        if (Prefs.homeScene(context)) SceneBackground(Modifier.fillMaxSize())
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = if (tab.veil) .5f else .25f), Color.Black.copy(alpha = if (tab.veil) .62f else .38f)))))
        if (tab.veil) Box(Modifier.fillMaxSize().background(Color(0x553B1E8C)))
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(36.dp))
            Image(androidx.compose.ui.res.painterResource(dev.wonderdesk.shared.R.drawable.wonderdesk_polaris_icon), "Polaris", Modifier.size(96.dp))
            Text("Polaris", Modifier.padding(top = 8.dp), style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.SemiBold), color = Color.White)
            Text(if (tab.veil) "Veil tab: nothing from here is remembered" else "Search with ${Prefs.engine(context)}", color = Color.White.copy(alpha = .75f), style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth().height(50.dp).clip(RoundedCornerShape(25.dp)).background(Color.White.copy(alpha = .95f)).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(WonderIcons.Search, null, tint = Color(0xFF666666)); Spacer(Modifier.width(10.dp))
                BasicTextField(q, { q = it }, Modifier.weight(1f), singleLine = true, textStyle = androidx.compose.ui.text.TextStyle(fontSize = 17.sp, color = Color(0xFF111111)), cursorBrush = SolidColor(p.accent),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), keyboardActions = KeyboardActions(onSearch = { if (q.isNotBlank()) tab.go(q) }),
                    decorationBox = { inner -> if (q.isEmpty()) Text("Search or type a web address", color = Color(0xFF888888), fontSize = 17.sp); inner() })
            }
            MathAnswer.of(q)?.let { ans -> Text("= $ans", Modifier.padding(top = 10.dp).clip(RoundedCornerShape(14.dp)).clickable { context.getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("Answer", ans)); Hooks.toast("Copied $ans") }.background(Color.White.copy(alpha = .2f)).padding(horizontal = 18.dp, vertical = 8.dp), color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold) }
            tiles("Pinned", pins, 1)
            tiles("Bookmarks", marks, 0)
            tiles("Frequently visited", top, 2)
            if (recent.isNotEmpty() && !tab.veil) {
                Spacer(Modifier.height(22.dp))
                Text("Recently visited", Modifier.align(Alignment.Start), color = Color.White.copy(alpha = .8f), style = MaterialTheme.typography.labelLarge)
                recent.forEach { e -> Text(e.title.ifBlank { e.url }, Modifier.fillMaxWidth().clickable { tab.go(e.url) }.padding(vertical = 8.dp), color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis) }
            }
            Spacer(Modifier.height(48.dp))
        }
        if (Prefs.homeVeilSwitch(context)) Row(Modifier.align(Alignment.TopEnd).padding(10.dp).clip(RoundedCornerShape(16.dp)).background(Color.Black.copy(alpha = .28f)).padding(2.dp)) {
            listOf(false to "Normal", true to "Veil").forEach { (v, label) ->
                Text(label, Modifier.clip(RoundedCornerShape(14.dp)).background(if (tab.veil == v) (if (v) Color(0xFF5B4BC4) else Color.White) else Color.Transparent)
                    .clickable { if (tab.veil != v) { val old = tab; Browser.open(context, veil = v); Browser.tabs.indexOf(old).let { i -> if (i >= 0) Browser.close(i) }; Browser.current = Browser.tabs.lastIndex } }.padding(horizontal = 10.dp, vertical = 4.dp),
                    color = if (tab.veil == v) (if (v) Color.White else Color(0xFF1E3A8A)) else Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
        Icon(WonderIcons.Tune, "Customize this page", Modifier.align(Alignment.BottomEnd).padding(12.dp).size(34.dp).clip(CircleShape).clickable { customize = true }.background(Color.White.copy(alpha = .14f)).padding(7.dp), tint = Color.White.copy(alpha = .75f))
    }
    menuFor?.let { (e, kind) ->
        WonderDialog(onDismissRequest = { menuFor = null }, title = { Text(e.title.ifBlank { e.url }, maxLines = 1) }, text = {
            Panel {
                ListRow("Open in a new tab", icon = WonderIcons.OpenInNew, onClick = { menuFor = null; Browser.open(context, veil = tab.veil).go(e.url) }); PanelDivider()
                if (kind == 1) ListRow("Unpin", icon = WonderIcons.PushPin, onClick = { Library.pins.remove(e.url); menuFor = null; rev++ })
                else if (kind == 2) { ListRow("Pin to the top", icon = WonderIcons.PushPin, onClick = { Library.pins.add(e, unique = true); menuFor = null; rev++ }); PanelDivider()
                    ListRow("Remove from history", icon = WonderIcons.Delete, danger = true, onClick = { val h = java.net.URI(e.url).host.orEmpty(); Library.history.all().filter { runCatching { java.net.URI(it.url).host.orEmpty() }.getOrDefault("") == h }.forEach { Library.history.remove(it.url) }; menuFor = null; rev++ }) }
                else { ListRow("Pin to the top", icon = WonderIcons.PushPin, onClick = { Library.pins.add(e, unique = true); menuFor = null; rev++ }); PanelDivider()
                    ListRow("Remove bookmark", icon = WonderIcons.Delete, danger = true, onClick = { Library.bookmarks.remove(e.url); menuFor = null; rev++ }) }
            }
        }, confirmButton = { TextButton(onClick = { menuFor = null }) { Text("Close") } })
    }
    if (customize) WonderDialog(onDismissRequest = { customize = false; rev++ }, title = { Text("Customize the start page") }, text = {
        Column(Modifier.verticalScroll(rememberScrollState())) {
            Panel {
                fun sw(label: String, key: String, def: Boolean, sub: String? = null): @Composable () -> Unit = { var on by remember { mutableStateOf(Prefs.p(context).getBoolean(key, def)) }; SwitchRow(label, on, { on = it; Prefs.p(context).edit().putBoolean(key, it).apply() }, subtitle = sub) }
                sw("Pinned sites", "homePins", true, "Pin a page from the ⋮ menu")(); PanelDivider()
                sw("Bookmarks", "homeBookmarks", true)(); PanelDivider()
                sw("Frequently visited", "homeTop", true, "Your most visited sites, from history. Never in Veil tabs")(); PanelDivider()
                sw("Recently visited", "homeRecent", true, "Never shown in Veil tabs")(); PanelDivider()
                sw("Living background", "homeScene", true, "Aqua, Bliss or Super, matching your look")(); PanelDivider()
                sw("Normal / Veil switch", "homeVeilSwitch", true)()
            }
            Panel(Modifier.padding(top = 10.dp)) {
                ListRow("Import bookmarks", subtitle = "From Chrome, Firefox, Edge, Safari or Brave (an exported HTML file)", icon = WonderIcons.UploadFile, tint = Color(0xFF1E7FE8), onClick = { importMarks.launch(arrayOf("text/html", "*/*")) })
            }
            Text("Tiles per row", Modifier.padding(top = 12.dp, bottom = 6.dp), style = MaterialTheme.typography.labelLarge)
            var c by remember { mutableStateOf(Prefs.homeColumns(context)) }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { listOf(3, 4, 5, 6).forEach { n -> Chip("$n", c == n, { c = n; Prefs.p(context).edit().putInt("homeColumns", n).apply() }) } }
        }
    }, confirmButton = { TextButton(onClick = { customize = false; rev++ }) { Text("Done") } })
}

@Composable
private fun TabsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    WonderScreen("Tabs (${Browser.tabs.size})", onBack, actions = {
        TextButton(onClick = { Browser.open(context, veil = false); onBack() }) { Text("New", color = Color.White) }
        TextButton(onClick = { Browser.open(context, veil = true); onBack() }) { Text("New Veil", color = Color.White) }
    }) {
        androidx.compose.foundation.lazy.grid.LazyVerticalGrid(androidx.compose.foundation.lazy.grid.GridCells.Fixed(2), Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            gridItems(Browser.tabs.toList(), key = { it.id }) { t ->
                val on = Browser.tabs.indexOf(t) == Browser.current
                val shape = RoundedCornerShape(16.dp)
                Column(Modifier.fillMaxWidth().clip(shape).background(if (on) p.accent.copy(alpha = .16f) else p.panel).border(if (on) 2.dp else 1.dp, if (on) p.accent else p.panelBorder, shape)
                    .clickable { Browser.current = Browser.tabs.indexOf(t); onBack() }) {
                    // A picture of the page, so you can tell your tabs apart.
                    Box(Modifier.fillMaxWidth().height(170.dp).background(Brush.verticalGradient(if (t.veil) listOf(Color(0xFF2A1F5E), Color(0xFF14103A)) else listOf(p.accent.darken(.35f), p.accent.darken(.1f))))) {
                        val th = t.thumb
                        if (th != null) Image(th, null, Modifier.fillMaxSize(), contentScale = androidx.compose.ui.layout.ContentScale.Crop, alignment = Alignment.TopCenter)
                        else Image(androidx.compose.ui.res.painterResource(dev.wonderdesk.shared.R.drawable.wonderdesk_polaris_icon), null, Modifier.align(Alignment.Center).size(56.dp).alpha(.85f))
                        if (t.veil) Text("Veil", Modifier.align(Alignment.TopStart).padding(6.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFF5B4BC4)).padding(horizontal = 6.dp, vertical = 1.dp), color = Color.White, fontSize = 11.sp)
                        Box(Modifier.align(Alignment.TopEnd).padding(6.dp).size(30.dp).clip(CircleShape).background(Color.Black.copy(alpha = .5f)).clickable { Browser.close(Browser.tabs.indexOf(t)); if (Browser.tabs.isEmpty()) { Browser.open(context); onBack() } }, contentAlignment = Alignment.Center) { Icon(WonderIcons.Close, "Close tab", Modifier.size(16.dp), tint = Color.White) }
                    }
                    Column(Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
                        Text(t.title.ifBlank { if (t.isStart) "Start page" else t.url }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleSmall)
                        Text(t.url.ifBlank { "Polaris" }, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText)
                    }
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
                SwitchRow("Open new tabs as Veil tabs", veil, { veil = it; put("veilDefault", it) }, subtitle = "Nothing from a Veil tab is kept: no history, cookies or form data. Turn off to start in normal tabs", icon = WonderIcons.VisibilityOff, tint = Color(0xFF5B4BC4), help = "Veil tabs are private: they leave no history, cookies or saved data when closed.")
                PanelDivider()
                ListRow("uBlock Origin", subtitle = "Blocks ads and trackers. Open its dashboard to choose lists and rules", icon = WonderIcons.Shield, tint = Color(0xFF2E9E44), chevron = true, onClick = { Gecko.ubo?.let { u -> Browser.open(context, u.metaData.baseUrl + "dashboard.html", veil = false) } }, help = "The ad and tracker blocker built into Polaris. It is on by default.")
                PanelDivider()
                SwitchRow("Strict tracking protection", strict, { strict = it; put("strict", it); Hooks.toast("Applies the next time Polaris starts") }, subtitle = "Firefox's strict mode: blocks more trackers, may break a few sites", icon = WonderIcons.Security, tint = Color(0xFFE39A12), help = "Blocks more trackers and ads. A few sites may stop working; turn it off for those.")
                PanelDivider()
                SwitchRow("Route everything through Tor", tor, { tor = it; put("tor", it); Hooks.toast("Install Orbot and start it; applies the next time Polaris starts") }, subtitle = "Uses Orbot's local Tor proxy. Needs the Orbot app running", icon = WonderIcons.VisibilityOff, tint = Color(0xFF5B4BC4), help = "Sends your browsing through the Tor network for privacy. Pages load much slower.")
                PanelDivider()
                SwitchRow("Flash support (Ruffle)", flash, { flash = it; put("flash", it); Hooks.toast("Applies the next time Polaris starts") }, subtitle = "Plays old Flash games and animations", icon = WonderIcons.Language, tint = Color(0xFFE5483C), help = "Plays old Flash games and animations without Flash, using the Ruffle emulator.")
                PanelDivider()
                SwitchRow("Prefer secure (HTTPS) addresses", https, { https = it; put("https", it) }, icon = WonderIcons.Lock, tint = Color(0xFF2E9E44), help = "Tries the secure version of a site first, so what you send can't be read on the way.")
                PanelDivider()
                SwitchRow("Clear history and data when closing", clearExit, { clearExit = it; put("clearOnExit", it) }, icon = WonderIcons.Delete, tint = Color(0xFFE5483C), help = "Wipes history, cookies and site data every time you close Polaris.")
            }
            Panel(title = "Browsing") {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    var hideBars by remember { mutableStateOf(Prefs.autoHideBars(context)) }
                    SwitchRow("Hide the bars while scrolling", hideBars, { hideBars = it; put("autoHideBars", it) }, subtitle = "The address bar and bottom bar slide away as you scroll down a page and come back when you scroll up", icon = WonderIcons.Fullscreen, tint = Color(0xFF1E7FE8), help = "The top and bottom bars slide away as you scroll down to give pages more room, and come back when you scroll up.")
                    Text("When Polaris starts", style = MaterialTheme.typography.labelLarge)
                    var startup by remember { mutableStateOf(Prefs.startup(context)) }
                    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("previous" to "Previous tabs", "newtab" to "Previous tabs and a new tab", "fresh" to "Only a new tab").forEach { (k, l) -> Chip(l, startup == k, { startup = k; Prefs.p(context).edit().putString("startup", k).apply() }) }
                    }
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
                ListRow("Passwords", subtitle = "Wonderdesk Vault fills and saves logins right inside Polaris: tap a login box and Vault opens (it unlocks first if needed). Nothing else to set up", icon = WonderIcons.Key, tint = Color(0xFFF2A516), chevron = true, onClick = { runCatching { context.startActivity(context.packageManager.getLaunchIntentForPackage("dev.wonderdesk.vault")!!.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }, help = "Saved logins come from Vault. Polaris asks Vault to fill and save them.")
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
    val q = Hooks.typing.trim()
    if (q.isBlank()) return
    val p = wonderPalette()
    var hits by remember { mutableStateOf<List<Entry>>(emptyList()) }
    // Looked up off the main thread after a short pause, so typing never waits for the history.
    LaunchedEffect(q) {
        kotlinx.coroutines.delay(70)
        hits = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) { (Library.bookmarks.search(q, 3) + Library.history.search(q, 6)).distinctBy { it.url }.take(6) }
    }
    val math = remember(q) { MathAnswer.of(q) }
    val ctx = LocalContext.current
    Column(Modifier.fillMaxWidth().background(p.window).border(1.dp, p.panelBorder)) {
        if (math != null) Row(Modifier.fillMaxWidth().clickable { ctx.getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("Answer", math)); Hooks.toast("Copied $math") }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(WonderIcons.Calculate, null, tint = p.accent); Spacer(Modifier.width(12.dp)); Text("= $math", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold); Spacer(Modifier.weight(1f)); Text("Tap to copy", style = MaterialTheme.typography.bodySmall, color = p.secondaryText) }
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
    val p = wonderPalette()
    androidx.compose.ui.window.Dialog(onDismissRequest = close, properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)) {
        Column(Modifier.fillMaxWidth(.94f).fillMaxHeight(.78f).clip(RoundedCornerShape(18.dp)).background(p.panel)) {
            Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Extension", Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
                IconButton(onClick = close) { Icon(WonderIcons.Close, "Close") }
            }
            Box(Modifier.weight(1f).fillMaxWidth().background(Color.White)) {
                AndroidView({ ctx -> org.mozilla.geckoview.GeckoView(ctx).also { gv -> if (!session.isOpen) session.open(Gecko.runtime); gv.setSession(session) } }, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
private fun ExtensionsScreen(onBack: () -> Unit, store: () -> Unit) {
    val context = LocalContext.current
    val p = wonderPalette()
    var auto by remember { mutableStateOf(Prefs.autoUpdateAddons(context)) }
    LaunchedEffect(Unit) { Gecko.refreshList() }
    val install = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val f = java.io.File(context.cacheDir, "install.xpi"); context.contentResolver.openInputStream(uri)?.use { i -> f.outputStream().use { o -> i.copyTo(o) } }
            Gecko.runtime.webExtensionController.install(Uri.fromFile(f).toString()).accept({ e -> if (e != null) { Gecko.runtime.webExtensionController.setAllowedInPrivateBrowsing(e, true); Gecko.watch(e); Hooks.toast("Added ${e.metaData.name}") } }, { e -> Hooks.toast("Couldn't add it: ${e?.message}") })
        }
    }
    WonderScreen("Extensions", onBack, actions = { TextButton(onClick = store) { Text("Find more", color = Color.White) }; TextButton(onClick = { install.launch(arrayOf("*/*")) }) { Text("From file", color = Color.White) } }) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                Panel {
                    ListRow(if (AddonStore.checking) "Checking for updates…" else if (AddonStore.updates.isEmpty()) "Everything is up to date" else "${AddonStore.updates.size} update${if (AddonStore.updates.size == 1) "" else "s"} available",
                        subtitle = if (AddonStore.updates.isEmpty()) "Checked against Mozilla's add-on site" else AddonStore.updates.joinToString { it.second.name }, icon = WonderIcons.Refresh, tint = Color(0xFF1E7FE8),
                        onClick = { if (AddonStore.updates.isNotEmpty()) AddonStore.updates.forEach { (_, a) -> Gecko.installFromStore(a) { ok, m -> Hooks.toast(if (ok) "Updated $m" else m) } } else AddonStore.check(context) })
                    PanelDivider()
                    SwitchRow("Update automatically", auto, { auto = it; Prefs.p(context).edit().putBoolean("addonAuto", it).apply() }, subtitle = "Checks twice a day", icon = WonderIcons.Download, tint = Color(0xFF2E9E44))
                }
            }
            item { Text("Polaris runs real Firefox extensions. Eight come with it and work in Veil tabs too. Find more in Mozilla's store, or write your own WebExtension (manifest.json plus scripts), zip it as an .xpi and add it from a file.", color = p.secondaryText, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 6.dp)) }
            items(Gecko.extensions.toList(), key = { it.id }) { e ->
                val builtIn = e.isBuiltIn
                var veil by remember(e.id) { mutableStateOf(e.metaData.allowedInPrivateBrowsing) }
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.panel).padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) { Text(e.metaData.name ?: e.id, style = MaterialTheme.typography.titleSmall); Text("Version ${e.metaData.version}" + if (builtIn) " · comes with Polaris" else "", style = MaterialTheme.typography.bodySmall, color = p.secondaryText) }
                        Gecko.actions[e.id]?.let { a -> TextButton(onClick = { Gecko.markActive(); a.click() }) { Text("Open") } }
                        if (!builtIn) TextButton(onClick = { Gecko.runtime.webExtensionController.uninstall(e).accept({ Gecko.extensions.removeAll { it.id == e.id } }, { }) }) { Text("Remove") }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) { Text("Works in Veil tabs", Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium); Switch(veil, { on -> veil = on; Gecko.runtime.webExtensionController.setAllowedInPrivateBrowsing(e, on) }) }
                }
            }
        }
    }
}

@Composable
private fun StoreScreen(onBack: () -> Unit) {
    val p = wonderPalette()
    var q by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Addon>?>(null) }
    var failed by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    fun load() { results = null; failed = false; scope.launch { val r = withContext(Dispatchers.IO) { runCatching { AddonStore.search(q) } }; results = r.getOrNull(); failed = r.isFailure } }
    LaunchedEffect(Unit) { load() }
    WonderScreen("Extension store", onBack) {
        Column(Modifier.fillMaxSize()) {
            Box(Modifier.padding(12.dp)) { Field(q, { q = it }, "Search Mozilla's add-ons", imeAction = ImeAction.Search, onDone = { load() }) }
            val list = results
            when {
                failed -> Text("Couldn't reach Mozilla's add-on site. Check your connection.", Modifier.padding(24.dp), color = p.danger)
                list == null -> Text("Loading…", Modifier.padding(24.dp), color = p.secondaryText)
                list.isEmpty() -> Text("No add-ons found.", Modifier.padding(24.dp), color = p.secondaryText)
                else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(list, key = { it.guid }) { a ->
                        val have = Gecko.extensions.any { it.id == a.guid }
                        val icon by produceState<Bitmap?>(null, a.iconUrl) { value = withContext(Dispatchers.IO) { AddonStore.icon(a.iconUrl) } }
                        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.panel).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(44.dp).clip(RoundedCornerShape(10.dp)).background(p.window)) { icon?.let { Image(it.asImageBitmap(), null, Modifier.fillMaxSize()) } }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(a.name, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleSmall)
                                Text(a.summary, maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall, color = p.secondaryText)
                                Text("%,d users".format(a.users) + if (a.rating > 0) " · ★ %.1f".format(a.rating) else "", style = MaterialTheme.typography.labelSmall, color = p.secondaryText)
                            }
                            TextButton(enabled = !have && busy != a.guid, onClick = { busy = a.guid; Gecko.installFromStore(a) { ok, m -> busy = null; Hooks.toast(if (ok) "Added $m" else "Couldn't add it: $m") } }) { Text(if (have) "Added" else if (busy == a.guid) "…" else "Add") }
                        }
                    }
                }
            }
        }
    }
}


/** The Launcher's live scene, drawn small and scaled up so it stays light: 24 frames a second, and only while Polaris is on screen. */
@Composable
private fun SceneBackground(modifier: Modifier) {
    val context = LocalContext.current
    val resumed = rememberIsResumed()
    LaunchedEffect(Unit) { Sun.refresh(context) }
    val cfg = remember { SceneConfig(base = SceneConfig.forLook(runCatching { GlobalAppearance.read(context)?.first }.getOrNull())) }
    BoxWithConstraints(modifier) {
        val ratio = (constraints.maxWidth.toFloat() / constraints.maxHeight.coerceAtLeast(1)).coerceIn(.3f, 3f)
        val h = 560; val w = (h * ratio).toInt().coerceAtLeast(120)
        val bmp = remember(w) { android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888) }
        val canvas = remember(bmp) { android.graphics.Canvas(bmp) }
        val runner = remember(bmp) { SceneRunner(w, h) }
        var frame by remember { mutableIntStateOf(0) }
        LaunchedEffect(runner, resumed) {
            if (!resumed) return@LaunchedEffect
            var last = 0L
            while (true) androidx.compose.runtime.withFrameNanos { t ->
                if (last == 0L) last = t
                val dt = ((t - last) / 1e9f).coerceAtMost(.1f)
                if (dt >= 1f / 24f) { runner.update(dt, cfg, 100, false); runner.draw(canvas, cfg); last = t; frame++ }
            }
        }
        androidx.compose.foundation.Canvas(Modifier.fillMaxSize().pointerInput(runner) {
            detectTapGestures { o -> runner.tap(o.x / size.width * w, o.y / size.height * h, cfg) }
        }) {
            frame
            drawImage(bmp.asImageBitmap(), dstSize = androidx.compose.ui.unit.IntSize(size.width.toInt(), size.height.toInt()), filterQuality = androidx.compose.ui.graphics.FilterQuality.Low)
        }
    }
}
