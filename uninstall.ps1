param(
  [ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Profile = 'web',
  [string]$DshCommand = '',
  [string]$DesktopPath = ''
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'scripts\dsh-command.ps1')
$command = Resolve-ThemeDshCommand $Profile $DshCommand $DesktopPath
if ($command) {
  & $command plugin --profile $Profile remove dsh-klee-clover-theme
} else {
  & npx --yes '@deepseek-ai/dsh@latest' plugin --profile $Profile remove -w dsh-klee-clover-theme
}
if ($LASTEXITCODE -ne 0) { throw 'Uninstall failed. Check the error above.' }
Write-Host 'Klee Clover removed. Saved appearance settings are retained.'
