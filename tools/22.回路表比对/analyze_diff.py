import pandas as pd
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 读取Excel文件
df = pd.read_excel('技术差异.xlsx', engine='openpyxl')

print("列名:", df.columns.tolist())
print("\n数据形状:", df.shape)
print("\n前20行数据:")
print(df.head(20).to_string())

# 保存到CSV以便查看
df.to_csv('diff_temp.csv', index=False, encoding='utf-8-sig')
print("\n数据已保存到 diff_temp.csv")
