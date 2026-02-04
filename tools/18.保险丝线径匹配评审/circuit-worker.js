// circuit-worker.js - Web Worker后台处理线程
// 用于提升同一回路查找的性能

self.onmessage = function(e) {
    const { type, data } = e.data;

    switch (type) {
        case 'BUILD_INDEXES':
            buildIndexes(data);
            break;
        case 'FIND_CONNECTORS':
            findConnectors(data);
            break;
        case 'BATCH_FIND':
            batchFindConnectors(data);
            break;
        default:
            console.error('Unknown message type:', type);
    }
};

// 全局数据
let wirelistData = [];
let wirelistFromIndex = {};
let wirelistToIndex = {};
let connectorFunctions = {};
let inlineLeftToRight = {};
let inlineRightToLeft = {};

// 构建索引
function buildIndexes({ wirelist, connectors, inlineMap }) {
    console.log('[Worker] 开始构建索引...');

    wirelistData = wirelist;
    connectorFunctions = connectors;
    inlineLeftToRight = inlineMap.inlineLeftToRight || {};
    inlineRightToLeft = inlineMap.inlineRightToLeft || {};

    const startTime = performance.now();

    // 构建索引
    wirelistFromIndex = {};
    wirelistToIndex = {};

    for (let i = 0; i < wirelistData.length; i++) {
        const wire = wirelistData[i];
        const fromUpper = String(wire.from || '').trim().toUpperCase();
        const toUpper = String(wire.to || '').trim().toUpperCase();

        if (!wirelistFromIndex[fromUpper]) {
            wirelistFromIndex[fromUpper] = [];
        }
        wirelistFromIndex[fromUpper].push(i);

        if (!wirelistToIndex[toUpper]) {
            wirelistToIndex[toUpper] = [];
        }
        wirelistToIndex[toUpper].push(i);
    }

    const endTime = performance.now();
    console.log(`[Worker] 索引构建完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

    self.postMessage({
        type: 'INDEXES_BUILT',
        data: {
            fromIndexSize: Object.keys(wirelistFromIndex).length,
            toIndexSize: Object.keys(wirelistToIndex).length,
            time: endTime - startTime
        }
    });
}

// 查找单个保险丝的所有连接
function findConnectors({ startCode, startPin }) {
    const connectors = findAllConnectorsInSameCircuit(startCode, startPin);

    self.postMessage({
        type: 'CONNECTORS_FOUND',
        data: {
            startCode,
            connectors
        }
    });
}

// 批量查找多个保险丝的连接
function batchFindConnectors({ requests }) {
    console.log(`[Worker] 开始批量查找 ${requests.length} 个保险丝...`);
    const startTime = performance.now();

    const results = [];

    for (let i = 0; i < requests.length; i++) {
        const { startCode, startPin, wireId } = requests[i];

        try {
            const connectors = findAllConnectorsInSameCircuit(startCode, startPin);
            results.push({
                wireId,
                startCode,
                connectors,
                success: true
            });
        } catch (error) {
            results.push({
                wireId,
                startCode,
                connectors: [],
                success: false,
                error: error.message
            });
        }

        // 每处理100个报告一次进度
        if ((i + 1) % 100 === 0) {
            self.postMessage({
                type: 'PROGRESS',
                data: {
                    processed: i + 1,
                    total: requests.length,
                    percentage: Math.round(((i + 1) / requests.length) * 100)
                }
            });
        }
    }

    const endTime = performance.now();
    console.log(`[Worker] 批量查找完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

    self.postMessage({
        type: 'BATCH_COMPLETED',
        data: {
            results,
            time: endTime - startTime
        }
    });
}

// 核心查找函数
function findAllConnectorsInSameCircuit(startCode, startPin) {
    const connectors = [];
    const startCodeUpper = String(startCode).trim().toUpperCase();
    const visited = new Set();
    const maxDepth = 5;

    function dfs(code, depth) {
        if (depth > maxDepth) return;
        if (visited.has(code)) return;

        visited.add(code);

        // 使用索引查找
        const wireIndexes = wirelistFromIndex[code] || [];

        for (let i = 0; i < wireIndexes.length; i++) {
            const wire = wirelistData[wireIndexes[i]];
            const wireTo = String(wire.to || '').trim();
            const wireToPin = String(wire.toPin || '').trim();
            const normalizedTo = wireTo.replace(/\s+/g, '').toUpperCase();

            // 情况1: TO端在connlist中
            if (connectorFunctions[normalizedTo]) {
                const connectorWithPin = wireToPin && wireToPin !== ''
                    ? `${wireTo}-${wireToPin}`
                    : wireTo;

                if (!connectors.includes(connectorWithPin)) {
                    connectors.push(connectorWithPin);
                }
            }

            // 情况2: TO端是焊点
            else if (wireToPin === 'X') {
                const solderWireIndexes = wirelistToIndex[normalizedTo] || [];

                for (let j = 0; j < solderWireIndexes.length; j++) {
                    const sw = wirelistData[solderWireIndexes[j]];
                    const swToPin = String(sw.toPin || '').trim().toUpperCase();

                    if (swToPin !== 'X') continue;

                    const swFrom = String(sw.from || '').trim();
                    const swFromPin = String(sw.fromPin || '').trim();
                    dfs(swFrom, depth + 1);
                }
            }

            // 情况3: TO端在inline表中
            else if (inlineLeftToRight[normalizedTo] || inlineRightToLeft[normalizedTo]) {
                const inlineOtherEnd = inlineLeftToRight[normalizedTo] || inlineRightToLeft[normalizedTo];
                const inlineWireIndexes = wirelistFromIndex[inlineOtherEnd] || [];

                for (let j = 0; j < inlineWireIndexes.length; j++) {
                    const iw = wirelistData[inlineWireIndexes[j]];
                    const iwFrom = String(iw.from || '').trim();
                    const iwFromPin = String(iw.fromPin || '').trim();
                    dfs(iwFrom, depth + 1);
                }
            }
        }
    }

    dfs(startCodeUpper, 0);
    return connectors;
}
