const fs = require('fs');
const firstLine = fs.readFileSync('d:\\Code\\Guidwire\\gigguard\\data\\pre-final_dataset3.csv', 'utf8').split('\n')[0];
console.log(firstLine);
