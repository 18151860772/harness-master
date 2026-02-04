const XLSX = require('xlsx');
const wb = XLSX.readFile('inline.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total rows:', data.length);
console.log('\nColumn names:', Object.keys(data[0] || {}));
console.log('\nFirst 20 rows:');
data.slice(0, 20).forEach((r, i) => {
    console.log(`${i+1}.`, r);
});
