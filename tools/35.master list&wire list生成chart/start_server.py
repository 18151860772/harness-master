# -*- coding: utf-8 -*-
"""
Wire Chart 服务器
同时启动HTTP服务器和浏览器，支持导出带格式Excel
"""

import http.server
import socketserver
import webbrowser
import threading
import os
import sys
import json
import cgi
import tempfile
from urllib.parse import urlparse, parse_qs
import subprocess

PORT = 8765
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class APIHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        """处理API请求"""
        path = urlparse(self.path).path

        if path == '/api/export':
            # 处理带文件上传的导出请求
            try:
                # 解析multipart表单数据
                content_type = self.headers.get('Content-Type', '')
                if 'multipart/form-data' in content_type:
                    form = cgi.FieldStorage(
                        fp=self.rfile,
                        headers=self.headers,
                        environ={'REQUEST_METHOD': 'POST',
                                'CONTENT_TYPE': content_type}
                    )

                    chartFile = form['chartFile'] if 'chartFile' in form else None
                    chartHeader = json.loads(form['chartHeader'].value) if 'chartHeader' in form else []
                    dataRows = json.loads(form['dataRows'].value) if 'dataRows' in form else []
                    partNumbers = json.loads(form['partNumbers'].value) if 'partNumbers' in form else []

                    # 调用导出脚本
                    cmd = [
                        sys.executable,
                        os.path.join(SCRIPT_DIR, 'export_with_format.py'),
                    ]

                    if chartFile.filename:
                        # 保存临时chart文件
                        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
                            tmp.write(chartFile.file.read())
                            chart_file_path = tmp.name
                        cmd.append(chart_file_path)
                    else:
                        cmd.append('')

                    cmd.append('Wire_Chart_更新.xlsx')

                    # 传递JSON数据通过临时文件
                    json_data = json.dumps({
                        'chartHeader': chartHeader,
                        'dataRows': dataRows,
                        'partNumbers': partNumbers
                    }, ensure_ascii=False)

                    with tempfile.NamedTemporaryFile(suffix='.json', mode='w', delete=False, encoding='utf-8') as tmp:
                        tmp.write(json_data)
                        json_path = tmp.name

                    cmd.append(json_path)

                    result = subprocess.run(cmd, capture_output=True=True, cwd=SCRIPT_DIR)

                    # 清理临时文件
                    if chartFile.filename:
                        os.unlink(chart_file_path)
                    os.unlink(json_path)

                    if result.returncode == 0 and os.path.exists(os.path.join(SCRIPT_DIR, 'Wire_Chart_更新.xlsx')):
                        # 发送文件
                        output_file = os.path.join(SCRIPT_DIR, 'Wire_Chart_更新.xlsx')
                        with open(output_file, 'rb') as f:
                            file_data = f.read()

                        self.send_response(200)
                        self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                        self.send_header('Content-Disposition', 'attachment; filename="Wire_Chart_更新.xlsx"')
                        self.send_header('Content-Length', len(file_data))
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(file_data)
                    else:
                        self.send_response(500)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': '导出失败'}).encode('utf-8'))

                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': '需要multipart/form-data'}).encode('utf-8'))

            except Exception as e:
                print(f"导出错误: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def start_server():
    """启动HTTP服务器"""
    os.chdir(SCRIPT_DIR)

    # 注册MIME类型
    http.server.SimpleHTTPRequestHandler.extensions_map.update({
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
    })

    with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
        print(f"=" * 50)
        print(f"Wire Chart 服务器已启动")
        print(f"V6版本: http://localhost:{PORT}/wire_chart_v6.html")
        print(f"=" * 50)
        httpd.serve_forever()

def main():
    # 获取HTML文件路径，优先使用V6版本
    html_file_v6 = os.path.join(SCRIPT_DIR, 'wire_chart_v6.html')
    html_file = html_file_v6 if os.path.exists(html_file_v6) else os.path.join(SCRIPT_DIR, 'wire_chart_v4.html')

    if not os.path.exists(html_file):
        print(f"错误: 找不到 HTML文件")
        return

    # 在新线程中启动服务器
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 等待服务器启动
    import time
    time.sleep(1)

    # 打开浏览器
    url = f"http://localhost:{PORT}/{os.path.basename(html_file)}"
    print(f"正在打开浏览器: {url}")
    webbrowser.open(url)

    print("\n提示: 按 Ctrl+C 停止服务器")
    print("-" * 50)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n服务器已停止")

if __name__ == "__main__":
    main()
