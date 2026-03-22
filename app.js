'use strict';

/* ═══════════════════════════════════════════════════════════════════
   PROJECT SENTINEL — app.js  v3.0
   威脅掃描中心 · 多平台整合 · 檔案 + URL 雙模式
═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   全域工具
───────────────────────────────────────────── */

function showToast(message, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transition = 'opacity 0.3s';
    setTimeout(() => t.remove(), 320);
  }, 3000);
}

function formatBytes(n) {
  if (!n) return '0 Bytes';
  const u = ['Bytes','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return parseFloat((n / Math.pow(1024, i)).toFixed(2)) + ' ' + u[i];
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function setStatus(txt) {
  const el = document.getElementById('status-text');
  if (el) el.textContent = txt;
}

function logTime() {
  return new Date().toLocaleTimeString('zh-Hant', { hour12: false });
}

function updateClock() {
  const el = document.getElementById('footer-clock');
  if (el) el.textContent = new Date().toLocaleString('zh-Hant', {
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false
  });
}

/* ─────────────────────────────────────────────
   導覽 + 漢堡選單
───────────────────────────────────────────── */

function initNavigation() {
  const tabs    = document.querySelectorAll('.nav-tab');
  const modules = document.querySelectorAll('.module');
  const burger  = document.getElementById('nav-hamburger');
  const nav     = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');

  function closeNav() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.classList.remove('nav-open');
  }

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    overlay.classList.toggle('visible', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
  });

  overlay.addEventListener('click', closeNav);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      modules.forEach(m => {
        const active = m.id === target;
        m.classList.toggle('hidden', !active);
        m.classList.toggle('active', active);
      });
      tab.classList.add('active');
      closeNav();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MD5 (純 JS 實作)
═══════════════════════════════════════════════════════════════════ */

function u8ToWords(u8) {
  const w = [];
  for (let i = 0; i < u8.length; i++) w[i>>>2] |= u8[i] << (24-(i%4)*8);
  return w;
}

function md5(buffer) {
  const data = new Uint8Array(buffer);
  const bits = data.length * 8;
  const words = u8ToWords(data);
  words[data.length>>2] |= 0x80 << (24-(data.length%4)*8);
  words[(((data.length+64)>>9)<<4)+14] = bits>>>0;

  let a= 1732584193, b=-271733879, c=-1732584194, d=271733878;
  const T = Array.from({length:64}, (_,i) => Math.floor(Math.abs(Math.sin(i+1))*0x100000000)|0);

  const R=(n,s)=>((n<<s)|(n>>>(32-s)));
  const FF=(a,b,c,d,x,s,t)=>R(a+((b&c)|(~b&d))+(x>>>0)+t,s)+b;
  const GG=(a,b,c,d,x,s,t)=>R(a+((b&d)|(c&~d))+(x>>>0)+t,s)+b;
  const HH=(a,b,c,d,x,s,t)=>R(a+(b^c^d)+(x>>>0)+t,s)+b;
  const II=(a,b,c,d,x,s,t)=>R(a+(c^(b|~d))+(x>>>0)+t,s)+b;

  for (let i=0;i<words.length;i+=16) {
    const M=j=>{const v=words[i+j];return((v>>>24)&0xff)|((v>>>8)&0xff00)|((v&0xff00)<<8)|((v&0xff)<<24);};
    let [aa,bb,cc,dd]=[a,b,c,d];
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
  const le=n=>{const u=n>>>0;return[u&0xff,(u>>8)&0xff,(u>>16)&0xff,(u>>24)&0xff].map(x=>x.toString(16).padStart(2,'0')).join('');};
  return le(a)+le(b)+le(c)+le(d);
}

async function sha(buffer, algo) {
  return bufToHex(await crypto.subtle.digest(algo, buffer));
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_01：威脅掃描中心（檔案 + URL 雙模式）
═══════════════════════════════════════════════════════════════════ */

/* ─── 特徵碼資料庫 ─── */
const FILE_SIGNATURES = [
  { name:'EICAR 測試病毒',             pattern:[0x58,0x35,0x4F,0x21,0x50,0x25,0x40,0x41,0x50,0x5B,0x34,0x5C,0x50,0x5A,0x58,0x35,0x34,0x28,0x50,0x5E,0x29,0x37,0x43,0x43,0x29,0x37,0x7D,0x24,0x45,0x49,0x43,0x41,0x52], offset:0,    weight:100, level:'crit' },
  { name:'Metasploit NOP Sled + Int3', pattern:[0x90,0x90,0x90,0x90,0xcc],         offset:null, weight:40,  level:'crit' },
  { name:'PowerShell EncodedCommand',  pattern:[0x2D,0x65,0x6E,0x63,0x6F,0x64,0x65,0x64,0x43,0x6F,0x6D,0x6D,0x61,0x6E,0x64], offset:null, weight:45, level:'crit' },
  { name:'VBScript WScript.Shell',     pattern:[0x57,0x53,0x63,0x72,0x69,0x70,0x74,0x2E,0x53,0x68,0x65,0x6C,0x6C], offset:null, weight:42, level:'crit' },
  { name:'AutoRun [autorun]',          pattern:[0x5B,0x61,0x75,0x74,0x6F,0x72,0x75,0x6E,0x5D], offset:null, weight:30, level:'warn' },
  { name:'Mimikatz sekurlsa 字串',     pattern:[0x73,0x65,0x6B,0x75,0x72,0x6C,0x73,0x61], offset:null, weight:55, level:'crit' },
  { name:'Cobalt Strike 信標特徵',     pattern:[0x4D,0x5A,0x90,0x00,0x03,0x00,0x00,0x00,0x04,0x00,0xff,0xff], offset:0, weight:50, level:'crit' },
  { name:'Windows PE (MZ Header)',     pattern:[0x4D,0x5A],                         offset:0,    weight:5,   level:'info' },
  { name:'ELF 執行檔',                 pattern:[0x7F,0x45,0x4C,0x46],              offset:0,    weight:4,   level:'info' },
  { name:'Mach-O 64-bit',             pattern:[0xCF,0xFA,0xED,0xFE],              offset:0,    weight:4,   level:'info' },
  { name:'PDF 文件',                   pattern:[0x25,0x50,0x44,0x46],              offset:0,    weight:2,   level:'info' },
  { name:'ZIP / OOXML 壓縮',          pattern:[0x50,0x4B,0x03,0x04],              offset:0,    weight:2,   level:'info' },
  { name:'RAR 壓縮檔',                 pattern:[0x52,0x61,0x72,0x21,0x1A,0x07],   offset:0,    weight:2,   level:'info' },
];

const STRING_RULES = [
  { re:/cmd\.exe/i,                     name:'CMD.EXE 呼叫',              level:'crit', weight:25 },
  { re:/powershell\s*(-[a-z])/i,        name:'PowerShell 命令列參數',     level:'crit', weight:30 },
  { re:/WScript\.Shell/i,               name:'WScript Shell 物件建立',    level:'crit', weight:32 },
  { re:/ActiveXObject/i,                name:'ActiveX 物件建立',          level:'crit', weight:28 },
  { re:/Shell\.Application/i,           name:'Shell.Application 物件',    level:'crit', weight:30 },
  { re:/URLDownloadToFile/i,            name:'遠端檔案下載 (Win API)',     level:'crit', weight:38 },
  { re:/VirtualAlloc/i,                 name:'記憶體動態分配 API',        level:'crit', weight:35 },
  { re:/WriteProcessMemory/i,           name:'跨程序記憶體寫入',          level:'crit', weight:40 },
  { re:/CreateRemoteThread/i,           name:'遠端執行緒建立',            level:'crit', weight:42 },
  { re:/NtUnmapViewOfSection/i,         name:'Process Hollowing 特徵',    level:'crit', weight:45 },
  { re:/IsDebuggerPresent/i,            name:'反除錯偵測',                level:'warn', weight:25 },
  { re:/SetWindowsHookEx/i,             name:'鍵盤 Hook 安裝 (鍵盤記錄)', level:'crit', weight:40 },
  { re:/RegSetValueEx/i,                name:'登錄機碼寫入',              level:'warn', weight:22 },
  { re:/HKEY_LOCAL_MACHINE.*Run/i,      name:'自啟動登錄機碼',            level:'crit', weight:35 },
  { re:/\\\\AppData\\\\Roaming/i,       name:'AppData 目錄參照',          level:'warn', weight:18 },
  { re:/eval\s*\(/i,                    name:'eval() 動態執行',           level:'warn', weight:22 },
  { re:/document\.write\s*\(/i,         name:'document.write() 注入',     level:'warn', weight:18 },
  { re:/\\.onion/i,                     name:'Tor 洋蔥域名',              level:'crit', weight:32 },
  { re:/bitcoin|monero|btc.*wallet/i,   name:'加密貨幣勒索字串',          level:'warn', weight:18 },
  { re:/your files.*encrypt|files have been encrypted/i, name:'勒索軟體訊息', level:'crit', weight:55 },
  { re:/base64_decode\s*\(/i,           name:'Base64 解碼呼叫',           level:'warn', weight:20 },
  { re:/[A-Za-z0-9+/]{100,}={0,2}/,    name:'超長 Base64 字串 (疑似 Payload)', level:'info', weight:12 },
  { re:/(\\x[0-9a-f]{2}){12,}/i,       name:'大量 Hex 編碼字串',         level:'warn', weight:22 },
  { re:/CreateObject\s*\(\s*["']Scripting/i, name:'Scripting 物件建立',  level:'crit', weight:30 },
];

/* ─── URL 風險規則 ─── */
const URL_RISK_RULES = [
  { name:'IP 位址直接連線',            test:u=>/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(u),                         weight:25, level:'warn' },
  { name:'可疑高風險 TLD',             test:u=>/\.(xyz|top|click|loan|work|live|cc|tk|ml|ga|cf|gq|icu|buzz|monster)(\?|\/|$)/i.test(u), weight:22, level:'warn' },
  { name:'路徑遍歷 (../ 攻擊)',         test:u=>u.includes('../')||u.includes('..%2F')||u.includes('..%2f'),           weight:38, level:'crit' },
  { name:'SQL 注入特徵',               test:u=>/union.*select|select.*from|drop.*table|insert.*into/i.test(u),       weight:42, level:'crit' },
  { name:'XSS 特徵',                  test:u=>/<script|javascript:|onerror\s*=|onload\s*=/i.test(decodeURIComponent(u).replace(/%/g,'%')), weight:40, level:'crit' },
  { name:'純 HTTP 未加密',             test:u=>u.startsWith('http://'),                                               weight:15, level:'warn' },
  { name:'Data URI 嵌入',              test:u=>/data:.*base64/i.test(u),                                              weight:32, level:'crit' },
  { name:'@符號釣魚混淆',              test:u=>{try{return new URL(u).username.length>0}catch{return false}},         weight:40, level:'crit' },
  { name:'可執行副檔名',               test:u=>/\.(exe|bat|cmd|scr|vbs|ps1|sh|msi|hta|jar|apk)(\?|#|$)/i.test(u),  weight:32, level:'crit' },
  { name:'過多重定向參數',              test:u=>(u.match(/redirect|url=|next=|return=/gi)||[]).length>1,              weight:22, level:'warn' },
  { name:'子域名過深 (>5 層)',         test:u=>{try{return new URL(u).hostname.split('.').length>5}catch{return false}}, weight:18, level:'warn' },
  { name:'非標準 Port',                test:u=>{try{const p=new URL(u).port;return p&&p!=='80'&&p!=='443'}catch{return false}}, weight:20, level:'warn' },
  { name:'Base64 參數值',              test:u=>/[?&][^=]+=([A-Za-z0-9+/]{40,}={0,2})/.test(u),                     weight:15, level:'info' },
  { name:'超長 URL (>200 字元)',       test:u=>u.length>200,                                                           weight:10, level:'info' },
];

/* ─── 多平台定義 ─── */
function buildFilePlatforms(sha256, md5Hash, sha1Hash) {
  const e = encodeURIComponent;
  return [
    {
      id: 'virustotal',
      name: 'VirusTotal',
      desc: '70+ 防毒引擎交叉掃描',
      lookup: async () => ({
        status: 'redirect',
        detail: '點擊「在 VT 查詢」以雜湊值比對（不上傳檔案本體）',
        href: `https://www.virustotal.com/gui/file/${sha256}`,
        label: '在 VT 查詢 →',
      }),
    },
    {
      id: 'malwarebazaar',
      name: 'MalwareBazaar',
      desc: 'Abuse.ch 惡意軟體樣本庫',
      lookup: async () => {
        const res = await fetch('https://mb-api.abuse.ch/api/v1/', {
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:`query=get_info&hash=${sha256}`,
        });
        const d = await res.json();
        if (d.query_status === 'hash_not_found') return { status:'clean', detail:'MalwareBazaar 無此樣本記錄' };
        if (d.query_status === 'ok' && d.data?.[0]) {
          const s = d.data[0];
          return {
            status:'danger',
            detail:`樣本類型：${s.file_type||'—'}　標籤：${(s.tags||[]).join(', ')||'—'}　首次上傳：${s.first_seen||'—'}`,
            href: `https://bazaar.abuse.ch/sample/${sha256}/`,
            label: 'MalwareBazaar 報告 →',
          };
        }
        return { status:'error', detail:`查詢狀態：${d.query_status}` };
      },
    },
    {
      id: 'threatfox',
      name: 'ThreatFox (IOC)',
      desc: 'Abuse.ch IOC 情報資料庫',
      lookup: async () => {
        const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ query:'search_ioc', search_term: sha256 }),
        });
        const d = await res.json();
        if (d.query_status === 'no_result') return { status:'clean', detail:'ThreatFox 無此 IOC 記錄' };
        if (d.query_status === 'ok' && d.data?.length) {
          const ioc = d.data[0];
          return {
            status:'danger',
            detail:`IOC 類型：${ioc.ioc_type||'—'}　威脅：${ioc.malware_printable||'—'}　信心：${ioc.confidence_level||'—'}%`,
            href:`https://threatfox.abuse.ch/ioc/${ioc.id}/`,
            label:'ThreatFox 報告 →',
          };
        }
        return { status:'error', detail:`狀態：${d.query_status}` };
      },
    },
    {
      id: 'circl',
      name: 'CIRCL Hash Lookup',
      desc: '盧森堡 CERT 雜湊查詢服務',
      lookup: async () => {
        const res = await fetch(`https://hashlookup.circl.lu/lookup/sha256/${sha256}`, {
          headers:{ 'Accept':'application/json' }
        });
        if (res.status === 404) return { status:'clean', detail:'CIRCL 無此雜湊紀錄 (可能為未知或乾淨檔案)' };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        const known = d['KnownMalicious'];
        return {
          status: known ? 'danger' : 'clean',
          detail: known
            ? `已知惡意：${known}　檔案名稱：${d['FileName']||'—'}`
            : `已知檔案：${d['FileName']||d['ProductName']||'乾淨檔案'}`,
          href: `https://hashlookup.circl.lu/lookup/sha256/${sha256}`,
          label: 'CIRCL 詳細 →',
        };
      },
    },
    {
      id: 'otx',
      name: 'AlienVault OTX',
      desc: 'Open Threat Exchange 開放威脅情報',
      lookup: async () => ({
        status: 'redirect',
        detail: '點擊連結在 OTX 查詢此雜湊值的威脅情報',
        href: `https://otx.alienvault.com/indicator/file/${sha256}`,
        label: 'OTX 查詢 →',
      }),
    },
    {
      id: 'hybrid',
      name: 'Hybrid Analysis',
      desc: 'Falcon Sandbox 動態分析查詢',
      lookup: async () => ({
        status: 'redirect',
        detail: '查詢 Hybrid Analysis 動態沙箱行為分析報告',
        href: `https://www.hybrid-analysis.com/search?query=${sha256}`,
        label: 'Hybrid Analysis →',
      }),
    },
  ];
}

function buildURLPlatforms(url) {
  const e = encodeURIComponent;
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { hostname = url; }

  return [
    {
      id: 'urlhaus',
      name: 'URLhaus',
      desc: 'Abuse.ch 惡意 URL 資料庫',
      lookup: async () => {
        const res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:`url=${e(url)}`,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (d.query_status === 'no_results') return { status:'clean', detail:'URLhaus 無此 URL 的惡意記錄' };
        if (d.url_status === 'online' || d.url_status === 'unknown') {
          return {
            status:'danger',
            detail:`狀態：${d.url_status}　標籤：${(d.tags||[]).join(', ')||'未分類'}　威脅類型：${d.threat||'—'}`,
            href:`https://urlhaus.abuse.ch/url/${d.id}/`,
            label:'URLhaus 報告 →',
          };
        }
        return { status:'warn', detail:`狀態：${d.query_status||d.url_status||'未知'}` };
      },
    },
    {
      id: 'threatfox-url',
      name: 'ThreatFox URL',
      desc: 'Abuse.ch IOC URL 情報',
      lookup: async () => {
        const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ query:'search_ioc', search_term: hostname }),
        });
        const d = await res.json();
        if (d.query_status === 'no_result') return { status:'clean', detail:'ThreatFox 無此域名 IOC 記錄' };
        if (d.query_status === 'ok' && d.data?.length) {
          const ioc = d.data[0];
          return {
            status:'danger',
            detail:`威脅：${ioc.malware_printable||'—'}　IOC 類型：${ioc.ioc_type||'—'}　信心：${ioc.confidence_level||'—'}%`,
            href:`https://threatfox.abuse.ch/ioc/${ioc.id}/`,
            label:'ThreatFox 報告 →',
          };
        }
        return { status:'error', detail:`狀態：${d.query_status}` };
      },
    },
    {
      id: 'google-safe',
      name: 'Google 安全瀏覽',
      desc: 'Google Safe Browsing 透明度報告',
      lookup: async () => ({
        status: 'redirect',
        detail: '點擊前往 Google 安全瀏覽透明度報告查詢此 URL',
        href: `https://transparencyreport.google.com/safe-browsing/search?url=${e(url)}`,
        label: 'Google 查詢 →',
      }),
    },
    {
      id: 'vt-url',
      name: 'VirusTotal URL',
      desc: '70+ 引擎掃描此 URL',
      lookup: async () => ({
        status: 'redirect',
        detail: '點擊在 VirusTotal 掃描此 URL',
        href: `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}`,
        label: 'VirusTotal 掃描 →',
      }),
    },
    {
      id: 'otx-domain',
      name: 'AlienVault OTX',
      desc: 'OTX 域名威脅情報',
      lookup: async () => ({
        status: 'redirect',
        detail: '查詢 OTX 對此域名的威脅情報報告',
        href: `https://otx.alienvault.com/indicator/domain/${hostname}`,
        label: 'OTX 查詢 →',
      }),
    },
    {
      id: 'sucuri',
      name: 'Sucuri SiteCheck',
      desc: '網站安全掃描與黑名單狀態',
      lookup: async () => ({
        status: 'redirect',
        detail: '查詢 Sucuri 網站安全與黑名單狀態',
        href: `https://sitecheck.sucuri.net/results/${encodeURIComponent(hostname)}`,
        label: 'Sucuri 查詢 →',
      }),
    },
  ];
}

/* ─── 平台卡片渲染 ─── */
function initPlatformGrid(platforms) {
  const grid = document.getElementById('platform-grid');
  grid.innerHTML = platforms.map(p => `
    <div class="platform-card status-loading" id="pc-${p.id}">
      <div class="platform-header">
        <span class="platform-name">${p.name}</span>
        <span class="platform-badge badge-loading"><span class="spinner">◌</span> 查詢中</span>
      </div>
      <div class="platform-detail">${p.desc}</div>
    </div>
  `).join('');
}

async function runPlatformLookup(platform) {
  const card = document.getElementById(`pc-${platform.id}`);
  if (!card) return;

  try {
    const result = await platform.lookup();
    const statusMap = {
      clean:    { cardCls:'status-clean',   badgeCls:'badge-clean',  label:'✓ 未發現威脅' },
      danger:   { cardCls:'status-danger',  badgeCls:'badge-danger', label:'☣ 發現威脅' },
      warn:     { cardCls:'status-warn',    badgeCls:'badge-warn',   label:'⚠ 可疑' },
      redirect: { cardCls:'status-loading', badgeCls:'badge-loading',label:'ℹ 需驗證' },
      error:    { cardCls:'status-error',   badgeCls:'badge-error',  label:'— 查詢失敗' },
    };
    const s = statusMap[result.status] || statusMap.error;

    card.className = `platform-card ${s.cardCls}`;
    card.innerHTML = `
      <div class="platform-header">
        <span class="platform-name">${platform.name}</span>
        <span class="platform-badge ${s.badgeCls}">${s.label}</span>
      </div>
      <div class="platform-detail">${result.detail || ''}</div>
      ${result.href ? `<a class="platform-action" href="${result.href}" target="_blank" rel="noopener">${result.label || '查看報告 →'}</a>` : ''}
    `;
  } catch (err) {
    card.className = 'platform-card status-error';
    card.innerHTML = `
      <div class="platform-header">
        <span class="platform-name">${platform.name}</span>
        <span class="platform-badge badge-error">— 連線失敗</span>
      </div>
      <div class="platform-detail" style="color:var(--tx-3);font-size:10px;">${err.message}（可能受 CORS 限制，建議透過後端代理）</div>
    `;
  }
}

/* ─── 靜態掃描核心 ─── */
function calcEntropy(bytes) {
  const f = new Array(256).fill(0);
  for (const b of bytes) f[b]++;
  let e = 0;
  for (const v of f) { if (v) { const p=v/bytes.length; e -= p*Math.log2(p); } }
  return e;
}

function runSigScan(bytes, addLog) {
  const listEl = document.getElementById('sig-match-list');
  const hits = [];
  let score = 0;

  for (const sig of FILE_SIGNATURES) {
    const found = sig.offset !== null
      ? (bytes.length >= sig.offset + sig.pattern.length && sig.pattern.every((b,i) => bytes[sig.offset+i] === b))
      : (() => {
          const lim = Math.min(bytes.length - sig.pattern.length, 512*1024);
          outer: for (let i=0;i<lim;i++) { for (let j=0;j<sig.pattern.length;j++) { if (bytes[i+j]!==sig.pattern[j]) continue outer; } return true; }
          return false;
        })();

    if (found) { hits.push(sig); score += sig.weight; addLog(sig.level==='crit'?'CRIT':sig.level==='warn'?'WARN':'INFO', `特徵碼命中：${sig.name}`); }
  }

  listEl.innerHTML = hits.length === 0
    ? `<div class="sig-item level-pass"><span class="sig-item-icon" style="color:var(--sev-low)">✓</span><div class="sig-item-content"><div class="sig-item-name">無已知特徵碼命中</div><div class="sig-item-desc">已掃描 ${FILE_SIGNATURES.length} 條規則</div></div></div>`
    : hits.map(h=>`<div class="sig-item level-${h.level}"><span class="sig-item-icon">${h.level==='crit'?'☣':h.level==='warn'?'⚠':'ℹ'}</span><div class="sig-item-content"><div class="sig-item-name">${h.name}</div><div class="sig-item-desc">權重 +${h.weight}</div></div></div>`).join('');

  return Math.min(score, 85);
}

function runStringScan(bytes, addLog) {
  const listEl = document.getElementById('suspicious-strings-list');
  const text = new TextDecoder('utf-8',{fatal:false}).decode(bytes.slice(0, 512*1024));
  const hits = [];
  let score = 0;

  for (const r of STRING_RULES) {
    if (r.re.test(text)) { hits.push(r); score += r.weight; addLog(r.level==='crit'?'CRIT':r.level==='warn'?'WARN':'INFO', `可疑字串：${r.name}`); }
  }

  listEl.innerHTML = hits.length === 0
    ? `<div class="sig-item level-pass"><span class="sig-item-icon" style="color:var(--sev-low)">✓</span><div class="sig-item-content"><div class="sig-item-name">無可疑字串</div><div class="sig-item-desc">已掃描 ${STRING_RULES.length} 條規則</div></div></div>`
    : hits.map(h=>`<div class="sig-item level-${h.level}"><span class="sig-item-icon">${h.level==='crit'?'☣':h.level==='warn'?'⚠':'ℹ'}</span><div class="sig-item-content"><div class="sig-item-name">${h.name}</div><div class="sig-item-desc">權重 +${h.weight}</div></div></div>`).join('');

  return Math.min(score, 75);
}

function setVerdict(score) {
  const banner  = document.getElementById('malware-verdict-banner');
  const iconEl  = document.getElementById('verdict-icon');
  const titleEl = document.getElementById('verdict-title');
  const subEl   = document.getElementById('verdict-sub');
  const scoreEl = document.getElementById('verdict-score');

  banner.className = 'verdict-banner ' + (score>=60?'verdict-danger':score>=25?'verdict-suspect':'verdict-clean');
  scoreEl.textContent = score;

  if (score >= 60) {
    iconEl.textContent  = '☣';
    titleEl.textContent = '⚠ 高威脅風險';
    subEl.textContent   = '偵測到強烈可疑特徵，建議立即隔離，並透過多平台進行交叉驗證。';
  } else if (score >= 25) {
    iconEl.textContent  = '⚠';
    titleEl.textContent = '可疑 — 需進一步驗證';
    subEl.textContent   = '發現部分可疑特徵，建議透過下方多平台工具進行交叉確認。';
  } else {
    iconEl.textContent  = '✓';
    titleEl.textContent = '未發現已知威脅';
    subEl.textContent   = '靜態掃描未命中已知惡意特徵，建議仍搭配多平台雲端驗證確認。';
  }
}

function renderLog(logs) {
  const el = document.getElementById('malware-log');
  el.innerHTML = logs.map(l => {
    const tc = {OK:'log-tag-ok',WARN:'log-tag-warn',CRIT:'log-tag-crit',INFO:'log-tag-info'}[l.tag]||'log-tag-info';
    return `<div class="log-line"><span class="log-time">${l.t}</span><span class="${tc}">[${l.tag.padEnd(4)}]</span><span class="${l.hi?'log-msg-hi':'log-msg'}">${l.m}</span></div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

/* ─── 檔案掃描 ─── */
async function scanFile(file) {
  document.getElementById('malware-results').classList.remove('hidden');
  setStatus('靜態掃描中...');

  const logs = [];
  const addLog = (tag, m, hi=false) => { logs.push({t:logTime(),tag,m,hi}); renderLog(logs); };

  addLog('INFO', `目標：${file.name}  (${formatBytes(file.size)})`);

  const buffer = await file.arrayBuffer();
  const bytes  = new Uint8Array(buffer);

  const [sha256, sha1, md5Hash] = await Promise.all([
    sha(buffer,'SHA-256'), sha(buffer,'SHA-1'), Promise.resolve(md5(buffer))
  ]);
  addLog('INFO', `SHA-256：${sha256}`);
  addLog('INFO', `MD5    ：${md5Hash}`);

  const ext     = file.name.split('.').pop().toLowerCase();
  const isPE    = bytes[0]===0x4D && bytes[1]===0x5A;
  const isELF   = bytes[0]===0x7F && bytes[1]===0x45 && bytes[2]===0x4C && bytes[3]===0x46;
  const isPDF   = bytes[0]===0x25 && bytes[1]===0x50 && bytes[2]===0x44;
  const isZIP   = bytes[0]===0x50 && bytes[1]===0x4B;
  const entropy = calcEntropy(bytes.slice(0, Math.min(bytes.length, 8192)));
  const nullPct = (bytes.filter(b=>b===0).length/bytes.length*100).toFixed(1);
  const printPct= (bytes.filter(b=>b>=0x20&&b<0x7f).length/bytes.length*100).toFixed(1);

  let ftype = '未知格式';
  if (isPE) ftype='Windows PE 可執行檔'; else if (isELF) ftype='ELF 執行檔 (Linux)'; else if (isPDF) ftype='PDF 文件'; else if (isZIP) ftype='ZIP / OOXML';

  const struct = [
    ['掃描模式',   '檔案靜態分析'],
    ['檔案名稱',   file.name],
    ['檔案大小',   formatBytes(file.size)],
    ['副檔名',     `.${ext}`],
    ['格式識別',   ftype],
    ['熵值 (8KB)', `${entropy.toFixed(4)} / 8.0${entropy>7?' ⚠ 高熵 (加密/混淆)':''}`],
    ['Null 比例',  `${nullPct}%`],
    ['可列印字元', `${printPct}%`],
    ['SHA-256',    sha256.slice(0,24)+'…'],
  ];

  document.getElementById('malware-struct-tbody').innerHTML = struct.map(([k,v])=>
    `<tr><td class="td-key">${k}</td><td class="td-val" style="color:${k==='熵值 (8KB)'&&entropy>7?'var(--sev-med)':'var(--tx-1)'}">${v}</td></tr>`).join('');

  addLog('OK', '檔案結構解析完成');
  if (entropy > 7) addLog('WARN', `高熵值 ${entropy.toFixed(4)}，疑似加密或混淆內容`);

  const sigScore = runSigScan(bytes, addLog);
  const strScore = runStringScan(bytes, addLog);
  const total    = Math.min(100, sigScore + strScore);

  setVerdict(total);
  addLog(total>=60?'CRIT':total>=25?'WARN':'OK', `掃描完成 — 威脅分數 ${total}/100`, true);

  const platforms = buildFilePlatforms(sha256, md5Hash, sha1);
  initPlatformGrid(platforms);
  platforms.forEach(p => runPlatformLookup(p));

  setStatus(total>=60?'⚠ 偵測到威脅':total>=25?'注意：可疑特徵':'掃描完成');
  showToast(total>=60?`⚠ 高威脅 — 分數 ${total}`:`掃描完成 (${total})`, total>=60?'error':total>=25?'info':'success');
}

/* ─── URL 掃描 ─── */
async function scanURL(rawUrl) {
  document.getElementById('malware-results').classList.remove('hidden');
  setStatus('URL 威脅分析中...');

  const url  = rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;
  const logs = [];
  const addLog = (tag, m, hi=false) => { logs.push({t:logTime(),tag,m,hi}); renderLog(logs); };

  addLog('INFO', `目標 URL：${url}`);

  let parsed;
  try { parsed = new URL(url); } catch { addLog('CRIT','URL 格式無效'); return; }

  const struct = [
    ['掃描模式',  'URL 靜態分析'],
    ['協議',      parsed.protocol],
    ['主機名稱',  parsed.hostname],
    ['Port',      parsed.port || (parsed.protocol==='https:'?'443 (預設)':'80 (預設)')],
    ['路徑',      parsed.pathname || '/'],
    ['查詢參數',  parsed.search || '—'],
    ['Fragment',  parsed.hash || '—'],
    ['總長度',    `${url.length} 字元`],
  ];
  document.getElementById('malware-struct-tbody').innerHTML = struct.map(([k,v])=>
    `<tr><td class="td-key">${k}</td><td class="td-val" style="color:var(--tx-c)">${v}</td></tr>`).join('');
  addLog('OK', 'URL 結構解析完成');

  const riskHits = URL_RISK_RULES.filter(r => r.test(url));
  const urlScore = Math.min(100, riskHits.reduce((s,r)=>s+r.weight,0));

  const sigList = document.getElementById('sig-match-list');
  const strList = document.getElementById('suspicious-strings-list');

  sigList.innerHTML = riskHits.filter(h=>h.level==='crit').length === 0
    ? `<div class="sig-item level-pass"><span class="sig-item-icon" style="color:var(--sev-low)">✓</span><div class="sig-item-content"><div class="sig-item-name">無高風險 URL 特徵</div></div></div>`
    : riskHits.filter(h=>h.level==='crit').map(h=>`<div class="sig-item level-crit"><span class="sig-item-icon">☣</span><div class="sig-item-content"><div class="sig-item-name">${h.name}</div><div class="sig-item-desc">權重 +${h.weight}</div></div></div>`).join('');

  strList.innerHTML = riskHits.filter(h=>h.level!=='crit').length === 0
    ? `<div class="sig-item level-pass"><span class="sig-item-icon" style="color:var(--sev-low)">✓</span><div class="sig-item-content"><div class="sig-item-name">無中低風險特徵</div></div></div>`
    : riskHits.filter(h=>h.level!=='crit').map(h=>`<div class="sig-item level-${h.level}"><span class="sig-item-icon">${h.level==='warn'?'⚠':'ℹ'}</span><div class="sig-item-content"><div class="sig-item-name">${h.name}</div><div class="sig-item-desc">權重 +${h.weight}</div></div></div>`).join('');

  riskHits.forEach(h => addLog(h.level==='crit'?'CRIT':h.level==='warn'?'WARN':'INFO', `風險特徵：${h.name}`));

  setVerdict(urlScore);
  addLog(urlScore>=50?'CRIT':urlScore>=20?'WARN':'OK', `URL 分析完成 — 風險分數 ${urlScore}/100`, true);

  const platforms = buildURLPlatforms(url);
  initPlatformGrid(platforms);
  platforms.forEach(p => runPlatformLookup(p));

  setStatus(urlScore>=50?'⚠ 高風險 URL':`URL 分析完成 (${urlScore})`);
  showToast(urlScore>=50?`⚠ 高風險 URL — ${urlScore}分`:`URL 分析完成 (${urlScore})`, urlScore>=50?'error':urlScore>=20?'info':'success');
}

/* ─── 模組初始化 ─── */
function initMalwareModule() {
  const dropZone   = document.getElementById('malware-drop-zone');
  const fileInput  = document.getElementById('malware-file-input');
  const fileModeBtn = document.getElementById('scan-mode-file-btn');
  const urlModeBtn  = document.getElementById('scan-mode-url-btn');
  const filePanel   = document.getElementById('scan-panel-file');
  const urlPanel    = document.getElementById('scan-panel-url');
  const urlInput    = document.getElementById('malware-url-input');
  const urlScanBtn  = document.getElementById('malware-url-scan-btn');

  fileModeBtn.addEventListener('click', () => {
    fileModeBtn.classList.add('active'); urlModeBtn.classList.remove('active');
    fileModeBtn.setAttribute('aria-selected','true'); urlModeBtn.setAttribute('aria-selected','false');
    filePanel.classList.remove('hidden'); urlPanel.classList.add('hidden');
  });

  urlModeBtn.addEventListener('click', () => {
    urlModeBtn.classList.add('active'); fileModeBtn.classList.remove('active');
    urlModeBtn.setAttribute('aria-selected','true'); fileModeBtn.setAttribute('aria-selected','false');
    urlPanel.classList.remove('hidden'); filePanel.classList.add('hidden');
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('dragging');
    if (e.dataTransfer.files[0]) scanFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) scanFile(fileInput.files[0]); });

  urlScanBtn.addEventListener('click', () => {
    const v = urlInput.value.trim();
    if (!v) { showToast('請輸入 URL','error'); return; }
    scanURL(v);
  });
  urlInput.addEventListener('keydown', e => { if (e.key==='Enter') urlScanBtn.click(); });
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_02：Hash 分析器
═══════════════════════════════════════════════════════════════════ */

function initHashModule() {
  const drop  = document.getElementById('hash-drop-zone');
  const input = document.getElementById('hash-file-input');

  drop.addEventListener('click', ()=>input.click());
  drop.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' ')input.click();});
  drop.addEventListener('dragover', e=>{e.preventDefault();drop.classList.add('dragging');});
  drop.addEventListener('dragleave', ()=>drop.classList.remove('dragging'));
  drop.addEventListener('drop', e=>{e.preventDefault();drop.classList.remove('dragging');if(e.dataTransfer.files[0])processHashFile(e.dataTransfer.files[0]);});
  input.addEventListener('change', ()=>{if(input.files[0])processHashFile(input.files[0]);});

  document.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const cell=document.getElementById(btn.dataset.target);
      const tx=cell?.querySelector('.hash-text');
      if(!tx||tx.textContent==='—')return;
      navigator.clipboard.writeText(tx.textContent).then(()=>{
        btn.textContent='✓';btn.classList.add('copied');
        setTimeout(()=>{btn.textContent='⎘';btn.classList.remove('copied');},1500);
      });
    });
  });
}

async function processHashFile(file) {
  const results = document.getElementById('hash-results');
  const prog    = document.getElementById('hash-progress-area');
  const htable  = document.getElementById('hash-table');
  results.classList.remove('hidden');
  prog.classList.remove('hidden');
  htable.classList.add('hidden');

  document.getElementById('fi-name').textContent  = file.name;
  document.getElementById('fi-size').textContent  = formatBytes(file.size);
  document.getElementById('fi-mime').textContent  = file.type||'未知';
  document.getElementById('fi-mtime').textContent = new Date(file.lastModified).toLocaleString('zh-Hant');

  setStatus('計算雜湊中...');
  const buf = await file.arrayBuffer();
  const [s1,s256,m5] = await Promise.all([sha(buf,'SHA-1'),sha(buf,'SHA-256'),Promise.resolve(md5(buf))]);

  prog.classList.add('hidden'); htable.classList.remove('hidden');
  document.getElementById('h-md5').querySelector('.hash-text').textContent    = m5;
  document.getElementById('h-sha1').querySelector('.hash-text').textContent   = s1;
  document.getElementById('h-sha256').querySelector('.hash-text').textContent = s256;

  renderHexViewer(buf);
  setStatus('分析完成');
  showToast(`「${file.name}」分析完成`,'success');
}

function renderHexViewer(buffer) {
  const out   = document.getElementById('hex-output');
  const bytes = new Uint8Array(buffer.slice(0,2048));
  const lines = [];
  for (let i=0;i<bytes.length;i+=16) {
    const chunk = bytes.slice(i,i+16);
    const off   = i.toString(16).padStart(8,'0').toUpperCase();
    const hexP  = Array.from(chunk).map(b=>`<span class="${b===0?'hex-null':'hex-byte'}">${b.toString(16).padStart(2,'0').toUpperCase()}</span>`);
    while(hexP.length<16)hexP.push(`<span class="hex-null">  </span>`);
    const hex   = hexP.slice(0,8).join(' ')+'  '+hexP.slice(8).join(' ');
    const ascii = Array.from(chunk).map(b=>`<span class="hex-ascii">${(b>=0x20&&b<0x7f)?String.fromCharCode(b).replace(/&/g,'&amp;').replace(/</g,'&lt;'):'.'}</span>`).join('');
    lines.push(`<span class="hex-offset">${off}</span>  ${hex}  ${ascii}`);
  }
  out.innerHTML = lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_03：URL 安全深度檢查
═══════════════════════════════════════════════════════════════════ */

function initURLCheckModule() {
  document.getElementById('urlcheck-scan-btn').addEventListener('click', runURLCheck);
  document.getElementById('urlcheck-input').addEventListener('keydown', e=>{if(e.key==='Enter')runURLCheck();});
}

async function runURLCheck() {
  const raw = document.getElementById('urlcheck-input').value.trim();
  if(!raw){showToast('請輸入 URL','error');return;}

  const btn = document.getElementById('urlcheck-scan-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner">◌</span> 分析中...';
  document.getElementById('urlcheck-results').classList.remove('hidden');
  setStatus('URL 深度檢查中...');

  const url = raw.startsWith('http')?raw:'https://'+raw;
  renderURLStruct(url);
  const score = renderURLRisks(url);
  renderURLDecoded(url);
  renderURLExtLinks(url);
  await queryURLhaus(url, score);

  btn.disabled=false; btn.innerHTML='<span>⬡</span> 深度檢查';
  setStatus('URL 檢查完成');
}

function renderURLStruct(url) {
  const tbody = document.getElementById('url-struct-tbody');
  let p; try{p=new URL(url);}catch{tbody.innerHTML=`<tr><td colspan="2" class="empty-row">URL 格式無效</td></tr>`;return;}
  const rows=[['協議',p.protocol],['主機名稱',p.hostname],['Port',p.port||(p.protocol==='https:'?'443':'80')],['路徑',p.pathname||'/'],['查詢參數',p.search||'—'],['Fragment',p.hash||'—'],['總長度',`${url.length} 字元`]];
  tbody.innerHTML=rows.map(([k,v])=>`<tr><td class="td-key">${k}</td><td class="td-val" style="color:var(--tx-c)">${v}</td></tr>`).join('');
}

function renderURLRisks(url) {
  const riskList = document.getElementById('url-risk-list');
  const hits = URL_RISK_RULES.filter(r=>r.test(url));
  const score = Math.min(100, hits.reduce((s,r)=>s+r.weight,0));
  updateURLVerdict(score);

  riskList.innerHTML = hits.length===0
    ? `<div class="sig-item level-pass"><span class="sig-item-icon" style="color:var(--sev-low)">✓</span><div class="sig-item-content"><div class="sig-item-name">無已知風險特徵</div><div class="sig-item-desc">已套用 ${URL_RISK_RULES.length} 條規則</div></div></div>`
    : hits.map(h=>`<div class="sig-item level-${h.level}"><span class="sig-item-icon">${h.level==='crit'?'☣':h.level==='warn'?'⚠':'ℹ'}</span><div class="sig-item-content"><div class="sig-item-name">${h.name}</div><div class="sig-item-desc">風險權重 +${h.weight}</div></div></div>`).join('');
  return score;
}

function updateURLVerdict(score) {
  const banner=document.getElementById('url-verdict-banner');
  const icon  =document.getElementById('url-verdict-icon');
  const title =document.getElementById('url-verdict-title');
  const sub   =document.getElementById('url-verdict-sub');
  const sc    =document.getElementById('url-verdict-score');
  banner.className='verdict-banner '+(score>=50?'verdict-danger':score>=20?'verdict-suspect':'verdict-clean');
  sc.textContent=score;
  if(score>=50){icon.textContent='☣';title.textContent='⚠ 高風險 URL';sub.textContent='命中多條高風險規則，強烈建議不要造訪此 URL。';}
  else if(score>=20){icon.textContent='⚠';title.textContent='可疑 URL';sub.textContent='發現可疑特徵，建議搭配黑名單查詢後再決定是否造訪。';}
  else{icon.textContent='✓';title.textContent='未發現明顯風險';sub.textContent='靜態特徵未命中已知規則，仍建議搭配黑名單查詢確認。';}
}

async function queryURLhaus(url, localScore) {
  const el = document.getElementById('urlhaus-result');
  el.innerHTML='<div class="urlhaus-unknown"><span class="spinner">◌</span> 查詢中...</div>';
  try{
    const res=await fetch('https://urlhaus-api.abuse.ch/v1/url/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`url=${encodeURIComponent(url)}`});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const d=await res.json();
    if(d.query_status==='no_results'){el.innerHTML='<div class="urlhaus-clean">✓ URLhaus 查無惡意記錄</div>';return;}
    if(d.url_status==='online'||d.url_status==='unknown'){
      el.innerHTML=`<div class="urlhaus-danger">☣ URLhaus 已列入黑名單<br><span style="font-size:10px;color:var(--tx-2);display:block;margin-top:5px;">狀態：${d.url_status} · 威脅：${(d.tags||[]).join(', ')||'未分類'}</span></div>`;
      return;
    }
    el.innerHTML=`<div class="urlhaus-unknown">狀態：${d.query_status||'未知'}</div>`;
  }catch(err){el.innerHTML=`<div class="urlhaus-unknown">查詢失敗：${err.message}<br><span style="font-size:10px;color:var(--tx-3);display:block;margin-top:4px;">可能受 CORS 限制，建議透過後端代理串接</span></div>`;}
}

function renderURLDecoded(url) {
  const panel=document.getElementById('url-decoded-panel');
  let d1='',d2='';
  try{d1=decodeURIComponent(url);}catch{d1=url;}
  try{d2=decodeURIComponent(d1);}catch{d2=d1;}
  const rows=[['原始 URL',url],['URI 解碼 (1)',d1!==url?d1:'(無需解碼)'],['URI 解碼 (2)',d2!==d1?d2:'(無需二次解碼)']];
  panel.innerHTML=rows.map(([k,v])=>`<div class="decoded-row"><span class="decoded-key">${k}</span><span class="decoded-val">${v.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></div>`).join('');
}

function renderURLExtLinks(url) {
  const e=encodeURIComponent;
  let host='';try{host=new URL(url).hostname;}catch{host=url;}
  const tools=[
    {n:'Google Safe Browsing',   href:`https://transparencyreport.google.com/safe-browsing/search?url=${e(url)}`},
    {n:'VirusTotal URL',         href:`https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g,'')}/detection`},
    {n:'URLhaus',                href:`https://urlhaus.abuse.ch/browse.php?search=${e(url)}`},
    {n:'Sucuri SiteCheck',       href:`https://sitecheck.sucuri.net/results/${e(host)}`},
    {n:'AlienVault OTX',         href:`https://otx.alienvault.com/indicator/domain/${host}`},
    {n:'Web of Trust (WOT)',     href:`https://www.mywot.com/scorecard/${e(host)}`},
  ];
  document.getElementById('url-external-links').innerHTML=tools.map(t=>`<div class="ext-link-item"><span class="ext-link-name">${t.n}</span><button class="ext-link-btn" onclick="window.open('${t.href}','_blank','noopener')">開啟 →</button></div>`).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_04：隱私脫敏器
═══════════════════════════════════════════════════════════════════ */

let currentMetaFile = null;

function initMetaModule() {
  const drop  = document.getElementById('meta-drop-zone');
  const input = document.getElementById('meta-file-input');
  drop.addEventListener('click',()=>input.click());
  drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')input.click();});
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))processMetaFile(f);else showToast('請上傳有效圖片','error');});
  input.addEventListener('change',()=>{if(input.files[0])processMetaFile(input.files[0]);});
  document.getElementById('sanitize-btn').addEventListener('click',sanitizeImage);
}

async function processMetaFile(file) {
  currentMetaFile=file;
  document.getElementById('meta-results').classList.remove('hidden');
  const url=URL.createObjectURL(file);
  const img=document.getElementById('meta-preview-img');
  img.src=url;
  img.onload=()=>{document.getElementById('prev-dimensions').textContent=`${img.naturalWidth}×${img.naturalHeight}px`;};
  document.getElementById('prev-filename').textContent=file.name;
  document.getElementById('sanitize-status').classList.add('hidden');
  const buf=await file.arrayBuffer();
  renderExifTable(extractEXIF(new DataView(buf)));
  setStatus('EXIF 解析完成');
}

function extractEXIF(dv) {
  const res=[];
  if(dv.getUint16(0)!==0xFFD8)return res;
  let off=2;
  while(off<dv.byteLength-1){
    if(dv.getUint8(off)!==0xFF)break;
    const mk=dv.getUint16(off);off+=2;
    if(mk===0xFFE1){const sl=dv.getUint16(off);if(dv.getUint32(off+2)===0x45786966)parseIFD(dv,off+10,res);off+=sl;}
    else if(mk>=0xFFE0&&mk<=0xFFEF)off+=dv.getUint16(off);
    else break;
  }
  return res;
}

function parseIFD(dv,xs,res){
  try{
    const ts=xs-2;const le=dv.getUint16(ts)===0x4949;
    const r16=o=>dv.getUint16(ts+o,le);const r32=o=>dv.getUint32(ts+o,le);
    const defs={0x010F:['設備製造商','低','🏭'],0x0110:['設備型號','中','📱'],0x0132:['拍攝時間','高','🕐'],0x013B:['作者','高','👤'],0x8825:['GPS IFD','極高','📍'],0x9003:['原始拍攝時間','高','🕐'],0x9c9d:['作者名稱','高','👤'],0xA430:['相機擁有者','高','👤'],0xA431:['相機序號','高','🔢'],0x0112:['圖片方向','低','↔']};
    const io=r32(4);
    for(let i=0;i<Math.min(r16(io),64);i++){
      const eo=io+2+i*12;const tag=r16(eo);const type=r16(eo+2);
      if(!defs[tag])continue;
      let val='(無法解析)';
      try{
        if(type===2){const c=r32(eo+4);const vo=c<=4?eo+8:r32(eo+8);const ch=[];for(let j=0;j<Math.min(c-1,256);j++){const cc=dv.getUint8(ts+vo+j);if(!cc)break;ch.push(String.fromCharCode(cc));}val=ch.join('').trim()||'(空白)';}
        else if(type===3)val=r16(eo+8).toString();
        else if(type===4)val=r32(eo+8).toString();
        else if(type===5){const vo=r32(eo+8);const dd=r32(vo+4);val=dd?(r32(vo)/dd).toFixed(4):'∞';}
      }catch(_){}
      if(tag===0x8825)val='⚠ GPS 數據存在 — 包含精確位置';
      const[n,r,ic]=defs[tag];res.push({tag:'0x'+tag.toString(16).toUpperCase().padStart(4,'0'),name:n,value:val,risk:r,icon:ic});
    }
  }catch(err){res.push({tag:'—',name:'解析錯誤',value:err.message,risk:'—',icon:'⚠'});}
}

function renderExifTable(data){
  const tbody=document.getElementById('exif-tbody');const banner=document.getElementById('exif-risk-banner');
  if(!data.length){tbody.innerHTML='<tr><td colspan="3" class="empty-row">未發現 EXIF 資訊</td></tr>';banner.classList.add('hidden');return;}
  const highRisk=data.filter(d=>d.risk==='極高'||d.risk==='高').length;
  const hasGPS=data.some(d=>d.name.includes('GPS'));
  if(hasGPS||highRisk>0){banner.classList.remove('hidden');banner.innerHTML=`⚠ 發現 ${highRisk} 個高風險隱私欄位${hasGPS?'，包含 GPS 定位':''}`;}else banner.classList.add('hidden');
  const rm={極高:'tag-crit',高:'tag-warn',中:'tag-info',低:'tag-pass'};
  tbody.innerHTML=data.map(d=>`<tr><td style="font-size:11px;color:var(--tx-2)">${d.icon} ${d.name}<br><span style="color:var(--tx-3);font-size:10px">${d.tag}</span></td><td style="font-size:11px;color:var(--tx-c);word-break:break-all">${d.value}</td><td><span class="tag ${rm[d.risk]||''}">${d.risk}</span></td></tr>`).join('');
}

async function sanitizeImage(){
  if(!currentMetaFile){showToast('請先上傳圖片','error');return;}
  const btn=document.getElementById('sanitize-btn');const st=document.getElementById('sanitize-status');
  btn.disabled=true;btn.innerHTML='<span class="spinner">◌</span> 脫敏中...';
  await new Promise(r=>setTimeout(r,50));
  const img=new Image();const ou=URL.createObjectURL(currentMetaFile);img.src=ou;
  img.onload=()=>{
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);URL.revokeObjectURL(ou);
    const ext=currentMetaFile.name.split('.').pop().toLowerCase();const mime=ext==='png'?'image/png':'image/jpeg';
    c.toBlob(blob=>{const cu=URL.createObjectURL(blob);const a=document.createElement('a');a.href=cu;a.download=`${currentMetaFile.name.replace(/\.[^/.]+$,'')}_sanitized.${ext}`;a.click();URL.revokeObjectURL(cu);
      btn.disabled=false;btn.innerHTML='<span>⬡</span> 一鍵脫敏 & 下載';
      st.classList.remove('hidden');st.innerHTML=`✓ 脫敏完成 (${formatBytes(blob.size)}) · 所有 Metadata 已抹除`;
      showToast('脫敏完成，已自動下載','success');},mime,0.95);
  };
  img.onerror=()=>{btn.disabled=false;btn.innerHTML='<span>⬡</span> 一鍵脫敏 & 下載';showToast('圖片載入失敗','error');};
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_05：OSINT
═══════════════════════════════════════════════════════════════════ */

function initOSINTModule(){
  document.getElementById('osint-scan-btn').addEventListener('click',startOSINT);
  document.getElementById('osint-input').addEventListener('keydown',e=>{if(e.key==='Enter')startOSINT();});
  document.querySelectorAll('.dns-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.dns-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');
      const d=extractDomain(document.getElementById('osint-input').value.trim());
      if(d)queryDNS(d,tab.dataset.type);
    });
  });
}

function extractDomain(raw){if(!raw)return'';try{return new URL(raw.startsWith('http')?raw:'https://'+raw).hostname;}catch{return raw.replace(/[^a-zA-Z0-9.\-:]/g,'');}}

async function startOSINT(){
  const raw=document.getElementById('osint-input').value.trim();if(!raw){showToast('請輸入目標','error');return;}
  const btn=document.getElementById('osint-scan-btn');btn.disabled=true;btn.innerHTML='<span class="spinner">◌</span> 掃描中...';
  document.getElementById('osint-results').classList.remove('hidden');setStatus('OSINT 掃描中...');
  const domain=extractDomain(raw);
  renderSecHeaders(domain);await queryDNS(domain,'A');renderOSINTReport(domain,raw);
  btn.disabled=false;btn.innerHTML='<span>◎</span> 開始掃描';setStatus('掃描完成');showToast(`${domain} 掃描完成`,'success');
}

function renderSecHeaders(domain){
  const tbody=document.getElementById('headers-tbody');
  const hdrs=[{n:'Content-Security-Policy',a:'CSP',d:'防 XSS / 資料注入'},{n:'Strict-Transport-Security',a:'HSTS',d:'強制 HTTPS'},{n:'X-Frame-Options',a:'XFO',d:'防 Clickjacking'},{n:'X-Content-Type-Options',a:'XCTO',d:'防 MIME 嗅探'},{n:'Referrer-Policy',a:'RP',d:'控制 Referrer 洩露'},{n:'Permissions-Policy',a:'PP',d:'限制瀏覽器功能'}];
  tbody.innerHTML=hdrs.map(h=>`<tr><td style="font-size:11px"><span style="font-weight:500;color:var(--tx-1)">${h.a}</span><br><span style="font-size:10px;color:var(--tx-3)">${h.n}</span></td><td><span class="tag tag-info">查詢中</span></td><td style="font-size:11px;color:var(--tx-2)">${h.d}</td></tr>`).join('');
  fetchSecHeaders(domain,hdrs,tbody);
}

async function fetchSecHeaders(domain,hdrs,tbody){
  const sim={CSP:false,HSTS:true,XFO:true,XCTO:true,RP:false,PP:false};
  try{
    const res=await fetch(`https://api.securityheaders.com/?q=${encodeURIComponent(domain)}&followRedirects=on&hide=on`,{mode:'cors'});
    if(res.ok){const p={};res.headers.forEach((v,k)=>{p[k.toLowerCase()]=v;});
      const rows=tbody.querySelectorAll('tr');hdrs.forEach((h,i)=>{const found=p[h.n.toLowerCase()]!==undefined;if(rows[i])rows[i].querySelectorAll('td')[1].innerHTML=found?`<span class="tag tag-pass">✓ 已配置</span>`:`<span class="tag tag-crit">✗ 缺失</span>`;});return;}}catch(_){}
  const rows=tbody.querySelectorAll('tr');
  hdrs.forEach((h,i)=>{const ok=sim[h.a];if(rows[i])rows[i].querySelectorAll('td')[1].innerHTML=(ok?`<span class="tag tag-pass">✓ 已配置</span>`:`<span class="tag tag-crit">✗ 缺失</span>`)+`<span style="font-size:9px;color:var(--tx-3);display:block">(示範)</span>`;});
}

async function queryDNS(domain,type){
  const area=document.getElementById('dns-results-area');
  area.innerHTML=`<div class="loading-state" style="padding:14px"><span class="spinner">◌</span> 查詢 ${type}...</div>`;
  try{const res=await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`);if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const d=await res.json();if(!d.Answer?.length){area.innerHTML=`<div class="empty-state">無 ${type} 記錄</div>`;return;}
    const tm={1:'A',2:'NS',5:'CNAME',6:'SOA',15:'MX',16:'TXT',28:'AAAA',33:'SRV'};
    area.innerHTML=d.Answer.map(r=>`<div class="dns-record"><span class="dns-record-type">${tm[r.type]||r.type}</span><span class="dns-record-value">${r.data.replace(/"/g,'')}</span><span class="dns-record-ttl">TTL:${r.TTL}s</span></div>`).join('');
  }catch(err){area.innerHTML=`<div style="padding:10px;font-size:11px;color:var(--tx-2)"><span class="tag tag-warn">⚠</span> 查詢失敗：${err.message}</div>`;}
}

function renderOSINTReport(domain,raw){
  const c=document.getElementById('osint-report');
  const isIP=/^(\d{1,3}\.){3}\d{1,3}$/.test(domain);const https=raw.toLowerCase().startsWith('https://');const depth=(domain.match(/\./g)||[]).length;
  const items=[
    {l:'連線協議',v:https?'✓ HTTPS':'✗ HTTP',cls:https?'tag-pass':'tag-crit'},
    {l:'目標類型',v:isIP?'📍 IP 位址':'🌐 域名',cls:'tag-info'},
    {l:'子域名深度',v:depth<=1?`${depth} 層 (正常)`:`${depth} 層 (注意)`,cls:depth<=1?'tag-pass':'tag-warn'},
    {l:'域名長度',v:domain.length>30?`${domain.length}字元 (偏長)`:`${domain.length}字元`,cls:domain.length>30?'tag-warn':'tag-pass'},
    {l:'數字混淆',v:/\d{4,}/.test(domain)?'⚠ 含大量數字':'✓ 正常',cls:/\d{4,}/.test(domain)?'tag-warn':'tag-pass'},
    {l:'DNS 服務',v:'✓ Google DoH',cls:'tag-info'},
  ];
  c.innerHTML=items.map(it=>`<div class="report-item"><div class="report-item-label">${it.l}</div><div><span class="tag ${it.cls}" style="font-size:11px">${it.v}</span></div></div>`).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   MOD_06：CVE
═══════════════════════════════════════════════════════════════════ */

function initCVEModule(){
  document.getElementById('cve-search-btn').addEventListener('click',searchCVE);
  document.getElementById('cve-input').addEventListener('keydown',e=>{if(e.key==='Enter')searchCVE();});
}

async function searchCVE(){
  const kw=document.getElementById('cve-input').value.trim();if(!kw){showToast('請輸入搜尋關鍵字','error');return;}
  const btn=document.getElementById('cve-search-btn');const loading=document.getElementById('cve-loading');const tbody=document.getElementById('cve-tbody');
  btn.disabled=true;btn.innerHTML='<span class="spinner">◌</span> 搜尋中...';
  document.getElementById('cve-results').classList.remove('hidden');loading.classList.remove('hidden');tbody.innerHTML='';setStatus('查詢 NVD...');
  const isCVE=/^CVE-\d{4}-\d+$/i.test(kw);
  const url=isCVE?`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(kw.toUpperCase())}`:`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(kw)}&resultsPerPage=20`;
  try{
    const res=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!res.ok)throw new Error(res.status===429?'速率限制，請稍後再試':`HTTP ${res.status}`);
    const d=await res.json();loading.classList.add('hidden');if(!d.vulnerabilities)throw new Error('回應格式錯誤');
    renderCVE(d.vulnerabilities,d.totalResults||0,kw);setStatus(`找到 ${d.totalResults} 個漏洞`);showToast(`找到 ${d.totalResults} 個漏洞`,d.totalResults>0?'success':'info');
  }catch(err){loading.classList.add('hidden');tbody.innerHTML=`<tr><td colspan="5" class="empty-row" style="padding:24px"><div style="color:var(--tx-2)">⚠ 查詢失敗：${err.message}</div><div style="color:var(--tx-3);font-size:10px;margin-top:5px">建議透過後端代理串接 NVD API</div></td></tr>`;showToast('NVD 查詢失敗','error');}
  btn.disabled=false;btn.innerHTML='<span>◇</span> 搜尋漏洞';
}

function cvssInfo(cve){const m=cve.metrics;if(!m)return{score:null,sev:'UNKNOWN'};const d=m.cvssMetricV31?.[0]?.cvssData||m.cvssMetricV30?.[0]?.cvssData||m.cvssMetricV2?.[0]?.cvssData;if(!d)return{score:null,sev:'UNKNOWN'};return{score:d.baseScore,sev:d.baseSeverity||(d.baseScore>=9?'CRITICAL':d.baseScore>=7?'HIGH':d.baseScore>=4?'MEDIUM':'LOW')};}
function cvssClass(s){if(s===null)return'cvss-none';if(s>=9)return'cvss-critical';if(s>=7)return'cvss-high';if(s>=4)return'cvss-medium';return'cvss-low';}
function sevLabel(s){const m={CRITICAL:['CRITICAL','tag-crit'],HIGH:['HIGH','tag-warn'],MEDIUM:['MEDIUM','tag-info'],LOW:['LOW','tag-pass'],UNKNOWN:['N/A','']};const[l,c]=m[s?.toUpperCase()]||m.UNKNOWN;return`<span class="tag ${c}">${l}</span>`;}

function renderCVE(vs,total,kw){
  document.getElementById('cve-total-count').textContent=`找到 ${total.toLocaleString()} 個 (顯示前 ${vs.length} 筆)`;
  const cnts={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};vs.forEach(v=>{const k=cvssInfo(v.cve).sev?.toUpperCase();if(cnts[k]!==undefined)cnts[k]++;});
  const cm={CRITICAL:'var(--sev-crit)',HIGH:'var(--sev-high)',MEDIUM:'var(--sev-med)',LOW:'var(--sev-low)'};
  document.getElementById('cve-severity-counts').innerHTML=Object.entries(cnts).map(([l,n])=>`<span class="sev-badge"><span class="sev-dot" style="background:${cm[l]}"></span><span style="color:${cm[l]}">${l}:${n}</span></span>`).join('');
  if(!vs.length){document.getElementById('cve-tbody').innerHTML=`<tr><td colspan="5" class="empty-row">未找到「${kw}」相關漏洞</td></tr>`;return;}
  document.getElementById('cve-tbody').innerHTML=vs.map(item=>{
    const cve=item.cve;const{score,sev}=cvssInfo(cve);
    const desc=cve.descriptions?.find(d=>d.lang==='zh')?.value||cve.descriptions?.find(d=>d.lang==='en')?.value||'無描述';
    const pub=cve.published?new Date(cve.published).toLocaleDateString('zh-Hant'):'—';
    return`<tr><td><a class="cve-id-link" href="https://nvd.nist.gov/vuln/detail/${cve.id}" target="_blank" rel="noopener">${cve.id}</a></td><td><span class="cvss-score ${cvssClass(score)}">${score!==null?score.toFixed(1):'N/A'}</span></td><td>${sevLabel(sev)}</td><td><div class="cve-desc-text">${desc}</div></td><td style="font-size:11px;color:var(--tx-2)">${pub}</td></tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   PWA + 初始化
═══════════════════════════════════════════════════════════════════ */

function registerSW(){
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initMalwareModule();
  initHashModule();
  initURLCheckModule();
  initMetaModule();
  initOSINTModule();
  initCVEModule();
  registerSW();
  updateClock();
  setInterval(updateClock, 1000);
  setStatus('系統就緒');
});
