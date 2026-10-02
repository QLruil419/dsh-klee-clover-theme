param(
  [ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Profile = 'web',
  [string]$DshCommand = '',
  [string]$DesktopPath = ''
)
$ErrorActionPreference = 'Stop'
$pluginDir = $PSScriptRoot
. (Join-Path $PSScriptRoot 'scripts\dsh-command.ps1')
$command = Resolve-ThemeDshCommand $Profile $DshCommand $DesktopPath
if ($Profile -eq 'desktop') {
  & $command plugin --profile desktop add "file:$pluginDir"
  if ($LASTEXITCODE -ne 0) { throw 'Desktop installation failed. Confirm the app was initialized and fully quit, and DSH_HOME matches the app.' }
  Write-Host 'Klee Clover installed in desktop. Disable other global themes and reopen Harness.' -ForegroundColor Green
  return
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is required for Web installation.' }
Push-Location $pluginDir
try {
  & npm install --omit=dev
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed. The theme was not installed.' }
  if ($command) {
    & $command plugin --profile $Profile add -w $pluginDir
  } else {
    & npx --yes '@deepseek-ai/dsh@latest' plugin --profile $Profile add -w $pluginDir
  }
  if ($LASTEXITCODE -ne 0) { throw 'DSH plugin installation failed. Check the error above.' }
} finally { Pop-Location }
Write-Host "Klee Clover installed in profile '$Profile'." -ForegroundColor Green
Write-Host 'Disable other global themes, restart Harness, then open Settings > Klee Clover.'
