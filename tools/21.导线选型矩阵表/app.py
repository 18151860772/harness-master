from flask import Flask, render_template, send_file, jsonify, request
import pandas as pd
import os
import json

app = Flask(__name__)
DEFAULT_EXCEL = '导线选型矩阵表V8.1.xlsx'

def get_excel_data(filepath):
    """读取Excel文件并返回JSON数据"""
    try:
        xls = pd.ExcelFile(filepath)
        data = {}
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(filepath, sheet_name=sheet_name)
            # 将DataFrame转换为列表格式，保留NaN值以便前端处理
            data[sheet_name] = df.fillna('').values.tolist()
        return {
            'success': True,
            'sheets': list(data.keys()),
            'data': data
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/excel-data')
def excel_data():
    """获取默认Excel文件的数据"""
    if os.path.exists(DEFAULT_EXCEL):
        return jsonify(get_excel_data(DEFAULT_EXCEL))
    else:
        return jsonify({
            'success': False,
            'error': f'默认文件 {DEFAULT_EXCEL} 不存在'
        })

@app.route('/api/upload', methods=['POST'])
def upload():
    """处理上传的Excel文件"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': '没有文件'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': '未选择文件'})

    if file and (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        # 保存到临时文件
        temp_path = 'temp_upload.xlsx'
        file.save(temp_path)
        result = get_excel_data(temp_path)
        os.remove(temp_path)
        return jsonify(result)
    else:
        return jsonify({'success': False, 'error': '请上传.xlsx或.xls文件'})

if __name__ == '__main__':
    print("启动服务器...")
    print(f"默认Excel文件: {DEFAULT_EXCEL}")
    print("请在浏览器中访问: http://localhost:5000")
    app.run(debug=True, port=5000)
