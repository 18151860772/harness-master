$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# 切换到目标目录
$folder = "c:\Users\HP\Desktop\tools\35.master list&wire list生成chart"

# 读取第一个文件
$file1 = Join-Path $folder "T28-室内地板线束chart-SOP-20251120.xlsx"
$wb1 = $excel.Workbooks.Open($file1)
Write-Host "=== 文件1: T28-室内地板线束chart-SOP-20251120.xlsx ==="
Write-Host "工作表列表: $($wb1.Sheets.Name)"
foreach ($sheet in $wb1.Sheets) {
    Write-Host "--- Sheet: $($sheet.Name) ---"
    Write-Host "行数: $($sheet.UsedRange.Rows.Count), 列数: $($sheet.UsedRange.Columns.Count)"
    Write-Host "前5行预览:"
    for ($i = 1; $i -le 5; $i++) {
        $rowData = @()
        $maxCol = [Math]::Min(10, $sheet.UsedRange.Columns.Count)
        for ($j = 1; $j -le $maxCol; $j++) {
            $cell = $sheet.Cells.Item($i, $j)
            $rowData += $cell.Text
        }
        Write-Host "  Row $i`: $($rowData -join ', ')"
    }
}
$wb1.Close($false)

# 读取第二个文件
$file2 = Join-Path $folder "ECR-T28-0S_20260203.xlsx"
$wb2 = $excel.Workbooks.Open($file2)
Write-Host ""
Write-Host "=== 文件2: ECR-T28-0S_20260203.xlsx ==="
Write-Host "工作表列表: $($wb2.Sheets.Name)"
foreach ($sheet in $wb2.Sheets) {
    Write-Host "--- Sheet: $($sheet.Name) ---"
    Write-Host "行数: $($sheet.UsedRange.Rows.Count), 列数: $($sheet.UsedRange.Columns.Count)"
    Write-Host "前5行预览:"
    for ($i = 1; $i -le 5; $i++) {
        $rowData = @()
        $maxCol = [Math]::Min(10, $sheet.UsedRange.Columns.Count)
        for ($j = 1; $j -le $maxCol; $j++) {
            $cell = $sheet.Cells.Item($i, $j)
            $rowData += $cell.Text
        }
        Write-Host "  Row $i`: $($rowData -join ', ')"
    }
}
$wb2.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel)
