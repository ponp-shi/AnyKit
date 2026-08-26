$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

Set-Location $frontend

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
  npm install
}

if (-not (Test-Path (Join-Path $frontend "out\index.html"))) {
  npm run build
}

$busy = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($busy) {
  $busy.OwningProcess | Sort-Object -Unique | ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
}

Start-Process -FilePath "npm" -ArgumentList "run", "start" -WorkingDirectory $frontend -WindowStyle Minimized
Start-Sleep -Seconds 2

if (Test-Path $cloudflared) {
  Start-Process -FilePath $cloudflared -ArgumentList "tunnel", "--url", "http://localhost:3000"
  Write-Host "本机地址: http://localhost:3000"
  Write-Host "公网地址会显示在新打开的 cloudflared 窗口里（trycloudflare.com）。"
} else {
  Write-Host "本机地址: http://localhost:3000"
  Write-Host "未找到 cloudflared，只开启了本机访问。"
}
