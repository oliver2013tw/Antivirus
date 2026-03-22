'use strict';

/* ═══════════════════════════════════════════════════════════════════
   PROJECT SENTINEL — app.js  v2.6.0
   全方位數位安全與隱私檢測站
═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   全域工具函式
───────────────────────────────────────────── */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.35s ease';
    setTimeout(() => toast.remove(), 360);
  }, 3000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function updateStatusText(text) {
  const el = document.getElementById('status-text');
  if (el) el.textContent = text;
}

function updateFooterClock() {
  const el = document.getElementById('footer-clock');
  if (!el) return;
  el.textContent = new Date().toLocaleString('zh-Hant', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}

function logTime() {
  return new Date().toLocaleTimeString('zh-Hant', { hour12: false });
}

/* ─────────────────────────────────────────────
   導覽切換
───────────────────────────────────────────── */

function initNavigation() {
  const tabs    = document.querySelectorAll('.nav-tab');
  const modules = document.querySelectorAll('.module');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      modules.forEach(m => {
        if (m.id === target) { m.classList.remove('hidden'); m.classList.add('active'); }
        else                 { m.classList.add('hidden');    m.classList.remove('active'); }
      });
      tab.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   模組一：進階靜態檔案與 Hash 分析器
═══════════════════════════════════════════════════════════════════ */

function initHashModule() {
  const dropZone  = document.getElementById('hash-drop-zone');
  const fileInput = document.getElementById('hash-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) processHashFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) processHashFile(fileInput.files[0]);
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cell   = document.getElementById(btn.dataset.target);
      const textEl = cell?.querySelector('.hash-text');
      if (!textEl || textEl.textContent === '—') return;
      navigator.clipboard.writeText(textEl.textContent).then(() => {
        btn.textContent = '✓'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '⎘'; btn.classList.remove('copied'); }, 1500);
      });
    });
  });
}

async function processHashFile(file) {
  const resultsPanel = document.getElementById('hash-results');
  const progressArea = document.getElementById('hash-progress-area');
  const hashTable    = document.getElementById('hash-table');

  resultsPanel.classList.remove('hidden');
  progressArea.classList.remove('hidden');
  hashTable.classList.add('hidden');

  document.getElementById('fi-name').textContent  = file.name;
  document.getElementById('fi-size').textContent  = formatFileSize(file.size);
  document.getElementById('fi-mime').textContent  = file.type || '未知';
  document.getElementById('fi-mtime').textContent = new Date(file.lastModified).toLocaleString('zh-Hant');

  updateStatusText('計算雜湊中...');
  const buffer = await file.arrayBuffer();

  const [sha1Result, sha256Result, md5Result] = await Promise.all([
    calculateFileHash(buffer, 'SHA-1'),
    calculateFileHash(buffer, 'SHA-256'),
    calculateMD5(buffer)
  ]);

  progressArea.classList.add('hidden');
  hashTable.classList.remove('hidden');

  document.getElementById('h-md5').querySelector('.hash-text').textContent    = md5Result;
  document.getElementById('h-sha1').querySelector('.hash-text').textContent   = sha1Result;
  document.getElementById('h-sha256').querySelector('.hash-text').textContent = sha256Result;

  renderHexViewer(buffer);
  updateStatusText('分析完成');
  showToast(`「${file.name}」分析完成`, 'success');
}

async function calculateFileHash(buffer, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  return bufferToHex(hashBuffer);
}

async function calculateMD5(buffer) {
  const data = new Uint8Array(buffer);
  return md5Core(uint8ArrayToWordArray(data), data.length * 8);
}

function uint8ArrayToWordArray(u8arr) {
  const words = [];
  for (let i = 0; i < u8arr.length; i++) words[i >>> 2] |= u8arr[i] << (24 - (i % 4) * 8);
  return words;
}

function md5Core(words, bitLength) {
  const W = [...words];
  const nBytes = bitLength / 8;
  W[nBytes >> 2] |= 0x80 << (24 - (nBytes % 4) * 8);
  W[(((nBytes + 64) >> 9) << 4) + 14] = bitLength >>> 0;

  let a =  1732584193, b = -271733879, c = -1732584194, d = 271733878;
  const T = new Int32Array(64);
  for (let i = 0; i < 64; i++) T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;

  const FF = (a,b,c,d,x,s,t) => { const n=a+((b&c)|(~b&d))+(x>>>0)+t; return ((n<<s)|(n>>>(32-s)))+b; };
  const GG = (a,b,c,d,x,s,t) => { const n=a+((b&d)|(c&~d))+(x>>>0)+t; return ((n<<s)|(n>>>(32-s)))+b; };
  const HH = (a,b,c,d,x,s,t) => { const n=a+(b^c^d)+(x>>>0)+t;         return ((n<<s)|(n>>>(32-s)))+b; };
  const II = (a,b,c,d,x,s,t) => { const n=a+(c^(b|~d))+(x>>>0)+t;       return ((n<<s)|(n>>>(32-s)))+b; };

  for (let i = 0; i < W.length; i += 16) {
    const M = j => {
      const v = W[i+j];
      return ((v>>>24)&0xff)|((v>>>8)&0xff00)|((v&0xff00)<<8)|((v&0xff)<<24);
    };
    let [aa,bb,cc,dd] = [a,b,c,d];

    a=FF(a,b,c,d,M(0), 7,T[0]);  d=FF(d,a,b,c,M(1),12,T[1]);  c=FF(c,d,a,b,M(2),17,T[2]);  b=FF(b,c,d,a,M(3),22,T[3]);
    a=FF(a,b,c,d,M(4), 7,T[4]);  d=FF(d,a,b,c,M(5),12,T[5]);  c=FF(c,d,a,b,M(6),17,T[6]);  b=FF(b,c,d,a,M(7),22,T[7]);
    a=FF(a,b,c,d,M(8), 7,T[8]);  d=FF(d,a,b,c,M(9),12,T[9]);  c=FF(c,d,a,b,M(10),17,T[10]); b=FF(b,c,d,a,M(11),22,T[11]);
    a=FF(a,b,c,d,M(12),7,T[12]); d=FF(d,a,b,c,M(13),12,T[13]); c=FF(c,d,a,b,M(14),17,T[14]); b=FF(b,c,d,a,M(15),22,T[15]);

    a=GG(a,b,c,d,M(1), 5,T[16]); d=GG(d,a,b,c,M(6), 9,T[17]); c=GG(c,d,a,b,M(11),14,T[18]); b=GG(b,c,d,a,M(0),20,T[19]);
    a=GG(a,b,c,d,M(5), 5,T[20]); d=GG(d,a,b,c,M(10),9,T[21]); c=GG(c,d,a,b,M(15),14,T[22]); b=GG(b,c,d,a,M(4),20,T[23]);
    a=GG(a,b,c,d,M(9), 5,T[24]); d=GG(d,a,b,c,M(14),9,T[25]); c=GG(c,d,a,b,M(3), 14,T[26]); b=GG(b,c,d,a,M(8),20,T[27]);
    a=GG(a,b,c,d,M(13),5,T[28]); d=GG(d,a,b,c,M(2), 9,T[29]); c=GG(c,d,a,b,M(7), 14,T[30]); b=GG(b,c,d,a,M(12),20,T[31]);

    a=HH(a,b,c,d,M(5), 4,T[32]); d=HH(d,a,b,c,M(8),11,T[33]); c=HH(c,d,a,b,M(11),16,T[34]); b=HH(b,c,d,a,M(14),23,T[35]);
    a=HH(a,b,c,d,M(1), 4,T[36]); d=HH(d,a,b,c,M(4),11,T[37]); c=HH(c,d,a,b,M(7), 16,T[38]); b=HH(b,c,d,a,M(10),23,T[39]);
    a=HH(a,b,c,d,M(13),4,T[40]); d=HH(d,a,b,c,M(0),11,T[41]); c=HH(c,d,a,b,M(3), 16,T[42]); b=HH(b,c,d,a,M(6),23,T[43]);
    a=HH(a,b,c,d,M(9), 4,T[44]); d=HH(d,a,b,c,M(12),11,T[45]); c=HH(c,d,a,b,M(15),16,T[46]); b=HH(b,c,d,a,M(2),23,T[47]);

    a=II(a,b,c,d,M(0), 6,T[48]); d=II(d,a,b,c,M(7),10,T[49]); c=II(c,d,a,b,M(14),15,T[50]); b=II(b,c,d,a,M(5),21,T[51]);
    a=II(a,b,c,d,M(12),6,T[52]); d=II(d,a,b,c,M(3),10,T[53]); c=II(c,d,a,b,M(10),15,T[54]); b=II(b,c,d,a,M(1),21,T[55]);
    a=II(a,b,c,d,M(8), 6,T[56]); d=II(d,a,b,c,M(15),10,T[57]); c=II(c,d,a,b,M(6),15,T[58]); b=II(b,c,d,a,M(13),21,T[59]);
    a=II(a,b,c,d,M(4), 6,T[60]); d=II(d,a,b,c,M(11),10,T[61]); c=II(c,d,a,b,M(2),15,T[62]); b=II(b,c,d,a,M(9),21,T[63]);

    a=(a+aa)|0; b=(b+bb)|0; c=(c+cc)|0; d=(d+dd)|0;
  }

  const le = n => {
    const u = n >>> 0;
    return [u&0xff,(u>>8)&0xff,(u>>16)&0xff,(u>>24)&0xff].map(b=>b.toString(16).padStart(2,'0')).join('');
  };
  return le(a)+le(b)+le(c)+le(d);
}

function renderHexViewer(buffer) {
  const output = document.getElementById('hex-output');
  const bytes  = new Uint8Array(buffer.slice(0, 2048));
  const lines  = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk  = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();

    const hexParts = Array.from(chunk).map(b => {
      const hex = b.toString(16).padStart(2, '0').toUpperCase();
      return `<span class="${b === 0 ? 'hex-null' : 'hex-byte'}">${hex}</span>`;
    });
    while (hexParts.length < 16) hexParts.push(`<span class="hex-null">  </span>`);
    const hexStr = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');

    const asciiStr = Array.from(chunk).map(b => {
      const ch = (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b).replace(/&/g,'&amp;').replace(/</g,'&lt;') : '.';
      return `<span class="hex-ascii">${ch}</span>`;
    }).join('');

    lines.push(`<span class="hex-offset">${offset}</span>  ${hexStr}  ${asciiStr}`);
  }
  output.innerHTML = lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   模組二：惡意軟體靜態偵測引擎
═══════════════════════════════════════════════════════════════════ */

const MALWARE_SIGNATURES = [
  { name: 'Metasploit Shellcode',     pattern: [0x90,0x90,0x90,0xcc],          offset: null, weight: 35, level: 'crit' },
  { name: 'PE MZ Header',             pattern: [0x4D,0x5A],                    offset: 0,    weight: 5,  level: 'info' },
  { name: 'ELF Magic',                pattern: [0x7F,0x45,0x4C,0x46],          offset: 0,    weight: 5,  level: 'info' },
  { name: 'PDF Header',               pattern: [0x25,0x50,0x44,0x46],          offset: 0,    weight: 2,  level: 'info' },
  { name: 'ZIP / Office OpenXML',     pattern: [0x50,0x4B,0x03,0x04],          offset: 0,    weight: 2,  level: 'info' },
  { name: 'Mach-O 64-bit Binary',     pattern: [0xCF,0xFA,0xED,0xFE],          offset: 0,    weight: 5,  level: 'info' },
  { name: 'EICAR Test Signature',     pattern: [0x58,0x35,0x4F,0x21,0x50,0x25,0x40,0x41,0x50,0x5B,0x34,0x5C,0x50,0x5A,0x58,0x35,0x34,0x28,0x50,0x5E,0x29,0x37,0x43,0x43,0x29,0x37,0x7D,0x24,0x45,0x49,0x43,0x41,0x52,0x2D,0x53,0x54,0x41,0x4E,0x44,0x41,0x52,0x44,0x2D,0x41,0x4E,0x54,0x49,0x56,0x49,0x52,0x55,0x53,0x2D,0x54,0x45,0x53,0x54,0x2D,0x46,0x49,0x4C,0x45,0x21,0x24,0x48,0x2B,0x48,0x2A], offset: 0, weight: 100, level: 'crit' },
  { name: 'VBScript Dropper Pattern', pattern: [0x57,0x53,0x63,0x72,0x69,0x70,0x74,0x2E,0x53,0x68,0x65,0x6C,0x6C], offset: null, weight: 40, level: 'crit' },
  { name: 'PowerShell Encoded CMD',   pattern: [0x2D,0x65,0x6E,0x63,0x6F,0x64,0x65,0x64,0x43,0x6F,0x6D,0x6D,0x61,0x6E,0x64], offset: null, weight: 45, level: 'crit' },
  { name: 'AutoRun INF Marker',       pattern: [0x5B,0x61,0x75,0x74,0x6F,0x72,0x75,0x6E,0x5D], offset: null, weight: 30, level: 'warn' },
];

const SUSPICIOUS_STRING_PATTERNS = [
  { pattern: /cmd\.exe/i,                    name: 'CMD 執行器呼叫',         level: 'crit', weight: 25 },
  { pattern: /powershell/i,                  name: 'PowerShell 呼叫',        level: 'crit', weight: 25 },
  { pattern: /WScript\.Shell/i,              name: 'WScript Shell 物件',     level: 'crit', weight: 30 },
  { pattern: /CreateObject/i,                name: 'COM 物件建立',           level: 'warn', weight: 20 },
  { pattern: /Shell\.Application/i,          name: 'Shell Application 物件', level: 'crit', weight: 30 },
  { pattern: /HKEY_LOCAL_MACHINE/i,          name: '登錄機碼存取 (HKLM)',    level: 'warn', weight: 20 },
  { pattern: /HKEY_CURRENT_USER/i,           name: '登錄機碼存取 (HKCU)',    level: 'warn', weight: 18 },
  { pattern: /\\\\AppData\\\\Roaming/i,      name: 'AppData 路徑參照',       level: 'warn', weight: 18 },
  { pattern: /\\\\Temp\\\\/i,               name: 'Temp 目錄寫入',          level: 'warn', weight: 15 },
  { pattern: /base64_decode/i,               name: 'Base64 解碼呼叫',        level: 'warn', weight: 20 },
  { pattern: /eval\s*\(/i,                   name: 'eval() 動態執行',        level: 'warn', weight: 22 },
  { pattern: /document\.write\s*\(/i,        name: 'document.write() 注入',  level: 'warn', weight: 18 },
  { pattern: /ActiveXObject/i,               name: 'ActiveX 物件建立',       level: 'crit', weight: 28 },
  { pattern: /URLDownloadToFile/i,           name: '遠端檔案下載 API',       level: 'crit', weight: 35 },
  { pattern: /VirtualAlloc/i,                name: '記憶體動態分配 API',     level: 'crit', weight: 32 },
  { pattern: /WriteProcessMemory/i,          name: '跨程序記憶體寫入 API',   level: 'crit', weight: 38 },
  { pattern: /CreateRemoteThread/i,          name: '遠端執行緒建立',         level: 'crit', weight: 40 },
  { pattern: /IsDebuggerPresent/i,           name: '反除錯偵測',             level: 'warn', weight: 25 },
  { pattern: /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){8,}/i, name: '大量十六進位編碼字串', level: 'warn', weight: 22 },
  { pattern: /[A-Za-z0-9+/]{80,}={0,2}/,    name: '疑似 Base64 大型字串',   level: 'info', weight: 10 },
  { pattern: /\.onion/i,                     name: 'Tor 洋蔥域名參照',       level: 'crit', weight: 30 },
  { pattern: /bitcoin|monero|wallet/i,       name: '加密貨幣相關字串',       level: 'warn', weight: 15 },
  { pattern: /ransomware|encrypt.*files|your files/i, name: '勒索軟體相關文字', level: 'crit', weight: 50 },
];

let malwareSHA256 = '';

function initMalwareModule() {
  const dropZone  = document.getElementById('malware-drop-zone');
  const fileInput = document.getElementById('malware-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('dragging');
    if (e.dataTransfer.files[0]) processMalwareFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) processMalwareFile(fileInput.files[0]);
  });

  document.getElementById('vt-lookup-btn').addEventListener('click', () => {
    if (malwareSHA256) {
      window.open(`https://www.virustotal.com/gui/file/${malwareSHA256}`, '_blank', 'noopener');
    }
  });
}

async function processMalwareFile(file) {
  document.getElementById('malware-results').classList.remove('hidden');
  updateStatusText('惡意軟體掃描中...');

  const buffer  = await file.arrayBuffer();
  const bytes   = new Uint8Array(buffer);
  const logEl   = document.getElementById('malware-log');
  const logs    = [];

  const addLog = (tag, msg, highlight = false) => {
    logs.push({ tag, msg, highlight, time: logTime() });
    renderLog(logEl, logs);
  };

  addLog('INFO', `掃描目標：${file.name}  (${formatFileSize(file.size)})`);

  malwareSHA256 = await calculateFileHash(buffer, 'SHA-256');
  addLog('INFO', `SHA-256：${malwareSHA256}`);
  document.getElementById('vt-lookup-btn').disabled = false;

  renderMalwareStruct(file, bytes);
  addLog('OK', '檔案結構解析完成');

  const sigHits          = runSignatureCheck(bytes, addLog);
  const { strings, score: strScore } = runStringAnalysis(bytes, addLog);

  const totalScore = Math.min(100, sigHits.score + strScore);
  renderMalwareVerdict(file.name, totalScore, sigHits.hits);
  addLog(totalScore >= 60 ? 'CRIT' : totalScore >= 25 ? 'WARN' : 'OK',
    `掃描完成 — 威脅分數：${totalScore} / 100`, true);

  updateStatusText(totalScore >= 60 ? '⚠ 偵測到威脅' : '掃描完成');
  showToast(
    totalScore >= 60 ? `⚠ 高威脅 — 分數 ${totalScore}` : totalScore >= 25 ? `注意：發現可疑特徵 (${totalScore})` : '掃描完成，未發現已知威脅',
    totalScore >= 60 ? 'error' : totalScore >= 25 ? 'info' : 'success'
  );
}

function renderMalwareStruct(file, bytes) {
  const tbody = document.getElementById('malware-struct-tbody');
  const ext   = file.name.split('.').pop().toLowerCase();

  const isPE  = bytes[0] === 0x4D && bytes[1] === 0x5A;
  const isELF = bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46;
  const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44;
  const isZIP = bytes[0] === 0x50 && bytes[1] === 0x4B;

  let fileType = '未知格式';
  if (isPE)  fileType = 'Windows PE 可執行檔';
  else if (isELF) fileType = 'ELF 可執行檔 (Linux/Unix)';
  else if (isPDF) fileType = 'PDF 文件';
  else if (isZIP) fileType = 'ZIP / Office OpenXML';

  const entropy = calculateEntropy(bytes.slice(0, Math.min(bytes.length, 8192)));
  const highEntropy = entropy > 7.0;

  const rows = [
    ['檔案格式 (Magic)',  fileType],
    ['副檔名',            `.${ext}`],
    ['檔案大小',          formatFileSize(file.size)],
    ['前 8KB 熵值',       `${entropy.toFixed(4)} / 8.0 ${highEntropy ? '⚠ 高熵值 (疑似加密/壓縮)' : '(正常)'}`],
    ['空白 Byte 比例',    `${calcNullRatio(bytes).toFixed(1)}%`],
    ['可列印字元比例',     `${calcPrintableRatio(bytes).toFixed(1)}%`],
  ];

  tbody.innerHTML = rows.map(([k, v]) => `
    <tr>
      <td class="td-key">${k}</td>
      <td class="td-val" style="color:${highEntropy && k.includes('熵') ? 'var(--sev-medium)' : 'var(--text-primary)'}">${v}</td>
    </tr>
  `).join('');
}

function calculateEntropy(bytes) {
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;
  let entropy = 0;
  for (const f of freq) {
    if (f === 0) continue;
    const p = f / bytes.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function calcNullRatio(bytes) {
  return (bytes.filter(b => b === 0).length / bytes.length) * 100;
}

function calcPrintableRatio(bytes) {
  return (bytes.filter(b => b >= 0x20 && b < 0x7f).length / bytes.length) * 100;
}

function runSignatureCheck(bytes, addLog) {
  const matchList = document.getElementById('sig-match-list');
  const hits = [];
  let score = 0;

  for (const sig of MALWARE_SIGNATURES) {
    const found = sig.offset !== null
      ? patternMatchAt(bytes, sig.pattern, sig.offset)
      : patternMatchScan(bytes, sig.pattern);

    if (found) {
      hits.push(sig);
      score += sig.weight;
      addLog(sig.level === 'crit' ? 'CRIT' : sig.level === 'warn' ? 'WARN' : 'INFO',
        `特徵碼命中：${sig.name}`);
    }
  }

  if (hits.length === 0) {
    matchList.innerHTML = `<div class="sig-item level-pass">
      <span class="sig-item-icon" style="color:#34C759">✓</span>
      <div class="sig-item-content">
        <div class="sig-item-name">無已知特徵碼命中</div>
        <div class="sig-item-desc">已掃描 ${MALWARE_SIGNATURES.length} 條特徵規則</div>
      </div>
    </div>`;
  } else {
    matchList.innerHTML = hits.map(h => `
      <div class="sig-item level-${h.level}">
        <span class="sig-item-icon">${h.level === 'crit' ? '☣' : h.level === 'warn' ? '⚠' : 'ℹ'}</span>
        <div class="sig-item-content">
          <div class="sig-item-name">${h.name}</div>
          <div class="sig-item-desc">權重：+${h.weight}</div>
        </div>
      </div>
    `).join('');
  }

  return { hits, score: Math.min(score, 80) };
}

function patternMatchAt(bytes, pattern, offset) {
  if (offset + pattern.length > bytes.length) return false;
  return pattern.every((b, i) => bytes[offset + i] === b);
}

function patternMatchScan(bytes, pattern) {
  const limit = Math.min(bytes.length - pattern.length, 1024 * 512);
  outer: for (let i = 0; i < limit; i++) {
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) continue outer;
    }
    return true;
  }
  return false;
}

function runStringAnalysis(bytes, addLog) {
  const stringsList = document.getElementById('suspicious-strings-list');
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 512 * 1024));
  const found = [];
  let score = 0;

  for (const sp of SUSPICIOUS_STRING_PATTERNS) {
    if (sp.pattern.test(text)) {
      found.push(sp);
      score += sp.weight;
      addLog(sp.level === 'crit' ? 'CRIT' : sp.level === 'warn' ? 'WARN' : 'INFO',
        `可疑字串：${sp.name}`);
    }
  }

  if (found.length === 0) {
    stringsList.innerHTML = `<div class="sig-item level-pass">
      <span class="sig-item-icon" style="color:#34C759">✓</span>
      <div class="sig-item-content">
        <div class="sig-item-name">無可疑字串偵測</div>
        <div class="sig-item-desc">已掃描 ${SUSPICIOUS_STRING_PATTERNS.length} 條字串規則</div>
      </div>
    </div>`;
  } else {
    stringsList.innerHTML = found.map(s => `
      <div class="sig-item level-${s.level}">
        <span class="sig-item-icon">${s.level === 'crit' ? '☣' : s.level === 'warn' ? '⚠' : 'ℹ'}</span>
        <div class="sig-item-content">
          <div class="sig-item-name">${s.name}</div>
          <div class="sig-item-desc">權重：+${s.weight}</div>
        </div>
      </div>
    `).join('');
  }

  return { strings: found, score: Math.min(score, 70) };
}

function renderMalwareVerdict(filename, score, sigHits) {
  const banner   = document.getElementById('malware-verdict-banner');
  const iconEl   = document.getElementById('verdict-icon');
  const titleEl  = document.getElementById('verdict-title');
  const subEl    = document.getElementById('verdict-sub');
  const scoreEl  = document.getElementById('verdict-score');

  banner.className = 'verdict-banner';
  scoreEl.textContent = score;

  if (score >= 60) {
    banner.classList.add('verdict-danger');
    iconEl.textContent  = '☣';
    titleEl.textContent = '⚠ 高威脅風險';
    titleEl.style.color = 'var(--sev-critical)';
    subEl.textContent   = `偵測到強烈可疑特徵，建議立即隔離。已命中 ${sigHits.length} 條特徵規則。`;
  } else if (score >= 25) {
    banner.classList.add('verdict-suspect');
    iconEl.textContent  = '⚠';
    titleEl.textContent = '可疑 — 需進一步驗證';
    titleEl.style.color = 'var(--sev-medium)';
    subEl.textContent   = `發現部分可疑特徵，建議透過 VirusTotal 交叉驗證。`;
  } else {
    banner.classList.add('verdict-clean');
    iconEl.textContent  = '✓';
    titleEl.textContent = '未發現已知威脅';
    titleEl.style.color = '#34C759';
    subEl.textContent   = `靜態掃描未命中已知惡意特徵，但不排除未知威脅，建議結合動態分析。`;
  }
}

function renderLog(el, logs) {
  el.innerHTML = logs.map(l => {
    const tagClass = { OK:'log-tag-ok', WARN:'log-tag-warn', CRIT:'log-tag-crit', INFO:'log-tag-info' }[l.tag] || 'log-tag-info';
    const msgClass = l.highlight ? 'log-msg-highlight' : 'log-msg';
    return `<div class="log-line">
      <span class="log-time">${l.time}</span>
      <span class="${tagClass}">[${l.tag.padEnd(4)}]</span>
      <span class="${msgClass}">${l.msg}</span>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

/* ═══════════════════════════════════════════════════════════════════
   模組三：URL 安全深度檢查
═══════════════════════════════════════════════════════════════════ */

const URL_RISK_RULES = [
  { name: 'IP 位址直連',           test: u => /^https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(u),                 weight: 25, level: 'warn' },
  { name: '可疑 TLD',              test: u => /\.(xyz|top|click|loan|work|live|cc|tk|ml|ga|cf|gq)(\?|\/|$)/i.test(u), weight: 20, level: 'warn' },
  { name: '路徑遍歷特徵 (../ )',    test: u => u.includes('../') || u.includes('..%2F'),                      weight: 35, level: 'crit' },
  { name: 'SQL 注入特徵',           test: u => /union.*select|select.*from|insert.*into|drop.*table/i.test(u),weight: 40, level: 'crit' },
  { name: 'XSS 特徵',              test: u => /<script|javascript:|onerror=|onload=/i.test(decodeURIComponent(u)), weight: 40, level: 'crit' },
  { name: 'Base64 參數',           test: u => /[?&][^=]+=([A-Za-z0-9+/]{40,}={0,2})/.test(u),              weight: 15, level: 'warn' },
  { name: '過長 URL (> 200 字元)', test: u => u.length > 200,                                                 weight: 10, level: 'info' },
  { name: '多重重定向參數',         test: u => (u.match(/redirect|url=|next=|return=/gi) || []).length > 1,  weight: 22, level: 'warn' },
  { name: '子域名過深 (> 4 層)',    test: u => { try { return new URL(u).hostname.split('.').length > 5; } catch{ return false; } }, weight: 18, level: 'warn' },
  { name: '使用非標準 Port',        test: u => { try { const p = new URL(u).port; return p && p !== '80' && p !== '443'; } catch{ return false; } }, weight: 20, level: 'warn' },
  { name: '混合大小寫域名混淆',      test: u => { try { return /[A-Z]/.test(new URL(u).hostname) && /[a-z]/.test(new URL(u).hostname); } catch{ return false; } }, weight: 12, level: 'info' },
  { name: '純 HTTP 未加密',        test: u => u.startsWith('http://'),                                       weight: 15, level: 'warn' },
  { name: 'Data URI 嵌入',         test: u => /data:.*base64/i.test(u),                                      weight: 30, level: 'crit' },
  { name: '@符號混淆 (釣魚技巧)',   test: u => { try { return new URL(u).username.length > 0; } catch{ return false; } }, weight: 38, level: 'crit' },
  { name: '包含 .exe / .bat 路徑', test: u => /\.(exe|bat|cmd|scr|vbs|ps1|sh)(\?|#|$)/i.test(u),           weight: 30, level: 'crit' },
];

function initURLCheckModule() {
  document.getElementById('urlcheck-scan-btn').addEventListener('click', runURLCheck);
  document.getElementById('urlcheck-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') runURLCheck();
  });
}

async function runURLCheck() {
  const rawInput = document.getElementById('urlcheck-input').value.trim();
  if (!rawInput) { showToast('請輸入要檢查的 URL', 'error'); return; }

  const btn = document.getElementById('urlcheck-scan-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner">◌</span> 分析中...';

  document.getElementById('urlcheck-results').classList.remove('hidden');
  updateStatusText('URL 深度檢查中...');

  const normalizedUrl = rawInput.startsWith('http') ? rawInput : 'https://' + rawInput;

  renderURLStructure(normalizedUrl);
  const riskScore = renderURLRisks(normalizedUrl);
  renderURLDecoded(normalizedUrl);
  renderURLExternalLinks(normalizedUrl);
  await queryURLhaus(normalizedUrl, riskScore);

  btn.disabled = false;
  btn.innerHTML = '<span>⬡</span> 深度檢查';
  updateStatusText('URL 檢查完成');
}

function renderURLStructure(url) {
  const tbody = document.getElementById('url-struct-tbody');
  let parsed;
  try { parsed = new URL(url); } catch { tbody.innerHTML = `<tr><td colspan="2" class="empty-row">URL 格式無效</td></tr>`; return; }

  const rows = [
    ['協議 (Protocol)',    parsed.protocol],
    ['主機名稱 (Hostname)', parsed.hostname],
    ['Port',               parsed.port || (parsed.protocol === 'https:' ? '443 (預設)' : '80 (預設)')],
    ['路徑 (Path)',        parsed.pathname || '/'],
    ['查詢參數 (Query)',   parsed.search || '—'],
    ['Fragment (#)',       parsed.hash || '—'],
    ['完整長度',           `${url.length} 字元`],
  ];

  tbody.innerHTML = rows.map(([k, v]) => `
    <tr>
      <td class="td-key">${k}</td>
      <td class="td-val" style="color:var(--text-code)">${v}</td>
    </tr>
  `).join('');
}

function renderURLRisks(url) {
  const riskList = document.getElementById('url-risk-list');
  const hits = URL_RISK_RULES.filter(r => r.test(url));
  const score = Math.min(100, hits.reduce((s, r) => s + r.weight, 0));

  updateURLVerdict(score, hits);

  if (hits.length === 0) {
    riskList.innerHTML = `<div class="sig-item level-pass">
      <span class="sig-item-icon" style="color:#34C759">✓</span>
      <div class="sig-item-content">
        <div class="sig-item-name">無已知風險特徵</div>
        <div class="sig-item-desc">已套用 ${URL_RISK_RULES.length} 條偵測規則</div>
      </div>
    </div>`;
  } else {
    riskList.innerHTML = hits.map(h => `
      <div class="sig-item level-${h.level}">
        <span class="sig-item-icon">${h.level === 'crit' ? '☣' : h.level === 'warn' ? '⚠' : 'ℹ'}</span>
        <div class="sig-item-content">
          <div class="sig-item-name">${h.name}</div>
          <div class="sig-item-desc">風險權重：+${h.weight}</div>
        </div>
      </div>
    `).join('');
  }

  return score;
}

function updateURLVerdict(score, hits) {
  const banner  = document.getElementById('url-verdict-banner');
  const iconEl  = document.getElementById('url-verdict-icon');
  const titleEl = document.getElementById('url-verdict-title');
  const subEl   = document.getElementById('url-verdict-sub');
  const scoreEl = document.getElementById('url-verdict-score');

  banner.className = 'verdict-banner';
  scoreEl.textContent = score;

  if (score >= 50) {
    banner.classList.add('verdict-danger');
    iconEl.textContent  = '☣';
    titleEl.textContent = '⚠ 高風險 URL';
    titleEl.style.color = 'var(--sev-critical)';
    subEl.textContent   = `命中 ${hits.length} 條風險規則，強烈建議不要造訪此 URL。`;
  } else if (score >= 20) {
    banner.classList.add('verdict-suspect');
    iconEl.textContent  = '⚠';
    titleEl.textContent = '可疑 URL — 請謹慎';
    titleEl.style.color = 'var(--sev-medium)';
    subEl.textContent   = `發現 ${hits.length} 個可疑特徵，建議進一步驗證後再造訪。`;
  } else {
    banner.classList.add('verdict-clean');
    iconEl.textContent  = '✓';
    titleEl.textContent = '未發現明顯風險';
    titleEl.style.color = '#34C759';
    subEl.textContent   = '靜態特徵分析未命中已知風險規則，仍建議搭配黑名單查詢確認。';
  }
}

async function queryURLhaus(url, localScore) {
  const resultEl = document.getElementById('urlhaus-result');
  resultEl.innerHTML = `<div class="urlhaus-unknown"><span class="spinner">◌</span> 查詢 URLhaus 中...</div>`;

  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.query_status === 'is_phishing' || data.query_status === 'blacklisted' || data.url_status === 'online') {
      resultEl.innerHTML = `<div class="urlhaus-danger">
        ☣ URLhaus 確認：此 URL 已被列入黑名單<br>
        <span style="font-size:10px; color:var(--text-secondary); display:block; margin-top:6px;">
          狀態：${data.url_status || data.query_status} ·
          威脅類型：${data.tags ? data.tags.join(', ') : '未分類'} ·
          回報次數：${data.reporter || '—'}
        </span>
      </div>`;
      updateURLVerdict(Math.min(100, localScore + 60), []);
    } else if (data.query_status === 'no_results') {
      resultEl.innerHTML = `<div class="urlhaus-clean">
        ✓ URLhaus 查無此 URL 紀錄 (非已知惡意域名)
      </div>`;
    } else {
      resultEl.innerHTML = `<div class="urlhaus-unknown">
        狀態：${data.query_status || '未知'}<br>
        <span style="font-size:10px; color:var(--text-tertiary); display:block; margin-top:4px;">
          URLhaus API 返回非標準狀態碼
        </span>
      </div>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<div class="urlhaus-unknown">
      URLhaus 查詢失敗：${err.message}<br>
      <span style="font-size:10px; color:var(--text-tertiary); display:block; margin-top:4px;">
        可能受 CORS 限制，建議透過後端代理串接。
      </span>
    </div>`;
  }
}

function renderURLDecoded(url) {
  const panel = document.getElementById('url-decoded-panel');
  let decoded = '';
  try { decoded = decodeURIComponent(url); } catch { decoded = url; }

  let doubleDecoded = '';
  try { doubleDecoded = decodeURIComponent(decoded); } catch { doubleDecoded = decoded; }

  const rows = [
    ['原始 URL',     url],
    ['URI 解碼 (1)', decoded !== url ? decoded : '(無需解碼)'],
    ['URI 解碼 (2)', doubleDecoded !== decoded ? doubleDecoded : '(無需二次解碼)'],
  ];

  panel.innerHTML = rows.map(([k, v]) => `
    <div class="decoded-row">
      <span class="decoded-key">${k}</span>
      <span class="decoded-val">${v.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
    </div>
  `).join('');
}

function renderURLExternalLinks(url) {
  const encoded = encodeURIComponent(url);
  const tools = [
    { name: 'Google Safe Browsing',    href: `https://transparencyreport.google.com/safe-browsing/search?url=${encoded}` },
    { name: 'VirusTotal URL 掃描',     href: `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g,'')}/detection` },
    { name: 'URLhaus 查詢',             href: `https://urlhaus.abuse.ch/browse.php?search=${encoded}` },
    { name: 'Sucuri SiteCheck',         href: `https://sitecheck.sucuri.net/results/${encodeURIComponent(url.replace(/^https?:\/\//,''))}` },
    { name: 'Web of Trust (WOT)',       href: `https://www.mywot.com/scorecard/${encodeURIComponent(url.replace(/^https?:\/\//,''))}` },
  ];

  document.getElementById('url-external-links').innerHTML = tools.map(t => `
    <div class="ext-link-item">
      <span class="ext-link-name">${t.name}</span>
      <button class="ext-link-btn" onclick="window.open('${t.href}','_blank','noopener')">開啟 →</button>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   模組四：數位隱私脫敏器
═══════════════════════════════════════════════════════════════════ */

function initMetaModule() {
  const dropZone  = document.getElementById('meta-drop-zone');
  const fileInput = document.getElementById('meta-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processMetaFile(file);
    else showToast('請上傳有效圖片檔案', 'error');
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) processMetaFile(fileInput.files[0]); });
  document.getElementById('sanitize-btn').addEventListener('click', sanitizeImage);
}

let currentMetaFile = null;

async function processMetaFile(file) {
  currentMetaFile = file;
  document.getElementById('meta-results').classList.remove('hidden');

  const url = URL.createObjectURL(file);
  const img = document.getElementById('meta-preview-img');
  img.src = url;
  img.onload = () => { document.getElementById('prev-dimensions').textContent = `${img.naturalWidth} × ${img.naturalHeight} px`; };
  document.getElementById('prev-filename').textContent = file.name;
  document.getElementById('sanitize-status').classList.add('hidden');

  const buffer  = await file.arrayBuffer();
  const exifData = extractEXIF(new DataView(buffer));
  renderExifTable(exifData);
  updateStatusText('EXIF 解析完成');
}

function extractEXIF(dataView) {
  const results = [];
  if (dataView.getUint16(0) !== 0xFFD8) return results;

  let offset = 2;
  while (offset < dataView.byteLength - 1) {
    if (dataView.getUint8(offset) !== 0xFF) break;
    const marker = dataView.getUint16(offset);
    offset += 2;
    if (marker === 0xFFE1) {
      const segLen = dataView.getUint16(offset);
      if (dataView.getUint32(offset + 2) === 0x45786966) parseIFD(dataView, offset + 10, results);
      offset += segLen;
    } else if (marker >= 0xFFE0 && marker <= 0xFFEF) {
      offset += dataView.getUint16(offset);
    } else break;
  }
  return results;
}

function parseIFD(dataView, exifStart, results) {
  try {
    const tiffStart   = exifStart - 2;
    const littleEndian = dataView.getUint16(tiffStart) === 0x4949;
    const r16 = o => dataView.getUint16(tiffStart + o, littleEndian);
    const r32 = o => dataView.getUint32(tiffStart + o, littleEndian);
    const entryCount  = r16(r32(4));

    const tagDefs = {
      0x010F:['設備製造商','低','🏭'], 0x0110:['設備型號','中','📱'],
      0x0132:['拍攝時間','高','🕐'],   0x013B:['作者','高','👤'],
      0x8825:['GPS IFD','極高','📍'],  0x9003:['原始拍攝時間','高','🕐'],
      0x9004:['數位化時間','高','🕐'], 0x9c9b:['標題','中','📝'],
      0x9c9d:['作者名稱','高','👤'],   0xA430:['相機擁有者','高','👤'],
      0xA431:['相機序號','高','🔢'],   0x0112:['圖片方向','低','↔'],
    };

    const ifdOffset = r32(4);
    for (let i = 0; i < Math.min(r16(ifdOffset), 64); i++) {
      const eo   = ifdOffset + 2 + i * 12;
      const tag  = r16(eo);
      const type = r16(eo + 2);
      if (!tagDefs[tag]) continue;

      let value = '(無法解析)';
      try {
        if (type === 2) {
          const count  = r32(eo + 4);
          const valOff = count <= 4 ? eo + 8 : r32(eo + 8);
          const chars  = [];
          for (let j = 0; j < Math.min(count - 1, 256); j++) {
            const c = dataView.getUint8(tiffStart + valOff + j);
            if (c === 0) break;
            chars.push(String.fromCharCode(c));
          }
          value = chars.join('').trim() || '(空白)';
        } else if (type === 3) { value = r16(eo + 8).toString(); }
        else if (type === 4)   { value = r32(eo + 8).toString(); }
        else if (type === 5)   {
          const vo = r32(eo + 8);
          const d  = r32(vo + 4);
          value = d !== 0 ? (r32(vo) / d).toFixed(4) : '∞';
        }
      } catch (_) {}

      if (tag === 0x8825) value = '⚠ GPS 數據存在 — 包含精確位置資訊';

      const [name, risk, icon] = tagDefs[tag];
      results.push({ tag: '0x' + tag.toString(16).toUpperCase().padStart(4,'0'), name, value, risk, icon });
    }
  } catch (err) {
    results.push({ tag:'—', name:'解析錯誤', value: err.message, risk:'—', icon:'⚠' });
  }
}

function renderExifTable(exifData) {
  const tbody  = document.getElementById('exif-tbody');
  const banner = document.getElementById('exif-risk-banner');

  if (exifData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-row">未發現 EXIF 資訊，或此格式不含 EXIF</td></tr>';
    banner.classList.add('hidden');
    return;
  }

  const highRisk = exifData.filter(d => d.risk === '極高' || d.risk === '高').length;
  const hasGPS   = exifData.some(d => d.name.includes('GPS'));

  if (hasGPS || highRisk > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = `⚠ 發現 ${highRisk} 個高風險隱私欄位${hasGPS ? '，包含 GPS 定位資訊' : ''}，強烈建議執行脫敏處理`;
  } else { banner.classList.add('hidden'); }

  const riskMap = { '極高':'tag-crit', '高':'tag-warn', '中':'tag-info', '低':'tag-pass' };

  tbody.innerHTML = exifData.map(item => `
    <tr>
      <td style="color:var(--text-secondary);font-size:11px;">
        ${item.icon} ${item.name}<br>
        <span style="color:var(--text-tertiary);font-size:10px;">${item.tag}</span>
      </td>
      <td style="color:var(--text-code);font-size:11px;word-break:break-all;">${item.value}</td>
      <td><span class="tag ${riskMap[item.risk]||''}">${item.risk}</span></td>
    </tr>
  `).join('');
}

async function sanitizeImage() {
  if (!currentMetaFile) { showToast('請先上傳圖片', 'error'); return; }
  const btn    = document.getElementById('sanitize-btn');
  const status = document.getElementById('sanitize-status');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner">◌</span> 脫敏中...';

  await new Promise(r => setTimeout(r, 50));
  const img    = new Image();
  const objUrl = URL.createObjectURL(currentMetaFile);
  img.src = objUrl;

  img.onload = () => {
    const canvas  = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    URL.revokeObjectURL(objUrl);

    const ext      = currentMetaFile.name.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(blob => {
      const cleanUrl = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = cleanUrl;
      link.download  = `${currentMetaFile.name.replace(/\.[^/.]+$/,'')}_sanitized.${ext}`;
      link.click();
      URL.revokeObjectURL(cleanUrl);

      btn.disabled = false;
      btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載乾淨檔案';
      status.classList.remove('hidden');
      status.innerHTML = `✓ 脫敏完成 — 已下載 (${formatFileSize(blob.size)}) · 所有 EXIF / Metadata 已抹除`;
      showToast('圖片脫敏完成，已自動下載', 'success');
    }, mimeType, 0.95);
  };
  img.onerror = () => {
    btn.disabled = false;
    btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載乾淨檔案';
    showToast('圖片載入失敗', 'error');
  };
}

/* ═══════════════════════════════════════════════════════════════════
   模組五：Web OSINT
═══════════════════════════════════════════════════════════════════ */

function initOSINTModule() {
  document.getElementById('osint-scan-btn').addEventListener('click', startOSINTScan);
  document.getElementById('osint-input').addEventListener('keydown', e => { if (e.key === 'Enter') startOSINTScan(); });
  document.querySelectorAll('.dns-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dns-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const domain = extractDomain(document.getElementById('osint-input').value.trim());
      if (domain) queryDNS(domain, tab.dataset.type);
    });
  });
}

function extractDomain(raw) {
  if (!raw) return '';
  try { return new URL(raw.startsWith('http') ? raw : 'https://' + raw).hostname; }
  catch { return raw.replace(/[^a-zA-Z0-9.\-:]/g,''); }
}

async function startOSINTScan() {
  const rawInput = document.getElementById('osint-input').value.trim();
  if (!rawInput) { showToast('請輸入目標 URL 或 IP', 'error'); return; }

  const btn = document.getElementById('osint-scan-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner">◌</span> 掃描中...';
  document.getElementById('osint-results').classList.remove('hidden');
  updateStatusText('OSINT 掃描中...');

  const domain = extractDomain(rawInput);
  renderSecurityHeaders(domain);
  await queryDNS(domain, 'A');
  renderOSINTReport(domain, rawInput);

  btn.disabled = false;
  btn.innerHTML = '<span>◎</span> 開始掃描';
  updateStatusText('掃描完成');
  showToast(`${domain} 掃描完成`, 'success');
}

function renderSecurityHeaders(domain) {
  const tbody = document.getElementById('headers-tbody');
  const headers = [
    { name:'Content-Security-Policy',   abbr:'CSP',  desc:'防止 XSS 與資料注入攻擊' },
    { name:'Strict-Transport-Security', abbr:'HSTS', desc:'強制 HTTPS，防降級攻擊' },
    { name:'X-Frame-Options',           abbr:'XFO',  desc:'防止 Clickjacking' },
    { name:'X-Content-Type-Options',    abbr:'XCTO', desc:'禁止 MIME 類型嗅探' },
    { name:'Referrer-Policy',           abbr:'RP',   desc:'控制 Referrer 資訊洩露' },
    { name:'Permissions-Policy',        abbr:'PP',   desc:'限制瀏覽器功能權限' },
  ];

  tbody.innerHTML = headers.map(h => `
    <tr>
      <td style="font-size:11px;">
        <span style="color:var(--text-primary);font-weight:500;">${h.abbr}</span><br>
        <span style="color:var(--text-tertiary);font-size:10px;">${h.name}</span>
      </td>
      <td><span class="tag tag-info">查詢中</span></td>
      <td style="font-size:11px;color:var(--text-secondary);">${h.desc}</td>
    </tr>
  `).join('');

  fetchSecurityHeadersAnalysis(domain, headers, tbody);
}

async function fetchSecurityHeadersAnalysis(domain, headers, tbody) {
  try {
    const response = await fetch(`https://api.securityheaders.com/?q=${encodeURIComponent(domain)}&followRedirects=on&hide=on`, { mode:'cors' });
    if (response.ok) {
      const present = {};
      response.headers.forEach((v, k) => { present[k.toLowerCase()] = v; });
      const rows = tbody.querySelectorAll('tr');
      headers.forEach((h, idx) => {
        const found = present[h.name.toLowerCase()] !== undefined;
        if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML =
          found ? `<span class="tag tag-pass">✓ 已配置</span>` : `<span class="tag tag-crit">✗ 缺失</span>`;
      });
      return;
    }
  } catch (_) {}

  const simulated = {
    'Content-Security-Policy': false, 'Strict-Transport-Security': true,
    'X-Frame-Options': true, 'X-Content-Type-Options': true,
    'Referrer-Policy': false, 'Permissions-Policy': false,
  };
  const rows = tbody.querySelectorAll('tr');
  headers.forEach((h, idx) => {
    const tag = simulated[h.name]
      ? `<span class="tag tag-pass">✓ 已配置</span>`
      : `<span class="tag tag-crit">✗ 缺失</span>`;
    if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML =
      tag + `<span style="font-size:9px;color:var(--text-tertiary);display:block;margin-top:2px;">(示範)</span>`;
  });
}

async function queryDNS(domain, type) {
  const area = document.getElementById('dns-results-area');
  area.innerHTML = `<div class="loading-state" style="padding:16px;"><span class="spinner">◌</span> 查詢 ${type} 記錄中...</div>`;
  try {
    const res  = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    renderDNSResults(await res.json(), type, area);
  } catch (err) {
    area.innerHTML = `<div style="padding:10px;font-size:11px;color:var(--text-secondary);">
      <span class="tag tag-warn">⚠</span> DNS 查詢失敗：${err.message}
    </div>`;
  }
}

function renderDNSResults(data, type, container) {
  if (!data.Answer?.length) { container.innerHTML = `<div class="empty-state">無 ${type} 記錄</div>`; return; }
  const typeMap = { 1:'A',2:'NS',5:'CNAME',6:'SOA',15:'MX',16:'TXT',28:'AAAA',33:'SRV' };
  container.innerHTML = data.Answer.map(r => `
    <div class="dns-record">
      <span class="dns-record-type">${typeMap[r.type]||r.type}</span>
      <span class="dns-record-value">${r.data.replace(/"/g,'')}</span>
      <span class="dns-record-ttl">TTL:${r.TTL}s</span>
    </div>
  `).join('');
}

function renderOSINTReport(domain, rawInput) {
  const container = document.getElementById('osint-report');
  const isIP      = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  const hasHttps  = rawInput.toLowerCase().startsWith('https://');
  const subDepth  = (domain.match(/\./g)||[]).length;

  const items = [
    { label:'連線協議',     value: hasHttps ? '✓ HTTPS' : '✗ HTTP',              cls: hasHttps ? 'tag-pass' : 'tag-crit' },
    { label:'目標類型',     value: isIP ? '📍 IP 位址' : '🌐 域名',               cls: 'tag-info' },
    { label:'子域名深度',   value: subDepth <= 1 ? `${subDepth} 層 (正常)` : `${subDepth} 層 (注意)`, cls: subDepth <= 1 ? 'tag-pass' : 'tag-warn' },
    { label:'域名長度',     value: domain.length > 30 ? `${domain.length} 字元 (偏長)` : `${domain.length} 字元 (正常)`, cls: domain.length > 30 ? 'tag-warn' : 'tag-pass' },
    { label:'數字混淆',     value: /\d{4,}/.test(domain) ? '⚠ 含大量數字' : '✓ 正常', cls: /\d{4,}/.test(domain) ? 'tag-warn' : 'tag-pass' },
    { label:'DNS 查詢服務', value: '✓ Google DoH', cls: 'tag-info' },
  ];

  container.innerHTML = items.map(item => `
    <div class="report-item">
      <div class="report-item-label">${item.label}</div>
      <div class="report-item-value"><span class="tag ${item.cls}" style="font-size:11px;">${item.value}</span></div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   模組六：CVE 漏洞資料庫
═══════════════════════════════════════════════════════════════════ */

function initCVEModule() {
  document.getElementById('cve-search-btn').addEventListener('click', searchCVE);
  document.getElementById('cve-input').addEventListener('keydown', e => { if (e.key === 'Enter') searchCVE(); });
}

async function searchCVE() {
  const keyword = document.getElementById('cve-input').value.trim();
  if (!keyword) { showToast('請輸入搜尋關鍵字', 'error'); return; }

  const btn    = document.getElementById('cve-search-btn');
  const loading = document.getElementById('cve-loading');
  const tbody   = document.getElementById('cve-tbody');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner">◌</span> 搜尋中...';
  document.getElementById('cve-results').classList.remove('hidden');
  loading.classList.remove('hidden');
  tbody.innerHTML = '';
  updateStatusText('查詢 NVD 中...');

  const isCveId = /^CVE-\d{4}-\d+$/i.test(keyword);
  const apiUrl  = isCveId
    ? `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(keyword.toUpperCase())}`
    : `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=20`;

  try {
    const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(response.status === 429 ? 'API 速率限制，請稍後再試' : `HTTP ${response.status}`);
    const data = await response.json();
    loading.classList.add('hidden');
    if (!data.vulnerabilities) throw new Error('回應格式錯誤');
    renderCVEResults(data.vulnerabilities, data.totalResults || 0, keyword);
    updateStatusText(`找到 ${data.totalResults} 個漏洞`);
    showToast(`已找到 ${data.totalResults} 個相關漏洞`, data.totalResults > 0 ? 'success' : 'info');
  } catch (err) {
    loading.classList.add('hidden');
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row" style="padding:28px;">
      <div style="color:var(--text-secondary);margin-bottom:6px;">⚠ 查詢失敗：${err.message}</div>
      <div style="color:var(--text-tertiary);font-size:10px;">建議透過後端代理串接 NVD API</div>
    </td></tr>`;
    showToast('NVD 查詢失敗', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<span>◇</span> 搜尋漏洞';
}

function getCVSSInfo(cve) {
  const m   = cve.metrics;
  if (!m) return { score: null, severity: 'UNKNOWN' };
  const d   = m.cvssMetricV31?.[0]?.cvssData || m.cvssMetricV30?.[0]?.cvssData || m.cvssMetricV2?.[0]?.cvssData;
  if (!d) return { score: null, severity: 'UNKNOWN' };
  return {
    score:    d.baseScore,
    severity: d.baseSeverity || (d.baseScore >= 9 ? 'CRITICAL' : d.baseScore >= 7 ? 'HIGH' : d.baseScore >= 4 ? 'MEDIUM' : 'LOW'),
  };
}

function cvssClass(score) {
  if (score === null) return 'cvss-none';
  if (score >= 9) return 'cvss-critical';
  if (score >= 7) return 'cvss-high';
  if (score >= 4) return 'cvss-medium';
  return 'cvss-low';
}

function severityLabel(s) {
  const map = { CRITICAL:['CRITICAL','tag-crit'], HIGH:['HIGH','tag-warn'], MEDIUM:['MEDIUM','tag-info'], LOW:['LOW','tag-pass'], UNKNOWN:['N/A',''] };
  const [label, cls] = map[s?.toUpperCase()] || map.UNKNOWN;
  return `<span class="tag ${cls}">${label}</span>`;
}

function renderCVEResults(vulns, total, keyword) {
  const tbody    = document.getElementById('cve-tbody');
  const totalEl  = document.getElementById('cve-total-count');
  const sevEl    = document.getElementById('cve-severity-counts');

  totalEl.textContent = `找到 ${total.toLocaleString()} 個漏洞 (顯示前 ${vulns.length} 筆)`;

  const counts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0 };
  vulns.forEach(v => { const k = getCVSSInfo(v.cve).severity?.toUpperCase(); if (counts[k] !== undefined) counts[k]++; });

  const colorMap = { CRITICAL:'var(--sev-critical)', HIGH:'var(--sev-high)', MEDIUM:'var(--sev-medium)', LOW:'var(--sev-low)' };
  sevEl.innerHTML = Object.entries(counts).map(([l,n]) => `
    <span class="sev-badge">
      <span class="sev-dot" style="background:${colorMap[l]};"></span>
      <span style="color:${colorMap[l]}">${l}:${n}</span>
    </span>`).join('');

  if (vulns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">未找到「${keyword}」相關漏洞</td></tr>`;
    return;
  }

  tbody.innerHTML = vulns.map(item => {
    const cve  = item.cve;
    const { score, severity } = getCVSSInfo(cve);
    const desc = cve.descriptions?.find(d => d.lang === 'zh')?.value || cve.descriptions?.find(d => d.lang === 'en')?.value || '無描述';
    const pub  = cve.published ? new Date(cve.published).toLocaleDateString('zh-Hant') : '—';
    return `
      <tr>
        <td><a class="cve-id-link" href="https://nvd.nist.gov/vuln/detail/${cve.id}" target="_blank" rel="noopener">${cve.id}</a></td>
        <td><span class="cvss-score ${cvssClass(score)}">${score !== null ? score.toFixed(1) : 'N/A'}</span></td>
        <td>${severityLabel(severity)}</td>
        <td><div class="cve-desc-text">${desc}</div></td>
        <td style="font-size:11px;color:var(--text-secondary);">${pub}</td>
      </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   PWA Service Worker
═══════════════════════════════════════════════════════════════════ */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════════
   初始化
═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHashModule();
  initMalwareModule();
  initURLCheckModule();
  initMetaModule();
  initOSINTModule();
  initCVEModule();
  registerServiceWorker();

  updateFooterClock();
  setInterval(updateFooterClock, 1000);
  updateStatusText('系統就緒');
});
