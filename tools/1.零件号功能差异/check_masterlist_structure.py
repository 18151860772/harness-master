import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 读取Master List文件
master_df = pd.read_excel('T28_Masterlist_20251223.xlsx', engine='openpyxl')

print("=" * 80)
print("Master List结构分析")
print("=" * 80)

print(f"\n总行数: {len(master_df)}")
print(f"总列数: {len(master_df.columns)}")

# 显示前10行
print("\n前10行数据:")
for i in range(min(10, len(master_df))):
    print(f"\n第{i+1}行:")
    for j, (col, value) in enumerate(zip(master_df.columns, master_df.iloc[i])):
        if j < 10:  # 只显示前10列
            val = str(value) if pd.notna(value) else 'nan'
            print(f"  列{j+1} ({col}): {val}")

# 查找"标配"列
print("\n\n查找'标配'列:")
for i, col in enumerate(master_df.columns):
    if pd.notna(col) and '标配' in str(col):
        print(f"找到'标配'列在索引 {i}: {col}")

# 检查第二行的"标配"单元格
print("\n\n第二行（索引0）的'标配'单元格:")
second_row = master_df.iloc[0]
for i, value in enumerate(second_row):
    if pd.notna(value) and '标配' in str(value):
        print(f"  索引 {i}: {value}")

# 显示"标配"列之后的列
print("\n\n'标配'列之后的所有列:")
standard_col_index = None
for i, col in enumerate(master_df.columns):
    if pd.notna(col) and '标配' in str(col):
        standard_col_index = i
        print(f"'标配'列在索引 {i}")
        break

if standard_col_index is not None:
    print(f"\n'标配'列之后（索引 {standard_col_index + 1} 开始）:")
    for i, col in enumerate(master_df.columns[standard_col_index + 1:]):
        if i < 20:  # 只显示前20个
            print(f"  {i+1}. {col}")

# 检查数据行中的●标记
print("\n\n检查数据行中的●标记:")
sample_row = master_df.iloc[1]  # 第二行数据
dot_count = 0
for col in master_df.columns:
    value = sample_row[col]
    if pd.notna(value) and '●' in str(value):
        dot_count += 1

print(f"第二行数据中包含●标记的列数: {dot_count}")

# 显示前3个零件号的功能
print("\n\n前3个零件号的功能:")
for i in range(min(3, len(master_df) - 1)):  # 跳过表头，只看前3个数据行
    row_idx = i + 1
    part_number = str(master_df.iloc[row_idx, 0]) if pd.notna(master_df.iloc[row_idx, 0]) else ''
    if part_number and part_number != 'nan':
        print(f"\n零件号 {part_number}:")
        features = []
        for col in master_df.columns[standard_col_index + 1:]:
            value = master_df.iloc[row_idx, col]
            if pd.notna(value) and '●' in str(value):
                features.append(f"  {col}: {value}")
        
        if features:
            print(f"  有{len(features)}个功能:")
            for f in features[:10]:  # 只显示前10个
                print(f"    {f}")
        else:
            print("  无●标记的功能")
