Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False

folder = "c:\Users\HP\Desktop\tools\35.master list&wire list生成chart"

' 读取第一个文件
file1 = folder & "\T28-室内地板线束chart-SOP-20251120.xlsx"
Set wb1 = excel.Workbooks.Open(file1)
WScript.Echo "=== 文件1: T28-室内地板线束chart-SOP-20251120.xlsx ==="
WScript.Echo "工作表数量: " & wb1.Sheets.Count

For Each sheet In wb1.Sheets
    WScript.Echo "--- Sheet: " & sheet.Name & " ---"
    WScript.Echo "行数: " & sheet.UsedRange.Rows.Count & ", 列数: " & sheet.UsedRange.Columns.Count
    WScript.Echo "前5行预览:"
    maxCol = sheet.UsedRange.Columns.Count
    If maxCol > 10 Then maxCol = 10
    For i = 1 To 5
        rowData = ""
        For j = 1 To maxCol
            If j > 1 Then rowData = rowData & ", "
            cellValue = sheet.Cells(i, j).Text
            rowData = rowData & cellValue
        Next
        WScript.Echo "  Row " & i & ": " & rowData
    Next
Next
wb1.Close False

' 读取第二个文件
file2 = folder & "\ECR-T28-0S_20260203.xlsx"
Set wb2 = excel.Workbooks.Open(file2)
WScript.Echo ""
WScript.Echo "=== 文件2: ECR-T28-0S_20260203.xlsx ==="
WScript.Echo "工作表数量: " & wb2.Sheets.Count

For Each sheet In wb2.Sheets
    WScript.Echo "--- Sheet: " & sheet.Name & " ---"
    WScript.Echo "行数: " & sheet.UsedRange.Rows.Count & ", 列数: " & sheet.UsedRange.Columns.Count
    WScript.Echo "前5行预览:"
    maxCol = sheet.UsedRange.Columns.Count
    If maxCol > 10 Then maxCol = 10
    For i = 1 To 5
        rowData = ""
        For j = 1 To maxCol
            If j > 1 Then rowData = rowData & ", "
            cellValue = sheet.Cells(i, j).Text
            rowData = rowData & cellValue
        Next
        WScript.Echo "  Row " & i & ": " & rowData
    Next
Next
wb2.Close False
excel.Quit
Set excel = Nothing
