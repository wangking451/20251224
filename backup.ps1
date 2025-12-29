# 网站备份脚本
# 用法: .\backup.ps1

$ErrorActionPreference = "Stop"

# 生成时间戳
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "backup_$timestamp"

Write-Host "🔄 开始备份..." -ForegroundColor Cyan

# 删除所有旧备份
Get-ChildItem -Directory -Filter "backup_*" | ForEach-Object {
    Write-Host "🗑️  删除旧备份: $($_.Name)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Recurse -Force
}

# 创建临时备份目录
$tempBackup = "temp_backup_$timestamp"
New-Item -ItemType Directory -Path $tempBackup | Out-Null

# 需要备份的文件和文件夹
$itemsToBackup = @(
    "components",
    "services",
    "src",
    "utils",
    "server",
    "App.tsx",
    "index.html",
    "index.tsx",
    "types.ts",
    "products.ts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    ".env.example",
    ".env.production.example",
    "metadata.json"
)

# 复制文件
foreach ($item in $itemsToBackup) {
    if (Test-Path $item) {
        Write-Host "📦 备份: $item" -ForegroundColor Gray
        Copy-Item -Path $item -Destination $tempBackup -Recurse -Force
    }
}

# 重命名为最终备份名称
Rename-Item -Path $tempBackup -NewName $backupName

Write-Host "✅ 备份完成: $backupName" -ForegroundColor Green
Write-Host ""
Write-Host "备份内容:" -ForegroundColor Cyan
Get-ChildItem -Path $backupName | Select-Object Name, Length, LastWriteTime
