package expo.modules.wakealarm

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.res.ResourcesCompat

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

    // Matches the app's notebook look (constants/theme.ts): the same
    // wallpaper and handwritten font used across the JS screens, so the
    // lock-screen alarm doesn't feel like a different, unstyled app.
    val handwrittenFont: Typeface? =
      ResourcesCompat.getFont(this, R.font.tegaki851)

    setContentView(
      FrameLayout(this).apply {
        addView(ImageView(this@WakeAlarmActivity).apply {
          setImageResource(R.drawable.notebook_wallpaper)
          scaleType = ImageView.ScaleType.CENTER_CROP
        }, FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        ))

        addView(LinearLayout(this@WakeAlarmActivity).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER
          setPadding(64, 64, 64, 64)

          addView(TextView(this@WakeAlarmActivity).apply {
            text = title
            textSize = 32f
            setTextColor(Color.rgb(17, 17, 17))
            typeface = handwrittenFont
            gravity = Gravity.CENTER
          })
          addView(Button(this@WakeAlarmActivity).apply {
            text = "アラームを停止"
            textSize = 20f
            typeface = handwrittenFont
            // paperColors.orange (constants/theme.ts) -- the same warm
            // accent the primary "起きる" action uses in the JS wake screens.
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
              setColor(Color.parseColor("#E8A044"))
              cornerRadius = 16f
            }
            setPadding(48, 32, 48, 32)
            elevation = 0f
            stateListAnimator = null
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
        }, FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        ))

        // Placed at the bottom of the screen, below the message and the
        // stop button -- the same boombox playback artwork used on the
        // record/give screens (components/voice/boombox-recorder.tsx).
        addView(ImageView(this@WakeAlarmActivity).apply {
          setImageResource(R.drawable.radioplayer_play)
          scaleType = ImageView.ScaleType.FIT_CENTER
          adjustViewBounds = true
        }, FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT,
          Gravity.BOTTOM
        ).apply {
          leftMargin = 48
          rightMargin = 48
          bottomMargin = 48
        })
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
