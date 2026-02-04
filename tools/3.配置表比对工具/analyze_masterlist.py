import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 读取Excel文件
df = pd.read_excel('T28_Masterlist_20251223.xlsx', engine='openpyxl')

print("列名:", df.columns.tolist())
print("\n数据形状:", df.shape)
print("\n前10行数据:")
print(df.head(10).to_string())

# 保存到CSV以便查看
df.to_csv('masterlist_temp.csv', index=False, encoding='utf-8-sig')
print("\n数据已保存到 masterlist_temp.csv")
