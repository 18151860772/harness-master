const XLSX = require('xlsx');

console.log('========== 分析CAN总线与节点 ==========\n');

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

// 筛选Multicore ID以T开头的（V2代码逻辑）
const tMulticoreWires = data.filter(row => {
    const multicoreId = row[multicoreIdx];
    return multicoreId && multicoreId.toString().startsWith('T');
});

console.log(`Multicore ID以'T'开头的线缆: ${tMulticoreWires.length} 条\n`);

// 按Multicore ID分组
const busGroups = {};
tMulticoreWires.forEach(row => {
    const multicoreId = row[multicoreIdx];
    if (!busGroups[multicoreId]) {
        busGroups[multicoreId] = [];
    }
    busGroups[multicoreId].push(row);
});

console.log(`识别到 ${Object.keys(busGroups).length} 条'T'开头的CAN总线\n`);

// 分析每条总线
Object.keys(busGroups).sort().forEach((multicoreId) => {
    const wires = busGroups[multicoreId];
    console.log(`\n【${multicoreId}】`);
    console.log(`  线缆数: ${wires.length}`);

    // 收集Wire ID的模式
    const wireIds = wires.map(row => row[wireIdIdx]).sort();
    console.log(`  Wire IDs: ${wireIds.join(', ')}`);

    // 收集节点
    const nodes = new Map();
    wires.forEach(row => {
        const fromCode = row[fromCodeIdx];
        const fromPin = row[fromPinIdx];
        const toCode = row[toCodeIdx];
        const toPin = row[toPinIdx];
        const wireId = row[wireIdIdx];

        if (fromCode && fromPin !== 'X') {
            if (!nodes.has(fromCode)) nodes.set(fromCode, []);
            nodes.get(fromCode).push(`PIN${fromPin}(${wireId})`);
        }
        if (toCode && toPin !== 'X') {
            if (!nodes.has(toCode)) nodes.set(toCode, []);
            nodes.get(toCode).push(`PIN${toPin}(${wireId})`);
        }
    });

    console.log(`  连接节点: ${nodes.size}个`);
    Array.from(nodes.keys()).forEach(node => {
        console.log(`    ${node}: ${nodes.get(node).join(', ')}`);
    });
});

console.log('\n\n========== Wire ID 命名分析 ==========\n');

const wireIdAnalysis = new Map();
tMulticoreWires.forEach(row => {
    const wireId = row[wireIdIdx];
    const multicoreId = row[multicoreIdx];

    if (wireId && wireId.length >= 2) {
        const prefix = wireId.substring(0, 2);
        const suffix = wireId.substring(2);

        if (!wireIdAnalysis.has(prefix)) {
            wireIdAnalysis.set(prefix, { multicoreSet: new Set(), suffixSet: new Set(), examples: [] });
        }
        const info = wireIdAnalysis.get(prefix);
        info.multicoreSet.add(multicoreId);
        info.suffixSet.add(suffix);
        if (info.examples.length < 3) {
            info.examples.push(`${wireId}(${multicoreId})`);
        }
    }
});

console.log('Wire ID前缀分析:\n');
Array.from(wireIdAnalysis.keys()).sort().forEach(prefix => {
    const info = wireIdAnalysis.get(prefix);
    const suffixes = Array.from(info.suffixSet).sort();
    console.log(`【${prefix}】`);
    console.log(`  Multicore IDs: ${Array.from(info.multicoreSet).join(', ')}`);
    console.log(`  后缀类型: ${suffixes.join(', ')}`);
    console.log(`  示例: ${info.examples.join(', ')}`);
    console.log('');
});

console.log('\n========== 检查是否有CH/CL标记 ==========\n');

const hasCH = tMulticoreWires.some(row => {
    const wireId = row[wireIdIdx];
    return wireId && wireId.toString().toUpperCase().includes('CH');
});

const hasCL = tMulticoreWires.some(row => {
    const wireId = row[wireIdIdx];
    return wireId && wireId.toString().toUpperCase().includes('CL');
});

console.log(`Wire ID中包含'CH': ${hasCH ? '是' : '否'}`);
console.log(`Wire ID中包含'CL': ${hasCL ? '是' : '否'}`);

if (!hasCH && !hasCL) {
    console.log('\n⚠️  V2代码的CAN识别逻辑需要修改！');
    console.log('    当前代码期望Wire ID包含CH/CL后缀');
    console.log('    但实际数据可能使用其他命名规则');
}
