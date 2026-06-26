const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 1. 加载 .env 配置
// ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const k = match[1].trim();
    let v = match[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}
loadEnv();

// ─────────────────────────────────────────────
// 2. 解析轮询密钥列表
// ─────────────────────────────────────────────
const keysString = process.env.GEMINI_ROTATING_KEYS || '';
const keys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

if (keys.length === 0) {
  console.warn('[Proxy] ⚠️  未检测到 GEMINI_ROTATING_KEYS，请在 .env 中配置');
} else {
  console.log(`[Proxy] ✅ 加载了 ${keys.length} 个 Gemini API Key`);
}

// ─────────────────────────────────────────────
// 3. Key 状态管理（按 Model 细粒度管理）
// ─────────────────────────────────────────────
// Map 存储每个 Key 针对不同模型的冷却状态
// 键格式为: `${keyIndex}_${modelName}`
// 值格式为: { until: timestamp, reason: 'rpm'|'rpd' }
const cooldowns = new Map();

// 从请求中获取模型名称
function getModelName(req, bodyBuffer) {
  const urlPath = req.url || '';
  
  // 1. 尝试从路径匹配，例如 /v1beta/models/gemini-2.5-flash:generateContent
  // 或者是 /v1beta/openai/models/gemini-2.5-flash/...
  const modelMatch = urlPath.match(/\/models\/([^:/?]+)/);
  if (modelMatch) {
    return modelMatch[1];
  }
  
  // 2. 尝试从请求体中解析（OpenAI 兼容接口）
  if (bodyBuffer && bodyBuffer.length > 0) {
    try {
      const parsed = JSON.parse(bodyBuffer.toString('utf-8'));
      if (parsed && parsed.model) {
        // 去掉前面的 "models/" 前缀
        return parsed.model.replace(/^models\//, '');
      }
    } catch (_) {}
  }
  
  // 3. 兜底默认模型
  return 'gemini-3.1-flash-lite';
}

// 从 429 响应体解析 Google 的 retryDelay（秒数，可带小数）
// 返回 { delaySec: number, isRpd: boolean }
function parseRetryInfo(bodyStr) {
  let delaySec = 65; // 默认 65s（RPM 窗口 60s + 5s 缓冲）
  let isRpd = false;

  try {
    const parsed = JSON.parse(bodyStr);
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    const details = obj?.error?.details ?? [];

    // 读取 RetryInfo.retryDelay（格式如 "57s" 或 "86399.123s"）
    for (const d of details) {
      if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
        const sec = parseFloat(String(d.retryDelay).replace(/s$/i, ''));
        if (!isNaN(sec)) delaySec = sec;
      }
    }

    // 判断是否是 RPD（每日）耗尽：retryDelay 超过 120s 基本确定是日级限制
    if (delaySec > 120) {
      isRpd = true;
    }

    // 也从违规 quotaId 直接判断
    for (const d of details) {
      if (d['@type']?.includes('QuotaFailure')) {
        for (const v of d.violations ?? []) {
          if (String(v.quotaId ?? '').toLowerCase().includes('perday')) {
            isRpd = true;
          }
        }
      }
    }
  } catch (_) {
    // 解析失败用默认值
  }

  return { delaySec, isRpd };
}

// 计算下一个 UTC 00:00（北京时间 08:00）的时间戳
function nextUtcMidnightMs() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tomorrow.getTime();
}

// 标记某个 Key 在特定模型下进入冷却
function setCooldown(index, modelName, delaySec, isRpd) {
  const now = Date.now();
  const cacheKey = `${index}_${modelName}`;
  
  if (isRpd) {
    // RPD 耗尽：等到明天 UTC 00:00 再试（加 5 分钟缓冲）
    const until = nextUtcMidnightMs() + 5 * 60 * 1000;
    cooldowns.set(cacheKey, { until, reason: 'rpd' });
    const resetAt = new Date(until).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    console.warn(`[Proxy] ⛔ Key${index + 1} 针对模型 [${modelName}] 日配额耗尽（RPD），冷却至 ${resetAt}`);
  } else {
    // RPM 超限：按 Google 给的 retryDelay + 5s 缓冲
    const bufSec = delaySec + 5;
    const until = now + bufSec * 1000;
    cooldowns.set(cacheKey, { until, reason: 'rpm' });
    console.warn(`[Proxy] ⏱  Key${index + 1} 针对模型 [${modelName}] 分钟配额超限（RPM），冷却 ${bufSec.toFixed(0)}s（Google retryDelay=${delaySec.toFixed(1)}s）`);
  }
}

// 找下一个可用 Key（从 startIndex 循环一圈）
function getAvailableKey(startIndex, modelName) {
  const now = Date.now();
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const cacheKey = `${idx}_${modelName}`;
    const cd = cooldowns.get(cacheKey);
    const until = cd ? cd.until : 0;
    
    if (now >= until) {
      // 冷却结束，重置状态
      if (until > 0) {
        console.log(`[Proxy] ✅ Key${idx + 1} 针对模型 [${modelName}] 冷却结束，恢复可用`);
        cooldowns.delete(cacheKey);
      }
      return { key: keys[idx], index: idx };
    }
  }
  return null; // 全部冷却中
}

// 打印当前特定模型的 Key 状态摘要
function printKeyStatus(modelName) {
  const now = Date.now();
  console.log(`[Proxy] ── Key 状态 (${modelName}) ──────────────────────────`);
  for (let i = 0; i < keys.length; i++) {
    const cacheKey = `${i}_${modelName}`;
    const cd = cooldowns.get(cacheKey);
    if (cd && cd.until > now) {
      const remainSec = ((cd.until - now) / 1000).toFixed(0);
      const reason = cd.reason === 'rpd' ? '日配额耗尽' : 'RPM超限';
      console.log(`[Proxy]   Key${i + 1}: 🔴 冷却中（${reason}），剩余 ${remainSec}s`);
    } else {
      console.log(`[Proxy]   Key${i + 1}: 🟢 可用`);
    }
  }
  console.log('[Proxy] ──────────────────────────────────────────────────');
}

// ─────────────────────────────────────────────
// 4. 轮询计数器
// ─────────────────────────────────────────────
let keyIndex = 0;

// ─────────────────────────────────────────────
// 5. HTTP 服务器
// ─────────────────────────────────────────────
const PORT = parseInt(process.env.PROXY_PORT || '3000', 10);

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  if (keys.length === 0) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'No API keys configured. Add GEMINI_ROTATING_KEYS=key1,key2,... to .env' } }));
    return;
  }

  // 路径转换：/v1/xxx -> /v1beta/openai/xxx
  let targetPath = req.url;
  if (targetPath.startsWith('/v1/')) {
    targetPath = targetPath.replace('/v1/', '/v1beta/openai/');
  }

  // 缓冲请求体（支持 429 重试时重放）
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const pickedIndex = keyIndex;
    keyIndex = (keyIndex + 1) % keys.length;
    
    // 解析具体模型
    const modelName = getModelName(req, body);
    
    doRequest(req, res, targetPath, body, pickedIndex, 0, modelName);
  });
  req.on('error', err => {
    console.error('[Proxy] 读取请求体失败:', err.message);
    if (!res.headersSent) { res.writeHead(500); res.end(); }
  });
});

// ─────────────────────────────────────────────
// 6. 核心转发函数（支持多 Key 重试）
// ─────────────────────────────────────────────
function doRequest(req, res, targetPath, body, startIndex, retryCount, modelName) {
  const available = getAvailableKey(startIndex + retryCount, modelName);

  if (!available) {
    // 所有 Key 都在冷却
    printKeyStatus(modelName);
    
    // 找出最早解封时间，告知用户
    let soonest = Infinity;
    let allRpd = true;
    for (let i = 0; i < keys.length; i++) {
      const cd = cooldowns.get(`${i}_${modelName}`);
      if (cd && cd.until > 0) {
        if (cd.until < soonest) soonest = cd.until;
        if (cd.reason !== 'rpd') allRpd = false;
      }
    }
    if (soonest === Infinity) soonest = Date.now();
    
    const remainSec = Math.max(0, ((soonest - Date.now()) / 1000)).toFixed(0);
    const msg = allRpd
      ? `所有 Key 针对模型 [${modelName}] 的每日配额已耗尽（RPD），请等到明天北京时间 08:00 后重试。`
      : `所有 Key 针对模型 [${modelName}] 均处于限速冷却中，最快 ${remainSec}s 后可用，请稍候重试。`;
    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: { message: msg } }));
    return;
  }

  const { key: selectedKey, index: currentKeyIndex } = available;

  // 非 OpenAI 兼容路径需要拼接 key 参数
  let finalPath = targetPath;
  if (!targetPath.startsWith('/v1beta/openai/')) {
    const connector = targetPath.includes('?') ? '&' : '?';
    finalPath = `${targetPath}${connector}key=${selectedKey}`;
  }

  // ─────────────────────────────────────────────
  // 性能/鲁棒性优化：
  // 1. 自动剥离请求体中冗余的 "models/" 前缀（无条件剥离），防 Google 识别错误。
  // 2. 重新强制写入 content-length，解决 400 Bad Request 问题。
  // ─────────────────────────────────────────────
  let finalBody = body;
  if (body.length > 0) {
    try {
      const parsed = JSON.parse(body.toString('utf-8'));
      let modified = false;

      if (parsed && parsed.model && typeof parsed.model === 'string' && parsed.model.startsWith('models/')) {
        const oldModel = parsed.model;
        parsed.model = parsed.model.replace(/^models\//, '');
        console.log(`[Proxy] 自动剥离模型前缀 ${oldModel} -> ${parsed.model}`);
        modified = true;
      }

      // 移除 Gemini 不支持的 store 参数
      if (parsed && typeof parsed === 'object' && 'store' in parsed) {
        delete parsed.store;
        console.log(`[Proxy] 自动移除不兼容参数 'store'`);
        modified = true;
      }

      if (modified) {
        finalBody = Buffer.from(JSON.stringify(parsed), 'utf-8');
      }
    } catch (_) {}
  }

  const headers = { ...req.headers };
  headers['host']            = 'generativelanguage.googleapis.com';
  headers['authorization']   = `Bearer ${selectedKey}`;
  headers['accept-encoding'] = 'identity'; // 禁用 gzip，防止中文乱码
  headers['content-length']  = finalBody.length; // 强制使用实际处理后的 buffer 长度

  const tag = retryCount > 0 ? ` [重试 #${retryCount}]` : '';
  console.log(`[Proxy] ${new Date().toLocaleTimeString('zh-CN')} ${req.method} ${req.url} → Key${currentKeyIndex + 1}${tag} (模型: ${modelName})`);

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: finalPath,
    method: req.method,
    headers,
    rejectUnauthorized: false,
  };

  const proxyReq = https.request(options, proxyRes => {
    if (proxyRes.statusCode === 400) {
      console.log(`[Proxy] 🚨 ERROR 400 encountered!`);
      console.log(`[Proxy] Request Headers:`, JSON.stringify(headers));
      console.log(`[Proxy] Request Body:`, finalBody.toString('utf-8'));
    }

    if (proxyRes.statusCode === 429 && retryCount < keys.length - 1) {
      // 读完响应体再解析
      const respChunks = [];
      proxyRes.on('data', c => respChunks.push(c));
      proxyRes.on('end', () => {
        const bodyStr = Buffer.concat(respChunks).toString('utf-8');
        const { delaySec, isRpd } = parseRetryInfo(bodyStr);
        setCooldown(currentKeyIndex, modelName, delaySec, isRpd);
        // 立即切换下一个 Key 重试，使用原始的 body，因为在 doRequest 里面会重新转换 finalBody
        doRequest(req, res, targetPath, body, startIndex, retryCount + 1, modelName);
      });
      return;
    }

    // 正常转发（含最后一次 429 失败透传）
    const responseHeaders = { ...proxyRes.headers };
    delete responseHeaders['content-encoding']; // 已禁用压缩，清除该头防止客户端误判
    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.setTimeout(300000, () => {
    proxyReq.destroy();
    console.error('[Proxy] 请求超时 (300s)');
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: 'Gateway Timeout: Google API 未在 300s 内响应' } }));
    }
  });

  proxyReq.on('error', err => {
    console.error('[Proxy] 转发失败:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: `代理连接失败: ${err.message}` } }));
    }
  });

  if (finalBody.length > 0) proxyReq.write(finalBody);
  proxyReq.end();
}

// ─────────────────────────────────────────────
// 7. 启动
// ─────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log(`[Proxy] ════════════════════════════════════`);
  console.log(`[Proxy]  Gemini 轮询代理已启动`);
  console.log(`[Proxy]  监听地址: http://localhost:${PORT}`);
  console.log(`[Proxy]  客户端 Base URL: http://localhost:${PORT}/v1`);
  console.log(`[Proxy]  共 ${keys.length} 个 Key，智能 429 重试已启用`);
  console.log(`[Proxy]  · RPM 超限 → 按 Google retryDelay + 5s 冷却`);
  console.log(`[Proxy]  · RPD 耗尽 → 冷却至明天北京时间 08:05`);
  console.log(`[Proxy]  · 细粒度管理 → 不同 Model 冷却独立计算，防止 429 误杀`);
  console.log(`[Proxy]  · 禁用 gzip → 防止中文乱码`);
  console.log(`[Proxy] ════════════════════════════════════`);
  console.log('');
});
