from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import os
import re

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "exam.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """获取所有题目，按题型分组"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM questions ORDER BY q_number')
    rows = cursor.fetchall()
    conn.close()
    
    questions = []
    for row in rows:
        q = {
            'id': row['q_number'],
            'content': row['content'],
            'type': row['type'],
            'options': json.loads(row['options']) if row['options'] else [],
            'answer': row['answer'] or '',
            'keyPoints': row['key_points'] or '',
            'blanks': json.loads(row['blanks']) if row['blanks'] else [],
            'difficulty': row['difficulty']
        }
        questions.append(q)
    
    single = [q for q in questions if q['type'] == 'single']
    multiple = [q for q in questions if q['type'] == 'multiple']
    fill = [q for q in questions if q['type'] == 'fill']
    essay = [q for q in questions if q['type'] == 'essay']
    
    return jsonify({
        'success': True,
        'data': {
            'all': questions,
            'single': single,
            'multiple': multiple,
            'fill': fill,
            'essay': essay,
            'stats': {
                'total': len(questions),
                'single': len(single),
                'multiple': len(multiple),
                'fill': len(fill),
                'essay': len(essay)
            }
        }
    })

@app.route('/api/exam-config', methods=['GET'])
def get_exam_config():
    """获取考试配置：从100题中随机抽取10单选+5填空+5简答"""
    import random
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM questions WHERE type = 'single' ORDER BY RANDOM() LIMIT 10")
    single_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM questions WHERE type = 'fill' ORDER BY RANDOM() LIMIT 5")
    fill_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM questions WHERE type = 'essay' ORDER BY RANDOM() LIMIT 5")
    essay_rows = cursor.fetchall()
    
    conn.close()
    
    def row_to_dict(row):
        return {
            'id': row['q_number'],
            'content': row['content'],
            'type': row['type'],
            'options': json.loads(row['options']) if row['options'] else [],
            'answer': row['answer'] or '',
            'keyPoints': row['key_points'] or '',
            'blanks': json.loads(row['blanks']) if row['blanks'] else [],
            'difficulty': row['difficulty']
        }
    
    single = [row_to_dict(r) for r in single_rows]
    fill = [row_to_dict(r) for r in fill_rows]
    essay = [row_to_dict(r) for r in essay_rows]
    
    all_questions = single + fill + essay
    random.shuffle(all_questions)
    
    return jsonify({
        'success': True,
        'data': {
            'questions': all_questions,
            'timeLimit': 30 * 60,
            'totalQuestions': len(all_questions)
        }
    })

@app.route('/api/submit', methods=['POST'])
def submit_exam():
    """提交考试答案并评分"""
    data = request.get_json()
    answers = data.get('answers', {})
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    results = []
    total_score = 0
    max_score = 0
    
    for q_id, user_answer in answers.items():
        cursor.execute('SELECT * FROM questions WHERE q_number = ?', (int(q_id),))
        row = cursor.fetchone()
        if not row:
            continue
        
        q_type = row['type']
        correct_answer = row['answer'] or ''
        key_points = row['key_points'] or ''
        blanks = json.loads(row['blanks']) if row['blanks'] else []
        
        score = 0
        max_q_score = 10
        feedback = ''
        
        if q_type == 'single':
            max_q_score = 10
            if user_answer.upper().strip() == correct_answer.upper().strip():
                score = 10
                feedback = '回答正确！'
            else:
                score = 0
                feedback = f'正确答案：{correct_answer}'
        
        elif q_type == 'multiple':
            max_q_score = 10
            user_set = set(user_answer.upper().replace(',', '').replace(' ', ''))
            correct_set = set(correct_answer.upper().replace(',', '').replace(' ', ''))
            if user_set == correct_set:
                score = 10
                feedback = '回答正确！'
            else:
                score = 0
                feedback = f'正确答案：{correct_answer}'
        
        elif q_type == 'fill':
            max_q_score = 10
            correct = True
            for blank in blanks:
                blank_no = str(blank['blank_no'])
                blank_answer = blank['answer']
                user_blank = user_answer.get(blank_no, '') if isinstance(user_answer, dict) else ''
                possible_answers = [a.strip().lower() for a in blank_answer.split('|')]
                if user_blank.strip().lower() not in possible_answers:
                    correct = False
                    break
            if correct and len(blanks) > 0:
                score = 10
                feedback = '回答正确！'
            else:
                score = 0
                feedback = f'正确答案：{" / ".join([b["answer"] for b in blanks])}'
        
        elif q_type == 'essay':
            max_q_score = 10
            if key_points:
                keywords = extract_keywords(key_points)
                matched = sum(1 for kw in keywords if kw in str(user_answer).lower())
                coverage = matched / len(keywords) if keywords else 0
                if coverage >= 1:
                    score = 10
                elif coverage >= 0.7:
                    score = 8
                elif coverage >= 0.4:
                    score = 6
                elif coverage >= 0.2:
                    score = 4
                else:
                    score = 2
                feedback = f'关键词覆盖率：{int(coverage*100)}%'
            else:
                score = 5
                feedback = '请等待人工审核'
        
        total_score += score
        max_score += max_q_score
        
        results.append({
            'q_id': int(q_id),
            'type': q_type,
            'user_answer': user_answer,
            'correct_answer': correct_answer if q_type in ('single', 'multiple') else [b['answer'] for b in blanks] if q_type == 'fill' else key_points,
            'score': score,
            'max_score': max_q_score,
            'feedback': feedback,
            'key_points': key_points
        })
    
    conn.close()
    
    percentage = (total_score / max_score * 100) if max_score > 0 else 0
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exam_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            user_uid TEXT,
            total_score INTEGER,
            max_score INTEGER,
            percentage REAL,
            answers TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        INSERT INTO exam_results (user_name, user_uid, total_score, max_score, percentage, answers)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('userName', ''),
        data.get('userUid', ''),
        total_score,
        max_score,
        percentage,
        json.dumps(answers, ensure_ascii=False)
    ))
    
    result_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'result_id': result_id,
            'total_score': total_score,
            'max_score': max_score,
            'percentage': round(percentage, 1),
            'details': results
        }
    })

def extract_keywords(text):
    """从答案解析中提取关键词"""
    keywords = []
    for line in text.split('\n'):
        line = line.strip()
        if not line or len(line) < 3:
            continue
        clean = re.sub(r'^\d+[\.\s、]+', '', line)
        clean = re.sub(r'[，。！？；：""''（）\(\)\[\],.!?;:\'"]', '', clean)
        if len(clean) > 2:
            keywords.append(clean.lower())
    return keywords

@app.route('/api/results/<int:result_id>', methods=['GET'])
def get_result(result_id):
    """获取考试结果详情"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM exam_results WHERE id = ?', (result_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({'success': False, 'error': 'Result not found'}), 404
    
    return jsonify({
        'success': True,
        'data': {
            'id': row['id'],
            'user_name': row['user_name'],
            'user_uid': row['user_uid'],
            'total_score': row['total_score'],
            'max_score': row['max_score'],
            'percentage': row['percentage'],
            'answers': json.loads(row['answers']) if row['answers'] else {},
            'created_at': row['created_at']
        }
    })

@app.route('/api/results', methods=['GET'])
def get_all_results():
    """获取所有考试结果（管理端用）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM exam_results ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        results.append({
            'id': row['id'],
            'user_name': row['user_name'],
            'user_uid': row['user_uid'],
            'total_score': row['total_score'],
            'max_score': row['max_score'],
            'percentage': row['percentage'],
            'created_at': row['created_at']
        })
    
    return jsonify({
        'success': True,
        'data': results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
