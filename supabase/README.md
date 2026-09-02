# Supabaseセットアップ

このディレクトリのSQLは自動では適用されません。Supabase Dashboardで次の順に準備します。

1. `Authentication > Providers > Anonymous Sign-Ins`を有効にする
2. SQL Editorで`migrations/001_profiles.sql`を実行する
3. SQL Editorで`migrations/002_morning_requests.sql`を実行する
4. SQL Editorで`migrations/003_voice_messages.sql`を実行する
5. SQL Editorで`migrations/004_update_attribute_options.sql`を実行する（属性の選択肢を変更した場合。既存環境では未実行だと`profiles_user_type_check`等で登録エラーになります）
6. SQL Editorで`migrations/005_fix_legacy_attribute_values.sql`を実行する（004より前に登録された既存データを新しい属性値に書き換えます。必ず004の後に実行してください）
7. SQL Editorで`migrations/006_thanks_messages.sql`を実行する
8. SQL Editorで`migrations/007_friendships.sql`を実行する
9. SQL Editorで`migrations/008_friendship_responses.sql`を実行する
10. SQL Editorで`migrations/009_profile_details.sql`を実行する
11. SQL Editorで`migrations/010_custom_morning_schedules.sql`を実行する
12. SQL Editorで`migrations/011_wake_assignments_and_sessions.sql`を実行する
13. SQL Editorで`migrations/012_alarm_voice_delivery.sql`を実行する
14. SQL Editorで`migrations/013_fix_personal_voice_receiver.sql`を実行する（Personal Voice送信時に受信者の朝リクエストを対象にする修正）
15. SQL Editorで`migrations/014_community_voice_delivery.sql`を実行する（Community VoiceをSupabaseへ保存し、実機アラームで再生するため）

実行後、次を確認します。

- `profiles`、`morning_requests`、`voice_messages`、`thanks_messages`、`friendships`でRLSが有効
- `voice-messages` bucketがPrivate
- `profile-images` bucketがPrivate
- `send_personal_voice`が`authenticated`からのみ実行可能
- `request_friendship`が`authenticated`からのみ実行可能
- `respond_to_friendship`が`authenticated`からのみ実行可能
- `assign_wake_voice`が`authenticated`からのみ実行可能
- `wake_assignments.morning_request_id`と`wake_sessions.morning_request_id`が一意
- `acknowledge_personal_voice_alarm`が`authenticated`からのみ実行可能
- `.env`には公開URLとPublishable Keyだけを設定

`service_role`やSecret Keyはアプリへ設定しません。
