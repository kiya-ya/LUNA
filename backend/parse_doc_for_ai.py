# -*- coding: utf-8 -*-
"""智能生题：解析文档内容并基于规则生成题目"""
import sys
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
import random

random.seed(42)  # 固定种子保证可复现


def extract_text_from_docx(file_path):
    """用 zipfile + XML 提取 Word 文本"""
    with zipfile.ZipFile(file_path, 'r') as z:
        xml_content = z.read('word/document.xml').decode('utf-8')
    
    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for para in tree.findall('.//w:p', ns):
        texts = []
        for run in para.findall('.//w:t', ns):
            if run.text:
                texts.append(run.text)
        full_text = ''.join(texts).strip()
        if full_text:
            paragraphs.append(full_text)
    
    text = '\n'.join(paragraphs)
    # 清理一些常见垃圾：孤立的数字/页码等
    text = re.sub(r'\n\d+\n', '\n', text)  # 孤立数字行
    text = re.sub(r'\n\d+\s+\d+\n', '\n', text)  # 连续数字行
    return text


def extract_text_from_pdf(file_path):
    """尝试用多种方式提取 PDF 文本"""
    # 尝试 PyPDF2
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except ImportError:
        pass
    
    # 尝试 pypdf
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except ImportError:
        pass
    
    # 尝试 pdfminer
    try:
        from pdfminer.high_level import extract_text
        return extract_text(file_path)
    except ImportError:
        pass
    
    return None


def generate_questions_from_text(text, single_count=5, multiple_count=3, fill_count=3, essay_count=2):
    """基于文本内容智能生成题目"""
    paragraphs = [p.strip() for p in text.split('\n') if len(p.strip()) > 10]
    if not paragraphs:
        return []
    
    # 统计信息
    total_chars = sum(len(p) for p in paragraphs)
    avg_len = total_chars / len(paragraphs) if paragraphs else 0
    print(f"[INFO] 解析到 {len(paragraphs)} 个段落，总字符数 {total_chars}，平均长度 {avg_len:.1f}", file=sys.stderr)
    
    questions = []
    
    # ========== 1. 生成单选题（定义句） ==========
    definition_patterns = [
        r'(.{2,30}?)(?:是|指的是|定义为|是指|为)(.{5,80}?)(?:的|。|$)',
        r'(.{2,30}?)(?:的含义|的定义)(?:是|为|：)(.{5,80}?)(?:。|$)',
    ]
    
    definitions = []
    for p in paragraphs:
        for pattern in definition_patterns:
            match = re.search(pattern, p)
            if match:
                subject = match.group(1).strip()
                predicate = match.group(2).strip()
                if len(subject) > 2 and len(predicate) > 5 and len(subject) < 50 and len(predicate) < 100:
                    definitions.append({'subject': subject, 'predicate': predicate, 'text': p})
    
    # 去重（按 subject 去重）
    seen = set()
    unique_defs = []
    for d in definitions:
        if d['subject'] not in seen:
            seen.add(d['subject'])
            unique_defs.append(d)
    definitions = unique_defs
    
    # 生成单选题
    for i, d in enumerate(definitions[:single_count]):
        correct_answer = d['subject']
        # 从其他定义中找干扰项
        distractors = [x['subject'] for x in definitions if x['subject'] != correct_answer]
        if len(distractors) < 3:
            # 如果干扰项不够，补充通用选项
            generic = ['管理制度', '考核标准', '工作流程', '安全规范', '操作守则', '团队文化', '服务准则', '行为规范']
            distractors.extend([g for g in generic if g != correct_answer])
        
        options = random.sample(distractors, min(3, len(distractors))) + [correct_answer]
        random.shuffle(options)
        correct_letter = chr(65 + options.index(correct_answer))
        
        questions.append({
            'type': 'single',
            'content': f"以下哪项{d['predicate']}？",
            'options': [f"{chr(65+j)}. {opt}" for j, opt in enumerate(options)],
            'answer': correct_letter,
            'key_points': f"正确答案：{correct_letter}。原文：{d['text']}",
            'blanks': [],
            'source': d['text']
        })
    
    # ========== 2. 生成多选题（列表内容） ==========
    lists = []
    for p in paragraphs:
        if '包括' in p or '包含' in p or '以下' in p or '如下' in p:
            # 尝试用逗号/顿号/分号分隔提取列表项
            items = re.findall(r'[;；,，、]([^;；,，、]{2,30})', p)
            if len(items) >= 2 and len(items) <= 6:
                items = [item.strip() for item in items if len(item.strip()) > 1]
                if len(items) >= 2:
                    lists.append({'items': items, 'text': p})
    
    # 也尝试找编号列表
    for p in paragraphs:
        items = re.findall(r'(?:一|二|三|四|五|六|七|八|九|十)[、.]([^\n]{2,30})', p)
        if len(items) >= 2 and len(items) <= 6:
            items = [item.strip() for item in items if len(item.strip()) > 1]
            if len(items) >= 2:
                lists.append({'items': items, 'text': p})
    
    # 去重
    seen = set()
    unique_lists = []
    for lst in lists:
        key = tuple(sorted(lst['items']))
        if key not in seen:
            seen.add(key)
            unique_lists.append(lst)
    lists = unique_lists
    
    for i, lst in enumerate(lists[:multiple_count]):
        items = lst['items']
        correct_count = min(random.randint(2, len(items)), len(items))
        correct_items = random.sample(items, correct_count)
        
        # 干扰项：从其他列表中找
        all_items = set(items)
        other_items = [x for x in set(sum([l['items'] for l in lists], [])) if x not in all_items]
        if len(other_items) < 2:
            other_items = ['安全管理', '绩效评估', '团队建设', '培训计划', '客户维护', '数据分析']
        
        wrong_count = max(0, 4 - correct_count)
        wrong_items = random.sample(other_items, min(wrong_count, len(other_items)))
        
        options = correct_items + wrong_items
        random.shuffle(options)
        
        correct_letters = []
        for item in correct_items:
            idx = options.index(item)
            correct_letters.append(chr(65 + idx))
        correct_letters.sort()
        
        questions.append({
            'type': 'multiple',
            'content': f"以下哪些属于该内容？（多选）",
            'options': [f"{chr(65+j)}. {opt}" for j, opt in enumerate(options)],
            'answer': ','.join(correct_letters),
            'key_points': f"正确答案：{','.join(correct_letters)}。原文：{lst['text']}",
            'blanks': [],
            'source': lst['text']
        })
    
    # ========== 3. 生成填空题（数字/日期/百分比） ==========
    number_patterns = [
        (r'(\d{4})年', '年份'),
        (r'(\d+(?:\.\d+)?)%', '百分比'),
        (r'(\d+(?:\.\d+)?)\s*(?:个|名|人|次|天|小时|分钟|元|万元|万元|分|秒|月|日|周)', '数量'),
    ]
    
    fill_items = []
    for p in paragraphs:
        for pattern, label in number_patterns:
            matches = re.findall(pattern, p)
            for match in matches:
                # 找到包含该数字的完整句子
                escaped = re.escape(match)
                sentence_match = re.search(r'[^。；]*?' + escaped + r'[^。；]*', p)
                if sentence_match:
                    sentence = sentence_match.group(0)
                    fill_items.append({'answer': match, 'sentence': sentence, 'label': label})
    
    # 去重
    seen = set()
    unique_fills = []
    for f in fill_items:
        if f['answer'] not in seen:
            seen.add(f['answer'])
            unique_fills.append(f)
    fill_items = unique_fills
    
    for i, f in enumerate(fill_items[:fill_count]):
        sentence = f['sentence']
        # 替换答案为下划线
        content = sentence.replace(f['answer'], '____', 1)
        if content == sentence:
            # 如果精确替换失败，用正则替换第一个匹配的数字
            content = re.sub(r'(\d+(?:\.\d+)?)', '____', sentence, count=1)
        
        questions.append({
            'type': 'fill',
            'content': content,
            'options': [],
            'answer': f['answer'],
            'key_points': f"正确答案：{f['answer']}（{f['label']}）。原文：{sentence}",
            'blanks': [{'blank_no': 1, 'answer': f['answer']}],
            'source': sentence
        })
    
    # ========== 4. 生成简答题（长段落描述） ==========
    long_paragraphs = [p for p in paragraphs if 50 < len(p) < 300 and '。' in p]
    for i, p in enumerate(long_paragraphs[:essay_count]):
        # 提取前20字作为主题
        topic = p[:30].strip().replace('。', '')
        questions.append({
            'type': 'essay',
            'content': f"请简述：{topic}...",
            'options': [],
            'answer': '',
            'key_points': p,
            'blanks': [],
            'source': p
        })
    
    print(f"[INFO] 生成题目数量：单选{len(definitions)}(取{min(len(definitions), single_count)}), 多选{len(lists)}(取{min(len(lists), multiple_count)}), 填空{len(fill_items)}(取{min(len(fill_items), fill_count)}), 简答{len(long_paragraphs)}(取{min(len(long_paragraphs), essay_count)})", file=sys.stderr)
    
    return questions


def main():
    if len(sys.argv) < 4:
        print('Usage: python parse_doc_for_ai.py <file_path> <file_type> <output_path> [single_count] [multiple_count] [fill_count] [essay_count]', file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    file_type = sys.argv[2]
    output_path = sys.argv[3]
    
    single_count = int(sys.argv[4]) if len(sys.argv) > 4 else 5
    multiple_count = int(sys.argv[5]) if len(sys.argv) > 5 else 3
    fill_count = int(sys.argv[6]) if len(sys.argv) > 6 else 3
    essay_count = int(sys.argv[7]) if len(sys.argv) > 7 else 2
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': 'File not found'}), file=sys.stderr)
        sys.exit(1)
    
    try:
        if file_type == 'docx':
            text = extract_text_from_docx(file_path)
        elif file_type == 'pdf':
            text = extract_text_from_pdf(file_path)
            if text is None:
                print(json.dumps({'error': 'PDF解析失败，请安装 PyPDF2 或 pypdf：pip install pypdf'}), file=sys.stderr)
                sys.exit(1)
        else:
            print(json.dumps({'error': 'Unsupported file type. Only .docx and .pdf are supported'}), file=sys.stderr)
            sys.exit(1)
        
        # 只输出提取的文本，不生成题目（题目由 AI 大模型生成）
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'text': text,
                'text_preview': text[:3000]
            }, f, ensure_ascii=False, indent=2)
        
        print(f'Extracted {len(text)} chars from {file_type}')
    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'trace': traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
