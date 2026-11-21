package dev.wonderdesk.polaris

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import java.io.InputStream

/** Saves downloads into the Downloads folder. */
object Downloads {
    private val main = android.os.Handler(android.os.Looper.getMainLooper())

    fun save(c: Context, body: InputStream, name: String, mime: String) {
        Thread {
            try {
                val cr = c.contentResolver
                val v = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, name); put(MediaStore.Downloads.MIME_TYPE, mime)
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS); put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v) ?: throw java.io.IOException("no place to save")
                try {
                    cr.openOutputStream(uri)!!.use { out -> body.use { it.copyTo(out, 64 * 1024) } }
                    cr.update(uri, ContentValues().apply { put(MediaStore.Downloads.IS_PENDING, 0) }, null, null)
                    main.post { Hooks.toast("Saved $name to Downloads") }
                } catch (e: Exception) { runCatching { cr.delete(uri, null, null) }; throw e }
            } catch (e: Exception) { main.post { Hooks.toast("Couldn't save $name") } }
        }.start()
    }

    fun viaManager(c: Context, url: String, name: String, cd: String?, mime: String) {
        runCatching {
            c.getSystemService(android.app.DownloadManager::class.java).enqueue(android.app.DownloadManager.Request(Uri.parse(url))
                .setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name))
            Hooks.toast("Downloading $name")
        }.onFailure { Hooks.toast("Couldn't start the download") }
    }
}
