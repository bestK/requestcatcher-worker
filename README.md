# RequestCatcher Worker

一个简易的 RequestCatcher，使用 Cloudflare Workers 实现，可用于调试 webhook 等请求捕获任务。

## 功能

- 捕获任意请求（路径即 token）
- 可配置返回内容
- 可通过网页查看请求日志

## 使用

1. 安装 wrangler
2. 创建 KV 命名空间并填入 wrangler.toml
3. 执行 `wrangler publish` 发布

访问示例：

- 发送请求: `https://your.worker.dev/abc123`
- 查看日志: `https://your.worker.dev/abc123/view`
- 设置响应: `POST https://your.worker.dev/abc123/api/config`
