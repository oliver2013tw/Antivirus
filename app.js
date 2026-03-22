'use strict';

/* ═══════════════════════════════════════════════════════════════════
   PROJECT SENTINEL — app.js v3.1
═══════════════════════════════════════════════════════════════════ */

/* ─── Utilities ─── */
function toast(msg, type) {
  var c = document.getElementById('toasts');
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'info');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s';
    setTimeout(function() { t.remove(); }, 320);
  }, 3000);
}

function fmtBytes(n) {
  if (!n) return '0 B';
  var u = ['B','KB','MB','GB','TB'];
  var i = Math.floor(Math.log(n) / Math.log(1024));
  return (n / Math.pow(1024, i)).toFixed(2) + ' ' + u[i];
}

function buf2hex(buf) {
  return Array.from(new Uint8Array(buf)).map(function(b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

function setStatus(txt) {
  var el = document.getElementById('status-text');
  if (el) el.textContent = txt;
}

function logNow() {
  return new Date().toLocaleTimeString('zh-Hant', { hour12: false });
}

function tick() {
  var el = document.getElementById('footer-clock');
  if (el) el.textContent = new Date().toLocaleString('zh-Hant', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}

/* ─── Fix main-content top margin to real header height ─── */
function fixLayout() {
  var hdr  = document.getElementById('site-header');
  var main = document.getElementById('main-content');
  var ftr  = document.getElementById('site-footer');
  if (hdr && main) {
    main.style.marginTop = hdr.offsetHeight + 'px';
  }
  if (ftr && main) {
    main.style.paddingBottom = (ftr.offsetHeight + 16) + 'px';
  }
}

/* ─── Navigation ─── */
function initNav() {
  var tabs    = document.querySelectorAll('.nav-tab');
  var modules = document.querySelectorAll('.module');
  var burger  = document.getElementById('nav-burger');
  var nav     = document.getElementById('main-nav');
  var overlay = document.getElementById('nav-mobile-overlay');
  var dot     = document.querySelector('.status-dot');
  if (dot) dot.classList.add('on');

  function closeNav() {
    if (burger) { burger.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
    if (nav)     nav.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }

  if (burger) {
    burger.addEventListener('click', function() {
      var open = nav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (overlay) overlay.classList.toggle('show', open);
    });
  }

  if (overlay) overlay.addEventListener('click', closeNav);

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.getAttribute('data-target');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      modules.forEach(function(m) {
        if (m.id === target) { m.classList.remove('hidden'); m.classList.add('active'); }
        else                 { m.classList.add('hidden');    m.classList.remove('active'); }
      });
      tab.classList.add('active');
      closeNav();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fixLayout();
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MD5 (pure JS)
═══════════════════════════════════════════════════════════════════ */
function md5(buffer) {
  var data  = new Uint8Array(buffer);
  var bits  = data.length * 8;
  var words = [];
  var i;
  for (i = 0; i < data.length; i++) words[i >>> 2] |= data[i] << (24 - (i % 4) * 8);
  words[data.length >> 2] |= 0x80 << (24 - (data.length % 4) * 8);
  words[(((data.length + 64) >> 9) << 4) + 14] = bits >>> 0;

  var a =  1732584193, b = -271733879, c = -1732584194, d = 271733878;
  var T = [];
  for (i = 0; i < 64; i++) T[i] = (Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)) | 0;

  function R(n, s) { return (n << s) | (n >>> (32 - s)); }
  function FF(a,b,c,d,x,s,t){ return R(a+((b&c)|(~b&d))+(x>>>0)+t,s)+b; }
  function GG(a,b,c,d,x,s,t){ return R(a+((b&d)|(c&~d))+(x>>>0)+t,s)+b; }
  function HH(a,b,c,d,x,s,t){ return R(a+(b^c^d)+(x>>>0)+t,s)+b; }
  function II(a,b,c,d,x,s,t){ return R(a+(c^(b|~d))+(x>>>0)+t,s)+b; }

  for (i = 0; i < words.length; i += 16) {
    var M = function(j) {
      var v = words[i + j] || 0;
      return ((v >>> 24) & 0xff) | ((v >>> 8) & 0xff00) | ((v & 0xff00) << 8) | ((v & 0xff) << 24);
    };
    var aa=a, bb=b, cc=c, dd=d;
    a=FF(a,b,c,d,M(0), 7,T[0]);  d=FF(d,a,b,c,M(1),12,T[1]);  c=FF(c,d,a,b,M(2),17,T[2]);  b=FF(b,c,d,a,M(3),22,T[3]);
    a=FF(a,b,c,d,M(4), 7,T[4]);  d=FF(d,a,b,c,M(5),12,T[5]);  c=FF(c,d,a,b,M(6),17,T[6]);  b=FF(b,c,d,a,M(7),22,T[7]);
    a=FF(a,b,c,d,M(8), 7,T[8]);  d=FF(d,a,b,c,M(9),12,T[9]);  c=FF(c,d,a,b,M(10),17,T[10]);b=FF(b,c,d,a,M(11),22,T[11]);
    a=FF(a,b,c,d,M(12),7,T[12]); d=FF(d,a,b,c,M(13),12,T[13]);c=FF(c,d,a,b,M(14),17,T[14]);b=FF(b,c,d,a,M(15),22,T[15]);
    a=GG(a,b,c,d,M(1), 5,T[16]); d=GG(d,a,b,c,M(6), 9,T[17]); c=GG(c,d,a,b,M(11),14,T[18]);b=GG(b,c,d,a,M(0),20,T[19]);
    a=GG(a,b,c,d,M(5), 5,T[20]); d=GG(d,a,b,c,M(10),9,T[21]); c=GG(c,d,a,b,M(15),14,T[22]);b=GG(b,c,d,a,M(4),20,T[23]);
    a=GG(a,b,c,d,M(9), 5,T[24]); d=GG(d,a,b,c,M(14),9,T[25]); c=GG(c,d,a,b,M(3),14,T[26]); b=GG(b,c,d,a,M(8),20,T[27]);
    a=GG(a,b,c,d,M(13),5,T[28]); d=GG(d,a,b,c,M(2), 9,T[29]); c=GG(c,d,a,b,M(7),14,T[30]); b=GG(b,c,d,a,M(12),20,T[31]);
    a=HH(a,b,c,d,M(5), 4,T[32]); d=HH(d,a,b,c,M(8),11,T[33]); c=HH(c,d,a,b,M(11),16,T[34]);b=HH(b,c,d,a,M(14),23,T[35]);
    a=HH(a,b,c,d,M(1), 4,T[36]); d=HH(d,a,b,c,M(4),11,T[37]); c=HH(c,d,a,b,M(7),16,T[38]); b=HH(b,c,d,a,M(10),23,T[39]);
    a=HH(a,b,c,d,M(13),4,T[40]); d=HH(d,a,b,c,M(0),11,T[41]); c=HH(c,d,a,b,M(3),16,T[42]); b=HH(b,c,d,a,M(6),23,T[43]);
    a=HH(a,b,c,d,M(9), 4,T[44]); d=HH(d,a,b,c,M(12),11,T[45]);c=HH(c,d,a,b,M(15),16,T[46]);b=HH(b,c,d,a,M(2),23,T[47]);
    a=II(a,b,c,d,M(0), 6,T[48]); d=II(d,a,b,c,M(7),10,T[49]); c=II(c,d,a,b,M(14),15,T[50]);b=II(b,c,d,a,M(5),21,T[51]);
    a=II(a,b,c,d,M(12),6,T[52]); d=II(d,a,b,c,M(3),10,T[53]); c=II(c,d,a,b,M(10),15,T[54]);b=II(b,c,d,a,M(1),21,T[55]);
    a=II(a,b,c,d,M(8), 6,T[56]); d=II(d,a,b,c,M(15),10,T[57]);c=II(c,d,a,b,M(6),15,T[58]); b=II(b,c,d,a,M(13),21,T[59]);
    a=II(a,b,c,d,M(4), 6,T[60]); d=II(d,a,b,c,M(11),10,T[61]);c=II(c,d,a,b,M(2),15,T[62]); b=II(b,c,d,a,M(9),21,T[63]);
    a=(a+aa)|0; b=(b+bb)|0; c=(c+cc)|0; d=(d+dd)|0;
  }
  function le(n) {
    var u = n >>> 0;
    return [u&0xff,(u>>8)&0xff,(u>>16)&0xff,(u>>24)&0xff].map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
  }
  return le(a)+le(b)+le(c)+le(d);
}

async function sha(buffer, algo) {
  return buf2hex(await crypto.subtle.digest(algo, buffer));
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_01 — Threat Scanner (File + URL)
═══════════════════════════════════════════════════════════════════ */

var FILE_SIGS = [
  { name:'EICAR 測試病毒',              bytes:[0x58,0x35,0x4F,0x21,0x50,0x25,0x40,0x41,0x50,0x5B,0x34,0x5C,0x50,0x5A,0x58,0x35,0x34,0x28,0x50,0x5E,0x29,0x37,0x43,0x43,0x29,0x37,0x7D,0x24,0x45,0x49,0x43,0x41,0x52], off:0,    w:100, lv:'crit' },
  { name:'Metasploit NOP Sled',          bytes:[0x90,0x90,0x90,0x90,0xcc],           off:null, w:40,  lv:'crit' },
  { name:'PowerShell -encodedCommand',   bytes:[0x2D,0x65,0x6E,0x63,0x6F,0x64,0x65,0x64,0x43,0x6F,0x6D,0x6D,0x61,0x6E,0x64], off:null, w:45, lv:'crit' },
  { name:'VBScript WScript.Shell',       bytes:[0x57,0x53,0x63,0x72,0x69,0x70,0x74,0x2E,0x53,0x68,0x65,0x6C,0x6C], off:null, w:42, lv:'crit' },
  { name:'Mimikatz sekurlsa',            bytes:[0x73,0x65,0x6B,0x75,0x72,0x6C,0x73,0x61], off:null, w:55, lv:'crit' },
  { name:'AutoRun [autorun]',            bytes:[0x5B,0x61,0x75,0x74,0x6F,0x72,0x75,0x6E,0x5D], off:null, w:30, lv:'warn' },
  { name:'Windows PE (MZ Header)',       bytes:[0x4D,0x5A],                          off:0,    w:5,   lv:'info' },
  { name:'ELF 執行檔',                   bytes:[0x7F,0x45,0x4C,0x46],               off:0,    w:4,   lv:'info' },
  { name:'PDF 文件',                     bytes:[0x25,0x50,0x44,0x46],               off:0,    w:2,   lv:'info' },
  { name:'ZIP / OOXML',                  bytes:[0x50,0x4B,0x03,0x04],               off:0,    w:2,   lv:'info' },
];

var STR_RULES = [
  { re:/cmd\.exe/i,                              name:'CMD.EXE 呼叫',              lv:'crit', w:25 },
  { re:/powershell\s*-/i,                        name:'PowerShell 命令列',          lv:'crit', w:30 },
  { re:/WScript\.Shell/i,                        name:'WScript Shell 物件',         lv:'crit', w:32 },
  { re:/ActiveXObject/i,                         name:'ActiveX 物件建立',           lv:'crit', w:28 },
  { re:/URLDownloadToFile/i,                     name:'遠端檔案下載 API',           lv:'crit', w:38 },
  { re:/VirtualAlloc/i,                          name:'記憶體動態分配 API',         lv:'crit', w:35 },
  { re:/WriteProcessMemory/i,                    name:'跨程序記憶體寫入',           lv:'crit', w:40 },
  { re:/CreateRemoteThread/i,                    name:'遠端執行緒建立',             lv:'crit', w:42 },
  { re:/NtUnmapViewOfSection/i,                  name:'Process Hollowing 特徵',     lv:'crit', w:45 },
  { re:/SetWindowsHookEx/i,                      name:'鍵盤 Hook (鍵盤記錄)',       lv:'crit', w:40 },
  { re:/HKEY_LOCAL_MACHINE.*Run/i,               name:'自啟動登錄機碼',             lv:'crit', w:35 },
  { re:/IsDebuggerPresent/i,                     name:'反除錯偵測',                 lv:'warn', w:25 },
  { re:/eval\s*\(/i,                             name:'eval() 動態執行',            lv:'warn', w:22 },
  { re:/\.onion/i,                               name:'Tor 洋蔥域名',               lv:'crit', w:32 },
  { re:/your files.*encrypt|files have been encrypted/i, name:'勒索軟體訊息',       lv:'crit', w:55 },
  { re:/bitcoin|monero|btc.*wallet/i,            name:'加密貨幣勒索字串',           lv:'warn', w:18 },
  { re:/[A-Za-z0-9+\/]{100,}={0,2}/,            name:'超長 Base64 字串',           lv:'info', w:12 },
];

var URL_RULES = [
  { name:'IP 位址直連',             test:function(u){ return /^https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(u); },                         w:25, lv:'warn' },
  { name:'可疑高風險 TLD',           test:function(u){ return /\.(xyz|top|click|loan|work|live|cc|tk|ml|ga|cf|gq|icu|buzz|monster)(\?|\/|$)/i.test(u); }, w:22, lv:'warn' },
  { name:'路徑遍歷 (../)',           test:function(u){ return u.indexOf('../') !== -1 || u.indexOf('..%2F') !== -1; },                  w:38, lv:'crit' },
  { name:'SQL 注入特徵',             test:function(u){ return /union.*select|select.*from|drop.*table/i.test(u); },                    w:42, lv:'crit' },
  { name:'XSS 特徵',                test:function(u){ try{ return /<script|javascript:|onerror\s*=/i.test(decodeURIComponent(u)); }catch(e){ return false; } }, w:40, lv:'crit' },
  { name:'純 HTTP 未加密',           test:function(u){ return u.indexOf('http://') === 0; },                                           w:15, lv:'warn' },
  { name:'Data URI 嵌入',            test:function(u){ return /data:.*base64/i.test(u); },                                             w:32, lv:'crit' },
  { name:'@ 符號釣魚混淆',           test:function(u){ try{ return new URL(u).username.length > 0; }catch(e){ return false; } },       w:40, lv:'crit' },
  { name:'可執行副檔名',             test:function(u){ return /\.(exe|bat|cmd|scr|vbs|ps1|sh|msi|hta|jar|apk)(\?|#|$)/i.test(u); },  w:32, lv:'crit' },
  { name:'子域名過深 (>5)',          test:function(u){ try{ return new URL(u).hostname.split('.').length > 5; }catch(e){ return false; } }, w:18, lv:'warn' },
  { name:'非標準 Port',              test:function(u){ try{ var p=new URL(u).port; return p && p!=='80' && p!=='443'; }catch(e){ return false; } }, w:20, lv:'warn' },
  { name:'超長 URL (>200字元)',      test:function(u){ return u.length > 200; },                                                        w:10, lv:'info' },
];

/* ─── Platform definitions ─── */
function filePlatforms(sha256, md5h) {
  return [
    { id:'vt',     name:'VirusTotal',        desc:'70+ 防毒引擎',
      run: function() { return Promise.resolve({ st:'redirect', detail:'點擊查詢此 SHA-256 雜湊值（不上傳檔案本體）', href:'https://www.virustotal.com/gui/file/'+sha256, label:'VirusTotal →' }); }
    },
    { id:'bazaar', name:'MalwareBazaar',     desc:'Abuse.ch 惡意樣本庫',
      run: function() {
        return fetch('https://mb-api.abuse.ch/api/v1/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:'query=get_info&hash='+sha256 })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            if (d.query_status === 'hash_not_found') return { st:'clean', detail:'MalwareBazaar 查無此樣本' };
            if (d.query_status === 'ok' && d.data && d.data[0]) {
              var s = d.data[0];
              return { st:'danger', detail:'類型：'+(s.file_type||'—')+'　標籤：'+((s.tags||[]).join(', ')||'—'), href:'https://bazaar.abuse.ch/sample/'+sha256+'/', label:'Bazaar 報告 →' };
            }
            return { st:'error', detail:'狀態：'+d.query_status };
          });
      }
    },
    { id:'tfox',   name:'ThreatFox',         desc:'Abuse.ch IOC 情報庫',
      run: function() {
        return fetch('https://threatfox-api.abuse.ch/api/v1/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query:'search_ioc', search_term: sha256 }) })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            if (d.query_status === 'no_result') return { st:'clean', detail:'ThreatFox 無此 IOC 記錄' };
            if (d.query_status === 'ok' && d.data && d.data.length) {
              var ioc = d.data[0];
              return { st:'danger', detail:'威脅：'+(ioc.malware_printable||'—')+'　信心：'+(ioc.confidence_level||'—')+'%', href:'https://threatfox.abuse.ch/ioc/'+ioc.id+'/', label:'ThreatFox 報告 →' };
            }
            return { st:'error', detail:'狀態：'+d.query_status };
          });
      }
    },
    { id:'circl',  name:'CIRCL Hash Lookup', desc:'盧森堡 CERT 雜湊查詢',
      run: function() {
        return fetch('https://hashlookup.circl.lu/lookup/sha256/'+sha256, { headers:{'Accept':'application/json'} })
          .then(function(r) {
            if (r.status === 404) return { st:'clean', detail:'CIRCL 無此雜湊記錄（可能為未知或乾淨檔案）' };
            if (!r.ok) throw new Error('HTTP '+r.status);
            return r.json().then(function(d) {
              return d['KnownMalicious']
                ? { st:'danger', detail:'已知惡意：'+d['KnownMalicious']+'　檔名：'+(d['FileName']||'—'), href:'https://hashlookup.circl.lu/lookup/sha256/'+sha256, label:'CIRCL 詳細 →' }
                : { st:'clean',  detail:'已知乾淨：'+(d['FileName']||d['ProductName']||'—') };
            });
          });
      }
    },
    { id:'otx',    name:'AlienVault OTX',    desc:'開放威脅情報交換',
      run: function() { return Promise.resolve({ st:'redirect', detail:'查詢 OTX 此雜湊值的威脅情報', href:'https://otx.alienvault.com/indicator/file/'+sha256, label:'OTX →' }); }
    },
    { id:'hybrid', name:'Hybrid Analysis',   desc:'Falcon Sandbox 動態分析',
      run: function() { return Promise.resolve({ st:'redirect', detail:'查詢 Hybrid Analysis 動態沙箱報告', href:'https://www.hybrid-analysis.com/search?query='+sha256, label:'Hybrid Analysis →' }); }
    },
  ];
}

function urlPlatforms(url) {
  var host = '';
  try { host = new URL(url).hostname; } catch(e) { host = url; }
  var enc = encodeURIComponent;
  return [
    { id:'urlhaus', name:'URLhaus',              desc:'Abuse.ch 惡意 URL 庫',
      run: function() {
        return fetch('https://urlhaus-api.abuse.ch/v1/url/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:'url='+enc(url) })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            if (d.query_status === 'no_results') return { st:'clean', detail:'URLhaus 無惡意記錄' };
            if (d.url_status === 'online' || d.url_status === 'unknown') {
              return { st:'danger', detail:'狀態：'+d.url_status+'　威脅：'+((d.tags||[]).join(', ')||'未分類'), href:'https://urlhaus.abuse.ch/url/'+d.id+'/', label:'URLhaus 報告 →' };
            }
            return { st:'warn', detail:'狀態：'+(d.query_status||d.url_status||'未知') };
          });
      }
    },
    { id:'tfox-u',  name:'ThreatFox URL',        desc:'Abuse.ch IOC URL 情報',
      run: function() {
        return fetch('https://threatfox-api.abuse.ch/api/v1/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query:'search_ioc', search_term: host }) })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            if (d.query_status === 'no_result') return { st:'clean', detail:'ThreatFox 無此域名記錄' };
            if (d.query_status === 'ok' && d.data && d.data.length) {
              var ioc = d.data[0];
              return { st:'danger', detail:'威脅：'+(ioc.malware_printable||'—')+'　信心：'+(ioc.confidence_level||'—')+'%', href:'https://threatfox.abuse.ch/ioc/'+ioc.id+'/', label:'ThreatFox 報告 →' };
            }
            return { st:'error', detail:'狀態：'+d.query_status };
          });
      }
    },
    { id:'gsb',    name:'Google Safe Browsing',  desc:'Google 安全瀏覽報告',
      run: function() { return Promise.resolve({ st:'redirect', detail:'前往 Google 透明度報告查詢', href:'https://transparencyreport.google.com/safe-browsing/search?url='+enc(url), label:'Google 查詢 →' }); }
    },
    { id:'vt-u',   name:'VirusTotal URL',         desc:'70+ 引擎掃描此 URL',
      run: function() { return Promise.resolve({ st:'redirect', detail:'點擊在 VirusTotal 掃描此 URL', href:'https://www.virustotal.com/gui/url/'+btoa(url).replace(/=/g,''), label:'VirusTotal →' }); }
    },
    { id:'otx-d',  name:'AlienVault OTX',         desc:'OTX 域名威脅情報',
      run: function() { return Promise.resolve({ st:'redirect', detail:'查詢 OTX 對此域名的威脅報告', href:'https://otx.alienvault.com/indicator/domain/'+host, label:'OTX →' }); }
    },
    { id:'sucuri', name:'Sucuri SiteCheck',        desc:'網站安全與黑名單狀態',
      run: function() { return Promise.resolve({ st:'redirect', detail:'查詢 Sucuri 安全掃描狀態', href:'https://sitecheck.sucuri.net/results/'+enc(host), label:'Sucuri →' }); }
    },
  ];
}

function renderPlatforms(platforms) {
  var grid = document.getElementById('platform-grid');
  grid.innerHTML = platforms.map(function(p) {
    return '<div class="p-card pc-loading" id="pc-'+p.id+'">'
      + '<div class="p-header"><span class="p-name">'+p.name+'</span>'
      + '<span class="p-badge pb-load"><span class="spin">◌</span> 查詢中</span></div>'
      + '<div class="p-detail">'+p.desc+'</div></div>';
  }).join('');

  platforms.forEach(function(p) {
    p.run().then(function(r) {
      updatePCard(p.id, p.name, r);
    }).catch(function(err) {
      updatePCard(p.id, p.name, { st:'error', detail: err.message + '（可能受 CORS 限制）' });
    });
  });
}

function updatePCard(id, name, r) {
  var card = document.getElementById('pc-'+id);
  if (!card) return;
  var map = {
    clean:   { cc:'pc-clean',   bc:'pb-clean',  bl:'✓ 未發現威脅' },
    danger:  { cc:'pc-danger',  bc:'pb-danger', bl:'☣ 發現威脅' },
    warn:    { cc:'pc-warn',    bc:'pb-warn',   bl:'⚠ 可疑' },
    redirect:{ cc:'pc-loading', bc:'pb-load',   bl:'ℹ 查詢驗證' },
    error:   { cc:'pc-error',   bc:'pb-error',  bl:'— 失敗' },
  };
  var s = map[r.st] || map.error;
  var link = r.href ? '<a class="p-link" href="'+r.href+'" target="_blank" rel="noopener">'+(r.label||'查看 →')+'</a>' : '';
  card.className = 'p-card '+s.cc;
  card.innerHTML = '<div class="p-header"><span class="p-name">'+name+'</span>'
    + '<span class="p-badge '+s.bc+'">'+s.bl+'</span></div>'
    + '<div class="p-detail">'+(r.detail||'')+'</div>'
    + link;
}

/* ─── Log helper ─── */
var scanLogs = [];
function addLog(tag, msg, hi) {
  scanLogs.push({ t: logNow(), tag: tag, msg: msg, hi: !!hi });
  var el = document.getElementById('scan-log');
  if (!el) return;
  var tc = { OK:'log-ok', WARN:'log-warn', CRIT:'log-crit', INFO:'log-info' }[tag] || 'log-info';
  el.innerHTML = scanLogs.map(function(l) {
    return '<div class="log-row"><span class="log-t">'+l.t+'</span>'
      + '<span class="'+({ OK:'log-ok', WARN:'log-warn', CRIT:'log-crit', INFO:'log-info' }[l.tag]||'log-info')+'">['
      + l.tag.padEnd(4) + ']</span><span class="'+(l.hi?'log-mh':'log-m')+'">'+l.msg+'</span></div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}

/* ─── Verdict ─── */
function setVerdict(score) {
  var banner = document.getElementById('verdict-banner');
  var icon   = document.getElementById('verdict-icon');
  var title  = document.getElementById('verdict-title');
  var sub    = document.getElementById('verdict-sub');
  var sc     = document.getElementById('verdict-score');
  if (!banner) return;
  banner.className = 'verdict ' + (score >= 60 ? 'verdict-danger' : score >= 25 ? 'verdict-suspect' : 'verdict-clean');
  sc.textContent = score;
  if (score >= 60) {
    icon.textContent  = '☣';
    title.textContent = '⚠ 高威脅風險';
    sub.textContent   = '偵測到強烈可疑特徵，建議立即隔離並透過多平台交叉驗證。';
  } else if (score >= 25) {
    icon.textContent  = '⚠';
    title.textContent = '可疑 — 需進一步驗證';
    sub.textContent   = '發現部分可疑特徵，建議透過下方多平台工具交叉確認。';
  } else {
    icon.textContent  = '✓';
    title.textContent = '未發現已知威脅';
    sub.textContent   = '靜態掃描未命中已知惡意特徵，建議仍搭配多平台雲端驗證。';
  }
}

/* ─── Static scan ─── */
function entropy(bytes) {
  var f = new Array(256).fill(0);
  for (var i = 0; i < bytes.length; i++) f[bytes[i]]++;
  var e = 0;
  for (var j = 0; j < 256; j++) {
    if (f[j]) { var p = f[j] / bytes.length; e -= p * Math.log2(p); }
  }
  return e;
}

function sigScan(bytes) {
  var hits = [];
  var score = 0;
  FILE_SIGS.forEach(function(sig) {
    var found = false;
    if (sig.off !== null) {
      if (bytes.length >= sig.off + sig.bytes.length) {
        found = sig.bytes.every(function(b, i) { return bytes[sig.off + i] === b; });
      }
    } else {
      var lim = Math.min(bytes.length - sig.bytes.length, 512 * 1024);
      outer: for (var i = 0; i <= lim; i++) {
        for (var j = 0; j < sig.bytes.length; j++) {
          if (bytes[i + j] !== sig.bytes[j]) continue outer;
        }
        found = true; break;
      }
    }
    if (found) { hits.push(sig); score += sig.w; addLog(sig.lv==='crit'?'CRIT':sig.lv==='warn'?'WARN':'INFO', '特徵碼命中：'+sig.name); }
  });

  var el = document.getElementById('sig-list');
  if (!el) return Math.min(score, 85);
  if (!hits.length) {
    el.innerHTML = '<div class="sig-item lv-pass"><span class="si-icon" style="color:var(--low)">✓</span><div class="si-content"><div class="si-name">無已知特徵碼命中</div><div class="si-desc">已掃描 '+FILE_SIGS.length+' 條規則</div></div></div>';
  } else {
    el.innerHTML = hits.map(function(h) {
      return '<div class="sig-item lv-'+h.lv+'"><span class="si-icon">'+(h.lv==='crit'?'☣':h.lv==='warn'?'⚠':'ℹ')+'</span><div class="si-content"><div class="si-name">'+h.name+'</div><div class="si-desc">權重 +'+h.w+'</div></div></div>';
    }).join('');
  }
  return Math.min(score, 85);
}

function strScan(bytes) {
  var text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 512 * 1024));
  var hits = [];
  var score = 0;
  STR_RULES.forEach(function(r) {
    if (r.re.test(text)) { hits.push(r); score += r.w; addLog(r.lv==='crit'?'CRIT':r.lv==='warn'?'WARN':'INFO', '可疑字串：'+r.name); }
  });

  var el = document.getElementById('str-list');
  if (!el) return Math.min(score, 75);
  if (!hits.length) {
    el.innerHTML = '<div class="sig-item lv-pass"><span class="si-icon" style="color:var(--low)">✓</span><div class="si-content"><div class="si-name">無可疑字串</div><div class="si-desc">已掃描 '+STR_RULES.length+' 條規則</div></div></div>';
  } else {
    el.innerHTML = hits.map(function(h) {
      return '<div class="sig-item lv-'+h.lv+'"><span class="si-icon">'+(h.lv==='crit'?'☣':h.lv==='warn'?'⚠':'ℹ')+'</span><div class="si-content"><div class="si-name">'+h.name+'</div><div class="si-desc">權重 +'+h.w+'</div></div></div>';
    }).join('');
  }
  return Math.min(score, 75);
}

/* ─── File scan ─── */
async function scanFile(file) {
  scanLogs = [];
  document.getElementById('malware-results').classList.remove('hidden');
  setStatus('靜態掃描中...');
  addLog('INFO', '目標：'+file.name+'  ('+fmtBytes(file.size)+')');

  var buffer = await file.arrayBuffer();
  var bytes  = new Uint8Array(buffer);
  var sha256 = await sha(buffer, 'SHA-256');
  var sha1   = await sha(buffer, 'SHA-1');
  var md5h   = md5(buffer);

  addLog('INFO', 'SHA-256：'+sha256);
  addLog('INFO', 'MD5    ：'+md5h);

  var ext   = file.name.split('.').pop().toLowerCase();
  var isPE  = bytes[0]===0x4D && bytes[1]===0x5A;
  var isELF = bytes[0]===0x7F && bytes[1]===0x45;
  var isPDF = bytes[0]===0x25 && bytes[1]===0x50;
  var ftype = isPE?'Windows PE 可執行檔':isELF?'ELF (Linux)':isPDF?'PDF':'未知格式';
  var ent   = entropy(bytes.slice(0, Math.min(bytes.length, 8192)));

  var structRows = [
    ['掃描模式', '檔案靜態分析'],
    ['檔案名稱', file.name],
    ['大小',     fmtBytes(file.size)],
    ['副檔名',   '.'+ext],
    ['格式',     ftype],
    ['熵值',     ent.toFixed(4)+'/8.0'+(ent>7?' ⚠ 高熵 (加密/混淆)':'')],
    ['SHA-256',  sha256.slice(0,24)+'…'],
  ];
  var tbody = document.getElementById('malware-struct-tbody');
  tbody.innerHTML = structRows.map(function(r) {
    return '<tr><td class="dk">'+r[0]+'</td><td class="dv" style="color:'+(r[0]==='熵值'&&ent>7?'var(--med)':'var(--t1)')+'">'+r[1]+'</td></tr>';
  }).join('');

  addLog('OK', '檔案結構解析完成');
  if (ent > 7) addLog('WARN', '高熵值 '+ent.toFixed(4)+'，疑似加密/混淆');

  var s1 = sigScan(bytes);
  var s2 = strScan(bytes);
  var total = Math.min(100, s1 + s2);

  setVerdict(total);
  addLog(total>=60?'CRIT':total>=25?'WARN':'OK', '掃描完成 — 威脅分數 '+total+'/100', true);

  renderPlatforms(filePlatforms(sha256, md5h));
  setStatus(total>=60?'⚠ 偵測到威脅':'掃描完成 ('+total+')');
  toast(total>=60?'⚠ 高威脅 — 分數 '+total:'掃描完成 ('+total+')', total>=60?'err':total>=25?'info':'ok');
}

/* ─── URL scan ─── */
function scanURL(raw) {
  scanLogs = [];
  document.getElementById('malware-results').classList.remove('hidden');
  setStatus('URL 分析中...');

  var url = raw.indexOf('http') === 0 ? raw : 'https://'+raw;
  addLog('INFO', '目標 URL：'+url);

  var parsed = null;
  try { parsed = new URL(url); } catch(e) { addLog('CRIT','URL 格式無效'); return; }

  var structRows = [
    ['掃描模式', 'URL 靜態分析'],
    ['協議',     parsed.protocol],
    ['主機名稱', parsed.hostname],
    ['Port',     parsed.port || (parsed.protocol==='https:'?'443':'80')],
    ['路徑',     parsed.pathname || '/'],
    ['查詢參數', parsed.search || '—'],
    ['Fragment', parsed.hash || '—'],
    ['總長度',   url.length+' 字元'],
  ];
  var tbody = document.getElementById('malware-struct-tbody');
  tbody.innerHTML = structRows.map(function(r) {
    return '<tr><td class="dk">'+r[0]+'</td><td class="dv" style="color:var(--tc)">'+r[1]+'</td></tr>';
  }).join('');
  addLog('OK', 'URL 結構解析完成');

  var hits  = URL_RULES.filter(function(r) { return r.test(url); });
  var score = Math.min(100, hits.reduce(function(s,r){ return s+r.w; }, 0));

  var critHits = hits.filter(function(h){ return h.lv==='crit'; });
  var otherHits = hits.filter(function(h){ return h.lv!=='crit'; });

  var sigEl = document.getElementById('sig-list');
  var strEl = document.getElementById('str-list');

  sigEl.innerHTML = critHits.length === 0
    ? '<div class="sig-item lv-pass"><span class="si-icon" style="color:var(--low)">✓</span><div class="si-content"><div class="si-name">無高危 URL 特徵</div></div></div>'
    : critHits.map(function(h){ return '<div class="sig-item lv-crit"><span class="si-icon">☣</span><div class="si-content"><div class="si-name">'+h.name+'</div><div class="si-desc">權重 +'+h.w+'</div></div></div>'; }).join('');

  strEl.innerHTML = otherHits.length === 0
    ? '<div class="sig-item lv-pass"><span class="si-icon" style="color:var(--low)">✓</span><div class="si-content"><div class="si-name">無中低風險特徵</div></div></div>'
    : otherHits.map(function(h){ return '<div class="sig-item lv-'+h.lv+'"><span class="si-icon">'+(h.lv==='warn'?'⚠':'ℹ')+'</span><div class="si-content"><div class="si-name">'+h.name+'</div><div class="si-desc">權重 +'+h.w+'</div></div></div>'; }).join('');

  hits.forEach(function(h) { addLog(h.lv==='crit'?'CRIT':h.lv==='warn'?'WARN':'INFO', '風險：'+h.name); });

  setVerdict(score);
  addLog(score>=50?'CRIT':score>=20?'WARN':'OK', 'URL 分析完成 — 風險分數 '+score+'/100', true);

  renderPlatforms(urlPlatforms(url));
  setStatus(score>=50?'⚠ 高風險 URL':'URL 分析完成 ('+score+')');
  toast(score>=50?'⚠ 高風險 URL — '+score+'分':'URL 分析完成 ('+score+')', score>=50?'err':score>=20?'info':'ok');
}

/* ─── Init MOD_01 ─── */
function initMalware() {
  var dropZone   = document.getElementById('malware-drop-zone');
  var fileInput  = document.getElementById('malware-file-input');
  var modFile    = document.getElementById('mode-file');
  var modURL     = document.getElementById('mode-url');
  var panelFile  = document.getElementById('panel-file');
  var panelURL   = document.getElementById('panel-url');
  var urlInput   = document.getElementById('malware-url-input');
  var urlBtn     = document.getElementById('malware-url-btn');

  modFile.addEventListener('click', function() {
    modFile.classList.add('active'); modURL.classList.remove('active');
    modFile.setAttribute('aria-selected','true'); modURL.setAttribute('aria-selected','false');
    panelFile.classList.remove('hidden'); panelURL.classList.add('hidden');
  });
  modURL.addEventListener('click', function() {
    modURL.classList.add('active'); modFile.classList.remove('active');
    modURL.setAttribute('aria-selected','true'); modFile.setAttribute('aria-selected','false');
    panelURL.classList.remove('hidden'); panelFile.classList.add('hidden');
  });

  dropZone.addEventListener('click', function() { fileInput.click(); });
  dropZone.addEventListener('keydown', function(e) { if (e.key==='Enter'||e.key===' ') fileInput.click(); });
  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('over'); });
  dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('over'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault(); dropZone.classList.remove('over');
    if (e.dataTransfer.files[0]) scanFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function() {
    if (fileInput.files[0]) scanFile(fileInput.files[0]);
  });

  urlBtn.addEventListener('click', function() {
    var v = urlInput.value.trim();
    if (!v) { toast('請輸入 URL','err'); return; }
    scanURL(v);
  });
  urlInput.addEventListener('keydown', function(e) { if (e.key==='Enter') urlBtn.click(); });
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_02 — Hash Analyzer
═══════════════════════════════════════════════════════════════════ */
function initHash() {
  var drop  = document.getElementById('hash-drop-zone');
  var input = document.getElementById('hash-file-input');

  drop.addEventListener('click', function() { input.click(); });
  drop.addEventListener('keydown', function(e) { if (e.key==='Enter'||e.key===' ') input.click(); });
  drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', function() { drop.classList.remove('over'); });
  drop.addEventListener('drop', function(e) {
    e.preventDefault(); drop.classList.remove('over');
    if (e.dataTransfer.files[0]) doHash(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', function() { if (input.files[0]) doHash(input.files[0]); });

  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id   = btn.getAttribute('data-id');
      var cell = document.getElementById(id);
      var tx   = cell && cell.querySelector('.htext');
      if (!tx || tx.textContent === '—') return;
      navigator.clipboard.writeText(tx.textContent).then(function() {
        btn.textContent = '✓'; btn.classList.add('ok');
        setTimeout(function() { btn.textContent = '⎘'; btn.classList.remove('ok'); }, 1500);
      });
    });
  });
}

async function doHash(file) {
  var results  = document.getElementById('hash-results');
  var comp     = document.getElementById('hash-computing');
  var htable   = document.getElementById('hash-table');

  results.classList.remove('hidden');
  comp.classList.remove('hidden');
  htable.classList.add('hidden');

  document.getElementById('fi-name').textContent  = file.name;
  document.getElementById('fi-size').textContent  = fmtBytes(file.size);
  document.getElementById('fi-mime').textContent  = file.type || '未知';
  document.getElementById('fi-mtime').textContent = new Date(file.lastModified).toLocaleString('zh-Hant');

  setStatus('計算雜湊中...');
  var buf  = await file.arrayBuffer();
  var s256 = await sha(buf, 'SHA-256');
  var s1   = await sha(buf, 'SHA-1');
  var m5   = md5(buf);

  comp.classList.add('hidden');
  htable.classList.remove('hidden');

  document.getElementById('h-md5').querySelector('.htext').textContent    = m5;
  document.getElementById('h-sha1').querySelector('.htext').textContent   = s1;
  document.getElementById('h-sha256').querySelector('.htext').textContent = s256;

  renderHex(buf);
  setStatus('分析完成');
  toast('「'+file.name+'」分析完成', 'ok');
}

function renderHex(buffer) {
  var out   = document.getElementById('hex-out');
  var bytes = new Uint8Array(buffer.slice(0, 2048));
  var lines = [];
  for (var i = 0; i < bytes.length; i += 16) {
    var chunk = bytes.slice(i, i + 16);
    var off   = i.toString(16).padStart(8, '0').toUpperCase();
    var hexP  = Array.from(chunk).map(function(b) {
      return '<span class="'+(b===0?'hn':'hb')+'">'+b.toString(16).padStart(2,'0').toUpperCase()+'</span>';
    });
    while (hexP.length < 16) hexP.push('<span class="hn">  </span>');
    var hexS  = hexP.slice(0,8).join(' ')+'  '+hexP.slice(8).join(' ');
    var ascS  = Array.from(chunk).map(function(b) {
      var ch = (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b).replace(/&/g,'&amp;').replace(/</g,'&lt;') : '.';
      return '<span class="ha">'+ch+'</span>';
    }).join('');
    lines.push('<span class="ho">'+off+'</span>  '+hexS+'  '+ascS);
  }
  out.innerHTML = lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_03 — URL Check
═══════════════════════════════════════════════════════════════════ */
function initURLCheck() {
  var btn   = document.getElementById('urlcheck-btn');
  var input = document.getElementById('urlcheck-input');
  btn.addEventListener('click', doURLCheck);
  input.addEventListener('keydown', function(e) { if (e.key==='Enter') doURLCheck(); });
}

async function doURLCheck() {
  var raw = document.getElementById('urlcheck-input').value.trim();
  if (!raw) { toast('請輸入 URL','err'); return; }
  var btn = document.getElementById('urlcheck-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin">◌</span> 分析中...';
  document.getElementById('urlcheck-results').classList.remove('hidden');
  setStatus('URL 深度檢查中...');

  var url = raw.indexOf('http') === 0 ? raw : 'https://'+raw;
  renderURLStruct(url);
  var score = renderURLRisksPanel(url);
  renderURLDecoded(url);
  renderURLExtLinks(url);
  await doURLhaus(url);

  btn.disabled = false; btn.innerHTML = '<span>⬡</span> 深度檢查';
  setStatus('URL 檢查完成');
}

function renderURLStruct(url) {
  var tbody = document.getElementById('url-struct-tbody');
  var p;
  try { p = new URL(url); } catch(e) { tbody.innerHTML = '<tr><td colspan="2" class="empty-cell">URL 格式無效</td></tr>'; return; }
  var rows = [
    ['協議', p.protocol], ['主機名稱', p.hostname],
    ['Port', p.port||(p.protocol==='https:'?'443':'80')],
    ['路徑', p.pathname||'/'], ['查詢參數', p.search||'—'],
    ['Fragment', p.hash||'—'], ['總長度', url.length+' 字元'],
  ];
  tbody.innerHTML = rows.map(function(r) {
    return '<tr><td class="dk">'+r[0]+'</td><td class="dv" style="color:var(--tc)">'+r[1]+'</td></tr>';
  }).join('');
}

function renderURLRisksPanel(url) {
  var hits  = URL_RULES.filter(function(r) { return r.test(url); });
  var score = Math.min(100, hits.reduce(function(s,r){ return s+r.w; }, 0));
  setURLVerdict(score);

  var el = document.getElementById('url-risk-list');
  el.innerHTML = hits.length === 0
    ? '<div class="sig-item lv-pass"><span class="si-icon" style="color:var(--low)">✓</span><div class="si-content"><div class="si-name">無已知風險特徵</div><div class="si-desc">已套用 '+URL_RULES.length+' 條規則</div></div></div>'
    : hits.map(function(h) {
        return '<div class="sig-item lv-'+h.lv+'"><span class="si-icon">'+(h.lv==='crit'?'☣':h.lv==='warn'?'⚠':'ℹ')+'</span><div class="si-content"><div class="si-name">'+h.name+'</div><div class="si-desc">風險權重 +'+h.w+'</div></div></div>';
      }).join('');
  return score;
}

function setURLVerdict(score) {
  var b = document.getElementById('url-verdict-banner');
  var i = document.getElementById('url-verdict-icon');
  var t = document.getElementById('url-verdict-title');
  var s = document.getElementById('url-verdict-sub');
  var n = document.getElementById('url-verdict-score');
  b.className = 'verdict '+(score>=50?'verdict-danger':score>=20?'verdict-suspect':'verdict-clean');
  n.textContent = score;
  if (score >= 50) { i.textContent='☣'; t.textContent='⚠ 高風險 URL'; s.textContent='命中多條高風險規則，強烈建議不要造訪此 URL。'; }
  else if (score >= 20) { i.textContent='⚠'; t.textContent='可疑 URL'; s.textContent='發現可疑特徵，建議搭配黑名單查詢後再決定是否造訪。'; }
  else { i.textContent='✓'; t.textContent='未發現明顯風險'; s.textContent='靜態特徵未命中已知規則，仍建議搭配黑名單查詢確認。'; }
}

async function doURLhaus(url) {
  var el = document.getElementById('urlhaus-result');
  el.innerHTML = '<div class="urlhaus-unknown"><span class="spin">◌</span> 查詢中...</div>';
  try {
    var res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'url=' + encodeURIComponent(url)
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    var d = await res.json();
    if (d.query_status === 'no_results') { el.innerHTML = '<div class="urlhaus-clean">✓ URLhaus 查無惡意記錄</div>'; return; }
    if (d.url_status === 'online' || d.url_status === 'unknown') {
      el.innerHTML = '<div class="urlhaus-danger">☣ URLhaus 已列入黑名單<br><span style="font-size:10px;color:var(--t2);display:block;margin-top:5px">狀態：'+d.url_status+' · 威脅：'+((d.tags||[]).join(', ')||'未分類')+'</span></div>';
      return;
    }
    el.innerHTML = '<div class="urlhaus-unknown">狀態：'+(d.query_status||'未知')+'</div>';
  } catch(err) {
    el.innerHTML = '<div class="urlhaus-unknown">查詢失敗：'+err.message+'<br><span style="font-size:10px;color:var(--t3);display:block;margin-top:4px">可能受 CORS 限制</span></div>';
  }
}

function renderURLDecoded(url) {
  var el = document.getElementById('url-decoded');
  var d1 = '', d2 = '';
  try { d1 = decodeURIComponent(url); } catch(e) { d1 = url; }
  try { d2 = decodeURIComponent(d1); } catch(e) { d2 = d1; }
  var rows = [['原始 URL', url], ['URI 解碼 (1)', d1!==url?d1:'(無需解碼)'], ['URI 解碼 (2)', d2!==d1?d2:'(無需二次解碼)']];
  el.innerHTML = rows.map(function(r) {
    return '<div class="dec-row"><span class="dec-key">'+r[0]+'</span><span class="dec-val">'+r[1].replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span></div>';
  }).join('');
}

function renderURLExtLinks(url) {
  var host = '';
  try { host = new URL(url).hostname; } catch(e) { host = url; }
  var e = encodeURIComponent;
  var tools = [
    { n:'Google Safe Browsing', href:'https://transparencyreport.google.com/safe-browsing/search?url='+e(url) },
    { n:'VirusTotal URL',       href:'https://www.virustotal.com/gui/url/'+btoa(url).replace(/=/g,'') },
    { n:'URLhaus',              href:'https://urlhaus.abuse.ch/browse.php?search='+e(url) },
    { n:'Sucuri SiteCheck',     href:'https://sitecheck.sucuri.net/results/'+e(host) },
    { n:'AlienVault OTX',       href:'https://otx.alienvault.com/indicator/domain/'+host },
    { n:'Web of Trust',         href:'https://www.mywot.com/scorecard/'+e(host) },
  ];
  document.getElementById('url-ext-links').innerHTML = tools.map(function(t) {
    return '<div class="ext-item"><span class="ext-name">'+t.n+'</span><button class="ext-btn" onclick="window.open(\''+t.href+'\',\'_blank\',\'noopener\')">開啟 →</button></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_04 — Privacy Sanitizer
═══════════════════════════════════════════════════════════════════ */
var metaFile = null;

function initMeta() {
  var drop  = document.getElementById('meta-drop-zone');
  var input = document.getElementById('meta-file-input');
  drop.addEventListener('click', function() { input.click(); });
  drop.addEventListener('keydown', function(e) { if (e.key==='Enter'||e.key===' ') input.click(); });
  drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', function() { drop.classList.remove('over'); });
  drop.addEventListener('drop', function(e) {
    e.preventDefault(); drop.classList.remove('over');
    var f = e.dataTransfer.files[0];
    if (f && f.type.indexOf('image/')===0) doMeta(f); else toast('請上傳有效圖片','err');
  });
  input.addEventListener('change', function() { if (input.files[0]) doMeta(input.files[0]); });
  document.getElementById('sanitize-btn').addEventListener('click', doSanitize);
}

async function doMeta(file) {
  metaFile = file;
  document.getElementById('meta-results').classList.remove('hidden');
  var ou = URL.createObjectURL(file);
  var img = document.getElementById('meta-img');
  img.src = ou;
  img.onload = function() { document.getElementById('prev-dim').textContent = img.naturalWidth+'×'+img.naturalHeight+'px'; };
  document.getElementById('prev-name').textContent = file.name;
  document.getElementById('sanitize-status').classList.add('hidden');
  var buf = await file.arrayBuffer();
  renderEXIF(extractEXIF(new DataView(buf)));
  setStatus('EXIF 解析完成');
}

function extractEXIF(dv) {
  var res = [];
  if (dv.getUint16(0) !== 0xFFD8) return res;
  var off = 2;
  while (off < dv.byteLength - 1) {
    if (dv.getUint8(off) !== 0xFF) break;
    var mk = dv.getUint16(off); off += 2;
    if (mk === 0xFFE1) {
      var sl = dv.getUint16(off);
      if (dv.getUint32(off+2) === 0x45786966) parseIFD(dv, off+10, res);
      off += sl;
    } else if (mk >= 0xFFE0 && mk <= 0xFFEF) {
      off += dv.getUint16(off);
    } else break;
  }
  return res;
}

function parseIFD(dv, xs, res) {
  try {
    var ts = xs - 2;
    var le = dv.getUint16(ts) === 0x4949;
    var r16 = function(o) { return dv.getUint16(ts+o, le); };
    var r32 = function(o) { return dv.getUint32(ts+o, le); };
    var defs = {
      0x010F:['設備製造商','低','🏭'], 0x0110:['設備型號','中','📱'],
      0x0132:['拍攝時間','高','🕐'],  0x013B:['作者','高','👤'],
      0x8825:['GPS IFD','極高','📍'], 0x9003:['原始拍攝時間','高','🕐'],
      0x9c9d:['作者名稱','高','👤'],  0xA430:['相機擁有者','高','👤'],
      0xA431:['相機序號','高','🔢'],  0x0112:['圖片方向','低','↔'],
    };
    var io = r32(4);
    var cnt = r16(io);
    for (var i = 0; i < Math.min(cnt, 64); i++) {
      var eo  = io + 2 + i * 12;
      var tag = r16(eo);
      var typ = r16(eo+2);
      if (!defs[tag]) continue;
      var val = '(無法解析)';
      try {
        if (typ === 2) {
          var c = r32(eo+4), vo = c<=4 ? eo+8 : r32(eo+8), ch = [];
          for (var j=0; j<Math.min(c-1,256); j++) { var cc=dv.getUint8(ts+vo+j); if (!cc) break; ch.push(String.fromCharCode(cc)); }
          val = ch.join('').trim() || '(空白)';
        } else if (typ===3) { val = r16(eo+8).toString(); }
        else if (typ===4)   { val = r32(eo+8).toString(); }
        else if (typ===5)   { var voo=r32(eo+8), dd=r32(voo+4); val = dd?(r32(voo)/dd).toFixed(4):'∞'; }
      } catch(e) {}
      if (tag===0x8825) val = '⚠ GPS 數據存在 — 包含精確位置';
      var nd = defs[tag];
      res.push({ tag:'0x'+tag.toString(16).toUpperCase().padStart(4,'0'), name:nd[0], value:val, risk:nd[1], icon:nd[2] });
    }
  } catch(e) {
    res.push({ tag:'—', name:'解析錯誤', value:e.message, risk:'—', icon:'⚠' });
  }
}

function renderEXIF(data) {
  var tbody  = document.getElementById('exif-tbody');
  var banner = document.getElementById('exif-banner');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">未發現 EXIF 資訊</td></tr>';
    banner.classList.add('hidden'); return;
  }
  var hr = data.filter(function(d){ return d.risk==='極高'||d.risk==='高'; }).length;
  var gps = data.some(function(d){ return d.name.indexOf('GPS')!==-1; });
  if (gps || hr > 0) { banner.classList.remove('hidden'); banner.innerHTML='⚠ 發現 '+hr+' 個高風險隱私欄位'+(gps?'，包含 GPS 定位':''); }
  else banner.classList.add('hidden');
  var rm = { '極高':'tag-crit','高':'tag-warn','中':'tag-info','低':'tag-pass' };
  tbody.innerHTML = data.map(function(d) {
    return '<tr><td style="font-size:11px;color:var(--t2)">'+d.icon+' '+d.name+'<br><span style="color:var(--t3);font-size:10px">'+d.tag+'</span></td>'
      + '<td style="font-size:11px;color:var(--tc);word-break:break-all">'+d.value+'</td>'
      + '<td><span class="tag '+(rm[d.risk]||'')+'">'+d.risk+'</span></td></tr>';
  }).join('');
}

function doSanitize() {
  if (!metaFile) { toast('請先上傳圖片','err'); return; }
  var btn = document.getElementById('sanitize-btn');
  var st  = document.getElementById('sanitize-status');
  btn.disabled = true; btn.innerHTML = '<span class="spin">◌</span> 脫敏中...';
  setTimeout(function() {
    var img = new Image();
    var ou  = URL.createObjectURL(metaFile);
    img.src = ou;
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(ou);
      var ext  = metaFile.name.split('.').pop().toLowerCase();
      var mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      var baseName = metaFile.name.replace(/\.[^/.]+$/, '');
      canvas.toBlob(function(blob) {
        var cu = URL.createObjectURL(blob);
        var a  = document.createElement('a');
        a.href = cu; a.download = baseName + '_sanitized.' + ext; a.click();
        URL.revokeObjectURL(cu);
        btn.disabled = false; btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載';
        st.classList.remove('hidden');
        st.innerHTML = '✓ 脫敏完成 ('+fmtBytes(blob.size)+') · 所有 Metadata 已抹除';
        toast('脫敏完成，已自動下載','ok');
      }, mime, 0.95);
    };
    img.onerror = function() {
      btn.disabled = false; btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載';
      toast('圖片載入失敗','err');
    };
  }, 50);
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_05 — OSINT
═══════════════════════════════════════════════════════════════════ */
function initOSINT() {
  var btn   = document.getElementById('osint-btn');
  var input = document.getElementById('osint-input');
  btn.addEventListener('click', doOSINT);
  input.addEventListener('keydown', function(e) { if (e.key==='Enter') doOSINT(); });
  document.querySelectorAll('.dns-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.dns-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      var domain = getDomain(document.getElementById('osint-input').value.trim());
      if (domain) doDNS(domain, tab.getAttribute('data-type'));
    });
  });
}

function getDomain(raw) {
  if (!raw) return '';
  try { return new URL(raw.indexOf('http')===0?raw:'https://'+raw).hostname; }
  catch(e) { return raw.replace(/[^a-zA-Z0-9.\-:]/g,''); }
}

async function doOSINT() {
  var raw = document.getElementById('osint-input').value.trim();
  if (!raw) { toast('請輸入目標','err'); return; }
  var btn = document.getElementById('osint-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin">◌</span> 掃描中...';
  document.getElementById('osint-results').classList.remove('hidden');
  setStatus('OSINT 掃描中...');
  var domain = getDomain(raw);
  renderSecHdrs(domain);
  await doDNS(domain, 'A');
  renderOSINTReport(domain, raw);
  btn.disabled = false; btn.innerHTML = '<span>◎</span> 開始掃描';
  setStatus('掃描完成'); toast(domain+' 掃描完成','ok');
}

function renderSecHdrs(domain) {
  var tbody = document.getElementById('headers-tbody');
  var hdrs = [
    {a:'CSP',  n:'Content-Security-Policy',   d:'防 XSS'},
    {a:'HSTS', n:'Strict-Transport-Security',  d:'強制 HTTPS'},
    {a:'XFO',  n:'X-Frame-Options',            d:'防 Clickjacking'},
    {a:'XCTO', n:'X-Content-Type-Options',     d:'防 MIME 嗅探'},
    {a:'RP',   n:'Referrer-Policy',            d:'控制 Referrer'},
    {a:'PP',   n:'Permissions-Policy',         d:'限制功能權限'},
  ];
  tbody.innerHTML = hdrs.map(function(h) {
    return '<tr><td style="font-size:11px"><b style="color:var(--t1)">'+h.a+'</b><br><span style="font-size:10px;color:var(--t3)">'+h.n+'</span></td><td><span class="tag tag-info">查詢中</span></td><td style="font-size:11px;color:var(--t2)">'+h.d+'</td></tr>';
  }).join('');
  fetchSecHdrs(domain, hdrs, tbody);
}

async function fetchSecHdrs(domain, hdrs, tbody) {
  var sim = { CSP:false, HSTS:true, XFO:true, XCTO:true, RP:false, PP:false };
  try {
    var res = await fetch('https://api.securityheaders.com/?q='+encodeURIComponent(domain)+'&followRedirects=on&hide=on', { mode:'cors' });
    if (res.ok) {
      var p = {};
      res.headers.forEach(function(v,k){ p[k.toLowerCase()] = v; });
      var rows = tbody.querySelectorAll('tr');
      hdrs.forEach(function(h, idx) {
        var found = p[h.n.toLowerCase()] !== undefined;
        if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML = found ? '<span class="tag tag-pass">✓ 已配置</span>' : '<span class="tag tag-crit">✗ 缺失</span>';
      });
      return;
    }
  } catch(e) {}
  var rows = tbody.querySelectorAll('tr');
  hdrs.forEach(function(h, idx) {
    var ok = sim[h.a];
    if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML =
      (ok ? '<span class="tag tag-pass">✓ 已配置</span>' : '<span class="tag tag-crit">✗ 缺失</span>') +
      '<span style="font-size:9px;color:var(--t3);display:block">(示範)</span>';
  });
}

async function doDNS(domain, type) {
  var area = document.getElementById('dns-area');
  area.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--t2)"><span class="spin">◌</span> 查詢 '+type+'...</div>';
  try {
    var res = await fetch('https://dns.google/resolve?name='+encodeURIComponent(domain)+'&type='+encodeURIComponent(type));
    if (!res.ok) throw new Error('HTTP '+res.status);
    var d = await res.json();
    if (!d.Answer || !d.Answer.length) { area.innerHTML = '<div class="empty-cell">無 '+type+' 記錄</div>'; return; }
    var tm = {1:'A',2:'NS',5:'CNAME',6:'SOA',15:'MX',16:'TXT',28:'AAAA',33:'SRV'};
    area.innerHTML = d.Answer.map(function(r) {
      return '<div class="dns-rec"><span class="dns-type">'+(tm[r.type]||r.type)+'</span><span class="dns-val">'+r.data.replace(/"/g,'')+'</span><span class="dns-ttl">TTL:'+r.TTL+'s</span></div>';
    }).join('');
  } catch(err) {
    area.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--t2)"><span class="tag tag-warn">⚠</span> 失敗：'+err.message+'</div>';
  }
}

function renderOSINTReport(domain, raw) {
  var c = document.getElementById('osint-report');
  var isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  var https = raw.toLowerCase().indexOf('https://') === 0;
  var depth = (domain.match(/\./g)||[]).length;
  var items = [
    { l:'連線協議',   v:https?'✓ HTTPS':'✗ HTTP',   cls:https?'tag-pass':'tag-crit' },
    { l:'目標類型',   v:isIP?'📍 IP':'🌐 域名',      cls:'tag-info' },
    { l:'子域名深度', v:depth<=1?depth+'層 (正常)':depth+'層 (注意)', cls:depth<=1?'tag-pass':'tag-warn' },
    { l:'域名長度',   v:domain.length>30?domain.length+'字元 (長)':domain.length+'字元', cls:domain.length>30?'tag-warn':'tag-pass' },
    { l:'數字混淆',   v:/\d{4,}/.test(domain)?'⚠ 含大量數字':'✓ 正常', cls:/\d{4,}/.test(domain)?'tag-warn':'tag-pass' },
    { l:'DNS',        v:'✓ Google DoH', cls:'tag-info' },
  ];
  c.innerHTML = items.map(function(it) {
    return '<div class="rpt-item"><div class="rpt-label">'+it.l+'</div><span class="tag '+it.cls+'" style="font-size:11px">'+it.v+'</span></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_06 — CVE
═══════════════════════════════════════════════════════════════════ */
function initCVE() {
  var btn   = document.getElementById('cve-btn');
  var input = document.getElementById('cve-input');
  btn.addEventListener('click', doCVE);
  input.addEventListener('keydown', function(e) { if (e.key==='Enter') doCVE(); });
}

async function doCVE() {
  var kw = document.getElementById('cve-input').value.trim();
  if (!kw) { toast('請輸入關鍵字','err'); return; }
  var btn     = document.getElementById('cve-btn');
  var loading = document.getElementById('cve-loading');
  var tbody   = document.getElementById('cve-tbody');
  btn.disabled = true; btn.innerHTML = '<span class="spin">◌</span> 搜尋中...';
  document.getElementById('cve-results').classList.remove('hidden');
  loading.classList.remove('hidden'); tbody.innerHTML = '';
  setStatus('查詢 NVD...');

  var isCVE = /^CVE-\d{4}-\d+$/i.test(kw);
  var url = isCVE
    ? 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId='+encodeURIComponent(kw.toUpperCase())
    : 'https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch='+encodeURIComponent(kw)+'&resultsPerPage=20';

  try {
    var res = await fetch(url, { headers: { 'Accept':'application/json' } });
    if (!res.ok) throw new Error(res.status===429?'速率限制，請稍後':'HTTP '+res.status);
    var d = await res.json();
    loading.classList.add('hidden');
    if (!d.vulnerabilities) throw new Error('回應格式錯誤');
    renderCVE(d.vulnerabilities, d.totalResults||0, kw);
    setStatus('找到 '+d.totalResults+' 個漏洞');
    toast('找到 '+d.totalResults+' 個漏洞', d.totalResults>0?'ok':'info');
  } catch(err) {
    loading.classList.add('hidden');
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell"><div style="color:var(--t2)">⚠ 查詢失敗：'+err.message+'</div><div style="color:var(--t3);font-size:10px;margin-top:5px">建議透過後端代理串接 NVD API</div></td></tr>';
    toast('NVD 查詢失敗','err');
  }
  btn.disabled = false; btn.innerHTML = '<span>◇</span> 搜尋漏洞';
}

function getCVSS(cve) {
  var m = cve.metrics;
  if (!m) return { score:null, sev:'UNKNOWN' };
  var d = (m.cvssMetricV31&&m.cvssMetricV31[0]&&m.cvssMetricV31[0].cvssData)
       || (m.cvssMetricV30&&m.cvssMetricV30[0]&&m.cvssMetricV30[0].cvssData)
       || (m.cvssMetricV2 &&m.cvssMetricV2[0] &&m.cvssMetricV2[0].cvssData);
  if (!d) return { score:null, sev:'UNKNOWN' };
  return { score:d.baseScore, sev:d.baseSeverity||(d.baseScore>=9?'CRITICAL':d.baseScore>=7?'HIGH':d.baseScore>=4?'MEDIUM':'LOW') };
}

function cvssClass(s) {
  if (s===null) return 'cvss-none';
  if (s>=9) return 'cvss-critical'; if (s>=7) return 'cvss-high';
  if (s>=4) return 'cvss-medium';  return 'cvss-low';
}

function sevTag(s) {
  var m = { CRITICAL:['CRITICAL','tag-crit'], HIGH:['HIGH','tag-warn'], MEDIUM:['MEDIUM','tag-info'], LOW:['LOW','tag-pass'], UNKNOWN:['N/A',''] };
  var r = m[s&&s.toUpperCase()] || m.UNKNOWN;
  return '<span class="tag '+r[1]+'">'+r[0]+'</span>';
}

function renderCVE(vs, total, kw) {
  document.getElementById('cve-count').textContent = '找到 '+total.toLocaleString()+' 個 (顯示前 '+vs.length+' 筆)';
  var cnts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0 };
  vs.forEach(function(v) { var k=(getCVSS(v.cve).sev||'').toUpperCase(); if (cnts[k]!==undefined) cnts[k]++; });
  var cm = { CRITICAL:'var(--crit)', HIGH:'var(--high)', MEDIUM:'var(--med)', LOW:'var(--low)' };
  document.getElementById('cve-sev-counts').innerHTML = Object.keys(cnts).map(function(l) {
    return '<span class="sev-badge"><span class="sev-dot" style="background:'+cm[l]+'"></span><span style="color:'+cm[l]+'">'+l+':'+cnts[l]+'</span></span>';
  }).join('');

  if (!vs.length) { document.getElementById('cve-tbody').innerHTML = '<tr><td colspan="5" class="empty-cell">未找到「'+kw+'」漏洞</td></tr>'; return; }
  document.getElementById('cve-tbody').innerHTML = vs.map(function(item) {
    var cve = item.cve;
    var cv  = getCVSS(cve);
    var desc = (cve.descriptions&&cve.descriptions.find(function(d){return d.lang==='zh';})&&cve.descriptions.find(function(d){return d.lang==='zh';}).value)
            || (cve.descriptions&&cve.descriptions.find(function(d){return d.lang==='en';})&&cve.descriptions.find(function(d){return d.lang==='en';}).value)
            || '無描述';
    var pub  = cve.published ? new Date(cve.published).toLocaleDateString('zh-Hant') : '—';
    return '<tr><td><a class="cve-link" href="https://nvd.nist.gov/vuln/detail/'+cve.id+'" target="_blank" rel="noopener">'+cve.id+'</a></td>'
      + '<td><span class="cvss-s '+cvssClass(cv.score)+'">'+(cv.score!==null?cv.score.toFixed(1):'N/A')+'</span></td>'
      + '<td>'+sevTag(cv.sev)+'</td>'
      + '<td><div class="cve-desc">'+desc+'</div></td>'
      + '<td style="font-size:11px;color:var(--t2)">'+pub+'</td></tr>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   PWA
═══════════════════════════════════════════════════════════════════ */
function initSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
}

/* ═══════════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  /* 1. Fix layout FIRST so header/footer don't block anything */
  fixLayout();
  window.addEventListener('resize', fixLayout);

  /* 2. Init all modules */
  initNav();
  initMalware();
  initHash();
  initURLCheck();
  initMeta();
  initOSINT();
  initCVE();
  initSW();

  /* 3. Clock */
  tick(); setInterval(tick, 1000);
  setStatus('系統就緒');
});
