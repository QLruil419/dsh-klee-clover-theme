function Resolve-ThemeDshCommand {
  param([string]$Profile, [string]$DshCommand, [string]$DesktopPath)
  if ($DesktopPath) {
    if ($Profile -ne 'desktop') { throw '-DesktopPath requires -Profile desktop.' }
    $DshCommand = Join-Path $DesktopPath 'resources\runtime\cli\bin\dsh.cmd'
  }
  if ($DshCommand) {
    $command = Get-Command $DshCommand -ErrorAction SilentlyContinue
    if (-not $command) { throw "DSH command not found: $DshCommand" }
    return $command.Source
  }
  if ($Profile -eq 'desktop') {
    # Never fall back to npm/npx: the desktop profile is application-owned.
    throw 'Desktop requires -DesktopPath <Harness installation directory> or -DshCommand <bundled dsh.cmd>. Launch Desktop once, then quit it from the tray before installation.'
  }
  $command = Get-Command dsh -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  return $null
}

