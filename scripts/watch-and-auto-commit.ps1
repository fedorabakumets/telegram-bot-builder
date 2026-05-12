<#
@fileoverview Скрипт-наблюдатель для автокоммита через периодическую проверку git-статуса
#>

param(
  [string]$RootPath = ".",
  [int]$DebounceSeconds = 15,
  [int]$PollSeconds = 3,
  [string]$MessagePrefix = "auto: watcher changes"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

<#
 @description Возвращает корень git-репозитория.
 @param PreferredRoot Предпочтительный путь к репозиторию.
 @returns Абсолютный путь к корню репозитория.
#>
function Get-RepositoryRoot {
  param([string]$PreferredRoot)
  return (Resolve-Path -LiteralPath $PreferredRoot).Path
}

<#
 @description Возвращает список измененных файлов из git status.
 @returns Список относительных путей измененных файлов.
#>
function Get-ChangedPaths {
  $statusLines = @(git status --porcelain)
  $paths = @()

  foreach ($statusLine in $statusLines) {
    if (-not $statusLine -or $statusLine.Length -lt 4) {
      continue
    }

    $path = $statusLine.Substring(3).Trim()
    if ($path -and -not $path.StartsWith(".git", [System.StringComparison]::OrdinalIgnoreCase)) {
      $paths += $path
    }
  }

  return @($paths | Select-Object -Unique)
}

$repositoryRoot = Get-RepositoryRoot -PreferredRoot $RootPath
$watcherScriptPath = Join-Path $repositoryRoot "scripts\auto-commit.ps1"
$lastChangedPaths = @()
$lastChangeAt = [datetime]::MinValue

Push-Location $repositoryRoot

try {
  Write-Host "Watcher запущен в $repositoryRoot"
  Write-Host "Проверка каждые $PollSeconds сек., автокоммит после $DebounceSeconds сек. тишины."

  while ($true) {
    $changedPaths = @(Get-ChangedPaths)
    $hasChanges = $changedPaths.Length -gt 0
    $samePaths = (@(Compare-Object -ReferenceObject $lastChangedPaths -DifferenceObject $changedPaths -SyncWindow 0).Length -eq 0)

    if ($hasChanges -and -not $samePaths) {
      $lastChangedPaths = $changedPaths
      $lastChangeAt = Get-Date
    }
    elseif ($hasChanges -and $lastChangeAt -ne [datetime]::MinValue) {
      $silenceDuration = (Get-Date) - $lastChangeAt
      if ($silenceDuration.TotalSeconds -ge $DebounceSeconds) {
        & $watcherScriptPath -RepoRoot $repositoryRoot -Paths $changedPaths -Message $MessagePrefix
        $lastChangedPaths = @()
        $lastChangeAt = [datetime]::MinValue
      }
    }
    else {
      $lastChangedPaths = @()
      $lastChangeAt = [datetime]::MinValue
    }

    Start-Sleep -Seconds $PollSeconds
  }
}
finally {
  Pop-Location
}
