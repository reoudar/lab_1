param([Parameter(Mandatory=$true)][string]$Stage)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$snapshotDir = Join-Path $projectRoot '.checkpoints'
New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null
$snapshotPath = Join-Path $snapshotDir ($Stage + '.zip')
if (Test-Path -LiteralPath $snapshotPath) { throw "Snapshot already exists: $snapshotPath" }
$names = @('.gitignore', 'phase_cli_1.md', 'README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'src', 'test', 'doc', 'examples', 'scripts', '.github')
$sources = $names | ForEach-Object { Join-Path $projectRoot $_ } | Where-Object { Test-Path -LiteralPath $_ }
Compress-Archive -LiteralPath $sources -DestinationPath $snapshotPath
Write-Output "Saved $Stage snapshot: $snapshotPath"
