#!/bin/bash
# 生成本地开发用的自签名SSL证书

# 创建证书目录
mkdir -p certs

# 生成私钥和证书（有效期365天）
openssl req -x509 -newkey rsa:4096 -keyout certs/localhost-key.pem -out certs/localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ SSL证书生成成功！"
echo "📁 证书位置："
echo "   - 私钥: certs/localhost-key.pem"
echo "   - 证书: certs/localhost.pem"
echo ""
echo "🚀 启动HTTPS服务："
echo "   VITE_HTTPS=true npm run dev"
