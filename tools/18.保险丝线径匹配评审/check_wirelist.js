const XLSX = require('xlsx');

// 读取wirelist文件
const wb = XLSX.readFile('WIRELIST-T28-0S_20240325.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Wirelist total rows:', data.length);
console.log('\nColumn names:', Object.keys(data[0]));
console.log('\nFirst 30 rows (showing FROM, TO, From Pin, To Pin):');
data.slice(0, 30).forEach((r, i) => {
    const from = r['From Code'] || r['FROM'] || '';
    const to = r['To Code'] || r['TO'] || '';
    const fromPin = r['From Pin'] || '';
    const toPin = r['To Pin'] || '';
    console.log(`${i+1}. FROM: ${from} (${fromPin}) -> TO: ${to} (${toPin})`);
});

// 检查是否有inline相关的代码
console.log('\n\nSearching for inline codes (BD*, IP*, etc.) in FROM/TO columns:');
const inlineMatches = [];
data.forEach((r, i) => {
    const from = String(r['From Code'] || r['FROM'] || '').trim();
    const to = String(r['To Code'] || r['TO'] || '').trim();

    // 检查是否包含inline前缀
    const inlinePrefixes = ['BD', 'BT', 'IP', 'EG', 'FL', 'FR', 'TR', 'RL', 'RR', 'RF'];
    const fromHasInline = inlinePrefixes.some(p => from.startsWith(p));
    const toHasInline = inlinePrefixes.some(p => to.startsWith(p));

    if (fromHasInline || toHasInline) {
        inlineMatches.push({ index: i+1, from, to });
    }
});

console.log(`Found ${inlineMatches.length} rows with inline codes`);
console.log('\nFirst 20 inline matches:');
inlineMatches.slice(0, 20).forEach(m => {
    console.log(`Row ${m.index}: ${m.from} -> ${m.to}`);
});
