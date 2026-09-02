package expo.modules.wakealarm

import android.content.Context

internal data class StoredWakeAlarm(
  val id: String,
  val scheduledFor: Long,
  val title: String
)

internal object WakeAlarmStorage {
  private const val preferencesName = "wake_alarm"
  private const val idKey = "id"
  private const val scheduledForKey = "scheduled_for"
  private const val titleKey = "title"

  fun read(context: Context): StoredWakeAlarm? {
    val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    val id = preferences.getString(idKey, null) ?: return null
    val scheduledFor = preferences.getLong(scheduledForKey, 0)
    if (scheduledFor <= 0) return null
    return StoredWakeAlarm(
      id = id,
      scheduledFor = scheduledFor,
      title = preferences.getString(titleKey, null) ?: "朝の時間です"
    )
  }

  fun write(context: Context, alarm: StoredWakeAlarm) {
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(idKey, alarm.id)
      .putLong(scheduledForKey, alarm.scheduledFor)
      .putString(titleKey, alarm.title)
      .apply()
  }

  fun clear(context: Context, expectedId: String? = null) {
    val stored = read(context)
    if (expectedId != null && stored?.id != expectedId) return
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit()
      .clear()
      .apply()
  }
}
