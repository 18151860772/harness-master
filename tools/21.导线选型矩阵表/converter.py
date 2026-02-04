"""
将Excel文件转换为JSON数据，嵌入到HTML中
"""
import pandas as pd
import json
import re
import os

def excel_to_json(excel_file):
    """读取Excel文件并生成JSON数据"""
    xls = pd.ExcelFile(excel_file)
    data = {}

    for sheet_name in xls.sheet_names:
        # header=None 表示不使用第一行作为表头，第一行也作为数据读取
        df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
        # 将NaN替换为空字符串
        data[sheet_name] = df.fillna('').values.tolist()

    print(f"成功转换Excel文件: {excel_file}")
    print(f"Sheet数量: {len(data)}")
    for sheet_name, rows in data.items():
        print(f"  - {sheet_name}: {len(rows)} 行")
        # 输出第一个sheet的前几行数据用于调试
        if list(data.keys()).index(sheet_name) == 0:
            print(f"\n调试信息 - {sheet_name} 数据:")
            print(f"总行数: {len(rows)}")
            if len(rows) > 0:
                print(f"总列数: {len(rows[0])}")
                print("\n前5行数据:")
                for i in range(min(5, len(rows))):
                    print(f"  行{i}: {rows[i]}")

    return data

def embed_data_to_html(json_data, html_file='web.html'):
    """将JSON数据保存为独立的JavaScript文件"""
    # 将数据保存为独立的 data.js 文件
    data_js_file = html_file.replace('.html', '.data.js')

    # 写入JavaScript文件，使用 ensure_ascii=False 保留中文字符
    with open(data_js_file, 'w', encoding='utf-8') as f:
        f.write('let defaultData = ')
        f.write(json.dumps(json_data, ensure_ascii=False, indent=2))
        f.write(';')

    print(f"\n已将数据保存到 {data_js_file}")
    print("数据大小:", os.path.getsize(data_js_file), "字节")

    # 修改HTML文件，添加script标签加载data.js
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 在</head>之前插入script标签
    script_tag = f'    <script src="{os.path.basename(data_js_file)}"></script>\n</head>'

    if '</head>' in html_content:
        # 如果已经有data.js的引用，先移除
        html_content = re.sub(r'<script src=".*?\.data\.js"></script>\n?', '', html_content)
        # 插入新的script标签
        html_content = html_content.replace('</head>', script_tag)

        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"已更新 {html_file} 以加载数据文件")
    else:
        print(f"警告: 未在 {html_file} 中找到 </head> 标签")

    print("现在可以直接在浏览器中打开网页使用了！")

if __name__ == '__main__':
    # 读取Excel数据
    data = excel_to_json('导线选型矩阵表V8.1.xlsx')
    # 嵌入到HTML文件
    embed_data_to_html(data)
