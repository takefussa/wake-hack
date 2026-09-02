package expo.modules.wakealarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WakeAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      WakeAlarmScheduler.actionFire -> {
        val id = intent.getStringExtra(WakeAlarmScheduler.extraAlarmId) ?: return
        val title = intent.getStringExtra(WakeAlarmScheduler.extraTitle) ?: "朝の時間です"
        WakeAlarmPlayerService.start(context, id, title)
      }

      WakeAlarmScheduler.actionStop -> {
        val id = intent.getStringExtra(WakeAlarmScheduler.extraAlarmId)
        WakeAlarmPlayerService.stop(context, id)
        WakeAlarmStorage.clear(context, id)
      }

      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_LOCKED_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> {
        val alarm = WakeAlarmStorage.read(context) ?: return
        if (alarm.scheduledFor > System.currentTimeMillis() + 4_000) {
          runCatching { WakeAlarmScheduler.schedule(context, alarm) }
        } else {
          WakeAlarmStorage.clear(context, alarm.id)
        }
      }
    }
  }
}
