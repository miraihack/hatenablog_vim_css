#!/bin/sh
# Build all Hatena Blog artifacts from the sources.
#   hatena-blog-neovim-head.html  -> 設定 > 詳細設定 > headに要素を追加 (CSS + early boot)
#   hatena-blog-neovim.min.js     -> デザイン > カスタマイズ > 記事下 or フッタ (JS)
#   hatena-blog-theme.min.css / hatena-blog-neovim-hatena.html -> legacy (CSS pasted in body)
set -eu
cd "$(dirname "$0")"
TMP="${TMPDIR:-/tmp}/nv-build.$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

FONT_URL='https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap'

npx terser hatena-blog-neovim.js -c -m --output "$TMP/nv-min.js"
npx terser hatena-blog-neovim-boot.js -c -m --output "$TMP/nv-boot.min.js"
npx clean-css-cli hatena-blog-theme.css -o "$TMP/nv-min.raw.css" 2>/dev/null
# clean-css passes remote @import through untouched; the font is linked from <head> instead
sed 's/@import url([^)]*);//g' "$TMP/nv-min.raw.css" > "$TMP/nv-min.css"

# --- head snippet: preconnect + async font + boot script + CSS (no @import) ---
{
  echo '<link rel="preconnect" href="https://fonts.googleapis.com">'
  echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  echo "<link rel=\"stylesheet\" href=\"$FONT_URL\" media=\"print\" onload=\"this.media='all'\">"
  echo "<noscript><link rel=\"stylesheet\" href=\"$FONT_URL\"></noscript>"
  echo '<script>'; cat "$TMP/nv-boot.min.js"; echo '</script>'
  echo '<style>'; cat "$TMP/nv-min.css"; echo '</style>'
} > hatena-blog-neovim-head.html

# --- legacy CSS (self-contained, @import for the font) ---
{
  echo '<style>'
  echo "@import url(\"$FONT_URL\");"
  cat "$TMP/nv-min.css"
  echo '</style>'
} > hatena-blog-theme.min.css

# --- JS ---
{ echo '<script>'; cat "$TMP/nv-min.js"; echo '</script>'; } > hatena-blog-neovim.min.js

# --- legacy combined ---
cat hatena-blog-theme.min.css hatena-blog-neovim.min.js > hatena-blog-neovim-hatena.html

wc -c hatena-blog-neovim-head.html hatena-blog-neovim.min.js hatena-blog-theme.min.css hatena-blog-neovim-hatena.html
