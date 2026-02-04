import xml.etree.ElementTree as ET
import re
import csv
from collections import defaultdict

# 读取shared strings
shared_strings = []
with open('temp_xlsx/xl/sharedStrings.xml', 'r', encoding='utf-8') as f:
    tree = ET.parse(f)
    root = tree.getroot()
    # 命名空间
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    for si in root.findall('.//main:si', ns):
        t = si.find('.//main:t', ns)
        if t is not None:
            shared_strings.append(t.text if t.text else '')
        else:
            shared_strings.append('')

print(f"Total shared strings: {len(shared_strings)}")
print(f"First 20 strings: {shared_strings[:20]}")

# 读取sheet数据
rows_data = []
with open('temp_xlsx/xl/worksheets/sheet1.xml', 'r', encoding='utf-8') as f:
    tree = ET.parse(f)
    root = tree.getroot()
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

    # 查找所有行
    for row in root.findall('.//main:row', ns):
        row_num = row.get('r')
        cells = {}
        for c in row.findall('.//main:c', ns):
            cell_ref = c.get('r')
            cell_type = c.get('t', 'n')  # n=number, s=shared string

            # 提取列字母
            col_match = re.match(r'([A-Z]+)(\d+)', cell_ref)
            if col_match:
                col = col_match.group(1)

                v = c.find('.//main:v', ns)
                if v is not None:
                    value = v.text
                    # 如果是共享字符串类型
                    if cell_type == 's':
                        try:
                            idx = int(value)
                            if idx < len(shared_strings):
                                value = shared_strings[idx]
                        except:
                            pass
                    cells[col] = value
        rows_data.append((row_num, cells))

print(f"\nTotal rows: {len(rows_data)}")
print(f"\nFirst 5 rows data:")
for i, (row_num, cells) in enumerate(rows_data[:5]):
    print(f"Row {row_num}: {cells}")

# 查找表头行
header_row = None
header_cells = {}
for row_num, cells in rows_data[:20]:  # 在前20行中查找表头
    if 'A' in cells and cells['A'] == 'Wire ID':
        header_row = row_num
        header_cells = cells
        break

if header_row:
    print(f"\n找到表头行: {header_row}")
    print(f"表头列: {header_cells}")

    # 创建列名映射
    col_to_field = {}
    for col, value in header_cells.items():
        col_to_field[col] = value

    # 查找关键字段所在的列
    wire_id_col = None
    color_col = None
    size_col = None
    material_col = None
    option_col = None
    multicore_id_col = None
    ident_tag_col = None
    from_code_col = None
    from_pin_col = None
    to_code_col = None
    to_pin_col = None

    for col, field in col_to_field.items():
        if field == 'Wire ID':
            wire_id_col = col
        elif field == 'Color':
            color_col = col
        elif field == 'Size / Gauge':
            size_col = col
        elif field == 'Material':
            material_col = col
        elif field == 'Option':
            option_col = col
        elif field == 'Multicore ID':
            multicore_id_col = col
        elif field == 'Ident Tag':
            ident_tag_col = col
        elif field == 'From Code':
            from_code_col = col
        elif field == 'From Pin':
            from_pin_col = col
        elif field == 'To Code':
            to_code_col = col
        elif field == 'To Pin':
            to_pin_col = col

    print(f"\n列映射:")
    print(f"  Wire ID: {wire_id_col}")
    print(f"  Color: {color_col}")
    print(f"  Option: {option_col}")
    print(f"  Multicore ID: {multicore_id_col}")
    print(f"  From Code: {from_code_col}")
    print(f"  To Code: {to_code_col}")

    # 提取数据行（从表头行之后开始）
    data_rows = []
    header_found = False
    for row_num, cells in rows_data:
        if not header_found:
            if row_num == header_row:
                header_found = True
            continue

        # 只处理包含Multicore ID的行
        if multicore_id_col and multicore_id_col in cells:
            multicore_id = cells[multicore_id_col]

            # 筛选C或S开头的Multicore ID
            if multicore_id and (multicore_id.startswith('C') or multicore_id.startswith('S')):
                row_data = {
                    'Wire ID': cells.get(wire_id_col, ''),
                    'Color': cells.get(color_col, ''),
                    'Size / Gauge': cells.get(size_col, ''),
                    'Material': cells.get(material_col, ''),
                    'Option': cells.get(option_col, ''),
                    'Multicore ID': multicore_id,
                    'Ident Tag': cells.get(ident_tag_col, ''),
                    'From Code': cells.get(from_code_col, ''),
                    'From Pin': cells.get(from_pin_col, ''),
                    'To Code': cells.get(to_code_col, ''),
                    'To Pin': cells.get(to_pin_col, ''),
                }
                data_rows.append(row_data)

    print(f"\n找到 {len(data_rows)} 条C或S开头的Multicore ID记录")
    print(f"\n前5条记录:")
    for i, row in enumerate(data_rows[:5]):
        print(f"{i+1}. {row}")

    # 按Multicore ID和Option分组
    grouped = defaultdict(list)
    for row in data_rows:
        key = (row['Multicore ID'], row['Option'])
        grouped[key].append(row)

    print(f"\n按Multicore ID和Option分组后，共有 {len(grouped)} 个不同的外购件")

    # 生成外购件清单
    output_rows = []
    for (multicore_id, option), wires in sorted(grouped.items()):
        # 取第一条记录作为代表
        first_wire = wires[0]

        # 统计线束数量
        wire_count = len(wires)

        # 获取所有From和To代码
        from_codes = list(set([w['From Code'] for w in wires if w['From Code']]))
        to_codes = list(set([w['To Code'] for w in wires if w['To Code']]))

        output_row = {
            'Multicore ID': multicore_id,
            'Option': option,
            '线束数量': wire_count,
            'Color': first_wire['Color'],
            'Size / Gauge': first_wire['Size / Gauge'],
            'Material': first_wire['Material'],
            'Ident Tag': first_wire['Ident Tag'],
            'From Code': ', '.join(sorted(from_codes)),
            'To Code': ', '.join(sorted(to_codes)),
        }
        output_rows.append(output_row)

    # 保存到CSV
    with open('外购件清单.csv', 'w', encoding='utf-8-sig', newline='') as f:
        fieldnames = ['Multicore ID', 'Option', '线束数量', 'Color', 'Size / Gauge', 'Material', 'Ident Tag', 'From Code', 'To Code']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"\n已生成外购件清单: 外购件清单.csv")
    print(f"共 {len(output_rows)} 个外购件")

else:
    print("未找到表头行")
