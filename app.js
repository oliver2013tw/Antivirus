'use strict';

/* ═══════════════════════════════════════════════════════════════════
   PROJECT SENTINEL — app.js
   全方位數位安全與隱私檢測站 · 完全本地端運算 · 無 AI 推理
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
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const now = new Date();
  el.textContent = now.toLocaleString('zh-Hant', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
}

/* ─────────────────────────────────────────────
   導覽切換邏輯
───────────────────────────────────────────── */

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const modules = document.querySelectorAll('.module');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      modules.forEach(m => {
        if (m.id === target) {
          m.classList.remove('hidden');
          m.classList.add('active');
        } else {
          m.classList.add('hidden');
          m.classList.remove('active');
        }
      });
      tab.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   模組一：進階靜態檔案與 Hash 分析器
═══════════════════════════════════════════════════════════════════ */

function initHashModule() {
  const dropZone    = document.getElementById('hash-drop-zone');
  const fileInput   = document.getElementById('hash-file-input');
  const resultsPanel = document.getElementById('hash-results');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) processHashFile(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) processHashFile(file);
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const cell = document.getElementById(targetId);
      const textEl = cell ? cell.querySelector('.hash-text') : null;
      if (!textEl || textEl.textContent === '—') return;
      navigator.clipboard.writeText(textEl.textContent).then(() => {
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '⎘';
          btn.classList.remove('copied');
        }, 1500);
      });
    });
  });
}

async function processHashFile(file) {
  const resultsPanel  = document.getElementById('hash-results');
  const progressArea  = document.getElementById('hash-progress-area');
  const hashTable     = document.getElementById('hash-table');

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
  const wordArray = uint8ArrayToWordArray(data);
  return md5Core(wordArray, data.length * 8);
}

function uint8ArrayToWordArray(u8arr) {
  const words = [];
  for (let i = 0; i < u8arr.length; i++) {
    words[i >>> 2] |= u8arr[i] << (24 - (i % 4) * 8);
  }
  return words;
}

function md5Core(words, bitLength) {
  const W = [...words];
  const nBytes = bitLength / 8;
  const nWords = W.length;

  W[nBytes >> 2] |= 0x80 << (24 - (nBytes % 4) * 8);
  W[(((nBytes + 64) >> 9) << 4) + 14] = (bitLength >>> 0);

  let a =  1732584193, b = -271733879, c = -1732584194, d =  271733878;

  const T = new Int32Array(64);
  for (let i = 0; i < 64; i++) T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;

  const FF = (a,b,c,d,x,s,t) => { const n = a + ((b & c) | (~b & d)) + (x >>> 0) + t; return ((n << s) | (n >>> (32-s))) + b; };
  const GG = (a,b,c,d,x,s,t) => { const n = a + ((b & d) | (c & ~d)) + (x >>> 0) + t; return ((n << s) | (n >>> (32-s))) + b; };
  const HH = (a,b,c,d,x,s,t) => { const n = a + (b ^ c ^ d)          + (x >>> 0) + t; return ((n << s) | (n >>> (32-s))) + b; };
  const II = (a,b,c,d,x,s,t) => { const n = a + (c ^ (b | ~d))        + (x >>> 0) + t; return ((n << s) | (n >>> (32-s))) + b; };

  for (let i = 0; i < W.length; i += 16) {
    const M = (j) => {
      const byteIdx = (i + j) * 4;
      const byte3 = (W[i+j] >>> 24) & 0xff;
      const byte2 = (W[i+j] >>> 16) & 0xff;
      const byte1 = (W[i+j] >>> 8)  & 0xff;
      const byte0 = (W[i+j])        & 0xff;
      return (byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24));
    };

    let aa = a, bb = b, cc = c, dd = d;

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

    a = (a + aa) | 0;
    b = (b + bb) | 0;
    c = (c + cc) | 0;
    d = (d + dd) | 0;
  }

  const toLeHex = (n) => {
    const u = n >>> 0;
    return [u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff, (u >> 24) & 0xff]
      .map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return toLeHex(a) + toLeHex(b) + toLeHex(c) + toLeHex(d);
}

function renderHexViewer(buffer) {
  const output = document.getElementById('hex-output');
  const bytes  = new Uint8Array(buffer.slice(0, 512));
  const lines  = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk  = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();

    const hexParts = Array.from(chunk).map((b, idx) => {
      const hex = b.toString(16).padStart(2, '0').toUpperCase();
      const cls = b === 0 ? 'hex-null' : 'hex-byte';
      return `<span class="${cls}">${hex}</span>`;
    });

    while (hexParts.length < 16) hexParts.push('<span class="hex-null">  </span>');

    const hexStr = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');

    const asciiStr = Array.from(chunk).map(b => {
      const ch = (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.';
      return `<span class="hex-ascii">${ch.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span>`;
    }).join('');

    lines.push(`<span class="hex-offset">${offset}</span>  ${hexStr}  ${asciiStr}`);
  }

  output.innerHTML = lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   模組二：數位隱私脫敏器 (Metadata Sanitizer)
═══════════════════════════════════════════════════════════════════ */

function initMetaModule() {
  const dropZone  = document.getElementById('meta-drop-zone');
  const fileInput = document.getElementById('meta-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processMetaFile(file);
    else showToast('請上傳有效圖片檔案', 'error');
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) processMetaFile(file);
  });

  document.getElementById('sanitize-btn').addEventListener('click', sanitizeImage);
}

let currentMetaFile = null;

async function processMetaFile(file) {
  currentMetaFile = file;
  const resultsPanel = document.getElementById('meta-results');
  resultsPanel.classList.remove('hidden');

  const url = URL.createObjectURL(file);
  const img = document.getElementById('meta-preview-img');
  img.src = url;

  img.onload = () => {
    document.getElementById('prev-dimensions').textContent =
      `${img.naturalWidth} × ${img.naturalHeight} px`;
  };

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
      const segmentLength = dataView.getUint16(offset);
      const exifHeader = dataView.getUint32(offset + 2);
      if (exifHeader === 0x45786966) {
        parseIFD(dataView, offset + 10, results);
      }
      offset += segmentLength;
    } else if (marker >= 0xFFE0 && marker <= 0xFFEF) {
      offset += dataView.getUint16(offset);
    } else {
      break;
    }
  }
  return results;
}

function parseIFD(dataView, exifStart, results) {
  try {
    const tiffStart  = exifStart - 2;
    const byteOrder  = dataView.getUint16(tiffStart);
    const littleEndian = byteOrder === 0x4949;
    const read16 = (off) => dataView.getUint16(tiffStart + off, littleEndian);
    const read32 = (off) => dataView.getUint32(tiffStart + off, littleEndian);

    const ifdOffset = read32(4);
    const entryCount = read16(ifdOffset);

    const tagNames = {
      0x010F: { name: '設備製造商', risk: '低', icon: '🏭' },
      0x0110: { name: '設備型號',   risk: '中', icon: '📱' },
      0x0112: { name: '圖片方向',   risk: '低', icon: '↔' },
      0x011A: { name: 'X 解析度',   risk: '低', icon: '↔' },
      0x011B: { name: 'Y 解析度',   risk: '低', icon: '↕' },
      0x0132: { name: '拍攝時間',   risk: '高', icon: '🕐' },
      0x013B: { name: '作者',       risk: '高', icon: '👤' },
      0x013E: { name: '白平衡',     risk: '低', icon: '⬜' },
      0x8769: { name: 'EXIF IFD',   risk: '低', icon: '📋' },
      0x8825: { name: 'GPS IFD',    risk: '極高', icon: '📍' },
      0x9003: { name: '原始拍攝時間', risk: '高', icon: '🕐' },
      0x9004: { name: '數位化時間', risk: '高', icon: '🕐' },
      0x9c9b: { name: '標題',       risk: '中', icon: '📝' },
      0x9c9c: { name: '備注',       risk: '中', icon: '📝' },
      0x9c9d: { name: '作者名稱',   risk: '高', icon: '👤' },
      0x9c9e: { name: '關鍵字',     risk: '中', icon: '🔑' },
      0x9c9f: { name: '主題',       risk: '低', icon: '📌' },
      0xA430: { name: '相機擁有者', risk: '高', icon: '👤' },
      0xA431: { name: '相機序號',   risk: '高', icon: '🔢' },
    };

    for (let i = 0; i < Math.min(entryCount, 64); i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag  = read16(entryOffset);
      const type = read16(entryOffset + 2);

      if (tagNames[tag]) {
        let value = '(無法解析)';

        try {
          if (type === 2) {
            const count   = read32(entryOffset + 4);
            const valOff  = count <= 4 ? entryOffset + 8 : read32(entryOffset + 8);
            const chars   = [];
            for (let j = 0; j < Math.min(count - 1, 256); j++) {
              const c = dataView.getUint8(tiffStart + valOff + j);
              if (c === 0) break;
              chars.push(String.fromCharCode(c));
            }
            value = chars.join('').trim() || '(空白)';
          } else if (type === 3) {
            value = read16(entryOffset + 8).toString();
          } else if (type === 4) {
            value = read32(entryOffset + 8).toString();
          } else if (type === 5) {
            const valOff = read32(entryOffset + 8);
            const num = read32(valOff);
            const den = read32(valOff + 4);
            value = den !== 0 ? (num / den).toFixed(4) : '∞';
          }
        } catch (_) {}

        if (tag === 0x8825) {
          value = '⚠ GPS 數據存在 — 含有精確位置資訊';
        }

        results.push({
          tag:  '0x' + tag.toString(16).toUpperCase().padStart(4, '0'),
          name: tagNames[tag].name,
          value,
          risk: tagNames[tag].risk,
          icon: tagNames[tag].icon,
        });
      }
    }
  } catch (err) {
    results.push({ tag: '—', name: '解析錯誤', value: err.message, risk: '—', icon: '⚠' });
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

  const hasGPS  = exifData.some(d => d.name.includes('GPS'));
  const highRisk = exifData.filter(d => d.risk === '極高' || d.risk === '高').length;

  if (hasGPS || highRisk > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = `⚠ 發現 ${highRisk} 個高風險隱私欄位${hasGPS ? '，包含 GPS 定位資訊' : ''}，強烈建議執行脫敏處理`;
  } else {
    banner.classList.add('hidden');
  }

  const riskTagMap = {
    '極高': 'tag-crit',
    '高':   'tag-warn',
    '中':   'tag-info',
    '低':   'tag-pass',
    '—':    '',
  };

  tbody.innerHTML = exifData.map(item => `
    <tr>
      <td style="color: var(--text-secondary); font-size:11px;">
        ${item.icon} ${item.name}<br>
        <span style="color:var(--text-tertiary); font-size:10px;">${item.tag}</span>
      </td>
      <td style="color: var(--text-code); font-size:11px; word-break:break-all;">${item.value}</td>
      <td><span class="tag ${riskTagMap[item.risk] || ''}">${item.risk}</span></td>
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

  const img     = new Image();
  const objUrl  = URL.createObjectURL(currentMetaFile);
  img.src = objUrl;

  img.onload = () => {
    const canvas  = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(objUrl);

    const ext      = currentMetaFile.name.split('.').pop().toLowerCase();
    const mimeType = (ext === 'png') ? 'image/png' : 'image/jpeg';
    const quality  = (mimeType === 'image/jpeg') ? 0.95 : undefined;

    canvas.toBlob(blob => {
      const cleanUrl  = URL.createObjectURL(blob);
      const link      = document.createElement('a');
      const baseName  = currentMetaFile.name.replace(/\.[^/.]+$/, '');
      link.href       = cleanUrl;
      link.download   = `${baseName}_sanitized.${ext}`;
      link.click();
      URL.revokeObjectURL(cleanUrl);

      btn.disabled = false;
      btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載乾淨檔案';

      status.classList.remove('hidden');
      status.innerHTML = `✓ 脫敏完成 — 已下載「${baseName}_sanitized.${ext}」(${formatFileSize(blob.size)}) · 所有 EXIF/Metadata 已抹除`;
      updateStatusText('脫敏完成');
      showToast('圖片脫敏完成，已自動下載', 'success');
    }, mimeType, quality);
  };

  img.onerror = () => {
    btn.disabled = false;
    btn.innerHTML = '<span>⬡</span> 一鍵脫敏 & 下載乾淨檔案';
    showToast('圖片載入失敗，請確認格式', 'error');
  };
}

/* ═══════════════════════════════════════════════════════════════════
   模組三：Web OSINT & URL 安全檢測
═══════════════════════════════════════════════════════════════════ */

function initOSINTModule() {
  document.getElementById('osint-scan-btn').addEventListener('click', startOSINTScan);
  document.getElementById('osint-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') startOSINTScan();
  });

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
  try {
    const withProto = raw.startsWith('http') ? raw : 'https://' + raw;
    return new URL(withProto).hostname;
  } catch {
    return raw.replace(/[^a-zA-Z0-9.\-:]/g, '');
  }
}

function normalizeUrl(raw) {
  if (!raw) return '';
  return raw.startsWith('http') ? raw : 'https://' + raw;
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
    {
      name: 'Content-Security-Policy',
      abbr: 'CSP',
      desc: '防止 XSS 與資料注入攻擊',
      endpoint: `https://securityheaders.com/?q=${encodeURIComponent(domain)}&followRedirects=on`
    },
    {
      name: 'Strict-Transport-Security',
      abbr: 'HSTS',
      desc: '強制 HTTPS 連線，防止降級攻擊',
      endpoint: ''
    },
    {
      name: 'X-Frame-Options',
      abbr: 'XFO',
      desc: '防止 Clickjacking 攻擊',
      endpoint: ''
    },
    {
      name: 'X-Content-Type-Options',
      abbr: 'XCTO',
      desc: '禁止 MIME 類型嗅探',
      endpoint: ''
    },
    {
      name: 'Referrer-Policy',
      abbr: 'RP',
      desc: '控制 Referrer 資訊洩露',
      endpoint: ''
    },
    {
      name: 'Permissions-Policy',
      abbr: 'PP',
      desc: '限制瀏覽器功能權限 (相機、麥克風等)',
      endpoint: ''
    },
  ];

  tbody.innerHTML = headers.map(h => `
    <tr>
      <td style="font-size:11px;">
        <span style="color:var(--text-primary); font-weight:500;">${h.abbr}</span><br>
        <span style="color:var(--text-tertiary); font-size:10px;">${h.name}</span>
      </td>
      <td>
        <span class="tag tag-info">查詢中</span>
      </td>
      <td style="font-size:11px; color:var(--text-secondary);">${h.desc}</td>
    </tr>
  `).join('');

  fetchSecurityHeadersAnalysis(domain, headers, tbody);
}

async function fetchSecurityHeadersAnalysis(domain, headers, tbody) {
  const apiUrl = `https://api.securityheaders.com/?q=${encodeURIComponent(domain)}&followRedirects=on&hide=on`;

  try {
    const response = await fetch(apiUrl, { method: 'GET', mode: 'cors' });

    if (response.ok) {
      const presentHeaders = {};
      response.headers.forEach((val, key) => {
        presentHeaders[key.toLowerCase()] = val;
      });

      const rows = tbody.querySelectorAll('tr');
      headers.forEach((h, idx) => {
        const key   = h.name.toLowerCase();
        const found = presentHeaders[key] !== undefined;
        const tag   = found
          ? `<span class="tag tag-pass">✓ 已配置</span>`
          : `<span class="tag tag-crit">✗ 缺失</span>`;
        if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML = tag;
      });
    } else {
      setHeadersFallbackDemo(headers, tbody);
    }
  } catch {
    setHeadersFallbackDemo(headers, tbody);
  }
}

function setHeadersFallbackDemo(headers, tbody) {
  const simulated = {
    'Content-Security-Policy':    false,
    'Strict-Transport-Security':  true,
    'X-Frame-Options':            true,
    'X-Content-Type-Options':     true,
    'Referrer-Policy':            false,
    'Permissions-Policy':         false,
  };

  const rows = tbody.querySelectorAll('tr');
  headers.forEach((h, idx) => {
    const found = simulated[h.name];
    const tag   = found
      ? `<span class="tag tag-pass">✓ 已配置</span>`
      : `<span class="tag tag-crit">✗ 缺失</span>`;
    if (rows[idx]) rows[idx].querySelectorAll('td')[1].innerHTML =
      tag + `<span style="font-size:9px; color:var(--text-tertiary); display:block; margin-top:3px;">(示範資料)</span>`;
  });
}

async function queryDNS(domain, type) {
  const area = document.getElementById('dns-results-area');
  area.innerHTML = `<div class="loading-state" style="padding:20px;"><span class="spinner">◌</span> 查詢 ${type} 記錄中...</div>`;

  const apiUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderDNSResults(data, type, area);
  } catch (err) {
    area.innerHTML = `
      <div style="padding:12px; font-size:11px; color:var(--text-secondary);">
        <span class="tag tag-warn">⚠</span>&nbsp;
        DNS 查詢失敗 (${err.message})。<br>
        <span style="color:var(--text-tertiary); font-size:10px; margin-top:6px; display:block;">
          Google DoH API 端點：${apiUrl}
        </span>
      </div>`;
  }
}

function renderDNSResults(data, type, container) {
  if (!data.Answer || data.Answer.length === 0) {
    container.innerHTML = `<div class="empty-state">無 ${type} 記錄 (NXDOMAIN 或查無結果)</div>`;
    return;
  }

  const typeMap = { 1:'A', 2:'NS', 5:'CNAME', 6:'SOA', 15:'MX', 16:'TXT', 28:'AAAA', 33:'SRV' };

  container.innerHTML = data.Answer.map(record => `
    <div class="dns-record">
      <span class="dns-record-type">${typeMap[record.type] || record.type}</span>
      <span class="dns-record-value">${record.data.replace(/"/g, '')}</span>
      <span class="dns-record-ttl">TTL: ${record.TTL}s</span>
    </div>
  `).join('');
}

function renderOSINTReport(domain, rawInput) {
  const container = document.getElementById('osint-report');

  const isIP    = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  const hasHttps = rawInput.toLowerCase().startsWith('https://');
  const subdomainCount = (domain.match(/\./g) || []).length;

  const items = [
    {
      label: '連線協議',
      value: hasHttps ? '✓ HTTPS' : '✗ HTTP',
      cls: hasHttps ? 'tag-pass' : 'tag-crit',
    },
    {
      label: '目標類型',
      value: isIP ? '📍 IP 位址' : '🌐 域名',
      cls: 'tag-info',
    },
    {
      label: '子域名深度',
      value: subdomainCount <= 1 ? `${subdomainCount} 層 (正常)` : `${subdomainCount} 層 (注意)`,
      cls: subdomainCount <= 1 ? 'tag-pass' : 'tag-warn',
    },
    {
      label: '域名長度',
      value: domain.length > 30 ? `${domain.length} 字元 (偏長)` : `${domain.length} 字元 (正常)`,
      cls: domain.length > 30 ? 'tag-warn' : 'tag-pass',
    },
    {
      label: '數字混淆偵測',
      value: /\d{4,}/.test(domain) ? '⚠ 含大量數字' : '✓ 正常',
      cls: /\d{4,}/.test(domain) ? 'tag-warn' : 'tag-pass',
    },
    {
      label: 'DNS 查詢',
      value: '✓ Google DoH',
      cls: 'tag-info',
    },
  ];

  container.innerHTML = items.map(item => `
    <div class="report-item">
      <div class="report-item-label">${item.label}</div>
      <div class="report-item-value">
        <span class="tag ${item.cls}" style="font-size:11px; padding:3px 8px;">${item.value}</span>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   模組四：CVE 漏洞資料庫檢索
═══════════════════════════════════════════════════════════════════ */

function initCVEModule() {
  document.getElementById('cve-search-btn').addEventListener('click', searchCVE);
  document.getElementById('cve-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchCVE();
  });
}

async function searchCVE() {
  const keyword = document.getElementById('cve-input').value.trim();
  if (!keyword) { showToast('請輸入搜尋關鍵字', 'error'); return; }

  const btn         = document.getElementById('cve-search-btn');
  const loading     = document.getElementById('cve-loading');
  const resultsPanel = document.getElementById('cve-results');
  const tbody       = document.getElementById('cve-tbody');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner">◌</span> 搜尋中...';
  resultsPanel.classList.remove('hidden');
  loading.classList.remove('hidden');
  tbody.innerHTML = '';
  updateStatusText('查詢 NVD 中...');

  const isCveId = /^CVE-\d{4}-\d+$/i.test(keyword);

  let apiUrl;
  if (isCveId) {
    apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(keyword.toUpperCase())}`;
  } else {
    apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=20`;
  }

  try {
    const response = await fetchCVEData(apiUrl);
    loading.classList.add('hidden');

    if (!response || !response.vulnerabilities) {
      throw new Error('API 回應格式錯誤');
    }

    renderCVEResults(response.vulnerabilities, response.totalResults || 0, keyword);
    updateStatusText(`找到 ${response.totalResults} 個漏洞`);
    showToast(`已找到 ${response.totalResults} 個相關漏洞`, response.totalResults > 0 ? 'success' : 'info');
  } catch (err) {
    loading.classList.add('hidden');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row" style="padding:32px;">
          <div style="color:var(--text-secondary); margin-bottom:8px;">⚠ 查詢失敗：${err.message}</div>
          <div style="color:var(--text-tertiary); font-size:10px;">
            NVD API 端點：${apiUrl}<br>
            可能原因：CORS 限制、API 速率限制或網路問題。建議透過後端代理串接。
          </div>
        </td>
      </tr>`;
    showToast('NVD API 查詢失敗', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<span>◇</span> 搜尋漏洞';
}

async function fetchCVEData(apiUrl) {
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('API 速率限制，請稍後再試');
    if (response.status === 403) throw new Error('API 存取被拒，請確認來源');
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function getCVSSInfo(cve) {
  const metrics = cve.metrics;
  if (!metrics) return { score: null, severity: 'UNKNOWN', vector: '' };

  const v31 = metrics.cvssMetricV31?.[0]?.cvssData;
  const v30 = metrics.cvssMetricV30?.[0]?.cvssData;
  const v2  = metrics.cvssMetricV2?.[0]?.cvssData;

  const data = v31 || v30 || v2;
  if (!data) return { score: null, severity: 'UNKNOWN', vector: '' };

  return {
    score:    data.baseScore,
    severity: data.baseSeverity || (data.baseScore >= 9 ? 'CRITICAL' : data.baseScore >= 7 ? 'HIGH' : data.baseScore >= 4 ? 'MEDIUM' : 'LOW'),
    vector:   data.vectorString || '',
  };
}

function cvssClass(score) {
  if (score === null || score === undefined) return 'cvss-none';
  if (score >= 9.0) return 'cvss-critical';
  if (score >= 7.0) return 'cvss-high';
  if (score >= 4.0) return 'cvss-medium';
  return 'cvss-low';
}

function severityLabel(severity) {
  const map = {
    'CRITICAL': ['CRITICAL', 'tag-crit'],
    'HIGH':     ['HIGH',     'tag-warn'],
    'MEDIUM':   ['MEDIUM',   'tag-info'],
    'LOW':      ['LOW',      'tag-pass'],
    'UNKNOWN':  ['N/A',      ''],
  };
  const [label, cls] = map[severity?.toUpperCase()] || map['UNKNOWN'];
  return `<span class="tag ${cls}">${label}</span>`;
}

function renderCVEResults(vulnerabilities, total, keyword) {
  const tbody      = document.getElementById('cve-tbody');
  const totalCount = document.getElementById('cve-total-count');
  const sevCounts  = document.getElementById('cve-severity-counts');

  totalCount.textContent = `找到 ${total.toLocaleString()} 個漏洞  (顯示前 ${vulnerabilities.length} 筆)`;

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  vulnerabilities.forEach(v => {
    const { severity } = getCVSSInfo(v.cve);
    const key = severity?.toUpperCase();
    if (counts[key] !== undefined) counts[key]++;
  });

  const colorMap = {
    CRITICAL: 'var(--severity-critical)',
    HIGH:     'var(--severity-high)',
    MEDIUM:   'var(--severity-medium)',
    LOW:      'var(--severity-low)',
  };

  sevCounts.innerHTML = Object.entries(counts).map(([level, count]) => `
    <span class="sev-badge">
      <span class="sev-dot" style="background:${colorMap[level]};"></span>
      <span style="color:${colorMap[level]};">${level}: ${count}</span>
    </span>
  `).join('');

  if (vulnerabilities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">未找到「${keyword}」相關漏洞</td></tr>`;
    return;
  }

  tbody.innerHTML = vulnerabilities.map(item => {
    const cve = item.cve;
    const { score, severity } = getCVSSInfo(cve);
    const descEN = cve.descriptions?.find(d => d.lang === 'en')?.value || '無描述';
    const descZH = cve.descriptions?.find(d => d.lang === 'zh')?.value;
    const desc   = descZH || descEN;
    const pubDate = cve.published ? new Date(cve.published).toLocaleDateString('zh-Hant') : '—';

    return `
      <tr>
        <td>
          <a class="cve-id-link"
             href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cve.id)}"
             target="_blank" rel="noopener noreferrer">
            ${cve.id}
          </a>
        </td>
        <td>
          <span class="cvss-score ${cvssClass(score)}">
            ${score !== null ? score.toFixed(1) : 'N/A'}
          </span>
        </td>
        <td>${severityLabel(severity)}</td>
        <td><div class="cve-desc-text">${desc}</div></td>
        <td style="font-size:11px; color:var(--text-secondary);">${pubDate}</td>
      </tr>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   PWA Service Worker 註冊
═══════════════════════════════════════════════════════════════════ */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ═══════════════════════════════════════════════════════════════════
   應用程式初始化
═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHashModule();
  initMetaModule();
  initOSINTModule();
  initCVEModule();
  registerServiceWorker();

  updateFooterClock();
  setInterval(updateFooterClock, 1000);

  updateStatusText('系統就緒');
});
