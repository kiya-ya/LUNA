const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Administrator\\Desktop\\试卷系统\\data.db');

console.log('=== 题库列表 ===');
console.log(db.prepare('SELECT * FROM question_banks').all());

console.log('\n=== 题目总数 ===');
console.log(db.prepare('SELECT COUNT(*) as total FROM questions').all());

console.log('\n=== 题目按题型分布 ===');
console.log(db.prepare('SELECT type, COUNT(*) as count FROM questions GROUP BY type').all());

console.log('\n=== 题目按题库分布 ===');
console.log(db.prepare('SELECT bank_id, COUNT(*) as count FROM questions GROUP BY bank_id').all());

console.log('\n=== 考试配置 ===');
console.log(db.prepare('SELECT id, name, status, single, multiple, fill, essay, bank_id, publish_at, stop_at FROM exam_configs').all());

console.log('\n=== 考试结果 ===');
console.log(db.prepare('SELECT id, exam_name, user_name, user_uid, total_score, max_score, percentage, created_at FROM exam_results').all());

console.log('\n=== 回收站数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM recycle_bin').all());

db.close();
console.log('\n查询完成');
