param(
  [ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Profile = 'web',
  [string]$DshCommand = 'dsh'
)
$ErrorActionPreference = 'Stop'
if (Get-Command $DshCommand -ErrorAction SilentlyContinue) {
  & $DshCommand plugin --profile $Profile remove -w dsh-klee-clover-theme
} elseif ($DshCommand -eq 'dsh') {
  & npx --yes '@deepseek-ai/dsh@latest' plugin --profile $Profile remove -w dsh-klee-clover-theme
} else { throw "DSH command not found: $DshCommand" }
if ($LASTEXITCODE -ne 0) { throw 'Uninstall failed. Check the error above.' }
Write-Host 'Klee Clover removed. Saved appearance settings are retained.'
