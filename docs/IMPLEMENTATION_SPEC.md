# Wake Hack Prototype v0.1 実装仕様書

**対象:** Tornado2026 ハッカソン用スマートフォンアプリ
**目的:** チームレビュー可能な高完成度インタラクティブプロトタイプの構築
**対象環境:** iOS / Android
**開発方式:** React Native + Expo
**バックエンド:** Prototype v0.1では使用しない。Mock Dataで再現
**後続:** Supabaseへ置換可能な構造にする

---

# 1. Prototype v0.1 の目的

単なる画面モックではなく、

> **「Wake Hackを実際に使ったらどういう1日になるか」をスマートフォン上で最初から最後まで体験できる状態**

を作る。

以下を一連で操作可能にする。

```text
アプリ初回起動
↓
プロフィール登録
↓
ホーム
↓
明日の朝を設定
↓
朝リクエスト作成
↓
Giveする / しないを選択
↓
Giveする場合は他人の朝リクエストを見る
↓
音声を録音
↓
翌朝の準備完了
↓
翌朝を疑似的に開始
↓
Wake Voiceで起床
↓
起床ミッション
↓
起床成功
↓
Thanks
↓
朝フレンド
↓
朝のつながりを見る
```

見た目だけではなく、

- 画面遷移
- 選択内容の保持
- 音声録音
- 音声再生
- Personal / Community分岐
- Thanks
- 朝フレンド
- 起床結果

まで動かす。

---

# 2. 技術スタック

## 必須

```text
React Native
Expo
TypeScript
Expo Router
```

## 推奨ライブラリ

```text
expo-audio
@react-native-async-storage/async-storage
zustand
```

### expo-audio

- 音声録音
- 録音音声再生

に利用。

### AsyncStorage

Prototypeの、

- プロフィール
- 明日の朝設定
- Give状況
- 起床履歴

をアプリ再起動後も保持する。

### Zustand

アプリ全体の状態管理。

複雑なReduxは使用しない。

---

# 3. Prototype設計原則

## 原則1

**Mockだから雑に作らない。**

バックエンドだけMockにして、

UI・UXは本番を想定して作る。

---

## 原則2

UIコードとデータ取得処理を分離する。

悪い例：

```text
画面コンポーネントの中に
mockRequestsを直接大量定義
```

良い例：

```text
Screen
 ↓
Service
 ↓
MockRepository
```

後から、

```text
MockRepository
↓
SupabaseRepository
```

へ差し替えられる構造にする。

---

## 原則3

Personal VoiceとCommunity Voiceを明確に分ける。

```text
Giveした
↓
Personal Voice対象

Giveしていない
↓
Community Voice
```

---

## 原則4

GiveとWakeを相互ペアにしない。

```text
A → BへGive

C → AへWake
```

でよい。

---

## 原則5

朝のWake Voiceは必ず1つ。

複数Giveしていても、

```text
Wake Voice × 1
```

のみ。

---

# 4. プロジェクト構成

推奨ディレクトリ：

```text
wake-hack/
├─ app/
│  ├─ _layout.tsx
│  │
│  ├─ onboarding/
│  │  ├─ index.tsx
│  │  └─ profile.tsx
│  │
│  ├─ morning/
│  │  ├─ setup.tsx
│  │  ├─ condition.tsx
│  │  ├─ give-choice.tsx
│  │  ├─ request-list.tsx
│  │  ├─ request-detail.tsx
│  │  ├─ record.tsx
│  │  ├─ give-complete.tsx
│  │  └─ ready.tsx
│  │
│  ├─ wake/
│  │  ├─ alarm.tsx
│  │  ├─ mission.tsx
│  │  ├─ complete.tsx
│  │  └─ thanks.tsx
│  │
│  ├─ friend/
│  │  └─ request.tsx
│  │
│  └─ (tabs)/
│     ├─ _layout.tsx
│     ├─ index.tsx
│     ├─ connections.tsx
│     ├─ friends.tsx
│     └─ profile.tsx
│
├─ components/
│  ├─ common/
│  ├─ profile/
│  ├─ morning/
│  ├─ voice/
│  └─ wake/
│
├─ features/
│  ├─ profile/
│  ├─ morning/
│  ├─ voice/
│  ├─ matching/
│  ├─ wake/
│  ├─ thanks/
│  └─ friends/
│
├─ services/
│  ├─ profileService.ts
│  ├─ morningRequestService.ts
│  ├─ voiceService.ts
│  ├─ matchingService.ts
│  ├─ wakeService.ts
│  └─ thanksService.ts
│
├─ repositories/
│  ├─ interfaces/
│  └─ mock/
│
├─ store/
│  └─ useAppStore.ts
│
├─ data/
│  ├─ mockUsers.ts
│  ├─ mockRequests.ts
│  ├─ mockCommunityVoices.ts
│  └─ mockThanks.ts
│
├─ types/
│  ├─ user.ts
│  ├─ morning.ts
│  ├─ voice.ts
│  ├─ wake.ts
│  └─ friendship.ts
│
├─ constants/
│  ├─ theme.ts
│  ├─ options.ts
│  └─ config.ts
│
├─ hooks/
│
└─ assets/
   ├─ images/
   ├─ avatars/
   └─ audio/
```

---

# 5. Navigation

メイン画面はBottom Tabs。

```text
ホーム
朝のつながり
朝フレンド
プロフィール
```

それ以外はStackで表示。

---

# 6. 初回起動判定

アプリ起動時、

```text
profile.exists
```

を確認。

### profileなし

```text
Onboarding
↓
Profile Setup
```

### profileあり

```text
Home
```

へ移動。

PrototypeではAsyncStorageを使用。

---

# 7. Screen 01 — Onboarding

## 目的

Wake Hackの価値を短時間で理解させる。

3ページ程度。

### Page 1

```text
朝、起きるのつらくない？
```

機械的なアラームではなく、

> 誰かの声で朝を始める。

---

### Page 2

```text
夜、誰かの朝を10秒応援する。
```

---

### Page 3

```text
翌朝、
別の誰かの声があなたに届く。
```

CTA：

```text
はじめる
```

---

# 8. Screen 02 — Profile Setup

## 項目

### Avatar

用意されたアバターから選択。

Prototypeでは画像アップロード不要。

### ニックネーム

最大12文字程度。

### 属性

1つ選択。

```text
大学生
受験生
社会人
社会人1年目
その他
```

### タグ

複数選択。

```text
一人暮らし
朝が苦手
朝活したい
夜型
```

CTA：

```text
プロフィールを作成
```

---

# 9. Screen 03 — Home

ホームは現在状況によって表示を変える。

## Morning Request未作成

```text
こんばんは 🌙

明日の朝を準備しよう

[ 明日の朝を設定 ]
```

---

## Morning Request作成済

```text
明日の朝

07:00

大学生
1限
少し憂鬱

Personal Voice準備中

[ 内容を見る ]
```

---

## Wake Voice準備完了

```text
明日の朝

07:00

✓ Wake Voice準備完了

おやすみなさい 🌙
```

Prototypeでは、

```text
朝を体験する
```

というデモボタンも置く。

---

# 10. Screen 04 — Morning Setup

起床時間設定。

iOS風ホイールまたはTime Picker。

1分単位。

例：

```text
07 : 03
```

クイック選択：

```text
06:30
07:00
07:30
08:00
```

CTA：

```text
次へ
```

---

# 11. Screen 05 — Tomorrow Condition

## 明日の予定

複数選択可能。

```text
1限
授業
試験
発表
面接
仕事
朝活
旅行
特にない
```

---

## 今の気分

1つ。

```text
少し憂鬱
緊張している
疲れている
普通
楽しみ
```

---

## 起こされ方

1つ。

```text
優しく
明るく
背中を押して
面白く
落ち着いて
```

CTA：

```text
朝リクエストを作る
```

---

# 12. MorningRequest データ

```ts
type MorningRequest = {
  id: string;
  userId: string;

  wakeAt: string;

  schedules: ScheduleType[];
  mood: MoodType;
  preferredVoiceStyle: VoiceStyle;

  personalEligible: boolean;

  status: "draft" | "open" | "voice_assigned" | "completed";

  createdAt: string;
};
```

---

# 13. Screen 06 — Give Choice

表示：

```text
明日の朝の準備ができました 🌙

誰かの朝も
10秒だけ応援しますか？
```

選択肢：

## A

```text
誰かに声を届ける

→ Personal Voiceを受け取れる
```

## B

```text
今日は届けない

→ Community Voiceで朝を迎える
```

---

# 14. Giveしない場合

選択した瞬間、

```text
personalEligible = false
```

にする。

翌朝：

```text
Community Voice
```

を割り当てる。

そのままReady画面へ。

---

# 15. Giveする場合

```text
personalEligible = true
```

には**録音完了後**に変更する。

選択しただけではPersonal対象にしない。

次にRequest Listへ移動。

---

# 16. Screen 07 — Request List

表示タイトル：

```text
明日の誰か ☀️
```

カード形式。

例：

```text
Takumi

大学生

🎤 明日は発表
⏰ 7:30ごろ
🔥 背中を押してほしい
```

別例：

```text
Mio

受験生

📝 明日は試験
⏰ 6:40ごろ
🤍 優しく
```

---

# 17. リクエスト表示優先順位

Mock Matchingでも以下を再現する。

優先：

```text
1. voiceCount === 0
2. 自分と予定が近い
3. 属性が近い
4. 起こされ方が近い
5. 起床時間が近い
```

自分自身は除外。

---

# 18. Screen 08 — Request Detail

表示内容：

```text
Takumi
大学生

明日の朝
7:30

予定
発表

気分
緊張している

希望
背中を押してほしい
```

CTA：

```text
この人に声を届ける
```

---

# 19. Screen 09 — Record Voice

録音上限：

```text
10秒
```

最低長：

```text
2秒
```

UI：

```text
Takumiさんへ

00:00 / 00:10

      🎙️

録音する
```

録音中：

```text
00:07

~~~~ waveform ~~~~

[ 停止 ]
```

---

# 20. 録音完了UI

```text
録音しました

▶ 00:08

[ 再生 ]

[ 録り直す ]

[ この声を届ける ]
```

---

# 21. 録音時ヒント

相手の条件を表示。

```text
Takumiさん

明日は発表
背中を押してほしい
```

例：

```text
「発表頑張って！
きっと大丈夫です！」
```

ただし文章を強制しない。

---

# 22. Give完了

音声送信後：

```text
あなたの声を届けました ☀️

Takumiさんの朝に
届きます
```

ここで初めて、

```text
personalEligible = true
```

にする。

---

# 23. 追加Give

Give完了画面に、

```text
もう1人応援する
```

ボタン。

押すとRequest Listへ戻る。

回数制限なし。

Prototypeでも複数回Give可能にする。

---

# 24. Give構造

例：

```text
You → A
You → B
You → C
```

可能。

ただし翌朝：

```text
D → You
```

のVoiceだけで起きる。

---

# 25. VoiceMessage型

```ts
type VoiceMessage = {
  id: string;

  senderId: string;
  receiverId?: string;

  morningRequestId?: string;

  uri: string;
  durationMs: number;

  type: "personal" | "community" | "thanks";

  createdAt: string;
};
```

---

# 26. Personal Voice割り当て

PrototypeではMock Assignmentを行う。

Give完了後、

自分とは別のMock Userから、

```text
Personal Voice
```

を1つ割り当てる。

例：

```text
You → TakumiへGive

Takuma → YouへPersonal Voice
```

---

# 27. Community Voice

Mock Community Voiceを最低5個用意。

例：

```text
おはようございます。
今日も自分のペースでいきましょう。
```

```text
今日もいい朝になりますように。
無理せずいきましょう。
```

ランダムまたは条件ベースで1個割り当てる。

---

# 28. Screen 10 — Tomorrow Ready

### Personalの場合

```text
明日の朝 ☀️

07:00

✓ あなた宛ての声が届きました

誰から届いたかは
朝までのお楽しみ

おやすみなさい 🌙
```

---

### Communityの場合

```text
明日の朝 ☀️

07:00

✓ Community Voice準備完了

明日は、
みんなから届いた応援の声で
朝を始めます

おやすみなさい 🌙
```

---

# 29. Prototype Wake開始方法

PrototypeではHomeまたはReady画面に、

```text
朝を体験する
```

というDeveloper / Demo用CTAを用意。

押すとAlarmへ。

将来的に削除可能な設計にする。

---

# 30. Screen 11 — Alarm

朝らしいグラデーション背景。

大きく：

```text
07:00
```

### Personal

```text
今日1限のあなたへ

Takuma
大学生
```

音声：

```text
▶ Wake Voice
```

---

### Community

```text
Good Morning ☀️

Community Voice
```

グループアイコンを表示。

---

# 31. Alarm再生

Wake画面表示時、

可能なら音声を自動再生。

自動再生が難しい環境では、

```text
声を聞く
```

を目立つ位置に置く。

---

# 32. Personal表示原則

ファイル名は見せない。

悪：

```text
audio_72.m4a
```

良：

```text
Takumaさんから
今日のあなたへ
```

---

# 33. Alarm CTA

音声を聞いた後、

```text
起きる ☀️
```

CTA。

押すとMissionへ。

スヌーズはPrototypeではUIだけでもよい。

---

# 34. Screen 12 — Wake Mission

Prototype v0.1では、

## Mission 1

```text
50歩歩く
```

を基本とする。

Expoセンサーが簡単に使える場合は実歩数。

難しい場合はデモ用進行ボタンでシミュレーション可能にする。

---

# 35. Mission UI

```text
ベッドから離れよう ☀️

23 / 50歩

████████░░
```

---

# 36. デモモード

ハッカソン発表時に50歩本当に歩かなくてもよいように、

開発モード限定で：

```text
+10歩
```

などの非表示/デモボタンを用意してよい。

通常UIでは目立たせない。

---

# 37. Mission完了

50歩到達：

```text
MISSION COMPLETE
```

↓

Wake Completeへ。

---

# 38. Screen 13 — Wake Complete

```text
GOOD MORNING ☀️

7:06

起きられました！
```

Personal Voiceの場合：

```text
Takumaさんの声で
朝をスタートしました
```

---

# 39. 起床人数

Prototype Mock：

```text
今朝7時前後に

163人

が朝を始めました
```

追加：

```text
大学生 48人
1限あり 17人
```

---

# 40. 「起きられた！」処理

ボタン：

```text
起きられた！
```

押下でWakeSessionを完了。

同時に、

Personal Voiceのsenderに対して、

```text
Wake success notification
```

をMock生成する。

---

# 41. WakeSession型

```ts
type WakeSession = {
  id: string;

  userId: string;
  morningRequestId: string;

  voiceMessageId: string;

  alarmAt: string;
  wokeAt?: string;

  missionCompleted: boolean;

  status: "scheduled" | "ringing" | "mission" | "completed";
};
```

---

# 42. Screen 14 — Thanks Send

Personalの場合のみ表示。

```text
Takumaさんへ
ありがとうを伝えますか？
```

Quick Reaction：

```text
☀️ 起きられた！
🙏 ありがとう！
💪 頑張れそう！
😊 元気出た！
```

任意テキスト：

```text
メッセージを書く
```

Prototypeでは音声Thanksは任意実装。

---

# 43. Thanks型

```ts
type ThanksMessage = {
  id: string;

  senderId: string;
  receiverId: string;

  sourceVoiceMessageId: string;

  type: "reaction" | "text" | "voice";

  content?: string;
  audioUri?: string;

  createdAt: string;
};
```

---

# 44. Giveした相手からのThanks

Mockとして、

自分がGiveしたユーザーのうち一部から、

時間差でThanksを生成。

例：

```text
Takumi

「起きられました！
声ありがとうございます ☀️」
```

---

# 45. 複数Give時

例えば自分が、

```text
A
B
C
```

にGive。

Thanks Inboxには、

```text
A → Thanks
B → Thanks
C → Thanks
```

が複数届いてよい。

---

# 46. Screen 15 — Thanks Inbox

Connectionsタブ内に配置してもよい。

表示：

```text
あなたに届いたありがとう
```

カード：

```text
Takumi

☀️ 起きられた！

「発表頑張れそうです！
ありがとう！」

7:42
```

---

# 47. Screen 16 — Friend Request

Wake Complete後：

```text
またTakumaさんと
朝を迎えたい？
```

選択：

```text
また朝を迎えたい

今回はここまで
```

---

# 48. 相互希望

PrototypeではMockで、

一定確率または固定のDemo Userの場合：

```text
Takumaさんも
「また朝を迎えたい」
と思っています
```

↓

```text
朝フレンドになりました ☀️
```

---

# 49. Friendship型

```ts
type Friendship = {
  id: string;

  userAId: string;
  userBId: string;

  status: "pending" | "matched";

  morningCount: number;

  createdAt: string;
};
```

---

# 50. Friends Tab

表示：

```text
朝フレンド
```

カード：

```text
Takuma

大学生

一緒に起きた回数
3回
```

CTA：

```text
プロフィールを見る
```

将来的には、

```text
明日はこの人にお願いする
```

を追加可能。

PrototypeではUIのみでもよい。

---

# 51. Connections Tab

目的：

> 自分が社会の中で朝を迎えている感覚。

表示：

```text
今日の朝 ☀️

1,248人
がWake Hackで朝を始めました
```

---

## My time

```text
7時前後
163人
```

---

## Same context

```text
大学生
48人

1限
17人
```

---

## Thanks

最近届いたThanksを表示。

---

# 52. Profile Tab

表示：

```text
Avatar

Ryo
大学生
```

実績：

```text
声を届けた
12人

起こしてもらった
10回

朝フレンド
4人

連続起床
5日
```

---

# 53. Profile Edit

編集可能：

- ニックネーム
- Avatar
- 属性
- タグ

---

# 54. Zustand Store

最低限：

```ts
type AppStore = {
  currentUser: UserProfile | null;

  currentMorningRequest: MorningRequest | null;

  givenVoiceMessages: VoiceMessage[];

  assignedWakeVoice: VoiceMessage | null;

  wakeSession: WakeSession | null;

  thanksMessages: ThanksMessage[];

  friendships: Friendship[];

  setProfile: (...) => void;
  setMorningRequest: (...) => void;

  completeGive: (...) => void;

  assignWakeVoice: (...) => void;

  startWakeSession: (...) => void;
  completeMission: (...) => void;

  addThanks: (...) => void;
};
```

---

# 55. 永続化

以下はAsyncStorage。

```text
profile
morning request
give history
wake history
thanks
friends
```

アプリを閉じても消えないようにする。

---

# 56. Service Interface

将来Supabaseへ切り替えるため、

画面からMock Dataを直接呼ばない。

例：

```ts
interface MorningRequestRepository {
  create(request: MorningRequest): Promise<MorningRequest>;

  getAvailableRequests(userId: string): Promise<MorningRequest[]>;

  getById(id: string): Promise<MorningRequest | null>;
}
```

Prototype：

```text
MockMorningRequestRepository
```

後：

```text
SupabaseMorningRequestRepository
```

に差し替える。

---

# 57. MatchingService

Prototypeでも独立モジュール。

入力：

```text
currentUser
currentMorningRequest
candidateRequests
```

出力：

```text
ranked requests
```

---

# 58. Matching Score案

厳密なAIは不要。

例：

```text
voiceCount === 0
+100

sameSchedule
+40

sameUserType
+25

sameVoiceStyle
+15

wakeTime ±15min
+15

wakeTime ±30min
+10

wakeTime ±60min
+5
```

Mockでも、

> ランダムではなく「意味のある相手が出ている」

ように見せる。

---

# 59. Request Card表示理由

例えば：

```text
あなたとの共通点

🎓 大学生
📚 朝から大事な予定
⏰ 起床時間が近い
```

を出してもよい。

---

# 60. UIテーマ

## Night

```text
navy
purple
deep blue
```

## Morning

```text
orange
yellow
soft pink
light blue
```

---

# 61. Design Tokens

constants/theme.ts にまとめる。

例：

```ts
export const colors = {
  primary: "...",
  secondary: "...",
  background: "...",
  surface: "...",
  textPrimary: "...",
  textSecondary: "...",
  success: "...",
};
```

画面で色コードを直接乱用しない。

---

# 62. 共通UI Component

最低限作る。

```text
PrimaryButton
SecondaryButton
Avatar
TagChip
UserCard
MorningRequestCard
VoicePlayer
VoiceRecorder
ProgressBar
StatCard
EmptyState
LoadingState
ScreenHeader
```

---

# 63. Loading状態

Mockでも一瞬表示可能。

例：

```text
あなたに合う朝リクエストを
探しています...
```

ただし長時間待たせない。

300〜600ms程度の疑似Delayでもよい。

---

# 64. Empty State

リクエストがない場合：

```text
今は個別リクエストがありません

少し時間を置くか、
Community Voiceを利用できます
```

Prototypeでは必ずMock Requestsを用意するため基本発生しない。

---

# 65. Error State

録音失敗：

```text
録音できませんでした

マイクの権限を確認してください
```

CTA：

```text
もう一度試す
```

---

# 66. Permission

音声録音時にマイク権限要求。

拒否した場合は説明画面を表示。

---

# 67. アニメーション

過剰にはしない。

利用推奨：

- ボタン押下
- 録音波形
- 起床成功
- マッチ成功
- Thanks受信

---

# 68. 起床成功演出

ConfettiやSun animationなど、

発表時に見栄えする演出を入れる。

ただし外部ライブラリ大量追加は避ける。

---

# 69. Mock Users

最低8人程度用意。

例：

```text
Takuma
大学生
1限
7:10
優しく

Takumi
大学生
発表
7:30
背中を押して

Mio
受験生
試験
6:40
優しく

Haruka
社会人1年目
仕事
7:20
明るく

Sota
大学生
朝活
6:30
元気に
```

属性・状況を意図的に分散させる。

---

# 70. Mock Community Voice

最低5件。

実際の音声ファイルをassets/audioに置くか、

Prototype初期はサンプル音源を使用。

---

# 71. Prototype Demo Scenario

発表用に固定Scenarioを用意。

### User

```text
Ryo
大学生
一人暮らし
朝が苦手
```

---

### Tomorrow

```text
07:00
1限
少し憂鬱
優しく起こしてほしい
```

---

### Give先

```text
Takumi

大学生
明日は発表
7:30

背中を押してほしい
```

---

### Wake sender

```text
Takuma

大学生
7:10
```

---

### Thanks

翌朝：

```text
Takumi

「起きられました！
発表頑張ってきます。
ありがとう！」
```

このScenarioは必ず破綻なく動くようにする。

---

# 72. Community Demo Scenario

別導線として、

```text
今日はGiveしない
```

を選択。

翌朝：

```text
Community Voice
```

で起床。

Personal Voiceとの差を確認可能にする。

---

# 73. プロトタイプの完成基準

以下が**実機でエラーなく一連操作できる**こと。

### Flow A — Personal

```text
Profile
↓
Morning Setup
↓
Condition
↓
Give
↓
Request
↓
Recording
↓
Send
↓
Ready
↓
Wake
↓
Mission
↓
Complete
↓
Thanks
↓
Friend
```

---

### Flow B — Community

```text
Morning Setup
↓
Condition
↓
Giveしない
↓
Ready
↓
Community Voice
↓
Mission
↓
Complete
```

---

### Flow C — Multiple Give

```text
Give
↓
Give Complete
↓
もう1人応援
↓
Give
↓
複数Thanks
```

---

# 74. Prototypeで実装しないもの

以下はまだ本実装しない。

```text
Supabase
本番Authentication
本番Push Notification
OSレベルの本物のAlarm
本番マッチング
AI推薦
本番音声アップロード
本番モデレーション
本番ユーザー間通信
```

ただし、

**後から入れやすいコード構造**

にはしておく。

---

# 75. 後からSupabaseへ移行する部分

## Mock

```text
MockProfileRepository
MockMorningRequestRepository
MockVoiceRepository
MockThanksRepository
```

↓

## Supabase

```text
SupabaseProfileRepository
SupabaseMorningRequestRepository
SupabaseVoiceRepository
SupabaseThanksRepository
```

UIをほとんど変更せず切り替えられることを目標とする。

---

# 76. Codexへの実装指示

Codexは一度に全部のコードを巨大生成するのではなく、

以下の順番で実装する。

## Step 1

プロジェクト基盤。

- Expo Router
- TypeScript
- directory
- theme
- Zustand
- AsyncStorage

## Step 2

Onboarding / Profile。

## Step 3

Home / Morning Setup。

## Step 4

Request List / Detail。

## Step 5

録音 / 再生。

## Step 6

Personal / Community分岐。

## Step 7

Wake / Mission / Complete。

## Step 8

Thanks。

## Step 9

Friends / Connections / Profile。

## Step 10

UI polish / animation / error handling。

---

# 77. Codexが守る実装ルール

- TypeScriptの`any`を極力使用しない
- UIとデータ処理を分離
- 1ファイルを巨大化させない
- 共通Componentを使う
- Typeをtypes配下へ
- Mock Dataをdata配下へ
- 色やspacingを直接大量記述しない
- navigation routeを整理
- console errorを残さない
- unused importを残さない
- コメントは必要箇所のみ
- 不必要なライブラリを増やさない
- main business ruleを勝手に変更しない

---

# 78. 絶対に変更してはいけないBusiness Rule

Codexが勝手に解釈変更しないよう明記。

### Rule 1

```text
Giveした人
→ Personal Voice対象
```

### Rule 2

```text
Giveしていない人
→ Community Voice
```

### Rule 3

```text
Give相手
≠
Wakeしてくれる相手
でもよい
```

### Rule 4

```text
Wake Voiceは翌朝1つだけ
```

### Rule 5

```text
Giveは複数回可能
```

### Rule 6

```text
複数Give
→ 複数Thanksの可能性
```

### Rule 7

```text
Personal Voiceがなくても
アラーム体験そのものを失敗させない
```

---

# 79. Prototype v0.1 のゴール

チームメンバーがアプリを触ったとき、

説明なしでも、

> 「夜に誰かの朝を少し応援する」

↓

> 「翌朝、自分も誰かの声で起きる」

↓

> 「起きたことが相手へ返る」

という循環が理解できる状態。

また、

> **ただの『他人の音声アラーム』ではなく、人と人の小さなつながりを作るプロダクト**

だとUIから理解できること。

---

# 80. 最終デモで見せる体験

デモでは以下を約2〜3分以内に見せられること。

```text
① プロフィール
   ↓
② 明日の朝を設定
   ↓
③ Takumiの朝リクエスト
   ↓
④ 10秒録音
   ↓
⑤ 「声を届けました」
   ↓
⑥ 翌朝へ時間ジャンプ
   ↓
⑦ TakumaのPersonal Voice
   ↓
⑧ 50歩ミッション
   ↓
⑨ 起床成功
   ↓
⑩ 「あなたの声でTakumiが起きました」
```

最後に、

```text
今朝7時前後に
163人が朝を始めました
```

を表示。

Wake Hackの

> **1対1の小さなつながり + 大勢と朝を迎えている感覚**

の両方をデモで伝える。
