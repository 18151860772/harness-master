        // 检查XLSX库是否已加载
        if (typeof XLSX === 'undefined') {
            console.error('错误：XLSX库未加载！');
            alert('XLSX库加载失败，请检查网络连接或刷新页面重试。');
        }

        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM 加载完成');
            console.log('XLSX 库状态:', typeof XLSX !== 'undefined' ? '已加载' : '未加载');

            // Wire diameter to fuse rating mapping (automotive industry standard)
            const fuseMapping = {
                0.5: { rating: '5A/7.5A', type: 'Mini Fuse', primary: 5 },
                0.75: { rating: '10A', type: 'Mini Fuse', primary: 10 },
                0.85: { rating: '10A/15A', type: 'Mini Fuse', primary: 10 },
                1.0: { rating: '15A', type: 'Mini Fuse', primary: 15 },
                1.25: { rating: '15A/20A', type: 'Mini Fuse', primary: 15 },
                1.5: { rating: '20A/25A', type: 'Mini Fuse', primary: 20 },
                2.0: { rating: '25A', type: 'Mini/Maxi', primary: 25 },
                2.5: { rating: '30A', type: 'Maxi Fuse', primary: 30 },
                4.0: { rating: '35A/40A', type: 'Maxi Fuse', primary: 40 },
                6.0: { rating: '50A', type: 'Maxi/JCASE', primary: 50 },
                8.0: { rating: '60A', type: 'JCASE/Mega', primary: 60 },
                10.0: { rating: '70A/80A', type: 'JCASE/Mega', primary: 70 }
            };

        // Filter definitions
        const boxFilters = {
            '前仓电器盒': { codes: ['UEC', 'FFB'], color: '#4ade80' },
            '仪表电器盒': { codes: ['IEC', 'IPFB'], color: '#60a5fa' },
            '行李箱电器盒': { codes: ['TFB', 'REC'], color: '#f472b6' },
            '预保险丝盒': { codes: ['PFB'], color: '#fbbf24' }
        };

        const validCodes = ['UEC', 'IEC', 'PFB', 'FFB', 'IPFB', 'TFB', 'REC'];

        let allData = [];
        let filteredData = [];
        let activeFilter = null;
        let currentSort = { column: null, direction: 'asc' };

        // Connlist data
        let connectorCodes = new Set(); // 所有插件代码
        let connectorFunctions = {}; // 插件代码 -> 功能映射
        let pinFunctions = {}; // 位置号功能映射：{ "插件代码": { "位置号": "功能描述" } }
        let wirelistAllData = []; // 完整的wirelist数据（用于查找焊点连接）
        let wirelistFile = null; // 存储wirelist文件
        let connlistFile = null; // 存储connlist文件

        // DOM Elements
        const wirelistUploadZone = document.getElementById('wirelistUploadZone');
        const connlistUploadZone = document.getElementById('connlistUploadZone');
        const wirelistInput = document.getElementById('wirelistInput');
        const connlistInput = document.getElementById('connlistInput');
        const wirelistFileInfo = document.getElementById('wirelistFileInfo');
        const connlistFileInfo = document.getElementById('connlistFileInfo');
        const wirelistFileName = document.getElementById('wirelistFileName');
        const wirelistFileSize = document.getElementById('wirelistFileSize');
        const connlistFileName = document.getElementById('connlistFileName');
        const connlistFileSize = document.getElementById('connlistFileSize');
        const loading = document.getElementById('loading');
        const filterSection = document.getElementById('filterSection');
        const filterButtons = document.getElementById('filterButtons');
        const statsSection = document.getElementById('statsSection');
        const resultsSection = document.getElementById('resultsSection');
        const resultsBody = document.getElementById('resultsBody');
        const exportBtn = document.getElementById('exportBtn');
        const distributionBars = document.getElementById('distributionBars');
        const processBtn = document.getElementById('processBtn');

        // Event Listeners
        wirelistUploadZone.addEventListener('click', () => wirelistInput.click());
        wirelistInput.addEventListener('change', (e) => handleWirelistFile(e.target.files[0]));
        wirelistUploadZone.addEventListener('dragover', (e) => handleDragOver(e, wirelistUploadZone));
        wirelistUploadZone.addEventListener('dragleave', () => wirelistUploadZone.classList.remove('dragover'));
        wirelistUploadZone.addEventListener('drop', (e) => handleWirelistDrop(e));

        connlistUploadZone.addEventListener('click', () => connlistInput.click());
        connlistInput.addEventListener('change', (e) => handleConnlistFile(e.target.files[0]));
        connlistUploadZone.addEventListener('dragover', (e) => handleDragOver(e, connlistUploadZone));
        connlistUploadZone.addEventListener('dragleave', () => connlistUploadZone.classList.remove('dragover'));
        connlistUploadZone.addEventListener('drop', (e) => handleConnlistDrop(e));

        processBtn.addEventListener('click', processDataFiles);
        exportBtn.addEventListener('click', exportToExcel);

        // Setup sortable headers
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => handleSort(th.dataset.column));
        });

        function handleDragOver(e, zone) {
            e.preventDefault();
            zone.classList.add('dragover');
        }

        function handleWirelistDrop(e) {
            e.preventDefault();
            wirelistUploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleWirelistFile(files[0]);
            }
        }

        function handleConnlistDrop(e) {
            e.preventDefault();
            connlistUploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleConnlistFile(files[0]);
            }
        }

        function handleWirelistFile(file) {
            if (!file) return;

            // Display file info
            wirelistFileName.textContent = file.name;
            wirelistFileSize.textContent = formatFileSize(file.size);
            wirelistFileInfo.classList.add('active');

            // Store file
            wirelistFile = file;

            console.log('Wirelist 文件已选择:', file.name);
        }

        async function handleConnlistFile(file) {
            if (!file) return;

            // Display file info
            connlistFileName.textContent = file.name;
            connlistFileSize.textContent = formatFileSize(file.size);
            connlistFileInfo.classList.add('active');

            // Store file
            connlistFile = file;

            // Process connlist immediately
            try {
                await processConnlistFile(file);
                console.log('Connlist 文件已处理');
            } catch (error) {
                console.error('Connlist 处理失败:', error);
                connlistFileName.textContent = `${file.name} (处理失败)`;
            }
        }

        async function processDataFiles() {
            console.log('=== 开始分析按钮被点击 ===');
            console.log('wirelistFile:', wirelistFile);
            console.log('connlistFile:', connlistFile);

            if (!wirelistFile) {
                alert('请先上传 Wirelist 文件');
                console.log('错误：未上传 Wirelist 文件');
                return;
            }

            console.log('开始处理数据...');

            // Reset data
            allData = [];
            filteredData = [];

            // Show loading
            loading.classList.add('active');
            resultsSection.classList.remove('active');
            statsSection.innerHTML = '';
            filterSection.classList.remove('active');
            processBtn.disabled = true;

            try {
                // Process wirelist
                console.log('处理 Wirelist 文件...');
                await processWirelistFile(wirelistFile);

                // Initialize filter buttons
                initializeFilters();

                // Display results
                displayResults();
                displayStats();

                // Re-enable button and hide loading
                loading.classList.remove('active');
                processBtn.disabled = false;

                console.log('处理完成！');
            } catch (error) {
                console.error('Error processing files:', error);
                alert('文件处理失败：' + error.message);
                loading.classList.remove('active');
                processBtn.disabled = false;
            }
        }

        function processWirelistFile(file) {
            console.log('processWirelistFile 开始处理文件:', file.name);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        console.log('FileReader 读取完成');
                        const data = new Uint8Array(e.target.result);
                        console.log('数据长度:', data.length);

                        const workbook = XLSX.read(data, { type: 'array' });
                        console.log('工作簿读取完成，Sheet数量:', workbook.SheetNames.length);

                        // Get first sheet
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                        console.log('JSON 转换完成，数据行数:', jsonData.length);

                        if (jsonData.length === 0) {
                            alert('Wirelist文件为空或格式不正确');
                            reject(new Error('Empty file'));
                            return;
                        }

                        // Find column names
                        const columns = findColumns(jsonData[0]);

                        // Debug: Show found columns
                        console.log('识别到的列:', columns);
                        console.log('Excel中的所有列名:', Object.keys(jsonData[0]));

                        if (!columns.wireDiameter) {
                            alert('未找到"线径"列，请确保Excel中包含线径信息');
                            reject(new Error('Missing wire diameter column'));
                            return;
                        }

                        if (!columns.from || !columns.to) {
                            alert(`未找到From Code或to Code列。\n\n识别到的列: ${Object.keys(jsonData[0]).join(', ')}\n\n请确保Excel中包含From Code和to Code列`);
                            reject(new Error('Missing From/To columns'));
                            return;
                        }

                        // Store all wirelist data for later reference
                        wirelistAllData = jsonData.map((row, index) => {
                            const wireId = (columns.wireId && row[columns.wireId]) ? String(row[columns.wireId]) : `Wire${index + 1}`;
                            return {
                                wireId: wireId,
                                from: columns.from ? String(row[columns.from] || '') : '',
                                fromPin: columns.fromPin ? String(row[columns.fromPin] || '') : '',
                                to: columns.to ? String(row[columns.to] || '') : '',
                                toPin: columns.toPin ? String(row[columns.toPin] || '') : '',
                                wireDiameter: columns.wireDiameter ? (parseFloat(row[columns.wireDiameter]) || 0) : 0
                            };
                        });

                        // Process data
                        allData = processData(jsonData, columns);

                        console.log(`原始数据: ${jsonData.length} 条`);
                        console.log(`过滤后数据: ${allData.length} 条`);
                        console.log('过滤原因: 只保留FROM或TO包含 UEC/IEC/PFB/FFB/IPFB/TFB/REC 的线路');

                        if (allData.length === 0) {
                            alert(`未找到符合条件的线路。\n\n原始数据有 ${jsonData.length} 条，但没有FROM或TO包含以下代码的线路：\nUEC、IEC、PFB、FFB、IPFB、TFB、REC\n\n请检查Excel中的FROM和TO列。`);
                            reject(new Error('No matching data'));
                            return;
                        }

                        filteredData = [...allData];
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }

        function processConnlistFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                        console.log(`Connlist 数据: ${jsonData.length} 条`);

                        // Clear previous data
                        connectorCodes.clear();
                        connectorFunctions = {};
                        pinFunctions = {};

                        // 查找列名
                        let codeCol = null;
                        let pinCol = null;
                        let funcCol = null;

                        if (jsonData.length > 0) {
                            const firstRow = jsonData[0];
                            Object.keys(firstRow).forEach(key => {
                                const normalizedKey = key.toLowerCase().trim();
                                // 查找插件代码列
                                if (normalizedKey.includes('code') || normalizedKey.includes('connector') ||
                                    normalizedKey.includes('conn') || normalizedKey.includes('连接器') ||
                                    normalizedKey.includes('插件')) {
                                    codeCol = key;
                                }
                                // 查找位置号列
                                else if (normalizedKey.includes('pin') || normalizedKey.includes('位置') ||
                                    normalizedKey.includes('pin号') || normalizedKey.includes('端子')) {
                                    pinCol = key;
                                }
                                // 查找功能描述列
                                else if (normalizedKey.includes('function') || normalizedKey.includes('功能') ||
                                    normalizedKey.includes('description') || normalizedKey.includes('描述') ||
                                    normalizedKey.includes('备注') || normalizedKey.includes('note')) {
                                    funcCol = key;
                                }
                            });
                        }

                        console.log('Connlist 列识别:', { codeCol, pinCol, funcCol });

                        // Extract connector codes and pin functions
                        jsonData.forEach(row => {
                            if (codeCol) {
                                const codeValue = String(row[codeCol] || '').trim();
                                if (codeValue && codeValue !== '' && codeValue !== '-') {
                                    connectorCodes.add(codeValue);

                                    // 如果有位置号和功能列，存储pin功能映射
                                    if (pinCol && funcCol) {
                                        const pinValue = String(row[pinCol] || '').trim();
                                        const funcValue = String(row[funcCol] || '').trim();

                                        if (pinValue && pinValue !== '' && pinValue !== '-') {
                                            if (!pinFunctions[codeValue]) {
                                                pinFunctions[codeValue] = {};
                                            }
                                            // 使用功能描述作为值
                                            pinFunctions[codeValue][pinValue] = funcValue || pinValue;
                                        }
                                    }

                                    // 如果只有功能列没有位置号列，存储整个插件的功能（作为备选）
                                    if (!pinCol && funcCol) {
                                        const funcValue = String(row[funcCol] || '').trim();
                                        if (funcValue && funcValue !== '' && funcValue !== '-') {
                                            connectorFunctions[codeValue] = funcValue;
                                        }
                                    }
                                }
                            }
                        });

                        console.log(`识别到 ${connectorCodes.size} 个插件代码`);
                        console.log('插件代码示例:', Array.from(connectorCodes).slice(0, 10));
                        console.log('位置号功能映射示例:', Object.keys(pinFunctions).slice(0, 3).map(code => ({
                            code,
                            pins: pinFunctions[code]
                        })));

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }

        function findColumns(row) {
            const columns = {};

            Object.keys(row).forEach(key => {
                const normalizedKey = key.toLowerCase().trim();

                // 识别Wire ID列（回路号）
                if (normalizedKey === 'wire id' || normalizedKey === 'wireid' ||
                    (normalizedKey.includes('wire') && normalizedKey.includes('id')) ||
                    normalizedKey === 'id' || normalizedKey === '线路号' || normalizedKey === '回路号') {
                    columns.wireId = key;
                }
                // 识别线径列
                else if (normalizedKey.includes('线径') || normalizedKey.includes('wire') ||
                    normalizedKey.includes('diameter') || normalizedKey.includes('截面') ||
                    normalizedKey.includes('size') || normalizedKey.includes('gauge') ||
                    normalizedKey.includes('mm2') || normalizedKey.includes('mm²')) {
                    columns.wireDiameter = key;
                }
                // 识别电路类型列
                else if (normalizedKey.includes('电路') || normalizedKey.includes('circuit')) {
                    columns.circuitType = key;
                }
                // 识别线束类型列
                else if (normalizedKey.includes('线束') || normalizedKey.includes('harness')) {
                    columns.harnessType = key;
                }
                // 识别FROM列 - 优先匹配 "from code"，避免匹配 "from pin"
                else if (normalizedKey === 'from code' || normalizedKey === 'fromcode') {
                    columns.from = key;
                }
                else if (!columns.from && (normalizedKey === 'from' || normalizedKey === 'from设备' ||
                    normalizedKey.includes('源') || normalizedKey.includes('source'))) {
                    columns.from = key;
                }
                // 识别From Pin列
                else if (normalizedKey === 'from pin' || normalizedKey === 'frompin' ||
                    (normalizedKey.includes('from') && normalizedKey.includes('pin'))) {
                    columns.fromPin = key;
                }
                // 识别TO列 - 优先匹配 "to code"，避免匹配 "to pin"
                else if (normalizedKey === 'to code' || normalizedKey === 'tocode') {
                    columns.to = key;
                }
                else if (!columns.to && (normalizedKey === 'to' || normalizedKey === 'to设备' ||
                    normalizedKey.includes('目标') || normalizedKey.includes('destination'))) {
                    columns.to = key;
                }
                // 识别To Pin列
                else if (normalizedKey === 'to pin' || normalizedKey === 'topin' ||
                    (normalizedKey.includes('to') && normalizedKey.includes('pin'))) {
                    columns.toPin = key;
                }
            });

            return columns;
        }

        function determineConnectionType(fromCode, toCode, fromPin, toPin) {
            const fromUpper = String(fromCode).trim().toUpperCase();
            const toUpper = String(toCode).trim().toUpperCase();
            const fromPinUpper = String(fromPin).trim().toUpperCase();
            const toPinUpper = String(toPin).trim().toUpperCase();

            // 判断是否为焊点：From Pin和To Pin都是X
            const isSolderJoint = (fromPinUpper === 'X' && toPinUpper === 'X');

            // 判断FROM是否是插件
            const fromIsConnector = connectorCodes.has(fromUpper);
            // 判断TO是否是插件
            const toIsConnector = connectorCodes.has(toUpper);

            if (isSolderJoint) {
                return '焊点';
            } else if (fromIsConnector && toIsConnector) {
                return '插件对插件';
            } else if (fromIsConnector || toIsConnector) {
                return '插件';
            } else {
                return '未知';
            }
        }

        function getConnectorFunctionsForSolderJoint(fromCode, toCode) {
            // 对于焊点，查找连接的所有其他回路
            const fromUpper = String(fromCode).trim().toUpperCase();
            const toUpper = String(toCode).trim().toUpperCase();

            // 查找所有连接到这个焊点的其他回路
            const relatedWires = wirelistAllData.filter(wire => {
                const wireFromUpper = String(wire.from).trim().toUpperCase();
                const wireToUpper = String(wire.to).trim().toUpperCase();

                // 如果当前回路的FROM或TO匹配焊点的任一端
                return (wireFromUpper === fromUpper || wireFromUpper === toUpper ||
                        wireToUpper === fromUpper || wireToUpper === toUpper);
            });

            // 收集所有插件的代码
            const connectorSet = new Set();
            relatedWires.forEach(wire => {
                const wireFromUpper = String(wire.from).trim().toUpperCase();
                const wireToUpper = String(wire.to).trim().toUpperCase();

                // 检查FROM端
                if (connectorCodes.has(wireFromUpper) && wireFromUpper !== fromUpper && wireFromUpper !== toUpper) {
                    connectorSet.add(wireFromUpper);
                }

                // 检查TO端
                if (connectorCodes.has(wireToUpper) && wireToUpper !== fromUpper && wireToUpper !== toUpper) {
                    connectorSet.add(wireToUpper);
                }
            });

            // 获取这些插件的功能描述
            const functions = [];
            connectorSet.forEach(code => {
                const func = connectorFunctions[code] || code;
                functions.push(func);
            });

            return functions.length > 0 ? functions.join('、') : '无';
        }

        function processData(jsonData, columns) {
            const processed = jsonData.map((row, index) => {
                // 安全地获取Wire ID，如果列不存在则使用索引
                let wireId = `Wire${index + 1}`;
                if (columns.wireId && row[columns.wireId]) {
                    wireId = String(row[columns.wireId]);
                } else if (columns.wireDiameter && row[columns.wireDiameter]) {
                    wireId = String(row[columns.wireDiameter]);
                }

                const wireDiameter = columns.wireDiameter ? parseFloat(row[columns.wireDiameter] || 0) : 0;
                const circuitType = (columns.circuitType && row[columns.circuitType]) ? String(row[columns.circuitType]) : '未知';
                const harnessType = (columns.harnessType && row[columns.harnessType]) ? String(row[columns.harnessType]) : '默认线束';
                const fromValue = columns.from ? String(row[columns.from] || '') : '';
                const toValue = columns.to ? String(row[columns.to] || '') : '';
                const fromPinValue = columns.fromPin ? String(row[columns.fromPin] || '') : '';
                const toPinValue = columns.toPin ? String(row[columns.toPin] || '') : '';

                // FROM/TO调换逻辑：如果电器盒代码在TO位置，调换到FROM位置
                let finalFrom = fromValue;
                let finalTo = toValue;
                let finalFromPin = fromPinValue;
                let finalToPin = toPinValue;
                let swapped = false;

                // 先用原始值判断是否需要调换
                const originalFromUpper = String(fromValue).trim().toUpperCase();
                const originalToUpper = String(toValue).trim().toUpperCase();

                // 检查TO是否包含电器盒代码
                const toHasBoxCode = validCodes.some(code => originalToUpper.includes(code));
                // 检查FROM是否不包含电器盒代码
                const fromHasBoxCode = validCodes.some(code => originalFromUpper.includes(code));

                // 如果TO有电器盒代码但FROM没有，则调换
                if (toHasBoxCode && !fromHasBoxCode) {
                    finalFrom = toValue;
                    finalTo = fromValue;
                    finalFromPin = toPinValue;
                    finalToPin = fromPinValue;
                    swapped = true;
                }

                // 提取保险丝代号：取回路号前四位
                let fuseCode = '';
                if (wireId && wireId.length >= 4) {
                    fuseCode = wireId.substring(0, 4).toUpperCase();
                } else {
                    fuseCode = wireId.substring(0, 4).toUpperCase();
                }

                // 判断连接类型
                const connectionType = determineConnectionType(finalFrom, finalTo, finalFromPin, finalToPin);

                // 获取插件功能（从非电器盒端查找）- 使用调换后的值
                let connectorFunctions = '';
                const fromUpper = String(finalFrom).trim().toUpperCase();
                const toUpper = String(finalTo).trim().toUpperCase();
                const finalFromPinUpper = String(finalFromPin).trim().toUpperCase();
                const finalToPinUpper = String(finalToPin).trim().toUpperCase();

                if (connectionType === '焊点') {
                    // 对于焊点，列出所有连接到这个焊点的插件功能
                    connectorFunctions = getConnectorFunctionsForSolderJoint(finalFrom, finalTo);
                } else {
                    // 对于插件，查找非电器盒端的位置号对应的功能描述
                    let nonBoxCode = null;      // 非电器盒端的插件代码
                    let nonBoxPin = null;        // 非电器盒端的位置号

                    // 判断FROM是否为电器盒
                    const fromIsBox = validCodes.some(code => fromUpper.includes(code));
                    // 判断TO是否为电器盒
                    const toIsBox = validCodes.some(code => toUpper.includes(code));

                    // 如果FROM是非电器盒且是插件
                    if (!fromIsBox && connectorCodes.has(fromUpper)) {
                        nonBoxCode = fromUpper;
                        nonBoxPin = finalFromPinUpper;
                    }
                    // 如果TO是非电器盒且是插件
                    else if (!toIsBox && connectorCodes.has(toUpper)) {
                        nonBoxCode = toUpper;
                        nonBoxPin = finalToPinUpper;
                    }

                    // 如果找到了非电器盒端，查找位置号对应的功能
                    if (nonBoxCode && pinFunctions[nonBoxCode]) {
                        const pinFunc = pinFunctions[nonBoxCode][nonBoxPin];
                        if (pinFunc) {
                            connectorFunctions = pinFunc;
                        } else {
                            // 如果找不到位置号，尝试使用整个插件的功能描述
                            connectorFunctions = connectorFunctions[nonBoxCode] || nonBoxCode;
                        }
                    } else if (nonBoxCode) {
                        // 如果没有pin功能映射，使用整个插件的功能描述
                        connectorFunctions = connectorFunctions[nonBoxCode] || nonBoxCode;
                    } else {
                        // 如果两端都是电器盒或都不是插件，显示连接类型
                        connectorFunctions = connectionType;
                    }
                }

                // Find closest match in fuse mapping
                let fuseInfo = { rating: 'N/A', type: '未知', primary: 0 };
                let minDiff = Infinity;

                Object.entries(fuseMapping).forEach(([diameter, info]) => {
                    const diff = Math.abs(wireDiameter - parseFloat(diameter));
                    if (diff < minDiff) {
                        minDiff = diff;
                        fuseInfo = info;
                    }
                });

                // If no close match found, use default
                if (minDiff > 2) {
                    fuseInfo = { rating: '需人工确认', type: '未知', primary: 0 };
                }

                return {
                    index: index + 1,
                    wireId: wireId,
                    fuseCode: fuseCode,
                    wireDiameter: wireDiameter || 0,
                    circuitType: String(circuitType),
                    harnessType: String(harnessType),
                    from: finalFrom,
                    fromPin: finalFromPin,
                    to: finalTo,
                    toPin: finalToPin,
                    connectionType: connectionType,
                    connectorFunctions: connectorFunctions,
                    fuseRating: fuseInfo.rating,
                    fuseType: fuseInfo.type,
                    fusePrimary: fuseInfo.primary,
                    note: minDiff > 0.1 ? '接近标准规格' : '标准匹配',
                    swapped: swapped
                };
            });

            // Debug: 输出前5条数据的FROM和TO值
            console.log('前5条数据:');
            processed.slice(0, 5).forEach((item, i) => {
                console.log(`  ${i + 1}. 回路号: "${item.wireId}" | 保险丝代号: "${item.fuseCode}" | FROM: "${item.from}" (${item.fromPin}) | TO: "${item.to}" (${item.toPin}) | 连接类型: "${item.connectionType}" | 插件功能: "${item.connectorFunctions}" | 是否调换: ${item.swapped ? '是' : '否'}`);
            });

            // Filter rows to only include those with valid codes in FROM or TO
            const filtered = processed.filter(item => {
                // 去除空格并转为大写，确保匹配准确
                const fromUpper = String(item.from).trim().toUpperCase();
                const toUpper = String(item.to).trim().toUpperCase();

                // 检查是否包含任何有效代码（只要包含该字符即可）
                const matches = validCodes.some(code =>
                    fromUpper.includes(code) || toUpper.includes(code)
                );

                return matches;
            });

            // Debug: 输出过滤原因
            console.log(`\n筛选结果:`);
            console.log(`  原始数据: ${processed.length} 条`);
            console.log(`  符合条件: ${filtered.length} 条`);
            console.log(`  过滤掉: ${processed.length - filtered.length} 条`);

            // 显示一些匹配示例
            if (filtered.length > 0) {
                console.log(`\n匹配示例（前3条）:`);
                filtered.slice(0, 3).forEach((item, i) => {
                    const matchedCodes = [];
                    const fromUpper = item.from.toUpperCase();
                    const toUpper = item.to.toUpperCase();
                    validCodes.forEach(code => {
                        if (fromUpper.includes(code) || toUpper.includes(code)) {
                            matchedCodes.push(code);
                        }
                    });
                    console.log(`  ${i + 1}. 回路号: "${item.wireId}" | 保险丝代号: "${item.fuseCode}" | FROM: "${item.from}" | TO: "${item.to}" | 连接类型: "${item.connectionType}" | 插件功能: "${item.connectorFunctions}" | 匹配代码: ${matchedCodes.join(', ')}`);
                });
            }

            return filtered;
        }

        function initializeFilters() {
            filterButtons.innerHTML = '';

            // Add "全部" button
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn active';
            allBtn.innerHTML = `全部 <span class="count">${allData.length}</span>`;
            allBtn.onclick = () => applyFilter(null, allBtn);
            filterButtons.appendChild(allBtn);

            // Add box-specific buttons
            Object.entries(boxFilters).forEach(([boxName, boxInfo]) => {
                const count = countByBox(boxInfo.codes);
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.innerHTML = `${boxName} <span class="count">${count}</span>`;
                btn.onclick = () => applyFilter(boxName, btn);
                filterButtons.appendChild(btn);
            });

            filterSection.classList.add('active');
        }

        function countByBox(codes) {
            return allData.filter(item => {
                const fromUpper = String(item.from).trim().toUpperCase();
                const toUpper = String(item.to).trim().toUpperCase();

                return codes.some(code =>
                    fromUpper.includes(code) || toUpper.includes(code)
                );
            }).length;
        }

        function applyFilter(filterName, clickedBtn) {
            activeFilter = filterName;

            // Update button states
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            clickedBtn.classList.add('active');

            // Apply filter
            if (filterName === null) {
                filteredData = [...allData];
            } else {
                const codes = boxFilters[filterName].codes;
                filteredData = allData.filter(item => {
                    const fromUpper = String(item.from).trim().toUpperCase();
                    const toUpper = String(item.to).trim().toUpperCase();

                    return codes.some(code =>
                        fromUpper.includes(code) || toUpper.includes(code)
                    );
                });
            }

            console.log(`\n应用筛选: ${filterName || '全部'}`);
            console.log(`  筛选后数据: ${filteredData.length} 条`);

            displayResults();
            displayStats();
        }

        function displayResults() {
            resultsBody.innerHTML = '';

            // 检查是否有数据
            if (filteredData.length === 0) {
                resultsBody.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            没有符合条件的数据
                        </td>
                    </tr>
                `;
                resultsSection.classList.add('active');
                return;
            }

            // Group by harness type
            const grouped = {};
            filteredData.forEach(row => {
                if (!grouped[row.harnessType]) {
                    grouped[row.harnessType] = [];
                }
                grouped[row.harnessType].push(row);
            });

            Object.entries(grouped).forEach(([harnessType, rows]) => {
                // Add group header
                const headerRow = document.createElement('tr');
                headerRow.className = 'harness-group';
                headerRow.innerHTML = `
                    <td colspan="11">${harnessType} (${rows.length} 条线路)</td>
                `;
                resultsBody.appendChild(headerRow);

                // Add rows
                rows.forEach(row => {
                    const tr = document.createElement('tr');
                    const fuseClass = `fuse-${row.fusePrimary || 'unknown'}`;

                    tr.innerHTML = `
                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent-lime);">${row.fuseCode}</td>
                        <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-primary);">${row.wireId}</td>
                        <td><span class="from-to-badge">${row.from}</span></td>
                        <td><span class="from-to-badge">${row.to}</span></td>
                        <td style="font-size: 0.8rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.connectorFunctions}">${row.connectorFunctions}</td>
                        <td class="wire-diameter">${row.wireDiameter.toFixed(2)}</td>
                        <td>${row.circuitType}</td>
                        <td>${row.harnessType}</td>
                        <td><span class="fuse-badge ${fuseClass}">${row.fuseRating}</span></td>
                        <td><span class="fuse-type">${row.fuseType}</span></td>
                        <td style="color: ${row.note.includes('标准') ? 'var(--accent-lime)' : 'var(--accent-orange)'}">${row.note}</td>
                    `;
                    resultsBody.appendChild(tr);
                });
            });

            resultsSection.classList.add('active');
        }

        function displayStats() {
            const totalCircuits = filteredData.length;
            const harnessCount = new Set(filteredData.map(d => d.harnessType)).size;

            // Count fuse ratings
            const fuseCounts = {};
            filteredData.forEach(row => {
                const key = row.fusePrimary;
                fuseCounts[key] = (fuseCounts[key] || 0) + 1;
            });

            // Calculate max for distribution bars
            const maxCount = Math.max(...Object.values(fuseCounts), 1);

            // Create stats cards
            statsSection.innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">总线路数</div>
                    <div class="stat-value">${totalCircuits}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">线束类型数</div>
                    <div class="stat-value">${harnessCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">保险丝规格数</div>
                    <div class="stat-value">${Object.keys(fuseCounts).length}</div>
                </div>
            `;

            // Create distribution bars
            const sortedFuses = Object.entries(fuseCounts).sort((a, b) => a[0] - b[0]);
            distributionBars.innerHTML = sortedFuses.map(([fuse, count]) => {
                const percentage = (count / maxCount) * 100;
                const fuseClass = `fuse-${fuse}`;
                return `
                    <div class="distribution-bar">
                        <div class="bar-label">${fuse}A</div>
                        <div class="bar-track">
                            <div class="bar-fill ${fuseClass}" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
            }).join('');
        }

        function handleSort(column) {
            // Update sort direction
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            // Update header classes
            document.querySelectorAll('th.sortable').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
                if (th.dataset.column === column) {
                    th.classList.add(`sort-${currentSort.direction}`);
                }
            });

            // Sort data
            const multiplier = currentSort.direction === 'asc' ? 1 : -1;
            filteredData.sort((a, b) => {
                if (column === 'wireDiameter') {
                    return (a.wireDiameter - b.wireDiameter) * multiplier;
                } else if (column === 'fuseRating') {
                    return (a.fusePrimary - b.fusePrimary) * multiplier;
                } else {
                    return String(a[column]).localeCompare(String(b[column])) * multiplier;
                }
            });

            // Re-display
            displayResults();
        }

        function exportToExcel() {
            if (filteredData.length === 0) {
                alert('没有数据可导出');
                return;
            }

            // Prepare export data
            const exportData = filteredData.map(row => ({
                '保险丝代号': row.fuseCode,
                '回路号': row.wireId,
                'FROM': row.from,
                'TO': row.to,
                '插件功能': row.connectorFunctions,
                '线径(mm²)': row.wireDiameter,
                '电路类型': row.circuitType,
                '线束类型': row.harnessType,
                '推荐保险丝': row.fuseRating,
                '保险丝类型': row.fuseType,
                '备注': row.note
            }));

            // Create workbook
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '保险丝匹配清单');

            // Generate filename with timestamp and filter info
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const filterSuffix = activeFilter ? `_${activeFilter}` : '';
            XLSX.writeFile(wb, `保险丝匹配清单${filterSuffix}_${timestamp}.xlsx`);
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        console.log('初始化完成');
        }); // DOMContentLoaded 结束
    </script>
