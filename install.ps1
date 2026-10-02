param(
  [ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Profile = 'web',
  [string]$DshCommand = 'dsh'
)
$ErrorActionPreference = 'Stop'
$pluginDir = $PSScriptRoot
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is required.' }
Push-Location $pluginDir
try {
  & npm install --omit=dev
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed. The theme was not installed.' }
  if (Get-Command $DshCommand -ErrorAction SilentlyContinue) {
    & $DshCommand plugin --profile $Profile add -w $pluginDir
  } elseif ($DshCommand -eq 'dsh') {
    & npx --yes '@deepseek-ai/dsh@latest' plugin --profile $Profile add -w $pluginDir
  } else {
    throw "DSH command not found: $DshCommand"
  }
  if ($LASTEXITCODE -ne 0) { throw 'DSH plugin installation failed. Check the error above.' }
} finally { Pop-Location }
Write-Host "Klee Clover installed in profile '$Profile'." -ForegroundColor Green
Write-Host 'Disable other global themes, restart Harness, then open Settings > Klee Clover.'
