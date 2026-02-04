import pandas as pd
import openpyxl

# 读取配置表文件
config_file = "配置表.xlsx"

try:
    # 使用openpyxl读取
    wb = openpyxl.load_workbook(config_file, data_only=True)
    ws = wb['Master List']
    
    print("=" * 80)
    print("配置表详细结构分析")
    print("=" * 80)
    
    # 显示前20行数据
    print("\n前20行数据:")
    for i, row in enumerate(ws.iter_rows(values_only=True), 1):
        if i <= 20:
            print(f"Row {i}: {row}")
        else:
            break
    
    # 使用pandas读取
    df = pd.read_excel(config_file, sheet_name='Master List', header=None)
    
    print("\n" + "=" * 80)
    print("列结构分析")
    print("=" * 80)
    print(f"总行数: {len(df)}, 总列数: {len(df.columns)}")
    
    # 显示列名
    print("\n前10列:")
    for i in range(min(10, len(df.columns))):
        print(f"列 {i}: {df.iloc[:5, i].tolist()}")
    
    # 分析Family数据
    print("\n" + "=" * 80)
    print("Family数据样本（前10个）")
    print("=" * 80)
    family_count = 0
    for i in range(2, min(12, len(df))):
        if pd.notna(df.iloc[i, 0]):
            family_count += 1
            print(f"\nFamily {family_count}:")
            print(f"  编号: {df.iloc[i, 0]}")
            print(f"  名称: {df.iloc[i, 1]}")
            print(f"  备注: {df.iloc[i, 2]}")
            # 显示前5个版型的打点情况
            marks = []
            for j in range(3, min(8, len(df.columns))):
                cell_value = df.iloc[i, j]
                if pd.notna(cell_value) and cell_value != '':
                    marks.append(f"版型{j-2}: {cell_value}")
            if marks:
                print(f"  打点: {', '.join(marks)}")
    
    # 统计总Family数
    total_families = sum(1 for i in range(2, len(df)) if pd.notna(df.iloc[i, 0]))
    print(f"\n总Family数: {total_families}")
    
    # 统计总版型数
    total_versions = len(df.columns) - 3
    print(f"总版型数: {total_versions}")
    
except Exception as e:
    print(f"出错: {e}")
    import traceback
    traceback.print_exc()
