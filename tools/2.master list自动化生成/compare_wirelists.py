#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比Wire list和Wire list2的列结构差异
"""

import pandas as pd
import sys
import os

def compare_wirelists():
    """对比两个Wire List文件的列结构"""
    
    print("=" * 80)
    print("Wire List vs Wire List2 列结构对比")
    print("=" * 80)
    print()
    
    # 获取脚本所在目录
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. 读取Wire List文件
    print("[步骤1] 读取Wire List文件...")
    wirelist_path = os.path.join(base_dir, "Wire list.xlsx")
    try:
        wirelist_df = pd.read_excel(wirelist_path)
        print(f"[OK] 成功读取Wire List文件")
        print(f"  - 行数: {len(wirelist_df)}")
        print(f"  - 列数: {len(wirelist_df.columns)}")
        print()
    except Exception as e:
        print(f"[ERROR] 读取Wire List文件失败: {e}")
        return
    
    # 2. 读取Wire List2文件
    print("[步骤2] 读取Wire List2文件...")
    wirelist2_path = os.path.join(base_dir, "Wire list2.xlsx")
    try:
        wirelist2_df = pd.read_excel(wirelist2_path)
        print(f"[OK] 成功读取Wire List2文件")
        print(f"  - 行数: {len(wirelist2_df)}")
        print(f"  - 列数: {len(wirelist2_df.columns)}")
        print()
    except Exception as e:
        print(f"[ERROR] 读取Wire List2文件失败: {e}")
        return
    
    # 3. 显示Wire List的列结构
    print("[步骤3] Wire List列结构")
    print("-" * 80)
    print("所有列名:")
    for i, col in enumerate(wirelist_df.columns, 0):
        print(f"  索引 {i:2d}: {col}")
    print()
    
    # 4. 显示Wire List2的列结构
    print("[步骤4] Wire List2列结构")
    print("-" * 80)
    print("所有列名:")
    for i, col in enumerate(wirelist2_df.columns, 0):
        print(f"  索引 {i:2d}: {col}")
    print()
    
    # 5. 对比列名
    print("[步骤5] 列名对比")
    print("-" * 80)
    
    wirelist_cols = list(wirelist_df.columns)
    wirelist2_cols = list(wirelist2_df.columns)
    
    print(f"Wire List列数: {len(wirelist_cols)}")
    print(f"Wire List2列数: {len(wirelist2_cols)}")
    print()
    
    # 检查列名是否相同
    if wirelist_cols == wirelist2_cols:
        print("[OK] 两个文件的列名完全相同")
    else:
        print("[WARNING] 两个文件的列名不同")
        print()
        
        # 找出差异
        set1 = set(wirelist_cols)
        set2 = set(wirelist2_cols)
        
        only_in_1 = set1 - set2
        only_in_2 = set2 - set1
        
        if only_in_1:
            print(f"只在Wire List中的列: {only_in_1}")
        if only_in_2:
            print(f"只在Wire List2中的列: {only_in_2}")
    
    print()
    
    # 6. 检查关键列的位置
    print("[步骤6] 关键列位置对比")
    print("-" * 80)
    
    key_columns = ['Family', 'Option', 'Ident Tag', 'Wire ID', 'From', 'To']
    
    for key_col in key_columns:
        print(f"\n列名: '{key_col}'")
        
        # 在Wire List中查找
        found_in_1 = False
        index_in_1 = None
        for i, col in enumerate(wirelist_cols):
            if key_col.lower() in str(col).lower():
                found_in_1 = True
                index_in_1 = i
                print(f"  Wire List: 索引 {i} - '{col}'")
                break
        
        if not found_in_1:
            print(f"  Wire List: 未找到")
        
        # 在Wire List2中查找
        found_in_2 = False
        index_in_2 = None
        for i, col in enumerate(wirelist2_cols):
            if key_col.lower() in str(col).lower():
                found_in_2 = True
                index_in_2 = i
                print(f"  Wire List2: 索引 {i} - '{col}'")
                break
        
        if not found_in_2:
            print(f"  Wire List2: 未找到")
        
        # 对比位置
        if found_in_1 and found_in_2:
            if index_in_1 == index_in_2:
                print(f"  [OK] 位置相同: 索引 {index_in_1}")
            else:
                print(f"  [WARNING] 位置不同: Wire List={index_in_1}, Wire List2={index_in_2}")
    
    print()
    
    # 7. 显示数据示例
    print("[步骤7] 数据示例对比（前5行）")
    print("-" * 80)
    
    print("\nWire List前5行:")
    print(wirelist_df.head().to_string())
    
    print("\n\nWire List2前5行:")
    print(wirelist2_df.head().to_string())
    
    print()
    
    # 8. 分析Family和Option列
    print("[步骤8] Family和Option列详细分析")
    print("-" * 80)
    
    # 查找Family列
    print("\nFamily列分析:")
    family_col_1 = None
    family_col_2 = None
    
    for i, col in enumerate(wirelist_cols):
        if 'family' in str(col).lower():
            family_col_1 = i
            print(f"  Wire List: 索引 {i} - '{col}'")
            print(f"    唯一值数量: {wirelist_df[col].nunique()}")
            print(f"    唯一值示例: {wirelist_df[col].unique()[:10].tolist()}")
            break
    
    for i, col in enumerate(wirelist2_cols):
        if 'family' in str(col).lower():
            family_col_2 = i
            print(f"  Wire List2: 索引 {i} - '{col}'")
            print(f"    唯一值数量: {wirelist2_df[col].nunique()}")
            print(f"    唯一值示例: {wirelist2_df[col].unique()[:10].tolist()}")
            break
    
    if family_col_1 is not None and family_col_2 is not None and family_col_1 != family_col_2:
        print(f"\n  [WARNING] Family列位置不同！")
        print(f"    HTML代码使用的是索引6，但Wire List2中Family在索引{family_col_2}")
    
    # 查找Option列
    print("\nOption列分析:")
    option_col_1 = None
    option_col_2 = None
    
    for i, col in enumerate(wirelist_cols):
        if 'option' in str(col).lower():
            option_col_1 = i
            print(f"  Wire List: 索引 {i} - '{col}'")
            print(f"    唯一值数量: {wirelist_df[col].nunique()}")
            print(f"    唯一值示例: {wirelist_df[col].unique()[:10].tolist()}")
            break
    
    for i, col in enumerate(wirelist2_cols):
        if 'option' in str(col).lower():
            option_col_2 = i
            print(f"  Wire List2: 索引 {i} - '{col}'")
            print(f"    唯一值数量: {wirelist2_df[col].nunique()}")
            print(f"    唯一值示例: {wirelist2_df[col].unique()[:10].tolist()}")
            break
    
    if option_col_1 is not None and option_col_2 is not None and option_col_1 != option_col_2:
        print(f"\n  [WARNING] Option列位置不同！")
        print(f"    HTML代码使用的是索引4，但Wire List2中Option在索引{option_col_2}")
    
    print()
    
    # 9. 结论
    print("=" * 80)
    print("[结论]")
    print("=" * 80)
    
    print("\nHTML代码中硬编码的列索引:")
    print("  - Family: row[6] (第7列)")
    print("  - Option: row[4] (第5列)")
    
    print("\n实际文件中的列位置:")
    if family_col_1 is not None:
        print(f"  - Wire List Family: 索引 {family_col_1}")
    if family_col_2 is not None:
        print(f"  - Wire List2 Family: 索引 {family_col_2}")
    if option_col_1 is not None:
        print(f"  - Wire List Option: 索引 {option_col_1}")
    if option_col_2 is not None:
        print(f"  - Wire List2 Option: 索引 {option_col_2}")
    
    print("\n问题诊断:")
    if (family_col_1 is not None and family_col_2 is not None and family_col_1 != family_col_2) or \
       (option_col_1 is not None and option_col_2 is not None and option_col_1 != option_col_2):
        print("  [问题] Wire List2的列顺序与Wire List不同，导致HTML代码无法正确读取Family和Option")
        print("  [解决方案] 需要修改HTML代码，使用列名而不是硬编码的列索引")
    else:
        print("  [OK] 列顺序相同，问题可能出在其他地方")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    compare_wirelists()
