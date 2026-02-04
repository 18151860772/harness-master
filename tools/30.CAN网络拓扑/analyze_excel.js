const XLSX = require('xlsx');
const fs = require('fs');

function analyzeFile(filename) {
    console.log(`========== ${filename} 数据结构 ==========`);
    try {
        const workbook = XLSX.readFile(filename);
        console.log('Sheet数量:', workbook.SheetNames.length);
        console.log('Sheet名称:', workbook.SheetNames.join(', '));

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length > 0) {
            const headers = jsonData[0];
            console.log('\n总行数:', jsonData.length);
            console.log('总列数:', headers.length);
            console.log('\n列名:');
            headers.forEach((h, i) => {
                console.log(`  ${i+1}. ${h || '(空)'}`);
            });

            console.log('\n前5行数据:');
            console.log('--------------------------------------------------');
            for (let i = 1; i < Math.min(6, jsonData.length); i++) {
                console.log(`\n第${i+1}行:`);
                headers.forEach((h, j) => {
                    const val = jsonData[i][j] !== undefined ? jsonData[i][j] : '';
                    console.log(`  ${h}: ${val}`);
                });
            }

            // 分析 Multicore ID 和 Wire ID 的数据
            console.log('\n--------------------------------------------------');
            console.log('Multicore ID 和 Wire ID 示例:');
            for (let i = 1; i < Math.min(11, jsonData.length); i++) {
                const multicoreIdx = headers.findIndex(h => h && h.toString().includes('Multicore'));
                const wireIdx = headers.findIndex(h => h && h.toString().includes('Wire'));

                if (multicoreIdx >= 0 && wireIdx >= 0) {
                    const multicore = jsonData[i][multicoreIdx] || '';
                    const wire = jsonData[i][wireIdx] || '';
                    console.log(`  ${multicore} | ${wire}`);
                }
            }
        }
    } catch (error) {
        console.error('错误:', error.message);
    }
    console.log('\n\n');
}

// 分析两个文件
analyzeFile('WIRELIST.xlsx');
analyzeFile('inline.xlsx');
