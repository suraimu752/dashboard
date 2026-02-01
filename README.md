# Dashboard

センサーデータと天気情報を表示するリアルタイムダッシュボードアプリケーションです。

## 機能

- **センサーデータ表示**
  - 温度（°C）
  - 湿度（%）
  - 気圧（hPa）
  - CO2濃度（ppm）
- **リアルタイムグラフ表示** - Chart.jsを使用した時系列データの可視化
- **天気予報表示** - 日本気象庁の天気予報APIから取得した情報を表示
- **フルスクリーン対応** - 大画面表示に対応
- **レスポンシブデザイン** - 2160x1080の基準解像度で設計

## 技術スタック

- **フレームワーク**: SvelteKit 2.x
- **言語**: TypeScript
- **ビルドツール**: Vite
- **グラフライブラリ**: Chart.js
- **アイコン**: Lucide Svelte
- **日付処理**: date-fns
- **アダプター**: @sveltejs/adapter-node

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または pnpm

### インストール

```sh
npm install
```

## 開発

開発サーバーを起動します：

```sh
npm run dev

# ブラウザで自動的に開く
npm run dev -- --open
```

開発サーバーは通常 `https://localhost:5173` で起動します（HTTPS有効）。

## ビルド

本番用ビルドを作成します：

```sh
npm run build
```

ビルド後、プレビューを確認できます：

```sh
npm run preview
```

## 本番環境

本番環境でHTTPSサーバーを起動します：

```sh
# 1. ビルド
npm run build

# 2. サーバー起動
npm start
```

サーバーは `https://0.0.0.0:3000` で起動します（ポートは `PORT` 環境変数で変更可能）。

### HTTPS証明書

本番環境では以下の証明書ファイルが必要です：
- 秘密鍵: `/home/pi/192.168.116.60-key.pem`
- 証明書: `/home/pi/192.168.116.60.pem`

証明書ファイルが存在しない場合、サーバーは起動しません。

## 型チェック

TypeScriptの型チェックを実行します：

```sh
npm run check
```

ウォッチモードで型チェックを実行します：

```sh
npm run check:watch
```

## Android アプリ

このダッシュボードを表示する Android アプリ（WebView）を同梱しています。

- フォルダ: `android-app/`
- ビルド・使い方: `android-app/README.md` を参照してください。

## プロジェクト構造

```
dashboard/
├── android-app/          # Android アプリ（WebView）
├── src/
│   ├── lib/
│   │   ├── components/     # Svelteコンポーネント
│   │   │   ├── Clock.svelte
│   │   │   ├── SensorCard.svelte
│   │   │   ├── SensorChart.svelte
│   │   │   └── WeatherForecast.svelte
│   │   └── stores/         # Svelteストア
│   │       ├── sensorStore.ts
│   │       └── weatherStore.ts
│   ├── routes/             # ルート
│   │   └── +page.svelte    # メインページ
│   ├── app.css             # グローバルスタイル
│   ├── app.html            # HTMLテンプレート
│   └── server.ts           # 本番用HTTPSサーバー
├── static/                 # 静的ファイル
├── build/                  # ビルド出力
└── package.json
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
