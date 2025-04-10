import viewHtml from './public/view.html'
import indexHtml from './public/index.html'
import { register, matchRoute } from './public/router.js'

// --- 路由处理器 ---
// 首页
async function handleIndex(request, env) {
    return new Response(indexHtml, {
        headers: { "Content-Type": "text/html" },
    });
}

// 查看页面
async function handleView(request, env, ctx, params) {
    return new Response(viewHtml, {
        headers: { "Content-Type": "text/html" },
    });
}

// 获取日志
async function handleGetLogs(request, env, ctx, params) {
    const keyLog = `log:${params.endpoint}`;
    const logs = await env.KV.get(keyLog);
    return new Response(logs || "[]", {
        headers: { "Content-Type": "application/json" },
    });
}

// 清除日志
async function handleDeleteLogs(request, env, ctx, params) {
    const keyLog = `log:${params.endpoint}`;
    await env.KV.delete(keyLog);
    return new Response("Logs cleared", {
        headers: { "Content-Type": "text/plain" },
    });
}

// 获取配置
async function handleGetConfig(request, env, ctx, params) {
    const keyConfig = `config:${params.endpoint}`;
    const config = await env.KV.get(keyConfig);
    return new Response(config || '{}', {
        headers: { "Content-Type": "application/json" },
    });
}

// 保存配置
async function handleSaveConfig(request, env, ctx, params) {
    const keyConfig = `config:${params.endpoint}`;
    const configText = await request.text();
    await env.KV.put(keyConfig, configText);
    return new Response("Config saved");
}

// 处理普通请求
async function handleRequest(request, env, ctx, params) {
    const keyLog = `log:${params.endpoint}`;
    const keyConfig = `config:${params.endpoint}`;
    const url = new URL(request.url);

    // 记录请求
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

    // 返回配置的响应
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

// --- 注册路由 ---
register('GET', '/', handleIndex);
// 修改 view 路由匹配规则
register('GET', '*/view', handleView);  // 修改这里，让任何路径后跟 /view 都匹配
register('GET', '/:endpoint/api/logs', handleGetLogs);
register('DELETE', '/:endpoint/api/logs', handleDeleteLogs);
register('GET', '/:endpoint/api/config', handleGetConfig);
register('POST', '/:endpoint/api/config', handleSaveConfig);
register('*', '/:endpoint/*', handleRequest);

// --- 主处理函数 ---
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        const route = matchRoute(request.method, pathname) || 
                     matchRoute('*', pathname);  // fallback to catch-all route
        
        if (route) {
            try {
                return await route.handler(request, env, ctx, route.params);
            } catch (err) {
                return new Response('Internal Server Error', { status: 500 });
            }
        }

        return new Response('Not Found', { status: 404 });
    }
}
