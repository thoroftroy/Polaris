plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

// Keep the newest installable APK in the repo root (BlissPlayer-style) so it
// can be attached to a release; older versioned APKs in the root are pruned.
tasks.register("collectRootApk") {
    dependsOn("assembleDebug")
    doLast {
        val outDir = layout.buildDirectory.dir("outputs/apk/debug").get().asFile
        @Suppress("unchecked_cast")
        val meta = groovy.json.JsonSlurper().parse(outDir.resolve("output-metadata.json")) as Map<*, *>
        @Suppress("unchecked_cast")
        val element = (meta["elements"] as List<*>).first() as Map<*, *>
        val version = element["versionName"] as String
        val built = outDir.resolve(element["outputFile"] as String)
        val name = "${rootDir.name.replace(' ', '-')}-v$version-debug.apk"
        val keep = rootDir.resolve(name)
        if (built.canonicalPath != keep.canonicalPath) built.copyTo(keep, overwrite = true)
        rootDir.listFiles { file: java.io.File -> file.isFile && file.name.startsWith("Wonderdesk-") && file.name.endsWith("-debug.apk") && file.name != name }?.forEach { it.delete() }
    }
}
afterEvaluate {
    tasks.named("assembleDebug") { finalizedBy("collectRootApk") }
}

dependencies {
    implementation("org.mozilla.geckoview:geckoview-omni:140.0.20250707120347")
    testImplementation("junit:junit:4.13.2")
}

// GeckoView asks for newer AndroidX than the suite's build tools accept; these older ones work with it.
configurations.all { resolutionStrategy { force("androidx.core:core:1.15.0", "androidx.core:core-ktx:1.15.0")
    eachDependency { if (requested.group == "org.jetbrains.kotlin" && requested.name.startsWith("kotlin-stdlib")) useVersion("1.9.24") } }
}


android { defaultConfig { ndk { abiFilters += listOf("arm64-v8a", "x86_64") } } }

// Extensions keep their translations in a folder called _locales, which Android would otherwise leave out of the app.
android { androidResources { ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~" } }
