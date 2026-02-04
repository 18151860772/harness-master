$baseDir = "C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑"

$wirelistBase64 = Get-Content "$baseDir\wirelist_full_b64.txt" -Raw
$connlistBase64 = Get-Content "$baseDir\connlist_full_b64.txt" -Raw
$inlineBase64 = Get-Content "$baseDir\inline_full_b64.txt" -Raw

$jsContent = "const TEMPLATE_FILES = {
    WIRELIST: {
        filename: 'WIRELIST.xlsx',
        data: '$wirelistBase64'
    },
    CONNLIST: {
        filename: 'T28-Connlist_20260113.xlsx',
        data: '$connlistBase64'
    },
    INLINE: {
        filename: 'inline.xlsx',
        data: '$inlineBase64'
    }
};"

$jsContent | Out-File "$baseDir\template_data.js" -Encoding utf8
Write-Host "Created template_data.js with size:" $jsContent.Length
