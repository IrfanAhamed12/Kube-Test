const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const VERSION = 'v1';
const BOT_NAME = process.env.BOT_NAME || 'KubeBot';
const WELCOME_MSG = process.env.WELCOME_MSG || 'Hello! I am KubeBot. Ask me anything about Kubernetes!';
const API_KEY = process.env.API_KEY || 'not-set';
const APP_ENV = process.env.APP_ENV || 'local';

// Simple bot responses
const responses = {
  'pod': 'A Pod is the smallest unit in Kubernetes. It wraps one or more containers.',
  'service': 'A Service provides a stable IP address for a group of pods. Types: ClusterIP, NodePort, LoadBalancer.',
  'deployment': 'A Deployment manages ReplicaSets and enables rolling updates with zero downtime.',
  'replicaset': 'A ReplicaSet ensures a specified number of pods are always running.',
  'node': 'A Node is a worker machine (physical or virtual) where Kubernetes runs your pods.',
  'kubectl': 'kubectl is the command-line tool to interact with your Kubernetes cluster.',
  'docker': 'Docker builds container images. Kubernetes orchestrates and manages those containers at scale.',
  'configmap': 'A ConfigMap stores non-sensitive configuration as key-value pairs, injected as env vars.',
  'secret': 'A Secret stores sensitive data like passwords and API keys, base64-encoded.',
  'probe': 'Probes check pod health. Liveness = is it alive? Readiness = is it ready for traffic?',
  'rollback': 'kubectl rollout undo deployment/<name> instantly reverts to the previous version.',
  'namespace': 'A Namespace isolates resources in a cluster. Like separate folders for different apps.',
  'helm': 'Helm is a package manager for Kubernetes. One template chart, different values per app.',
  'help': 'Try asking about: pod, service, deployment, replicaset, node, configmap, secret, probe, rollback, namespace, helm, kubectl, docker'
};

function getBotReply(msg) {
  const lower = msg.toLowerCase().trim();
  for (const [key, reply] of Object.entries(responses)) {
    if (lower.includes(key)) return reply;
  }
  return `I don't know about "${msg}" yet. Type "help" to see what I can answer!`;
}

// HTML page
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${BOT_NAME}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f2f5;height:100vh;display:flex;flex-direction:column}
.header{background:#075e54;color:white;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:18px;font-weight:600}
.header .info{font-size:11px;opacity:.8;text-align:right;line-height:1.4}
.chat{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}
.msg{max-width:75%;padding:8px 14px;border-radius:12px;font-size:14px;line-height:1.4;animation:fadeIn .3s ease}
.msg.bot{background:white;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.msg.user{background:#dcf8c6;align-self:flex-end;border-bottom-right-radius:4px}
.msg .meta{font-size:10px;color:#888;margin-top:4px}
.input-bar{display:flex;gap:8px;padding:12px 16px;background:white;border-top:1px solid #e0e0e0}
.input-bar input{flex:1;padding:10px 14px;border:1px solid #ddd;border-radius:20px;font-size:14px;outline:none}
.input-bar input:focus{border-color:#075e54}
.input-bar button{padding:10px 20px;background:#075e54;color:white;border:none;border-radius:20px;font-size:14px;cursor:pointer;font-weight:600}
.input-bar button:hover{background:#064e46}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;margin-left:6px}
.badge-green{background:rgba(255,255,255,.2)}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>🤖 ${BOT_NAME} <span class="badge badge-green">${VERSION}</span></h1>
  </div>
  <div class="info">
    Pod: ${os.hostname()}<br>
    IP: ${Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'unknown'}<br>
    Env: ${APP_ENV}
  </div>
</div>
<div class="chat" id="chat"></div>
<div class="input-bar">
  <input type="text" id="input" placeholder="Ask me about Kubernetes..." autocomplete="off">
  <button onclick="send()">Send</button>
</div>
<script>
const chat = document.getElementById('chat');
const input = document.getElementById('input');

function addMsg(text, type, meta) {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = text + (meta ? '<div class="meta">' + meta + '</div>' : '');
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

addMsg("${WELCOME_MSG.replace(/"/g, '\\"')}", 'bot', '${BOT_NAME} · ${VERSION}');

async function send() {
  const msg = input.value.trim();
  if (!msg) return;
  addMsg(msg, 'user');
  input.value = '';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: msg})
    });
    const data = await res.json();
    addMsg(data.reply, 'bot', data.pod + ' · ' + data.version);
  } catch(e) {
    addMsg('Error connecting to server.', 'bot');
  }
}

input.addEventListener('keydown', e => { if(e.key === 'Enter') send(); });
input.focus();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  // Health endpoint (liveness probe)
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({status: 'UP'}));
  }

  // Ready endpoint (readiness probe)
  if (req.url === '/ready') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({status: 'READY'}));
  }

  // Chat API
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const {message} = JSON.parse(body);
        const reply = getBotReply(message);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          reply,
          pod: os.hostname(),
          version: VERSION,
          environment: APP_ENV
        }));
      } catch(e) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid request'}));
      }
    });
    return;
  }

  // Info endpoint (for debugging)
  if (req.url === '/info') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({
      pod: os.hostname(),
      version: VERSION,
      environment: APP_ENV,
      botName: BOT_NAME,
      apiKeySet: API_KEY !== 'not-set'
    }));
  }

  // Serve HTML
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`${BOT_NAME} ${VERSION} running on port ${PORT}`);
  console.log(`Pod: ${os.hostname()}`);
  console.log(`Environment: ${APP_ENV}`);
});