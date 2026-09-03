package expo.modules.wakealarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

internal object WakeAlarmScheduler {
  const val actionFire = "expo.modules.wakealarm.FIRE"
  const val actionStop = "expo.modules.wakealarm.STOP"
  const val extraAlarmId = "alarm_id"
  const val extraTitle = "alarm_title"
  const val extraMorningRequestId = "morning_request_id"
  const val extraSoundFilePath = "sound_file_path"

  private fun alarmManager(context: Context): AlarmManager =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  fun canSchedule(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return alarmManager(context).canScheduleExactAlarms()
  }

  /**
   * Registers [alarm] with AlarmManager and persists it *before* touching any
   * previously-scheduled alarm, so a failure here never leaves the device
   * without a working alarm (Business Rule 7: something must always ring).
   */
  fun schedule(context: Context, alarm: StoredWakeAlarm) {
    require(alarm.scheduledFor > System.currentTimeMillis() + 4_000) {
      "The alarm date must be at least five seconds in the future."
    }
    check(canSchedule(context)) {
      "Exact alarm access is unavailable."
    }

    val previous = WakeAlarmStorage.read(context)

    val operation = PendingIntent.getBroadcast(
      context,
      alarm.id.hashCode(),
      Intent(context, WakeAlarmReceiver::class.java)
        .setAction(actionFire)
        .putExtra(extraAlarmId, alarm.id)
        .putExtra(extraTitle, alarm.title)
        .putExtra(extraMorningRequestId, alarm.morningRequestId)
        .putExtra(extraSoundFilePath, alarm.soundFilePath),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val showIntent = PendingIntent.getActivity(
      context,
      alarm.id.hashCode(),
      WakeAlarmActivity.intent(context, alarm.id, alarm.title, alarm.morningRequestId),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    alarmManager(context).setAlarmClock(
      AlarmManager.AlarmClockInfo(alarm.scheduledFor, showIntent),
      operation
    )
    WakeAlarmStorage.write(context, alarm)

    if (previous != null && previous.id != alarm.id) {
      cancelPendingIntent(context, previous.id)
      WakeAlarmPlayerService.stop(context, previous.id)
    }
  }

  fun cancel(context: Context, id: String, clearStorage: Boolean = true) {
    cancelPendingIntent(context, id)
    WakeAlarmPlayerService.stop(context, id)
    if (clearStorage) WakeAlarmStorage.clear(context, id)
  }

  private fun cancelPendingIntent(context: Context, id: String) {
    val operation = PendingIntent.getBroadcast(
      context,
      id.hashCode(),
      Intent(context, WakeAlarmReceiver::class.java).setAction(actionFire),
      PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )
    if (operation != null) {
      alarmManager(context).cancel(operation)
      operation.cancel()
    }
  }

  /**
   * Brings the RN app to the foreground after the alarm is stopped, matching
   * the iOS AlarmKit stop intent's `.foreground(.immediate)` behavior, so the
   * app's own "wake up" screen appears instead of leaving the person on the
   * home screen. Stopping the native alarm UI/notification alone does not do
   * this on Android since they run outside the app's own task.
   */
  fun launchApp(context: Context) {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: return
    intent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP
    )
    context.startActivity(intent)
  }
}
