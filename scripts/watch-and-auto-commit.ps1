<#
@fileoverview Скрипт-наблюдатель для автокоммита файлов после паузы в изменениях
#>

param(
  [string]$RootPath = ".",
  [int]$DebounceSeconds = 15,
  [string]$MessagePrefix = "auto: watcher changes"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

<#
 @description Добавляет путь в набор ожидающих коммита файлов.
 @param PendingPaths Набор путей.
 @param RepositoryRoot Корень репозитория.
 @param FilePath Абсолютный путь к файлу.
#>
function Add-PendingPath {
  param(
    [System.Collections.Generic.HashSet[string]]$PendingPaths,
    [string]$RepositoryRoot,
    [string]$FilePath
  )

  if (-not $FilePath) {
    return
  }

  $fullPath = [System.IO.Path]::GetFullPath($FilePath)
  if (-not $fullPath.StartsWith($RepositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return
  }

  $relativePath = [System.IO.Path]::GetRelativePath($RepositoryRoot, $fullPath)
  if ($relativePath -and -not $relativePath.StartsWith(".git", [System.StringComparison]::OrdinalIgnoreCase)) {
    $PendingPaths.Add($relativePath) | Out-Null
  }
}

$repositoryRoot = (Resolve-Path -LiteralPath $RootPath).Path
$watcherScriptPath = Join-Path $repositoryRoot "scripts\auto-commit.ps1"
$pendingPaths = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$lastChangeAt = [datetime]::MinValue

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repositoryRoot
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, DirectoryName, LastWrite, CreationTime'
$watcher.EnableRaisingEvents = $true

$handleChange = {
  $script:lastChangeAt = Get-Date
  Add-PendingPath -PendingPaths $script:pendingPaths -RepositoryRoot $script:repositoryRoot -FilePath $Event.SourceEventArgs.FullPath
}

$createdRegistration = Register-ObjectEvent $watcher Created -Action $handleChange
$changedRegistration = Register-ObjectEvent $watcher Changed -Action $handleChange
$deletedRegistration = Register-ObjectEvent $watcher Deleted -Action $handleChange
$renamedRegistration = Register-ObjectEvent $watcher Renamed -Action {
  $script:lastChangeAt = Get-Date
  Add-PendingPath -PendingPaths $script:pendingPaths -RepositoryRoot $script:repositoryRoot -FilePath $Event.SourceEventArgs.OldFullPath
  Add-PendingPath -PendingPaths $script:pendingPaths -RepositoryRoot $script:repositoryRoot -FilePath $Event.SourceEventArgs.FullPath
}

Write-Host "Watcher запущен в $repositoryRoot"
Write-Host "Автокоммит выполнится после $DebounceSeconds секунд тишины. Остановка: Ctrl+C"

try {
  while ($true) {
    Start-Sleep -Seconds 1
    if ($pendingPaths.Count -eq 0 -or $lastChangeAt -eq [datetime]::MinValue) {
      continue
    }

    $silenceDuration = (Get-Date) - $lastChangeAt
    if ($silenceDuration.TotalSeconds -lt $DebounceSeconds) {
      continue
    }

    $pathsToCommit = [string[]]$pendingPaths
    $pendingPaths.Clear()
    $lastChangeAt = [datetime]::MinValue
    & $watcherScriptPath -RepoRoot $repositoryRoot -Paths $pathsToCommit -Message $MessagePrefix
  }
}
finally {
  Unregister-Event -SourceIdentifier $createdRegistration.Name
  Unregister-Event -SourceIdentifier $changedRegistration.Name
  Unregister-Event -SourceIdentifier $deletedRegistration.Name
  Unregister-Event -SourceIdentifier $renamedRegistration.Name
  $watcher.Dispose()
}
