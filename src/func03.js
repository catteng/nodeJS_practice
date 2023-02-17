const f1 = (a) => a * a;

const f3 = (a) => a * a * a;

console.log("匯入 func03");
console.log(f3(5));
// 模組匯出
module.exports = f1;
