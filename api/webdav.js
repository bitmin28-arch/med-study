// 坚果云 WebDAV 反向代理 —— 解决浏览器跨域限制
// 部署在 Vercel Serverless Function 上，走国内节点，坚果云不会拦截
module.exports = async function handler(req, res) {
    // 设置 CORS 响应头（允许来自任意源的请求）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理浏览器 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // 坚果云 WebDAV 目标地址
    const targetUrl = 'https://dav.jianguoyun.com/dav/med_study_progress.json';

    // 构造转发请求头：只保留必要的认证和内容类型头
    const headers = {};
    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'];
    }

    const fetchOptions = {
        method: req.method,
        headers
    };

    // 只有写操作（PUT 等）才传递请求体
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        if (req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
    }

    try {
        const response = await fetch(targetUrl, fetchOptions);
        const buffer = await response.arrayBuffer();

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.status(response.status).send(Buffer.from(buffer));
    } catch (err) {
        res.status(500).json({ error: '中转代理错误: ' + err.message });
    }
};
