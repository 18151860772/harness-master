# Convert Excel files to Base64
$baseDir = "C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑"

# WIRELIST.xlsx
$wirelistBytes = [IO.File]::ReadAllBytes("$baseDir\WIRELIST.xlsx")
$wirelistBase64 = [Convert]::ToBase64String($wirelistBytes)
$wirelistBase64 | Out-File "$baseDir\wirelist_b64.txt" -Encoding ascii
Write-Host "WIRELIST.xlsx: $($wirelistBase64.Length) characters"

# inline.xlsx
$inlineBytes = [IO.File]::ReadAllBytes("$baseDir\inline.xlsx")
$inlineBase64 = [Convert]::ToBase64String($inlineBytes)
$inlineBase64 | Out-File "$baseDir\inline_b64.txt" -Encoding ascii
Write-Host "inline.xlsx: $($inlineBase64.Length) characters"

# Connlist.xlsx (try T28-Connlist_20260113.xlsx)
$connlistPath = "$baseDir\T28-Connlist_20260113.xlsx"
if (Test-Path $connlistPath) {
    $connlistBytes = [IO.File]::ReadAllBytes($connlistPath)
    $connlistBase64 = [Convert]::ToBase64String($connlistBytes)
    $connlistBase64 | Out-File "$baseDir\connlist_b64.txt" -Encoding ascii
    Write-Host "Connlist.xlsx: $($connlistBase64.Length) characters"
} else {
    Write-Host "Connlist file not found"
}

Write-Host "Conversion complete!"
