import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 读取Master List文件
master_df = pd.read_excel('T28_Masterlist_20251223.xlsx', engine='openpyxl')

print("=" * 80)
print("Master List第二行分析")
print("=" * 80)

# 获取第二行数据
second_row = master_df.iloc[0]  # 第一行数据（索引0），因为第一行是表头

print("\n第二行数据（前30列）:")
for i, value in enumerate(second_row[:30]):
    print(f"{i:3d}: {value}")

# 查找"标配"列
print("\n\n查找'标配'列:")
for i, value in enumerate(second_row):
    if pd.notna(value) and '标配' in str(value):
        print(f"找到'标配'列在索引 {i}: {value}")
        print(f"\n'标配'列之后的所有列（索引 {i+1} 开始）:")
        for j in range(i+1, min(i+20, len(second_row))):
            print(f"  {j:3d}: {second_row.iloc[j]}")
        break
