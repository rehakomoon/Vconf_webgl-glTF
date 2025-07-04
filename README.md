# glTF Viewer for Vconf

ブラウザ上で glTF / glb ファイルを表示する React 製のアプリケーションです。`React Three Fiber` と `@react-three/drei` を利用し、簡単に 3D モデルをアップロード・表示できます。ZIP 形式の glTF パッケージ (scene.gltf + scene.bin + textures) にも対応しており、表示後はサーバーへ送信することも可能です。

## 主な機能
- `.glb` もしくは glTF 一式をまとめた `.zip` のアップロード
- アップロードしたモデルのブラウザ表示
- 送信ボタンによるファイルアップロード (php/api/upload.php)
- サーバーとの接続確認 (php/api/ping.php)

## セットアップ
1. リポジトリを取得後、依存パッケージをインストールします。
   ```bash
   npm install
   ```
2. 開発サーバーを起動します。
   ```bash
   npm start
   ```
   デフォルトでは [http://localhost:3000](http://localhost:3000) でアプリが起動します。

### ビルド
本番用のビルドは以下で作成できます。
```bash
npm run build
```
`build/` ディレクトリに静的ファイルが出力されます。

### テスト
```bash
npm test
```
`react-scripts` によるテストランナーが起動します。

## サーバーサイド
`php/api` ディレクトリに簡易アップロード API が含まれています。PHP の実行環境があればそのまま利用できます。

- `upload.php` : 受け取った `.zip` または `.glb` ファイルを `uploads/` ディレクトリに保存します。
- `ping.php` : 接続確認用のエンドポイントです。

## ライセンス
このプロジェクトは MIT ライセンスです。
