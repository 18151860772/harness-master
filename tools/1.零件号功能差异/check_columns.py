import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 读取CSV文件
df = pd.read_csv('masterlist_updated.csv', encoding='utf-8-sig')

print("=" * 80)
print("Master List列名分析")
print("=" * 80)

print("\n前20列:")
for i, col in enumerate(df.columns[:20]):
    print(f"{i:3d}: {col}")

# 查找"标配"列
print("\n\n查找'标配'列:")
for i, col in enumerate(df.columns):
    if '标配' in str(col):
        print(f"找到'标配'列在索引 {i}: {col}")

# 查找"功能"列
print("\n\n查找'功能'列:")
for i, col in enumerate(df.columns):
    if '功能' in str(col):
        print(f"找到'功能'列在索引 {i}: {col}")

print(f"\n\n总列数: {len(df.columns)}")
