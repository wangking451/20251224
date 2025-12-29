# 生成本地开发用的自签名SSL证书 (Windows PowerShell)

# 创建证书目录
New-Item -ItemType Directory -Force -Path "certs" | Out-Null

Write-Host "正在生成SSL证书..." -ForegroundColor Yellow

# 检查是否安装了OpenSSL
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($openssl) {
    # 使用OpenSSL生成证书
    & openssl req -x509 -newkey rsa:4096 -keyout certs/localhost-key.pem -out certs/localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    Write-Host ""
    Write-Host "✅ SSL证书生成成功！" -ForegroundColor Green
    Write-Host "📁 证书位置：" -ForegroundColor Cyan
    Write-Host "   - 私钥: certs/localhost-key.pem"
    Write-Host "   - 证书: certs/localhost.pem"
} else {
    Write-Host ""
    Write-Host "❌ 未找到 OpenSSL" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择以下方式之一：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方式1：安装 OpenSSL" -ForegroundColor Cyan
    Write-Host "   下载地址: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "   安装后重新运行此脚本"
    Write-Host ""
    Write-Host "方式2：使用 mkcert (推荐)" -ForegroundColor Cyan
    Write-Host "   1. 安装 Chocolatey: https://chocolatey.org/install"
    Write-Host "   2. 运行: choco install mkcert"
    Write-Host "   3. 运行: mkcert -install"
    Write-Host "   4. 运行: mkcert localhost 127.0.0.1 ::1"
    Write-Host ""
    Write-Host "方式3：使用反向代理" -ForegroundColor Cyan
    Write-Host "   使用 Caddy 或 nginx 配置 HTTPS"
    Write-Host ""
    
    exit 1
}

Write-Host ""
Write-Host "Start HTTPS dev server:" -ForegroundColor Green
Write-Host '   Set VITE_HTTPS=true; npm run dev' -ForegroundColor White
