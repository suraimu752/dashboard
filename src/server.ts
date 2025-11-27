import { handler } from '../build/handler.js';
import express from 'express';
import https from 'https';
import fs from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

// ビルドファイルの存在確認
const handlerPath = join(process.cwd(), 'build', 'handler.js');
if (!existsSync(handlerPath)) {
	console.error('ビルドファイルが見つかりません。先に `npm run build` を実行してください。');
	console.error(`期待されるパス: ${handlerPath}`);
	process.exit(1);
}

const app = express();

// SSL証明書のパス
const keyPath = '/home/pi/192.168.116.60-key.pem';
const certPath = '/home/pi/192.168.116.60.pem';

// 証明書ファイルの存在確認
if (!existsSync(keyPath) || !existsSync(certPath)) {
	console.error('SSL証明書ファイルが見つかりません。');
	console.error(`秘密鍵: ${keyPath}`);
	console.error(`証明書: ${certPath}`);
	process.exit(1);
}

// SvelteKitのハンドラーを使用
app.use(handler);

// HTTPSサーバーの設定
const httpsOptions = {
	key: fs.readFileSync(keyPath),
	cert: fs.readFileSync(certPath)
};

const PORT = process.env.PORT || 3000;

// HTTPSサーバーを起動
const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
	console.log(`HTTPSサーバーが起動しました: https://0.0.0.0:${PORT}`);
	console.log(`ローカルアクセス: https://localhost:${PORT}`);
});

// エラーハンドリング
server.on('error', (error: Error) => {
	console.error('サーバーエラー:', error);
	process.exit(1);
});

process.on('SIGTERM', () => {
	console.log('SIGTERMシグナルを受信しました。サーバーを終了します...');
	server.close(() => {
		console.log('サーバーを終了しました。');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINTシグナルを受信しました。サーバーを終了します...');
	server.close(() => {
		console.log('サーバーを終了しました。');
		process.exit(0);
	});
});

