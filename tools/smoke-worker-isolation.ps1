# Smoke: worker-pool isolation after deploy (TorLink project_id=1)
# Usage: .\tools\smoke-worker-isolation.ps1 -Pat 'mcp_...' -BaseUrl 'https://...'
param(
  [Parameter(Mandatory = $true)][string]$Pat,
  [string]$BaseUrl = 'https://telegram-bot-builder-e3u-production.up.railway.app',
  [int]$ProjectId = 1
)

$ErrorActionPreference = 'Stop'
$headers = @{
  Authorization = "Bearer $Pat"
  Accept = 'application/json'
  'Content-Type' = 'application/json'
}

function Get-JsonArray([string]$Url) {
  $parsed = (Invoke-WebRequest -Headers $headers -Uri $Url -UseBasicParsing -TimeoutSec 90).Content | ConvertFrom-Json
  if ($null -eq $parsed) { return @() }
  if ($parsed -is [System.Array]) { return @($parsed) }
  return @($parsed)
}

Write-Output '=== workers/stats ==='
$ws = Invoke-RestMethod -Headers $headers -Uri "$BaseUrl/api/workers/stats" -TimeoutSec 30
Write-Output ($ws | ConvertTo-Json -Depth 5 -Compress)

$tokens = Get-JsonArray "$BaseUrl/api/projects/$ProjectId/tokens/list"
$run = 0; $stop = 0
foreach ($t in $tokens) {
  $st = Invoke-RestMethod -Headers $headers -Uri "$BaseUrl/api/bot/tokens/$($t.id)/status" -TimeoutSec 20
  if ($st.status -eq 'running') { $run++ } else {
    $stop++
    Write-Output ("STOPPED t={0} @{1}" -f $t.id, $t.botUsername)
  }
}
Write-Output ("STATUS running={0} stopped={1} total={2}" -f $run, $stop, $tokens.Count)

# Sample logs: expect own tokenId and recent timestamps
foreach ($tid in @(2, 75, 76)) {
  try {
    $logs = Get-JsonArray "$BaseUrl/api/projects/$ProjectId/tokens/$tid/logs?limit=2"
    Write-Output ("LOGS token={0} count={1}" -f $tid, $logs.Count)
    foreach ($l in $logs) {
      $c = [string]$l.content
      Write-Output ("  launch={0} {1}" -f $l.launchId, $c.Substring(0, [Math]::Min(80, $c.Length)))
    }
  } catch {
    Write-Output ("LOGS token={0} err={1}" -f $tid, $_.Exception.Message)
  }
}

Write-Output 'OK: review stopped list + logs; #75 must not show foreign bot:message:1:2 publishes'
