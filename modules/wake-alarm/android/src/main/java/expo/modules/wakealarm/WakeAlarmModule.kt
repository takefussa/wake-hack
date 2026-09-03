package expo.modules.wakealarm

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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

    AsyncFunction("scheduleAlarm") { id: String, fireDateMs: Double, title: String ->
      UUID.fromString(id)
      val alarm = StoredWakeAlarm(id, fireDateMs.toLong(), title)
      WakeAlarmScheduler.schedule(context, alarm)
      mapOf("id" to id, "scheduledFor" to fireDateMs)
    }

    AsyncFunction("replaceAlarmWithVoice") {
      _: String, _: String, _: Double, _: String, _: String, _: String ->
      unsupportedVoiceReplacement()
    }

    AsyncFunction("cancelAlarm") { id: String ->
      WakeAlarmScheduler.cancel(context, id)
    }

    AsyncFunction("removeSoundFile") { _: String -> Unit }

    Function("getAlarmIds") {
      WakeAlarmStorage.read(context)?.let { listOf(it.id) } ?: emptyList<String>()
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
  }

  private fun unsupportedVoiceReplacement(): Map<String, Any> {
    throw UnsupportedOperationException(
      "Custom Wake Voice alarms are not enabled on Android yet."
    )
  }
}
