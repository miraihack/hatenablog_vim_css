// Early boot script — inlined into <head> (hatena-blog-neovim-head.html) so
// theme / mode classes and the wallpaper are set BEFORE the first paint.
// Keep this tiny: it runs before the DOM exists.
(function () {
  var d = document.documentElement;
  var DEFAULT_WALLPAPER = 'https://cdn-ak.f.st-hatena.com/images/fotolife/n/netcraft3/20260509/20260509014811_original.jpg';
  function get(name) {
    var m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }
  var theme = get('nv_theme');
  if (theme !== 'light' && theme !== 'dark') {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  d.classList.add('nv-' + theme);
  var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (touch && (screen.width <= 768 || screen.height <= 768)) d.classList.add('nv-mobile');
  if (get('nv_386') === 'on') d.classList.add('nv-386');
  if (get('nv_1984') === 'on') d.classList.add('nv-1984');
  var wp = get('nv_wallpaper') || DEFAULT_WALLPAPER;
  d.style.setProperty('--nv-wallpaper', "url('" + wp + "')");
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = wp;
  document.head.appendChild(link);
})();
