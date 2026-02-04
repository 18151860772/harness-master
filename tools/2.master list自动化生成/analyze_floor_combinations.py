import pandas as pd
import openpyxl

# 读取现有的MasterList
masterlist_file = "MasterList__202508060203859.xlsx"
df_masterlist = pd.read_excel(masterlist_file, sheet_name='Master List', header=None)

# 读取配置表获取版型列表
config_file = "配置表.xlsx"
df_config = pd.read_excel(config_file, sheet_name='Master List', header=None)
version_names = df_config.iloc[1, 3:].tolist()
versions = [name for name in version_names if pd.notna(name)]

print("=" * 80)
print("分析FLOOR零件号的Option组合差异")
print("=" * 80)

# 获取Option列名（从第8列开始，索引7）
option_columns = df_masterlist.iloc[0, 7:].tolist()
option_columns = [opt for opt in option_columns if pd.notna(opt)]

print(f"\n总Option数量: {len(option_columns)}")

# 分析每个FLOOR零件号
floor_parts = []
for i in range(2, len(df_masterlist)):
    part_no = df_masterlist.iloc[i, 1]
    if pd.notna(part_no) and str(part_no).startswith('FLOOR'):
        floor_parts.append({
            'no': df_masterlist.iloc[i, 0],
            'part_no': part_no,
            'row': i
        })

print(f"\nFLOOR零件号数量: {len(floor_parts)}")

# 分析每个FLOOR零件号的Option组合和版型组合
for part in floor_parts:
    row_index = part['row']
    
    # 获取该零件号涉及的Option
    part_options = []
    for j, opt in enumerate(option_columns):
        cell_value = df_masterlist.iloc[row_index, j + 7]
        if pd.notna(cell_value) and cell_value != '':
            part_options.append(opt)
    
    # 获取该零件号在哪些版型中打点
    marked_versions = []
    for j, version in enumerate(versions):
        cell_value = df_masterlist.iloc[row_index, j + 2]
        if pd.notna(cell_value) and cell_value != '':
            marked_versions.append(version)
    
    print(f"\n{'=' * 80}")
    print(f"{part['part_no']}")
    print(f"{'=' * 80}")
    print(f"涉及Option数量: {len(part_options)}")
    print(f"涉及的Option: {', '.join(part_options[:10])}{'...' if len(part_options) > 10 else ''}")
    print(f"\n打点版型数量: {len(marked_versions)}")
    print(f"打点版型: {', '.join([v[:30] + '...' if len(v) > 30 else v for v in marked_versions[:5]])}{'...' if len(marked_versions) > 5 else ''}")

# 比较FLOOR001和FLOOR002的差异
print(f"\n{'=' * 80}")
print("比较FLOOR001和FLOOR002的差异")
print(f"{'=' * 80}")

floor001_row = floor_parts[0]['row']
floor002_row = floor_parts[1]['row']

# 找出FLOOR001有但FLOOR002没有的Option
floor001_only = []
floor002_only = []
floor001_and_floor002 = []

for opt in option_columns:
    floor001_has = pd.notna(df_masterlist.iloc[floor001_row, option_columns.index(opt) + 7]) and df_masterlist.iloc[floor001_row, option_columns.index(opt) + 7] != ''
    floor002_has = pd.notna(df_masterlist.iloc[floor002_row, option_columns.index(opt) + 7]) and df_masterlist.iloc[floor002_row, option_columns.index(opt) + 7] != ''
    
    if floor001_has and not floor002_has:
        floor001_only.append(opt)
    elif floor002_has and not floor001_has:
        floor002_only.append(opt)
    elif floor001_has and floor002_has:
        floor001_and_floor002.append(opt)

print(f"\nFLOOR001独有Option ({len(floor001_only)}个): {', '.join(floor001_only[:10])}{'...' if len(floor001_only) > 10 else ''}")
print(f"FLOOR002独有Option ({len(floor002_only)}个): {', '.join(floor002_only[:10])}{'...' if len(floor002_only) > 10 else ''}")
print(f"FLOOR001和FLOOR002共有Option ({len(floor001_and_floor002)}个)")

# 比较版型打点差异
floor001_versions = []
floor002_versions = []

for j, version in enumerate(versions):
    floor001_has = pd.notna(df_masterlist.iloc[floor001_row, j + 2]) and df_masterlist.iloc[floor001_row, j + 2] != ''
    floor002_has = pd.notna(df_masterlist.iloc[floor002_row, j + 2]) and df_masterlist.iloc[floor002_row, j + 2] != ''
    
    if floor001_has:
        floor001_versions.append(version)
    if floor002_has:
        floor002_versions.append(version)

print(f"\nFLOOR001打点版型 ({len(floor001_versions)}个): {', '.join([v[:30] + '...' if len(v) > 30 else v for v in floor001_versions[:3]])}{'...' if len(floor001_versions) > 3 else ''}")
print(f"FLOOR002打点版型 ({len(floor002_versions)}个): {', '.join([v[:30] + '...' if len(v) > 30 else v for v in floor002_versions[:3]])}{'...' if len(floor002_versions) > 3 else ''}")

# 找出版型打点的差异
floor001_only_versions = [v for v in floor001_versions if v not in floor002_versions]
floor002_only_versions = [v for v in floor002_versions if v not in floor001_versions]

if floor001_only_versions:
    print(f"\nFLOOR001独有打点版型: {', '.join([v[:30] + '...' if len(v) > 30 else v for v in floor001_only_versions])}")
if floor002_only_versions:
    print(f"FLOOR002独有打点版型: {', '.join([v[:30] + '...' if len(v) > 30 else v for v in floor002_only_versions])}")
