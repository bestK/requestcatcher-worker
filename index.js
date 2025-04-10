import viewHtml from './public/view.html'
import indexHtml from './public/index.html'

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathParts = url.pathname.slice(1).split("/");
    const [endpoint, action] = pathParts;

    // 显示首页
    if (!endpoint) {
      return new Response(indexHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const keyLog = `log:${endpoint}`;
    const keyConfig = `config:${endpoint}`;

    // 查看页面
    if (action === "view") {
      return new Response(viewHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 获取日志
    if (action === "api" && pathParts[2] === "logs") {
      if (request.method === "DELETE") {
        // 清除日志
        await env.KV.delete(keyLog);
        return new Response("Logs cleared", {
          headers: { "Content-Type": "text/plain" },
        });
      }
      
      const logs = await env.KV.get(keyLog);
      return new Response(logs || "[]", {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 配置接口
    if (action === "api" && pathParts[2] === "config") {
      if (request.method === "POST") {
        const configText = await request.text();
        await env.KV.put(keyConfig, configText);
        return new Response("Config saved");
      } else {
        const config = await env.KV.get(keyConfig);
        return new Response(config || '{}', {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 正常记录请求
    const reqBody = await request.text();
    const log = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body: reqBody,
    };

    const existing = await env.KV.get(keyLog);
    const logs = existing ? JSON.parse(existing) : [];
    logs.unshift(log);
    await env.KV.put(keyLog, JSON.stringify(logs.slice(0, 50)));

    // 获取并使用配置来构建响应
    const configText = await env.KV.get(keyConfig);
    const config = configText ? JSON.parse(configText) : {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: { message: "Request received" }
    };

    return new Response(
      typeof config.body === 'string' ? config.body : JSON.stringify(config.body),
      {
        status: config.statusCode || 200,
        headers: config.headers || { "Content-Type": "application/json" }
      }
    );
  }
}
