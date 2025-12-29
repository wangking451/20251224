# 生产环境一键部署脚本
# 用法: .\deploy-production.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nebula Cyber Store - 生产环境部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查必要的命令
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 1. 检查环境
Write-Host "步骤 1/3: 检查部署环境..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "未安装 Node.js" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "未安装 npm" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js 和 npm 已安装" -ForegroundColor Green
Write-Host ""

# 2. 备份当前代码
Write-Host "步骤 2/3: 备份当前代码..." -ForegroundColor Yellow
& "$PSScriptRoot\backup.ps1"
Write-Host ""

# 3. 构建生产版本
Write-Host "步骤 3/3: 构建生产版本..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "构建成功" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  构建完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "1. 安装 Vercel CLI: npm install -g vercel" -ForegroundColor White
Write-Host "2. 登录 Vercel: vercel login" -ForegroundColor White
Write-Host "3. 部署: vercel --prod" -ForegroundColor White
Write-Host "4. 在 Vercel Dashboard 配置环境变量" -ForegroundColor White
Write-Host ""
