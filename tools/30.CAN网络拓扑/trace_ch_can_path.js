const XLSX = require('xlsx');

console.log('========== CH CAN 连接路径追踪 ==========\n');

const workbook = XLSX.readFile('WIRELIST.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const headers = jsonData[0];
const data = jsonData.slice(1);

// 找到列索引
const multicoreIdx = headers.findIndex(h => h && h.toString().includes('Multicore'));
const wireIdIdx = headers.findIndex(h => h && h.toString().includes('Wire ID'));
const fromCodeIdx = headers.findIndex(h => h && h.toString().includes('From Code'));
const fromPinIdx = headers.findIndex(h => h && h.toString().includes('From Pin'));
const toCodeIdx = headers.findIndex(h => h && h.toString().includes('To Code'));
const toPinIdx = headers.findIndex(h => h && h.toString().includes('To Pin'));

// 筛选CH CAN线缆
const chCanWires = data.filter(row => {
    const wireId = row[wireIdIdx];
    const multicoreId = row[multicoreIdx];
    return wireId && wireId.toString().startsWith('CH') && multicoreId && multicoreId.toString().startsWith('T');
});

// 按Multicore ID分组
const busGroups = {};
chCanWires.forEach(row => {
    const multicoreId = row[multicoreIdx];
    if (!busGroups[multicoreId]) {
        busGroups[multicoreId] = [];
    }
    busGroups[multicoreId].push(row);
});

// 追踪每条总线的连接路径
function traceBusPath(multicoreId) {
    const wires = busGroups[multicoreId];
    const highWire = wires.find(row => row[wireIdIdx].includes('CHCH'));
    const lowWire = wires.find(row => row[wireIdIdx].includes('CHCL'));

    const path = {
        multicoreId,
        highWireId: highWire ? highWire[wireIdIdx] : 'N/A',
        lowWireId: lowWire ? lowWire[wireIdIdx] : 'N/A',
        connections: []
    };

    // 追踪CAN High路径
    if (highWire) {
        const highPath = traceWirePath(highWire, 'H');
        path.connections.push(...highPath);
    }

    // 追踪CAN Low路径
    if (lowWire) {
        const lowPath = traceWirePath(lowWire, 'L');
        path.connections.push(...lowPath);
    }

    return path;
}

// 追踪单根线的路径
function traceWirePath(wire, signalType) {
    const fromCode = wire[fromCodeIdx];
    const fromPin = wire[fromPinIdx];
    const toCode = wire[toCodeIdx];
    const toPin = wire[toPinIdx];
    const wireId = wire[wireIdIdx];

    const connections = [];

    // From端
    if (fromPin === 'X') {
        connections.push({
            type: 'solder',
            code: fromCode,
            signal: signalType,
            wire: wireId,
            pin: 'X'
        });
    } else if (fromCode) {
        connections.push({
            type: 'connector',
            code: fromCode,
            signal: signalType,
            wire: wireId,
            pin: fromPin
        });
    }

    // To端
    if (toPin === 'X') {
        connections.push({
            type: 'solder',
            code: toCode,
            signal: signalType,
            wire: wireId,
            pin: 'X'
        });
    } else if (toCode) {
        connections.push({
            type: 'connector',
            code: toCode,
            signal: signalType,
            wire: wireId,
            pin: toPin
        });
    }

    return connections;
}

// 按焊点分组，构建路径树
function buildPathTree() {
    const solderMap = new Map(); // 焊点 -> 连接的节点和其他焊点

    // 收集所有涉及CH CAN的焊点
    const allSolders = new Set();
    chCanWires.forEach(row => {
        if (row[fromPinIdx] === 'X') allSolders.add(row[fromCodeIdx]);
        if (row[toPinIdx] === 'X') allSolders.add(row[toCodeIdx]);
    });

    // 为每个焊点找出连接关系
    allSolders.forEach(solder => {
        const connections = [];

        chCanWires.forEach(row => {
            const fromCode = row[fromCodeIdx];
            const fromPin = row[fromPinIdx];
            const toCode = row[toCodeIdx];
            const toPin = row[toPinIdx];
            const wireId = row[wireIdIdx];
            const signalType = wireId.includes('CHCH') ? 'H' : 'L';

            // From端
            if (fromCode === solder) {
                if (toPin === 'X') {
                    connections.push({ type: 'solder', code: toCode, signal: signalType, wire: wireId });
                } else if (toCode) {
                    connections.push({ type: 'node', code: toCode, pin: toPin, signal: signalType, wire: wireId });
                }
            }

            // To端
            if (toCode === solder) {
                if (fromPin === 'X') {
                    connections.push({ type: 'solder', code: fromCode, signal: signalType, wire: wireId });
                } else if (fromCode) {
                    connections.push({ type: 'node', code: fromCode, pin: fromPin, signal: signalType, wire: wireId });
                }
            }
        });

        solderMap.set(solder, connections);
    });

    return solderMap;
}

// 构建路径树
const solderMap = buildPathTree();

// 找出核心焊点（连接点数>2）
const coreSolderPoints = [];
solderMap.forEach((conns, solder) => {
    if (conns.length > 2) {
        coreSolderPoints.push({ solder, count: conns.length, connections: conns });
    }
});

coreSolderPoints.sort((a, b) => b.count - a.count);

console.log('========== 核心汇流点（连接数>2） ==========\n');
coreSolderPoints.forEach(({ solder, count, connections }) => {
    console.log(`【${solder}】连接 ${count} 个端点:`);
    connections.forEach(conn => {
        if (conn.type === 'solder') {
            console.log(`  └─> 焊点 ${conn.code} (${conn.signal}): ${conn.wire}`);
        } else {
            console.log(`  └─> 节点 ${conn.code} PIN${conn.pin} (${conn.signal}): ${conn.wire}`);
        }
    });
    console.log('');
});

// 展示典型路径
console.log('\n========== 典型连接路径示例 ==========\n');

// T10路径
console.log('【T10】CHCH05/CHCL05 (OBD2诊断口):');
const t10 = traceBusPath('T10');
console.log(`  CAN High: ${t10.highWireId}`);
t10.connections.filter(c => c.signal === 'H').forEach(c => {
    if (c.type === 'solder') {
        console.log(`    └─> 焊点 ${c.code} (PIN${c.pin})`);
    } else {
        console.log(`    └─> 节点 ${c.code} (PIN${c.pin})`);
    }
});
console.log(`  CAN Low: ${t10.lowWireId}`);
t10.connections.filter(c => c.signal === 'L').forEach(c => {
    if (c.type === 'solder') {
        console.log(`    └─> 焊点 ${c.code} (PIN${c.pin})`);
    } else {
        console.log(`    └─> 节点 ${c.code} (PIN${c.pin})`);
    }
});
console.log('');

// T13路径 (ESP2)
console.log('【T13】CHCH10/CHCL10 (ESP2电子稳定程序):');
const t13 = traceBusPath('T13');
console.log(`  CAN High: ${t13.highWireId}`);
t13.connections.filter(c => c.signal === 'H').forEach(c => {
    if (c.type === 'solder') {
        console.log(`    └─> 焊点 ${c.code} (PIN${c.pin})`);
    } else {
        console.log(`    └─> 节点 ${c.code} (PIN${c.pin})`);
    }
});
console.log(`  CAN Low: ${t13.lowWireId}`);
t13.connections.filter(c => c.signal === 'L').forEach(c => {
    if (c.type === 'solder') {
        console.log(`    └─> 焊点 ${c.code} (PIN${c.pin})`);
    } else {
        console.log(`    └─> 节点 ${c.code} (PIN${c.pin})`);
    }
});
console.log('');

// EPSS的三条分支
console.log('【EPSS电子助力转向】连接3条CH CAN分支:');
['T128', 'T228', 'T328'].forEach(busId => {
    const bus = traceBusPath(busId);
    console.log(`  ${busId} (${bus.highWireId}/${bus.lowWireId}):`);
    bus.connections.forEach(c => {
        if (c.type === 'solder') {
            console.log(`    └─> 焊点 ${c.code} (${c.signal})`);
        } else {
            console.log(`    └─> 节点 ${c.code} PIN${c.pin} (${c.signal})`);
        }
    });
});
console.log('');

// 可视化BDSC33/BDSC34汇流点
console.log('【BDSC33/BDSC34】右侧分支汇流点:');
if (solderMap.has('BDSC33')) {
    console.log('  BDSC33 (CAN High汇流):');
    solderMap.get('BDSC33').filter(c => c.signal === 'H').forEach(c => {
        if (c.type === 'solder') {
            console.log(`    └─> 焊点 ${c.code}: ${c.wire}`);
        } else {
            console.log(`    └─> 节点 ${c.code} PIN${c.pin}: ${c.wire}`);
        }
    });
}
if (solderMap.has('BDSC34')) {
    console.log('  BDSC34 (CAN Low汇流):');
    solderMap.get('BDSC34').filter(c => c.signal === 'L').forEach(c => {
        if (c.type === 'solder') {
            console.log(`    └─> 焊点 ${c.code}: ${c.wire}`);
        } else {
            console.log(`    └─> 节点 ${c.code} PIN${c.pin}: ${c.wire}`);
        }
    });
}
