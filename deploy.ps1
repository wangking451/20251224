# Nebula Cyber Store - 一键部署到 Vercel
# 使用前请确保已安装 Vercel CLI: npm install -g vercel

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Nebula Cyber Store Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Vercel CLI
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Write-Host "Error: Vercel CLI not found" -ForegroundColor Red
    Write-Host "Install: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Vercel CLI detected" -ForegroundColor Green

# 2. 构建项目
Write-Host "[2/4] Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Build completed" -ForegroundColor Green

# 3. 部署到 Vercel
Write-Host "[3/4] Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure environment variables in Vercel Dashboard" -ForegroundColor White
Write-Host "2. Deploy backend to Railway/Render" -ForegroundColor White
Write-Host "3. Update CORS whitelist in server/server.js" -ForegroundColor White
Write-Host "4. Test payment flow" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
