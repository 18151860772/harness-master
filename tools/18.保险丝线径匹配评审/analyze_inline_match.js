const XLSX = require('xlsx');

// 读取inline文件
const inlineWb = XLSX.readFile('inline.xlsx');
const inlineWs = inlineWb.Sheets[inlineWb.SheetNames[0]];
const inlineData = XLSX.utils.sheet_to_json(inlineWs);

// 构建inline代码集合（包含LEFT和RIGHT）
const inlineCodes = new Set();
inlineData.forEach(row => {
    const left = String(row['INLINE-LEFT'] || '').trim();
    const right = String(row['INLINE-RIGHT'] || '').trim();
    if (left) inlineCodes.add(left);
    if (right) inlineCodes.add(right);
});

console.log('Total inline codes:', inlineCodes.size);
console.log('Inline codes:', Array.from(inlineCodes).sort().join(', '));

// 读取wirelist文件
const wirelistWb = XLSX.readFile('WIRELIST-T28-0S_20240325.xlsx');
const wirelistWs = wirelistWb.Sheets[wirelistWb.SheetNames[0]];
const wirelistData = XLSX.utils.sheet_to_json(wirelistWs);

console.log('\n\n=== 分析wirelist中经过inline的回路 ===\n');

// 查找经过inline的回路
const inlineWires = [];
wirelistData.forEach((row, i) => {
    const from = String(row['From Code'] || '').trim();
    const to = String(row['To Code'] || '').trim();
    const fromPin = String(row['From Pin'] || '').trim();
    const toPin = String(row['To Pin'] || '').trim();
    const wireId = String(row['Wire ID'] || `Wire${i+1}`).trim();
    const size = row['Size / Gauge'];

    // 检查FROM或TO是否在inline列表中
    const fromInInline = inlineCodes.has(from);
    const toInInline = inlineCodes.has(to);

    if (fromInInline || toInInline) {
        inlineWires.push({
            index: i + 1,
            wireId,
            from,
            fromPin,
            to,
            toPin,
            size,
            fromInInline,
            toInInline
        });
    }
});

console.log(`Found ${inlineWires.length} wires that go through inline connectors`);
console.log(`Percentage: ${(inlineWires.length / wirelistData.length * 100).toFixed(2)}%`);

// 按inline代码分组统计
const inlineGroups = {};
inlineWires.forEach(wire => {
    // 确定哪个端子在inline中
    const inlineCode = wire.fromInInline ? wire.from : wire.to;
    if (!inlineGroups[inlineCode]) {
        inlineGroups[inlineCode] = [];
    }
    inlineGroups[inlineCode].push(wire);
});

console.log('\n\n=== 按inline代码分组统计（前20个） ===\n');
Object.entries(inlineGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .forEach(([code, wires]) => {
        console.log(`\n${code} (${wires.length} wires):`);
        wires.slice(0, 5).forEach(w => {
            console.log(`  - ${w.wireId}: ${w.from}(${w.fromPin}) -> ${w.to}(${w.toPin}) [${w.size}mm²]`);
        });
        if (wires.length > 5) {
            console.log(`  ... and ${wires.length - 5} more`);
        }
    });

// 分析相同保险丝的情况
console.log('\n\n=== 相同inline保险丝分析 ===\n');

// 统计经过同一inline的回路的线径分布
Object.entries(inlineGroups)
    .filter(([_, wires]) => wires.length >= 2)  // 至少2条回路
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([code, wires]) => {
        // 统计线径分布
        const sizeDistribution = {};
        wires.forEach(w => {
            const size = w.size || 0;
            sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
        });

        console.log(`\n${code} (${wires.length} wires):`);
        Object.entries(sizeDistribution)
            .sort((a, b) => b[0] - a[0])  // 按线径降序
            .forEach(([size, count]) => {
                console.log(`  ${size}mm²: ${count} wires`);
            });
    });
