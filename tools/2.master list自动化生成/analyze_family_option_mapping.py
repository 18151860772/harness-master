import pandas as pd
import openpyxl
import re

# 读取配置表文件
config_file = "配置表.xlsx"

try:
    # 使用pandas读取
    df = pd.read_excel(config_file, sheet_name='Master List', header=None)
    
    print("=" * 80)
    print("配置表Family和Option映射分析")
    print("=" * 80)
    
    # 读取Wire list
    wirelist_file = "Wire list.xlsx"
    df_wire = pd.read_excel(wirelist_file, sheet_name='Wire List', header=0)
    
    # 获取所有Option（解析组合Option）
    def parse_options(option_str):
        if not option_str or option_str == '-' or option_str == '':
            return []
        
        options = []
        # 处理括号内的选项 (LC02/LC20)
        option_str = re.sub(r'\(([^)]+)\)', lambda m: m.group(1).replace('/', '&'), option_str)
        # 按&拆分
        parts = option_str.split('&')
        
        for part in parts:
            part = part.strip()
            if part:
                options.append(part)
        
        return options
    
    all_options = set()
    for option in df_wire['Option']:
        options = parse_options(str(option))
        all_options.update(options)
    
    print(f"\nWire List中的Option总数: {len(all_options)}")
    print(f"Option示例（前30个）: {sorted(list(all_options))[:30]}")
    
    # 查找配置表中Family编号是否与Option匹配
    print("\n" + "=" * 80)
    print("查找Family编号与Option的匹配")
    print("=" * 80)
    
    family_codes = []
    for i in range(2, len(df)):
        if pd.notna(df.iloc[i, 0]):
            family_codes.append(df.iloc[i, 0])
    
    print(f"\n配置表Family数量: {len(family_codes)}")
    print(f"Family编号示例（前30个）: {family_codes[:30]}")
    
    # 查找Family编号是否在Option中
    matching_families = []
    for code in family_codes:
        if code in all_options:
            matching_families.append(code)
    
    print(f"\nFamily编号在Option中的匹配数: {len(matching_families)}")
    print(f"匹配的Family编号: {matching_families[:20]}")
    
    # 分析Wire List的From/To列
    print("\n" + "=" * 80)
    print("分析Wire List的From/To列")
    print("=" * 80)
    
    from_values = df_wire['From'].unique()
    to_values = df_wire['To'].unique()
    
    print(f"\nFrom值数量: {len(from_values)}")
    print(f"To值数量: {len(to_values)}")
    
    # 查找From/To值是否与Family编号匹配
    from_matching = [v for v in from_values if v in family_codes]
    to_matching = [v for v in to_values if v in family_codes]
    
    print(f"\nFrom值与Family编号匹配数: {len(from_matching)}")
    print(f"匹配示例: {from_matching[:20]}")
    print(f"\nTo值与Family编号匹配数: {len(to_matching)}")
    print(f"匹配示例: {to_matching[:20]}")
    
    # 查看配置表Family编号的命名模式
    print("\n" + "=" * 80)
    print("配置表Family编号命名模式分析")
    print("=" * 80)
    
    # 按前缀分组
    prefix_groups = {}
    for code in family_codes:
        prefix = code[:2] if len(code) >= 2 else code
        if prefix not in prefix_groups:
            prefix_groups[prefix] = []
        prefix_groups[prefix].append(code)
    
    print(f"\nFamily编号前缀分组:")
    for prefix in sorted(prefix_groups.keys()):
        print(f"  {prefix}: {len(prefix_groups[prefix])}个 - 示例: {prefix_groups[prefix][:5]}")
    
    # 查看Wire List中From/To的命名模式
    print("\n" + "=" * 80)
    print("Wire List From/To命名模式分析")
    print("=" * 80)
    
    from_prefix_groups = {}
    for value in from_values:
        if pd.notna(value) and value != '':
            prefix = str(value)[:2] if len(str(value)) >= 2 else str(value)
            if prefix not in from_prefix_groups:
                from_prefix_groups[prefix] = []
            from_prefix_groups[prefix].append(value)
    
    print(f"\nFrom值前缀分组（前10个）:")
    for prefix in sorted(list(from_prefix_groups.keys())[:10]):
        print(f"  {prefix}: {len(from_prefix_groups[prefix])}个 - 示例: {from_prefix_groups[prefix][:5]}")
    
except Exception as e:
    print(f"出错: {e}")
    import traceback
    traceback.print_exc()
