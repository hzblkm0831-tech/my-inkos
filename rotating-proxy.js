const http = require('http');
const https = require('https');

// 3 个已验证可用的 Gemini API 密钥
const keys = [
  'AIzaSyCqo_MDBI6rosUbZ7qGgP12wsI5IFG6UII', // Key 1
  'AIzaSyAB3_nzf5e5cuCb4Rvl61yK_3sGh4az9fY', // Key 2
  'AIzaSyCn76vO8jIfl_-zbTrEAKnEsUnMXi0UpF4'  // Key 3
];

let keyIndex = 0;
const PORT = 3000;

const server = http.createServer((req, res) => {
  // 只接收 GET（如 list models）和 POST（如 chat completions）请求
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // 轮询选择 API Key
  const selectedKey = keys[keyIndex];
  const currentKeyIndex = keyIndex;
  keyIndex = (keyIndex + 1) % keys.length;
  
  console.log(`[Proxy] [${new Date().toLocaleTimeString()}] 收到请求: ${req.method} ${req.url} -> 分发给 Key ${currentKeyIndex + 1} (${selectedKey.substring(0, 10)}...)`);

  // 处理路径转换：/v1/chat/completions -> /v1beta/openai/chat/completions
  let targetPath = req.url;
  if (targetPath.startsWith('/v1/')) {
    targetPath = targetPath.replace('/v1/', '/v1beta/openai/');
  }

  const headers = { ...req.headers };
  // 覆盖 Host 头部以匹配真实的 API 地址
  headers['host'] = 'generativelanguage.googleapis.com';
  // 注入鉴权 Key 到 Header 头部 (OpenAI 兼容鉴权)
  headers['authorization'] = `Bearer ${selectedKey}`;

  // 双重保险：URL query params 也加上 key=...
  const connector = targetPath.includes('?') ? '&' : '?';
  const finalPath = `${targetPath}${connector}key=${selectedKey}`;

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: finalPath,
    method: req.method,
    headers: headers,
    rejectUnauthorized: false
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // 转发 Google 返回的原始 HTTP 状态码与 Headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // 直接管道化输出 (完美透传 Chunked / Stream)
    proxyRes.pipe(res);
  });

  // 加上超时保护以防止连接被 Google API 静默切断后无限挂起
  proxyReq.setTimeout(300000, () => {
    proxyReq.destroy();
    console.error(`[Proxy] 请求超时 (300s): ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: "Gateway Timeout: Google API did not respond within 300 seconds." } }));
    }
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy] 转发失败: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: `Local proxy connection failed: ${err.message}` } }));
    }
  });

  // 将客户端的请求体数据管道化传输给 Google API
  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`[Proxy] Gemini 3-Key 轮询代理服务器启动成功！`);
  console.log(`[Proxy] 本地监听地址: http://localhost:${PORT}`);
  console.log(`[Proxy] 推荐的客户端 Base URL 配置为: http://localhost:${PORT}/v1`);
  console.log(`[Proxy] 正在运行轮询算法分发 API 请求 (3 个 Keys 已就绪)...`);
});
