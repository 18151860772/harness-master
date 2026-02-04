import base64
import os

os.chdir(r"C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑")

# 读取Excel文件并转换为Base64
files = {
    'WIRELIST': 'WIRELIST.xlsx',
    'CONNLIST': 'T28-Connlist_20260113.xlsx',
    'INLINE': 'inline.xlsx'
}

base64_data = {}

for key, filename in files.items():
    if os.path.exists(filename):
        with open(filename, 'rb') as f:
            file_content = f.read()
            base64_string = base64.b64encode(file_content).decode('utf-8')
            base64_data[key] = base64_string
            print(f"{filename}: {len(base64_string)} characters")
    else:
        print(f"{filename} NOT FOUND")
        base64_data[key] = ""

# 创建JavaScript文件包含Base64数据
js_content = "// Excel模板文件的Base64数据\n"
js_content += "const TEMPLATE_FILES = {\n"

for key, data in base64_data.items():
    if data:
        js_content += f"    {key}: {{\n"
        js_content += f"        filename: '{files[key]}',\n"
        js_content += f"        data: '{data}'\n"
        js_content += "    },\n"
    else:
        print(f"Warning: {key} data is empty")

js_content = js_content.rstrip(',\n') + "\n};\n"

# 保存JavaScript文件
with open('template_base64.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\nCreated template_base64.js")
print(f"File size: {len(js_content)} characters")
