























(function () {
  'use strict';
  var CFG = window.WB_CFG || {};
  var MICHI = CFG.michi || {};
  function narabe(o) {
    if (Array.isArray(o)) return o.slice();
    var a = [];
    Object.keys(o || {}).forEach(function (k) { a = a.concat(o[k] || []); });
    return a;
  }
  var LOCAL_NA = MICHI.local || [], YAMERU = MICHI.yameru || {}, WBAPI_NA = narabe(MICHI.wbapi);
  var CY = MICHI.chokuYobi || {}, R2_NA = CY.R2 || [], W1_NA = CY.W1 || [], CHOKU_NA = narabe(CY);
  var FURUI_NA = narabe(MICHI.furui), SHIZUKA = MICHI.shizuka || [], NAMAE = MICHI.namae || {};
  var R2_MATSU_MS = CFG.r2MatsuMs || 20000;
  var MIRU = CFG.miru === true;
  var MIRU_BUN = 'まだ使えません（古い画面で操作してください）。この新しい画面は、いまは見るだけ版です。';
  var MIRU_YOTEI = 'まだ使えません（予定は古い画面で見てください）。この新しい画面は、いまは見るだけ版です。';
  var naoseru = [];
  var kiroku = [];
  var SHELL = window.WBSHELL = { naoseru: naoseru, kiroku: kiroku, ver: CFG.ver || '' };
  function aru(list, fn) { return list.indexOf(fn) >= 0; }


  var AUTH_KEYS = ['code', 'state', 'error', 'error_code', 'error_description'];
  function pageUrl() { return location.origin + location.pathname; }
  var loc0 = (function () {
    var q = new URLSearchParams(location.search), one = {}, all = {}, err = null, authAri = false;
    function tsumu(k, v) { if (!(k in one)) one[k] = v; (all[k] = all[k] || []).push(v); }
    q.forEach(function (v, k) {
      if (AUTH_KEYS.indexOf(k) >= 0) { authAri = true; if (k === 'error_description') err = v; return; }
      tsumu(k, v);
    });

    var modoru = null;
    try { modoru = sessionStorage.getItem('WB_MODORU'); } catch (e) {}
    if (modoru !== null && authAri) {
      new URLSearchParams(modoru).forEach(function (v, k) { if (AUTH_KEYS.indexOf(k) < 0 && !(k in one)) tsumu(k, v); });
      try { sessionStorage.removeItem('WB_MODORU'); } catch (e) {}
    }
    return { parameter: one, parameters: all, hash: String(location.hash || '').replace(/^#/, ''), authErr: err, authAri: authAri };
  })();


  function obi(html, iro, tojiru) {
    var d = document.getElementById('wbShellObi');
    if (!d) {
      d = document.createElement('div');
      d.id = 'wbShellObi';
      d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;padding:12px 40px 12px 16px;font:14px/1.6 sans-serif;'
        + 'color:#241D1A;border-bottom:1px solid #E1C77A';
      (document.body || document.documentElement).appendChild(d);
    }
    d.style.background = iro || '#FFF4D6';
    d.innerHTML = html + (tojiru ? '<button type="button" aria-label="閉じる" style="position:absolute;right:8px;top:8px;'
      + 'border:0;background:transparent;font-size:18px;cursor:pointer">×</button>' : '');
    if (tojiru) d.lastChild.onclick = function () { d.remove(); };
    return d;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function furuiGamen() {
    var u = '';
    try { u = localStorage.getItem('WB_GAS_URL') || ''; } catch (e) {}
    return u ? ' <a href="' + esc(u) + '" target="_blank" rel="noopener">いつもの画面（古い URL）を開く</a>' : '';
  }
  function namaeOf(fn) { return NAMAE[fn] || fn; }


  function appNoNaka() {
    var ua = navigator.userAgent || '';
    return /\bLine\/|FBAN|FBAV|Instagram|KAKAOTALK|MicroMessenger|; wv\)/i.test(ua);
  }


  function makeAuth() {
    if (CFG.mode === 'stub') return window.WB_STUB_AUTH;
    if (CFG.mode === 'local') return window.WB_NISE_AUTH;
    if (!window.supabase || !window.supabase.createClient) throw new Error('supabase-js が読み込めていません');
    var sb = window.supabase.createClient(CFG.sbUrl, CFG.anon, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    function katachi(s) {
      return s ? { token: s.access_token, email: String((s.user && s.user.email) || '').trim().toLowerCase() } : null;
    }
    return {
      session: function () { return sb.auth.getSession().then(function (r) { return katachi(r && r.data && r.data.session); }); },
      refresh: function () { return sb.auth.refreshSession().then(function (r) { return katachi(r && r.data && r.data.session); }); },
      login: function () {

        try { sessionStorage.setItem('WB_MODORU', location.search); } catch (e) {}
        return sb.auth.signInWithOAuth({ provider: 'google', options: {
          redirectTo: pageUrl(),
          queryParams: { hd: CFG.hd || '', prompt: 'select_account' } } });
      },
      logout: function () { return sb.auth.signOut(); }
    };
  }
  var AUTH = null;
  try { AUTH = makeAuth(); } catch (e) { obi('ログインの準備ができませんでした（' + esc(e.message) + '）。' + furuiGamen(), '#FDE2E1'); }


  var LOGIN_KEY = 'WB_LOGIN_TRY';
  var MATSU = new Promise(function () {});
  var loginTochu = false;
  function loginMade() {
    if (!AUTH) return MATSU;
    return AUTH.session().then(function (s) {
      if (s && s.token) {
        try { sessionStorage.removeItem(LOGIN_KEY); } catch (e) {}

        if (loc0.authAri && CFG.mode === 'real') {
          try {
            var q = new URLSearchParams(loc0.parameter).toString();
            history.replaceState(null, '', pageUrl() + (q ? '?' + q : '') + (loc0.hash ? '#' + loc0.hash : ''));
          } catch (e) {}
          loc0.authAri = false;
        }
        return s;
      }
      if (loginTochu) return MATSU;
      loginTochu = true;
      if (loc0.authErr) {
        obi('ログインできませんでした：' + esc(loc0.authErr)
          + '<br>会社の Google アカウントで、名簿に入っている人だけが使えます。' + furuiGamen(), '#FDE2E1');
        return MATSU;
      }
      if (appNoNaka()) {
        obi('このアプリの中の画面では、Google にログインできません。<b>Safari か Chrome で開いてください。</b>'
          + '<br><span style="user-select:all">' + esc(pageUrl()) + '</span>');
        return MATSU;
      }
      var n = 0;
      try { var o = JSON.parse(sessionStorage.getItem(LOGIN_KEY) || 'null'); if (o && Date.now() - o.t < 60000) n = o.n; } catch (e) {}
      if (n >= 2) {
        obi('ログインが続けて失敗しました。いったん閉じて、もう一度開いてください。' + furuiGamen(), '#FDE2E1');
        return MATSU;
      }
      try { sessionStorage.setItem(LOGIN_KEY, JSON.stringify({ n: n + 1, t: Date.now() })); } catch (e) {}
      obi('Google でログインしています…');
      AUTH.login();
      return MATSU;
    });
  }
  var hajime = loginMade();


  function rpc(s, namae, hikisuu) {
    return fetch(CFG.sbUrl + '/rest/v1/rpc/' + namae, {
      method: 'POST',
      headers: { 'apikey': CFG.anon, 'Authorization': 'Bearer ' + s.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(hikisuu || {})
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(null, function () { return ''; }).then(function (t) {
          var m = ''; try { m = String((JSON.parse(t) || {}).message || ''); } catch (e) {}
          var e2 = new Error(namae + ' が ' + res.status + ' を返しました' + (m ? '（' + m.slice(0, 120) + '）' : ''));
          e2.status = res.status; e2.sbMsg = m;
          throw e2;
        });
      }
      return res.json();
    });
  }


  function hyo(s, michi) {
    return fetch(CFG.sbUrl + michi, { headers: { 'apikey': CFG.anon, 'Authorization': 'Bearer ' + s.token } }).then(function (res) {
      if (!res.ok) throw new Error(michi.split('?')[0] + ' が ' + res.status + ' を返しました');
      return res.json();
    });
  }

  function miruSoe(s) {
    return rpc(s, 'is_member', {}).then(function (m) {
      if (m !== true) {
        obi('この画面は、名簿に入っている人だけが使えます（' + esc(s.email) + '）。', '#FDE2E1');
        kiroku.push({ fn: 'sbWatashimono', michi: 'miru-meibo-nai', ms: 0 });
        return MATSU;
      }
      return hyo(s, '/rest/v1/event_types?select=type_id,display_name,color').then(null, function () { return []; }).then(function (a) {
        var et = {};
        (Array.isArray(a) ? a : []).forEach(function (x) {
          if (x && x.type_id) et[x.type_id] = { name: String(x.display_name || x.type_id), color: String(x.color || '#78838F') };
        });
        obi('<b>見るだけ版です。</b>記録・タスク・着席・予定の書き込みは、まだ使えません（古い画面で操作してください）。'
          + '予定（カレンダー）もまだ出ません。', '#E8F0FE', true);
        return { etypes: et, links: [], links2: { admin: false, meet: '', tobila: '', tobilaLinks: [], idleMin: 30, sheets: [] },
                 taskOrder: [], kAdd: '', hol: {}, custBase: '', pjBase: '', cal: 'off', ver: '', runCols: 14,
                 naoseru: false, iremono: 'on', miru: true };
      });
    });
  }


  var watashiKai = 0, links2 = null;
  function taskOrderOboe() {
    try { var a = JSON.parse(localStorage.getItem('WB_TASK_ORDER') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  var LOCAL = {



    sbWatashimono: function () {
      return loginMade().then(function (s0) {
        var p = (watashiKai++ === 0 || !AUTH.refresh) ? Promise.resolve(s0)
          : AUTH.refresh().then(function (s1) { return (s1 && s1.token) ? s1 : s0; }, function () { return s0; });
        return p.then(function (s) {
          return (MIRU ? miruSoe(s) : rpc(s, 'wb_watashimono', {})).then(function (so) {
            so = (so && typeof so === 'object') ? so : {};
            if (so.gasUrl) { try { localStorage.setItem('WB_GAS_URL', String(so.gasUrl)); } catch (e) {} }
            if (so.iremono !== 'on') {
              var t = Array.isArray(so.iremonoTarinai) && so.iremonoTarinai.length ? '（足りない印：' + esc(so.iremonoTarinai.join('・')) + '）' : '';
              obi('まだ新しい画面の番ではありません' + t + '。いつもの画面を使ってください。' + furuiGamen());
              kiroku.push({ fn: 'sbWatashimono', michi: 'iremono-off', ms: 0 });
              return MATSU;
            }
            so.app = pageUrl();
            if (!so.ver) { try { so.ver = APP_VER; } catch (e) {} }
            if (!Array.isArray(so.taskOrder) || !so.taskOrder.length) so.taskOrder = taskOrderOboe();
            links2 = so.links2 || null;
            if (so.naoseru === true && naoseru.indexOf(s.email) < 0) naoseru.push(s.email);
            return { url: CFG.sbUrl, anon: CFG.anon, token: s.token, me: s.email, soe: so };
          }, function (e) {
            if (e && (e.status === 403 || /在籍している人ではありません/.test(e.sbMsg || ''))) {
              obi('この画面は、名簿に入っている人だけが使えます（' + esc(s.email) + '）。' + furuiGamen(), '#FDE2E1');
              return MATSU;
            }
            obi('渡しもの（wb_watashimono）を読めませんでした：' + esc((e && e.message) || e) + furuiGamen(), '#FDE2E1', true);
            throw e;
          });
        });
      });
    },
    appUrl: function () { return Promise.resolve(pageUrl()); },


    calAikotoba: function () {
      return loginMade().then(function (s) {
        var b = new Uint8Array(36);
        crypto.getRandomValues(b);
        var a = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        return rpc(s, 'cal_aikotoba_dasu', { p_aikotoba: a }).then(function (r) { return r === true ? a : ''; },
                                                                   function () { return ''; });
      });
    },

    siteLinks: function () {
      return Promise.resolve(links2 ? JSON.parse(JSON.stringify(links2)) : { admin: false, meet: '', tobila: '', tobilaLinks: [], idleMin: 30, sheets: [] });
    },

    setTaskOrder: function (ids) {
      var list = (Array.isArray(ids) ? ids : []).map(function (x) { return String(x); }).filter(Boolean).slice(0, 200);
      try { localStorage.setItem('WB_TASK_ORDER', JSON.stringify(list)); } catch (e) {}
      return Promise.resolve(true);
    }
  };


  function furuiBun(fn) {
    return 'この操作（' + namaeOf(fn) + '）は、まだ新しい画面でできません。いつもの画面（古い URL）で操作してください。';
  }
  function furuiObi(fn, bun) {
    if (aru(SHIZUKA, fn)) return;
    obi(esc(bun || furuiBun(fn)).replace(/\n/g, '<br>') + furuiGamen(), '#FFF4D6', true);
  }
  var CHOKU_R = 'Supabase を直接読めませんでした（新しい画面には GAS の予備がありません）。少し待って、開き直してください。';
  var CHOKU_W = 'Supabase に直接書けませんでした（新しい画面には GAS の予備がありません）。もう一度押してください。'
    + '続くときは、いつもの画面（古い URL）で操作してください。';
  var R2_BUN = 'カレンダーを読む許可がまだありません。右下の枠のボタンを押してから、もう一度開いてください。';


  var NIJI_BUN = '日本時間の2時台は締めの時間なので、新しい画面では書けません。\n3時からもう一度押すか、古い画面（いつもの WorksBoard）から操作してください。';
  function nijiDai() { return new Date(Date.now() + 9 * 3600e3).getUTCHours() === 2; }


  function wbApi(fn, args, s0, nidome) {
    var t0 = Date.now();
    return (s0 ? Promise.resolve(s0) : loginMade()).then(function (s) {
      return fetch(CFG.wbApi, {
        method: 'POST',
        headers: { 'apikey': CFG.anon, 'Authorization': 'Bearer ' + s.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn: fn, args: args || [], ver: CFG.ver || '' })
      }).then(null, function () {

        throw new Error('つながりません（回線か、サーバが止まっています）');
      });
    }).then(function (res) {
      if (res.status === 401 && !nidome) {
        return AUTH.refresh().then(function (s2) { return wbApi(fn, args, s2, true); });
      }
      return res.json().then(null, function () { return null; }).then(function (j) {
        kiroku.push({ fn: fn, michi: 'wb-api', ms: Date.now() - t0, status: res.status, code: (j && j.code) || '' });

        if (res.status === 401) throw new Error('401 Unauthorized（ログインが切れました）');
        if (!j) throw new Error('サーバの返事が読めません（' + res.status + '）');
        if (j.ok) return j.r === undefined ? null : j.r;

        if (j.code === 'mada') { furuiObi(fn); throw new Error(furuiBun(fn)); }
        if (j.code === 'kirikae' || j.code === 'konzatsu') { furuiObi(fn, j.error); throw new Error(j.error || furuiBun(fn)); }
        throw new Error(j.error || ('失敗しました（' + res.status + '）'));
      });
    });
  }


  var ushiro = Promise.resolve();
  function narabu(job) {
    var p = ushiro.then(job, job);
    ushiro = p.then(function () {}, function () {});
    return p;
  }




  function r2Matsu(fn, args) {
    var t0 = Date.now();
    return new Promise(function (ok, ng) {
      (function miru() {
        var ari = false, f = null;
        try { ari = !!WBCAL.aru(); f = SBCHOKU[fn]; } catch (e) {}
        if (ari && f) {
          return f(args).then(function (r) { if (r === null || r === undefined) ng(new Error(R2_BUN)); else ok(r); },
                              function () { ng(new Error(R2_BUN)); });
        }
        if (Date.now() - t0 > R2_MATSU_MS) return ng(new Error(R2_BUN));
        setTimeout(miru, 250);
      })();
    });
  }


  function jsonNi(a) { return JSON.parse(JSON.stringify(a === undefined ? [] : a)); }

  function yobu(fn, args) {
    var t0 = Date.now();
    var owari = function (michi) { return function (r) { kiroku.push({ fn: fn, michi: michi, ms: Date.now() - t0 }); return r; }; };
    var dame = function (michi) { return function (e) { kiroku.push({ fn: fn, michi: michi, ms: Date.now() - t0, ng: true }); throw e; }; };
    if (MIRU) {

      if (fn === 'getPhotos') {
        return loginMade().then(function (s) {
          return hyo(s, '/rest/v1/member_photos?select=email,photo_url&order=email').then(function (a) {
            var out = {};
            (Array.isArray(a) ? a : []).forEach(function (x) {
              var e = String((x && x.email) || '').trim().toLowerCase(), u = String((x && x.photo_url) || '').trim();
              if (e && u) out[e] = u;
            });
            return out;
          });
        }).then(owari('miru-yomu'), dame('miru-yomu'));
      }
      if (fn === 'calAikotoba' || (!aru(LOCAL_NA, fn) && !Object.prototype.hasOwnProperty.call(YAMERU, fn))) {
        if (aru(R2_NA, fn)) { kiroku.push({ fn: fn, michi: 'miru-kotowari', ms: 0, ng: true }); return Promise.reject(new Error(MIRU_YOTEI)); }
        if (aru(CHOKU_NA, fn) && !aru(W1_NA, fn)) { kiroku.push({ fn: fn, michi: 'choku-yobi', ms: 0, ng: true }); return Promise.reject(new Error(CHOKU_R)); }
        kiroku.push({ fn: fn, michi: 'miru-kotowari', ms: 0, ng: true });
        if (!aru(SHIZUKA, fn) && fn !== 'calAikotoba') obi(esc(MIRU_BUN), '#FFF4D6', true);
        return Promise.reject(new Error(MIRU_BUN));
      }
    }
    if (Object.prototype.hasOwnProperty.call(LOCAL, fn) && aru(LOCAL_NA, fn)) {
      return LOCAL[fn].apply(null, args).then(owari('local'), dame('local'));
    }
    var y = Object.prototype.hasOwnProperty.call(YAMERU, fn) ? YAMERU[fn] : null;
    if (y) {
      kiroku.push({ fn: fn, michi: 'yameru', ms: 0 });
      return y.kotowaru ? Promise.reject(new Error(y.kotowaru)) : Promise.resolve(jsonNi(y.kaesu));
    }
    if (aru(WBAPI_NA, fn)) return narabu(function () { return wbApi(fn, args); });
    if (aru(R2_NA, fn)) return r2Matsu(fn, args).then(owari('choku-yobi'), dame('choku-yobi'));
    if (aru(CHOKU_NA, fn)) {
      kiroku.push({ fn: fn, michi: 'choku-yobi', ms: 0, ng: true });
      if (aru(W1_NA, fn)) {
        var bun = nijiDai() ? NIJI_BUN : CHOKU_W;
        obi(esc(bun).replace(/\n/g, '<br>') + furuiGamen(), '#FDE2E1', true);
        return Promise.reject(new Error(bun));
      }
      return Promise.reject(new Error(CHOKU_R));
    }
    if (aru(FURUI_NA, fn)) {
      kiroku.push({ fn: fn, michi: 'furui', ms: 0, ng: true });
      furuiObi(fn);
      return Promise.reject(new Error(furuiBun(fn)));
    }
    kiroku.push({ fn: fn, michi: 'shiranai', ms: 0, ng: true });
    return Promise.reject(new Error('この画面が知らない操作です（' + String(fn).slice(0, 40) + '）。いつもの画面で操作してください。'));
  }
  SHELL.yobu = yobu;


  function run(ok, ng) {
    return new Proxy({}, {
      get: function (_, na) {
        if (na === 'withSuccessHandler') return function (f) { return run(f, ng); };
        if (na === 'withFailureHandler') return function (f) { return run(ok, f); };
        if (na === 'withUserObject') return function () { return run(ok, ng); };
        if (typeof na !== 'string' || na === 'then') return undefined;
        return function () {
          var args;
          try { args = jsonNi(Array.prototype.slice.call(arguments)); }
          catch (e) { if (ng) setTimeout(function () { ng(new Error('送れない引数です：' + na)); }, 0); return; }
          yobu(na, args).then(function (r) { if (ok) ok(r); },
                              function (e) { if (ng) ng(e instanceof Error ? e : new Error(String(e))); });
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = {
    run: run(null, null),
    url: { getLocation: function (cb) {
      var o = { parameter: loc0.parameter, parameters: loc0.parameters, hash: loc0.hash };
      setTimeout(function () { cb(JSON.parse(JSON.stringify(o))); }, 0);
    } }
  };


  var mitaAt = 0;
  function hanWoMiru() {
    if (!CFG.ver || !window.fetch || Date.now() - mitaAt < 10 * 60 * 1000) return;
    mitaAt = Date.now();
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (v && v.ver && v.ver !== CFG.ver) {
        obi('新しい版があります。<a href="#" onclick="location.reload();return false">読み直す</a>', '#E6F4EA', true);
      }
    }, function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') hanWoMiru(); });
  SHELL.hajime = hajime;
})();
