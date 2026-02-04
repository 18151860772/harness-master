import pandas as pd
import openpyxl

# 读取Wire List和配置表
wirelist_file = "Wire list.xlsx"
config_file = "配置表.xlsx"
masterlist_file = "MasterList__202508060203859.xlsx"

print("=" * 80)
print("分析MasterList生成逻辑")
print("=" * 80)

# 读取Wire List
df_wire = pd.read_excel(wirelist_file, sheet_name='Wire List', header=0)
print(f"\nWire List数据: {len(df_wire)} 条")

# 解析Option的函数
def parse_options(option_str):
    if pd.isna(option_str) or option_str == '-' or option_str == '':
        return []
    
    options = []
    # 处理括号内的选项
    option_str = str(option_str).replace('(', '').replace(')', '').replace('/', '&')
    # 按&拆分
    parts = option_str.split('&')
    
    for part in parts:
        part = part.strip()
        if part:
            options.append(part)
    
    return options

# 按Ident Tag分组统计Option
ident_tag_options = {}
for _, row in df_wire.iterrows():
    ident_tag = row['Ident Tag']
    option = row['Option']
    
    if pd.notna(ident_tag):
        options = parse_options(option)
        if ident_tag not in ident_tag_options:
            ident_tag_options[ident_tag] = set()
        ident_tag_options[ident_tag].update(options)

print(f"\nIdent Tag数量: {len(ident_tag_options)}")

# 显示FLOOR的Option
if 'FLOOR' in ident_tag_options:
    print(f"\nFLOOR涉及的Option: {sorted(list(ident_tag_options['FLOOR']))}")

# 读取配置表
df_config = pd.read_excel(config_file, sheet_name='Master List', header=None)
version_names = df_config.iloc[1, 3:].tolist()
versions = [name for name in version_names if pd.notna(name)]

print(f"\n配置表版型数量: {len(versions)}")
print(f"版型列表（前5个）: {versions[:5]}")

# 读取Family数据
family_data = {}
for i in range(2, len(df_config)):
    family_code = df_config.iloc[i, 0]
    if pd.notna(family_code):
        family_data[family_code] = {
            'row_index': i,
            'marks': {}
        }
        # 记录每个版型的打点情况
        for j, version in enumerate(versions):
            cell_value = df_config.iloc[i, j + 3]
            if pd.notna(cell_value) and cell_value != '':
                family_data[family_code]['marks'][j] = True

print(f"\n配置表Family数量: {len(family_data)}")

# 分析FLOOR的Option对应的Family打点情况
if 'FLOOR' in ident_tag_options:
    floor_options = sorted(list(ident_tag_options['FLOOR']))
    print(f"\nFLOOR的Option对应的Family打点情况:")
    
    for opt in floor_options:
        if opt in family_data:
            marks = family_data[opt]['marks']
            marked_versions = [versions[i] for i in marks.keys()]
            print(f"  {opt}: {len(marked_versions)} 个版型打点")
            if len(marked_versions) <= 5:
                print(f"    版型: {marked_versions}")

# 读取现有的MasterList，查看FLOOR零件号的数量和分布
df_masterlist = pd.read_excel(masterlist_file, sheet_name='Master List', header=None)
print(f"\n{'=' * 80}")
print("现有MasterList分析")
print(f"{'=' * 80}")

# 查找FLOOR零件号
floor_parts = []
for i in range(2, len(df_masterlist)):
    part_no = df_masterlist.iloc[i, 1]
    if pd.notna(part_no) and str(part_no).startswith('FLOOR'):
        floor_parts.append({
            'no': df_masterlist.iloc[i, 0],
            'part_no': part_no,
            'row': i
        })

print(f"\n现有MasterList中FLOOR零件号数量: {len(floor_parts)}")
print(f"FLOOR零件号列表: {[p['part_no'] for p in floor_parts]}")

# 分析每个FLOOR零件号在哪些版型中打点
print(f"\nFLOOR零件号的版型打点情况:")
for part in floor_parts[:6]:  # 只显示前6个
    row_index = part['row']
    marked_versions = []
    for j, version in enumerate(versions):
        cell_value = df_masterlist.iloc[row_index, j + 2]
        if pd.notna(cell_value) and cell_value != '':
            marked_versions.append(version)
    
    print(f"  {part['part_no']}: {len(marked_versions)} 个版型打点")
    if len(marked_versions) <= 3:
        print(f"    版型: {marked_versions}")

# 分析FLOOR零件号的Option分布
print(f"\nFLOOR零件号的Option分布:")
for part in floor_parts[:6]:
    row_index = part['row']
    marked_options = []
    
    # Option列从第8列开始（索引7）
    for j in range(7, len(df_masterlist.columns)):
        option_name = df_masterlist.iloc[0, j]
        cell_value = df_masterlist.iloc[row_index, j]
        if pd.notna(cell_value) and cell_value != '':
            marked_options.append(option_name)
    
    print(f"  {part['part_no']}: {len(marked_options)} 个Option")
    if len(marked_options) <= 10:
        print(f"    Options: {marked_options}")
