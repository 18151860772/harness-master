Option Explicit

' ============================================
' Excel Processing Tool v3.0
' Advanced version with text format and line break removal
' ============================================

Dim objExcel, objWorkbook, objSheet, i, rng

' Get active Excel workbook
On Error Resume Next
Set objExcel = GetObject(, "Excel.Application")
If Err.Number <> 0 Then
    MsgBox "Please open Excel file first!", vbExclamation, "Error"
    WScript.Quit
End If
On Error GoTo 0

Set objWorkbook = objExcel.ActiveWorkbook
If objWorkbook Is Nothing Then
    MsgBox "No active Excel workbook found!", vbExclamation, "Error"
    WScript.Quit
End If

' Disable screen update for performance
objExcel.ScreenUpdating = False
objExcel.Calculation = -4135
objExcel.EnableEvents = False

' Process first sheet
Set objSheet = objWorkbook.Sheets(1)

' Step 0: Set all cells to text format (NEW!)
Set rng = objSheet.UsedRange
rng.NumberFormat = "@"

' Step 1: Remove special characters (use array for speed)
' Remove Chr(160) non-breaking spaces and Chr(10) line breaks
Dim arrData, r, c
arrData = rng.Value

If IsArray(arrData) Then
    For r = 1 To UBound(arrData, 1)
        For c = 1 To UBound(arrData, 2)
            If VarType(arrData(r, c)) = vbString Then
                ' Remove Chr(160) non-breaking space
                arrData(r, c) = Replace(arrData(r, c), Chr(160), "")
                ' Remove Chr(10) line break (NEW!)
                arrData(r, c) = Replace(arrData(r, c), Chr(10), "")
            End If
        Next
    Next
    rng.Value = arrData
End If

' Step 2: Delete first 9 rows
objSheet.Rows("1:9").Delete

' Step 3: Clear column A (except first 3 rows)
Set rng = objSheet.Range("A4:A" & objSheet.Rows.Count)
rng.UnMerge
rng.ClearContents

' Step 4: Delete specified columns (from back to front)
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

' Step 5: Delete sheet2 and sheet3
On Error Resume Next
For i = objWorkbook.Sheets.Count To 1 Step -1
    If LCase(objWorkbook.Sheets(i).Name) = "sheet2" Or _
       LCase(objWorkbook.Sheets(i).Name) = "sheet3" Then
        objWorkbook.Sheets(i).Delete
    End If
Next
On Error GoTo 0

' Step 6: Auto-fit all column widths for better display
objSheet.Columns.AutoFit

' Step 7: Remove Chr(160) again after all operations (FINAL CLEANUP)
Set rng = objSheet.UsedRange
arrData = rng.Value

If IsArray(arrData) Then
    For r = 1 To UBound(arrData, 1)
        For c = 1 To UBound(arrData, 2)
            If VarType(arrData(r, c)) = vbString Then
                ' Final cleanup: remove any remaining Chr(160)
                arrData(r, c) = Replace(arrData(r, c), Chr(160), "")
            End If
        Next
    Next
    rng.Value = arrData
End If

' Step 8: Rename the first sheet to "new"
On Error Resume Next
objSheet.Name = "new"
On Error GoTo 0

' Restore settings
objExcel.ScreenUpdating = True
objExcel.Calculation = -4105
objExcel.EnableEvents = True

MsgBox "Processing completed successfully!", vbInformation, "Done v3.0"
