# Polaris changelog

## v0.7.7

- Pages that can't load now show a clear explanation and a Try again button instead of a blank white screen: unknown site, can't connect, slow site, offline, redirect loop, untrusted certificate, blocked as harmful. Sites without secure (https) support offer an "unsecured version" button, with a warning
- The padlock now shows only on pages whose connection is really verified as secure
- Downloads now go through the browser's own connection, so files behind a sign-in, one-time links and blob: downloads all work, and they are saved straight to Downloads
- Links that try to open an app you don't have now open the website instead of doing nothing
- Protected (DRM) video no longer asks permission every time
- The start page's Veil caption is centred

## v0.7.6

- New tabs open as Veil (private) tabs again, which is the default you asked for unless you switch it off in Settings (the previous update changed it to normal tabs by mistake)

## v0.7.5

- Built-in extensions (the ad blocker, Ruffle) no longer ask for permission when a page first loads
- New tabs now open as normal tabs, so history, frequently visited pins and saved logins work; Veil tabs are one tap away or switch it back in Settings
- The search hint on the start page no longer wraps and gets cut off
- At night the animated background gets a stronger wash, so text stays easy to read on dark scenes

## v0.7.4

- Each app's animated scene now has its own drifting symbols (maths signs in Abacus, notes in Echo, arrows in Wayfinder and so on), and the scene is a little clearer while text stays easy to read
- Animated backgrounds reworked after your report: they are drawn at a higher resolution and smoothly at 24 frames a second without slowing the app down, and no longer show horizontal lines

## v0.7.3

- Smoother scrolling: the bars no longer animate and resize the page, and they no longer flicker back and forth while you scroll
- Every app window now has the animated scene behind it, in the app's own colour (for example orange water in Abacus, green in Pulse, purple in Scribble), following your Aqua, Bliss or Super look and the real sunrise and sunset. Motion Reduced shows a still picture and Off turns it off
- Help buttons (?) explain the more confusing settings

## v0.7.2

- The start page scene now follows the real sunrise and sunset for your time zone instead of the plain clock
- Fixed a gap above the keyboard in screens with a bottom tab bar: the tab bar now steps aside while you type, so you can see what you are writing

## v0.7.1

- The on-screen keyboard no longer covers the page: the page shrinks to what is above the keyboard, the bottom bar steps aside while you type, and the box you tapped is scrolled into the middle of what is left (a small built-in Polaris page helper does this), which fixes sites like games and forms where you could not see what you were typing

## v0.7.0

- The page now gets the whole screen: the address bar and bottom bar slide away as you scroll down and return when you scroll up (Settings, Browsing, Hide the bars while scrolling)
- The tabs screen shows a picture of each page in a grid, so tabs are easy to tell apart
- A page that asks to close itself (a sign-in popup finishing) now closes its tab and returns you to the tab that opened it

## v0.6.0

- Vault logins now work natively in Polaris: tap a login box and Wonderdesk Vault's sheet opens (it unlocks first if needed) and fills the username and password; a login you type in is offered to Vault to save. No Android autofill setup is needed, and the old system popup is gone from Polaris
- Settings, Passwords opens Vault

## v0.5.1

- Fixed Polaris crashing over and over: the add-on update check ran on a background thread and installing an update from there brought the whole browser down. Updates now install safely, and a failure in the check can no longer crash the app

## v0.5.0

- The start page has the same living background as the Wonderdesk Launcher (Aqua, Bliss or Super to match your look, following the time of day; tap for bubbles), with a switch to turn it off
- The Normal / Veil switch is now a small control in the top corner
- Frequently visited sites appear on the start page from your history (like Firefox), with a switch to turn them off, and a long-press option to remove one from history
- Import bookmarks from another browser is in Customize this page
- Typing a calculation such as 12*(3+4), 15% of 80 or sqrt(2)^3 in the search box shows the answer right away
- New setting: when Polaris starts, open the previous tabs, the previous tabs and a new tab, or only a new tab

## v0.4.5

- Fixed an old search suggestion sometimes staying on the address bar after you left it

## v0.4.4

- Typing in the address bar is smooth: suggestions are looked up in the background instead of freezing the screen on every key, and browsing history is saved quietly in the background instead of during page loads
- Saved logins: Polaris now tells Android its pages have login boxes, so Wonderdesk Vault's suggestion appears under the username and password fields (with Vault v0.6.19 or newer)
- The Customize button on the start page is now a small icon in the bottom corner

## v0.4.3

- Saved logins: Polaris now lets Android autofill see login boxes, so Wonderdesk Vault can offer your saved passwords and save new ones (turn Vault on as the autofill service in Android settings)
- The ⋮ menu opens right under its button instead of in the wrong place
- Extension buttons are in the ⋮ menu, and extension pop-ups open in a larger, tidier window with a close button
- Start page: pin sites (⋮ menu, then Pin to start page), long-press a tile for options, and Customize this page to show or hide pinned sites, bookmarks, recent pages and the Normal/Veil switch, and to set tiles per row

## v0.4.2

- The start page has a Normal / Veil switch for the tab you are on, and a switch for whether new tabs start in Veil

## v0.4.1

- Polaris keeps its own icon in the Wonderdesk Launcher and App Hub (the size-shrinking step was removing the artwork they look up)

## v0.4.0

- Extension store: search and browse Mozilla's add-on site from inside Polaris (recommended extensions first), see icons, ratings and user counts, and add one with a permission prompt
- Extensions update by themselves (checked twice a day, switch off in Extensions), or tap the update row to do it now
- Each extension has its own "Works in Veil tabs" switch
- Much smaller app: the phone build now carries only the arm64 engine, shrunk and compressed, about 119 MB instead of 415 MB

## v0.3.0

- Polaris now runs on Firefox's own engine (GeckoView 140) instead of Android's system WebView
- Veil tabs are real Firefox private browsing: separate cookies and storage that vanish when the tab closes
- Real uBlock Origin comes built in, with its full dashboard (filter lists, My filters, dynamic rules), plus Ruffle for Flash content, Video DownloadHelper, FastForward, ClearURLs, SponsorBlock, Return YouTube Dislike and Improve YouTube, all switched on in Veil (private) tabs too
- Firefox's tracking protection (standard or strict) and safe browsing
- Add your own Firefox extensions from an .xpi file; the Extensions screen lists and removes them
- Route everything through Tor with Orbot
- Page prompts, drop-down lists, file pickers, permission questions and extension permission questions all show properly

## v0.2.0

- Links that open a new window now open as a new tab; popups only when you tapped something
- Hold a link or picture for a menu: open in a new tab or Veil tab, copy, share, download the image
- Find in page with highlighted matches and next/previous
- The address bar suggests bookmarks and history as you type, and has a bookmark star
- Downloads list, Reader view, Google Safe Browsing protection

## v0.1.0

- Tabs, Veil (private) tabs by default, ad and tracker blocking with EasyList import, desktop site, browser disguise, per-site open-in-app rules, bookmarks and history with import, add to home screen, silent screenshots, Vault passwords through autofill
