# Supabaseセットアップ

このディレクトリのSQLは自動では適用されません。Supabase Dashboardで次の順に準備します。

1. `Authentication > Providers > Anonymous Sign-Ins`を有効にする
2. SQL Editorで`migrations/001_profiles.sql`を実行する
3. SQL Editorで`migrations/002_morning_requests.sql`を実行する
4. SQL Editorで`migrations/003_voice_messages.sql`を実行する
5. SQL Editorで`migrations/004_update_attribute_options.sql`を実行する（属性の選択肢を変更した場合。既存環境では未実行だと`profiles_user_type_check`等で登録エラーになります）

実行後、次を確認します。

- `profiles`、`morning_requests`、`voice_messages`でRLSが有効
- `voice-messages` bucketがPrivate
- `send_personal_voice`が`authenticated`からのみ実行可能
- `.env`には公開URLとPublishable Keyだけを設定

`service_role`やSecret Keyはアプリへ設定しません。
