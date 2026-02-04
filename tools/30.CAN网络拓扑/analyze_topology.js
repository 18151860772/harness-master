const XLSX = require('xlsx');

console.log('========== 分析总线与节点关系 ==========\n');

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

console.log('列索引:');
console.log(`  Multicore ID: ${multicoreIdx}`);
console.log(`  Wire ID: ${wireIdIdx}`);
console.log(`  From Code: ${fromCodeIdx}, From Pin: ${fromPinIdx}`);
console.log(`  To Code: ${toCodeIdx}, To Pin: ${toPinIdx}\n`);

// 筛选有Multicore ID的行（总线）
const busWires = data.filter(row => {
    const multicoreId = row[multicoreIdx];
    return multicoreId && multicoreId.toString().trim() !== '';
});

console.log(`总共有 ${busWires.length} 条线属于Multicore（总线）\n`);

// 按Multicore ID分组
const busGroups = {};
busWires.forEach(row => {
    const multicoreId = row[multicoreIdx];
    if (!busGroups[multicoreId]) {
        busGroups[multicoreId] = [];
    }
    busGroups[multicoreId].push(row);
});

console.log(`总共有 ${Object.keys(busGroups).length} 条Multicore总线\n`);
console.log('========== 每条总线的详细信息 ==========\n');

// 分析每条总线
Object.keys(busGroups).sort().forEach((multicoreId, idx) => {
    const wires = busGroups[multicoreId];
    console.log(`【总线 ${idx + 1}】${multicoreId}`);
    console.log(`  线缆数量: ${wires.length}`);

    // 收集所有连接的节点
    const nodes = new Map(); // code -> {pins: Set(), type: 'connector'|'solder'}

    wires.forEach(row => {
        const fromCode = row[fromCodeIdx];
        const fromPin = row[fromPinIdx];
        const toCode = row[toCodeIdx];
        const toPin = row[toPinIdx];
        const wireId = row[wireIdIdx];

        // 处理From端
        if (fromCode) {
            if (!nodes.has(fromCode)) {
                nodes.set(fromCode, { pins: new Set(), wires: new Set() });
            }
            if (fromPin !== 'X') {
                nodes.get(fromCode).pins.add(`${fromPin}(${wireId})`);
            }
            nodes.get(fromCode).wires.add(wireId);
        }

        // 处理To端
        if (toCode) {
            if (!nodes.has(toCode)) {
                nodes.set(toCode, { pins: new Set(), wires: new Set() });
            }
            if (toPin !== 'X') {
                nodes.get(toCode).pins.add(`${toPin}(${wireId})`);
            }
            nodes.get(toCode).wires.add(wireId);
        }
    });

    console.log(`  连接节点数: ${nodes.size}`);
    console.log(`  节点列表:`);

    Array.from(nodes.keys()).sort().forEach(nodeCode => {
        const node = nodes.get(nodeCode);
        const pinList = Array.from(node.pins).sort();
        const wireList = Array.from(node.wires).sort();
        console.log(`    - ${nodeCode}`);
        console.log(`      PIN: ${pinList.join(', ')}`);
        console.log(`      线缆: ${wireList.join(', ')}`);
    });

    console.log('');
});

// 特别分析：查看Wire ID的命名模式
console.log('\n========== Wire ID 命名模式分析 ==========\n');

const wireIdPatterns = new Map();
busWires.forEach(row => {
    const wireId = row[wireIdIdx];
    const multicoreId = row[multicoreIdx];

    if (wireId && wireId.length >= 2) {
        // 取前两个字符作为"类型"
        const prefix = wireId.substring(0, 2);
        const suffix = wireId.substring(2);

        if (!wireIdPatterns.has(prefix)) {
            wireIdPatterns.set(prefix, new Set());
        }
        wireIdPatterns.get(prefix).add({
            wireId: wireId,
            multicore: multicoreId,
            suffix: suffix
        });
    }
});

console.log('Wire ID 前缀分组（可能是CAN类型）:\n');
Array.from(wireIdPatterns.keys()).sort().forEach(prefix => {
    const items = Array.from(wireIdPatterns.get(prefix));
    const multicoreSet = new Set(items.map(i => i.multicore));
    const suffixSet = new Set(items.map(i => i.suffix));

    console.log(`【${prefix}】`);
    console.log(`  所属总线: ${Array.from(multicoreSet).join(', ')}`);
    console.log(`  后缀模式: ${Array.from(suffixSet).join(', ')}`);
    console.log(`  示例Wire ID: ${items.slice(0, 5).map(i => i.wireId).join(', ')}`);
    console.log('');
});

// 分析是否有CAN High/Low的命名模式
console.log('\n========== 查找 CAN High/Low 模式 ==========\n');

const possibleCANHigh = [];
const possibleCANLow = [];

busWires.forEach(row => {
    const wireId = row[wireIdIdx];
    const wireIdStr = wireId ? wireId.toString().toUpperCase() : '';

    // 检查是否包含CH或CL
    if (wireIdStr.includes('CH')) {
        possibleCANHigh.push({
            wireId: wireId,
            multicore: row[multicoreIdx],
            from: `${row[fromCodeIdx]}:${row[fromPinIdx]}`,
            to: `${row[toCodeIdx]}:${row[toPinIdx]}`
        });
    }
    if (wireIdStr.includes('CL')) {
        possibleCANLow.push({
            wireId: wireId,
            multicore: row[multicoreIdx],
            from: `${row[fromCodeIdx]}:${row[fromPinIdx]}`,
            to: `${row[toCodeIdx]}:${row[toPinIdx]}`
        });
    }
});

console.log(`可能的CAN High线（包含CH）: ${possibleCANHigh.length} 条`);
if (possibleCANHigh.length > 0) {
    console.log('示例:');
    possibleCANHigh.slice(0, 5).forEach(item => {
        console.log(`  ${item.wireId} (${item.multicore}): ${item.from} -> ${item.to}`);
    });
}

console.log(`\n可能的CAN Low线（包含CL）: ${possibleCANLow.length} 条`);
if (possibleCANLow.length > 0) {
    console.log('示例:');
    possibleCANLow.slice(0, 5).forEach(item => {
        console.log(`  ${item.wireId} (${item.multicore}): ${item.from} -> ${item.to}`);
    });
}

if (possibleCANHigh.length === 0 && possibleCANLow.length === 0) {
    console.log('❌ 未找到CH/CL命名模式的Wire ID');
    console.log('\n💡 建议：需要确认Wire ID中CAN High和CAN Low的命名规则');
}
