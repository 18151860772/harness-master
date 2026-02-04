// 全局变量
let wireData = null;
let connData = null;
let configData = null;
let inlineData = null;
let allIssues = [];
let circuitGroups = []; // 存储同一回路的分组
let wireWorkbook = null; // 保存原始workbook用于导出

// ==================== Option表达式解析器 ====================
// 运算符优先级: () > - > & > /

/**
 * Tokenize表达式 - 分割成token数组
 * 输入: "A&-B/C"
 * 输出: ["A", "&", "-", "B", "/", "C"]
 */
function tokenizeOptionExpression(expr) {
    if (!expr || typeof expr !== 'string') return [];

    expr = expr.trim().replace(/\s+/g, ''); // 去除空格
    const tokens = [];
    let current = '';

    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];

        if (char === '(' || char === ')' || char === '&' || char === '/' || char === '-') {
            if (current) {
                tokens.push(current);
                current = '';
            }
            tokens.push(char);
        } else {
            current += char;
        }
    }

    if (current) tokens.push(current);

    return tokens;
}

/**
 * 构建表达式树（使用递归下降解析）
 */
function parseOptionExpression(expr) {
    const tokens = tokenizeOptionExpression(expr);
    if (tokens.length === 0) return null;

    let pos = 0;

    // 解析表达式（处理 / 运算符，最低优先级）
    function parseExpression() {
        let left = parseAnd();

        while (pos < tokens.length && tokens[pos] === '/') {
            pos++; // 跳过 '/'
            const right = parseAnd();
            left = { type: 'OR', left, right };
        }

        return left;
    }

    // 解析与运算（处理 & 运算符）
    function parseAnd() {
        let left = parseNot();

        while (pos < tokens.length && tokens[pos] === '&') {
            pos++; // 跳过 '&'
            const right = parseNot();
            left = { type: 'AND', left, right };
        }

        return left;
    }

    // 解析非运算（处理 - 运算符）
    function parseNot() {
        if (pos < tokens.length && tokens[pos] === '-') {
            pos++; // 跳过 '-'
            const operand = parseNot(); // 支持连续的非，如 --A
            return { type: 'NOT', operand };
        }

        return parsePrimary();
    }

    // 解析基本单元（变量或括号表达式）
    function parsePrimary() {
        if (pos >= tokens.length) {
            throw new Error('表达式意外结束');
        }

        if (tokens[pos] === '(') {
            pos++; // 跳过 '('
            const expr = parseExpression();
            if (pos >= tokens.length || tokens[pos] !== ')') {
                throw new Error('缺少右括号');
            }
            pos++; // 跳过 ')'
            return expr;
        }

        const token = tokens[pos];
        pos++;
        return { type: 'VAR', value: token };
    }

    return parseExpression();
}

/**
 * 规范化表达式树（转换成标准形式）
 */
function normalizeExpressionTree(tree) {
    if (!tree) return null;

    switch (tree.type) {
        case 'VAR':
            return { type: 'VAR', value: tree.value };

        case 'NOT':
            return { type: 'NOT', operand: normalizeExpressionTree(tree.operand) };

        case 'AND': {
            const left = normalizeExpressionTree(tree.left);
            const right = normalizeExpressionTree(tree.right);

            // 收集所有AND操作数并排序
            const terms = [];
            function collectANDTerms(node) {
                if (node.type === 'AND') {
                    collectANDTerms(node.left);
                    collectANDTerms(node.right);
                } else {
                    terms.push(node);
                }
            }
            collectANDTerms({ type: 'AND', left, right });

            // 排序（VAR在前，NOT在后，同类型按值排序）
            terms.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'VAR' ? -1 : 1;
                if (a.type === 'VAR') return a.value.localeCompare(b.value);
                return a.operand.value.localeCompare(b.operand.value);
            });

            // 重新构建AND树
            let result = terms[0];
            for (let i = 1; i < terms.length; i++) {
                result = { type: 'AND', left: result, right: terms[i] };
            }

            return result;
        }

        case 'OR': {
            const left = normalizeExpressionTree(tree.left);
            const right = normalizeExpressionTree(tree.right);

            // 收集所有OR操作数并排序
            const terms = [];
            function collectORTerms(node) {
                if (node.type === 'OR') {
                    collectORTerms(node.left);
                    collectORTerms(node.right);
                } else {
                    terms.push(node);
                }
            }
            collectORTerms({ type: 'OR', left, right });

            // 排序
            terms.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'VAR' ? -1 : 1;
                if (a.type === 'VAR') return a.value.localeCompare(b.value);
                return a.operand.value.localeCompare(b.operand.value);
            });

            // 重新构建OR树
            let result = terms[0];
            for (let i = 1; i < terms.length; i++) {
                result = { type: 'OR', left: result, right: terms[i] };
            }

            return result;
        }

        default:
            throw new Error(`未知节点类型: ${tree.type}`);
    }
}

/**
 * 将表达式树转换为字符串（规范化后的字符串）
 */
function expressionTreeToString(tree, parentPrecedence = 0) {
    if (!tree) return '';

    switch (tree.type) {
        case 'VAR':
            return tree.value;

        case 'NOT': {
            const operandStr = expressionTreeToString(tree.operand, 3); // NOT优先级=3
            if (tree.operand.type === 'VAR') {
                return `-${operandStr}`;
            }
            return `-(${operandStr})`;
        }

        case 'AND': {
            const leftStr = expressionTreeToString(tree.left, 2); // AND优先级=2
            const rightStr = expressionTreeToString(tree.right, 2);
            const needParens = parentPrecedence > 2;
            const result = `${leftStr}&${rightStr}`;
            return needParens ? `(${result})` : result;
        }

        case 'OR': {
            const leftStr = expressionTreeToString(tree.left, 1); // OR优先级=1
            const rightStr = expressionTreeToString(tree.right, 1);
            const needParens = parentPrecedence > 1;
            const result = `${leftStr}/${rightStr}`;
            return needParens ? `(${result})` : result;
        }

        default:
            throw new Error(`未知节点类型: ${tree.type}`);
    }
}

/**
 * 规范化Option表达式（主函数）
 * 输入: "CY08&KP02&KQ03&KG04"
 * 输出: "CY08&KG04&KP02&KQ03" (按字母排序)
 *
 * 输入: "KQ03&KP02&KG04&CY08"
 * 输出: "CY08&KG04&KP02&KQ03" (相同结果)
 */
function normalizeOptionExpression(expr) {
    if (!expr || typeof expr !== 'string') return '';

    try {
        const tree = parseOptionExpression(expr);
        if (!tree) return expr;

        const normalized = normalizeExpressionTree(tree);
        return expressionTreeToString(normalized);
    } catch (e) {
        console.warn(`Option表达式解析失败: ${expr}`, e.message);
        return expr; // 解析失败则返回原值
    }
}

/**
 * 比较两个Option表达式是否等效
 */
function areOptionsEquivalent(opt1, opt2) {
    const norm1 = normalizeOptionExpression(opt1);
    const norm2 = normalizeOptionExpression(opt2);

    // 比较规范化的结果（不区分大小写）
    return norm1.toLowerCase() === norm2.toLowerCase();
}

// ==================== DOM元素 ====================
const fileInputs = document.querySelectorAll('input[type="file"]');
const checkBtn = document.getElementById('checkBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const issuesList = document.getElementById('issuesList');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setupFileInputs();
    setupButtons();
    setupTableControls();
});

// 设置文件输入
function setupFileInputs() {
    fileInputs.forEach(input => {
        const customInput = input.parentElement.querySelector('.custom-file-input');
        const fileNameSpan = input.parentElement.querySelector('.file-name');

        customInput.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileNameSpan.textContent = file.name;
                input.parentElement.classList.add('has-file');
                customInput.innerHTML = `<i class="fas fa-check"></i><span>${file.name}</span>`;
            } else {
                fileNameSpan.textContent = '未选择文件';
                input.parentElement.classList.remove('has-file');
                customInput.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><span>点击或拖拽文件到此处</span>`;
            }
            checkRequiredFiles();
        });

        // 拖拽支持
        customInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            customInput.style.borderColor = '#2563eb';
            customInput.style.background = '#eff6ff';
        });

        customInput.addEventListener('dragleave', () => {
            customInput.style.borderColor = '';
            customInput.style.background = '';
        });

        customInput.addEventListener('drop', (e) => {
            e.preventDefault();
            customInput.style.borderColor = '';
            customInput.style.background = '';

            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;

                fileNameSpan.textContent = file.name;
                input.parentElement.classList.add('has-file');
                customInput.innerHTML = `<i class="fas fa-check"></i><span>${file.name}</span>`;
                checkRequiredFiles();
            } else {
                alert('请上传 .xlsx 或 .xls 格式的文件');
            }
        });
    });
}

// 检查必需文件
function checkRequiredFiles() {
    const requiredInputs = document.querySelectorAll('.file-input-group.required input[type="file"]');
    let allSelected = true;

    requiredInputs.forEach(input => {
        if (!input.files.length) allSelected = false;
    });

    checkBtn.disabled = !allSelected;
}

// 设置按钮
function setupButtons() {
    checkBtn.addEventListener('click', performCheck);
    exportBtn.addEventListener('click', exportResults);
    resetBtn.addEventListener('click', resetForm);
}

// 设置表格控制
function setupTableControls() {
    document.getElementById('expandAllBtn').addEventListener('click', () => {
        document.querySelectorAll('.wirelist-table tr').forEach(row => {
            row.style.display = '';
        });
        updateDisplayCount();
    });

    document.getElementById('collapseAllBtn').addEventListener('click', filterTable);

    document.getElementById('showFamily').addEventListener('change', filterTable);
    document.getElementById('showSpliceColor').addEventListener('change', filterTable);
    document.getElementById('showSpliceFamily').addEventListener('change', filterTable);
    document.getElementById('showInline').addEventListener('change', filterTable);
    document.getElementById('showDuplicate').addEventListener('change', filterTable);
    document.getElementById('showMulticore').addEventListener('change', filterTable);
    document.getElementById('showOk').addEventListener('change', filterTable);
}

// 读取Excel文件 - 返回workbook和数据
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                console.log(`✓ 成功读取文件: ${file.name}`);
                console.log(`  - 行数: ${jsonData.length}`);
                if (jsonData.length > 0) {
                    console.log(`  - 列数: ${jsonData[0].length}`);
                }

                resolve({ workbook, data: jsonData, sheetName: firstSheetName });
            } catch (error) {
                console.error(`✗ 读取文件失败: ${file.name}`, error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('文件读取错误'));
        reader.readAsArrayBuffer(file);
    });
}

// 查找列名
function findColumn(data, possibleNames) {
    if (!data || data.length === 0) return null;

    const headers = data[0];
    const headerMap = {};

    headers.forEach((h, index) => {
        if (h) {
            headerMap[String(h).trim().toUpperCase()] = index;
        }
    });

    for (const name of possibleNames) {
        const nameUpper = name.trim().toUpperCase();
        if (nameUpper in headerMap) {
            console.log(`  ✓ 找到匹配列: "${name}" -> 列索引${headerMap[nameUpper]}`);
            return { index: headerMap[nameUpper], name: headers[headerMap[nameUpper]] };
        }
    }

    console.log(`  ✗ 未找到列: ${possibleNames.join(', ')}`);
    return null;
}

// 建立code-family映射
function buildCodeFamilyMap(connData) {
    console.log('\n=== 建立Code-Family映射 ===');
    const map = {};

    // 尝试多种可能的列名（支持中英文）
    const codeCol = findColumn(connData, [
        '短号', 'code', 'connector code', 'connector', '插件代码',
        'code no', 'connection', '插头代码', 'connector code', '连接器代码'
    ]);
    const familyCol = findColumn(connData, [
        'family', 'series', '系列', '族',
        'family code', 'family name', 'family', '回路系列', '插件系列'
    ]);

    console.log(`  Connlist列检查:`);
    if (codeCol) {
        console.log(`    ✓ Code列: "${codeCol.name}" (索引${codeCol.index})`);
    } else {
        console.log(`    ✗ 未找到Code列 (尝试: 短号, code, connector code, connector, 插件代码, code no, connection, 插头代码, 连接器代码)`);
    }

    if (familyCol) {
        console.log(`    ✓ Family列: "${familyCol.name}" (索引${familyCol.index})`);
    } else {
        console.log(`    ✗ 未找到Family列 (尝试: family, series, 系列, 族, family code, family name, 回路系列, 插件系列)`);
    }

    if (codeCol && familyCol) {
        let duplicateCount = 0;
        for (let i = 1; i < connData.length; i++) {
            const code = String(connData[i][codeCol.index] || '').trim();
            const family = String(connData[i][familyCol.index] || '').trim();
            if (code && family) {
                if (code in map) {
                    duplicateCount++;
                    console.log(`    ⚠️ Code重复: ${code} (已有family: ${map[code]}, 新family: ${family}) - 将使用新值`);
                }
                map[code] = family;
            }
        }
        console.log(`✓ 建立了 ${Object.keys(map).length} 个映射${duplicateCount > 0 ? ` (发现${duplicateCount}个重复code)` : ''}`);

        // 🔍 调试：检查DCC和BMS是否在map中
        if ('DCC' in map || 'BMS' in map) {
            console.log(`  🔍 关键Code检查:`);
            if ('DCC' in map) console.log(`    DCC -> ${map['DCC']}`);
            if ('BMS' in map) console.log(`    BMS -> ${map['BMS']}`);
        }
    } else {
        console.log('✗ 未找到必需的列，无法建立映射');
    }

    return map;
}

// 🔥 核心：建立同一回路的关系图
function buildCircuitGraph(wireData, inlineData) {
    console.log('\n=== 建立回路连接关系图 ===');

    const wireFromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode']);
    const wireToCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode']);

    // 查找inlinelist列
    const inlineCodeCol = findColumn(inlineData, ['code', 'inline code', 'connector code']);
    const inlineMatedCol = findColumn(inlineData, ['mated', 'mated code', '对插code']);

    if (!wireFromCodeCol || !wireToCodeCol) {
        console.log('✗ Wirelist缺少必需列');
        return [];
    }

    // 构建连接关系
    const connections = new Map();
    const codeToWireIndices = new Map();

    // 添加wire list中的直接连接
    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][wireFromCodeCol.index] || '').trim();
        const toCode = String(wireData[i][wireToCodeCol.index] || '').trim();

        if (fromCode && toCode) {
            if (!connections.has(fromCode)) connections.set(fromCode, new Set());
            if (!connections.has(toCode)) connections.set(toCode, new Set());

            connections.get(fromCode).add(toCode);
            connections.get(toCode).add(fromCode);

            if (!codeToWireIndices.has(fromCode)) codeToWireIndices.set(fromCode, []);
            if (!codeToWireIndices.has(toCode)) codeToWireIndices.set(toCode, []);

            codeToWireIndices.get(fromCode).push(i - 1);
            codeToWireIndices.get(toCode).push(i - 1);
        }
    }

    console.log(`  初始连接数: ${connections.size} 个连接器`);

    // 添加inlinelist中的连接
    if (inlineData && inlineCodeCol && inlineMatedCol) {
        for (let i = 1; i < inlineData.length; i++) {
            const inlineCode = String(inlineData[i][inlineCodeCol.index] || '').trim();
            const matedCode = String(inlineData[i][inlineMatedCol.index] || '').trim();

            if (inlineCode && matedCode) {
                if (!connections.has(inlineCode)) connections.set(inlineCode, new Set());
                if (!connections.has(matedCode)) connections.set(matedCode, new Set());

                connections.get(inlineCode).add(matedCode);
                connections.get(matedCode).add(inlineCode);
            }
        }

        console.log(`  添加inline连接后: ${connections.size} 个连接器`);
    }

    // 使用并查集找同一回路
    const parent = new Map();

    function find(x) {
        if (!parent.has(x)) {
            parent.set(x, x);
        }
        if (parent.get(x) !== x) {
            parent.set(x, find(parent.get(x)));
        }
        return parent.get(x);
    }

    function union(x, y) {
        const px = find(x);
        const py = find(y);
        if (px !== py) {
            parent.set(px, py);
        }
    }

    connections.forEach((connectedCodes, code) => {
        connectedCodes.forEach(connectedCode => {
            union(code, connectedCode);
        });
    });

    // 收集同一回路的连接器组
    const circuitMap = new Map();
    connections.forEach((_, code) => {
        const root = find(code);
        if (!circuitMap.has(root)) {
            circuitMap.set(root, new Set());
        }
        circuitMap.get(root).add(code);
    });

    // 为每个回路组收集wire索引
    const groups = [];
    let groupIndex = 0;

    circuitMap.forEach(codes => {
        const codeArray = Array.from(codes);
        const wireIndices = new Set();

        codeArray.forEach(code => {
            if (codeToWireIndices.has(code)) {
                codeToWireIndices.get(code).forEach(idx => wireIndices.add(idx));
            }
        });

        if (wireIndices.size > 0) {
            groups.push({
                id: groupIndex++,
                codes: codeArray,
                wireIndices: Array.from(wireIndices)
            });
        }
    });

    console.log(`✓ 发现 ${groups.length} 个独立回路`);
    groups.forEach((g, i) => {
        if (i < 5) { // 只显示前5个
            console.log(`  回路 ${i + 1}: ${g.codes.length} 个连接器, ${g.wireIndices.length} 条wire`);
        }
    });

    return groups;
}

// 检查1：Family一致性 - V3优化版本（支持焊点判断）
function checkFamilyConsistency(wireData, codeFamilyMap) {
    console.log('\n=== V3检查: Family一致性（支持焊点判断）===');
    console.log(`  codeFamilyMap中的code数量: ${Object.keys(codeFamilyMap).length}`);

    // 🔍 调试：显示Wire List的所有列名（前30列）
    console.log(`\n  🔍 Wire List实际列名 (前30列):`);
    if (wireData && wireData.length > 0) {
        for (let i = 0; i < Math.min(30, wireData[0].length); i++) {
            const colName = wireData[0][i];
            console.log(`    列${i}: "${colName}"`);
        }
    } else {
        console.log(`    ⚠️ Wire Data为空或格式错误`);
        return [];
    }

    const issues = [];
    const connlistCodes = new Set(Object.keys(codeFamilyMap));
    const wirelistCodes = new Set();

    const fromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode', 'fromcode', 'from code']);
    const toCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode', 'tocode', 'to code']);
    const fromPinCol = findColumn(wireData, ['from pin', 'frompin', 'from pin number', 'from cavity', 'from pin', '孔位', 'from cav', 'from pin ', 'frompin']);
    const toPinCol = findColumn(wireData, ['to pin', 'topin', 'to pin number', 'to cavity', 'to pin', '孔位', 'to cav', 'to pin ', 'topin']);
    const familyCol = findColumn(wireData, ['family', 'series', '系列', 'family', 'family ', 'ident tag', 'ident', 'tag', 'id tag']);

    console.log(`\n  Wire List列检查结果:`);
    if (fromCodeCol) console.log(`    ✓ From Code列: "${fromCodeCol.name}" (索引${fromCodeCol.index})`);
    else console.log(`    ✗ 未找到From Code列`);
    if (toCodeCol) console.log(`    ✓ To Code列: "${toCodeCol.name}" (索引${toCodeCol.index})`);
    else console.log(`    ✗ 未找到To Code列`);
    if (fromPinCol) console.log(`    ✓ From Pin列: "${fromPinCol.name}" (索引${fromPinCol.index})`);
    else console.log(`    ✗ 未找到From Pin列`);
    if (toPinCol) console.log(`    ✓ To Pin列: "${toPinCol.name}" (索引${toPinCol.index})`);
    else console.log(`    ✗ 未找到To Pin列`);
    if (familyCol) console.log(`    ✓ Family列: "${familyCol.name}" (索引${familyCol.index})`);
    else console.log(`    ✗ 未找到Family列`);

    if (!fromCodeCol || !toCodeCol || !familyCol) {
        console.log('✗ 缺少必需列，无法进行Family检查');
        return issues;
    }

    // 第一遍：收集所有焊点回路的family（两端都是焊点）
    // 用于后续验证焊点回路的family一致性
    const spliceFamilies = new Map(); // spliceCode -> Set of families

    let mismatchCount = 0;
    let emptyFamilyCount = 0;
    let checkedCount = 0;
    let skippedCount = 0;
    let spliceToSpliceCount = 0;
    let bs07Found = false;
    let dccFound = false;
    let bmsFound = false;

    console.log(`\n  🔍 开始遍历Wire List数据，共${wireData.length - 1}行数据`);

    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
        const toCode = String(wireData[i][toCodeCol.index] || '').trim();
        const fromPin = fromPinCol ? String(wireData[i][fromPinCol.index] || '').trim() : '';
        const toPin = toPinCol ? String(wireData[i][toPinCol.index] || '').trim() : '';
        const wireFamily = String(wireData[i][familyCol.index] || '').trim();

        // 收集Wire List中出现的所有code
        if (fromCode) wirelistCodes.add(fromCode);
        if (toCode) wirelistCodes.add(toCode);

        // 🔍 跟踪BS07/DCC/BMS
        if (fromCode === 'BS07' || toCode === 'BS07') bs07Found = true;
        if (fromCode === 'DCC' || toCode === 'DCC') dccFound = true;
        if (fromCode === 'BMS' || toCode === 'BMS') bmsFound = true;

        const excelRow = i + 1;

        // 跳过空行
        if (!fromCode && !toCode) {
            skippedCount++;
            continue;
        }

        checkedCount++;

        // 判断是否为焊点
        const fromIsSplice = fromPin === 'X' || fromPin === 'x';
        const toIsSplice = toPin === 'X' || toPin === 'x';

        // 🔍 调试：如果是特定回路，输出详细信息
        if (fromCode === 'BS07' || toCode === 'BS07' || fromCode === 'DCC' || toCode === 'DCC' || fromCode === 'BMS' || toCode === 'BMS') {
            console.log(`\n  🔍 调试行${excelRow}:`);
            console.log(`    From Code: "${fromCode}", From Pin: "${fromPin}", IsSplice: ${fromIsSplice}`);
            console.log(`    To Code: "${toCode}", To Pin: "${toPin}", IsSplice: ${toIsSplice}`);
            console.log(`    Wire List Family: "${wireFamily}"`);
            console.log(`    From Code在Connlist中: ${fromCode in codeFamilyMap}, Family: ${codeFamilyMap[fromCode] || '(不存在)'}`);
            console.log(`    To Code在Connlist中: ${toCode in codeFamilyMap}, Family: ${codeFamilyMap[toCode] || '(不存在)'}`);
        }

        // 如果两端都是焊点，记录这个family用于后续检查
        if (fromIsSplice && toIsSplice && wireFamily) {
            if (!spliceFamilies.has(fromCode)) {
                spliceFamilies.set(fromCode, new Set());
            }
            spliceFamilies.get(fromCode).add(wireFamily);

            if (!spliceFamilies.has(toCode)) {
                spliceFamilies.set(toCode, new Set());
            }
            spliceFamilies.get(toCode).add(wireFamily);
        }

        // 标记这一行是否有family问题
        let hasFamilyIssue = false;
        const issueDetails = [];

        // 检查From Code的Family一致性（只有在Connlist中且不是焊点时才检查）
        if (fromCode && !fromIsSplice && fromCode in codeFamilyMap) {
            const expected = codeFamilyMap[fromCode];
            if (wireFamily === '') {
                hasFamilyIssue = true;
                emptyFamilyCount++;
                issueDetails.push({
                    code: fromCode,
                    codeType: 'from',
                    expected: expected,
                    actual: '(空)',
                    issueType: 'empty'
                });
                console.log(`  ✗ 行${excelRow}: From Code ${fromCode} - Family列为空 (应为: ${expected})`);
            } else if (expected !== wireFamily) {
                hasFamilyIssue = true;
                mismatchCount++;
                issueDetails.push({
                    code: fromCode,
                    codeType: 'from',
                    expected: expected,
                    actual: wireFamily,
                    issueType: 'mismatch'
                });
                console.log(`  ✗ 行${excelRow}: From Code ${fromCode} - Family不一致 (期望: ${expected}, 实际: ${wireFamily})`);
            }
        }

        // 检查To Code的Family一致性（只有在Connlist中且不是焊点时才检查）
        if (toCode && !toIsSplice && toCode in codeFamilyMap) {
            const expected = codeFamilyMap[toCode];
            if (wireFamily === '') {
                hasFamilyIssue = true;
                emptyFamilyCount++;
                issueDetails.push({
                    code: toCode,
                    codeType: 'to',
                    expected: expected,
                    actual: '(空)',
                    issueType: 'empty'
                });
                console.log(`  ✗ 行${excelRow}: To Code ${toCode} - Family列为空 (应为: ${expected})`);
            } else if (expected !== wireFamily) {
                hasFamilyIssue = true;
                mismatchCount++;
                issueDetails.push({
                    code: toCode,
                    codeType: 'to',
                    expected: expected,
                    actual: wireFamily,
                    issueType: 'mismatch'
                });
                console.log(`  ✗ 行${excelRow}: To Code ${toCode} - Family不一致 (期望: ${expected}, 实际: ${wireFamily})`);
            }
        }

        // 🔍 调试：输出issue添加状态
        if (fromCode === 'DCC' || fromCode === 'BMS' || toCode === 'DCC' || toCode === 'BMS') {
            console.log(`  🔍 Issue检查结果: hasFamilyIssue=${hasFamilyIssue}, issueDetails.length=${issueDetails.length}`);
            if (issueDetails.length > 0) {
                console.log(`    issueDetails: ${JSON.stringify(issueDetails)}`);
            }
        }

        // 检查两端都是焊点的情况
        if (fromIsSplice && toIsSplice) {
            spliceToSpliceCount++;
            // 检查这个family是否与其他相同焊点的family一致
            const fromFamilies = spliceFamilies.get(fromCode) || new Set();
            const toFamilies = spliceFamilies.get(toCode) || new Set();

            // 合并两个焊点的所有family
            const allFamilies = new Set([...fromFamilies, ...toFamilies]);

            // 如果同一个焊点有多个不同的family，报错
            if (allFamilies.size > 1) {
                hasFamilyIssue = true;
                mismatchCount++;
                issueDetails.push({
                    code: `${fromCode}↔${toCode}`,
                    codeType: 'splice-splice',
                    expected: [...allFamilies].join(' 或 '),
                    actual: wireFamily,
                    issueType: 'mismatch'
                });
                console.log(`  ✗ 行${excelRow}: 焊点${fromCode}↔${toCode} - Family不一致，该焊点回路有多个family: ${[...allFamilies].join(', ')}`);
            }
        }

        // 如果有问题，标记Family列为红色
        if (hasFamilyIssue) {
            const emptyIssues = issueDetails.filter(d => d.issueType === 'empty');
            const mismatchIssues = issueDetails.filter(d => d.issueType === 'mismatch');

            if (emptyIssues.length > 0) {
                const issue = {
                    row: excelRow,
                    rowIndex: i,
                    colIndex: familyCol.index,
                    type: 'family_empty',
                    severity: 'error',
                    details: emptyIssues,
                    message: `Family列为空，应为: ${[...new Set(emptyIssues.map(d => d.expected))].join(' 或 ')}`
                };
                issues.push(issue);
                // 🔍 调试：确认issue被添加
                if (fromCode === 'DCC' || fromCode === 'BMS' || toCode === 'DCC' || toCode === 'BMS') {
                    console.log(`  🔍 Issue已添加到数组: type=${issue.type}, row=${issue.row}, rowIndex=${issue.rowIndex}`);
                }
            } else if (mismatchIssues.length > 0) {
                const issue = {
                    row: excelRow,
                    rowIndex: i,
                    colIndex: familyCol.index,
                    type: 'family_mismatch',
                    severity: 'error',
                    details: mismatchIssues,
                    message: `Family不一致: ${[...new Set(mismatchIssues.map(d => `${d.code}=${d.expected}`))].join(', ')} vs Wire List=${wireFamily}`
                };
                issues.push(issue);
                // 🔍 调试：确认issue被添加
                if (fromCode === 'DCC' || fromCode === 'BMS' || toCode === 'DCC' || toCode === 'BMS') {
                    console.log(`  🔍 Issue已添加到数组: type=${issue.type}, row=${issue.row}, rowIndex=${issue.rowIndex}, colIndex=${issue.colIndex}`);
                }
            }
        }
    }

    // V3新增：反向检查 - Connlist中有但Wire List中没有的code（仅记录，不标记错误）
    const codesOnlyInConnlist = [...connlistCodes].filter(code => !wirelistCodes.has(code));
    if (codesOnlyInConnlist.length > 0) {
        console.log(`  ℹ️ Connlist中有${codesOnlyInConnlist.length}个code未在Wire List中使用: ${codesOnlyInConnlist.slice(0, 5).join(', ')}${codesOnlyInConnlist.length > 5 ? '...' : ''}`);
    }

    console.log(`\n  ✓ 检查统计:`);
    console.log(`    - 总行数: ${wireData.length - 1} (不含表头)`);
    console.log(`    - 检查的行数: ${checkedCount}`);
    console.log(`    - 跳过的空行: ${skippedCount}`);
    console.log(`    - 两端都是焊点的行: ${spliceToSpliceCount}`);
    console.log(`    - Family不一致: ${mismatchCount}个`);
    console.log(`    - Family列为空但应有值: ${emptyFamilyCount}个`);
    console.log(`    - Connlist中未使用的code: ${codesOnlyInConnlist.length}个`);
    console.log(`  ✓ 总计发现 ${issues.length} 个Family相关问题`);

    // 🔍 调试：显示BS07/DCC/BMS是否被找到
    console.log(`\n  🔍 关键Code查找结果:`);
    console.log(`    - BS07: ${bs07Found ? '✓ 在Wire List中找到' : '✗ 未在Wire List中找到'}`);
    console.log(`    - DCC: ${dccFound ? '✓ 在Wire List中找到' : '✗ 未在Wire List中找到'}`);
    console.log(`    - BMS: ${bmsFound ? '✓ 在Wire List中找到' : '✗ 未在Wire List中找到'}`);

    // 🔍 如果BS07/DCC/BMS在Wire List中，显示它们在哪些行
    if (bs07Found || dccFound || bmsFound) {
        console.log(`\n  🔍 关键Code的详细信息:`);
        for (let i = 1; i < Math.min(100, wireData.length); i++) {
            const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
            const toCode = String(wireData[i][toCodeCol.index] || '').trim();
            const wireFamily = String(wireData[i][familyCol.index] || '').trim();

            if (fromCode === 'BS07' || toCode === 'BS07' || fromCode === 'DCC' || toCode === 'DCC' || fromCode === 'BMS' || toCode === 'BMS') {
                const fromPin = fromPinCol ? String(wireData[i][fromPinCol.index] || '').trim() : '(无列)';
                const toPin = toPinCol ? String(wireData[i][toPinCol.index] || '').trim() : '(无列)';
                console.log(`    行${i + 1}: From=${fromCode}/${fromPin}, To=${toCode}/${toPin}, Family="${wireFamily}"`);
            }
        }
    }

    // 🔍 调试：检查issues数组中是否有DCC/BMS相关的问题
    const dccBmsIssues = issues.filter(i =>
        i.details && i.details.some(d => d.code === 'DCC' || d.code === 'BMS')
    );
    if (dccBmsIssues.length > 0) {
        console.log(`  🔍 找到${dccBmsIssues.length}个DCC/BMS相关的Family问题:`);
        dccBmsIssues.forEach(issue => {
            console.log(`    行${issue.row}: ${issue.message}`);
        });
    } else {
        console.log(`  ⚠️ 未找到DCC/BMS相关的Family问题`);
    }

    return issues;
}

// 检查2：同一回路的Color/Size/Gauge一致性
// V2: 检查Inline两侧同一PIN对应导线的Color/Size一致性
function checkInlineConsistency(wireData, inlineData) {
    console.log('\n=== V2检查: Inline两侧同一PIN导线线色线径一致性 ===');
    const issues = [];

    const colorCol = findColumn(wireData, ['color', 'colour', '颜色']);
    const sizeCol = findColumn(wireData, ['size', 'wiresize', 'wire size', '线径', 'size / gauge']);
    const gaugeCol = findColumn(wireData, ['gauge', 'awg', '线规']);
    const fromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode']);
    const fromPinCol = findColumn(wireData, ['from pin', 'frompin', 'from pin number', 'from cavity']);
    const toCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode']);
    const toPinCol = findColumn(wireData, ['to pin', 'topin', 'to pin number', 'to cavity']);

    if (!inlineData || inlineData.length < 2) {
        console.log('✗ Inlinelist为空或格式错误，跳过检查');
        return issues;
    }

    if (!fromCodeCol || !toCodeCol || !fromPinCol || !toPinCol) {
        console.log('✗ Wire List中未找到必需的列（from code, to code, from pin, to pin）');
        return issues;
    }

    // 读取Inlinelist - 支持多种格式
    const inlineLeftCol = findColumn(inlineData, ['inline-left', 'inline left', 'code', 'inline code', 'inline']);
    const inlineRightCol = findColumn(inlineData, ['inline-right', 'inline right', 'mated code', 'mated', 'mate code']);
    const inlineFromPinCol = findColumn(inlineData, ['from pin', 'frompin', 'from pin number']);
    const inlineToPinCol = findColumn(inlineData, ['to pin', 'topin', 'to pin number']);

    if (!inlineLeftCol || !inlineRightCol) {
        console.log('✗ Inlinelist中未找到必需的列（需要 INLINE-LEFT 和 INLINE-RIGHT 列）');
        return issues;
    }

    // 判断是否有脚位对应关系
    const hasPinMapping = inlineFromPinCol && inlineToPinCol;

    console.log(`  Inlinelist格式: ${hasPinMapping ? '有Pin对应关系' : '无Pin对应关系（将假设同号脚位对应）'}`);

    // 建立inline连接对
    const inlinePairs = [];
    for (let i = 1; i < inlineData.length; i++) {
        const leftCode = String(inlineData[i][inlineLeftCol.index] || '').trim();
        const rightCode = String(inlineData[i][inlineRightCol.index] || '').trim();

        if (leftCode && rightCode) {
            if (hasPinMapping) {
                // 有Pin对应关系
                const fromPin = String(inlineData[i][inlineFromPinCol.index] || '').trim();
                const toPin = String(inlineData[i][inlineToPinCol.index] || '').trim();
                if (fromPin && toPin) {
                    inlinePairs.push({
                        leftCode,
                        rightCode,
                        fromPin,
                        toPin,
                        rowIndex: i
                    });
                }
            } else {
                // 无Pin对应关系 - 添加标记，后续按同名脚位检查
                inlinePairs.push({
                    leftCode,
                    rightCode,
                    hasPinMapping: false,
                    rowIndex: i
                });
            }
        }
    }

    console.log(`  找到 ${inlinePairs.length} 个inline连接对`);

    // 建立code到导线的映射（不区分from/to，只要是这个code的导线都包括）
    // Map结构: code -> [{rowIndex, data, isFrom, pin}]
    const codeToWires = new Map();

    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
        const fromPin = fromPinCol ? String(wireData[i][fromPinCol.index] || '').trim() : '';
        const toCode = String(wireData[i][toCodeCol.index] || '').trim();
        const toPin = toPinCol ? String(wireData[i][toPinCol.index] || '').trim() : '';

        // From侧导线
        if (fromCode) {
            if (!codeToWires.has(fromCode)) {
                codeToWires.set(fromCode, []);
            }
            codeToWires.get(fromCode).push({
                rowIndex: i,
                data: wireData[i],
                isFrom: true,
                pin: fromPin,
                code: fromCode
            });
        }

        // To侧导线
        if (toCode) {
            if (!codeToWires.has(toCode)) {
                codeToWires.set(toCode, []);
            }
            codeToWires.get(toCode).push({
                rowIndex: i,
                data: wireData[i],
                isFrom: false,
                pin: toPin,
                code: toCode
            });
        }
    }

    console.log(`  建立了 ${codeToWires.size} 个code的导线映射`);

    // 检查每个inline连接对
    let checkedCount = 0;
    inlinePairs.forEach((pair, pairIdx) => {
        // 获取这两个inline的所有导线
        const leftWires = codeToWires.get(pair.leftCode) || [];
        const rightWires = codeToWires.get(pair.rightCode) || [];

        if (leftWires.length === 0 && rightWires.length === 0) {
            return; // 两侧都没有导线，跳过
        }

        // 🐛 调试：显示这组inline的信息
        if (pair.leftCode.includes('RBBD') || pair.rightCode.includes('RBBD') ||
            pair.leftCode.includes('BDRB') || pair.rightCode.includes('BDRB')) {
            console.log(`\n🔍 调试Inline对: ${pair.leftCode} ↔ ${pair.rightCode}`);
            console.log(`  ${pair.leftCode}的所有导线 (${leftWires.length}根):`);
            leftWires.forEach(w => {
                const fromCode = w.data[fromCodeCol.index];
                const toCode = w.data[toCodeCol.index];
                const fromPin = w.data[fromPinCol.index];
                const toPin = w.data[toPinCol.index];
                const color = colorCol ? w.data[colorCol.index] : 'N/A';
                console.log(`    行${w.rowIndex + 2}: ${fromCode}/${fromPin} → ${toCode}/${toPin}, Color=${color}`);
            });
            console.log(`  ${pair.rightCode}的所有导线 (${rightWires.length}根):`);
            rightWires.forEach(w => {
                const fromCode = w.data[fromCodeCol.index];
                const toCode = w.data[toCodeCol.index];
                const fromPin = w.data[fromPinCol.index];
                const toPin = w.data[toPinCol.index];
                const color = colorCol ? w.data[colorCol.index] : 'N/A';
                console.log(`    行${w.rowIndex + 2}: ${fromCode}/${fromPin} → ${toCode}/${toPin}, Color=${color}`);
            });
        }

        if (pair.hasPinMapping === false) {
            // ==================== 无Pin对应关系：假设同号脚位对应 ====================
            // 收集所有脚位
            const leftPins = new Set();
            const rightPins = new Set();

            leftWires.forEach(w => {
                if (w.pin) leftPins.add(w.pin);
            });
            rightWires.forEach(w => {
                if (w.pin) rightPins.add(w.pin);
            });

            // 找出两侧共同的脚位
            const commonPins = [...leftPins].filter(pin => rightPins.has(pin));

            if (pair.leftCode.includes('RBBD') || pair.rightCode.includes('RBBD') ||
                pair.leftCode.includes('BDRB') || pair.rightCode.includes('BDRB')) {
                console.log(`  共同脚位: ${commonPins.join(', ') || '无'}`);
            }

            // 对每个共同脚位进行检查
            commonPins.forEach(pin => {
                const leftPinWires = leftWires.filter(w => w.pin === pin);
                const rightPinWires = rightWires.filter(w => w.pin === pin);

                if (leftPinWires.length === 0 && rightPinWires.length === 0) {
                    return;
                }

                checkedCount++;

                // 检查Color
                if (colorCol) {
                    const leftColors = new Set();
                    const rightColors = new Set();

                    leftPinWires.forEach(wire => {
                        const color = String(wire.data[colorCol.index] || '').trim();
                        if (color) leftColors.add(color);
                    });

                    rightPinWires.forEach(wire => {
                        const color = String(wire.data[colorCol.index] || '').trim();
                        if (color) rightColors.add(color);
                    });

                    const colors1 = Array.from(leftColors);
                    const colors2 = Array.from(rightColors);

                    if (leftColors.size > 0 && rightColors.size > 0) {
                        const allColors = [...new Set([...colors1, ...colors2])];
                        if (allColors.length > 1) {
                            console.log(`  Inline脚位: ${pair.leftCode}[${pin}] ↔ ${pair.rightCode}[${pin}]`);
                            console.log(`    ${pair.leftCode}[${pin}]侧 (${leftPinWires.length}根): ${colors1.join(', ')}`);
                            console.log(`    ${pair.rightCode}[${pin}]侧 (${rightPinWires.length}根): ${colors2.join(', ')}`);
                            console.log(`    → Color不一致: ${allColors.join(', ')}`);

                            [...leftPinWires, ...rightPinWires].forEach(wire => {
                                issues.push({
                                    row: wire.rowIndex + 2,
                                    rowIndex: wire.rowIndex,
                                    colIndex: colorCol.index,
                                    type: 'color_inconsistent',
                                    severity: 'warning',
                                    inlinePair: `${pair.leftCode}[${pin}]↔${pair.rightCode}[${pin}]`,
                                    colors: allColors.join(', ')
                                });
                            });
                        }
                    }
                }

                // 检查Size
                const sizeColToCheck = sizeCol || gaugeCol;
                if (sizeColToCheck) {
                    const leftSizes = new Set();
                    const rightSizes = new Set();

                    leftPinWires.forEach(wire => {
                        const size = String(wire.data[sizeColToCheck.index] || '').trim();
                        if (size) leftSizes.add(size);
                    });

                    rightPinWires.forEach(wire => {
                        const size = String(wire.data[sizeColToCheck.index] || '').trim();
                        if (size) rightSizes.add(size);
                    });

                    const sizes1 = Array.from(leftSizes);
                    const sizes2 = Array.from(rightSizes);

                    if (leftSizes.size > 0 && rightSizes.size > 0) {
                        const allSizes = [...new Set([...sizes1, ...sizes2])];
                        if (allSizes.length > 1) {
                            console.log(`  Inline脚位: ${pair.leftCode}[${pin}] ↔ ${pair.rightCode}[${pin}]`);
                            console.log(`    ${pair.leftCode}[${pin}]侧 (${leftPinWires.length}根): ${sizes1.join(', ')}`);
                            console.log(`    ${pair.rightCode}[${pin}]侧 (${rightPinWires.length}根): ${sizes2.join(', ')}`);
                            console.log(`    → Size不一致: ${allSizes.join(', ')}`);

                            [...leftPinWires, ...rightPinWires].forEach(wire => {
                                issues.push({
                                    row: wire.rowIndex + 2,
                                    rowIndex: wire.rowIndex,
                                    colIndex: sizeColToCheck.index,
                                    type: 'size_inconsistent',
                                    severity: 'warning',
                                    inlinePair: `${pair.leftCode}[${pin}]↔${pair.rightCode}[${pin}]`,
                                    sizes: allSizes.join(', ')
                                });
                            });
                        }
                    }
                }
            });
        } else {
            // ==================== 有Pin对应关系：按定义的对应关系检查 ====================
            // 从leftCode的所有导线中，找出连接到pair.fromPin的导线
            // 从rightCode的所有导线中，找出连接到pair.toPin的导线
            const leftPinWires = leftWires.filter(w => w.pin === pair.fromPin);
            const rightPinWires = rightWires.filter(w => w.pin === pair.toPin);

            if (leftPinWires.length === 0 && rightPinWires.length === 0) {
                return;
            }

            checkedCount++;

            // 检查Color一致性
            if (colorCol) {
                const leftColors = new Set();
                const rightColors = new Set();

                leftPinWires.forEach(wire => {
                    const color = String(wire.data[colorCol.index] || '').trim();
                    if (color) leftColors.add(color);
                });

                rightPinWires.forEach(wire => {
                    const color = String(wire.data[colorCol.index] || '').trim();
                    if (color) rightColors.add(color);
                });

                const colors1 = Array.from(leftColors);
                const colors2 = Array.from(rightColors);

                if (leftColors.size > 0 && rightColors.size > 0) {
                    const allColors = [...new Set([...colors1, ...colors2])];
                    if (allColors.length > 1) {
                        console.log(`  Inline脚位对 ${pairIdx + 1}: ${pair.leftCode}[${pair.fromPin}] ↔ ${pair.rightCode}[${pair.toPin}]`);
                        console.log(`    ${pair.leftCode}[${pair.fromPin}]侧 (${leftPinWires.length}根): ${colors1.join(', ')}`);
                        console.log(`    ${pair.rightCode}[${pair.toPin}]侧 (${rightPinWires.length}根): ${colors2.join(', ')}`);
                        console.log(`    → Color不一致: ${allColors.join(', ')}`);

                        [...leftPinWires, ...rightPinWires].forEach(wire => {
                            issues.push({
                                row: wire.rowIndex + 2,
                                rowIndex: wire.rowIndex,
                                colIndex: colorCol.index,
                                type: 'color_inconsistent',
                                severity: 'warning',
                                inlinePair: `${pair.leftCode}[${pair.fromPin}]↔${pair.rightCode}[${pair.toPin}]`,
                                colors: allColors.join(', ')
                            });
                        });
                    }
                }
            }

            // 检查Size/Gauge一致性
            const sizeColToCheck = sizeCol || gaugeCol;
            if (sizeColToCheck) {
                const leftSizes = new Set();
                const rightSizes = new Set();

                leftPinWires.forEach(wire => {
                    const size = String(wire.data[sizeColToCheck.index] || '').trim();
                    if (size) leftSizes.add(size);
                });

                rightPinWires.forEach(wire => {
                    const size = String(wire.data[sizeColToCheck.index] || '').trim();
                    if (size) rightSizes.add(size);
                });

                const sizes1 = Array.from(leftSizes);
                const sizes2 = Array.from(rightSizes);

                if (leftSizes.size > 0 && rightSizes.size > 0) {
                    const allSizes = [...new Set([...sizes1, ...sizes2])];
                    if (allSizes.length > 1) {
                        console.log(`  Inline脚位对 ${pairIdx + 1}: ${pair.leftCode}[${pair.fromPin}] ↔ ${pair.rightCode}[${pair.toPin}]`);
                        console.log(`    ${pair.leftCode}[${pair.fromPin}]侧 (${leftPinWires.length}根): ${sizes1.join(', ')}`);
                        console.log(`    ${pair.rightCode}[${pair.toPin}]侧 (${rightPinWires.length}根): ${sizes2.join(', ')}`);
                        console.log(`    → Size不一致: ${allSizes.join(', ')}`);

                        [...leftPinWires, ...rightPinWires].forEach(wire => {
                            issues.push({
                                row: wire.rowIndex + 2,
                                rowIndex: wire.rowIndex,
                                colIndex: sizeColToCheck.index,
                                type: 'size_inconsistent',
                                severity: 'warning',
                                inlinePair: `${pair.leftCode}[${pair.fromPin}]↔${pair.rightCode}[${pair.toPin}]`,
                                sizes: allSizes.join(', ')
                            });
                        });
                    }
                }
            }
        }
    });

    console.log(`✓ 检查了 ${checkedCount} 个inline脚位对应关系`);
    console.log(`✓ 发现 ${issues.length} 个inline两侧Color/Size不一致问题`);
    return issues;
}

// 检查3：重孔检查 - V5完整版（Option表达式规范化）
function checkDuplicatePins(wireData, configData) {
    console.log('\n=== V5检查: 智能重孔检查（Option表达式规范化）===');
    const issues = [];

    const fromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode', 'fromcode', 'from code']);
    const fromPinCol = findColumn(wireData, ['from pin', 'frompin', 'from pin number', 'from cavity', 'from pin', '孔位', 'from cav', 'from pin ', 'frompin']);
    const toCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode', 'tocode', 'to code']);
    const toPinCol = findColumn(wireData, ['to pin', 'topin', 'to pin number', 'to cavity', 'to pin', '孔位', 'to cav', 'to pin ', 'topin']);
    const optionCol = findColumn(wireData, ['option', 'options', '配置选项']);

    if (!fromCodeCol || !fromPinCol || !toCodeCol || !toPinCol || !optionCol) {
        console.log('✗ 未找到所有必需的列，跳过重孔检查');
        return issues;
    }

    console.log(`  ✓ 找到所有必需列，开始智能重孔检查（Option表达式规范化）`);

    // 收集所有 (code, pin, option) 组合
    const fromEntries = []; // { rowIndex, code, pin, option, normalizedOption }
    const toEntries = [];

    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
        const fromPin = String(wireData[i][fromPinCol.index] || '').trim();
        const toCode = String(wireData[i][toCodeCol.index] || '').trim();
        const toPin = String(wireData[i][toPinCol.index] || '').trim();
        const option = String(wireData[i][optionCol.index] || '').trim();

        // 跳过焊点（Pin = X 或 x），只检查插件
        if (fromPin !== 'X' && fromPin !== 'x' && fromCode && fromPin) {
            const normalizedOption = normalizeOptionExpression(option);
            fromEntries.push({
                rowIndex: i,
                code: fromCode,
                pin: fromPin,
                option: option,
                normalizedOption: normalizedOption
            });
        }

        if (toPin !== 'X' && toPin !== 'x' && toCode && toPin) {
            const normalizedOption = normalizeOptionExpression(option);
            toEntries.push({
                rowIndex: i,
                code: toCode,
                pin: toPin,
                option: option,
                normalizedOption: normalizedOption
            });
        }
    }

    console.log(`  ✓ From端收集了 ${fromEntries.length} 个条目`);
    console.log(`  ✓ To端收集了 ${toEntries.length} 个条目`);

    // 检查From端重孔：code + pin 相同，且 normalizedOption 也相同
    const processedFromGroups = new Map(); // key: "code|pin|normalizedOption" -> entries

    fromEntries.forEach(entry => {
        const key = `${entry.code}|${entry.pin}|${entry.normalizedOption}`;
        if (!processedFromGroups.has(key)) {
            processedFromGroups.set(key, []);
        }
        processedFromGroups.get(key).push(entry);
    });

    processedFromGroups.forEach((entries, key) => {
        if (entries.length > 1) {
            const [code, pin, normOpt] = key.split('|');
            const originalOptions = [...new Set(entries.map(e => e.option))];

            console.log(`  ✗ From端发现重孔: ${code}/${pin}`);
            console.log(`     规范化Option: ${normOpt || '(空)'}`);
            console.log(`     原始Option: ${originalOptions.join(', ')}`);
            console.log(`     出现次数: ${entries.length}次`);

            entries.forEach(e => {
                issues.push({
                    row: e.rowIndex + 1,
                    rowIndex: e.rowIndex,
                    colIndexes: [fromCodeCol.index, fromPinCol.index, optionCol.index],
                    type: 'duplicate_pin',
                    severity: 'info',
                    side: 'from',
                    code: e.code,
                    pin: e.pin,
                    option: e.option,
                    normalizedOption: e.normalizedOption
                });
            });
        }
    });

    // 检查To端重孔：code + pin 相同，且 normalizedOption 也相同
    const processedToGroups = new Map(); // key: "code|pin|normalizedOption" -> entries

    toEntries.forEach(entry => {
        const key = `${entry.code}|${entry.pin}|${entry.normalizedOption}`;
        if (!processedToGroups.has(key)) {
            processedToGroups.set(key, []);
        }
        processedToGroups.get(key).push(entry);
    });

    processedToGroups.forEach((entries, key) => {
        if (entries.length > 1) {
            const [code, pin, normOpt] = key.split('|');
            const originalOptions = [...new Set(entries.map(e => e.option))];

            console.log(`  ✗ To端发现重孔: ${code}/${pin}`);
            console.log(`     规范化Option: ${normOpt || '(空)'}`);
            console.log(`     原始Option: ${originalOptions.join(', ')}`);
            console.log(`     出现次数: ${entries.length}次`);

            entries.forEach(e => {
                issues.push({
                    row: e.rowIndex + 1,
                    rowIndex: e.rowIndex,
                    colIndexes: [toCodeCol.index, toPinCol.index, optionCol.index],
                    type: 'duplicate_pin',
                    severity: 'info',
                    side: 'to',
                    code: e.code,
                    pin: e.pin,
                    option: e.option,
                    normalizedOption: e.normalizedOption
                });
            });
        }
    });

    console.log(`✓ 发现 ${issues.length} 个真正的重孔问题`);
    console.log(`  说明:`);
    console.log(`    - Option表达式规范化处理（支持 & / - () 运算符）`);
    console.log(`    - 规范化后相同的Option被视为等效（如 A&B 等效于 B&A）`);
    console.log(`    - 焊点（Pin=X）不参与重孔检查，只检查插件`);
    return issues;
}

// 检查4：焊点颜色一致性检查 - V4新增
function checkSpliceColorConsistency(wireData) {
    console.log('\n=== V4检查: 焊点颜色一致性 ===');
    const issues = [];

    const fromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode', 'fromcode', 'from code']);
    const fromPinCol = findColumn(wireData, ['from pin', 'frompin', 'from pin number', 'from cavity', 'from pin', '孔位', 'from cav', 'from pin ', 'frompin']);
    const toCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode', 'tocode', 'to code']);
    const toPinCol = findColumn(wireData, ['to pin', 'topin', 'to pin number', 'to cavity', 'to pin', '孔位', 'to cav', 'to pin ', 'topin']);
    const colorCol = findColumn(wireData, ['color', 'colour', '颜色']);

    if (!fromCodeCol || !toCodeCol || !colorCol) {
        console.log('✗ 未找到必需的列，跳过焊点颜色检查');
        return issues;
    }

    if (!fromPinCol || !toPinCol) {
        console.log('✗ 未找到Pin列，无法识别焊点，跳过检查');
        return issues;
    }

    console.log(`  开始收集焊点颜色数据...`);

    // Map结构: spliceCode -> { colors: Set, wires: Array<{rowIndex, color}> }
    const spliceMap = new Map();

    // 收集所有连接到焊点的导线颜色
    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
        const toCode = String(wireData[i][toCodeCol.index] || '').trim();
        const fromPin = fromPinCol ? String(wireData[i][fromPinCol.index] || '').trim() : '';
        const toPin = toPinCol ? String(wireData[i][toPinCol.index] || '').trim() : '';
        const color = String(wireData[i][colorCol.index] || '').trim();

        const excelRow = i + 1;

        // 检查From端是否是焊点
        if (fromCode && (fromPin === 'X' || fromPin === 'x')) {
            if (!spliceMap.has(fromCode)) {
                spliceMap.set(fromCode, { colors: new Set(), wires: [] });
            }
            if (color) {
                spliceMap.get(fromCode).colors.add(color);
                spliceMap.get(fromCode).wires.push({
                    rowIndex: i,
                    row: excelRow,
                    color: color,
                    side: 'from'
                });
            }
        }

        // 检查To端是否是焊点
        if (toCode && (toPin === 'X' || toPin === 'x')) {
            if (!spliceMap.has(toCode)) {
                spliceMap.set(toCode, { colors: new Set(), wires: [] });
            }
            if (color) {
                spliceMap.get(toCode).colors.add(color);
                spliceMap.get(toCode).wires.push({
                    rowIndex: i,
                    row: excelRow,
                    color: color,
                    side: 'to'
                });
            }
        }
    }

    console.log(`  找到 ${spliceMap.size} 个焊点`);

    // 检查每个焊点的颜色是否一致
    let inconsistentCount = 0;
    spliceMap.forEach((data, spliceCode) => {
        if (data.colors.size > 1) {
            // 同一焊点有多个不同颜色
            inconsistentCount++;
            const colorArray = Array.from(data.colors);
            console.log(`  ✗ 焊点 ${spliceCode} 有多个颜色: ${colorArray.join(', ')}`);

            // 标记所有连接到这个焊点的导线
            data.wires.forEach(wire => {
                issues.push({
                    row: wire.row,
                    rowIndex: wire.rowIndex,
                    colIndex: colorCol.index,
                    type: 'splice_color_inconsistent',
                    severity: 'splice',
                    spliceCode: spliceCode,
                    side: wire.side,
                    colors: colorArray.join(', '),
                    message: `焊点 ${spliceCode} (${wire.side}端) 的颜色不一致，发现 ${colorArray.length} 种颜色: ${colorArray.join(', ')}`
                });
            });
        }
    });

    console.log(`✓ 发现 ${inconsistentCount} 个焊点存在颜色不一致`);
    console.log(`✓ 总计发现 ${issues.length} 个焊点颜色相关问题`);

    return issues;
}

// 检查5：焊点Family一致性检查 - V7新增
function checkSpliceFamilyConsistency(wireData) {
    console.log('\n=== V7检查: 焊点Family一致性 ===');
    const issues = [];

    const fromCodeCol = findColumn(wireData, ['from code', 'from connector', 'from', 'fromcode', 'fromcode', 'from code']);
    const fromPinCol = findColumn(wireData, ['from pin', 'frompin', 'from pin number', 'from cavity', 'from pin', '孔位', 'from cav', 'from pin ', 'frompin']);
    const toCodeCol = findColumn(wireData, ['to code', 'to connector', 'to', 'tocode', 'tocode', 'to code']);
    const toPinCol = findColumn(wireData, ['to pin', 'topin', 'to pin number', 'to cavity', 'to pin', '孔位', 'to cav', 'to pin ', 'topin']);
    const familyCol = findColumn(wireData, ['ident tag', 'ident', 'family', 'family name', '短号']);

    if (!fromCodeCol || !toCodeCol || !familyCol) {
        console.log('✗ 未找到必需的列，跳过焊点Family检查');
        return issues;
    }

    if (!fromPinCol || !toPinCol) {
        console.log('✗ 未找到Pin列，无法识别焊点，跳过检查');
        return issues;
    }

    console.log(`  开始收集焊点Family数据...`);

    // Map结构: spliceCode -> { families: Set, wires: Array<{rowIndex, family, circuitNumber}> }
    const spliceMap = new Map();

    // 收集所有连接到焊点的Family
    for (let i = 1; i < wireData.length; i++) {
        const fromCode = String(wireData[i][fromCodeCol.index] || '').trim();
        const toCode = String(wireData[i][toCodeCol.index] || '').trim();
        const fromPin = fromPinCol ? String(wireData[i][fromPinCol.index] || '').trim() : '';
        const toPin = toPinCol ? String(wireData[i][toPinCol.index] || '').trim() : '';
        const family = String(wireData[i][familyCol.index] || '').trim();

        // 查找回路号列（用于显示）
        const circuitCol = findColumn(wireData, ['circuit', 'circuit no', 'circuit number', '回路号', 'circuit', 'circuit ']);
        const circuitNumber = circuitCol ? String(wireData[i][circuitCol.index] || '').trim() : '';

        const excelRow = i + 1;

        // 检查From端是否是焊点
        if (fromCode && (fromPin === 'X' || fromPin === 'x')) {
            if (!spliceMap.has(fromCode)) {
                spliceMap.set(fromCode, { families: new Set(), wires: [] });
            }
            if (family) {
                spliceMap.get(fromCode).families.add(family);
                spliceMap.get(fromCode).wires.push({
                    rowIndex: i,
                    row: excelRow,
                    family: family,
                    circuitNumber: circuitNumber,
                    side: 'from'
                });
            }
        }

        // 检查To端是否是焊点
        if (toCode && (toPin === 'X' || toPin === 'x')) {
            if (!spliceMap.has(toCode)) {
                spliceMap.set(toCode, { families: new Set(), wires: [] });
            }
            if (family) {
                spliceMap.get(toCode).families.add(family);
                spliceMap.get(toCode).wires.push({
                    rowIndex: i,
                    row: excelRow,
                    family: family,
                    circuitNumber: circuitNumber,
                    side: 'to'
                });
            }
        }
    }

    console.log(`  找到 ${spliceMap.size} 个焊点`);

    // 检查每个焊点的Family是否一致
    let inconsistentCount = 0;
    spliceMap.forEach((data, spliceCode) => {
        if (data.families.size > 1) {
            // 同一焊点有多个不同Family
            inconsistentCount++;
            const familyArray = Array.from(data.families);
            console.log(`  ✗ 焊点 ${spliceCode} 有多个Family: ${familyArray.join(', ')}`);

            // 标记所有连接到这个焊点的导线
            data.wires.forEach(wire => {
                issues.push({
                    row: wire.row,
                    rowIndex: wire.rowIndex,
                    colIndex: familyCol.index,
                    type: 'splice_family_inconsistent',
                    severity: 'splice',
                    spliceCode: spliceCode,
                    side: wire.side,
                    families: familyArray.join(', '),
                    message: `焊点 ${spliceCode} (${wire.side}端) 的Family不一致，发现 ${familyArray.length} 种Family: ${familyArray.join(', ')}`,
                    circuitNumber: wire.circuitNumber
                });
            });
        }
    });

    console.log(`✓ 发现 ${inconsistentCount} 个焊点存在Family不一致`);
    console.log(`✓ 总计发现 ${issues.length} 个焊点Family相关问题`);

    return issues;
}

// 检查6：Multicore ID重复检查 - V8新增
function checkMulticoreIDDuplicate(wireData) {
    console.log('\n=== V8检查: Multicore ID重复检查 ===');
    const issues = [];

    const multicoreCol = findColumn(wireData, ['multicore id', 'multicore', 'group id', '组名号', 'multicore id']);

    if (!multicoreCol) {
        console.log('✗ 未找到Multicore ID列，跳过检查');
        return issues;
    }

    console.log(`  开始收集Multicore ID数据...`);

    // Map结构: multicoreID -> { rows: Array<{rowIndex, row, prefix}>, count: number }
    const multicoreMap = new Map();

    // 收集所有回路的Multicore ID
    for (let i = 1; i < wireData.length; i++) {
        const multicoreID = String(wireData[i][multicoreCol.index] || '').trim();

        if (!multicoreID) {
            continue; // 跳过空值
        }

        const excelRow = i + 1;

        // 判断前缀
        let prefix = '';
        if (multicoreID.toUpperCase().startsWith('TW')) {
            prefix = 'TW';
        } else if (multicoreID.toUpperCase().startsWith('T')) {
            prefix = 'T';
        } else if (multicoreID.toUpperCase().startsWith('ST')) {
            prefix = 'ST';
        } else if (multicoreID.toUpperCase().startsWith('C')) {
            prefix = 'C';
        } else {
            continue; // 不在检查范围内
        }

        if (!multicoreMap.has(multicoreID)) {
            multicoreMap.set(multicoreID, {
                rows: [],
                count: 0,
                prefix: prefix
            });
        }

        multicoreMap.get(multicoreID).rows.push({
            rowIndex: i,
            row: excelRow
        });
        multicoreMap.get(multicoreID).count++;
    }

    console.log(`  找到 ${multicoreMap.size} 个需要检查的Multicore ID`);

    // 检查每个Multicore ID的数量是否超过限制
    let duplicateCount = 0;
    multicoreMap.forEach((data, multicoreID) => {
        let limit = 0;
        let shouldCheck = false;

        // 根据前缀确定限制
        if (data.prefix === 'TW') {
            limit = 2;
            shouldCheck = true;
        } else if (data.prefix === 'T') {
            limit = 2;
            shouldCheck = true;
        } else if (data.prefix === 'ST') {
            limit = 3;
            shouldCheck = true;
        } else if (data.prefix === 'C') {
            limit = 4;
            shouldCheck = true;
        }

        if (shouldCheck && data.count > limit) {
            duplicateCount++;
            console.log(`  ✗ Multicore ID ${multicoreID} (${data.prefix}开头) 有 ${data.count} 个回路，超过限制 ${limit}`);

            // 标记所有相关回路
            data.rows.forEach(rowInfo => {
                issues.push({
                    row: rowInfo.row,
                    rowIndex: rowInfo.rowIndex,
                    colIndex: multicoreCol.index,
                    type: 'multicore_id_duplicate',
                    severity: 'warning', // 使用warning级别，橙色标记
                    multicoreID: multicoreID,
                    prefix: data.prefix,
                    count: data.count,
                    limit: limit,
                    message: `Multicore ID ${multicoreID} (${data.prefix}开头) 有 ${data.count} 个回路，超过限制 ${limit}`
                });
            });
        }
    });

    console.log(`✓ 发现 ${duplicateCount} 个Multicore ID存在数量超标`);
    console.log(`✓ 总计发现 ${issues.length} 个Multicore ID相关问题`);

    return issues;
}

// 执行检查
async function performCheck() {
    const wireFile = document.getElementById('wire_list').files[0];
    const connFile = document.getElementById('conn_list').files[0];
    const configTableFile = document.getElementById('config_table').files[0];
    const inlineFile = document.getElementById('inline_list').files[0];

    if (!wireFile || !connFile || !configTableFile || !inlineFile) {
        alert('请上传所有必需的文件（4个文件）');
        return;
    }

    loadingOverlay.classList.remove('hidden');
    checkBtn.disabled = true;
    allIssues = [];

    try {
        console.log('\n' + '='.repeat(50));
        console.log('开始检查文件');
        console.log('='.repeat(50));

        // 读取文件
        progressText.textContent = '正在读取文件...';
        console.log('\n[1/3] 读取文件...');

        const wireResult = await readExcelFile(wireFile);
        wireWorkbook = wireResult.workbook;
        const wireDataArray = wireResult.data;
        wireData = wireDataArray; // 保存为全局变量供导出使用

        const connResult = await readExcelFile(connFile);
        const connDataArray = connResult.data;
        connData = connDataArray; // 保存为全局变量

        const configResult = await readExcelFile(configTableFile);
        const configDataArray = configResult.data;
        configData = configDataArray; // 保存为全局变量

        const inlineResult = await readExcelFile(inlineFile);
        const inlineDataArray = inlineResult.data;
        inlineData = inlineDataArray; // 保存为全局变量

        // 执行检查
        progressText.textContent = '正在检查数据...';
        console.log('\n[2/2] 执行检查...');

        // 1. Family一致性
        const familyIssues = checkFamilyConsistency(wireDataArray, buildCodeFamilyMap(connDataArray));
        allIssues.push(...familyIssues);

        // 2. V4: 焊点颜色一致性检查
        const spliceColorIssues = checkSpliceColorConsistency(wireDataArray);
        allIssues.push(...spliceColorIssues);

        // 3. V7: 焊点Family一致性检查
        const spliceFamilyIssues = checkSpliceFamilyConsistency(wireDataArray);
        allIssues.push(...spliceFamilyIssues);

        // 4. V2: Inline两侧同一PIN导线线色线径一致性检查
        const consistencyIssues = checkInlineConsistency(wireDataArray, inlineDataArray);
        allIssues.push(...consistencyIssues);

        // 4. 重孔检查
        const duplicateIssues = checkDuplicatePins(wireDataArray, configDataArray);
        allIssues.push(...duplicateIssues);

        // 5. V8: Multicore ID重复检查
        const multicoreIssues = checkMulticoreIDDuplicate(wireDataArray);
        allIssues.push(...multicoreIssues);

        // 显示结果
        progressText.textContent = '正在生成报告...';
        displayResults(wireDataArray);

        console.log('\n' + '='.repeat(50));
        console.log('检查完成！');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n✗ 检查失败:', error);
        alert('检查过程中发生错误: ' + error.message + '\n\n请查看浏览器控制台获取详细信息（按F12）');
    } finally {
        loadingOverlay.classList.add('hidden');
        checkBtn.disabled = false;
    }
}

// 生成问题汇总数据
function generateSummaryData() {
    const summaryData = {
        spliceColorIssues: [],
        spliceFamilyIssues: [],
        familyIssues: [],
        inlineIssues: [],
        duplicateIssues: [],
        multicoreIssues: []
    };

    // 获取Wire ID列（用于显示回路号）
    const wireIdCol = findColumn(wireData, ['wire id', 'wire', 'wireid', 'circuit', 'circuit id', '回路号', '线号']);

    // 辅助函数：根据行号获取回路号
    function getWireIdByRow(rowNumber) {
        if (!wireIdCol || !wireData || rowNumber < 2) return '';
        const rowIndex = rowNumber - 1; // Excel行号转为数组索引（第1行是表头）
        if (rowIndex >= wireData.length) return '';
        return String(wireData[rowIndex][wireIdCol.index] || '').trim();
    }

    // 收集焊点颜色不一致问题
    const processedSplices = new Set();
    allIssues.filter(i => i.type === 'splice_color_inconsistent').forEach(issue => {
        const key = `${issue.spliceCode}`;
        if (!processedSplices.has(key)) {
            processedSplices.add(key);
            summaryData.spliceColorIssues.push({
                焊点Code: issue.spliceCode,
                位置: issue.side === 'from' ? 'From端' : 'To端',
                颜色值: issue.colors,
                问题行号: issue.row,
                回路号: getWireIdByRow(issue.row)
            });
        }
    });

    // 收集焊点Family不一致问题
    const processedSpliceFamilies = new Set();
    allIssues.filter(i => i.type === 'splice_family_inconsistent').forEach(issue => {
        const key = `${issue.spliceCode}`;
        if (!processedSpliceFamilies.has(key)) {
            processedSpliceFamilies.add(key);
            summaryData.spliceFamilyIssues.push({
                焊点Code: issue.spliceCode,
                位置: issue.side === 'from' ? 'From端' : 'To端',
                Family值: issue.families,
                问题行号: issue.row,
                回路号: getWireIdByRow(issue.row)
            });
        }
    });

    // 收集Family不一致问题
    const processedFamilyCircuits = new Set();
    allIssues.filter(i => i.type === 'family_mismatch' || i.type === 'family_empty').forEach(issue => {
        if (issue.details && issue.details.length > 0) {
            issue.details.forEach(detail => {
                const key = `${detail.code}-${detail.codeType}`;
                if (!processedFamilyCircuits.has(key)) {
                    processedFamilyCircuits.add(key);
                    summaryData.familyIssues.push({
                        连接器Code: detail.code,
                        位置: detail.codeType === 'from' ? 'From端' : 'To端',
                        问题类型: issue.type === 'family_empty' ? 'Family为空' : 'Family不一致',
                        期望Family: detail.expected,
                        实际值: detail.actual,
                        问题行号: issue.row,
                        回路号: getWireIdByRow(issue.row)
                    });
                }
            });
        }
    });

    // 收集Inline两侧不一致问题
    const processedInlinePairs = new Set();
    allIssues.filter(i => i.type === 'color_inconsistent' || i.type === 'size_inconsistent').forEach(issue => {
        const key = `${issue.inlinePair}-${issue.type}`;
        if (!processedInlinePairs.has(key)) {
            processedInlinePairs.add(key);
            summaryData.inlineIssues.push({
                Inline连接: issue.inlinePair,
                问题类型: issue.type === 'color_inconsistent' ? 'Color不一致' : 'Size不一致',
                值: issue.type === 'color_inconsistent' ? issue.colors : issue.sizes,
                问题行号: issue.row,
                回路号: getWireIdByRow(issue.row)
            });
        }
    });

    // 收集重孔问题 - 按插件、孔位和规范化Option分组（不区分From/To端）
    const duplicateGroups = new Map(); // key: `${code}|${pin}|${normalizedOption}` -> value: { sides, originalOptions, fromRows, toRows }

    allIssues.filter(i => i.type === 'duplicate_pin').forEach(issue => {
        const normalizedOption = issue.normalizedOption || '';
        const key = `${issue.code}|${issue.pin}|${normalizedOption}`;

        if (!duplicateGroups.has(key)) {
            duplicateGroups.set(key, {
                code: issue.code,
                pin: issue.pin,
                normalizedOption: normalizedOption,
                sides: new Set(), // 记录有哪些端（from/to）
                originalOptions: new Set(), // 收集所有原始Option表达式
                fromRows: [], // From端行号
                toRows: []    // To端行号
            });
        }

        const group = duplicateGroups.get(key);
        group.sides.add(issue.side);
        group.originalOptions.add(issue.option || '(空)');

        // 按端分别收集行号
        if (issue.side === 'from') {
            group.fromRows.push(issue.row);
        } else {
            group.toRows.push(issue.row);
        }
    });

    // 转换为数组并排序：先按code，再按pin，再按normalizedOption
    const sortedDuplicates = Array.from(duplicateGroups.values()).sort((a, b) => {
        if (a.code !== b.code) return a.code.localeCompare(b.code);
        if (a.pin !== b.pin) return a.pin.localeCompare(b.pin);
        return (a.normalizedOption || '').localeCompare(b.normalizedOption || '');
    });

    // 生成汇总数据，同一组的所有行号合并显示
    sortedDuplicates.forEach(dup => {
        // 对各端行号排序
        dup.fromRows.sort((a, b) => a - b);
        dup.toRows.sort((a, b) => a - b);

        // 收集所有原始Option表达式并显示
        const originalOpts = Array.from(dup.originalOptions).sort().join(' | ');

        // 构建位置信息
        const sidesArray = Array.from(dup.sides).sort();
        const locationInfo = sidesArray.length === 1
            ? (sidesArray[0] === 'from' ? 'From端' : 'To端')
            : `${sidesArray.length}端`;

        // 构建所有行号（合并From和To）
        const allRows = [...dup.fromRows, ...dup.toRows];
        const rowsInfo = allRows.sort((a, b) => a - b).join(', ');

        // 如果两端都有，显示详细信息
        let detailInfo = rowsInfo;
        if (dup.fromRows.length > 0 && dup.toRows.length > 0) {
            detailInfo = `From端: ${dup.fromRows.join(', ')} | To端: ${dup.toRows.join(', ')}`;
        }

        // 收集所有回路号（去重并排序）
        const allWireIds = allRows.map(row => getWireIdByRow(row)).filter(id => id);
        const uniqueWireIds = [...new Set(allWireIds)].sort();
        const wireIdsInfo = uniqueWireIds.join(', ');

        summaryData.duplicateIssues.push({
            插件短号: dup.code,
            孔位PIN: dup.pin,
            位置: locationInfo,
            Option: dup.normalizedOption || '(空)',
            原始表达式: originalOpts,
            问题行号: detailInfo,
            回路号: wireIdsInfo
        });
    });

    // 收集Multicore ID重复问题
    const processedMulticoreIDs = new Set();
    allIssues.filter(i => i.type === 'multicore_id_duplicate').forEach(issue => {
        const key = `${issue.multicoreID}`;
        if (!processedMulticoreIDs.has(key)) {
            processedMulticoreIDs.add(key);
            summaryData.multicoreIssues.push({
                组名号: issue.multicoreID,
                前缀: issue.prefix,
                回路数量: issue.count,
                限制: issue.limit,
                问题行号: issue.row,
                回路号: getWireIdByRow(issue.row)
            });
        }
    });

    return summaryData;
}

// 渲染问题汇总表
function renderSummaryTable() {
    const summaryData = generateSummaryData();

    // 准备表头
    const headers = ['问题类型', '详细信息', '问题类型说明', '问题行号', '回路号'];

    // 准备数据行
    const rows = [];

    // 1. 焊点颜色不一致
    summaryData.spliceColorIssues.forEach(item => {
        rows.push({
            问题类型: '焊点颜色不一致',
            详细信息: `${item.焊点Code} (${item.位置})`,
            问题类型说明: `颜色值: ${item.颜色值}`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 2. 焊点Family不一致
    summaryData.spliceFamilyIssues.forEach(item => {
        rows.push({
            问题类型: '焊点Family不一致',
            详细信息: `${item.焊点Code} (${item.位置})`,
            问题类型说明: `Family值: ${item.Family值}`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 3. Family不一致/为空
    summaryData.familyIssues.forEach(item => {
        rows.push({
            问题类型: 'Family不一致/为空',
            详细信息: `${item.连接器Code} (${item.位置})`,
            问题类型说明: `${item.问题类型} | 期望: ${item.期望Family}, 实际: ${item.实际值}`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 4. Inline两侧不一致
    summaryData.inlineIssues.forEach(item => {
        rows.push({
            问题类型: 'Inline两侧不一致',
            详细信息: item.Inline连接,
            问题类型说明: `${item.问题类型}: ${item.值}`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 5. 重孔问题
    summaryData.duplicateIssues.forEach(item => {
        rows.push({
            问题类型: '重孔问题',
            详细信息: `${item.插件短号}/${item.孔位PIN} (${item.位置})`,
            问题类型说明: `Option: ${item.Option}${item.原始表达式 ? `<br><span style="color:#666;font-size:0.85em">原始: ${item.原始表达式}</span>` : ''}`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 6. Multicore ID重复
    summaryData.multicoreIssues.forEach(item => {
        rows.push({
            问题类型: 'Multicore ID重复',
            详细信息: `${item.组名号} (${item.前缀}开头)`,
            问题类型说明: `回路数量: ${item.回路数量} (限制: ${item.限制})`,
            问题行号: item.问题行号,
            回路号: item.回路号
        });
    });

    // 渲染表头
    let theadHtml = '<tr>';
    headers.forEach(h => {
        theadHtml += `<th>${h}</th>`;
    });
    theadHtml += '</tr>';
    document.getElementById('summaryTableHead').innerHTML = theadHtml;

    // 渲染表体
    let tbodyHtml = '';
    rows.forEach((row, index) => {
        let rowClass = '';
        if (row.问题类型 === 'Family不一致/为空') {
            rowClass = 'row-error';
        } else if (row.问题类型 === '焊点颜色不一致') {
            rowClass = 'row-splice';
        } else if (row.问题类型 === 'Inline两侧不一致') {
            rowClass = 'row-warning';
        } else if (row.问题类型 === '重孔问题') {
            rowClass = 'row-info';
        }

        tbodyHtml += `<tr class="${rowClass}">`;
        headers.forEach(header => {
            const cellValue = row[header] || '';
            const displayValue = cellValue === '' ? '&nbsp;' : cellValue;
            tbodyHtml += `<td>${displayValue}</td>`;
        });
        tbodyHtml += '</tr>';
    });

    document.getElementById('summaryTableBody').innerHTML = tbodyHtml;
    document.getElementById('summaryCount').textContent = rows.length;

    // 保存汇总数据供导出使用
    window.summaryDataExport = {
        headers: headers,
        rows: rows
    };

    console.log(`\n=== 问题汇总统计 ===`);
    console.log(`焊点颜色不一致: ${summaryData.spliceColorIssues.length}个`);
    console.log(`焊点Family不一致: ${summaryData.spliceFamilyIssues.length}个`);
    console.log(`Family不一致/为空: ${summaryData.familyIssues.length}个`);
    console.log(`Inline两侧不一致: ${summaryData.inlineIssues.length}个`);
    console.log(`重孔问题: ${summaryData.duplicateIssues.length}个`);
    console.log(`Multicore ID重复: ${summaryData.multicoreIssues.length}个`);
    console.log(`总计: ${rows.length}个问题汇总`);
}

// 显示结果
function displayResults(wireDataArray) {
    const stats = {
        familyErrors: allIssues.filter(i => i.type === 'family_mismatch' || i.type === 'family_empty').length,
        spliceColorErrors: allIssues.filter(i => i.type === 'splice_color_inconsistent').length,
        spliceFamilyErrors: allIssues.filter(i => i.type === 'splice_family_inconsistent').length,
        colorWarnings: allIssues.filter(i => i.type === 'color_inconsistent').length,
        sizeWarnings: allIssues.filter(i => i.type === 'size_inconsistent').length,
        duplicatePins: allIssues.filter(i => i.type === 'duplicate_pin').length,
        multicoreErrors: allIssues.filter(i => i.type === 'multicore_id_duplicate').length,
        total: allIssues.length
    };

    document.getElementById('familyErrors').textContent = stats.familyErrors;
    document.getElementById('spliceColorErrors').textContent = stats.spliceColorErrors;
    document.getElementById('spliceFamilyErrors').textContent = stats.spliceFamilyErrors;
    document.getElementById('colorWarnings').textContent = stats.colorWarnings + stats.sizeWarnings;
    document.getElementById('duplicatePins').textContent = stats.duplicatePins;
    document.getElementById('multicoreErrors').textContent = stats.multicoreErrors;
    document.getElementById('totalIssues').textContent = stats.total;

    console.log(`\n=== 检查结果统计 ===`);
    console.log(`Family不一致/为空: ${stats.familyErrors}个`);
    console.log(`焊点颜色不一致: ${stats.spliceColorErrors}个`);
    console.log(`Inline Color不一致: ${stats.colorWarnings}个`);
    console.log(`Inline Size不一致: ${stats.sizeWarnings}个`);
    console.log(`重孔问题: ${stats.duplicatePins}个`);
    console.log(`总问题数: ${stats.total}个`);

    // 显示问题列表
    issuesList.innerHTML = '';
    allIssues.slice(0, 50).forEach(issue => {
        issuesList.appendChild(createIssueElement(issue));
    });

    if (allIssues.length > 50) {
        const moreInfo = document.createElement('div');
        moreInfo.style.padding = '10px';
        moreInfo.style.textAlign = 'center';
        moreInfo.style.color = '#6b7280';
        moreInfo.style.fontStyle = 'italic';
        moreInfo.textContent = `还有 ${allIssues.length - 50} 个问题未显示，请导出Excel查看完整结果`;
        issuesList.appendChild(moreInfo);
    }

    // 渲染Wire List表格
    renderWireListTable(wireDataArray);

    // 渲染问题汇总表
    renderSummaryTable();

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 渲染Wire List表格
function renderWireListTable(data) {
    if (!data || data.length < 2) return;

    const headers = data[0];
    const rows = data.slice(1);

    // 建立行问题映射
    const rowIssues = new Map();
    allIssues.forEach(issue => {
        if (!rowIssues.has(issue.rowIndex)) {
            rowIssues.set(issue.rowIndex, []);
        }
        rowIssues.get(issue.rowIndex).push(issue);
    });

    // 渲染表头
    let theadHtml = '<tr>';
    headers.forEach(h => {
        theadHtml += `<th>${h || ''}</th>`;
    });
    theadHtml += '</tr>';
    tableHead.innerHTML = theadHtml;

    // 渲染表体
    let tbodyHtml = '';
    rows.forEach((row, rowIndex) => {
        const issues = rowIssues.get(rowIndex) || [];
        let rowClass = '';
        let maxSeverity = '';
        let issueType = '';

        if (issues.length > 0) {
            // 确定这一行的主要问题类型
            const hasFamilyIssue = issues.some(i => i.type === 'family_mismatch' || i.type === 'family_empty');
            const hasSpliceColorIssue = issues.some(i => i.type === 'splice_color_inconsistent');
            const hasSpliceFamilyIssue = issues.some(i => i.type === 'splice_family_inconsistent');
            const hasInlineIssue = issues.some(i => i.type === 'color_inconsistent' || i.type === 'size_inconsistent');
            const hasDuplicateIssue = issues.some(i => i.type === 'duplicate_pin');
            const hasMulticoreIssue = issues.some(i => i.type === 'multicore_id_duplicate');

            if (hasFamilyIssue) {
                issueType = 'family';
                rowClass = 'row-error';
                maxSeverity = 'error';
            } else if (hasSpliceColorIssue) {
                issueType = 'spliceColor';
                rowClass = 'row-splice';
                maxSeverity = 'splice';
            } else if (hasSpliceFamilyIssue) {
                issueType = 'spliceFamily';
                rowClass = 'row-splice';
                maxSeverity = 'splice';
            } else if (hasInlineIssue) {
                issueType = 'inline';
                rowClass = 'row-warning';
                maxSeverity = 'warning';
            } else if (hasDuplicateIssue) {
                issueType = 'duplicate';
                rowClass = 'row-info';
                maxSeverity = 'info';
            } else if (hasMulticoreIssue) {
                issueType = 'multicore';
                rowClass = 'row-warning';
                maxSeverity = 'warning';
            }

            // 如果一行有多种问题类型，优先显示family
            if (!issueType && issues.length > 0) {
                if (issues.some(i => i.severity === 'error')) {
                    rowClass = 'row-error';
                    maxSeverity = 'error';
                } else if (issues.some(i => i.severity === 'warning')) {
                    rowClass = 'row-warning';
                    maxSeverity = 'warning';
                } else {
                    rowClass = 'row-info';
                    maxSeverity = 'info';
                }
            }
        }

        tbodyHtml += `<tr class="${rowClass}" data-severity="${maxSeverity}" data-issue-type="${issueType}" data-row="${rowIndex}">`;

        // 确保每一行都有与表头数量相同的单元格
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            let cellClass = '';
            const cell = row[colIndex];
            const cellValue = (cell !== undefined && cell !== null) ? String(cell) : '';

            // 检查这个单元格是否有问题
            const cellIssue = issues.find(i =>
                i.colIndex === colIndex ||
                (i.colIndexes && i.colIndexes.includes(colIndex))
            );

            if (cellIssue) {
                if (cellIssue.severity === 'error') cellClass = 'cell-error';
                else if (cellIssue.severity === 'splice') cellClass = 'cell-splice';
                else if (cellIssue.severity === 'warning') cellClass = 'cell-warning';
                else if (cellIssue.severity === 'info') cellClass = 'cell-info';
            }

            // 使用 &nbsp; 表示真正的空单元格，避免浏览器折叠
            const displayValue = cellValue === '' ? '&nbsp;' : cellValue;
            tbodyHtml += `<td class="${cellClass}" title="${cellValue}">${displayValue}</td>`;
        }

        tbodyHtml += '</tr>';
    });

    tableBody.innerHTML = tbodyHtml;

    // 更新计数
    document.getElementById('totalCount').textContent = rows.length;
    updateDisplayCount();
}

// 更新显示计数
function updateDisplayCount() {
    const visibleRows = tableBody.querySelectorAll('tr:not([style*="display: none"])');
    document.getElementById('displayedCount').textContent = visibleRows.length;
}

// 过滤表格
function filterTable() {
    const showFamily = document.getElementById('showFamily').checked;
    const showSpliceColor = document.getElementById('showSpliceColor').checked;
    const showSpliceFamily = document.getElementById('showSpliceFamily').checked;
    const showInline = document.getElementById('showInline').checked;
    const showDuplicate = document.getElementById('showDuplicate').checked;
    const showMulticore = document.getElementById('showMulticore').checked;
    const showOk = document.getElementById('showOk').checked;

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const issueType = row.getAttribute('data-issue-type');

        if (!issueType) {
            // 正常行
            row.style.display = showOk ? '' : 'none';
        } else if (issueType === 'family') {
            // Family不一致/为空
            row.style.display = showFamily ? '' : 'none';
        } else if (issueType === 'spliceColor') {
            // 焊点颜色不一致
            row.style.display = showSpliceColor ? '' : 'none';
        } else if (issueType === 'spliceFamily') {
            // 焊点Family不一致
            row.style.display = showSpliceFamily ? '' : 'none';
        } else if (issueType === 'inline') {
            // Inline两侧Color/Size不一致
            row.style.display = showInline ? '' : 'none';
        } else if (issueType === 'duplicate') {
            // 重孔问题
            row.style.display = showDuplicate ? '' : 'none';
        } else if (issueType === 'multicore') {
            // Multicore ID重复
            row.style.display = showMulticore ? '' : 'none';
        }
    });

    updateDisplayCount();
}

// 创建问题元素
function createIssueElement(issue) {
    const div = document.createElement('div');
    div.className = `issue-item issue-${issue.severity}`;

    const iconMap = {
        'error': 'fa-times-circle',
        'splice': 'fa-bolt',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    const titleMap = {
        'family_mismatch': 'Family不一致',
        'family_empty': 'Family列为空',
        'code_not_in_connlist': 'Code不在Connlist中',
        'splice_color_inconsistent': '焊点颜色不一致',
        'color_inconsistent': 'Inline两侧Color不一致',
        'size_inconsistent': 'Inline两侧Size不一致',
        'duplicate_pin': `重孔问题 (${issue.side}端)`
    };

    const icon = iconMap[issue.severity] || 'fa-question-circle';
    const title = titleMap[issue.type] || '未知问题';

    let details = `行号: ${issue.row}`;

    if (issue.type === 'family_mismatch') {
        if (issue.details && issue.details.length > 0) {
            // 新格式：有details数组
            const codes = issue.details.map(d => `${d.code}(${d.codeType})`).join(', ');
            details += ` | 插件: ${codes} | ${issue.message}`;
        } else {
            // 旧格式：向后兼容
            details += ` | 插件: ${issue.code} | 端: ${issue.codeType} | 期望: ${issue.expected} | 实际: ${issue.actual}`;
        }
    } else if (issue.type === 'family_empty') {
        if (issue.details && issue.details.length > 0) {
            // 新格式：有details数组
            const codes = issue.details.map(d => `${d.code}(${d.codeType})`).join(', ');
            details += ` | 插件: ${codes} | ${issue.message}`;
        } else {
            // 旧格式：向后兼容
            details += ` | 插件: ${issue.code} | 端: ${issue.codeType} | 应有Family: ${issue.expected} | 实际: ${issue.actual}`;
        }
    } else if (issue.type === 'code_not_in_connlist') {
        details += ` | 插件: ${issue.code} | 端: ${issue.codeType} | 说明: ${issue.message}`;
    } else if (issue.type === 'splice_color_inconsistent') {
        details += ` | 焊点: ${issue.spliceCode} | 端: ${issue.side} | 颜色值: ${issue.colors}`;
    } else if (issue.type === 'splice_family_inconsistent') {
        details += ` | 焊点: ${issue.spliceCode} | 端: ${issue.side} | Family值: ${issue.families}`;
    } else if (issue.type === 'color_inconsistent') {
        details += ` | Inline连接: ${issue.inlinePair} | Color值: ${issue.colors}`;
    } else if (issue.type === 'size_inconsistent') {
        details += ` | Inline连接: ${issue.inlinePair} | Size值: ${issue.sizes}`;
    } else if (issue.type === 'duplicate_pin') {
        details += ` | 插件: ${issue.code} | 孔位: ${issue.pin} | Option: ${issue.option || '(空)'}`;
    }

    div.innerHTML = `
        <div class="issue-icon"><i class="fas ${icon}"></i></div>
        <div class="issue-content">
            <div class="issue-title">${title}</div>
            <div class="issue-details">${details}</div>
        </div>
    `;

    return div;
}

// 🔥 导出带颜色标记的Excel (使用ExcelJS库)
// 移除HTML标签并转换为纯文本（用于Excel导出）
function stripHtmlTags(html) {
    if (!html || typeof html !== 'string') return html;

    // 将 <br> 和 <br/> 转换为换行符
    let text = html.replace(/<br\s*\/?>/gi, '\n');

    // 移除所有其他HTML标签
    text = text.replace(/<[^>]+>/g, '');

    // 解码HTML实体
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");

    // 清理多余的空白
    text = text.trim();

    return text;
}

async function exportResults() {
    if (!wireData || wireData.length < 2) {
        alert('没有可导出的数据');
        return;
    }

    if (allIssues.length === 0) {
        alert('没有发现问题，无需导出');
        return;
    }

    try {
        console.log('正在生成带颜色的Excel...');

        // 显示加载提示
        const exportBtn = document.getElementById('exportBtn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
        exportBtn.disabled = true;

        // 动态加载 ExcelJS 库
        if (!window.ExcelJS) {
            console.log('加载 ExcelJS 库...');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');
        }

        // 创建工作簿 - 使用 ExcelJS 或 window.ExcelJS
        const Excel = window.ExcelJS || window.Excel;
        const workbook = new Excel.Workbook();

        // Sheet 1: Wire List
        const worksheet = workbook.addWorksheet('Wire List');

        // Sheet 2: 问题汇总表
        const summaryWorksheet = workbook.addWorksheet('问题汇总表');

        const headers = wireData[0];
        const rows = wireData.slice(1);

        // 定义样式
        const headerFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };

        const errorFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' }
        };
        const spliceFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFA855F7' }
        };
        const warningFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }
        };
        const infoFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFA500' }
        };

        // 设置列定义（添加"问题原因"列）
        const wireListHeaders = [...headers, '问题原因'];
        worksheet.columns = wireListHeaders.map((h, i) => ({
            key: `col${i}`,
            header: h || '',
            width: h === '问题原因' ? 60 : Math.min(Math.max(String(h).length + 2, 15), 50)
        }));

        // 设置表头样式
        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // 确保有足够的行（预先创建）
        for (let i = 0; i < rows.length; i++) {
            worksheet.getRow(i + 2);  // 这会自动创建行
        }

        console.log(`工作表已设置: ${headers.length} 列, ${rows.length} 行数据`);

        // 建立单元格问题映射
        const cellIssues = new Map();
        allIssues.forEach(issue => {
            // 处理 colIndexes（数组）或 colIndex（单个值）
            if (issue.colIndexes && Array.isArray(issue.colIndexes)) {
                // 重孔问题：标记多个列（code, pin, option）
                issue.colIndexes.forEach(colIndex => {
                    const key = `${issue.rowIndex}-${colIndex}`;
                    if (!cellIssues.has(key)) {
                        cellIssues.set(key, []);
                    }
                    cellIssues.get(key).push(issue);
                });
            } else if (issue.colIndex !== undefined) {
                // 其他问题：标记单个列
                const key = `${issue.rowIndex}-${issue.colIndex}`;
                if (!cellIssues.has(key)) {
                    cellIssues.set(key, []);
                }
                cellIssues.get(key).push(issue);
            }
        });

        console.log(`问题总数: ${allIssues.length}`);
        console.log(`单元格问题映射数: ${cellIssues.size}`);

        // 添加数据行
        rows.forEach((row, rowIndex) => {
            const rowNumber = rowIndex + 2; // Excel行号（从1开始，表头占第1行）
            const wireDataRowIndex = rowIndex + 1; // wireData中的索引（从1开始，因为0是表头）

            // 收集该行所有问题
            const rowIssues = allIssues.filter(issue => issue.rowIndex === wireDataRowIndex);

            // 为每个单元格明确设置值和样式
            row.forEach((cell, colIndex) => {
                const cellValue = (cell !== undefined && cell !== null) ? String(cell) : '';
                const cellAddress = worksheet.getCell(rowNumber, colIndex + 1);

                // 设置单元格值
                cellAddress.value = cellValue;

                // 检查是否有问题需要标记颜色（使用wireDataRowIndex而不是rowIndex）
                const key = `${wireDataRowIndex}-${colIndex}`;
                const issues = cellIssues.get(key);

                if (issues && issues.length > 0) {
                    // 获取最高严重程度
                    const severityOrder = { 'error': 4, 'splice': 3, 'warning': 2, 'info': 1 };
                    const maxSeverity = issues.reduce((max, issue) => {
                        return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
                    }, 'info');

                    console.log(`单元格 (${rowNumber}, ${colIndex + 1}) 标记为 ${maxSeverity}`);

                    if (maxSeverity === 'error') {
                        cellAddress.fill = errorFill;
                        cellAddress.font = { bold: true };
                    } else if (maxSeverity === 'splice') {
                        cellAddress.fill = spliceFill;
                        cellAddress.font = { bold: true };
                    } else if (maxSeverity === 'warning') {
                        cellAddress.fill = warningFill;
                    } else if (maxSeverity === 'info') {
                        cellAddress.fill = infoFill;
                        cellAddress.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    }
                } else {
                    // 普通单元格，设置默认样式
                    cellAddress.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFFFF' }  // 白色背景
                    };
                }

                // 设置对齐和边框
                cellAddress.alignment = { horizontal: 'left', vertical: 'middle' };
                cellAddress.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // 设置"问题原因"列的内容
            const reasonCell = worksheet.getCell(rowNumber, headers.length + 1);
            if (rowIssues.length > 0) {
                // 生成问题原因描述
                const reasons = [];

                rowIssues.forEach(issue => {
                    let reason = '';
                    switch (issue.type) {
                        case 'family_mismatch':
                            reason = `Family不一致: ${issue.details ? issue.expected : ''}`;
                            break;
                        case 'family_empty':
                            reason = 'Family为空';
                            break;
                        case 'splice_color_inconsistent':
                            reason = `焊点颜色不一致: ${issue.colors}`;
                            break;
                        case 'splice_family_inconsistent':
                            reason = `焊点Family不一致: ${issue.families}`;
                            break;
                        case 'color_inconsistent':
                            reason = `Inline Color不一致: ${issue.colors}`;
                            break;
                        case 'size_inconsistent':
                            reason = `Inline Size不一致: ${issue.sizes}`;
                            break;
                        case 'duplicate_pin':
                            reason = `重孔: ${issue.code}/${issue.pin}`;
                            break;
                        case 'multicore_id_duplicate':
                            reason = `Multicore ID重复: ${issue.multicoreID} (${issue.prefix}开头) 有 ${issue.count} 个回路，超过限制 ${issue.limit}`;
                            break;
                        default:
                            reason = issue.type;
                    }
                    reasons.push(reason);
                });

                // 去重并显示
                const uniqueReasons = [...new Set(reasons)];
                reasonCell.value = uniqueReasons.join('\n');
                reasonCell.alignment = {
                    horizontal: 'left',
                    vertical: 'top',
                    wrapText: true
                };
                reasonCell.font = {
                    color: { argb: 'FF000000' },
                    size: 10
                };
            } else {
                reasonCell.value = '';
            }

            // 设置边框
            reasonCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        console.log('颜色标记完成，正在生成文件...');

        // 冻结首行
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        // ========== 生成问题汇总表（Sheet 2）==========
        console.log('正在生成问题汇总表...');

        const summaryHeaders = window.summaryDataExport.headers;
        const summaryRows = window.summaryDataExport.rows;

        // 设置列定义
        summaryWorksheet.columns = summaryHeaders.map((h, i) => {
            // "问题类型说明"列和"回路号"列需要更大的宽度
            if (h === '问题类型说明' || h === '问题行号' || h === '回路号') {
                return {
                    key: `col${i}`,
                    header: h || '',
                    width: 50 // 增加到50
                };
            }
            return {
                key: `col${i}`,
                header: h || '',
                width: Math.min(Math.max(String(h).length + 2, 20), 40)
            };
        });

        // 设置表头样式
        summaryWorksheet.getRow(1).eachCell((cell) => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // 添加汇总数据行
        summaryRows.forEach((row, rowIndex) => {
            const rowNumber = rowIndex + 2; // Excel行号（从1开始，表头占第1行）

            summaryHeaders.forEach((header, colIndex) => {
                const cell = summaryWorksheet.getCell(rowNumber, colIndex + 1);
                let cellValue = row[header] || '';

                // 移除HTML标签（用于"问题类型说明"列等包含HTML的列）
                if (typeof cellValue === 'string' && (cellValue.includes('<') || cellValue.includes('>'))) {
                    cellValue = stripHtmlTags(cellValue);
                }

                cell.value = cellValue;

                // 根据问题类型设置颜色
                const issueType = row['问题类型'];
                if (issueType === 'Family不一致/为空') {
                    cell.fill = errorFill;
                    cell.font = { bold: true };
                } else if (issueType === '焊点颜色不一致' || issueType === '焊点Family不一致') {
                    cell.fill = spliceFill;
                    cell.font = { bold: true };
                } else if (issueType === 'Inline两侧不一致') {
                    cell.fill = warningFill;
                } else if (issueType === '重孔问题') {
                    cell.fill = infoFill;
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                } else if (issueType === 'Multicore ID重复') {
                    cell.fill = warningFill;
                    cell.font = { bold: true };
                }

                // 设置自动换行（特别是"问题类型说明"和"回路号"列）
                cell.alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                    wrapText: true // 启用自动换行
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // 冻结首行
        summaryWorksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        console.log(`问题汇总表已生成: ${summaryRows.length} 行数据`);

        // ========== 生成文件 ==========
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // 下载文件
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Wire_list_checked.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✓ 导出成功');
        alert('✓ 导出成功！\n\n文件已保存为: Wire_list_checked.xlsx\n\n包含2个工作表:\n\n【Sheet 1: Wire List】\n• 完整的Wire List数据\n• 问题单元格颜色标记\n• 新增"问题原因"列，显示每行问题的详细说明\n• 自动调整列宽\n• 冻结首行\n\n【Sheet 2: 问题汇总表】\n• 焊点颜色不一致汇总\n• Family不一致/为空汇总\n• Inline两侧不一致汇总\n• 重孔问题汇总\n• 按问题类型分类显示\n• 颜色标记和冻结首行');

        // 恢复按钮
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;

    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message + '\n\n请查看浏览器控制台获取详细信息');

        // 恢复按钮
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }
}

// 动态加载脚本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 重置表单
function resetForm() {
    fileInputs.forEach(input => {
        input.value = '';
        input.parentElement.classList.remove('has-file');
        input.parentElement.querySelector('.file-name').textContent = '未选择文件';
        input.parentElement.querySelector('.custom-file-input').innerHTML = `<i class="fas fa-cloud-upload-alt"></i><span>点击或拖拽文件到此处</span>`;
    });

    resultSection.classList.add('hidden');
    allIssues = [];
    wireData = null;
    connData = null;
    configData = null;
    inlineData = null;
    circuitGroups = [];
    wireWorkbook = null;
    checkBtn.disabled = true;

    // 清空表格
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('\n表单已重置');
}
