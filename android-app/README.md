# ダッシュボード Android アプリ

このWebサイト（SvelteKitダッシュボード）を表示するAndroidアプリです。WebViewでダッシュボードのURLを読み込み、アプリのように利用できます。

## 必要な環境

- **Android Studio** Hedgehog (2023.1.1) 以上、または **JDK 17** と **Android SDK**
- **Android SDK**: compileSdk 34、minSdk 24

## ダッシュボードURLの設定

デフォルトでは `https://192.168.116.60:3000` を表示します。

- **ビルド時に変更**: `app/src/main/res/values/strings.xml` の `default_dashboard_url` を編集
- **実行時に変更**: アプリ側で `PreferenceHelper.setDashboardUrl(context, "https://あなたのPiのIP:3000")` を呼ぶ設定画面を追加するか、同じネットワークのPiのIPに合わせて上記リソースを変更してください

## ビルド方法

### Android Studio から（推奨）

1. **Android Studio** でこのリポジトリのルートまたは `android-app` フォルダを開く
2. **File → Sync Project with Gradle Files** で同期（初回は Gradle と Wrapper がダウンロードされます）
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)** でAPKを生成

### コマンドラインから

初回のみ、Gradle が入っている環境で `gradle wrapper` を実行して Wrapper（`gradle-wrapper.jar` など）を生成してください。その後:

```bash
cd android-app
chmod +x gradlew
./gradlew assembleDebug   # デバッグAPK
./gradlew assembleRelease # リリースAPK（署名設定が必要）
```

APKの出力先: `app/build/outputs/apk/debug/app-debug.apk`

## インストール

1. Pi上でダッシュボードを起動しておく: `npm run build && npm start`（`https://0.0.0.0:3000` で待ち受け）
2. 同じWi-Fiに接続したAndroid端末にAPKをインストール
3. アプリを起動するとダッシュボードが表示されます

## HTTPS（自己署名証明書）について

ダッシュボードがHTTPSで自己署名証明書を使っている場合、Android 7以降はアプリからそのまま接続すると証明書エラーになることがあります。

- **開発時**: `app/src/main/AndroidManifest.xml` で `android:usesCleartextTraffic="true"` を付与しており、HTTPで待ち受ける場合は接続可能です（本番では無効化を推奨）
- **HTTPSのまま使う場合**:
  - 端末にルート証明書を「ユーザー証明書」としてインストールする、または
  - ドメインとLet’s Encryptなど信頼された証明書をサーバーに設定する

## プロジェクト構成

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/dashboard/app/
│   │   │   ├── MainActivity.kt      # WebViewメイン画面
│   │   │   ├── DashboardApp.kt      # Application
│   │   │   └── PreferenceHelper.kt  # URL保存
│   │   ├── res/
│   │   │   ├── layout/activity_main.xml
│   │   │   ├── values/strings.xml   # デフォルトURLなど
│   │   │   └── drawable/
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
