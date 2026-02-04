import pandas as pd

# 读取第一个文件
file1 = r'c:\Users\HP\Desktop\tools\35.master list&wire list生成chart\T28-室内地板线束chart-SOP-20251120.xlsx'
print('=== 文件1: T28-室内地板线束chart-SOP-20251120.xlsx ===')
xl1 = pd.ExcelFile(file1)
print(f'工作表列表: {xl1.sheet_names}')
for sheet in xl1.sheet_names:
    df = pd.read_excel(file1, sheet_name=sheet, nrows=5)
    print(f'\n--- Sheet: {sheet} ---')
    print(f'形状: {df.shape}')
    print(df.to_string())
print()

# 读取第二个文件
file2 = r'c:\Users\HP\Desktop\tools\35.master list&wire list生成chart\ECR-T28-0S_20260203.xlsx'
print('=== 文件2: ECR-T28-0S_20260203.xlsx ===')
xl2 = pd.ExcelFile(file2)
print(f'工作表列表: {xl2.sheet_names}')
for sheet in xl2.sheet_names:
    df = pd.read_excel(file2, sheet_name=sheet, nrows=5)
    print(f'\n--- Sheet: {sheet} ---')
    print(f'形状: {df.shape}')
    print(df.to_string())
