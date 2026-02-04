import pandas as pd
import openpyxl

# 读取Wire list文件
wirelist_file = "Wire list.xlsx"

try:
    # 使用openpyxl读取
    wb = openpyxl.load_workbook(wirelist_file, data_only=True)
    ws = wb['Wire List']
    
    print("=" * 80)
    print("Wire List Family分析")
    print("=" * 80)
    
    # 显示前30行数据
    print("\n前30行数据:")
    for i, row in enumerate(ws.iter_rows(values_only=True), 1):
        if i <= 30:
            print(f"Row {i}: {row}")
        else:
            break
    
    # 使用pandas读取
    df = pd.read_excel(wirelist_file, sheet_name='Wire List', header=0)
    
    print("\n" + "=" * 80)
    print("列信息")
    print("=" * 80)
    print(f"列名: {df.columns.tolist()}")
    print(f"总行数: {len(df)}")
    
    # 分析Ident Tag
    print("\n" + "=" * 80)
    print("Ident Tag分析")
    print("=" * 80)
    ident_tags = df['Ident Tag'].unique()
    print(f"Ident Tag数量: {len(ident_tags)}")
    print(f"Ident Tag列表: {ident_tags.tolist()}")
    
    # 分析Option
    print("\n" + "=" * 80)
    print("Option分析（前20个）")
    print("=" * 80)
    options = df['Option'].unique()
    print(f"Option数量: {len(options)}")
    print(f"Option列表（前20个）: {options[:20].tolist()}")
    
    # 按Ident Tag分组统计Option
    print("\n" + "=" * 80)
    print("按Ident Tag分组的Option统计")
    print("=" * 80)
    for tag in ident_tags[:10]:
        tag_data = df[df['Ident Tag'] == tag]
        options_in_tag = tag_data['Option'].unique()
        print(f"\nIdent Tag: {tag}")
        print(f"  Option数量: {len(options_in_tag)}")
        print(f"  Options: {options_in_tag[:10].tolist()}")
    
    # 查找Family编号模式
    print("\n" + "=" * 80)
    print("查找Family编号模式")
    print("=" * 80)
    
    # 检查Wire ID列是否包含Family编号
    wire_ids = df['Wire ID'].unique()
    print(f"Wire ID数量: {len(wire_ids)}")
    print(f"Wire ID示例（前20个）: {wire_ids[:20].tolist()}")
    
    # 检查From/To列是否包含Family编号
    from_values = df['From'].unique()
    to_values = df['To'].unique()
    print(f"\nFrom值数量: {len(from_values)}")
    print(f"From示例（前20个）: {from_values[:20].tolist()}")
    print(f"\nTo值数量: {len(to_values)}")
    print(f"To示例（前20个）: {to_values[:20].tolist()}")
    
except Exception as e:
    print(f"出错: {e}")
    import traceback
    traceback.print_exc()
