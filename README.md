# Neovim Theme for Hatena Blog

はてなブログをNeovim風のUIに変換するカスタムテーマです。

## デモ

https://hatebu.jp

## 特徴

### Neovim風UI
- **トップバー**: トラフィックライト（赤・黄・緑）+ ブログタイトル + テーマ切替
- **タブバー**: 訪問したページをVimのバッファタブとして管理
- **ファイルブラウザ**: 左サイドパネルにツリー形式で記事一覧を表示
- **ステータスバー**: NORMAL / INSERT / COMMAND モード表示
- **Vimカーソル**: コンテンツ末尾に点滅カーソル

### キーボード操作
| キー | 動作 |
|------|------|
| `j` / `k` | 記事選択 or スクロール |
| `Shift+H` / `Shift+L` | ファイルブラウザ / メインビュー切替 |
| `Enter` | 選択した記事を開く |
| `Tab` | 次のタブへ |
| `Shift+T` | 新しいタブで開く |
| `Shift+Q` | タブを閉じる |
| `i` | INSERTモード（シェアボタン表示） |
| `/` | COMMANDモード（検索） |
| `Escape` | NORMALモードに戻る |
| `:q` | 前のページに戻る |
| `:help` | ヘルプ表示 |

### トラフィックライト
- **赤**: Vim Uganda スプラッシュ画面
- **黄**: ミニマイズモード（デスクトップのみ、ドラッグ＆リサイズ可能）
- **緑**: フルスクリーンモード

### テーマモード

#### ダーク / ライト
Catppuccin/Moonlight パレットベースの2色切替。Cookie で保持。

#### 386モード
レトロDOS風の表示に切り替え。
- **ライト+386**: DOS青（#0000aa）背景 / 緑ボーダー / EGAカラー
- **ダーク+386**: 黒背景 / グレーボーダー / モノクロターミナル風
- DOSフォント（Px437_IBM_EGA8）
- 画像をEGA風16色にポスタライズ（SVGフィルター）
- 角丸なし、影なし

#### 1984モード
ジョージ・オーウェル「1984年」風のディストピア表示。
- 全テキストに赤い打ち消し線
- 全画像がビッグ・ブラザーに差し替え
- プロパガンダメッセージをランダムに挿入
- OFFで全て元に戻る

### モバイル対応
- タッチデバイス＋狭画面で自動的にモバイルモードに切替
- 左右スワイプでメインコンテンツ ⇔ ファイルブラウザを切替
- スワイプインジケータードット表示

## ファイル構成

| ファイル | 説明 |
|----------|------|
| `hatena-blog-theme.css` | テーマCSS（ソース） |
| `hatena-blog-neovim.js` | テーマJS（ソース） |
| `hatena-blog-neovim-hatena.html` | はてなブログ用にCSS+JSをminifyして結合したファイル |
| `hatena-blog-demo.html` | ローカルデモ用HTML |

## セットアップ

1. `hatena-blog-neovim-hatena.html` の内容をコピー
2. はてなブログの管理画面 → デザイン → カスタマイズ → ヘッダ（タイトル下）に貼り付け
3. 保存

## ビルド

ソースファイル（`.css` / `.js`）を編集した後、以下のコマンドではてなブログ用ファイルを再生成:

```bash
# minify
npx terser hatena-blog-neovim.js -c -m --output /tmp/nv-min.js
npx clean-css-cli hatena-blog-theme.css -o /tmp/nv-min.css

# 結合
{ echo '<style>'; \
  echo '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");'; \
  cat /tmp/nv-min.css; \
  echo '</style>'; \
  echo '<script>'; \
  cat /tmp/nv-min.js; \
  echo '</script>'; \
} > hatena-blog-neovim-hatena.html
```

> **注意**: はてなブログのカスタムHTML欄は約64KBの文字数制限があります。ソースファイルを編集する際はminify後のサイズに注意してください。

## ライセンス

MIT
