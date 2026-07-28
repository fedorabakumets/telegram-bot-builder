# One-shot: найти ботов без Redis после mass-restore и перезапустить со stagger.
# Usage:
#   .\tools\restart-redis-failed-bots.ps1 -Pat 'mcp_...' [-DryRun] [-DelayMs 2500]
#   $env:MCP_AGENT_TOKEN='mcp_...'; .\tools\restart-redis-failed-bots.ps1
#
# Почему stagger: при одновременном старте десятки клиентов бьют Redis →
# Timeout connecting to server; без retry клиент остаётся null до рестарта.
# (типичный thundering herd / connection stampede)

param(
  [string]$Pat = $env:MCP_AGENT_TOKEN,
  [string]$BaseUrl = 'https://telegram-bot-builder-e3u-production.up.railway.app',
  [int]$ProjectId = 1,
  [int]$LogLimit = 60,
  [int]$DelayMs = 2500,
  [int]$VerifyWaitSec = 8,
  [switch]$DryRun,
  [int[]]$OnlyTokenIds = @()
)

$ErrorActionPreference = 'Stop'
if (-not $Pat) {
  throw 'Нужен -Pat или $env:MCP_AGENT_TOKEN'
}

$headers = @{
  Authorization = "Bearer $Pat"
  Accept = 'application/json'
  'Content-Type' = 'application/json'
}

function Get-JsonArray([string]$Url) {
  $parsed = (Invoke-WebRequest -Headers $headers -Uri $Url -UseBasicParsing -TimeoutSec 90).Content | ConvertFrom-Json
  if ($null -eq $parsed) { return @() }
  if ($parsed -is [System.Array]) { return @($parsed) }
  if ($parsed.PSObject.Properties.Name -contains 'value') { return @($parsed.value) }
  return @($parsed)
}

function Test-RedisFailed([string]$Joined) {
  return [bool](
    $Joined -match 'Timeout connecting to server' -or
    $Joined -match 'Не удалось подключиться к Redis' -or
    $Joined -match 'FSM хранилище: PostgreSQL' -or
    $Joined -match 'bot:message не опубликовано' -or
    $Joined -match 'bot:user не опубликовано'
  )
}

function Test-RedisOk([string]$Joined) {
  return [bool](
    $Joined -match 'Redis подключён успешно' -or
    $Joined -match 'FSM хранилище: Redis'
  )
}

Write-Output "=== scan project=$ProjectId logs=$LogLimit ==="
$tokens = Get-JsonArray "$BaseUrl/api/projects/$ProjectId/tokens/list"
if ($OnlyTokenIds.Count -gt 0) {
  $tokens = @($tokens | Where-Object { $OnlyTokenIds -contains $_.id })
}
Write-Output "tokens=$($tokens.Count)"

$bad = New-Object System.Collections.Generic.List[object]
$ok = New-Object System.Collections.Generic.List[int]
$unknown = New-Object System.Collections.Generic.List[int]

foreach ($t in $tokens) {
  $tid = [int]$t.id
  $uname = if ($t.botUsername) { $t.botUsername } else { '?' }
  try {
    $logs = Get-JsonArray "$BaseUrl/api/projects/$ProjectId/tokens/$tid/logs?limit=$LogLimit"
    $joined = ($logs | ForEach-Object { $_.content }) -join "`n"
    if (Test-RedisFailed $joined) {
      [void]$bad.Add([pscustomobject]@{ Id = $tid; Username = $uname })
    } elseif (Test-RedisOk $joined) {
      [void]$ok.Add($tid)
    } else {
      [void]$unknown.Add($tid)
    }
  } catch {
    Write-Output ("SCAN_FAIL t={0} @{1}: {2}" -f $tid, $uname, $_.Exception.Message)
    [void]$unknown.Add($tid)
  }
}

Write-Output ("OK={0} BAD={1} UNKNOWN={2}" -f $ok.Count, $bad.Count, $unknown.Count)
Write-Output ("BAD_IDS=" + (($bad | ForEach-Object { $_.Id }) -join ','))
$bad | ForEach-Object { Write-Output ("  bad t={0} @{1}" -f $_.Id, $_.Username) }

if ($bad.Count -eq 0) {
  Write-Output 'Нечего перезапускать.'
  exit 0
}

if ($DryRun) {
  Write-Output 'DryRun — restart пропущен.'
  exit 0
}

Write-Output ("=== restart {0} bots, delay={1}ms ===" -f $bad.Count, $DelayMs)
$restartOk = 0
$restartFail = 0

foreach ($b in $bad) {
  $tid = $b.Id
  try {
    $body = @{ tokenId = $tid } | ConvertTo-Json -Compress
    $r = Invoke-RestMethod -Method POST -Headers $headers `
      -Uri "$BaseUrl/api/projects/$ProjectId/bot/restart" `
      -Body $body -TimeoutSec 120
    $msg = if ($r.message) { $r.message } else { 'ok' }
    Write-Output ("RESTART_OK t={0} @{1}: {2}" -f $tid, $b.Username, $msg)
    $restartOk++
  } catch {
    $detail = $_.ErrorDetails.Message
    if (-not $detail) { $detail = $_.Exception.Message }
    Write-Output ("RESTART_FAIL t={0} @{1}: {2}" -f $tid, $b.Username, $detail)
    $restartFail++
  }
  Start-Sleep -Milliseconds $DelayMs
}

Write-Output ("=== verify wait {0}s ===" -f $VerifyWaitSec)
Start-Sleep -Seconds $VerifyWaitSec

$stillBad = New-Object System.Collections.Generic.List[int]
$nowOk = New-Object System.Collections.Generic.List[int]

foreach ($b in $bad) {
  $tid = $b.Id
  try {
    $logs = Get-JsonArray "$BaseUrl/api/projects/$ProjectId/tokens/$tid/logs?limit=30"
    $joined = ($logs | ForEach-Object { $_.content }) -join "`n"
    if (Test-RedisOk $joined -and -not ($joined -match 'Timeout connecting to server')) {
      [void]$nowOk.Add($tid)
      Write-Output ("VERIFY_OK t={0} @{1}" -f $tid, $b.Username)
    } else {
      [void]$stillBad.Add($tid)
      Write-Output ("VERIFY_BAD t={0} @{1}" -f $tid, $b.Username)
    }
  } catch {
    [void]$stillBad.Add($tid)
    Write-Output ("VERIFY_FAIL t={0}: {1}" -f $tid, $_.Exception.Message)
  }
}

Write-Output ("=== summary restart_ok={0} restart_fail={1} redis_ok={2} still_bad={3} ===" -f `
  $restartOk, $restartFail, $nowOk.Count, $stillBad.Count)
if ($stillBad.Count -gt 0) {
  Write-Output ("STILL_BAD=" + ($stillBad -join ','))
  exit 2
}
exit 0
