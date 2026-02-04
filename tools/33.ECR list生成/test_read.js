const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const ecrDir = 'C:\\Users\\HP\\Desktop\\tools\\33.ECR list生成\\ECR文件';
const files = fs.readdirSync(ecrDir).filter(f => f.endsWith('.xlsx') && !f.includes('临时'));

console.log(`找到 ${files.length} 个ECR文件\n`);

// 读取前3个文件测试
for (let i = 0; i < Math.min(files.length, 3); i++) {
    const file = files[i];
    const filepath = path.join(ecrDir, file);

    console.log(`=== ${file} ===`);

    const workbook = XLSX.readFile(filepath);

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 显示前10行
        console.log(`\n工作表: ${sheetName}`);
        console.log(`总行数: ${data.length}`);

        for (let row = 0; row < Math.min(data.length, 10); row++) {
            if (data[row] && data[row].length > 0) {
                const rowStr = data[row].slice(0, 8).map(c => String(c || '').slice(0, 30)).join(' | ');
                console.log(`Row ${row + 1}: ${rowStr}`);
            }
        }
    }
    console.log('\n' + '='.repeat(60) + '\n');
}
