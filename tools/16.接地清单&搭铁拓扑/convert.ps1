$bytes = [IO.File]::ReadAllBytes("WIRELIST.xlsx")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File "wirelist_full_b64.txt" -Encoding ascii
Write-Host "WIRELIST: $($base64.Length)"

$bytes = [IO.File]::ReadAllBytes("T28-Connlist_20260113.xlsx")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File "connlist_full_b64.txt" -Encoding ascii
Write-Host "CONNLIST: $($base64.Length)"

$bytes = [IO.File]::ReadAllBytes("inline.xlsx")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File "inline_full_b64.txt" -Encoding ascii
Write-Host "INLINE: $($base64.Length)"
