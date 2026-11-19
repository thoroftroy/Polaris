# Polaris changelog

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
