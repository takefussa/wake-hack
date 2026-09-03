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

  private fun alarmManager(context: Context): AlarmManager =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  fun canSchedule(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return alarmManager(context).canScheduleExactAlarms()
  }

  fun schedule(context: Context, alarm: StoredWakeAlarm) {
    require(alarm.scheduledFor > System.currentTimeMillis() + 4_000) {
      "The alarm date must be at least five seconds in the future."
    }
    check(canSchedule(context)) {
      "Exact alarm access is unavailable."
    }

    WakeAlarmStorage.read(context)?.let { cancel(context, it.id, clearStorage = false) }

    val operation = PendingIntent.getBroadcast(
      context,
      alarm.id.hashCode(),
      Intent(context, WakeAlarmReceiver::class.java)
        .setAction(actionFire)
        .putExtra(extraAlarmId, alarm.id)
        .putExtra(extraTitle, alarm.title),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val showIntent = PendingIntent.getActivity(
      context,
      alarm.id.hashCode(),
      WakeAlarmActivity.intent(context, alarm.id, alarm.title),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    alarmManager(context).setAlarmClock(
      AlarmManager.AlarmClockInfo(alarm.scheduledFor, showIntent),
      operation
    )
    WakeAlarmStorage.write(context, alarm)
  }

  fun cancel(context: Context, id: String, clearStorage: Boolean = true) {
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
    WakeAlarmPlayerService.stop(context, id)
    if (clearStorage) WakeAlarmStorage.clear(context, id)
  }
}
