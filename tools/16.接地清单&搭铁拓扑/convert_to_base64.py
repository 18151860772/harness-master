import base64
import os

os.chdir(r"C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑")

files = {
    'WIRELIST': 'WIRELIST.xlsx',
    'CONNLIST': 'T28-Connlist_20260113.xlsx',
    'INLINE': 'inline.xlsx'
}

for key, filename in files.items():
    if os.path.exists(filename):
        with open(filename, 'rb') as f:
            file_content = f.read()
            base64_string = base64.b64encode(file_content).decode('utf-8')
            output_file = f"{key.lower()}_b64.txt"
            with open(output_file, 'w') as out:
                out.write(base64_string)
            print(f"{filename}: {len(base64_string)} chars -> {output_file}")
    else:
        print(f"{filename} NOT FOUND")

print("\nDone!")
