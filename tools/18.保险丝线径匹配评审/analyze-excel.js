const XLSX = require('xlsx');

const filePath = 'C:\\Users\\HP\\Desktop\\tools\\保险丝线径匹配评审\\WIRELIST-T28-0S_20240325.xlsx';

const workbook = XLSX.readFile(filePath);
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(firstSheet);

console.log('========================================');
console.log('详细数据分析');
console.log('========================================\n');

console.log('列名:', Object.keys(jsonData[0]).join('\n     '));
console.log('');

console.log('前10条完整数据:');
jsonData.slice(0, 10).forEach((row, i) => {
    console.log(`\n${i + 1}. Wire ID: ${row['Wire ID']}`);
    console.log(`   From Code: "${row['From Code']}"`);
    console.log(`   From Pin: "${row['From Pin']}"`);
    console.log(`   To Code: "${row['To Code']}"`);
    console.log(`   To Pin: "${row['To Pin']}"`);
    console.log(`   Size / Gauge: ${row['Size / Gauge']}`);
});

console.log('\n\n========================================');
console.log('From Code 列的唯一值 (前50个):');
console.log('========================================');
const uniqueFromCodes = [...new Set(jsonData.map(row => row['From Code']))];
console.log(`总共有 ${uniqueFromCodes.length} 个不同的From Code`);
console.log('\n前50个:');
uniqueFromCodes.slice(0, 50).forEach(code => {
    console.log(`  - "${code}"`);
});

console.log('\n\n========================================');
console.log('To Code 列的唯一值 (前50个):');
console.log('========================================');
const uniqueToCodes = [...new Set(jsonData.map(row => row['To Code']))];
console.log(`总共有 ${uniqueToCodes.length} 个不同的To Code`);
console.log('\n前50个:');
uniqueToCodes.slice(0, 50).forEach(code => {
    console.log(`  - "${code}"`);
});

console.log('\n\n========================================');
console.log('包含有效代码的行:');
console.log('========================================');
const validCodes = ['UEC', 'IEC', 'PFB', 'FFB', 'IPFB', 'TFB', 'REC'];
let matchCount = 0;
const matches = [];

jsonData.forEach((row, index) => {
    const fromCode = String(row['From Code'] || '').trim().toUpperCase();
    const toCode = String(row['To Code'] || '').trim().toUpperCase();

    const matchedCodes = [];
    validCodes.forEach(code => {
        if (fromCode.includes(code) || toCode.includes(code)) {
            matchedCodes.push(code);
        }
    });

    if (matchedCodes.length > 0) {
        matchCount++;
        if (matches.length < 20) {
            matches.push({
                index: index + 1,
                fromCode: row['From Code'],
                toCode: row['To Code'],
                matchedCodes: matchedCodes,
                size: row['Size / Gauge']
            });
        }
    }
});

console.log(`总共找到 ${matchCount} 条匹配数据 (${((matchCount / jsonData.length) * 100).toFixed(2)}%)\n`);

if (matches.length > 0) {
    console.log('前20条匹配数据:');
    matches.forEach(m => {
        console.log(`\n${m.index}. From: "${m.fromCode}" | To: "${m.toCode}"`);
        console.log(`    匹配代码: ${m.matchedCodes.join(', ')} | 线径: ${m.size}`);
    });
} else {
    console.log('⚠️  没有找到匹配的数据!');
    console.log('\n可能的原因:');
    console.log('1. From Code 和 To Code 列中没有包含 UEC/IEC/PFB/FFB/IPFB/TFB/REC 这些代码');
    console.log('2. 代码的大小写不匹配');
    console.log('3. 代码前后有空格或其他字符');
}
