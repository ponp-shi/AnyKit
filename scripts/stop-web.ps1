Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name node -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "*AnyKit*" -or $_.MainWindowTitle -like "*anykit*" } |
  Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "已关闭本机 3000 端口和 Cloudflare 隧道。"
