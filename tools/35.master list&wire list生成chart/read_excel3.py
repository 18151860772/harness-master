# -*- coding: utf-8 -*-
import pandas as pd
import sys

# 读取第一个文件
file1 = r'c:\Users\HP\Desktop\tools\35.master list&wire list生成chart\T28-室内地板线束chart-SOP-20251120.xlsx'
output = []
output.append('=== 文件1: T28-室内地板线束chart-SOP-20251120.xlsx ===')
xl1 = pd.ExcelFile(file1)
output.append(f'工作表列表: {xl1.sheet_names}')

for sheet in xl1.sheet_names:
    df = pd.read_excel(file1, sheet_name=sheet, header=None)
    output.append(f'\n--- Sheet: {sheet} ---')
    output.append(f'形状: {df.shape}')
    output.append('前3行预览:')
    output.append(df.head(3).to_string())

output.append('\n' + '='*60 + '\n')

# 读取第二个文件
file2 = r'c:\Users\HP\Desktop\tools\35.master list&wire list生成chart\ECR-T28-0S_20260203.xlsx'
output.append('=== 文件2: ECR-T28-0S_20260203.xlsx ===')
xl2 = pd.ExcelFile(file2)
output.append(f'工作表列表: {xl2.sheet_names}')

for sheet in xl2.sheet_names:
    df = pd.read_excel(file2, sheet_name=sheet, header=None)
    output.append(f'\n--- Sheet: {sheet} ---')
    output.append(f'形状: {df.shape}')
    output.append('前3行预览:')
    output.append(df.head(3).to_string())

# 写入文件
with open(r'c:\Users\HP\Desktop\tools\35.master list&wire list生成chart\output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print('Output saved to output.txt')
