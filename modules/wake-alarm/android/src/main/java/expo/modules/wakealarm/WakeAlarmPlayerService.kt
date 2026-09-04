package expo.modules.wakealarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import java.io.File

class WakeAlarmPlayerService : Service() {
  private var mediaPlayer: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var activeAlarmId: String? = null
  private var activeMorningRequestId: String? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == actionStop) {
      stopAlarm(intent.getStringExtra(WakeAlarmScheduler.extraAlarmId))
      return START_NOT_STICKY
    }

    val stored = WakeAlarmStorage.read(this)
    val id = intent?.getStringExtra(WakeAlarmScheduler.extraAlarmId)
      ?: stored?.id
      ?: return START_NOT_STICKY
    val title = intent?.getStringExtra(WakeAlarmScheduler.extraTitle)
      ?: stored?.title
      ?: "朝の時間です"
    val morningRequestId = intent?.getStringExtra(WakeAlarmScheduler.extraMorningRequestId)
      ?: stored?.morningRequestId
    val soundFilePath = intent?.getStringExtra(WakeAlarmScheduler.extraSoundFilePath)
      ?: stored?.soundFilePath

    activeAlarmId = id
    activeMorningRequestId = morningRequestId
    ensureNotificationChannel()
    startForeground(notificationId, buildNotification(id, title, morningRequestId))
    acquireWakeLock()
    startVibration()
    startSound(soundFilePath)
    return START_STICKY
  }

  override fun onDestroy() {
    releaseResources()
    super.onDestroy()
  }

  private fun buildNotification(id: String, title: String, morningRequestId: String?): Notification {
    val fullScreenIntent = PendingIntent.getActivity(
      this,
      id.hashCode(),
      WakeAlarmActivity.intent(this, id, title, morningRequestId),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val stopIntent = PendingIntent.getBroadcast(
      this,
      id.hashCode(),
      Intent(this, WakeAlarmReceiver::class.java)
        .setAction(WakeAlarmScheduler.actionStop)
        .putExtra(WakeAlarmScheduler.extraAlarmId, id)
        .putExtra(WakeAlarmScheduler.extraMorningRequestId, morningRequestId),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, channelId)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }
    return builder
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(title)
      .setContentText("停止するまでアラームが鳴ります")
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(fullScreenIntent)
      .setFullScreenIntent(fullScreenIntent, true)
      .addAction(Notification.Action.Builder(0, "停止", stopIntent).build())
      .build()
  }

  private fun ensureNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      channelId,
      "朝のアラーム",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "設定した時刻に鳴る目覚ましアラーム"
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setSound(null, null)
      enableVibration(false)
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  /**
   * Plays [soundFilePath] (a downloaded Personal/Community Voice recording)
   * when it exists and is playable. Any problem with the custom file falls
   * back to the system default alarm sound so the alarm never rings silent
   * (Business Rule 7).
   */
  private fun startSound(soundFilePath: String?) {
    if (mediaPlayer?.isPlaying == true) return

    if (soundFilePath != null && File(soundFilePath).let { it.exists() && it.length() > 0 }) {
      try {
        mediaPlayer = MediaPlayer().apply {
          setAudioAttributes(
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_ALARM)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build()
          )
          setDataSource(soundFilePath)
          isLooping = true
          prepare()
          start()
        }
        return
      } catch (error: Exception) {
        Log.w("WakeAlarmPlayerService", "Falling back to the default alarm sound", error)
        mediaPlayer?.runCatching { release() }
        mediaPlayer = null
      }
    }

    val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    mediaPlayer = MediaPlayer().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      setDataSource(this@WakeAlarmPlayerService, alarmUri)
      isLooping = true
      prepare()
      start()
    }
  }

  private fun startVibration() {
    @Suppress("DEPRECATION")
    val service = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    vibrator = service
    val pattern = longArrayOf(0, 700, 350, 700, 350)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      service.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      service.vibrate(pattern, 0)
    }
  }

  private fun acquireWakeLock() {
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "wake-hack:alarm"
    ).apply { acquire(30 * 60 * 1_000L) }
  }

  private fun stopAlarm(requestedId: String?) {
    if (requestedId != null && activeAlarmId != null && requestedId != activeAlarmId) return
    activeAlarmId?.let { WakeAlarmStorage.clear(this, it) }
    WakeAlarmStorage.markStopped(this, activeMorningRequestId)
    WakeAlarmScheduler.launchApp(this)
    releaseResources()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun releaseResources() {
    mediaPlayer?.runCatching {
      if (isPlaying) stop()
      release()
    }
    mediaPlayer = null
    vibrator?.cancel()
    vibrator = null
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
  }

  companion object {
    private const val channelId = "wake-native-alarm"
    private const val notificationId = 70_001
    private const val actionStart = "expo.modules.wakealarm.START_SERVICE"
    private const val actionStop = "expo.modules.wakealarm.STOP_SERVICE"

    fun start(
      context: Context,
      id: String,
      title: String,
      morningRequestId: String? = null,
      soundFilePath: String? = null
    ) {
      val intent = Intent(context, WakeAlarmPlayerService::class.java)
        .setAction(actionStart)
        .putExtra(WakeAlarmScheduler.extraAlarmId, id)
        .putExtra(WakeAlarmScheduler.extraTitle, title)
        .putExtra(WakeAlarmScheduler.extraMorningRequestId, morningRequestId)
        .putExtra(WakeAlarmScheduler.extraSoundFilePath, soundFilePath)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context, id: String?) {
      context.stopService(Intent(context, WakeAlarmPlayerService::class.java))
      (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
        .cancel(notificationId)
    }
  }
}
