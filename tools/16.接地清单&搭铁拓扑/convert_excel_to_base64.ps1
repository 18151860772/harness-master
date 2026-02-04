# 转换Excel文件为Base64
$baseDir = "C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑"

# WIRELIST.xlsx
$wirelistPath = Join-Path $baseDir "WIRELIST.xlsx"
$wirelistBytes = [System.IO.File]::ReadAllBytes($wirelistPath)
$wirelistBase64 = [System.Convert]::ToBase64String($wirelistBytes)
$wirelistBase64 | Out-File (Join-Path $baseDir "wirelist_full_b64.txt") -Encoding ascii
Write-Host "WIRELIST: $($wirelistBase64.Length) chars"

# Connlist.xlsx
$connlistPath = Join-Path $baseDir "T28-Connlist_20260113.xlsx"
$connlistBytes = [System.IO.File]::ReadAllBytes($connlistPath)
$connlistBase64 = [System.Convert]::ToBase64String($connlistBytes)
$connlistBase64 | Out-File (Join-Path $baseDir "connlist_full_b64.txt") -Encoding ascii
Write-Host "CONNLIST: $($connlistBase64.Length) chars"

# inline.xlsx
$inlinePath = Join-Path $baseDir "inline.xlsx"
$inlineBytes = [System.IO.File]::ReadAllBytes($inlinePath)
$inlineBase64 = [System.Convert]::ToBase64String($inlineBytes)
$inlineBase64 | Out-File (Join-Path $baseDir "inline_full_b64.txt") -Encoding ascii
Write-Host "INLINE: $($inlineBase64.Length) chars"

Write-Host "Done!"
