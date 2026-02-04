const XLSX = require('xlsx');

// 读取inline文件
const inlineWb = XLSX.readFile('inline.xlsx');
const inlineWs = inlineWb.Sheets[inlineWb.SheetNames[0]];
const inlineData = XLSX.utils.sheet_to_json(inlineWs);

// 构建inline映射
const inlineMapping = {};
inlineData.forEach(row => {
    const left = String(row['INLINE-LEFT'] || '').trim().toUpperCase();
    const right = String(row['INLINE-RIGHT'] || '').trim().toUpperCase();
    if (left && right) {
        inlineMapping[left] = right;
        inlineMapping[right] = left;
    }
});

console.log('=== Inline映射关系 ===');
console.log(`总共 ${Object.keys(inlineMapping).length / 2} 对inline连接`);

// 读取wirelist文件
const wirelistWb = XLSX.readFile('WIRELIST-T28-0S_20240325.xlsx');
const wirelistWs = wirelistWb.Sheets[wirelistWb.SheetNames[0]];
const wirelistData = XLSX.utils.sheet_to_json(wirelistWs);

console.log('\n=== 测试Inline展开功能 ===\n');

// 查找TO在inline表中的回路
const testCases = [];
wirelistData.forEach((row, index) => {
    const to = String(row['To Code'] || '').trim().toUpperCase();
    const toPin = String(row['To Pin'] || '').trim();
    const from = String(row['From Code'] || '').trim().toUpperCase();
    const fromPin = String(row['From Pin'] || '').trim();
    const wireId = String(row['Wire ID'] || `Wire${index + 1}`);

    // 检查TO是否在inline中
    if (inlineMapping[to]) {
        testCases.push({
            wireId,
            from,
            fromPin,
            to,
            toPin,
            inlineTarget: inlineMapping[to]
        });
    }
});

console.log(`找到 ${testCases.length} 个TO在inline表中的回路\n`);

// 测试前10个案例
console.log('=== 前10个测试案例 ===\n');

testCases.slice(0, 10).forEach((testCase, i) => {
    console.log(`案例 ${i + 1}:`);
    console.log(`  回路: ${testCase.wireId}`);
    console.log(`  FROM: ${testCase.from}(${testCase.fromPin})`);
    console.log(`  TO: ${testCase.to}(${testCase.toPin})`);
    console.log(`  Inline映射: ${testCase.to} <-> ${testCase.inlineTarget}`);

    // 查找连接到inline目标端的回路
    const connectedWires = [];
    wirelistData.forEach((wire, idx) => {
        const wireFrom = String(wire['From Code'] || '').trim().toUpperCase();
        const wireTo = String(wire['To Code'] || '').trim().toUpperCase();
        const wireFromPin = String(wire['From Pin'] || '').trim();
        const wireToPin = String(wire['To Pin'] || '').trim();

        // 情况1: FROM = inline目标 且 FromPin = 目标Pin
        if (wireFrom === testCase.inlineTarget && wireFromPin === testCase.toPin) {
            const otherEnd = wireTo;
            if (otherEnd && otherEnd !== testCase.from && otherEnd !== testCase.inlineTarget) {
                const displayFormat = wireToPin ? `${otherEnd}-${wireToPin}` : otherEnd;
                connectedWires.push({
                    code: otherEnd,
                    pin: wireToPin,
                    display: displayFormat,
                    wireId: wire['Wire ID']
                });
            }
        }

        // 情况2: TO = inline目标 且 ToPin = 目标Pin
        if (wireTo === testCase.inlineTarget && wireToPin === testCase.toPin) {
            const otherEnd = wireFrom;
            if (otherEnd && otherEnd !== testCase.from && otherEnd !== testCase.inlineTarget) {
                const displayFormat = wireFromPin ? `${otherEnd}-${wireFromPin}` : otherEnd;
                connectedWires.push({
                    code: otherEnd,
                    pin: wireFromPin,
                    display: displayFormat,
                    wireId: wire['Wire ID']
                });
            }
        }
    });

    // 去重
    const uniqueConnected = [];
    const seen = new Set();
    connectedWires.forEach(w => {
        if (!seen.has(w.display)) {
            seen.add(w.display);
            uniqueConnected.push(w);
        }
    });

    console.log(`  Inline展开结果 (${uniqueConnected.length} 个连接):`);
    if (uniqueConnected.length > 0) {
        uniqueConnected.forEach(w => {
            console.log(`    - ${w.display} (回路: ${w.wireId})`);
        });
    } else {
        console.log(`    (无连接)`);
    }
    console.log('');
});

// 统计
console.log('\n=== 统计信息 ===\n');
const withConnections = testCases.filter(tc => {
    const connectedWires = [];
    wirelistData.forEach(wire => {
        const wireFrom = String(wire['From Code'] || '').trim().toUpperCase();
        const wireTo = String(wire['To Code'] || '').trim().toUpperCase();
        const wireFromPin = String(wire['From Pin'] || '').trim();
        const wireToPin = String(wire['To Pin'] || '').trim();

        if ((wireFrom === tc.inlineTarget && wireFromPin === tc.toPin) ||
            (wireTo === tc.inlineTarget && wireToPin === tc.toPin)) {
            const otherEnd = wireFrom === tc.inlineTarget ? wireTo : wireFrom;
            if (otherEnd && otherEnd !== tc.from && otherEnd !== tc.inlineTarget) {
                connectedWires.push(otherEnd);
            }
        }
    });
    return connectedWires.length > 0;
});

console.log(`总inline连接数: ${testCases.length}`);
console.log(`有后续连接的: ${withConnections.length}`);
console.log(`无后续连接的: ${testCases.length - withConnections.length}`);
console.log(`连接率: ${(withConnections.length / testCases.length * 100).toFixed(2)}%`);
