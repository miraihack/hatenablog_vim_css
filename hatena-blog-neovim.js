/* ============================================
   Neovim Theme JS for Hatena Blog
   Based on: zola-theme-neovim
   ============================================ */

(function () {
  'use strict';

  var FILES_ID = 'nv-files';

  // ─── Force viewport immediately ───
  if (!document.querySelector('meta[name="viewport"]')) {
    var _vp = document.createElement('meta');
    _vp.name = 'viewport';
    _vp.content = 'width=device-width, initial-scale=1';
    (document.head || document.documentElement).appendChild(_vp);
  }

  // ─── Cookie helpers ───
  var NvCookie = {
    get: function (name) {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    },
    set: function (name, value, days) {
      var d = new Date();
      d.setTime(d.getTime() + (days || 30) * 86400000);
      document.cookie = name + '=' + encodeURIComponent(value) +
        ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }
  };

  // ─── State ───
  var cursor;
  var focused;
  var searchMode = false;
  var insertMode = false;

  // ─── Mobile detection ───
  function isMobile() {
    return document.documentElement.classList.contains('nv-mobile');
  }

  // ─── Build file browser ───
  function buildFileBrowser() {
    var contentInner = document.getElementById('content-inner');
    if (!contentInner) return;

    var panel = document.createElement('div');
    panel.id = FILES_ID;
    panel.setAttribute('tabindex', '0');

    var tabIdx = -1;
    var entries = document.querySelectorAll('.entry');
    var categories = {};

    entries.forEach(function (entry) {
      var titleEl = entry.querySelector('.entry-title a');
      var catEls = entry.querySelectorAll('.entry-tags a, .categories a');
      if (!titleEl) return;
      var entryData = { title: titleEl.textContent.trim(), href: titleEl.getAttribute('href') || '#' };
      var folder = catEls.length > 0 ? catEls[0].textContent.trim() : 'uncategorized';
      if (!categories[folder]) categories[folder] = [];
      categories[folder].push(entryData);
    });

    var html = '<ul>';
    var currentTitle = document.title.replace(/ - .*$/, '').trim() || 'index';
    html += '<li><span class="nv-file-icon">\uD83D\uDCC4 </span>' +
      '<a href="' + window.location.href + '" tabindex="' + tabIdx + '" class="nv-selected">' + currentTitle + '</a></li>';
    tabIdx--;

    Object.keys(categories).forEach(function (cat) {
      html += '<li><span class="nv-folder-icon">\uD83D\uDCC1 </span><a href="#" tabindex="' + tabIdx + '">' + cat + '/</a>';
      tabIdx--;
      html += '<ul>';
      categories[cat].forEach(function (e, ei) {
        var isLast = ei === categories[cat].length - 1;
        var prefix = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
        html += '<li><span class="nv-tree-prefix">' + prefix + '</span><span class="nv-file-icon">\uD83D\uDCC4 </span>' +
          '<a href="' + e.href + '" tabindex="' + tabIdx + '">' + e.title + '</a></li>';
        tabIdx--;
      });
      html += '</ul></li>';
    });
    html += '</ul>';

    // Absorb #box2 modules
    var box2 = document.getElementById('box2');
    if (box2) {
      var recentMod = box2.querySelector('.hatena-module-recent-entries');
      if (recentMod) {
        var recentTitle = recentMod.querySelector('.hatena-module-title');
        var recentLinks = recentMod.querySelectorAll('.recent-entries-title-link, .urllist-title-link');
        if (recentLinks.length > 0) {
          var label = (recentTitle && recentTitle.textContent) ? recentTitle.textContent.trim() : 'Recent';
          html += '<div class="nv-section-label">' + label + '</div><ul>';
          recentLinks.forEach(function (a, i) {
            var prefix = (i === recentLinks.length - 1) ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
            html += '<li><span class="nv-tree-prefix">' + prefix + '</span><span class="nv-file-icon">\uD83D\uDCC4 </span>' +
              '<a href="' + a.getAttribute('href') + '" tabindex="' + tabIdx + '">' + a.textContent.trim() + '</a></li>';
            tabIdx--;
          });
          html += '</ul>';
        }
      }
      var archiveMod = box2.querySelector('.hatena-module-archive');
      if (archiveMod) {
        var archiveTitle = archiveMod.querySelector('.hatena-module-title');
        var yearItems = archiveMod.querySelectorAll('.archive-module-year');
        if (yearItems.length > 0) {
          var aLabel = (archiveTitle && archiveTitle.textContent) ? archiveTitle.textContent.trim() : 'Archive';
          html += '<div class="nv-section-label">' + aLabel + '</div><ul>';
          yearItems.forEach(function (yearLi) {
            var yearLink = yearLi.querySelector('.archive-module-year-title');
            if (!yearLink) return;
            html += '<li><span class="nv-folder-icon nv-archive-toggle" data-nv-toggle="closed">\u25B6 </span>' +
              '<a href="' + yearLink.getAttribute('href') + '" tabindex="' + tabIdx + '">' + yearLink.textContent.trim() + '/</a>';
            tabIdx--;
            var months = yearLi.querySelectorAll('.archive-module-month-title');
            if (months.length > 0) {
              html += '<ul class="nv-archive-months" style="display:none;">';
              months.forEach(function (mLink, mi) {
                var isLast = mi === months.length - 1;
                var prefix = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
                html += '<li><span class="nv-tree-prefix">' + prefix + '</span><span class="nv-file-icon">\uD83D\uDCC4 </span>' +
                  '<a href="' + mLink.getAttribute('href') + '" tabindex="' + tabIdx + '">' + mLink.textContent.trim() + '</a></li>';
                tabIdx--;
              });
              html += '</ul>';
            }
            html += '</li>';
          });
          html += '</ul>';
        }
      }
    }

    panel.innerHTML = html;

    // NOTE: Do NOT insert into DOM here on mobile — setupMobileSwipe will handle placement
    // On desktop, insert before #wrapper
    if (!isMobile()) {
      var wrapper = document.getElementById('wrapper');
      var firstChild = wrapper || contentInner.firstElementChild;
      if (firstChild) {
        contentInner.insertBefore(panel, firstChild);
      } else {
        contentInner.appendChild(panel);
      }
    }

    // Bind archive toggles
    panel.querySelectorAll('.nv-archive-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var monthsUl = toggle.parentElement.querySelector('.nv-archive-months');
        if (!monthsUl) return;
        var isOpen = toggle.getAttribute('data-nv-toggle') === 'open';
        monthsUl.style.display = isOpen ? 'none' : '';
        toggle.setAttribute('data-nv-toggle', isOpen ? 'closed' : 'open');
        toggle.textContent = isOpen ? '\u25B6 ' : '\u25BC ';
      });
    });

    return panel;
  }

  // ─── Build tab bar ───
  function buildTabBar() {
    var blogTitle = document.getElementById('blog-title');
    if (!blogTitle) return;

    var topbar = document.createElement('div');
    topbar.id = 'nv-topbar';

    // Traffic lights (window controls)
    var lights = document.createElement('div');
    lights.id = 'nv-traffic-lights';
    lights.innerHTML = '<span class="nv-light-red"></span><span class="nv-light-yellow"></span><span class="nv-light-green"></span>';

    // Red: show Vim Uganda message
    lights.querySelector('.nv-light-red').addEventListener('click', function (e) {
      e.stopPropagation();
      showUganda();
    });

    // Yellow: toggle minimized (small window) mode — desktop only
    lights.querySelector('.nv-light-yellow').addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isMobile()) toggleMinimized();
    });

    // Green: toggle fullscreen (hide header/footer)
    lights.querySelector('.nv-light-green').addEventListener('click', function (e) {
      e.stopPropagation();
      document.documentElement.classList.toggle('nv-fullscreen');
    });

    var titleLink = blogTitle.querySelector('#title a');
    var titleDiv = document.createElement('div');
    titleDiv.id = 'nv-title-bar';
    titleDiv.appendChild(lights);
    if (titleLink) {
      var a = document.createElement('a');
      a.href = titleLink.href;
      a.textContent = 'TOP';
      titleDiv.appendChild(a);
    }
    // Theme toggle (switch + label, sits right next to title)
    var toggle = document.createElement('div');
    toggle.id = 'nv-theme-toggle';
    var isDark = !document.documentElement.classList.contains('nv-light');
    toggle.innerHTML =
      '<span id="nv-theme-label">' + (isDark ? 'ダーク' : 'ライト') + '</span>' +
      '<div id="nv-theme-toggle-track"><div id="nv-theme-toggle-thumb"></div></div>';
    toggle.addEventListener('click', function () {
      var html = document.documentElement;
      if (html.classList.contains('nv-light')) {
        html.classList.remove('nv-light');
        html.classList.add('nv-dark');
        NvCookie.set('nv_theme', 'dark');
        document.getElementById('nv-theme-label').textContent = 'ダーク';
      } else {
        html.classList.remove('nv-dark');
        html.classList.add('nv-light');
        NvCookie.set('nv_theme', 'light');
        document.getElementById('nv-theme-label').textContent = 'ライト';
      }
    });
    titleDiv.appendChild(toggle);

    // 386 toggle (retro DOS mode)
    var toggle386 = document.createElement('div');
    toggle386.id = 'nv-386-toggle';
    var is386 = NvCookie.get('nv_386') === 'on';
    toggle386.innerHTML =
      '<span id="nv-386-label">386</span>' +
      '<div id="nv-386-toggle-track"><div id="nv-386-toggle-thumb"></div></div>';
    toggle386.addEventListener('click', function () {
      var active = document.documentElement.classList.toggle('nv-386');
      NvCookie.set('nv_386', active ? 'on' : 'off');
      apply386(active);
    });
    titleDiv.appendChild(toggle386);

    // 1984 toggle (Big Brother mode)
    var toggle1984 = document.createElement('div');
    toggle1984.id = 'nv-1984-toggle';
    toggle1984.innerHTML =
      '<span id="nv-1984-label">1984</span>' +
      '<div id="nv-1984-toggle-track"><div id="nv-1984-toggle-thumb"></div></div>';
    toggle1984.addEventListener('click', function () {
      var active = document.documentElement.classList.toggle('nv-1984');
      NvCookie.set('nv_1984', active ? 'on' : 'off');
      apply1984(active);
    });
    titleDiv.appendChild(toggle1984);

    topbar.appendChild(titleDiv);

    var tabBar = document.createElement('div');
    tabBar.id = 'nv-tab-bar';
    tabBar.className = 'nv-tab';
    tabBar.innerHTML = '<div class="nv-file-manager" id="nv-file-manager">\uD83D\uDCC2</div><ul id="nv-tabs"></ul>';
    topbar.appendChild(tabBar);

    document.body.insertBefore(topbar, document.body.firstChild);
    blogTitle.style.display = 'none';

    var fm = document.getElementById('nv-file-manager');
    var files = document.getElementById(FILES_ID);
    if (fm && files) {
      fm.addEventListener('click', function () { files.classList.toggle('nv-open'); });
    }
  }

  // ─── INSERT mode ───
  function buildShareButtons() {
    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);
    var blogUrl = window.location.origin + '/';
    var html = '<div id="nv-insert-buttons" class="nv-insert-buttons" style="display:none;">';
    html += '<a class="nv-share-btn nv-share-hatena" href="https://b.hatena.ne.jp/entry/s/' + window.location.host + window.location.pathname + '" target="_blank" rel="noopener">B! はてブする</a>';
    html += '<a class="nv-share-btn nv-share-x" href="https://x.com/intent/tweet?url=' + url + '&text=' + title + '" target="_blank" rel="noopener">\uD835\uDD4F Xでシェアする</a>';
    html += '<a class="nv-share-btn nv-share-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener">f Facebookでシェアする</a>';
    html += '<a class="nv-share-btn nv-share-reader" href="https://blog.hatena.ne.jp/register?via=200btn&url=' + encodeURIComponent(blogUrl) + '" target="_blank" rel="noopener">+ 読者登録する</a>';
    html += '</div>';
    return html;
  }

  function toggleInsertMode() {
    if (searchMode) exitSearchMode();
    insertMode = !insertMode;
    var prompt = document.getElementById('nv-prompt');
    var buttons = document.getElementById('nv-insert-buttons');
    var modeLabel = document.getElementById('nv-mode-label');
    if (insertMode) {
      if (prompt) { prompt.classList.add('nv-insert-mode'); prompt.classList.remove('nv-search-mode'); }
      if (buttons) buttons.style.display = 'flex';
      if (modeLabel) modeLabel.textContent = ' INSERT';
    } else {
      if (prompt) prompt.classList.remove('nv-insert-mode');
      if (buttons) buttons.style.display = 'none';
      if (modeLabel) modeLabel.textContent = ' NORMAL';
    }
  }

  // ─── SEARCH mode ───
  function enterSearchMode() {
    if (insertMode) toggleInsertMode();
    searchMode = true;
    var prompt = document.getElementById('nv-prompt');
    var modeLabel = document.getElementById('nv-mode-label');
    var searchInput = document.getElementById('nv-search-input');
    var writer = document.getElementById('nv-writer');
    if (prompt) { prompt.classList.add('nv-search-mode'); prompt.classList.remove('nv-insert-mode'); }
    if (modeLabel) modeLabel.textContent = ' COMMAND';
    if (writer) writer.style.display = 'none';
    if (searchInput) {
      searchInput.style.display = 'block';
      searchInput.value = '';
      setTimeout(function () { searchInput.focus(); }, 0);
    }
  }

  function exitSearchMode() {
    searchMode = false;
    var prompt = document.getElementById('nv-prompt');
    var modeLabel = document.getElementById('nv-mode-label');
    var searchInput = document.getElementById('nv-search-input');
    var writer = document.getElementById('nv-writer');
    if (prompt) prompt.classList.remove('nv-search-mode');
    if (modeLabel) modeLabel.textContent = ' NORMAL';
    if (searchInput) { searchInput.style.display = 'none'; searchInput.blur(); }
    if (writer) writer.style.display = '';
  }

  function executeSearch() {
    var searchInput = document.getElementById('nv-search-input');
    if (!searchInput) return;
    var query = searchInput.value.trim();
    if (!query) return;
    window.location.href = window.location.origin + '/search?q=' + encodeURIComponent(query);
  }

  // ─── Build prompt bar ───
  function buildPromptBar() {
    var prompt = document.createElement('div');
    prompt.id = 'nv-prompt';
    prompt.className = 'nv-prompt';
    prompt.innerHTML =
      '<span class="nv-mode-badge" id="nv-mode-label"> NORMAL</span>' +
      buildShareButtons() +
      '<input type="text" id="nv-search-input" class="nv-search-input" placeholder="/" autocomplete="off" spellcheck="false" style="display:none;">' +
      '<input type="text" id="nv-setter" autocomplete="off" spellcheck="false">' +
      '<label for="nv-setter" id="nv-writer">&nbsp;</label>' +
      '<b class="nv-cursor" id="nv-cursor"></b>';
    document.body.appendChild(prompt);
  }

  // ─── Setup content links ───
  function setupContentLinks() {
    var main = document.getElementById('main');
    if (!main) return;
    main.setAttribute('tabindex', '0');
    var entryLinks = main.querySelectorAll('.entry-title a, .archive-entry-header a');
    var cidx = -1;
    entryLinks.forEach(function (a) {
      a.setAttribute('tabindex', String(cidx));
      a.classList.add('nv-content-link');
      cidx--;
    });
    if (entryLinks.length > 0) entryLinks[0].classList.add('nv-selected');
  }

  // ─── Tab management ───
  function getTabs() { try { return JSON.parse(NvCookie.get('nv_tabs')) || []; } catch (e) { return []; } }
  function setTabs(tabs) { NvCookie.set('nv_tabs', JSON.stringify(tabs)); }
  function currentUrl() { var u = window.location.href; return u.endsWith('/') ? u : u + '/'; }
  function normalizeUrl(url) { return url.endsWith('/') ? url : url + '/'; }

  function renderTabs() {
    addCurrentPageTab();
    var tabs = getTabs();
    var c = document.getElementById('nv-tabs');
    if (!c) return;
    c.innerHTML = '';
    tabs.forEach(function (tab) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = tab.link; a.textContent = tab.name;
      if (normalizeUrl(tab.link) === currentUrl() || tab.link === window.location.href) li.classList.add('nv-tab-selected');
      var btn = document.createElement('button');
      btn.className = 'nv-closetab'; btn.textContent = 'x';
      btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); delTab(tab.link); });
      li.appendChild(a); li.appendChild(btn); c.appendChild(li);
    });
  }

  function addCurrentPageTab() {
    var tabs = getTabs();
    if (tabs.find(function (t) { return normalizeUrl(t.link) === currentUrl(); })) return;
    var name = document.title.replace(/ - .*$/, '').trim();
    if (!name) name = window.location.pathname.split('/').filter(Boolean).pop() || 'index';
    tabs.push({ link: window.location.href, name: name }); setTabs(tabs);
  }

  function newTab(element, replace) {
    var a = element ? element.querySelector('.nv-selected') : null;
    if (!a || !a.href) return;
    var name = a.textContent.trim(), link = a.href;
    var tabs = getTabs();
    if (tabs.find(function (t) { return normalizeUrl(t.link) === normalizeUrl(link); })) { window.location.href = link; return; }
    if (replace) tabs = tabs.filter(function (t) { return normalizeUrl(t.link) !== currentUrl(); });
    tabs.push({ link: link, name: name }); setTabs(tabs); window.location.href = link;
  }

  function delTab(targetLink) {
    var tabs = getTabs();
    var nt = tabs.filter(function (t) { return normalizeUrl(t.link) !== normalizeUrl(targetLink); });
    if (nt.length === 0) return;
    setTabs(nt);
    if (normalizeUrl(targetLink) === currentUrl()) window.location.href = nt[nt.length - 1].link;
    else renderTabs();
  }

  function nextTab() {
    var tabs = getTabs(); if (tabs.length <= 1) return;
    var ci = -1;
    tabs.forEach(function (t, i) { if (normalizeUrl(t.link) === currentUrl()) ci = i; });
    window.location.href = tabs[(ci + 1) % tabs.length].link;
  }

  // ─── Navigation ───
  function nextFile(inc, container) {
    if (!container) return;
    var links = Array.from(container.querySelectorAll('a[tabindex]'));
    if (links.length === 0) return;
    var cur = container.querySelector('.nv-selected');
    if (!cur) { links[0].classList.add('nv-selected'); return; }
    var ci = parseInt(cur.getAttribute('tabindex'), 10);
    var next = container.querySelector('[tabindex="' + (ci + inc) + '"]');
    if (next) { cur.classList.remove('nv-selected'); next.classList.add('nv-selected'); next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  // ─── Keyboard ───
  function execKey(event) {
    var ae = document.activeElement;
    var key = event.key.toLowerCase();
    var isPrompt = ae && ae.id === 'nv-setter';
    var isFiles = ae && ae.id === FILES_ID;

    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'nv-setter' && ae.id !== 'nv-search-input') return;
    if (searchMode && ae && ae.id === 'nv-search-input') return;

    if (isPrompt) {
      if (key === 'escape') { ae.blur(); var main = document.getElementById('main'); if (main) main.focus({ preventScroll: true }); event.preventDefault(); }
      return;
    }

    if (key !== 'r' && ['j','k','h','l','tab','enter','escape','/','i'].indexOf(key) !== -1) event.preventDefault();

    if (event.shiftKey) {
      switch (key) {
        case 'l': var m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); focused = 'viewer'; NvCookie.set('nv_focused', 'viewer'); break;
        case 'h': var f = document.getElementById(FILES_ID); if (f) f.focus({ preventScroll: true }); focused = 'files'; NvCookie.set('nv_focused', 'files'); break;
        case 't': newTab(isFiles ? document.getElementById(FILES_ID) : document.getElementById('main'), false); break;
        case 'q': delTab(window.location.href); break;
      }
      return;
    }

    switch (key) {
      case 'i': toggleInsertMode(); break;
      case '/': enterSearchMode(); break;
      case 'escape':
        if (searchMode) { exitSearchMode(); break; }
        if (insertMode) { toggleInsertMode(); break; }
        var setter = document.getElementById('nv-setter');
        if (setter) { setter.focus(); setter.value = ''; writePrompt(setter); }
        break;
      case 'enter': newTab(isFiles ? document.getElementById(FILES_ID) : document.getElementById('main'), true); break;
      case 'tab': nextTab(); break;
      case 'j':
        if (isFiles) { nextFile(-1, document.getElementById(FILES_ID)); }
        else { var m = document.getElementById('main'); var cl = m ? m.querySelectorAll('.nv-content-link') : []; cl.length > 0 ? nextFile(-1, m) : window.scrollBy(0, 60); }
        break;
      case 'k':
        if (isFiles) { nextFile(1, document.getElementById(FILES_ID)); }
        else { var m2 = document.getElementById('main'); var cl2 = m2 ? m2.querySelectorAll('.nv-content-link') : []; cl2.length > 0 ? nextFile(1, m2) : window.scrollBy(0, -60); }
        break;
      case 'l': window.scrollBy(60, 0); break;
      case 'h': window.scrollBy(-60, 0); break;
      case 'g':
        if (window._nvLastG && Date.now() - window._nvLastG < 400) { window.scrollTo(0, 0); window._nvLastG = 0; }
        else { window._nvLastG = Date.now(); }
        break;
    }
  }

  // ─── Prompt / Commands ───
  function writePrompt(input) {
    var w = document.getElementById('nv-writer'); if (!w) return;
    var v = input.value;
    try { var p = JSON.parse(v); if (p && p.type) { var c = p.type === 'error' ? '#C62828' : '#689F38'; w.innerHTML = '<span style="color:' + c + ';">' + p.message.replace(/ /g, '&nbsp;') + '</span>'; return; } } catch (e) {}
    w.innerHTML = v.startsWith(':') ? v.replace(/ /g, '&nbsp;') : '&nbsp;';
  }

  function moveCursor(count, event) {
    if (!cursor) return;
    var kc = event.keyCode || event.which;
    cursor.style.display = count === 0 ? 'none' : 'block';
    var left = parseInt(cursor.style.left, 10) || 0, cw = '3px';
    if (kc === 37 && left >= 0 - (count - 1) * 13) cursor.style.left = (left - 13) + 'px';
    else if (kc === 39 && left + 13 <= 0) cursor.style.left = (left + 13) + 'px';
    else cw = '13px';
    cursor.style.width = cw;
  }

  function executeCommand() {
    var setter = document.getElementById('nv-setter');
    if (!setter || !setter.value.startsWith(':')) return;
    var parts = setter.value.substring(1).split(' ');
    var cmd = parts[0]; parts.shift();
    var args = parts.join('').replace(/ /g, '').split('=');
    switch (cmd) {
      case 'help': setter.value = JSON.stringify({ type: 'success', message: 'j/k=nav Shift+H/L=focus i=insert /=search :q=back' }); writePrompt(setter); break;
      case 'q': window.history.back(); break;
      case 'q!': window.close(); break;
      case 'set': var r = execSet(args); setter.value = JSON.stringify(r); writePrompt(setter); break;
      case 'w': setter.value = JSON.stringify({ type: 'success', message: 'E382: read-only blog (add ! to override)' }); writePrompt(setter); break;
      case 'wq': setter.value = JSON.stringify({ type: 'success', message: 'saved. bye!' }); writePrompt(setter); setTimeout(function () { window.history.back(); }, 800); break;
      default: setter.value = JSON.stringify({ type: 'error', message: 'E492: Not a command: ' + cmd }); writePrompt(setter);
    }
  }

  function execSet(args) {
    var p = args[0], v = args[1];
    if (v !== 'true' && v !== 'false') return { type: 'error', message: 'E474: Invalid argument' };
    v = v === 'true';
    var cfg = getConfig(); cfg[p] = v; NvCookie.set('nv_config', JSON.stringify(cfg)); applyConfig();
    return { type: 'success', message: p + '=' + v };
  }

  function getConfig() { try { return JSON.parse(NvCookie.get('nv_config')) || { mouse: true }; } catch (e) { return { mouse: true }; } }
  function applyConfig() {
    var cfg = getConfig();
    document.documentElement.style.cursor = cfg.mouse === false ? 'none' : '';
    document.documentElement.style.pointerEvents = cfg.mouse === false ? 'none' : '';
  }

  // ─── Mobile swipe slider ───
  function setupMobileSwipe(filesPanel) {
    var contentInner = document.getElementById('content-inner');
    var wrapper = document.getElementById('wrapper');
    if (!contentInner || !wrapper || !filesPanel) return;

    // Style content-inner as overflow container
    contentInner.style.cssText += ';overflow:hidden!important;display:block!important;width:100%!important;';

    // Build rail with ALL styles inline (no CSS dependency)
    var rail = document.createElement('div');
    rail.id = 'nv-slide-rail';
    rail.style.cssText = 'display:flex;flex-direction:row;flex-wrap:nowrap;width:200%;transition:transform 0.3s ease;transform:translateX(0);';

    // Style both panes inline
    wrapper.style.cssText = 'display:block!important;width:50%!important;min-width:50%!important;max-width:50%!important;flex-shrink:0!important;float:none!important;overflow-y:auto!important;';
    filesPanel.style.cssText = 'display:block!important;width:50%!important;min-width:50%!important;max-width:50%!important;flex-shrink:0!important;box-shadow:none!important;padding:15px 10px!important;white-space:normal!important;overflow-y:auto!important;';

    // Insert rail where wrapper is, then move wrapper and files into it
    wrapper.parentNode.insertBefore(rail, wrapper);
    rail.appendChild(wrapper);
    rail.appendChild(filesPanel);

    // Dots
    var dots = document.createElement('div');
    dots.id = 'nv-swipe-dots';
    dots.innerHTML = '<span class="nv-dot nv-active"></span><span class="nv-dot"></span>';
    document.body.appendChild(dots);

    var showingFiles = false;

    function setPane(show) {
      showingFiles = show;
      rail.style.transform = show ? 'translateX(-50%)' : 'translateX(0)';
      var dd = dots.querySelectorAll('.nv-dot');
      if (dd.length === 2) { dd[0].classList.toggle('nv-active', !show); dd[1].classList.toggle('nv-active', show); }
    }

    setPane(false);

    var sx = 0, sy = 0;
    document.body.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    document.body.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && !showingFiles) setPane(true);
        else if (dx > 0 && showingFiles) setPane(false);
      }
    }, { passive: true });
  }

  // ─── Minimized window (drag + resize) ───
  // All 3 elements (#nv-topbar, #container-inner, #nv-prompt) stay in their
  // original DOM positions. We control them purely via cssText.
  // The key insight: use left/right (not width) so they always match.

  var mX, mY, mW, mH; // px
  var MIN_W = 320, MIN_H = 200;
  var TB_H = 56, PR_H = 40;

  function toggleMinimized() {
    var html = document.documentElement;
    if (html.classList.contains('nv-minimized')) {
      html.classList.remove('nv-minimized');
      // Clear inline styles
      var tb = document.getElementById('nv-topbar');
      var ci = document.getElementById('container-inner');
      var pr = document.getElementById('nv-prompt');
      if (tb) tb.removeAttribute('style');
      if (ci) ci.removeAttribute('style');
      if (pr) pr.removeAttribute('style');
      // Remove resize handles
      document.querySelectorAll('.nv-resize-handle').forEach(function (h) { h.remove(); });
    } else {
      html.classList.add('nv-minimized');
      mW = Math.round(window.innerWidth * 0.6);
      mH = Math.round(window.innerHeight * 0.55);
      mX = Math.round((window.innerWidth - mW) / 2);
      mY = Math.round(window.innerHeight * 0.15);
      applyMin();
      addResizeHandles();
    }
  }

  function applyMin() {
    var tb = document.getElementById('nv-topbar');
    var ci = document.getElementById('container-inner');
    var pr = document.getElementById('nv-prompt');

    // topbar: fixed at top of window
    if (tb) tb.cssText_nv =
      'position:fixed;top:' + mY + 'px;left:' + mX + 'px;right:' + (window.innerWidth - mX - mW) + 'px;' +
      'border-radius:12px 12px 0 0;cursor:grab;background:var(--bg-solid);z-index:99999;';
    if (tb) tb.setAttribute('style', tb.cssText_nv);

    // container: below topbar
    if (ci) ci.setAttribute('style',
      'position:fixed;top:' + (mY + TB_H) + 'px;left:' + mX + 'px;right:' + (window.innerWidth - mX - mW) + 'px;' +
      'height:' + (mH - TB_H) + 'px;margin:0;padding:0;border:none;border-radius:0;' +
      'overflow:hidden;background:var(--bg-color);box-shadow:0 20px 60px rgba(0,0,0,0.5);z-index:99998;');

    // prompt: below container
    if (pr) pr.setAttribute('style',
      'position:fixed;top:' + (mY + mH) + 'px;left:' + mX + 'px;right:' + (window.innerWidth - mX - mW) + 'px;' +
      'height:' + PR_H + 'px;border-radius:0 0 12px 12px;display:flex;align-items:center;' +
      'background:var(--bg-solid);font-size:10px;z-index:99999;box-shadow:0 20px 60px rgba(0,0,0,0.5);');

    updateHandlePositions();
  }

  // ─── Resize handles ───
  function addResizeHandles() {
    ['n','s','e','w','nw','ne','sw','se'].forEach(function (dir) {
      var el = document.createElement('div');
      el.className = 'nv-resize-handle';
      el.dataset.dir = dir;
      document.body.appendChild(el);
    });
    updateHandlePositions();

    // Bind once
    var resizing = false, rDir = '', rsx = 0, rsy = 0, roX, roY, roW, roH;

    document.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (!t.classList.contains('nv-resize-handle')) return;
      e.preventDefault();
      resizing = true; rDir = t.dataset.dir;
      rsx = e.clientX; rsy = e.clientY;
      roX = mX; roY = mY; roW = mW; roH = mH;
    });
    document.addEventListener('mousemove', function (e) { if (resizing) doResize(e.clientX, e.clientY); });
    document.addEventListener('mouseup', function () { resizing = false; });

    document.addEventListener('touchstart', function (e) {
      var t = e.target;
      if (!t.classList.contains('nv-resize-handle')) return;
      resizing = true; rDir = t.dataset.dir;
      rsx = e.touches[0].clientX; rsy = e.touches[0].clientY;
      roX = mX; roY = mY; roW = mW; roH = mH;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) { if (resizing) doResize(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    document.addEventListener('touchend', function () { resizing = false; });

    function doResize(ex, ey) {
      var dx = ex - rsx, dy = ey - rsy, d = rDir;
      if (d.indexOf('e') !== -1) mW = Math.max(MIN_W, roW + dx);
      if (d.indexOf('w') !== -1) { mW = Math.max(MIN_W, roW - dx); mX = roX + roW - mW; }
      if (d.indexOf('s') !== -1) mH = Math.max(MIN_H, roH + dy);
      if (d.indexOf('n') !== -1) { mH = Math.max(MIN_H, roH - dy); mY = roY + roH - mH; }
      applyMin();
    }
  }

  function updateHandlePositions() {
    var SZ = 16, CO = 20;
    var totalH = mH + PR_H;
    var map = {
      n:  [mY-SZ/2,        mX+CO,          mW-CO*2, SZ,    'ns-resize'],
      s:  [mY+totalH-SZ/2, mX+CO,          mW-CO*2, SZ,    'ns-resize'],
      e:  [mY+CO,          mX+mW-SZ/2,     SZ,      totalH-CO*2, 'ew-resize'],
      w:  [mY+CO,          mX-SZ/2,        SZ,      totalH-CO*2, 'ew-resize'],
      nw: [mY-SZ/2,        mX-SZ/2,        CO,      CO,    'nwse-resize'],
      ne: [mY-SZ/2,        mX+mW-CO+SZ/2,  CO,      CO,    'nesw-resize'],
      sw: [mY+totalH-CO+SZ/2, mX-SZ/2,     CO,      CO,    'nesw-resize'],
      se: [mY+totalH-CO+SZ/2, mX+mW-CO+SZ/2, CO,    CO,    'nwse-resize']
    };
    document.querySelectorAll('.nv-resize-handle').forEach(function (el) {
      var d = el.dataset.dir;
      var v = map[d];
      if (!v) return;
      el.style.cssText = 'position:fixed;z-index:999999;background:transparent;' +
        'top:'+v[0]+'px;left:'+v[1]+'px;width:'+v[2]+'px;height:'+v[3]+'px;cursor:'+v[4]+';';
    });
  }

  // ─── Drag (title bar) ───
  function setupDrag() {
    var titleBar = document.getElementById('nv-title-bar');
    if (!titleBar) return;
    var dragging = false, dsx = 0, dsy = 0, doX = 0, doY = 0;

    titleBar.addEventListener('mousedown', function (e) {
      if (!document.documentElement.classList.contains('nv-minimized')) return;
      if (e.target.closest('a, button, #nv-theme-toggle, #nv-traffic-lights span')) return;
      e.preventDefault();
      dragging = true; dsx = e.clientX; dsy = e.clientY; doX = mX; doY = mY;
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      mX = doX + (e.clientX - dsx);
      mY = doY + (e.clientY - dsy);
      applyMin();
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    titleBar.addEventListener('touchstart', function (e) {
      if (!document.documentElement.classList.contains('nv-minimized')) return;
      if (e.target.closest('a, button, #nv-theme-toggle, #nv-traffic-lights span')) return;
      dragging = true; dsx = e.touches[0].clientX; dsy = e.touches[0].clientY; doX = mX; doY = mY;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      mX = doX + (e.touches[0].clientX - dsx);
      mY = doY + (e.touches[0].clientY - dsy);
      applyMin();
    }, { passive: true });
    document.addEventListener('touchend', function () { dragging = false; });
  }

  // ─── Vim Uganda splash ───
  function showUganda() {
    var existing = document.getElementById('nv-uganda');
    if (existing) { existing.remove(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'nv-uganda';
    overlay.innerHTML =
      '<pre class="nv-uganda-text">' +
      '\n' +
      '                 VIM - Vi IMproved\n' +
      '\n' +
      '                  version 9.1\n' +
      '             by Bram Moolenaar et al.\n' +
      '\n' +
      '    Vim is open source and freely distributable\n' +
      '\n' +
      '           Help poor children in Uganda!\n' +
      '  type  :help iccf&lt;Enter&gt;    for information\n' +
      '\n' +
      '  type  :q&lt;Enter&gt;            to exit\n' +
      '  type  :help&lt;Enter&gt;         for on-line help\n' +
      '  type  :help version9&lt;Enter&gt; for version info\n' +
      '\n' +
      '\n' +
      '         ICCF Holland - strives to help\n' +
      '       children in need of medical aid,\n' +
      '           food, clothing, and shelter.\n' +
      '\n' +
      '        Please visit the ICCF web site,\n' +
      '       available at these URLs:\n' +
      '\n' +
      '              https://iccf-holland.org\n' +
      '              https://www.vim.org/iccf\n' +
      '\n' +
      '     You can also sponsor the strives by\n' +
      '     buying at the STRIVES strives shop :\n' +
      '\n' +
      '            https://iccf-holland.org/shop\n' +
      '\n' +
      '</pre>';

    overlay.addEventListener('click', function () { overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ─── Blinking Vim cursor at end of content ───
  function typewriterEffect() {
    var mainInner = document.getElementById('main-inner');
    if (!mainInner) return;

    var allContents = mainInner.querySelectorAll('.entry-content');
    var lastContent = allContents.length > 0 ? allContents[allContents.length - 1] : mainInner;

    var cursorBlock = document.createElement('span');
    cursorBlock.className = 'nv-vim-cursor';
    cursorBlock.textContent = '\u00A0';
    lastContent.appendChild(cursorBlock);
  }

  // ─── 386 mode ───
  function apply386(active) {
    if (active) {
      document.documentElement.classList.add('nv-386');
      if (!document.getElementById('nv-386-svg')) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'nv-386-svg';
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.innerHTML =
          '<filter id="nv-386-posterize">' +
          '<feComponentTransfer>' +
          '<feFuncR type="discrete" tableValues="0 0.33 0.67 1"/>' +
          '<feFuncG type="discrete" tableValues="0 0.33 0.67 1"/>' +
          '<feFuncB type="discrete" tableValues="0 0.33 0.67 1"/>' +
          '</feComponentTransfer>' +
          '</filter>';
        document.body.appendChild(svg);
      }
    } else {
      document.documentElement.classList.remove('nv-386');
      var el = document.getElementById('nv-386-svg');
      if (el) el.remove();
    }
  }

  // ─── 1984 mode ───
  var _1984_IMG = 'https://cdn-ak.f.st-hatena.com/images/fotolife/n/netcraft3/20260315/20260315112618.jpg';
  var _1984_MSGS = [
    '\u504F\u611B\u3059\u308B\u5144\u5F1F\u304C\u3042\u306A\u305F\u3092\u898B\u5B88\u3063\u3066\u3044\u307E\u3059',
    '\u6226\u4E89\u306F\u5E73\u548C\u3067\u3042\u308B',
    '\u81EA\u7531\u306F\u96B7\u5C5E\u3067\u3042\u308B',
    '\u7121\u77E5\u306F\u529B\u3067\u3042\u308B',
    '\u904E\u53BB\u3092\u652F\u914D\u3059\u308B\u8005\u304C\u672A\u6765\u3092\u652F\u914D\u3059\u308B',
    '\u73FE\u5728\u3092\u652F\u914D\u3059\u308B\u8005\u304C\u904E\u53BB\u3092\u652F\u914D\u3059\u308B',
    '\u4E8C\u91CD\u601D\u8003\u3068\u306F\u3001\u4E8C\u3064\u306E\u77DB\u76FE\u3059\u308B\u4FE1\u5FF5\u3092\u540C\u6642\u306B\u62B1\u304F\u529B\u3067\u3042\u308B',
    '\u515A\u306F\u3042\u306A\u305F\u306E\u76EE\u3068\u8033\u306E\u8A3C\u62E0\u3092\u62D2\u5426\u305B\u3088\u3068\u547D\u3058\u305F',
    '\u601D\u8003\u72AF\u7F6A\u306F\u6B7B\u3092\u610F\u5473\u3057\u306A\u3044\u3002\u601D\u8003\u72AF\u7F6A\u304C\u6B7B\u3067\u3042\u308B',
    '\u672A\u6765\u306E\u59FF\u3092\u77E5\u308A\u305F\u3051\u308C\u3070\u3001\u4EBA\u9593\u306E\u9854\u3092\u8E0F\u307F\u3064\u3051\u308B\u30D6\u30FC\u30C4\u3092\u60F3\u50CF\u305B\u3088\u2014\u2014\u6C38\u9060\u306B',
    '\u6A29\u529B\u306F\u624B\u6BB5\u3067\u306F\u306A\u3044\u3002\u6A29\u529B\u305D\u306E\u3082\u306E\u304C\u76EE\u7684\u3067\u3042\u308B',
    '\u3059\u3079\u3066\u306E\u52D5\u7269\u306F\u5E73\u7B49\u3067\u3042\u308B\u3002\u3060\u304C\u4E00\u90E8\u306E\u52D5\u7269\u306F\u4ED6\u3088\u308A\u3082\u3063\u3068\u5E73\u7B49\u3067\u3042\u308B',
    '\u6700\u826F\u306E\u66F8\u7269\u3068\u306F\u3001\u3042\u306A\u305F\u304C\u65E2\u306B\u77E5\u3063\u3066\u3044\u308B\u3053\u3068\u3092\u8A9E\u308B\u66F8\u7269\u3067\u3042\u308B',
    '\u73FE\u5B9F\u306F\u4EBA\u9593\u306E\u5FC3\u306E\u4E2D\u306B\u5B58\u5728\u3057\u3001\u4ED6\u306E\u3069\u3053\u306B\u3082\u5B58\u5728\u3057\u306A\u3044',
    '\u515A\u3092\u8B83\u3048\u3088\uFF01\u5146\u6C11\u306E\u5149\u3088\uFF01',
    '\u30D3\u30C3\u30B0\u30FB\u30D6\u30E9\u30B6\u30FC\u4E07\u6B73\uFF01',
    '\u601D\u8003\u8B66\u5BDF\u306F\u3042\u306A\u305F\u3092\u76E3\u8996\u3057\u3066\u3044\u308B',
    '\u611B\u60C5\u7701\u304C\u3042\u306A\u305F\u3092\u611B\u3057\u3066\u3044\u308B'
  ];

  function apply1984(active) {
    if (active) {
      document.documentElement.classList.add('nv-1984');
      // Replace images
      document.querySelectorAll('.entry-content img').forEach(function (img) {
        if (!img.getAttribute('data-nv-orig-src')) {
          img.setAttribute('data-nv-orig-src', img.src);
        }
        img.src = _1984_IMG;
      });
      // Insert propaganda
      if (!document.querySelector('.nv-1984-msg')) {
        var entries = document.querySelectorAll('.entry-content');
        entries.forEach(function (entry) {
          var paras = entry.querySelectorAll('p, h2, h3, h4, li');
          var indices = [];
          for (var i = 0; i < paras.length; i++) indices.push(i);
          // Shuffle and pick ~30% of elements
          for (var j = indices.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
          }
          var count = Math.max(2, Math.floor(paras.length * 0.3));
          for (var m = 0; m < Math.min(count, indices.length); m++) {
            var el = paras[indices[m]];
            var msg = document.createElement('div');
            msg.className = 'nv-1984-msg';
            msg.textContent = _1984_MSGS[Math.floor(Math.random() * _1984_MSGS.length)];
            el.parentNode.insertBefore(msg, el.nextSibling);
          }
        });
      }
    } else {
      document.documentElement.classList.remove('nv-1984');
      // Restore images
      document.querySelectorAll('.entry-content img[data-nv-orig-src]').forEach(function (img) {
        img.src = img.getAttribute('data-nv-orig-src');
        img.removeAttribute('data-nv-orig-src');
      });
      // Remove propaganda
      document.querySelectorAll('.nv-1984-msg').forEach(function (el) { el.remove(); });
    }
  }

  // ─── Init ───
  function init() {
    // Apply theme: cookie > system preference > dark default
    var savedTheme = NvCookie.get('nv_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('nv-light');
      document.documentElement.classList.remove('nv-dark');
    } else if (savedTheme === 'dark') {
      document.documentElement.classList.add('nv-dark');
      document.documentElement.classList.remove('nv-light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.classList.add('nv-light');
      document.documentElement.classList.remove('nv-dark');
    } else {
      document.documentElement.classList.add('nv-dark');
      document.documentElement.classList.remove('nv-light');
    }

    // Detect mobile
    var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    var isNarrowScreen = (screen.width <= 768 || screen.height <= 768);
    if (isTouchDevice && isNarrowScreen) {
      document.documentElement.classList.add('nv-mobile');
    }

    // Apply special modes from cookie
    if (NvCookie.get('nv_386') === 'on') {
      apply386(true);
    }
    if (NvCookie.get('nv_1984') === 'on') {
      apply1984(true);
    }

    // Build UI
    var filesPanel = buildFileBrowser();
    buildTabBar();
    buildPromptBar();
    setupContentLinks();

    // Cursor
    cursor = document.getElementById('nv-cursor');
    if (cursor) cursor.style.left = '0px';

    // Prompt events
    var setter = document.getElementById('nv-setter');
    if (setter) {
      setter.value = '';
      setter.addEventListener('input', function () { writePrompt(this); });
      setter.addEventListener('keydown', function (e) { writePrompt(this); moveCursor(this.value.length, e); if (e.key === 'Enter') { e.preventDefault(); executeCommand(); } });
      setter.addEventListener('keyup', function () { writePrompt(this); });
    }

    // Mode badge click: cycle NORMAL → INSERT → SEARCH → NORMAL
    var modeLabel = document.getElementById('nv-mode-label');
    if (modeLabel) {
      modeLabel.style.cursor = 'pointer';
      modeLabel.addEventListener('click', function () {
        if (searchMode) {
          exitSearchMode();
        } else if (insertMode) {
          toggleInsertMode();
          enterSearchMode();
        } else {
          toggleInsertMode();
        }
      });
    }

    // Search input events
    var searchInput = document.getElementById('nv-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); executeSearch(); }
        else if (e.key === 'Escape') { e.preventDefault(); exitSearchMode(); var main = document.getElementById('main'); if (main) main.focus({ preventScroll: true }); }
      });
    }

    // Config
    if (!NvCookie.get('nv_config')) NvCookie.set('nv_config', JSON.stringify({ mouse: true }));
    if (!NvCookie.get('nv_focused')) NvCookie.set('nv_focused', 'viewer');
    focused = NvCookie.get('nv_focused');
    applyConfig();
    renderTabs();

    // Focus
    if (focused === 'files') { var f = document.getElementById(FILES_ID); if (f) f.focus({ preventScroll: true }); }
    else { var m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);

    // Keyboard
    document.addEventListener('keydown', execKey);

    // Blinking cursor + draggable minimized window
    typewriterEffect();
    setupDrag();

    // Mobile
    if (isMobile()) {
      document.querySelectorAll('.entry-content img, .entry-content iframe, .entry-content embed').forEach(function (el) { el.removeAttribute('width'); el.removeAttribute('height'); });
      setupMobileSwipe(filesPanel);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
