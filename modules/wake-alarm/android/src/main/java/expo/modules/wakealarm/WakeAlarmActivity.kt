package expo.modules.wakealarm

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class WakeAlarmActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    val alarmId = intent.getStringExtra(WakeAlarmScheduler.extraAlarmId)
    val title = intent.getStringExtra(WakeAlarmScheduler.extraTitle) ?: "朝の時間です"
    val morningRequestId = intent.getStringExtra(WakeAlarmScheduler.extraMorningRequestId)
    setContentView(
      LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(64, 64, 64, 64)
        setBackgroundColor(Color.rgb(247, 240, 222))

        addView(TextView(this@WakeAlarmActivity).apply {
          text = title
          textSize = 32f
          setTextColor(Color.rgb(48, 70, 62))
          gravity = Gravity.CENTER
        })
        addView(Button(this@WakeAlarmActivity).apply {
          text = "アラームを停止"
          textSize = 20f
          setOnClickListener {
            WakeAlarmPlayerService.stop(this@WakeAlarmActivity, alarmId)
            WakeAlarmStorage.clear(this@WakeAlarmActivity, alarmId)
            WakeAlarmStorage.markStopped(this@WakeAlarmActivity, morningRequestId)
            WakeAlarmScheduler.launchApp(this@WakeAlarmActivity)
            finishAndRemoveTask()
          }
        }, LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 72 })
      }
    )
  }

  companion object {
    fun intent(context: Context, id: String, title: String, morningRequestId: String? = null): Intent =
      Intent(context, WakeAlarmActivity::class.java)
        .putExtra(WakeAlarmScheduler.extraAlarmId, id)
        .putExtra(WakeAlarmScheduler.extraTitle, title)
        .putExtra(WakeAlarmScheduler.extraMorningRequestId, morningRequestId)
        .addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        )
  }
}
