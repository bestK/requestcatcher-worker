
// --- 简易路由系统 ---
const routes = [];

function register(method, path, handler) {
    routes.push({ method, path, handler });
}

function matchRoute(method, url) {
    // 先尝试精确匹配
    for (const route of routes) {
        if (route.method !== method && route.method !== '*') continue;

        const routeParts = route.path.split('/').filter(Boolean);
        const urlParts = url.split('/').filter(Boolean);

        // 特殊处理 view 路由
        if (route.path === '*/view') {
            if (urlParts[urlParts.length - 1] === 'view') {
                return {
                    handler: route.handler,
                    params: {
                        endpoint: urlParts.slice(0, -1).join('/')  // 把 view 之前的所有路径作为 endpoint
                    }
                };
            }
            continue;
        }

        // 处理其他路由
        if (route.path.includes('*')) {
            const params = {};
            let matched = true;

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i] === '*') {
                    params['wildcard'] = urlParts.slice(i).join('/');
                    return { handler: route.handler, params };
                } else if (routeParts[i].startsWith(':')) {
                    if (i >= urlParts.length) {
                        matched = false;
                        break;
                    }
                    params[routeParts[i].substring(1)] = decodeURIComponent(urlParts[i]);
                } else if (routeParts[i] !== urlParts[i]) {
                    matched = false;
                    break;
                }
            }

            if (matched) return { handler: route.handler, params };
            continue;
        }

        // 精确路由匹配
        if (routeParts.length !== urlParts.length) continue;

        const params = {};
        let matched = true;

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].substring(1)] = decodeURIComponent(urlParts[i]);
            } else if (routeParts[i] !== urlParts[i]) {
                matched = false;
                break;
            }
        }

        if (matched) return { handler: route.handler, params };
    }

    return null;
}

export { register, matchRoute };
