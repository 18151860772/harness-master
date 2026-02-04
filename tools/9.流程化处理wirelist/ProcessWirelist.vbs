Option Explicit

Dim objExcel, objWorkbook, objSheet, filePath, i, rng, lastRow, r

Set objExcel = CreateObject("Excel.Application")
objExcel.Visible = False
objExcel.DisplayAlerts = False

filePath = objExcel.GetOpenFilename("Excel Files (*.xlsx; *.xls), *.xlsx; *.xls", 1, "Select Wirelist File")

If VarType(filePath) = vbBoolean Then
    objExcel.Quit
    Set objExcel = Nothing
    WScript.Quit
End If

On Error Resume Next
Set objWorkbook = objExcel.Workbooks.Open(filePath)

If Err.Number <> 0 Then
    objExcel.Quit
    Set objExcel = Nothing
    WScript.Quit
End If

On Error GoTo 0
objExcel.Visible = True

Set objSheet = objWorkbook.Sheets(1)

objSheet.Rows("1:9").Delete

Set rng = objSheet.Columns("A")
rng.UnMerge
rng.ClearContents

objSheet.Columns("V").Delete
objSheet.Columns("U").Delete
objSheet.Columns("T").Delete
objSheet.Columns("Q").Delete
objSheet.Columns("P").Delete
objSheet.Columns("M").Delete
objSheet.Columns("K").Delete
objSheet.Columns("J").Delete
objSheet.Columns("G").Delete
objSheet.Columns("F").Delete

Set rng = objSheet.UsedRange
Dim cell
For Each cell In rng
    If VarType(cell.Value) = vbString Then
        cell.Value = Replace(cell.Value, Chr(160), "")
    End If
Next

On Error Resume Next
For i = objWorkbook.Sheets.Count To 1 Step -1
    If LCase(objWorkbook.Sheets(i).Name) = "sheet2" Or LCase(objWorkbook.Sheets(i).Name) = "sheet3" Then
        objWorkbook.Sheets(i).Delete
    End If
Next
On Error GoTo 0

objWorkbook.Save
objWorkbook.Close
objExcel.Quit

Set rng = Nothing
Set objSheet = Nothing
Set objWorkbook = Nothing
Set objExcel = Nothing

MsgBox "Done!"
