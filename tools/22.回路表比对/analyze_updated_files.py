import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("分析更新后的文件结构")
print("=" * 60)

# 读取Master List文件
print("\n【Master List文件】")
print("=" * 60)
master_df = pd.read_excel('T28_Masterlist_20251223.xlsx', engine='openpyxl')
print(f"列名: {master_df.columns.tolist()}")
print(f"数据形状: {master_df.shape}")
print(f"\n前10行数据:")
print(master_df.head(10).to_string())

# 读取技术差异输入文件
print("\n\n【技术差异输入文件】")
print("=" * 60)
diff_df = pd.read_excel('技术差异.xlsx', engine='openpyxl')
print(f"列名: {diff_df.columns.tolist()}")
print(f"数据形状: {diff_df.shape}")
print(f"\n前10行数据:")
print(diff_df.head(10).to_string())

# 保存到CSV以便查看
master_df.to_csv('masterlist_updated.csv', index=False, encoding='utf-8-sig')
diff_df.to_csv('diff_updated.csv', index=False, encoding='utf-8-sig')
print("\n\nCSV文件已保存:")
print("  - masterlist_updated.csv")
print("  - diff_updated.csv")
