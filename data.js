/* =========================================================
   Noční útok ducha Phishuly – společná data (hra i tisk)
   ========================================================= */
window.PH = (function () {
  'use strict';

  // ---------- Ikony stanovišť (SVG, fungují v prohlížeči i v tisku) ----------
  var ICONS = {
    lebka:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M50 8C28 8 13 24 13 45c0 12 6 21 15 26v12c0 4 3 7 7 7h30c4 0 7-3 7-7V71c9-5 15-14 15-26C87 24 72 8 50 8z" fill="#f6f0e4" stroke="#24163a" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="35" cy="46" rx="10" ry="11" fill="#24163a"/><ellipse cx="65" cy="46" rx="10" ry="11" fill="#24163a"/>' +
      '<path d="M50 57l-6 11h12z" fill="#24163a"/>' +
      '<path d="M41 78v11M50 78v11M59 78v11" stroke="#24163a" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="38" cy="43" r="3" fill="#7dff9b"/><circle cx="68" cy="43" r="3" fill="#7dff9b"/></svg>',
    pavouk:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M50 0v28" stroke="#cfc6e6" stroke-width="2"/>' +
      '<g fill="none" stroke="#24163a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M40 50L22 36 8 46"/><path d="M39 58L18 56 6 68"/><path d="M40 66L22 74 14 90"/><path d="M43 72L32 88 30 98"/>' +
      '<path d="M60 50l18-14 14 10"/><path d="M61 58l21-2 12 12"/><path d="M60 66l18 8 8 16"/><path d="M57 72l11 16 2 10"/></g>' +
      '<ellipse cx="50" cy="62" rx="15" ry="17" fill="#3a2a55" stroke="#24163a" stroke-width="3"/>' +
      '<circle cx="50" cy="38" r="11" fill="#3a2a55" stroke="#24163a" stroke-width="3"/>' +
      '<circle cx="45" cy="37" r="3.5" fill="#ff4f6d"/><circle cx="55" cy="37" r="3.5" fill="#ff4f6d"/>' +
      '<path d="M44 62l6 6 6-6-6-6z" fill="#ff8a1f"/></svg>',
    netopyr:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M44 46C34 32 18 30 3 39c8 4 10 11 8 20 6-4 13-4 17 2 3-6 9-7 14-3z" fill="#3a2a55" stroke="#24163a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M56 46c10-14 26-16 41-7-8 4-10 11-8 20-6-4-13-4-17 2-3-6-9-7-14-3z" fill="#3a2a55" stroke="#24163a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M43 42l-1-13 6 8h4l6-8-1 13" fill="#3a2a55" stroke="#24163a" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="52" rx="10" ry="15" fill="#4a3870" stroke="#24163a" stroke-width="3"/>' +
      '<circle cx="46" cy="45" r="2.8" fill="#ffd43b"/><circle cx="54" cy="45" r="2.8" fill="#ffd43b"/>' +
      '<path d="M46 52l1.5 3 1.5-3M51 52l1.5 3 1.5-3" stroke="#fff" stroke-width="1.5" fill="none"/></svg>',
    duch:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M50 9C31 9 20 24 20 43v44l7.5-8 7.5 8 7.5-8 7.5 8 7.5-8 7.5 8 7.5-8 7.5 8V43C80 24 69 9 50 9z" fill="#f6f0e4" stroke="#24163a" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="40" cy="40" rx="5.5" ry="8" fill="#24163a"/><ellipse cx="60" cy="40" rx="5.5" ry="8" fill="#24163a"/>' +
      '<ellipse cx="50" cy="58" rx="6" ry="7" fill="#24163a"/>' +
      '<ellipse cx="31" cy="51" rx="4" ry="2.5" fill="#ffb3c4"/><ellipse cx="69" cy="51" rx="4" ry="2.5" fill="#ffb3c4"/></svg>',
    dyne:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M48 22c0-8 3-13 9-15" stroke="#3c7a2a" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="58" rx="22" ry="32" fill="#e8701a" stroke="#24163a" stroke-width="3"/>' +
      '<ellipse cx="68" cy="58" rx="22" ry="32" fill="#e8701a" stroke="#24163a" stroke-width="3"/>' +
      '<ellipse cx="50" cy="58" rx="22" ry="34" fill="#ff8a1f" stroke="#24163a" stroke-width="3"/>' +
      '<path d="M30 46l9-10 9 10zM52 46l9-10 9 10z" fill="#24163a"/>' +
      '<path d="M26 64q24 22 48 0l-6 2-4 6-5-6-6 7-6-7-5 6-4-6z" fill="#24163a"/></svg>',
    brana:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M50 4L80 30 70 90H30L20 30z" fill="#8a4dff" stroke="#24163a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M50 4L64 30 50 90 36 30z" fill="#b98cff"/>' +
      '<path d="M20 30h60" stroke="#24163a" stroke-width="2"/>' +
      '<path d="M50 4L36 30M50 4l14 26" stroke="#24163a" stroke-width="2"/>' +
      '<path d="M36 30l14 60 14-60" fill="none" stroke="#24163a" stroke-width="2"/>' +
      '<path d="M28 16l-6-6M76 12l5-6M88 44l7 0M6 48h6" stroke="#7dff9b" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  // ---------- Barvy týmů ----------
  var COLORS = [
    { id: 'oranzova', name: 'Dýňová oranžová', hex: '#ff8a1f' },
    { id: 'zelena', name: 'Jedovatá zelená', hex: '#39e66b' },
    { id: 'cervena', name: 'Upíří červená', hex: '#ff3b5c' },
    { id: 'modra', name: 'Strašidelná modrá', hex: '#3fa9ff' },
    { id: 'fialova', name: 'Čarodějná fialová', hex: '#b05cff' },
    { id: 'zluta', name: 'Měsíční žlutá', hex: '#ffd43b' }
  ];

  // ---------- Stanoviště ----------
  // Pořadí v tomto poli = pořadí čísel ve finálním kódu.
  var STATIONS = [
    { id: 1, key: 'lebka', symbol: 'LEBKA', symbol4: 'LEBKU', name: 'Hřbitov hesel',
      qr: 'PHISHULA|LEBKA|7Q2', code: 'LEBKA-482' },
    { id: 2, key: 'pavouk', symbol: 'PAVOUK', symbol4: 'PAVOUKA', name: 'Pavoučí krypta',
      qr: 'PHISHULA|PAVOUK|K9M', code: 'PAVOUK-915' },
    { id: 3, key: 'netopyr', symbol: 'NETOPÝR', symbol4: 'NETOPÝRA', name: 'Netopýří sociální síť',
      qr: 'PHISHULA|NETOPYR|R4X', code: 'NETOPYR-736' },
    { id: 4, key: 'duch', symbol: 'DUCH', symbol4: 'DUCHA', name: 'Jeskyně kyberšikany',
      qr: 'PHISHULA|DUCH|T8W', code: 'DUCH-254' },
    { id: 5, key: 'dyne', symbol: 'DÝNĚ', symbol4: 'DÝNI', name: 'Labyrint internetových pastí',
      qr: 'PHISHULA|DYNE|H3Z', code: 'DYNE-603' }
  ];
  var GATE = { key: 'brana', symbol: 'BRÁNA', name: 'Digitální brána', qr: 'PHISHULA|BRANA|V6P', code: 'BRANA-871' };

  // Tajná čísla – každá barva týmu má jiná, takže týmy nemohou opisovat.
  // DIGITS[barva][stanoviště 0–4]
  var DIGITS = [
    [4, 7, 2, 9, 1],
    [8, 3, 6, 1, 5],
    [2, 9, 4, 7, 3],
    [6, 1, 8, 3, 9],
    [3, 5, 7, 2, 8],
    [9, 2, 5, 8, 6]
  ];

  // Trasa: každá barva začíná na jiném stanovišti, aby se týmy nepotkávaly.
  function routeFor(colorIdx) {
    var start = colorIdx % STATIONS.length, r = [];
    for (var i = 0; i < STATIONS.length; i++) r.push(STATIONS[(start + i) % STATIONS.length].id);
    return r;
  }

  function normalize(s) {
    return String(s || '').toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  // Přečte text z QR nebo ručně zadaný kód a vrátí klíč stanoviště ('lebka'… nebo 'brana').
  function identify(text) {
    var n = normalize(text);
    if (!n) return null;
    var all = STATIONS.concat([GATE]);
    for (var i = 0; i < all.length; i++) {
      if (n === normalize(all[i].qr) || n === normalize(all[i].code)) return all[i].key;
    }
    return null;
  }

  return {
    ICONS: ICONS, COLORS: COLORS, STATIONS: STATIONS, GATE: GATE, DIGITS: DIGITS,
    routeFor: routeFor, identify: identify, normalize: normalize,
    TEACHER_PIN: '3110'
  };
})();
