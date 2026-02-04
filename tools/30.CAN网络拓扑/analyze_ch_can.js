const XLSX = require('xlsx');

console.log('========== CH CAN (车身CAN) 节点分析 ==========\n');

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

// 筛选Wire ID以CH开头的（CH CAN）
const chCanWires = data.filter(row => {
    const wireId = row[wireIdIdx];
    const multicoreId = row[multicoreIdx];
    return wireId && wireId.toString().startsWith('CH') && multicoreId && multicoreId.toString().startsWith('T');
});

console.log(`CH CAN线缆总数: ${chCanWires.length} 条\n`);

// 按Multicore ID分组
const busGroups = {};
chCanWires.forEach(row => {
    const multicoreId = row[multicoreIdx];
    if (!busGroups[multicoreId]) {
        busGroups[multicoreId] = [];
    }
    busGroups[multicoreId].push(row);
});

console.log(`CH CAN总线数量: ${Object.keys(busGroups).length} 条\n`);

// 分析每条总线
const allNodes = new Map(); // 统计所有节点及其连接的CAN线

Object.keys(busGroups).sort().forEach((multicoreId) => {
    const wires = busGroups[multicoreId];

    console.log(`\n【${multicoreId}】`);

    // 显示Wire ID
    const wireIds = wires.map(row => row[wireIdIdx]).sort();
    console.log(`  Wire IDs: ${wireIds.join(', ')}`);

    // 收集节点
    const nodes = new Map();
    const solders = new Set();

    wires.forEach(row => {
        const fromCode = row[fromCodeIdx];
        const fromPin = row[fromPinIdx];
        const toCode = row[toCodeIdx];
        const toPin = row[toPinIdx];
        const wireId = row[wireIdIdx];

        // From端
        if (fromCode) {
            if (fromPin === 'X') {
                solders.add(fromCode);
            } else {
                if (!nodes.has(fromCode)) nodes.set(fromCode, { pins: [] });
                nodes.get(fromCode).pins.push(`PIN${fromPin}(${wireId})`);
            }
        }

        // To端
        if (toCode) {
            if (toPin === 'X') {
                solders.add(toCode);
            } else {
                if (!nodes.has(toCode)) nodes.set(toCode, { pins: [] });
                nodes.get(toCode).pins.push(`PIN${toPin}(${wireId})`);
            }
        }
    });

    // 显示连接的节点
    if (nodes.size > 0) {
        console.log(`  连接节点: ${nodes.size}个`);
        Array.from(nodes.keys()).sort().forEach(node => {
            const pins = nodes.get(node).pins;
            console.log(`    ${node}: ${pins.join(', ')}`);

            // 统计到全局
            if (!allNodes.has(node)) {
                allNodes.set(node, new Set());
            }
            allNodes.get(node).add(multicoreId);
        });
    }

    // 显示焊点
    if (solders.size > 0) {
        console.log(`  焊点: ${Array.from(solders).join(', ')}`);
    }
});

// 汇总所有节点
console.log('\n\n========== CH CAN 节点汇总 ==========\n');
console.log(`总共有 ${allNodes.size} 个节点连接到CH CAN\n`);

// 按连接的CAN线数量分组
const nodeByCanCount = {};
allNodes.forEach((canSet, node) => {
    const count = canSet.size;
    if (!nodeByCanCount[count]) {
        nodeByCanCount[count] = [];
    }
    nodeByCanCount[count].push({ node, cans: Array.from(canSet).sort() });
});

Object.keys(nodeByCanCount).sort((a, b) => b - a).forEach(count => {
    const nodes = nodeByCanCount[count];
    console.log(`连接到 ${count} 条CH CAN的节点 (${nodes.length}个):`);
    nodes.sort((a, b) => a.node.localeCompare(b.node)).forEach(({ node, cans }) => {
        console.log(`  ${node}: [${cans.join(', ')}]`);
    });
    console.log('');
});
