#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wire List与配置表数据对比分析脚本
分析配置表A列与Wire List中各列的对应关系
"""

import pandas as pd
import numpy as np
import sys
import os
from collections import defaultdict

# 设置输出编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def analyze_wirelist_config():
    """分析Wire List和配置表的数据结构及对应关系"""
    
    print("=" * 80)
    print("Wire List 与配置表数据对比分析")
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
    
    # 2. 读取配置表文件
    print("[步骤2] 读取配置表文件...")
    config_path = os.path.join(base_dir, "配置表.xlsx")
    try:
        config_df = pd.read_excel(config_path)
        print(f"[OK] 成功读取配置表文件")
        print(f"  - 行数: {len(config_df)}")
        print(f"  - 列数: {len(config_df.columns)}")
        print()
    except Exception as e:
        print(f"[ERROR] 读取配置表文件失败: {e}")
        return
    
    # 3. 显示Wire List的列结构
    print("[步骤3] Wire List列结构分析")
    print("-" * 80)
    print("所有列名:")
    for i, col in enumerate(wirelist_df.columns, 1):
        print(f"  {i:2d}. {col}")
    print()
    
    # 4. 显示配置表的列结构
    print("[步骤4] 配置表列结构分析")
    print("-" * 80)
    print("所有列名:")
    for i, col in enumerate(config_df.columns, 1):
        print(f"  {i:2d}. {col}")
    print()
    
    # 5. 提取配置表A列数据
    print("[步骤5] 配置表A列数据提取")
    print("-" * 80)
    a_column = config_df.iloc[:, 0]  # A列
    a_values = a_column.dropna().unique().tolist()
    print(f"配置表A列（特征值代码）:")
    print(f"  - 唯一值数量: {len(a_values)}")
    print(f"  - 唯一值列表: {a_values}")
    print()
    
    # 6. 分析Wire List中的关键列
    print("[步骤6] Wire List关键列数据分析")
    print("-" * 80)
    
    # 查找Option列
    option_col = None
    for col in wirelist_df.columns:
        if 'option' in str(col).lower():
            option_col = col
            break
    
    if option_col:
        option_values = wirelist_df[option_col].dropna().unique().tolist()
        print(f"Option列 ('{option_col}'):")
        print(f"  - 唯一值数量: {len(option_values)}")
        print(f"  - 唯一值列表: {option_values}")
        print()
    else:
        print("[NOT FOUND] 未找到Option列")
        option_values = []
        print()
    
    # 查找Ident Tag列
    ident_tag_col = None
    for col in wirelist_df.columns:
        if 'ident' in str(col).lower() or 'tag' in str(col).lower():
            ident_tag_col = col
            break
    
    if ident_tag_col:
        ident_tag_values = wirelist_df[ident_tag_col].dropna().unique().tolist()
        print(f"Ident Tag列 ('{ident_tag_col}'):")
        print(f"  - 唯一值数量: {len(ident_tag_values)}")
        print(f"  - 唯一值列表: {ident_tag_values}")
        print()
    else:
        print("[NOT FOUND] 未找到Ident Tag列")
        ident_tag_values = []
        print()
    
    # 7. 数据对比分析
    print("[步骤7] 数据对比分析")
    print("=" * 80)
    
    # 7.1 配置表A列 vs Wire List Option列
    print("\n7.1 配置表A列 vs Wire List Option列")
    print("-" * 80)
    if option_col:
        match_count = 0
        mismatch_count = 0
        matched_values = []
        for val in a_values:
            if val in option_values:
                match_count += 1
                matched_values.append(val)
            else:
                mismatch_count += 1
        
        print(f"配置表A列值总数: {len(a_values)}")
        print(f"与Option列匹配: {match_count} 个")
        print(f"与Option列不匹配: {mismatch_count} 个")
        print(f"匹配率: {match_count/len(a_values)*100:.2f}%")
        
        if matched_values:
            print(f"\n匹配的值: {matched_values}")
        
        if mismatch_count > 0:
            mismatched = [v for v in a_values if v not in option_values]
            print(f"\n不匹配的值: {mismatched}")
    else:
        print("[NOT FOUND] Option列不存在，无法进行对比")
    
    print()
    
    # 7.2 配置表A列 vs Wire List Ident Tag列
    print("\n7.2 配置表A列 vs Wire List Ident Tag列")
    print("-" * 80)
    if ident_tag_col:
        match_count = 0
        mismatch_count = 0
        matched_values = []
        for val in a_values:
            if val in ident_tag_values:
                match_count += 1
                matched_values.append(val)
            else:
                mismatch_count += 1
        
        print(f"配置表A列值总数: {len(a_values)}")
        print(f"与Ident Tag列匹配: {match_count} 个")
        print(f"与Ident Tag列不匹配: {mismatch_count} 个")
        print(f"匹配率: {match_count/len(a_values)*100:.2f}%")
        
        if matched_values:
            print(f"\n匹配的值: {matched_values}")
        
        if mismatch_count > 0:
            mismatched = [v for v in a_values if v not in ident_tag_values]
            print(f"\n不匹配的值: {mismatched}")
    else:
        print("[NOT FOUND] Ident Tag列不存在，无法进行对比")
    
    print()
    
    # 8. 在Wire List所有列中查找配置表A列的值
    print("\n[步骤8] 在Wire List所有列中查找配置表A列的值")
    print("=" * 80)
    
    column_matches = {}
    for col in wirelist_df.columns:
        col_values = wirelist_df[col].dropna().unique().tolist()
        match_count = 0
        matched_values = []
        for val in a_values:
            if val in col_values:
                match_count += 1
                matched_values.append(val)
        
        if match_count > 0:
            column_matches[col] = {
                'match_count': match_count,
                'matched_values': matched_values,
                'match_rate': match_count / len(a_values) * 100
            }
    
    # 按匹配率排序
    sorted_matches = sorted(column_matches.items(), 
                          key=lambda x: x[1]['match_rate'], 
                          reverse=True)
    
    print("\n各列匹配情况（按匹配率排序）:")
    print("-" * 80)
    for col, info in sorted_matches:
        print(f"\n列名: '{col}'")
        print(f"  匹配数量: {info['match_count']}/{len(a_values)}")
        print(f"  匹配率: {info['match_rate']:.2f}%")
        print(f"  匹配的值: {info['matched_values']}")
    
    # 9. 显示Wire List前几行数据以供参考
    print("\n" + "=" * 80)
    print("[步骤9] Wire List前5行数据示例")
    print("=" * 80)
    print(wirelist_df.head().to_string())
    print()
    
    # 10. 显示配置表前几行数据以供参考
    print("\n" + "=" * 80)
    print("[步骤10] 配置表前5行数据示例")
    print("=" * 80)
    print(config_df.head().to_string())
    print()
    
    # 11. 结论
    print("\n" + "=" * 80)
    print("[结论]")
    print("=" * 80)
    
    if sorted_matches:
        best_col, best_info = sorted_matches[0]
        print(f"\n配置表A列（特征值代码）最可能对应Wire List的列: '{best_col}'")
        print(f"  - 匹配率: {best_info['match_rate']:.2f}%")
        print(f"  - 匹配数量: {best_info['match_count']}/{len(a_values)}")
        print(f"  - 匹配的值: {best_info['matched_values']}")
        
        if best_info['match_rate'] >= 90:
            print(f"\n[CONCLUSION] 配置表A列应该对应Wire List的 '{best_col}' 列")
        elif best_info['match_rate'] >= 50:
            print(f"\n[CONCLUSION] 配置表A列可能对应Wire List的 '{best_col}' 列，但匹配率较低")
        else:
            print(f"\n[CONCLUSION] 配置表A列与Wire List的任何列都没有明确的对应关系")
    else:
        print("\n[NOT FOUND] 未找到任何列与配置表A列有匹配")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    analyze_wirelist_config()
