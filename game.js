/* =========================================================
   Noční útok ducha Phishuly – herní logika
   Úniková hra o bezpečnosti na internetu (3.–5. třída)
   ========================================================= */
(function () {
  'use strict';

  var D = window.PH;
  var STORE_KEY = 'phishula-v1';
  var FREEZE_WRONG = 20, FREEZE_HINT = 45, FREEZE_LOCK = 20, FREEZE_LOST = 60;

  var app = document.getElementById('app');
  var overlayRoot = document.getElementById('overlays');

  // ---------------------------------------------------------------
  // Stav hry (ukládá se do prohlížeče – obnovení stránky nic nesmaže)
  // ---------------------------------------------------------------
  var S = load() || fresh();

  function fresh() {
    return {
      phase: 'setup', team: '', players: '', color: -1,
      route: [], step: 0, solved: {}, st: {}, current: null,
      startedAt: 0, finishedAt: 0, freezeUntil: 0, freezeMsg: '',
      frozenTotal: 0, wrong: 0, hints: 0, lockShown: {}, sound: true
    };
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(STORE_KEY)); return s && s.phase ? s : null; }
    catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* bez úložiště to jede dál */ } }

  // ---------------------------------------------------------------
  // Pomocníci
  // ---------------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function station(key) { for (var i = 0; i < D.STATIONS.length; i++) if (D.STATIONS[i].key === key || D.STATIONS[i].id === key) return D.STATIONS[i]; return null; }
  function stationIndex(st) { return D.STATIONS.indexOf(st); }
  function teamColor() { return S.color >= 0 ? D.COLORS[S.color].hex : '#7dff9b'; }
  function digitFor(st) { return D.DIGITS[S.color][stationIndex(st)]; }
  function solvedCount() { return Object.keys(S.solved).length; }
  function now() { return Date.now(); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function clock(ts) {
    var d = new Date(ts);
    return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  function shuffleSeeded(arr, seed) {
    var a = arr.slice(), x = seed + 7;
    for (var i = a.length - 1; i > 0; i--) {
      x = (x * 9301 + 49297) % 233280;
      var j = Math.floor((x / 233280) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------------------------------------------------------------
  // Phishula – postavička ducha s rybářským prutem (phishing = „rybaření“)
  // ---------------------------------------------------------------
  function phishulaSVG(mood) {
    var mouth = mood === 'sad'
      ? '<path d="M78 112q22-14 44 0" stroke="#0d2a17" stroke-width="6" fill="none" stroke-linecap="round"/>'
      : '<path d="M72 102q28 30 56 0q-28 10-56 0z" fill="#0d2a17"/><path d="M84 106l5 8 5-7M106 107l5 7 5-8" fill="#fff"/>';
    var brows = mood === 'sad'
      ? '<path d="M70 66l22 6M130 66l-22 6" stroke="#0d2a17" stroke-width="5" stroke-linecap="round"/>'
      : '<path d="M68 70l24-8M132 70l-24-8" stroke="#0d2a17" stroke-width="5" stroke-linecap="round"/>';
    return '' +
      '<svg class="phishula-svg" viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><radialGradient id="pg" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c8ffd6"/><stop offset=".55" stop-color="#5cf08a"/><stop offset="1" stop-color="#1fae55"/></radialGradient>' +
      '<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      // prut a vlasec s háčkem
      '<path d="M168 120L238 26" stroke="#6b4a2b" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M238 26Q250 90 244 150" stroke="#e8e3f7" stroke-width="2" fill="none"/>' +
      '<path d="M244 150v14a8 8 0 0 1-16 0" stroke="#e8e3f7" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<rect x="226" y="166" width="30" height="16" rx="4" fill="#ffd43b" stroke="#24163a" stroke-width="2"/>' +
      '<text x="241" y="178" font-size="10" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" fill="#24163a">***</text>' +
      // tělo
      '<g filter="url(#glow)"><path d="M100 14C56 14 32 46 32 88v100l17-16 17 16 17-16 17 16 17-16 17 16 17-16 17 16V88C168 46 144 14 100 14z" fill="url(#pg)" stroke="#0d6b31" stroke-width="4" stroke-linejoin="round"/></g>' +
      // klobouk čaroděje
      '<path d="M58 34L104 -2 142 30z" fill="#3a2a55" stroke="#24163a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M48 36q52-14 104-2" stroke="#24163a" stroke-width="8" stroke-linecap="round" fill="none"/>' +
      '<path d="M54 34q46-12 94-2" stroke="#ff8a1f" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      // oči
      brows +
      '<ellipse cx="80" cy="84" rx="11" ry="13" fill="#0d2a17"/><ellipse cx="120" cy="84" rx="11" ry="13" fill="#0d2a17"/>' +
      '<circle cx="84" cy="80" r="4" fill="#ff3b5c"/><circle cx="124" cy="80" r="4" fill="#ff3b5c"/>' +
      mouth +
      // ruka s prutem
      '<path d="M150 124q14 0 22-6" stroke="#1fae55" stroke-width="12" stroke-linecap="round" fill="none"/>' +
      '</svg>';
  }

  // Krystal z pěti dílků
  function crystalSVG(filled, color, big) {
    var shards = [
      'M60 6L14 40H45z', 'M60 6L45 40H75z', 'M60 6L75 40H106z',
      'M14 40H60V114z', 'M106 40H60V114z'
    ];
    var g = '';
    for (var i = 0; i < 5; i++) {
      var on = filled[i];
      g += '<path d="' + shards[i] + '" fill="' + (on ? color : 'rgba(255,255,255,.07)') + '" stroke="' +
        (on ? '#fff' : 'rgba(255,255,255,.35)') + '" stroke-width="2" stroke-linejoin="round" ' +
        (on ? 'class="shard-on"' : 'stroke-dasharray="4 4"') + '/>';
    }
    return '<svg class="crystal' + (big ? ' crystal-big' : '') + '" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + g + '</svg>';
  }
  function crystalFilled() {
    return D.STATIONS.map(function (st) { return !!S.solved[st.key]; });
  }

  // ---------------------------------------------------------------
  // Zvuky (vyrobené v prohlížeči, žádné soubory)
  // ---------------------------------------------------------------
  var AC = null;
  function audio() {
    if (!S.sound) return null;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, vol) {
    var ac = audio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + start;
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  var sfx = {
    ok: function () { tone(523, 0, .14, 'triangle'); tone(659, .1, .14, 'triangle'); tone(784, .2, .25, 'triangle'); },
    win: function () { [523, 659, 784, 1046, 784, 1046].forEach(function (f, i) { tone(f, i * .12, .3, 'triangle', .22); }); },
    bad: function () { tone(180, 0, .25, 'sawtooth', .15); tone(140, .18, .35, 'sawtooth', .15); if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (e) {} },
    spooky: function () { tone(220, 0, .9, 'sine', .12); tone(233, .1, .9, 'sine', .1); tone(110, .3, 1.2, 'triangle', .1); },
    tap: function () { tone(880, 0, .05, 'square', .05); },
    scan: function () { tone(1200, 0, .08, 'square', .08); tone(1600, .08, .1, 'square', .08); }
  };

  // ---------------------------------------------------------------
  // Udržení displeje rozsvíceného a celá obrazovka
  // ---------------------------------------------------------------
  var wakeLock = null;
  function keepAwake() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible' && S.phase !== 'setup') {
        navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
      }
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  function goFullscreen() {
    var el = document.documentElement;
    try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(function () {}); } catch (e) {}
  }

  // ---------------------------------------------------------------
  // Horní lišta (tým, čas, krystal)
  // ---------------------------------------------------------------
  function hud() {
    if (S.color < 0 || !S.startedAt) return '';
    return '<header class="hud">' +
      '<div class="hud-team"><span class="dot" style="background:' + teamColor() + '"></span><span class="hud-name">' + esc(S.team) + '</span></div>' +
      '<div class="hud-crystal">' + crystalSVG(crystalFilled(), teamColor()) + '<span>' + solvedCount() + '/5</span></div>' +
      '<div class="hud-time" id="timer">⏱ ' + fmt(elapsed()) + '</div>' +
      '</header>';
  }
  function elapsed() {
    if (!S.startedAt) return 0;
    return ((S.finishedAt || now()) - S.startedAt) / 1000;
  }
  setInterval(function () {
    var t = document.getElementById('timer');
    if (t && !S.finishedAt) t.textContent = '⏱ ' + fmt(elapsed());
  }, 500);

  // ---------------------------------------------------------------
  // Vykreslení podle fáze hry
  // ---------------------------------------------------------------
  function render() {
    document.documentElement.style.setProperty('--team', teamColor());
    var html;
    switch (S.phase) {
      case 'setup': html = viewSetup(); break;
      case 'story': html = viewStory(); break;
      case 'ready': html = viewReady(); break;
      case 'hunt': html = viewHunt(); break;
      case 'station': html = viewStation(); break;
      case 'reward': html = viewReward(); break;
      case 'lock': html = viewLock(); break;
      case 'done': html = viewDone(); break;
      default: S = fresh(); save(); return render();
    }
    app.innerHTML = hud() + '<main class="screen screen-' + S.phase + '">' + html + '</main>' +
      '<button class="teacher-btn" id="teacherBtn" aria-label="Menu pro vedoucí">⚙</button>';
    app.scrollTop = 0; window.scrollTo(0, 0);
    bind();
    if (S.phase === 'station') mountStation();
    if (S.phase === 'done') confetti();
    checkFreeze();
  }

  function go(phase) { S.phase = phase; save(); render(); }

  // ---------- 1) Založení týmu ----------
  var NAME_IDEAS = ['Kostlivci z klávesnice', 'Netopýři s heslem', 'Duchové z Wi-Fi', 'Pavouci z webu',
    'Dýně v síti', 'Strážci krystalu', 'Upíři bez virů', 'Zombie hackeři', 'Noční antiviráci', 'Bitoví čarodějové'];

  function viewSetup() {
    var colors = D.COLORS.map(function (c, i) {
      return '<button class="color-pick' + (S.color === i ? ' picked' : '') + '" data-color="' + i + '" style="--c:' + c.hex + '">' +
        '<span class="swatch"></span><span>' + esc(c.name) + '</span></button>';
    }).join('');
    return '' +
      '<div class="title-block">' +
      '<div class="phishula float">' + phishulaSVG() + '</div>' +
      '<h1 class="spooky">Noční útok ducha Phishuly</h1>' +
      '<p class="sub">Úniková hra o bezpečném internetu</p></div>' +
      '<section class="card">' +
      '<h2>1. Jak se jmenuje váš tým?</h2>' +
      '<div class="row"><input id="teamName" maxlength="28" placeholder="Např. Kostlivci z klávesnice" value="' + esc(S.team) + '" autocomplete="off">' +
      '<button class="btn btn-ghost" id="ideaBtn">🎲 Vymyslet</button></div>' +
      '<h2>2. Kdo hraje?</h2>' +
      '<input id="players" maxlength="60" placeholder="Jména hráčů (nepovinné)" value="' + esc(S.players) + '" autocomplete="off">' +
      '<h2>3. Vyberte barvu týmu</h2>' +
      '<p class="hint">Každý tým musí mít jinou barvu – domluvte se s ostatními.</p>' +
      '<div class="colors">' + colors + '</div>' +
      '<button class="btn btn-big" id="setupGo">Pokračovat ➜</button>' +
      '<p class="err" id="setupErr"></p>' +
      '</section>';
  }

  // ---------- 2) Příběh ----------
  function viewStory() {
    return '' +
      '<div class="story">' +
      '<div class="phishula float">' + phishulaSVG() + '</div>' +
      '<div class="bubble" id="bubble">' +
      '<p><b>Chi chi chííí! Jsem Phishula, duch internetu!</b></p>' +
      '<p>Rybařím na internetu hesla a tajemství. Ukradl jsem <b>Bezpečnostní krystal</b>, který chrání děti na síti, a rozbil ho na <b>5 dílků</b>.</p>' +
      '<p>Schoval jsem je k pěti strašidlům: <span class="icons-inline">' +
      D.STATIONS.map(function (s) { return '<i>' + D.ICONS[s.key] + '</i>'; }).join('') + '</span></p>' +
      '<p>Troufnete si, <b style="color:var(--team)">' + esc(S.team) + '</b>? Muhehe!</p>' +
      '</div></div>' +
      '<section class="card rules">' +
      '<h2>Jak se hraje</h2>' +
      '<ol>' +
      '<li>Tablet vám řekne, <b>které strašidlo</b> máte najít. Karty jsou schované po třídě.</li>' +
      '<li>Kartu <b>naskenujte</b> tlačítkem 📷 ve hře.</li>' +
      '<li>Vyřešte úkol – za správné řešení získáte <b>dílek krystalu</b> a <b>tajné číslo</b>.</li>' +
      '<li>Číslo si <b>hned zapište na kartičku týmu</b>. Ve hře už ho znovu neuvidíte!</li>' +
      '<li>Se všemi pěti čísly utíkejte k <b>Digitální bráně</b>. Kdo ji odemkne první, vyhrává!</li>' +
      '</ol>' +
      '<p class="warn">❄️ Pozor: za každou chybu vás Phishula na chvíli <b>zmrazí</b>. Přemýšlejte, než klepnete!</p>' +
      '<button class="btn btn-big" id="storyGo">Rozumíme! ➜</button>' +
      '</section>';
  }

  // ---------- 3) Čekání na start ----------
  function viewReady() {
    return '' +
      '<div class="ready">' +
      '<div class="team-banner" style="--c:' + teamColor() + '">' +
      '<span class="dot big"></span><div><div class="tb-name">' + esc(S.team) + '</div>' +
      (S.players ? '<div class="tb-players">' + esc(S.players) + '</div>' : '') + '</div></div>' +
      '<p class="big-text">Připravte si tužku a kartičku týmu.</p>' +
      '<p class="big-text">Až vedoucí řekne <b>„START!“</b>, klepněte na tlačítko.</p>' +
      '<button class="btn btn-start" id="startBtn">START</button>' +
      '<button class="btn btn-ghost small" id="backSetup">← Upravit tým</button>' +
      '</div>';
  }

  // ---------- 4) Hledání karty ----------
  var TAUNTS = ['Tuhle kartu nikdy nenajdete! Muhehe!', 'Moji strašidláci se dobře schovávají…',
    'Chi chi! Hledáte špatně!', 'Brrr, už jste mi skoro na stopě…', 'Mé pavučiny jsou všude!'];

  function nextKey() {
    if (S.step >= S.route.length) return 'brana';
    return station(S.route[S.step]).key;
  }
  function viewHunt() {
    var key = nextKey();
    var gate = key === 'brana';
    var st = gate ? D.GATE : station(key);
    var label = gate ? 'DIGITÁLNÍ BRÁNU' : st.symbol4;
    return '' +
      '<div class="hunt">' +
      '<p class="step">' + (gate ? 'Poslední úkol!' : 'Úkol ' + (S.step + 1) + ' z 5') + '</p>' +
      '<div class="target pulse">' + D.ICONS[key] + '</div>' +
      '<h2 class="hunt-title">Najděte kartu:<br><span>' + esc(label) + '</span></h2>' +
      (gate ? '<p class="big-text">Máte všech 5 dílků! Utíkejte k bráně – je u vedoucí. Vezměte si kartičku s čísly!</p>'
            : '<p class="taunt">„' + esc(TAUNTS[S.step % TAUNTS.length]) + '“ <small>– Phishula</small></p>') +
      '<button class="btn btn-big btn-scan" id="scanBtn">📷 Naskenovat kartu</button>' +
      '<button class="link-btn" id="manualBtn">Kamera nejde? Napište kód z karty</button>' +
      '</div>';
  }

  // ---------- 5) Stanoviště ----------
  function viewStation() {
    var st = station(S.current);
    return '' +
      '<div class="st-head"><div class="st-icon">' + D.ICONS[st.key] + '</div>' +
      '<div><p class="step">Strašidlo ' + st.symbol + '</p><h2>' + esc(st.name) + '</h2></div></div>' +
      '<div id="stBody"></div>' +
      '<div class="hint-area"><button class="btn btn-ghost small" id="hintBtn">💡 Nápověda <small>(zmrazí vás na ' + FREEZE_HINT + ' s)</small></button>' +
      '<p class="hint-text" id="hintText"></p></div>';
  }

  // ---------- 6) Odměna ----------
  var RULES = {
    lebka: 'Silné heslo je dlouhé jako věta – velká i malá písmena, číslo a znak. Znají ho jen rodiče.',
    pavouk: 'Výhra zadarmo + spěch + chtějí heslo = podvod (phishing). Neklikej a ukaž to dospělému.',
    netopyr: 'Adresa, telefon, heslo, škola a „jsem sám doma“ na internet nepatří. Co jednou zveřejníš, už nevezmeš zpátky.',
    duch: 'Kyberšikanu nešiř ani neolajkuj. Udělej snímek, zablokuj a řekni dospělému. Pomůže i Linka bezpečí 116 111 (zdarma).',
    dyne: 'Strašidelná okna, dárky zadarmo a cizí lidé, kteří chtějí tajemství nebo schůzku = past. Poraď se s dospělým.'
  };
  function viewReward() {
    var st = station(S.current);
    return '' +
      '<div class="reward">' +
      '<p class="step">Strašidlo ' + st.symbol + ' poraženo!</p>' +
      '<div class="reward-crystal">' + crystalSVG(crystalFilled(), teamColor(), true) + '</div>' +
      '<h2>Získali jste dílek krystalu ' + solvedCount() + '/5</h2>' +
      '<div class="secret">' +
      '<div class="secret-icon">' + D.ICONS[st.key] + '</div>' +
      '<div><p>Tajné číslo pro políčko <b>' + st.symbol + '</b>:</p><div class="digit">' + digitFor(st) + '</div></div></div>' +
      '<p class="big-text">✏️ Zapište si ho <b>teď hned</b> na kartičku týmu k obrázku ' + st.symbol4.toLowerCase() + '!</p>' +
      '<div class="rule"><b>Pravidlo strážce:</b> ' + esc(RULES[st.key]) + '</div>' +
      '<label class="check"><input type="checkbox" id="wroteIt"> Máme zapsáno</label>' +
      '<button class="btn btn-big" id="rewardGo" disabled>Pokračovat ➜</button>' +
      '</div>';
  }

  // ---------- 7) Zámek brány ----------
  var lockInput = [];
  function viewLock() {
    var slots = D.STATIONS.map(function (st, i) {
      var shown = S.lockShown[st.key];
      var val = lockInput[i] != null ? lockInput[i] : (shown ? digitFor(st) : '');
      return '<div class="slot' + (lockInput.length === i ? ' active' : '') + '"><i>' + D.ICONS[st.key] + '</i><b>' + val + '</b></div>';
    }).join('');
    var keys = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { keys += '<button class="key" data-key="' + n + '">' + n + '</button>'; });
    keys += '<button class="key key-del" data-key="del">⌫</button><button class="key" data-key="0">0</button><button class="key key-ok" data-key="ok">✔</button>';
    return '' +
      '<div class="lock">' +
      '<div class="gate-icon">' + D.ICONS.brana + '</div>' +
      '<h2>Digitální brána</h2>' +
      '<p class="big-text">Zadejte tajná čísla <b>ve stejném pořadí jako obrázky</b>:</p>' +
      '<div class="slots">' + slots + '</div>' +
      '<div class="keypad">' + keys + '</div>' +
      '<button class="link-btn" id="lostBtn">Ztratili jsme číslo… (zmrazí vás na ' + FREEZE_LOST + ' s)</button>' +
      '</div>';
  }

  // ---------- 8) Vítězství ----------
  function viewDone() {
    var rules = D.STATIONS.map(function (st) {
      return '<li><i>' + D.ICONS[st.key] + '</i><span>' + esc(RULES[st.key]) + '</span></li>';
    }).join('');
    return '' +
      '<canvas id="confetti"></canvas>' +
      '<div class="done">' +
      '<div class="phishula vanish">' + phishulaSVG('sad') + '</div>' +
      '<div class="reward-crystal">' + crystalSVG([1, 1, 1, 1, 1], teamColor(), true) + '</div>' +
      '<h1 class="spooky">Internet je zachráněn!</h1>' +
      '<p class="big-text">„Néééé! Moje pasti nefungují!“ zakvílel Phishula a rozplynul se v mlze.</p>' +
      '<div class="team-banner finish" style="--c:' + teamColor() + '">' +
      '<span class="dot big"></span><div><div class="tb-name">' + esc(S.team) + '</div>' +
      '<div class="tb-players">Strážci bezpečného internetu</div></div></div>' +
      '<div class="stats">' +
      '<div><span>Brána odemčena</span><b>' + clock(S.finishedAt) + '</b></div>' +
      '<div><span>Čas hry</span><b>' + fmt(elapsed()) + '</b></div>' +
      '<div><span>Chyby</span><b>' + S.wrong + '</b></div>' +
      '<div><span>Nápovědy</span><b>' + S.hints + '</b></div></div>' +
      '<p class="big-text">🏁 Ukažte tablet vedoucí!</p>' +
      '<section class="card"><h2>Kniha strážce internetu</h2><ul class="rulebook">' + rules + '</ul></section>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Obsluha tlačítek
  // ---------------------------------------------------------------
  function bind() {
    var tb = $('#teacherBtn'); if (tb) tb.onclick = openPin;

    if (S.phase === 'setup') {
      $('#ideaBtn').onclick = function () {
        var cur = $('#teamName').value, pick;
        do { pick = NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)]; } while (pick === cur && NAME_IDEAS.length > 1);
        $('#teamName').value = pick; sfx.tap();
      };
      $all('.color-pick').forEach(function (b) {
        b.onclick = function () {
          S.color = +b.getAttribute('data-color');
          $all('.color-pick').forEach(function (x) { x.classList.remove('picked'); });
          b.classList.add('picked');
          document.documentElement.style.setProperty('--team', teamColor());
          sfx.tap();
        };
      });
      $('#setupGo').onclick = function () {
        var name = $('#teamName').value.trim();
        var err = $('#setupErr');
        if (!name) { err.textContent = 'Napište jméno týmu (nebo klepněte na 🎲 Vymyslet).'; return; }
        if (S.color < 0) { err.textContent = 'Vyberte barvu týmu.'; return; }
        S.team = name; S.players = $('#players').value.trim();
        S.route = D.routeFor(S.color);
        sfx.spooky();
        go('story');
      };
    }
    if (S.phase === 'story') $('#storyGo').onclick = function () { sfx.tap(); go('ready'); };
    if (S.phase === 'ready') {
      $('#startBtn').onclick = function () {
        S.startedAt = now(); S.step = 0; S.solved = {};
        goFullscreen(); sfx.spooky(); go('hunt'); keepAwake();
      };
      $('#backSetup').onclick = function () { go('setup'); };
    }
    if (S.phase === 'hunt') {
      $('#scanBtn').onclick = openScanner;
      $('#manualBtn').onclick = openManual;
    }
    if (S.phase === 'station') {
      $('#hintBtn').onclick = function () {
        if (!confirm('Opravdu chcete nápovědu? Phishula vás zmrazí na ' + FREEZE_HINT + ' sekund.')) return;
        S.hints++; S.st.hintShown = true;
        freeze(FREEZE_HINT, '💡 ' + currentHint(), FACTS[S.current] || '', 'hint');
        showHint();
      };
      if (S.st.hintShown) showHint();
    }
    if (S.phase === 'reward') {
      var cb = $('#wroteIt'), go2 = $('#rewardGo');
      cb.onchange = function () { go2.disabled = !cb.checked; };
      go2.onclick = function () {
        S.step++; S.current = null; S.st = {};
        sfx.tap(); go('hunt');
      };
    }
    if (S.phase === 'lock') {
      $all('.key').forEach(function (k) { k.onclick = function () { lockKey(k.getAttribute('data-key')); }; });
      $('#lostBtn').onclick = lostDigit;
    }
  }

  // ---------------------------------------------------------------
  // Zmrazení (trest za chybu)
  // ---------------------------------------------------------------
  var freezeTimer = null;
  function freeze(sec, msg, more, kind) {
    S.freezeUntil = now() + sec * 1000;
    S.freezeTotalSec = sec;
    S.freezeMsg = msg || '';
    S.freezeMore = more || '';
    S.freezeKind = kind || 'wrong';
    S.frozenTotal += sec;
    save();
    checkFreeze();
  }
  function wrong(msg, more) {
    S.wrong++;
    sfx.bad();
    freeze(FREEZE_WRONG, msg, more);
  }
  function checkFreeze() {
    var left = Math.ceil((S.freezeUntil - now()) / 1000);
    var el = document.getElementById('freezeOverlay');
    if (left <= 0) {
      if (el) el.remove();
      if (freezeTimer) { clearInterval(freezeTimer); freezeTimer = null; }
      return;
    }
    if (!el) {
      var isHint = S.freezeKind === 'hint';
      el = document.createElement('div');
      el.id = 'freezeOverlay';
      el.className = 'overlay freeze' + (isHint ? ' freeze-hint' : '');
      el.innerHTML = '<div class="freeze-box">' +
        '<div class="freeze-top"><div class="phishula laugh">' + phishulaSVG() + '</div>' +
        '<div><h2>' + (isHint ? '💡 Nápověda' : '❄️ Zmrazeno!') + '</h2>' +
        '<div class="freeze-count"></div></div></div>' +
        '<div class="freeze-bar"><span></span></div>' +
        '<p class="freeze-msg"></p>' +
        '<div class="freeze-more"' + (S.freezeMore ? '' : ' hidden') + '><b>' + (isHint ? 'Zajímavost' : 'Víte proč?') + '</b><p></p></div>' +
        '<p class="small-note">' + (isHint ? 'Přečtěte si nápovědu nahlas celému týmu. Až čas doběhne, můžete pokračovat.'
          : 'Chyba je v pořádku – přečtěte si vysvětlení nahlas celému týmu.') + '</p></div>';
      overlayRoot.appendChild(el);
      $('.freeze-msg', el).textContent = S.freezeMsg;
      $('.freeze-more p', el).textContent = S.freezeMore || '';
    }
    $('.freeze-count', el).textContent = left + ' s';
    var total = S.freezeTotalSec || left;
    $('.freeze-bar span', el).style.width = Math.max(0, Math.min(100, 100 * left / total)) + '%';
    if (!freezeTimer) freezeTimer = setInterval(checkFreeze, 250);
  }

  // ---------------------------------------------------------------
  // Skener QR kódů (kamera tabletu)
  // ---------------------------------------------------------------
  var scanStream = null, scanLoop = null, detector = null;
  function openScanner() {
    sfx.tap();
    var el = document.createElement('div');
    el.className = 'overlay scanner';
    el.id = 'scanner';
    el.innerHTML = '<video playsinline muted autoplay></video>' +
      '<div class="scan-frame"><span></span><span></span><span></span><span></span><div class="scan-line"></div></div>' +
      '<p class="scan-msg" id="scanMsg">Namiřte kameru na QR kód na kartě</p>' +
      '<div class="scan-actions"><button class="btn btn-ghost" id="scanManual">⌨️ Napsat kód</button>' +
      '<button class="btn" id="scanClose">✕ Zavřít</button></div>';
    overlayRoot.appendChild(el);
    $('#scanClose').onclick = closeScanner;
    $('#scanManual').onclick = function () { closeScanner(); openManual(); };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      scanMsg('Kamera tady nefunguje (hra musí běžet z internetové adresy https). Klepněte na „Napsat kód“.', true);
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(function (stream) {
        scanStream = stream;
        var v = $('#scanner video'); if (!v) { stopStream(); return; }
        v.srcObject = stream;
        v.play().catch(function () {});
        startDecoding(v);
      })
      .catch(function (e) {
        var m = (e && e.name === 'NotAllowedError')
          ? 'Hra nemá povolení ke kameře. Povolte ji v prohlížeči (ikona zámku vedle adresy) nebo klepněte na „Napsat kód“.'
          : 'Kameru se nepodařilo zapnout. Klepněte na „Napsat kód“.';
        scanMsg(m, true);
      });
  }
  function scanMsg(t, isErr) {
    var m = $('#scanMsg'); if (!m) return;
    m.textContent = t; m.classList.toggle('err', !!isErr);
  }
  function startDecoding(video) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var useNative = false;
    try {
      if ('BarcodeDetector' in window) {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        useNative = true;
      }
    } catch (e) { useNative = false; }

    function tick() {
      if (!scanStream) return;
      if (video.readyState < 2) { scanLoop = setTimeout(tick, 150); return; }
      if (useNative) {
        detector.detect(video).then(function (codes) {
          if (codes && codes.length) return handleScan(codes[0].rawValue);
          scanLoop = setTimeout(tick, 120);
        }).catch(function () { useNative = false; scanLoop = setTimeout(tick, 120); });
        return;
      }
      if (window.jsQR) {
        var w = video.videoWidth, h = video.videoHeight;
        var scale = Math.min(1, 640 / Math.max(w, h));
        canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) return handleScan(code.data);
      }
      scanLoop = setTimeout(tick, 150);
    }
    tick();
  }
  function stopStream() {
    if (scanLoop) { clearTimeout(scanLoop); scanLoop = null; }
    if (scanStream) { scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null; }
  }
  function closeScanner() {
    stopStream();
    var el = $('#scanner'); if (el) el.remove();
  }
  var lastBadScan = { text: '', at: 0 };
  function handleScan(text) {
    var key = D.identify(text);
    var res = evaluateCard(key);
    if (res.ok) { sfx.scan(); closeScanner(); res.then(); return; }
    // špatná karta – nechat kameru běžet a ukázat zprávu
    if (text !== lastBadScan.text || now() - lastBadScan.at > 2500) { sfx.bad(); lastBadScan = { text: text, at: now() }; }
    scanMsg(res.msg, true);
    scanLoop = setTimeout(function () {
      var v = $('#scanner video'); if (v && scanStream) startDecoding(v);
    }, 1200);
  }

  // Rozhodne, jestli je naskenovaná karta ta správná
  function evaluateCard(key) {
    var expected = nextKey();
    if (!key) return { ok: false, msg: 'Tohle není karta z naší hry. Hledejte kartu se strašidlem.' };
    if (key === 'brana' && expected !== 'brana') return { ok: false, msg: 'Brána je zatím zamčená! Nejdřív posbírejte všech 5 dílků krystalu.' };
    if (key !== expected) {
      var st = station(key);
      if (S.solved[key]) return { ok: false, msg: 'U strašidla ' + st.symbol + ' už jste byli. Teď hledejte: ' + labelFor(expected) + '.' };
      return { ok: false, msg: 'To je ' + st.symbol + '! Ten je na řadě později. Teď hledejte: ' + labelFor(expected) + '.' };
    }
    return {
      ok: true, then: function () {
        if (key === 'brana') { lockInput = []; go('lock'); }
        else { S.current = key; S.st = {}; go('station'); }
      }
    };
  }
  function labelFor(key) { return key === 'brana' ? 'DIGITÁLNÍ BRÁNU' : station(key).symbol4; }

  // Ruční zadání kódu z karty
  function openManual() {
    var el = document.createElement('div');
    el.className = 'overlay modal-wrap';
    el.innerHTML = '<div class="modal">' +
      '<h2>Napište kód z karty</h2>' +
      '<p>Kód najdete pod QR kódem, např. <b>LEBKA-123</b>.</p>' +
      '<input id="manualCode" autocomplete="off" autocapitalize="characters" placeholder="KÓD Z KARTY">' +
      '<p class="err" id="manualErr"></p>' +
      '<div class="row"><button class="btn btn-ghost" id="manClose">Zpět</button><button class="btn" id="manOk">Ověřit</button></div></div>';
    overlayRoot.appendChild(el);
    var inp = $('#manualCode'); inp.focus();
    function check() {
      var res = evaluateCard(D.identify(inp.value));
      if (res.ok) { el.remove(); sfx.scan(); res.then(); }
      else { sfx.bad(); $('#manualErr').textContent = inp.value.trim() ? res.msg : 'Napište kód.'; }
    }
    $('#manOk').onclick = check;
    inp.onkeydown = function (e) { if (e.key === 'Enter') check(); };
    $('#manClose').onclick = function () { el.remove(); };
  }

  // ---------------------------------------------------------------
  // Obsah stanovišť
  // ---------------------------------------------------------------
  function stationSolved() {
    S.solved[S.current] = now();
    sfx.win();
    go('reward');
  }
  function stBody() { return $('#stBody'); }
  function sub(n) { return (S.st.part || 0) === n; }
  function nextPart() { S.st.part = (S.st.part || 0) + 1; S.st.hintShown = false; save(); render(); }

  // Po správné odpovědi: ukázat vysvětlení a počkat na tlačítko „Dál“
  function explainThenNext(fbEl, text, next) {
    fbEl.innerHTML = '<div class="explain">✅ ' + text + '</div>' +
      '<button class="btn btn-big btn-next">Dál ➜</button>';
    var b = fbEl.querySelector('.btn-next');
    b.onclick = function () { b.disabled = true; sfx.tap(); next(); };
    try { fbEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }

  // Univerzální otázka s možnostmi
  function choiceQuestion(container, q, onRight) {
    var opts = shuffleSeeded(q.options, (S.color + 1) * (q.seed || 3));
    container.innerHTML = '<div class="q">' + (q.intro || '') + '<h3>' + q.text + '</h3>' +
      '<div class="choices">' + opts.map(function (o, i) {
        return '<button class="choice" data-i="' + i + '">' + o.t + '</button>';
      }).join('') + '</div><p class="feedback" id="fb"></p></div>';
    $all('.choice', container).forEach(function (b) {
      b.onclick = function () {
        var o = opts[+b.getAttribute('data-i')];
        if (o.ok) {
          b.classList.add('right'); sfx.ok();
          $all('.choice', container).forEach(function (x) { x.disabled = true; });
          explainThenNext($('#fb', container), o.why || 'Správně!', onRight);
        } else {
          b.classList.add('wrongish');
          setTimeout(function () { b.classList.remove('wrongish'); }, 900);
          wrong(o.why, o.more);
        }
      };
    });
  }

  // Balíček karet: dvě tlačítka, správné zařazení
  function deck(container, cfg, onDone) {
    var order = S.st.order || shuffleSeeded(cfg.items.map(function (_, i) { return i; }), S.color + cfg.seed);
    S.st.order = order;
    var done = S.st.doneItems || [];
    function draw() {
      var remaining = order.filter(function (i) { return done.indexOf(i) < 0; });
      if (!remaining.length) { onDone(); return; }
      var it = cfg.items[remaining[0]];
      container.innerHTML = '<div class="deck">' + cfg.intro +
        '<div class="progress-dots">' + order.map(function (i) { return '<span class="' + (done.indexOf(i) >= 0 ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
        '<div class="deck-card appear">' + it.t + '</div>' +
        '<div class="deck-btns"><button class="btn btn-yes" data-a="1">' + cfg.yes + '</button>' +
        '<button class="btn btn-no" data-a="0">' + cfg.no + '</button></div>' +
        '<p class="feedback" id="fb"></p></div>';
      $all('.deck-btns .btn', container).forEach(function (b) {
        b.onclick = function () {
          var ans = b.getAttribute('data-a') === '1';
          if (ans === it.ok) {
            sfx.ok();
            done.push(remaining[0]); S.st.doneItems = done; save();
            $all('.deck-btns .btn', container).forEach(function (x) { x.disabled = true; });
            explainThenNext($('#fb', container), it.why, draw);
          } else {
            // špatně – karta se zařadí na konec
            order.splice(order.indexOf(remaining[0]), 1); order.push(remaining[0]); S.st.order = order;
            wrong(it.why, it.more);
            draw();
          }
        };
      });
    }
    draw();
  }

  var HINTS = {
    lebka: ['Silné heslo je DLOUHÉ. Spočítejte písmena – nejsilnější heslo je jako celá věta.',
            'Heslo je jako klíč od pokoje. Komu byste ho svěřili, aby ho nikdy nikomu nedal?'],
    pavouk: ['Pasti jsou: kdo e-mail poslal, co slibuje, kam vás posílá, co po vás chce a jak moc spěchá.',
             'Na podezřelé zprávy se neklikat ani neodpovídat. Kdo vám pomůže poznat, jestli je to podvod?'],
    netopyr: ['Zeptejte se: „Mohl by mě podle toho cizí člověk najít, nebo by mi to mohl ukrást?“ Pokud ano, nechte si to pro sebe.'],
    duch: ['Správná odpověď nikomu neubližuje a vždy zapojí dospělého.',
           'Důkazy si nechte (snímek obrazovky). Útočníka zablokujte a řekněte to dospělému.',
           'Co byste chtěli slyšet vy, kdyby vám bylo smutno?'],
    dyne: ['Past poznáte tak, že vás straší, slibuje něco zadarmo, chce heslo nebo tajemství. Co je od školy, knihovny nebo s rodiči, je v pořádku.']
  };
  function currentHint() {
    var list = HINTS[S.current] || [];
    return list[Math.min(S.st.part || 0, list.length - 1)] || '';
  }
  function showHint() {
    var t = currentHint();
    var el = $('#hintText'); if (el && t) el.textContent = '💡 ' + t;
  }
  var FACTS = {
    lebka: 'Náhodné heslo z 20 znaků by i velmi rychlý počítač zkoušel miliony let. Krátké heslo z jednoho slova prolomí za pár vteřin. Proto je nejlepší dlouhá vymyšlená věta, třeba „ZelenyKocourJiDyne7!“ – je dlouhá a přitom se dobře pamatuje.',
    pavouk: 'Slovo phishing pochází z anglického fishing – rybaření. Podvodník hodí návnadu (výhru, dárek, strašidelné varování) a čeká, kdo se chytí. Proto má náš Phishula rybářský prut!',
    netopyr: 'Co se jednou objeví na internetu, si může kdokoli uložit nebo vyfotit obrazovku. I když to potom smažeš, kopie už může existovat. Než něco zveřejníš, zeptej se: Nevadilo by mi, kdyby to viděl úplně cizí člověk?',
    duch: 'Na Linku bezpečí 116 111 mohou děti volat zdarma, ve dne i v noci, a nemusí říkat své jméno. Pomůže, když se děje něco, s čím si nevíš rady – i když se bojíš to říct doma.',
    dyne: 'Na internetu nevidíš, kdo je na druhé straně. Kdokoli si může dát obrázek dítěte a psát, že je mu 10 let. Proto cizím lidem neposíláme fotky, nepíšeme adresu a nikdy se s nimi nescházíme bez rodičů.'
  };

  function mountStation() {
    var c = stBody();
    var k = S.current;

    // --- LEBKA: Hřbitov hesel ---
    if (k === 'lebka') {
      if (sub(0)) {
        var graves = [
          { t: '123456', why: '„123456“ je nejčastější heslo na světě. Phishula ho uhodne dřív, než mrknete!', more: 'Počítač dokáže vyzkoušet miliony hesel za vteřinu. Úplně první zkouší ta nejčastější: 123456, heslo, qwerty. Takové heslo je jako dveře bez zámku.' },
          { t: 'anicka2016', why: 'Jméno a rok narození o vás zná každý spolužák. To je slabé heslo.', more: 'Jméno, jméno pejska nebo rok narození znají spolužáci a často se dají najít i na internetu. Dobré heslo nesmí jít uhodnout podle toho, co o vás lidé vědí.' },
          { t: 'heslo', why: 'Slovo „heslo“ zkouší duchové úplně jako první!', more: 'Podvodníci mají seznamy nejčastějších hesel a začínají jimi. Slova jako „heslo“, „password“ nebo „ahoj“ jsou na začátku každého takového seznamu.' },
          { t: 'Phishula1', why: 'Je krátké – jen jedno slovo a číslo. Na ducha moc slabé.', more: 'Každé písmeno navíc dělá heslo mnohem silnějším. Jedno slovo s číslem na konci počítač prolomí rychle. Silné heslo je dlouhé – nejlépe celá vymyšlená věta.' },
          { t: 'qwertz', why: 'To jsou jen písmenka vedle sebe na klávesnici. Prolomí se za vteřinu.', more: 'qwertz jsou první písmena na horní řadě klávesnice. Takové „cestičky“ po klávesnici (asdf, 1234) zkoušejí podvodníci hned na začátku.' },
          { t: 'ZelenyKocourJiDyne7!', ok: true, why: 'Správně! Je dlouhé jako věta a má velká i malá písmena, číslo i znak. A dá se dobře zapamatovat!' }
        ];
        var gs = shuffleSeeded(graves, S.color + 11);
        c.innerHTML = '<p class="story-line">Phishula pohřbil šest hesel. Jen jedno je tak silné, že ho duch nedokáže prolomit.</p>' +
          '<h3>Klepněte na NEJSILNĚJŠÍ heslo:</h3>' +
          '<div class="graves">' + gs.map(function (g, i) {
            return '<button class="grave" data-i="' + i + '"><span class="rip">R.I.P.</span><span class="pw">' + esc(g.t) + '</span></button>';
          }).join('') + '</div><p class="feedback" id="fb"></p>';
        $all('.grave', c).forEach(function (b) {
          b.onclick = function () {
            var g = gs[+b.getAttribute('data-i')];
            if (g.ok) {
              b.classList.add('glow'); sfx.ok();
              $all('.grave', c).forEach(function (x) { x.disabled = true; });
              explainThenNext($('#fb', c), g.why, nextPart);
            } else { b.classList.add('sunk'); wrong(g.why, g.more); }
          };
        });
      } else {
        choiceQuestion(c, {
          seed: 5,
          intro: '<p class="story-line">Výborně, silné heslo máte! Ale Phishula vám ho chce vylákat…</p>',
          text: 'Komu smíte své heslo prozradit?',
          options: [
            { t: '👫 Nejlepšímu kamarádovi', why: 'Kamarádi se někdy pohádají – a heslo pak můžou zneužít, i nechtěně.', more: 'Kamarád by se mohl přihlásit za vás, napsat něco vaším jménem nebo heslo nechtěně prozradit dál. Heslo je jako kartáček na zuby – nepůjčuje se ani nejlepšímu kamarádovi.' },
            { t: '💎 Hráči ve hře, který za něj slíbí diamanty', why: 'To je podvod! Kdo chce heslo za odměnu, chce vám ukrást účet.', more: 'Nikdo vám nedá nic zdarma za heslo. Kdo heslo získá, může vám vzít účet, postavičku i všechno, co máte ve hře nasbírané.' },
            { t: '📣 Celé třídě, ať ho nezapomenu', why: 'Heslo, které zná hodně lidí, už nic nechrání.', more: 'Čím víc lidí heslo zná, tím je slabší. Když heslo zapomenete, nastavíte si s rodiči nové – nikdo jiný ho znát nemusí.' },
            { t: '👨‍👩‍👧 Jen rodičům', ok: true, why: 'Správně! Heslo znají jen rodiče – nikdo jiný.' }
          ]
        }, stationSolved);
      }
    }

    // --- PAVOUK: podvodný e-mail ---
    if (k === 'pavouk') {
      if (sub(0)) {
        var found = S.st.found || [];
        var traps = {
          from: 'Neznámý odesílatel s divnou adresou',
          prize: 'Výhra, i když jste nic nesoutěžili',
          link: 'Podezřelý odkaz',
          ask: 'Chtějí heslo a adresu',
          hurry: 'Spěchají na vás'
        };
        var seg = function (id, text) {
          var f = found.indexOf(id) >= 0;
          return '<span class="seg' + (f ? ' trap-found' : '') + '" data-seg="' + id + '">' + text +
            (f ? '<em>🕸️ ' + esc(traps[id]) + '</em>' : '') + '</span>';
        };
        var norm = function (text) { return '<span class="seg" data-seg="ok">' + text + '</span>'; };
        c.innerHTML = '<p class="story-line">Pavouk Phishuly upletl podvodný e-mail. Je v něm <b>5 pastí</b>. Klepněte na všechny podezřelé části!</p>' +
          '<p class="found-count">Nalezeno: <b>' + found.length + ' / 5</b></p>' +
          '<div class="email">' +
          '<div class="email-head"><div><small>Od:</small> ' + seg('from', 'Výherní centrum &lt;vyhra@mobil-zdarma.xyz&gt;') + '</div>' +
          '<div><small>Komu:</small> ' + norm('tobě') + '</div>' +
          '<div><small>Předmět:</small> ' + seg('prize', '🎁 GRATULUJEME!!! Vyhrál/a jsi nový mobil!') + '</div></div>' +
          '<div class="email-body">' +
          '<p>' + norm('Ahoj,') + '</p>' +
          '<p>' + norm('píšeme ti z výherního centra.') + '</p>' +
          '<p>' + seg('link', 'Klikni sem: <u>www.vyhra-mobil-zdarma.xyz</u>') + '</p>' +
          '<p>' + seg('ask', 'Napiš nám svoje heslo a adresu, ať ti můžeme mobil poslat.') + '</p>' +
          '<p>' + seg('hurry', 'Musíš odpovědět do 5 minut, jinak výhra propadne!!!') + '</p>' +
          '<p>' + norm('Hezký den přeje Tým výher') + '</p>' +
          '</div></div><p class="feedback" id="fb"></p>';
        $all('.seg', c).forEach(function (s) {
          s.onclick = function () {
            var id = s.getAttribute('data-seg');
            if (id === 'ok') { sfx.tap(); $('#fb', c).textContent = 'Tohle je obyčejná část e-mailu, tady past není. Hledejte dál!'; return; }
            if (found.indexOf(id) >= 0) return;
            found.push(id); S.st.found = found; save(); sfx.ok();
            if (found.length === 5) { setTimeout(nextPart, 1300); }
            mountStation();
            if (found.length === 5) $('#fb', stBody()).innerHTML = '✅ Všech 5 pastí odhaleno!';
          };
        });
      } else {
        choiceQuestion(c, {
          seed: 7,
          intro: '<p class="story-line">Pasti jste odhalili! Ale co teď s tím e-mailem?</p>',
          text: 'Co s takovou zprávou uděláte?',
          options: [
            { t: '🖱️ Kliknu na odkaz, jen se podívám', why: 'I jedno kliknutí může do tabletu pustit virus nebo vás dovést na falešnou stránku.', more: 'Odkaz může vést na stránku, která vypadá jako skutečná, ale je falešná a krade hesla. Na odkaz z podezřelé zprávy se neklikejte ani „jen podívat“ – ukažte ji dospělému.' },
            { t: '🔑 Pošlu heslo – chci ten mobil!', why: 'Tím byste Phishulovi dali klíč od svého účtu. Žádný mobil nepřijde.', more: 'Skutečné firmy ani soutěže po vás heslo nikdy nechtějí. Kdo si o heslo řekne, je podvodník. A výhru v soutěži, do které jste se nepřihlásili, vyhrát nemůžete.' },
            { t: '📨 Přepošlu ji kamarádům, ať taky vyhrají', why: 'Tím byste podvod poslali dál a kamarádi by mohli naletět.', more: 'Podvodníci chtějí, aby se jejich zpráva šířila co nejvíc. Když ji přepošlete, pomáháte jim. Lepší je kamarády varovat: „Pozor, chodí podvodná zpráva o výhře mobilu!“' },
            { t: '🛑 Neklikám, ukážu ji dospělému a smažu ji', ok: true, why: 'Správně! Takovému e-mailu se říká phishing – „rybaření“ hesel.' }
          ]
        }, stationSolved);
      }
    }

    // --- NETOPÝR: sociální síť ---
    if (k === 'netopyr') {
      deck(c, {
        seed: 23,
        intro: '<p class="story-line">Netopýr Bedřich si zakládá profil na sociální síti. Phishula číhá, co prozradí! Pomozte mu rozhodnout:</p>',
        yes: '🌐 Zveřejním', no: '🔒 Nechám si pro sebe',
        items: [
          { t: '🐶 Fotka mého pejska', ok: true, why: 'Fotka zvířátka je v pořádku – jen ať na ní není vidět adresa.', more: 'Fotky zvířátek, hraček nebo vlastních výtvorů jsou bezpečné. Jen pozor, aby v pozadí nebylo vidět číslo domu nebo název ulice.' },
          { t: '🎨 Obrázek, který jsem namaloval', ok: true, why: 'Vlastní obrázek klidně sdílej, je to tvoje dílo.', more: 'Obrázek, který jste nakreslili, nikomu neprozradí, kde bydlíte. Klidně se s ním pochlubte!' },
          { t: '🦇 Přezdívka „Noční letec“ místo celého jména', ok: true, why: 'Přezdívka je chytrá – cizí lidé nepoznají, kdo jsi.', more: 'Přezdívka chrání: kamarádi vědí, že jste to vy, ale cizí lidé vaše skutečné jméno nezjistí.' },
          { t: '🌈 Moje oblíbená barva', ok: true, why: 'Oblíbená barva nikomu neprozradí, kde tě najít.', more: 'Oblíbená barva, jídlo nebo zvíře jsou bezpečné věci – nikdo vás podle nich nenajde. Takové věci sdílet můžete.' },
          { t: '🏠 Adresa: Netopýří 13, Strašidlov', ok: false, why: 'Kdo zná tvou adresu, ví, kde tě najde. Ta na internet nepatří!', more: 'S adresou by vás cizí člověk mohl najít doma. Adresu znají rodina a kamarádi, kteří k vám chodí – na internetu nemá co dělat.' },
          { t: '📱 Moje telefonní číslo', ok: false, why: 'Telefon dávej jen lidem, které znáš doopravdy – ne celému internetu.', more: 'Kdo má vaše číslo, může vám volat a psát kdykoli, i když ho neznáte. Číslo dávejte jen lidem, které znáte ve skutečnosti, a raději se poraďte s rodiči.' },
          { t: '🔑 Moje heslo', ok: false, why: 'Heslo nikdy nezveřejňuj. Znají ho jen rodiče.', more: 'Zveřejněné heslo je jako klíč od domu pověšený na dveřích. Kdokoli by se mohl přihlásit za vás.' },
          { t: '🏫 Fotka v tričku s názvem mé školy', ok: false, why: 'Podle názvu školy cizí člověk zjistí, kde tě každý den najde.', more: 'Podle loga nebo názvu školy cizí člověk zjistí, kam každý den chodíte. Na fotkách proto hlídejte, co je vidět v pozadí a na oblečení.' },
          { t: '💬 „Rodiče odjeli, jsem sám doma.“', ok: false, why: 'Tohle nikdy nepiš – cizí lidé by věděli, že jsi bez dospělých.', more: 'Zprávu, že jste sami doma nebo že rodina odjela na dovolenou, by mohl zneužít zlý člověk. Takové věci se dají napsat až potom, co se vrátíte.' }
        ]
      }, function () {
        c.innerHTML = '<div class="fact"><b>Věděli jste?</b> Většina sociálních sítí (třeba TikTok nebo Instagram) je povolená až od 13 let. Bedřich si profil založí s rodiči.</div>' +
          '<button class="btn btn-big" id="netDone">Pomohli jsme Bedřichovi ➜</button>';
        $('#netDone').onclick = stationSolved;
      });
    }

    // --- DUCH: kyberšikana ---
    if (k === 'duch') {
      var chatBase = [
        { who: 'Kuba', t: 'Viděli jste Tondu dneska na tělocviku? 😂' },
        { who: 'Míša', t: '📷 [fotka] vyfotila jsem ho, jak spadl 😂😂' },
        { who: 'Kuba', t: 'Tonda je trapnej. Nikdo ho tu nechce.' }
      ];
      var chat2 = [{ who: 'Kuba', t: 'A ty se ho nezastávej, nebo budeš další 👻', priv: true }];
      var chat3 = [{ who: 'Tonda', t: 'Je mi hrozně… 😢', priv: true }];
      var part = S.st.part || 0;
      var msgs = chatBase.concat(part >= 1 ? chat2 : []).concat(part >= 2 ? chat3 : []);
      var newCount = part === 0 ? chatBase.length : 1;
      var chatHtml = '<div class="chat"><div class="chat-title">👻 Třída 4.B – skupinový chat</div>' +
        msgs.map(function (m, i) {
          var isNew = i >= msgs.length - newCount;
          return '<div class="msg' + (m.priv ? ' priv' : '') + (isNew ? ' msg-new' : '') + '" style="animation-delay:' + (isNew ? (i - (msgs.length - newCount)) * 0.7 : 0) + 's">' +
            '<b>' + esc(m.who) + (m.priv ? ' (píše jen tobě)' : '') + '</b><span>' + esc(m.t) + '</span></div>';
        }).join('') + '</div>';
      var qs = [
        { seed: 3, text: 'Co uděláte?', options: [
          { t: '😂 Pošlu taky smajlíka – je to jen legrace', why: 'I smajlík znamená „souhlasím“. Tondovi to ubližuje.', more: 'Když se ostatní smějí, ten, komu se smějí, se cítí ještě víc sám. Každý smajlík nebo like je pro něj další rána. Kyberšikana bolí stejně jako šikana ve škole.' },
          { t: '📤 Přepošlu fotku do jiné skupiny', why: 'Tím šikanu šíříte dál a ubližujete ještě víc.', more: 'Fotka se může dostat k desítkám lidí a už nejde vzít zpátky. Šířit cizí fotky bez dovolení je špatné – i když to myslíte jako legraci.' },
          { t: '🙈 Nic. Hlavně ať si mě nevšimnou', why: 'Mlčení šikanu nezastaví. Říct to dospělému není žalování – je to pomoc.', more: 'Když všichni mlčí, ten, kdo ubližuje, si myslí, že je to v pořádku. Žalovat znamená chtít, aby měl někdo průšvih. Říct to dospělému, aby někomu pomohl, je odvaha.' },
          { t: '🛡️ Napíšu „Tohle není fér, nechte ho“ a řeknu to dospělému', ok: true, why: 'Správně! Zastali jste se Tondy a zapojili dospělého.' }
        ] },
        { seed: 5, text: 'Teď Kuba píše VÁM. Co uděláte?', options: [
          { t: '😡 Odepíšu mu něco ještě horšího', why: 'Oplácení všechno zhorší – a pak byste šikanovali vy.', more: 'Když oplácíte, hádka roste a nakonec můžete mít problém i vy. Nejsilnější je neodpovídat, uložit si důkaz a říct to dospělému.' },
          { t: '🗑️ Smažu to a nikomu nic neřeknu', why: 'Smazáním zmizí důkaz. A se strachem nemáte zůstat sami.', more: 'Snímek obrazovky je důkaz – dospělý díky němu může zasáhnout. A strach se nese líp, když o něm ví někdo, komu věříte. Pomoct může i Linka bezpečí 116 111.' },
          { t: '📸 Udělám snímek obrazovky, zablokuji ho a řeknu to rodičům nebo učitelce', ok: true, why: 'Přesně tak! Důkaz, blokování a dospělý – to je nejlepší obrana.' }
        ] },
        { seed: 9, text: 'Tondovi je smutno. Co mu napíšete?', options: [
          { t: '🤷 Nevím, mně se to netýká.', why: 'Tonda potřebuje slyšet, že v tom není sám.', more: 'Kdo zažívá šikanu, často se cítí úplně sám. Stačí jedna milá zpráva od kamaráda a hned je mu líp.' },
          { t: '🙄 Nebreč, to přejde.', why: 'Tím Tondovi moc nepomůžete. Zkuste mu ukázat, že stojíte při něm.', more: '„Nebreč“ znamená, že jeho smutek nebereme vážně. Lepší je napsat, že jste s ním, a pomoct mu říct to dospělému.' },
          { t: '💪 Neboj, jsem s tebou. Pojď, řekneme to paní učitelce.', ok: true, why: 'Krásně! Takový kamarád je silnější než každý duch.' }
        ] }
      ];
      c.innerHTML = '<p class="story-line">Ve třídním chatu straší duch kyberšikany. Přečtěte si zprávy:</p>' + chatHtml + '<div id="duchQ"></div>';
      var qEl = $('#duchQ', c);
      var delay = part === 0 ? 2300 : 900;
      qEl.style.opacity = 0;
      setTimeout(function () {
        if (S.current !== 'duch' || !document.body.contains(qEl)) return;
        qEl.style.opacity = 1;
        choiceQuestion(qEl, qs[part], function () {
          if (part < 2) nextPart(); else stationSolved();
        });
      }, delay);
    }

    // --- DÝNĚ: past, nebo v pořádku? ---
    if (k === 'dyne') {
      deck(c, {
        seed: 31,
        intro: '<p class="story-line">Phishula nastražil v labyrintu pasti. U každé situace rozhodněte: je to v pořádku, nebo past?</p>',
        yes: '✅ V pořádku', no: '🎃 Past!',
        items: [
          { t: '⚠️ Vyskočí okno: „Tvůj tablet má 13 virů! Klikni a vyčisti ho!“', ok: false, why: 'Strašidelná okna jsou past. Nic neklikejte, zavřete je a řekněte dospělému.', more: 'Opravdový antivir na vás nekřičí z reklamy. Strašidelná okna chtějí, abyste klikli, stáhli si škodlivý program nebo zaplatili. Okno zavřete, a když nejde, zavolejte dospělého.' },
          { t: '💎 Hra slibuje: „1000 diamantů zdarma! Stačí zadat heslo od účtu.“', ok: false, why: 'Kdo chce heslo za dárek, chce ukrást účet. Je to past!', more: 'Hry rozdávají odměny samy ve hře, nikdy za heslo. Kdo heslo získá, vezme vám účet a všechno, co v něm máte.' },
          { t: '🎮 Neznámý hráč: „Je mi taky 10. Pošli fotku a sejdeme se. Ale nic neříkej rodičům.“', ok: false, why: 'Cizí člověk, který chce tajemství, fotky nebo schůzku, je největší nebezpečí. Hned to řekněte rodičům!', more: 'Na internetu se může za dítě vydávat kdokoli, i dospělý. Kdo chce fotky, schůzku nebo tajemství před rodiči, je nebezpečný – i když je milý. Nic mu neposílejte, neodpovídejte a hned to ukažte rodičům.' },
          { t: '📺 Video: „Dej tablet do mikrovlnky a nabije se za vteřinu!“', ok: false, why: 'Na internetu je spousta nesmyslů. Tohle je lež – a nebezpečná!', more: 'Natočit video a tvrdit v něm cokoli může každý. Než něčemu uvěříte, zeptejte se: Kdo to říká? Dává to smysl? Ověřte si to u dospělého. A tablet do mikrovlnky nikdy – mohl by začít hořet!' },
          { t: '📍 Aplikace s tapetami chce přístup k tvým kontaktům a poloze.', ok: false, why: 'Proč by tapety potřebovaly vědět, kde jste? Takové povolení s rodiči nepotvrzujte.', more: 'Aplikace má dostat jen povolení, která opravdu potřebuje. Tapety nepotřebují vaše kontakty ani polohu – takové aplikace často sbírají údaje o lidech.' },
          { t: '🏫 Paní učitelka pošle odkaz na procvičování na školním webu.', ok: true, why: 'To je v pořádku – odkaz je od paní učitelky a ze školního webu.', more: 'Odkaz od paní učitelky na školní web je bezpečný: víte, kdo ho poslal, i kam vede. Ne všechno na internetu je past!' },
          { t: '📚 S mámou hledáš na stránce knihovny knížku o netopýrech.', ok: true, why: 'Stránka knihovny a k tomu s mámou? Úplně v pořádku!', more: 'Stránky knihovny jsou důvěryhodné a hledání s mámou je úplně v pořádku. Ne všechno na internetu je past!' },
          { t: '🙋 Než si stáhneš novou hru, zeptáš se rodičů.', ok: true, why: 'Přesně tak to dělají strážci internetu!', more: 'Rodiče zkontrolují, jestli je hra bezpečná a vhodná pro váš věk. Zeptat se předem je chytré, ne trapné.' }
        ]
      }, stationSolved);
    }
  }

  // ---------------------------------------------------------------
  // Zámek brány
  // ---------------------------------------------------------------
  function lockKey(k) {
    sfx.tap();
    // políčka odhalená nápovědou se vyplní sama
    function fillShown() {
      while (lockInput.length < 5 && S.lockShown[D.STATIONS[lockInput.length].key]) lockInput.push(digitFor(D.STATIONS[lockInput.length]));
    }
    fillShown();
    if (k === 'del') {
      do { lockInput.pop(); } while (lockInput.length && S.lockShown[D.STATIONS[lockInput.length].key]);
    } else if (k === 'ok') {
      if (lockInput.length < 5) { sfx.bad(); return; }
      var right = D.STATIONS.every(function (st, i) { return lockInput[i] === digitFor(st); });
      if (right) { finish(); return; }
      lockInput = [];
      S.wrong++; sfx.bad();
      freeze(FREEZE_LOCK, 'Brána se nepohnula! Kód není správně.',
        'Na kartičce máte čísla zapsaná pod obrázky. Zadejte je zleva doprava ve stejném pořadí jako na bráně: lebka, pavouk, netopýr, duch, dýně. Zkontrolujte, jestli jste si některé číslo nespletli – třeba 1 a 7.');
    } else if (lockInput.length < 5) {
      lockInput.push(+k); fillShown();
    }
    var lock = $('.lock'); if (lock) { app.querySelector('main').innerHTML = viewLock(); bind(); }
  }
  function lostDigit() {
    var el = document.createElement('div');
    el.className = 'overlay modal-wrap';
    el.innerHTML = '<div class="modal"><h2>Které číslo chybí?</h2><p>Phishula vám ho prozradí, ale zmrazí vás na ' + FREEZE_LOST + ' sekund.</p>' +
      '<div class="lost-grid">' + D.STATIONS.map(function (st) {
        return '<button class="lost-pick" data-k="' + st.key + '"' + (S.lockShown[st.key] ? ' disabled' : '') + '><i>' + D.ICONS[st.key] + '</i>' + st.symbol + '</button>';
      }).join('') + '</div><button class="btn btn-ghost" id="lostClose">Zpět</button></div>';
    overlayRoot.appendChild(el);
    $all('.lost-pick', el).forEach(function (b) {
      b.onclick = function () {
        S.lockShown[b.getAttribute('data-k')] = true; S.hints++;
        el.remove(); lockInput = [];
        freeze(FREEZE_LOST, 'Phishula neochotně prozrazuje číslo… Až čas doběhne, uvidíte ho v bráně.',
          'Tip pro příště: důležité věci si hned zapisujte a hlídejte – stejně jako hesla. Kdo má hesla jen „v hlavě“ nebo na papírku, který se válí kdekoli, o ně snadno přijde.', 'hint');
        render();
      };
    });
    $('#lostClose').onclick = function () { el.remove(); };
  }
  function finish() {
    S.finishedAt = now();
    sfx.win(); setTimeout(sfx.win, 900);
    go('done');
  }

  // ---------------------------------------------------------------
  // Konfety na konci
  // ---------------------------------------------------------------
  function confetti() {
    var cv = document.getElementById('confetti'); if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = cv.getContext('2d'), W, H, parts = [], t0 = now();
    function size() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
    size(); window.addEventListener('resize', size);
    var cols = [teamColor(), '#ff8a1f', '#7dff9b', '#b05cff', '#ffd43b', '#ffffff'];
    for (var i = 0; i < 160; i++) parts.push({ x: Math.random() * W, y: -Math.random() * H, r: 4 + Math.random() * 6, c: cols[i % cols.length], vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, a: Math.random() * 6 });
    (function frame() {
      if (!document.body.contains(cv)) return;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.y += p.vy; p.x += p.vx + Math.sin(p.a) * .5; p.a += .05;
        if (p.y > H + 10 && now() - t0 < 6000) { p.y = -10; p.x = Math.random() * W; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      });
      if (now() - t0 < 10000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })();
  }

  // ---------------------------------------------------------------
  // Menu pro vedoucí (PIN)
  // ---------------------------------------------------------------
  function openPin() {
    var el = document.createElement('div');
    el.className = 'overlay modal-wrap';
    el.innerHTML = '<div class="modal"><h2>Menu pro vedoucí</h2><p>Zadejte PIN:</p>' +
      '<input id="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off">' +
      '<p class="err" id="pinErr"></p><div class="row"><button class="btn btn-ghost" id="pinClose">Zpět</button><button class="btn" id="pinOk">OK</button></div></div>';
    overlayRoot.appendChild(el);
    var inp = $('#pin'); inp.focus();
    function ok() {
      if (inp.value === D.TEACHER_PIN) { el.remove(); openTeacher(); }
      else $('#pinErr').textContent = 'Špatný PIN.';
    }
    $('#pinOk').onclick = ok;
    inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
    $('#pinClose').onclick = function () { el.remove(); };
  }
  function baseUrl() {
    var u = location.href.split('#')[0].split('?')[0];
    return u.replace(/index\.html$/, '');
  }
  function openTeacher() {
    var el = document.createElement('div');
    el.className = 'overlay modal-wrap';
    var cur = S.phase === 'station' ? station(S.current).symbol : (S.phase === 'hunt' ? 'hledá ' + labelFor(nextKey()) : S.phase);
    var table = '<table class="sol"><tr><th>Barva</th>' + D.STATIONS.map(function (s) { return '<th><i>' + D.ICONS[s.key] + '</i></th>'; }).join('') + '<th>Kód</th></tr>' +
      D.COLORS.map(function (c, ci) {
        return '<tr><td><span class="dot" style="background:' + c.hex + '"></span>' + esc(c.name) + '</td>' +
          D.DIGITS[ci].map(function (d) { return '<td>' + d + '</td>'; }).join('') + '<td><b>' + D.DIGITS[ci].join('') + '</b></td></tr>';
      }).join('') + '</table>';
    el.innerHTML = '<div class="modal teacher">' +
      '<h2>⚙ Menu pro vedoucí</h2>' +
      '<p class="t-state">Tým: <b>' + esc(S.team || '—') + '</b> · fáze: <b>' + esc(cur) + '</b> · dílky ' + solvedCount() + '/5' +
      (S.startedAt ? ' · čas ' + fmt(elapsed()) : '') + '</p>' +
      '<div class="t-grid">' +
      '<button class="btn" id="tUnfreeze">❄️ Odmrazit tým</button>' +
      '<button class="btn" id="tSkip">⏭ Uznat aktuální úkol</button>' +
      '<button class="btn" id="tSound">' + (S.sound ? '🔊 Zvuk: zapnutý' : '🔇 Zvuk: vypnutý') + '</button>' +
      '<button class="btn" id="tQR">🔗 QR kód pro otevření hry</button>' +
      '<button class="btn" id="tSol">🗝 Tahák s čísly</button>' +
      '<a class="btn" href="tisk.html" target="_blank" rel="noopener">🖨 Karty k tisku</a>' +
      '<button class="btn btn-danger" id="tReset">🗑 Nová hra (smazat tým)</button>' +
      '</div>' +
      '<div id="tExtra"></div>' +
      '<button class="btn btn-ghost" id="tClose">Zavřít</button></div>';
    overlayRoot.appendChild(el);
    $('#tClose').onclick = function () { el.remove(); };
    $('#tUnfreeze').onclick = function () { S.freezeUntil = 0; save(); checkFreeze(); el.remove(); };
    $('#tSound').onclick = function () { S.sound = !S.sound; save(); el.remove(); openTeacher(); };
    $('#tSkip').onclick = function () {
      if (S.phase === 'station') { el.remove(); stationSolved(); return; }
      if (S.phase === 'hunt') {
        var key = nextKey(); el.remove();
        if (key === 'brana') { lockInput = []; go('lock'); }
        else { S.current = key; S.st = {}; stationSolved(); }
        return;
      }
      if (S.phase === 'lock') { el.remove(); finish(); return; }
      alert('Teď není co přeskočit.');
    };
    $('#tReset').onclick = function () {
      if (!confirm('Opravdu smazat tento tým a začít znovu? Postup se ztratí.')) return;
      var snd = S.sound; S = fresh(); S.sound = snd; save(); el.remove(); render();
    };
    $('#tSol').onclick = function () { $('#tExtra').innerHTML = '<h3>Tajná čísla podle barvy týmu</h3>' + table; };
    $('#tQR').onclick = function () {
      var url = baseUrl();
      var box = $('#tExtra');
      if (!/^https?:/.test(url)) { box.innerHTML = '<p class="err">QR kód půjde vytvořit, až hra poběží z internetové adresy (GitHub Pages).</p>'; return; }
      var qr = qrcode(0, 'M'); qr.addData(url); qr.make();
      box.innerHTML = '<div class="start-qr">' + qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true }) + '<p>' + esc(url) + '</p></div>';
    };
  }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  render();
  keepAwake();

  // Pro testování: window.__PH_STATE
  window.__PH = { get state() { return S; }, render: render };
})();
