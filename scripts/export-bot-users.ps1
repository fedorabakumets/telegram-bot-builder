# Export all bot users from production via paginated GET /api/projects/:id/users.
# Default: project 1, auto-picks TorLink token with the most users.
#
# Examples:
#   .\scripts\export-bot-users.ps1
#   .\scripts\export-bot-users.ps1 -ProjectId 1 -TokenId 2
#   .\scripts\export-bot-users.ps1 -BaseUrl https://... -AgentToken mcp_xxx

param(
  [string]$BaseUrl = "https://telegram-bot-builder-e3u-production.up.railway.app",
  [string]$AgentToken = $env:MCP_AGENT_TOKEN,
  [int]$ProjectId = 1,
  [int]$TokenId = 0,
  [string]$NameFilter = "TorLink",
  [int]$PageSize = 500,
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $AgentToken) {
  throw "Set MCP_AGENT_TOKEN or pass -AgentToken"
}

$headers = @{ Authorization = ("Bearer {0}" -f $AgentToken) }
$BaseUrl = $BaseUrl.TrimEnd("/")

function Get-Json([string]$Url) {
  $r = Invoke-WebRequest -Uri $Url -Headers $headers -TimeoutSec 180 -UseBasicParsing
  return ($r.Content | ConvertFrom-Json)
}

function Escape-CsvField([string]$value) {
  if ($null -eq $value) { return "" }
  $s = [string]$value
  if ($s -match '[",\r\n]') {
    return '"' + ($s -replace '"', '""') + '"'
  }
  return $s
}

Write-Host ("BaseUrl={0} project={1}" -f $BaseUrl, $ProjectId)

$tokensRaw = Get-Json ("{0}/api/projects/{1}/tokens" -f $BaseUrl, $ProjectId)
$tokenList = if ($tokensRaw -is [System.Array]) { @($tokensRaw) }
  elseif ($tokensRaw.value) { @($tokensRaw.value) }
  else { @($tokensRaw) }

$candidates = $tokenList
if ($NameFilter) {
  $candidates = @(
    $tokenList | Where-Object {
      ($_.botUsername -like ("*{0}*" -f $NameFilter)) -or ($_.name -like ("*{0}*" -f $NameFilter))
    }
  )
  if ($candidates.Count -eq 0) {
    Write-Warning ("Filter '{0}' matched nothing; using all project tokens" -f $NameFilter)
    $candidates = $tokenList
  }
}

$scored = @()
foreach ($t in $candidates) {
  $statsUrl = "{0}/api/projects/{1}/users/stats?tokenId={2}" -f $BaseUrl, $ProjectId, $t.id
  $stats = Get-Json $statsUrl
  $total = [int]$stats.totalUsers
  $scored += [pscustomobject]@{
    id = [int]$t.id
    botUsername = [string]$t.botUsername
    botId = [string]$t.botId
    totalUsers = $total
  }
  Write-Host ("  token {0,-4} @{1,-28} users={2}" -f $t.id, $t.botUsername, $total)
}

if ($TokenId -gt 0) {
  $chosen = $scored | Where-Object { $_.id -eq $TokenId } | Select-Object -First 1
  if (-not $chosen) {
    throw ("TokenId={0} not found among candidates" -f $TokenId)
  }
} else {
  $chosen = $scored | Sort-Object totalUsers -Descending | Select-Object -First 1
}

if (-not $chosen) {
  throw "Failed to pick token for export"
}

Write-Host ""
Write-Host ("Export: tokenId={0} @{1} totalUsers={2}" -f $chosen.id, $chosen.botUsername, $chosen.totalUsers)

if (-not $OutDir) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutDir = Join-Path $PSScriptRoot ("..\exports\users-p{0}-t{1}-{2}" -f $ProjectId, $chosen.id, $stamp)
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$all = New-Object System.Collections.Generic.List[object]
$offset = 0
$page = 0
do {
  $page++
  $url = "{0}/api/projects/{1}/users?tokenId={2}&limit={3}&offset={4}&dialogKind=users" -f $BaseUrl, $ProjectId, $chosen.id, $PageSize, $offset
  $batch = Get-Json $url
  $users = @($batch.users)
  $total = [int]$batch.total
  $hasMore = [bool]$batch.hasMore
  foreach ($u in $users) { $all.Add($u) }
  Write-Host ("  page {0}: +{1} (offset={2}, total={3}, loaded={4})" -f $page, $users.Count, $offset, $total, $all.Count)
  $offset += $users.Count
  if ($users.Count -eq 0) { break }
} while ($hasMore -and $all.Count -lt $total)

$jsonPath = Join-Path $OutDir "users.json"
$meta = [ordered]@{
  exportedAt = (Get-Date).ToString("o")
  baseUrl = $BaseUrl
  projectId = $ProjectId
  tokenId = $chosen.id
  botUsername = $chosen.botUsername
  botId = $chosen.botId
  expectedTotal = $chosen.totalUsers
  exportedCount = $all.Count
}
$payload = [ordered]@{ meta = $meta; users = $all }
$payload | ConvertTo-Json -Depth 12 | Set-Content -Path $jsonPath -Encoding UTF8

$csvPath = Join-Path $OutDir "users.csv"
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("userId,userName,firstName,lastName,isActive,isPremium,languageCode,deepLinkParam,referrerId,interactionCount,registeredAt,lastInteraction,lastMessageAt,lastMessageText,userData")
foreach ($u in $all) {
  $userDataJson = ""
  if ($null -ne $u.userData) {
    $userDataJson = ($u.userData | ConvertTo-Json -Depth 8 -Compress)
  }
  $line = @(
    (Escape-CsvField $u.userId),
    (Escape-CsvField $u.userName),
    (Escape-CsvField $u.firstName),
    (Escape-CsvField $u.lastName),
    (Escape-CsvField ([string]$u.isActive)),
    (Escape-CsvField ([string]$u.isPremium)),
    (Escape-CsvField $u.languageCode),
    (Escape-CsvField $u.deepLinkParam),
    (Escape-CsvField $u.referrerId),
    (Escape-CsvField ([string]$u.interactionCount)),
    (Escape-CsvField ([string]$u.registeredAt)),
    (Escape-CsvField ([string]$u.lastInteraction)),
    (Escape-CsvField ([string]$u.lastMessageAt)),
    (Escape-CsvField $u.lastMessageText),
    (Escape-CsvField $userDataJson)
  ) -join ","
  [void]$sb.AppendLine($line)
}
[System.IO.File]::WriteAllText($csvPath, $sb.ToString(), [System.Text.UTF8Encoding]::new($true))

$idsPath = Join-Path $OutDir "user-ids.txt"
($all | ForEach-Object { $_.userId }) -join "`n" | Set-Content -Path $idsPath -Encoding UTF8

$metaPath = Join-Path $OutDir "meta.json"
$meta | ConvertTo-Json | Set-Content -Path $metaPath -Encoding UTF8

Write-Host ""
Write-Host ("Done: {0} users" -f $all.Count)
Write-Host ("  {0}" -f $jsonPath)
Write-Host ("  {0}" -f $csvPath)
Write-Host ("  {0}" -f $idsPath)
Write-Host ("  {0}" -f $metaPath)
