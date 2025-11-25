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

開発サーバーは通常 `http://localhost:5173` で起動します。

## ビルド

本番用ビルドを作成します：

```sh
npm run build
```

ビルド後、プレビューを確認できます：

```sh
npm run preview
```

## 型チェック

TypeScriptの型チェックを実行します：

```sh
npm run check
```

ウォッチモードで型チェックを実行します：

```sh
npm run check:watch
```

## プロジェクト構造

```
dashboard/
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
│   └── app.html            # HTMLテンプレート
├── static/                 # 静的ファイル
├── build/                  # ビルド出力
└── package.json
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
