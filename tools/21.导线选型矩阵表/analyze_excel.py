import pandas as pd
import json

# 读取Excel文件
excel_file = '导线选型矩阵表V8.1.xlsx'
xls = pd.ExcelFile(excel_file)

print("Sheet名称:", xls.sheet_names)
print("\n" + "="*50)

# 读取每个sheet
for sheet_name in xls.sheet_names:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    print(f"\nSheet: {sheet_name}")
    print(f"行数: {len(df)}, 列数: {len(df.columns)}")
    print("\n列名:")
    print(df.columns.tolist())
    print("\n前5行数据:")
    print(df.head())
    print("\n" + "="*50)
