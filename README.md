# オキタ！（Okita!）

Tornado2026向けのExpo / React Nativeプロトタイプです。

## Local setup

```bash
npm install
npx expo start
```

Expo GoをインストールしたiPhoneで、表示されたQRコードを読み取って通常画面を確認できます。
ただし、OSの実アラーム機能はネイティブモジュールを使うためExpo Goでは動きません。

## 実機アラームMVP

無料のApple Personal Teamで動かせる、Pushを使わない構成です。設定時刻にはiOS 26以降の
AlarmKitから音を鳴らします。最初に端末標準音を保険として登録し、ユーザーがアプリを開いた
時にSupabase上のPersonal Voiceを確認します。声が届いていればiPhoneへダウンロードして
`Library/Sounds`のWAVへ変換し、人の声を使うAlarmKitへ差し替えます。

```bash
supabase db push
```

Aが起床リクエストを保存して誰かに声を届け、BがAへ録音を送ったあと、Aは寝る前に一度
アプリを開きます。アプリは起動時とフォアグラウンド復帰時に自動確認します。確認画面に
「人の声アラームを設定しました」と表示されたら、アプリを閉じてロックして構いません。
翌朝はローカル保存済みの人の声が停止操作まで鳴ります。Personal Voiceがまだ無い場合は、
無音を避けるため標準アラームを残します。

iPhoneをMacへ接続し、Developer Modeを有効にしてDevelopment Buildをインストールします。

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
npx expo run:ios --configuration Release --device
```

AndroidはUSBデバッグを有効にした実機を接続して実行します。このMacでHomebrewの
Java / Android SDKを使う場合のコマンドは次のとおりです。

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=/opt/homebrew/share/android-commandlinetools \
npx expo run:android --device
```

実機確認ではBが録音を送ったあと、Aのアプリを開いて「人の声アラームを設定しました」と
表示されるまで待ち、画面をロックします。Expo GoにはWakeAlarmネイティブモジュールが無いため
使用できません。iOS 25以前ではAlarmKitを利用できません。

## Checks

```bash
npm run typecheck
npm run lint
```

プロダクト仕様は `docs/PRODUCT_SPEC.md`、実装仕様は `docs/IMPLEMENTATION_SPEC.md` を正とします。
