# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## リポジトリ概要

はてなブログをNeovim風UIに変換するカスタムテーマ。ビルドツール・パッケージマネージャ・テストフレームワークなし、依存関係は `npx` で都度呼び出される minifier だけ。実体は CSS 1本 + JS 1本 + 結合済 HTML 1本。

## ビルド

ソース (`hatena-blog-theme.css`, `hatena-blog-neovim.js`, `hatena-blog-neovim-boot.js`) を編集したら、必ず `./build.sh` で成果物を再生成すること。本番のはてなブログはこれらを参照し、ソースは見ない。

```bash
./build.sh   # terser / clean-css-cli を npx で呼び、末尾に各成果物のサイズを表示
```

成果物と貼り付け先:
- `hatena-blog-neovim-head.html` — **設定 → 詳細設定 → 「headに要素を追加」**。preconnect + 非同期フォント `<link>` + ブートJS(`<script>`) + minify済CSS(`<style>`、`@import` 無し)。CSSを `<head>` に置くことでFOUCを防ぐ
- `hatena-blog-neovim.min.js` — **デザイン → カスタマイズ → 記事下(またはフッタ)**。minify後のJSを `<script>...</script>` で囲んだもの。`#box2`(サイドバー)より後ろに置くと、JSは DOMContentLoaded を待たずに即 init する
- `hatena-blog-theme.min.css` — 旧構成用(CSSを本文側に貼る場合)。`@import` 入りで単体でフォントも読む
- `hatena-blog-neovim-hatena.html` — 旧構成用。上2つの連結(64KB超なので通常は使わない)

`hatena-blog-neovim-boot.js` は `<head>` で最初の描画前に走る極小スクリプト。Cookie から `nv_theme` / `nv_386` / `nv_1984` / `nv_wallpaper` を読んで `html` にクラスと `--nv-wallpaper` を付け、壁紙を preload する。`DEFAULT_WALLPAPER` は本体JSと同じ値を保つこと。

**注意**: `.min.css` / `.min.js` は文法上は不正（CSS/JSファイル内にHTMLタグが混入）だが、はてなブログのカスタムHTML欄に貼り付ける都合でこの形にしている。

**重要なサイズ制約**: はてなブログのカスタムHTML欄は **約64KB** が上限。`hatena-blog-neovim-head.html` と `hatena-blog-neovim.min.js` がそれぞれ64KB以内であることを常に確認する（`build.sh` の出力で確認）。

## ローカル開発

`hatena-blog-demo.html` がローカル動作確認用。はてなブログのDOM構造（`#globalheader-container`, `#container-inner`, `#content-inner`, `.entry`, `#box2` 等）を忠実に再現してあるので、ブラウザで直接開けば本番に近い見た目で挙動確認できる。Demo は **ソースの `.css` を `<link>` で、`hatena-blog-neovim-boot.js` と `hatena-blog-neovim.js` を `<script src>` で参照** しているので、編集はリロードで反映される（ブラウザキャッシュが効く場合は `?v=N` を付ける）。`?page=entry` を付けると記事ページ(1記事)レイアウトになる。

テストは無し。動作確認はブラウザで行う。

## アーキテクチャ

### コード構成

- `hatena-blog-theme.css` — 全スタイル。CSS変数で `dark` / `light` の2テーマを切替。`html.nv-dark`, `html.nv-light`, `html.nv-mobile`, `html.nv-minimized`, `html.nv-386`, `html.nv-1984` のクラス組合せで分岐。
- `hatena-blog-neovim.js` — 単一の IIFE。1000行強。`init()` が DOMContentLoaded で動き、はてなブログの既存DOMから情報を吸い上げて Vim 風UIを構築する。
- `hatena-blog-neovim-hatena.html` — 上2つの結合・minify版（**ソースではない、生成物**）。

### ランタイム構造

JS は init で以下を順に組み立てる:
1. **テーマ適用** — Cookie `nv_theme` → `prefers-color-scheme` → ダークの順で `html` にクラス付与
2. **モバイル判定** — タッチ + 狭画面で `html.nv-mobile`
3. **特殊モード復元** — Cookie の `nv_386`, `nv_1984` を見て適用
4. **デスクトップアイコン構築** （非モバイル時）
5. **UI構築** — `buildFileBrowser()`, `buildTabBar()`, `buildPromptBar()`, `setupContentLinks()`
6. **ウィンドウ位置復元** — Cookie `nv_win` から minimized ウィンドウの x/y/w/h を復元（**UI構築後に呼ぶ必要がある**、過去にバグ修正済）
7. **キーバインド登録**

### 状態は全部 Cookie

サーバ側は無いので、ユーザ状態はすべて Cookie。以下が永続化対象:
- `nv_theme` — `dark` / `light`
- `nv_tabs` — 開いてるタブのJSON配列
- `nv_focused` — `viewer` か `files`
- `nv_config` — `{ mouse: bool }`
- `nv_win` — minimized 時の `{x,y,w,h}`
- `nv_386`, `nv_1984` — `on` / unset
- `nv_wallpaper` — 背景壁紙の URL（Wallpaperアイコンで選択）

`NvCookie.get/set` ヘルパーが先頭にある。新しい状態を増やすなら同じパターンで。

### はてなブログDOMの吸収パターン

ファイルブラウザ (`#nv-files`) は `.entry` を巡って カテゴリでグループ化し、さらに `#box2` 内の "最新記事" モジュール (`.hatena-module-recent-entries`) を吸い上げて表示する。`#box2` は CSS で隠されている。新たにはてなブログのウィジェット類を取り込む場合は `buildFileBrowser()` の box2 吸収部分にロジックを足す。

### ウィンドウレイアウト（重要）

3要素 `#nv-topbar` / `#container-inner` / `#nv-prompt` は **すべて `position:fixed`** で **同じ left/right/top 座標系を共有** する。`applyMin()` は3つに同時に `cssText` をセットして整合を取る。

過去に margin+height 計算で揃えようとして座標がズレ続けた経緯があるので、レイアウト調整時は **必ず3要素を同時に変更** すること。`bottom` ではなく `top + height` で位置決めしているのも意図的。

### モード切替

- **NORMAL / INSERT / SEARCH** — モード badge クリックで循環、または `i` / `/` / `Esc` キー
- **トラフィックライト**（赤・黄・緑） — それぞれ Vim Uganda スプラッシュ / minimized window / フルスクリーン
- **386モード** — `apply386(true)` で `html.nv-386` を付与、画像にEGAポスタライズSVGフィルタ適用
- **1984モード** — `apply1984(true)` でテキストに打ち消し線、画像をビッグ・ブラザーに差し替え、プロパガンダ挿入

### モバイル

`html.nv-mobile` クラスで CSS が大きく分岐。スワイプは `setupMobileSwipe()` がメインビュー ⇔ ファイルブラウザの2画面スライダーとして実装。デスクトップ用のドラッグ・リサイズ・minimize は無効化される。
