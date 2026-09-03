package expo.modules.wakealarm

import android.content.Context

internal data class StoredWakeAlarm(
  val id: String,
  val scheduledFor: Long,
  val title: String,
  val morningRequestId: String,
  val soundFilePath: String? = null
)

internal data class StoppedWakeAlarm(
  val morningRequestId: String,
  val stoppedAt: String
)

internal object WakeAlarmStorage {
  private const val preferencesName = "wake_alarm"
  private const val idKey = "id"
  private const val scheduledForKey = "scheduled_for"
  private const val titleKey = "title"
  private const val morningRequestIdKey = "morning_request_id"
  private const val soundFilePathKey = "sound_file_path"

  private const val stoppedPreferencesName = "wake_alarm_stopped"
  private const val stoppedMorningRequestIdKey = "morning_request_id"
  private const val stoppedAtKey = "stopped_at"

  fun read(context: Context): StoredWakeAlarm? {
    val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    val id = preferences.getString(idKey, null) ?: return null
    val scheduledFor = preferences.getLong(scheduledForKey, 0)
    if (scheduledFor <= 0) return null
    return StoredWakeAlarm(
      id = id,
      scheduledFor = scheduledFor,
      title = preferences.getString(titleKey, null) ?: "朝の時間です",
      morningRequestId = preferences.getString(morningRequestIdKey, null) ?: "",
      soundFilePath = preferences.getString(soundFilePathKey, null)
    )
  }

  fun write(context: Context, alarm: StoredWakeAlarm) {
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(idKey, alarm.id)
      .putLong(scheduledForKey, alarm.scheduledFor)
      .putString(titleKey, alarm.title)
      .putString(morningRequestIdKey, alarm.morningRequestId)
      .apply {
        if (alarm.soundFilePath != null) {
          putString(soundFilePathKey, alarm.soundFilePath)
        } else {
          remove(soundFilePathKey)
        }
      }
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

  fun markStopped(context: Context, morningRequestId: String?) {
    if (morningRequestId.isNullOrEmpty()) return
    context.getSharedPreferences(stoppedPreferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(stoppedMorningRequestIdKey, morningRequestId)
      .putString(stoppedAtKey, isoNow())
      .apply()
  }

  fun consumeStopped(context: Context): StoppedWakeAlarm? {
    val preferences = context.getSharedPreferences(stoppedPreferencesName, Context.MODE_PRIVATE)
    val morningRequestId = preferences.getString(stoppedMorningRequestIdKey, null) ?: return null
    val stoppedAt = preferences.getString(stoppedAtKey, null) ?: return null
    preferences.edit().clear().apply()
    return StoppedWakeAlarm(morningRequestId, stoppedAt)
  }

  private fun isoNow(): String {
    val formatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
    formatter.timeZone = java.util.TimeZone.getTimeZone("UTC")
    return formatter.format(java.util.Date())
  }
}
