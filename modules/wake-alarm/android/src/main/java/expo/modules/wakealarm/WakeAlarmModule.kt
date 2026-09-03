package expo.modules.wakealarm

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class WakeAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WakeAlarm")

    Function("isAvailable") { true }

    Function("getAuthorizationStatus") {
      if (WakeAlarmScheduler.canSchedule(context)) "authorized" else "denied"
    }

    AsyncFunction("requestAuthorization") {
      if (!WakeAlarmScheduler.canSchedule(context) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.startActivity(
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
            .setData(Uri.parse("package:${context.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
      if (WakeAlarmScheduler.canSchedule(context)) "authorized" else "denied"
    }

    AsyncFunction("scheduleAlarm") { id: String, fireDateMs: Double, title: String, morningRequestId: String ->
      UUID.fromString(id)
      val alarm = StoredWakeAlarm(id, fireDateMs.toLong(), title, morningRequestId)
      WakeAlarmScheduler.schedule(context, alarm)
      mapOf("id" to id, "scheduledFor" to fireDateMs)
    }

    AsyncFunction("replaceAlarmWithVoice") {
      _: String, newId: String, fireDateMs: Double, title: String, remoteUrl: String, voiceId: String, morningRequestId: String ->
      UUID.fromString(newId)
      val soundFile = materializeVoiceFile(remoteUrl, voiceId)
      try {
        val alarm = StoredWakeAlarm(newId, fireDateMs.toLong(), title, morningRequestId, soundFile.absolutePath)
        WakeAlarmScheduler.schedule(context, alarm)
      } catch (error: Exception) {
        soundFile.delete()
        throw error
      }
      mapOf("id" to newId, "scheduledFor" to fireDateMs, "soundFileName" to soundFile.absolutePath)
    }

    AsyncFunction("rescheduleAlarmWithPreparedVoice") {
      _: String, newId: String, fireDateMs: Double, title: String, soundFileName: String, morningRequestId: String ->
      UUID.fromString(newId)
      val soundFile = File(soundFileName)
      if (!soundFile.exists() || soundFile.length() <= 0) {
        throw IOException("The prepared voice file is missing.")
      }
      val alarm = StoredWakeAlarm(newId, fireDateMs.toLong(), title, morningRequestId, soundFile.absolutePath)
      WakeAlarmScheduler.schedule(context, alarm)
      mapOf("id" to newId, "scheduledFor" to fireDateMs, "soundFileName" to soundFile.absolutePath)
    }

    AsyncFunction("cancelAlarm") { id: String ->
      WakeAlarmScheduler.cancel(context, id)
    }

    AsyncFunction("removeSoundFile") { fileName: String ->
      runCatching { File(fileName).delete() }
      Unit
    }

    Function("getAlarmIds") {
      WakeAlarmStorage.read(context)?.let { listOf(it.id) } ?: emptyList<String>()
    }

    Function("consumeStoppedAlarm") {
      WakeAlarmStorage.consumeStopped(context)?.let {
        mapOf("morningRequestId" to it.morningRequestId, "stoppedAt" to it.stoppedAt)
      }
    }

    AsyncFunction("openSettings") {
      val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT
      } else {
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS
      }
      context.startActivity(
        Intent(action)
          .setData(Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    // Android-only: apps targeting Android 14+ only get USE_FULL_SCREEN_INTENT
    // automatically if Play Store recognizes them as an alarm/calling app. Lets
    // the JS layer detect a silent revocation and steer the person to Settings.
    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
          .canUseFullScreenIntent()
      } else {
        true
      }
    }

    // Android-only: some OEMs (Xiaomi, Huawei, etc.) kill background apps
    // aggressively enough to prevent the alarm from firing unless the app is
    // excluded from battery optimization.
    Function("isIgnoringBatteryOptimizations") {
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      context.startActivity(
        Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    // Android-only: without POST_NOTIFICATIONS (API 33+) the alarm's
    // notification, including the full-screen intent that shows the lock
    // screen stop UI, is silently suppressed - the alarm rings with no way
    // to stop it. Pre-33 devices grant this at install time.
    Function("hasNotificationPermission") {
      hasNotificationPermission()
    }

    AsyncFunction("requestNotificationPermission") { promise: Promise ->
      if (hasNotificationPermission()) {
        promise.resolve(true)
        return@AsyncFunction
      }
      val manager = appContext.permissions
      if (manager == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      manager.askForPermissions(
        { result ->
          val granted = result[Manifest.permission.POST_NOTIFICATIONS]?.status == PermissionsStatus.GRANTED
          promise.resolve(granted)
        },
        Manifest.permission.POST_NOTIFICATIONS
      )
    }

    AsyncFunction("openNotificationSettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
          .setData(Uri.parse("package:${context.packageName}"))
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun hasNotificationPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
    return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
      PackageManager.PERMISSION_GRANTED
  }

  /**
   * Downloads (https) or copies (file:/content: URIs, e.g. a bundled asset)
   * [remoteUrl] into this app's private storage so it survives across
   * reboots and can be handed to MediaPlayer as a plain file path. No format
   * conversion is performed: MediaPlayer plays AAC/M4A directly, unlike
   * AlarmKit on iOS which requires a PCM WAV file.
   */
  private fun materializeVoiceFile(remoteUrl: String, voiceId: String): File {
    val destination = File(soundDirectory(), "wake-$voiceId.audio")
    val uri = Uri.parse(remoteUrl)
    when (uri.scheme?.lowercase()) {
      "http", "https" -> downloadHttp(remoteUrl, destination)
      null -> copyFromPlainPath(remoteUrl, destination)
      else -> copyFromContentResolver(uri, destination)
    }
    if (!destination.exists() || destination.length() <= 0) {
      destination.delete()
      throw IOException("The downloaded voice file is empty.")
    }
    return destination
  }

  private fun copyFromPlainPath(path: String, destination: File) {
    val source = File(path)
    if (!source.exists()) throw IOException("Cannot find the local voice file: $path")
    source.inputStream().use { input ->
      FileOutputStream(destination).use { output -> input.copyTo(output) }
    }
  }

  private fun downloadHttp(remoteUrl: String, destination: File) {
    val connection = URL(remoteUrl).openConnection() as HttpURLConnection
    connection.connectTimeout = 15_000
    connection.readTimeout = 15_000
    try {
      connection.inputStream.use { input ->
        FileOutputStream(destination).use { output -> input.copyTo(output) }
      }
    } finally {
      connection.disconnect()
    }
  }

  private fun copyFromContentResolver(uri: Uri, destination: File) {
    val input = context.contentResolver.openInputStream(uri)
      ?: throw IOException("Cannot open the local voice file: $uri")
    input.use { stream ->
      FileOutputStream(destination).use { output -> stream.copyTo(output) }
    }
  }

  private fun soundDirectory(): File {
    val directory = File(context.filesDir, "wake-alarm-sounds")
    if (!directory.exists()) directory.mkdirs()
    return directory
  }
}
