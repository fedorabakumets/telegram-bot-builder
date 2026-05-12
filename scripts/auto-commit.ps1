<#
@fileoverview Скрипт для безопасного автокоммита измененных файлов в git
#>

param(
  [string[]]$Paths = @(),
  [string]$Message = "",
  [string]$RepoRoot = ""
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

  if ($PreferredRoot) {
    return (Resolve-Path -LiteralPath $PreferredRoot).Path
  }

  $resolvedRoot = git rev-parse --show-toplevel 2>$null
  if (-not $resolvedRoot) {
    throw "Не удалось определить корень git-репозитория."
  }

  return $resolvedRoot.Trim()
}

<#
 @description Нормализует список путей относительно корня репозитория.
 @param RepositoryRoot Корень репозитория.
 @param CandidatePaths Исходный список путей.
 @returns Уникальный список относительных путей.
#>
function Get-RelativePaths {
  param(
    [string]$RepositoryRoot,
    [string[]]$CandidatePaths
  )

  $pathSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($candidatePath in $CandidatePaths) {
    if (-not $candidatePath) {
      continue
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $RepositoryRoot $candidatePath))
    if (-not $fullPath.StartsWith($RepositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      continue
    }

    $relativePath = [System.IO.Path]::GetRelativePath($RepositoryRoot, $fullPath)
    if ($relativePath -and $relativePath -ne ".") {
      $pathSet.Add($relativePath) | Out-Null
    }
  }

  return [string[]]$pathSet
}

$repositoryRoot = Get-RepositoryRoot -PreferredRoot $RepoRoot
Push-Location $repositoryRoot

try {
  $relativePaths = Get-RelativePaths -RepositoryRoot $repositoryRoot -CandidatePaths $Paths
  if ($relativePaths.Count -gt 0) {
    git add -- $relativePaths
  }
  else {
    git add -A
  }

  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Нет изменений для коммита."
    exit 0
  }

  $commitMessage = $Message
  if (-not $commitMessage) {
    $commitMessage = "auto: agent changes"
  }

  git commit -m $commitMessage
}
finally {
  Pop-Location
}
