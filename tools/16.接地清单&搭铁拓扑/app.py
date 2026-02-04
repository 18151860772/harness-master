from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename
import pandas as pd
import os
import uuid
from datetime import datetime
import networkx as nx

app = Flask(__name__)

# 配置
UPLOAD_FOLDER = 'app/uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class GroundingProcessor:
    """接地清单处理器"""
    
    def __init__(self, wirelist_path, connlist_path, inline_path):
        self.wirelist_df = pd.read_excel(wirelist_path)
        self.connlist_df = pd.read_excel(connlist_path)
        self.inline_df = pd.read_excel(inline_path)
        
        # 获取列名（兼容不同的列名格式）
        self._standardize_columns()
        
        # 识别接地短号
        self.ground_short_codes = self._identify_ground_codes()
        
        # 识别inline列表
        self.inline_list = self._get_inline_list()
        
        # 定义分类
        self.weld_points = self._identify_weld_points()
        self.connectors = self._identify_connectors()
        
        # 构建连接图
        self.connection_graph = self._build_connection_graph()
        
        # 生成接地清单
        self.grounding_list = self._generate_grounding_list()
    
    def _standardize_columns(self):
        """标准化列名，去除空格"""
        for df in [self.wirelist_df, self.connlist_df, self.inline_df]:
            df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
    
    def _identify_ground_codes(self):
        """识别接地短号"""
        ground_codes = []
        
        for idx, row in self.connlist_df.iterrows():
            # 获取短号列
            short_code_col = None
            for col in self.connlist_df.columns:
                if '短号' in str(col) or 'Short Code' in str(col) or 'Code' in str(col):
                    short_code_col = col
                    break
            
            if short_code_col is None:
                continue
                
            short_code = str(row[short_code_col]).strip() if pd.notna(row[short_code_col]) else ""
            if not short_code:
                continue
            
            # 查找中文描述
            is_ground = False
            for col in self.connlist_df.columns:
                col_lower = str(col).lower()
                if any(keyword in col_lower for keyword in ['中文', '描述', 'description', 'desc']):
                    if pd.notna(row[col]):
                        desc = str(row[col])
                        if '接地' in desc or 'ground' in desc.lower() or 'gnd' in desc.lower():
                            is_ground = True
                            break
            
            # 查找英文描述
            if not is_ground:
                for col in self.connlist_df.columns:
                    col_lower = str(col).lower()
                    if any(keyword in col_lower for keyword in ['english', 'eng', '英文']):
                        if pd.notna(row[col]):
                            desc = str(row[col])
                            if 'ground' in desc.lower() or 'gnd' in desc.lower():
                                is_ground = True
                                break
            
            if is_ground:
                ground_codes.append(short_code)
        
        return list(set(ground_codes))
    
    def _get_inline_list(self):
        """获取inline插件列表"""
        inline_codes = []
        
        # 从inlinelist中读取
        for col in self.inline_df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['inline', '短号', 'code']):
                inline_codes.extend([str(x).strip() for x in self.inline_df[col].dropna() if x])
        
        return list(set(inline_codes))
    
    def _identify_weld_points(self):
        """识别焊点"""
        weld_points = []
        
        # 获取connlist中的所有短号
        connlist_codes = set()
        for col in self.connlist_df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['短号', 'code', 'short code']):
                connlist_codes.update([str(x).strip() for x in self.connlist_df[col].dropna() if x])
        
        # 查找wirelist中的焊点
        for idx, row in self.wirelist_df.iterrows():
            # 查找from pin和to pin列
            from_pin_col = to_pin_col = None
            for col in self.wirelist_df.columns:
                col_lower = str(col).lower()
                if 'from pin' in col_lower or 'frompin' in col_lower:
                    from_pin_col = col
                if 'to pin' in col_lower or 'topin' in col_lower:
                    to_pin_col = col
            
            if from_pin_col is None or to_pin_col is None:
                continue
            
            from_pin = str(row[from_pin_col]).strip() if pd.notna(row[from_pin_col]) else ""
            to_pin = str(row[to_pin_col]).strip() if pd.notna(row[to_pin_col]) else ""
            
            # 如果pin是X，对应的code不在connlist中，则为焊点
            if from_pin == 'X':
                for col in self.wirelist_df.columns:
                    col_lower = str(col).lower()
                    if 'from code' in col_lower or 'fromcode' in col_lower:
                        code = str(row[col]).strip() if pd.notna(row[col]) else ""
                        if code and code not in connlist_codes:
                            weld_points.append(code)
            
            if to_pin == 'X':
                for col in self.wirelist_df.columns:
                    col_lower = str(col).lower()
                    if 'to code' in col_lower or 'tocode' in col_lower:
                        code = str(row[col]).strip() if pd.notna(row[col]) else ""
                        if code and code not in connlist_codes:
                            weld_points.append(code)
        
        return list(set(weld_points))
    
    def _identify_connectors(self):
        """识别插件（除去接地和inline）"""
        all_codes = set()
        for col in self.connlist_df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['短号', 'code', 'short code']):
                all_codes.update([str(x).strip() for x in self.connlist_df[col].dropna() if x])
        
        ground_set = set(self.ground_short_codes)
        inline_set = set(self.inline_list)
        
        connectors = [code for code in all_codes if code and code not in ground_set and code not in inline_set]
        return connectors
    
    def _build_connection_graph(self):
        """构建连接图，使用networkx来追踪回路连接"""
        G = nx.Graph()
        
        # 获取列名映射
        from_code_col = to_code_col = from_pin_col = to_pin_col = None
        for col in self.wirelist_df.columns:
            col_lower = str(col).lower()
            if 'from code' in col_lower or 'fromcode' in col_lower:
                from_code_col = col
            elif 'to code' in col_lower or 'tocode' in col_lower:
                to_code_col = col
            elif 'from pin' in col_lower or 'frompin' in col_lower:
                from_pin_col = col
            elif 'to pin' in col_lower or 'topin' in col_lower:
                to_pin_col = col
        
        if not all([from_code_col, to_code_col, from_pin_col, to_pin_col]):
            return G
        
        # 遍历wirelist，添加连接关系
        for idx, row in self.wirelist_df.iterrows():
            from_code = str(row[from_code_col]).strip() if pd.notna(row[from_code_col]) else ""
            to_code = str(row[to_code_col]).strip() if pd.notna(row[to_code_col]) else ""
            from_pin = str(row[from_pin_col]).strip() if pd.notna(row[from_pin_col]) else ""
            to_pin = str(row[to_pin_col]).strip() if pd.notna(row[to_pin_col]) else ""
            
            if not from_code or not to_code:
                continue
            
            # 添加节点和边
            node1 = f"{from_code}:{from_pin}"
            node2 = f"{to_code}:{to_pin}"
            
            G.add_edge(node1, node2)
            
            # 添加不带pin的节点（用于焊点和inline连接）
            G.add_node(from_code)
            G.add_node(to_code)
            
            # 如果是焊点，连接焊点到具体节点
            if from_code in self.weld_points:
                G.add_edge(from_code, node1)
            if to_code in self.weld_points:
                G.add_edge(to_code, node2)
            
            # 如果是inline，连接inline两端
            if from_code in self.inline_list and to_code in self.inline_list:
                G.add_edge(from_code, to_code)
        
        return G
    
    def _get_connected_components(self, start_node):
        """获取与起始节点相连的所有节点"""
        if start_node not in self.connection_graph:
            return []
        
        connected = []
        # 找出所有连通的节点
        components = nx.connected_components(self.connection_graph)
        
        for component in components:
            if any(start_node in node for node in component):
                connected = list(component)
                break
        
        return connected

    def _determine_grounding_type(self, ground_code):
        """
        判断接地类型：单根回路 或 多根汇流
        逻辑：
        1. 找到该接地短号所在的连通分量。
        2. 检查该连通分量中有多少个接地短号。
        3. 如果只有1个接地短号，说明它是独立接地点 -> 单根回路。
        4. 如果有多个接地短号，说明它们汇流在一起 -> 多根汇流。
        """
        # 1. 找到该接地点所在的连通分量（所有连接在一起的节点）
        # 由于我们之前在_build_connection_graph中添加了不带pin的节点，
        # 我们可以直接搜索包含该ground_code的连通分量。
        
        # 从ground_code开始查找所有连通的节点
        connected_nodes = []
        for node in self.connection_graph.nodes():
            if ground_code in node: # 找到包含该短号的节点
                # 找到包含该节点的连通分量
                for component in nx.connected_components(self.connection_graph):
                    if node in component:
                        connected_nodes = list(component)
                        break
                if connected_nodes:
                    break
        
        if not connected_nodes:
            return "未知类型"
        
        # 2. 在这些连通节点中，统计包含多少个接地短号
        connected_ground_codes = []
        for node in connected_nodes:
            # 节点可能是 "Code:Pin" 或只是 "Code"
            check_code = node.split(':')[0] if ':' in node else node
            if check_code in self.ground_short_codes:
                connected_ground_codes.append(check_code)
        
        # 去重
        unique_ground_codes = list(set(connected_ground_codes))
        
        # 3. 判断逻辑
        if len(unique_ground_codes) == 1:
            # 只有一个接地点，这是典型的单根回路结构
            return "单根回路"
        elif len(unique_ground_codes) > 1:
            # 有多个接地点连在一起，这是多根汇流结构
            return "多根汇流"
        else:
            return "未知类型"
    
    def _get_wire_info(self, code, pin):
        """获取线径和option信息"""
        # 获取列名映射
        from_code_col = to_code_col = from_pin_col = to_pin_col = None
        wire_size_col = option_col = None
        
        for col in self.wirelist_df.columns:
            col_lower = str(col).lower()
            if 'from code' in col_lower or 'fromcode' in col_lower:
                from_code_col = col
            elif 'to code' in col_lower or 'tocode' in col_lower:
                to_code_col = col
            elif 'from pin' in col_lower or 'frompin' in col_lower:
                from_pin_col = col
            elif 'to pin' in col_lower or 'topin' in col_lower:
                to_pin_col = col
            elif 'wire' in col_lower and 'size' in col_lower:
                wire_size_col = col
            elif 'option' in col_lower:
                option_col = col
        
        if not all([from_code_col, to_code_col, from_pin_col, to_pin_col]):
            return '', ''
        
        # 查找匹配的线
        for idx, row in self.wirelist_df.iterrows():
            fc = str(row[from_code_col]).strip() if pd.notna(row[from_code_col]) else ""
            tc = str(row[to_code_col]).strip() if pd.notna(row[to_code_col]) else ""
            fp = str(row[from_pin_col]).strip() if pd.notna(row[from_pin_col]) else ""
            tp = str(row[to_pin_col]).strip() if pd.notna(row[to_pin_col]) else ""
            
            # 检查是否匹配
            match = False
            if fc == code and fp == pin:
                match = True
            elif tc == code and tp == pin:
                match = True
            
            if match:
                wire_size = str(row[wire_size_col]).strip() if wire_size_col and pd.notna(row[wire_size_col]) else ""
                option = str(row[option_col]).strip() if option_col and pd.notna(row[option_col]) else ""
                return wire_size, option
        
        return '', ''
    
    def _get_chinese_description(self, code):
        """获取中文描述"""
        for col in self.connlist_df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['短号', 'code', 'short code']):
                matching_rows = self.connlist_df[self.connlist_df[col].astype(str).str.strip() == code]
                for _, row in matching_rows.iterrows():
                    for desc_col in self.connlist_df.columns:
                        desc_col_lower = str(desc_col).lower()
                        if any(keyword in desc_col_lower for keyword in ['中文', '描述', 'description']):
                            desc = str(row[desc_col]).strip() if pd.notna(row[desc_col]) else ""
                            if desc and '接地' not in desc:
                                return desc
        return ''
    
    def _generate_grounding_list(self):
        """生成接地清单"""
        grounding_data = []
        
        for ground_code in self.ground_short_codes:
            # 获取与接地相连的所有节点
            connected_nodes = []
            for node in self.connection_graph.nodes():
                if ground_code in node:
                    connected_nodes = list(nx.node_connected_component(self.connection_graph, node))
                    break
            
            # 判断接地类型（单根回路 vs 多根汇流）
            grounding_type = self._determine_grounding_type(ground_code)
            
            # 提取非接地、非inline的插件及其pin
            connector_info = {}
            for node in connected_nodes:
                # 跳过接地节点和inline节点
                if ground_code in node or any(inline in node for inline in self.inline_list):
                    continue
                
                # 解析code和pin
                if ':' in node:
                    parts = node.split(':')
                    if len(parts) == 2:
                        code, pin = parts[0], parts[1]
                        
                        # 检查是否是插件
                        if code in self.connectors:
                            if code not in connector_info:
                                connector_info[code] = []
                            connector_info[code].append(pin)
            
            # 为每个连接的插件生成记录
            for code, pins in connector_info.items():
                chinese_desc = self._get_chinese_description(code)
                
                for pin in pins:
                    wire_size, option = self._get_wire_info(code, pin)
                    
                    grounding_data.append({
                        '接地短号': ground_code,
                        '插件短号': code,
                        '中文描述': chinese_desc,
                        '插件PIN': pin,
                        '线径': wire_size,
                        'Option': option,
                        '搭铁类型': grounding_type  # 新增字段
                    })
        
        return grounding_data


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        # 检查文件
        if 'wirelist' not in request.files or 'connlist' not in request.files or 'inline' not in request.files:
            return jsonify({'success': False, 'error': '请上传所有三个文件'}), 400
        
        wirelist_file = request.files['wirelist']
        connlist_file = request.files['connlist']
        inline_file = request.files['inline']
        
        if not all([wirelist_file.filename, connlist_file.filename, inline_file.filename]):
            return jsonify({'success': False, 'error': '所有文件都必须选择'}), 400
        
        if not all([allowed_file(wirelist_file.filename), allowed_file(connlist_file.filename), allowed_file(inline_file.filename)]):
            return jsonify({'success': False, 'error': '只支持.xlsx或.xls文件'}), 400
        
        # 生成会话ID
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # 保存文件
        wirelist_path = os.path.join(session_dir, 'wirelist.xlsx')
        connlist_path = os.path.join(session_dir, 'connlist.xlsx')
        inline_path = os.path.join(session_dir, 'inline.xlsx')
        
        wirelist_file.save(wirelist_path)
        connlist_file.save(connlist_path)
        inline_file.save(inline_path)
        
        # 处理数据
        processor = GroundingProcessor(wirelist_path, connlist_path, inline_path)
        
        # 保存结果Excel
        result_path = os.path.join(session_dir, 'grounding_list.xlsx')
        result_df = pd.DataFrame(processor.grounding_list)
        result_df.to_excel(result_path, index=False, engine='openpyxl')
        
        # 准备响应数据
        wirelist_preview = processor.wirelist_df.head(100).to_dict('records')
        
        # 统计信息
        statistics = {
            'total_B_color_wires': len(processor.wirelist_df),
            'processed_ground_wires': len(processor.grounding_list),
            'unique_ground_points': len(processor.ground_short_codes),
            'total_connected_connectors': len(set([x['插件短号'] for x in processor.grounding_list]))
        }
        
        # 拓扑汇总
        topology_summary = []
        for ground_code in processor.ground_short_codes:
            connected_connectors = list(set([x['插件短号'] for x in processor.grounding_list if x['接地短号'] == ground_code]))
            grounding_type = next((x['搭铁类型'] for x in processor.grounding_list if x['接地短号'] == ground_code), "未知")
            topology_summary.append({
                '接地端子编号': ground_code,
                '搭铁类型': grounding_type, # 新增
                '连接的插件数': len(connected_connectors),
                '连接的插件': connected_connectors
            })
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'data': {
                'wirelist_preview': wirelist_preview,
                'topology_summary': topology_summary,
                'topology_details': processor.grounding_list,
                'statistics': statistics
            }
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/download/<session_id>')
def download_result(session_id):
    try:
        result_path = os.path.join(app.config['UPLOAD_FOLDER'], session_id, 'grounding_list.xlsx')
        if os.path.exists(result_path):
            return send_file(result_path, as_attachment=True, download_name='接地清单.xlsx')
        else:
            return jsonify({'success': False, 'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)