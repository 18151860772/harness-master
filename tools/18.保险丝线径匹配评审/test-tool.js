const XLSX = require('xlsx');
const fs = require('fs');

// 读取Excel文件
const filePath = 'C:\\Users\\HP\\Desktop\\tools\\保险丝线径匹配评审\\WIRELIST-T28-0S_20240325.xlsx';

console.log('========================================');
console.log('保险丝与线径匹配工具测试报告');
console.log('========================================\n');

try {
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    console.log('1. 文件基本信息');
    console.log('   文件名:', 'WIRELIST-T28-0S_20240325.xlsx');
    console.log('   工作表名:', workbook.SheetNames[0]);
    console.log('   总行数:', jsonData.length, '条\n');

    // 分析列结构
    const firstRow = jsonData[0];
    const allColumns = Object.keys(firstRow);

    console.log('2. Excel列结构分析');
    console.log('   总列数:', allColumns.length);
    console.log('   所有列名:');
    allColumns.forEach((col, index) => {
        console.log(`     ${index + 1}. "${col}"`);
    });
    console.log('');

    // 模拟findColumns函数
    const columns = {};
    allColumns.forEach(key => {
        const normalizedKey = key.toLowerCase().trim();

        if (normalizedKey.includes('线径') || normalizedKey.includes('wire') ||
            normalizedKey.includes('diameter') || normalizedKey.includes('截面') ||
            normalizedKey.includes('size') || normalizedKey.includes('mm2') || normalizedKey.includes('mm²')) {
            columns.wireDiameter = key;
        }
        else if (normalizedKey.includes('电路') || normalizedKey.includes('circuit')) {
            columns.circuitType = key;
        }
        else if (normalizedKey.includes('线束') || normalizedKey.includes('harness')) {
            columns.harnessType = key;
        }
        else if (normalizedKey === 'from' || normalizedKey === 'from设备' ||
            normalizedKey.includes('源') || normalizedKey.includes('source') ||
            normalizedKey.startsWith('from') || normalizedKey.includes('from code') ||
            normalizedKey === 'fromcode') {
            columns.from = key;
        }
        else if (normalizedKey === 'to' || normalizedKey === 'to设备' ||
            normalizedKey.includes('目标') || normalizedKey.includes('destination') ||
            normalizedKey.startsWith('to') || normalizedKey.includes('to code') ||
            normalizedKey === 'tocode') {
            columns.to = key;
        }
    });

    console.log('3. 识别结果');
    console.log('   识别到的列:');
    console.log('     - 线径列:', columns.wireDiameter || '未识别');
    console.log('     - From Code列:', columns.from || '未识别');
    console.log('     - To Code列:', columns.to || '未识别');
    console.log('     - 电路类型列:', columns.circuitType || '未识别');
    console.log('     - 线束类型列:', columns.harnessType || '未识别');
    console.log('');

    // 显示前5条数据的FROM和TO
    console.log('4. 前5条数据的FROM和TO值:');
    if (columns.from && columns.to) {
        jsonData.slice(0, 5).forEach((row, i) => {
            const fromVal = String(row[columns.from] || '').substring(0, 40);
            const toVal = String(row[columns.to] || '').substring(0, 40);
            console.log(`   ${i + 1}. FROM: "${fromVal}"`);
            console.log(`      TO: "${toVal}"`);
        });
    } else {
        console.log('   无法显示 - 未识别到FROM或TO列');
    }
    console.log('');

    // 筛选测试
    const validCodes = ['UEC', 'IEC', 'PFB', 'FFB', 'IPFB', 'TFB', 'REC'];

    if (columns.from && columns.to) {
        console.log('5. 筛选功能测试');
        console.log('   筛选条件: FROM或TO包含以下代码');
        console.log('   有效代码:', validCodes.join(', '));
        console.log('');

        const filtered = jsonData.filter((row, index) => {
            const fromValue = String(row[columns.from] || '').trim().toUpperCase();
            const toValue = String(row[columns.to] || '').trim().toUpperCase();

            return validCodes.some(code =>
                fromValue.includes(code) || toValue.includes(code)
            );
        });

        console.log('   筛选结果:');
        console.log('     原始数据:', jsonData.length, '条');
        console.log('     符合条件:', filtered.length, '条');
        console.log('     过滤掉:', jsonData.length - filtered.length, '条');
        console.log('');

        // 显示匹配示例
        if (filtered.length > 0) {
            console.log('6. 匹配示例（前3条）:');
            filtered.slice(0, 3).forEach((row, i) => {
                const fromVal = String(row[columns.from] || '');
                const toVal = String(row[columns.to] || '');
                const fromUpper = fromVal.toUpperCase();
                const toUpper = toVal.toUpperCase();

                const matchedCodes = [];
                validCodes.forEach(code => {
                    if (fromUpper.includes(code) || toUpper.includes(code)) {
                        matchedCodes.push(code);
                    }
                });

                console.log(`   ${i + 1}. FROM: "${fromVal.substring(0, 35)}${fromVal.length > 35 ? '...' : ''}"`);
                console.log(`      TO: "${toVal.substring(0, 35)}${toVal.length > 35 ? '...' : ''}"`);
                console.log(`      匹配代码: ${matchedCodes.join(', ')}`);
                console.log(`      线径: ${row[columns.wireDiameter] || 'N/A'}`);
            });
        }

        // 按电器盒分类统计
        console.log('');
        console.log('7. 按电器盒分类统计:');

        const boxFilters = {
            '前仓电器盒': { codes: ['UEC', 'FFB'] },
            '仪表电器盒': { codes: ['IEC', 'IPFB'] },
            '行李箱电器盒': { codes: ['TFB', 'REC'] },
            '预保险丝盒': { codes: ['PFB'] }
        };

        Object.entries(boxFilters).forEach(([boxName, boxInfo]) => {
            const count = filtered.filter(row => {
                const fromUpper = String(row[columns.from] || '').trim().toUpperCase();
                const toUpper = String(row[columns.to] || '').trim().toUpperCase();
                return boxInfo.codes.some(code =>
                    fromUpper.includes(code) || toUpper.includes(code)
                );
            }).length;

            console.log(`   ${boxName}: ${count} 条`);
        });

        // 线径分布统计
        console.log('');
        console.log('8. 筛选后数据的线径分布:');
        const diameterCounts = {};
        filtered.forEach(row => {
            const dia = row[columns.wireDiameter];
            if (dia !== undefined && dia !== null) {
                diameterCounts[dia] = (diameterCounts[dia] || 0) + 1;
            }
        });

        Object.entries(diameterCounts)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
            .forEach(([dia, count]) => {
                console.log(`   ${dia} mm²: ${count} 条`);
            });

    } else {
        console.log('⚠️  警告: 未识别到必要的FROM或TO列，无法进行筛选测试');
        console.log('');
        console.log('建议:');
        console.log('1. 检查Excel列名是否包含 "from" 或 "to" 关键字');
        console.log('2. 列名可以是: "From", "FROM", "From Code", "fromcode" 等');
        console.log('3. 或者修改代码中的列名识别逻辑');
    }

    console.log('');
    console.log('========================================');
    console.log('测试完成');
    console.log('========================================');

} catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
}
