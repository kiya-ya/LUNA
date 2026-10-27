# 试卷系统 — 项目上下文总结

> 创建时间：2026-06-17
> 来源：问卷星批量阅卷 → 独立试卷系统需求衍生
> 当前状态：框架设计完成，待代码实现

---

## 一、项目背景

用户原本使用**问卷星**进行"姐妹团姐姐考试"的批量阅卷，过程中发现问卷星存在以下局限：
- 无法从固定题库中随机抽题生成新试卷
- 无法千人千卷（题目/选项乱序）
- 主观题需手动逐条阅卷，效率低
- 数据在云端，无法本地可控

因此决定**自建一套轻量级试卷系统**。

---

## 二、核心需求

| 需求 | 说明 |
|------|------|
| 题库规模 | 100道原题，每次从中随机抽取20-30题组成新试卷 |
| 考生规模 | 单次考试 ≤50人，无需高并发 |
| 随机策略 | 题目顺序乱序 + 选择题选项乱序 |
| 时间限制 | 倒计时，到时间强制提交 |
| 防作弊 | 切屏检测、一人一卷、链接唯一 |
| 评分 | 客观题自动评分，主观题AI按关键词覆盖度给分（0-5分） |
| 导出 | 生成Excel成绩表 |
| 部署 | 轻量级，单机运行，可外发给外部用户 |

---

## 三、已确定的技术决策

### 3.1 架构
- **后端**：Python Flask
- **数据库**：SQLite（文件型，单机部署，50人场景够用）
- **前端**：响应式HTML/CSS（Vue 3 + Element Plus / Vant 4，或纯Tailwind CSS）
- **部署**：一台Windows电脑即可，局域网内访问

### 3.2 为什么不需要Redis
- 50人并发对SQLite毫无压力
- 答题数据量极小，无需缓存
- 未来超过200人时再引入Redis，平滑迁移

### 3.3 为什么不需要MySQL（现阶段）
- SQLite单文件（`exam.db`），零安装、零配置
- 备份只需复制文件
- 增删改查标准SQL，和MySQL语法99%兼容
- 未来可平滑迁移到MySQL，代码改动极小

### 3.4 为什么不需要"试卷复制"功能
- 每次"创建考试" = 从100题中随机抽20题 = 5秒完成
- 无需复制已有试卷，生成比复制更快
- 100道原题永远不动，只生成新的"题号清单"

### 3.5 分端设计（已确认）
- **管理端（`/admin`）**：PC为主，需登录，功能全面（题库管理、创建考试、成绩统计、批量阅卷）
- **考生端（`/exam`）**：PC+手机兼容，无需登录，链接直达，极简专注（入口页→答题页→结果页）

---

## 四、已生成的文档

所有文档已复制到桌面：

| 文档 | 文件名 | 内容 |
|------|--------|------|
| 系统框架 | `exam_system_framework.md` | 架构、5大模块、数据模型、部署方案 |
| 外发方案 | `exam_system_external_distribution.md` | 3种外发方案（内网穿透/云服务器/微信机器人） |
| UI设计 | `exam_system_ui_design.md` | 所有页面布局、响应式适配、交互细节、视觉风格 |

桌面路径：`C:\Users\Administrator\Desktop\`

---

## 五、核心数据模型

```
题库表(questions)         — 100道题，永远不动
  ├─ id, type, content, options, answer, key_points, difficulty, tags, status

考试配置表(exams)         — 每次创建一条
  ├─ id, title, question_count, difficulty_rule, time_limit, start_time, end_time, password, status

试卷实例表(exam_instances) — 千人千卷的核心，每人一份
  ├─ id, exam_id, user_info, question_ids(乱序后30题ID), start_time, submit_time, total_score, status

答案表(answers)
  ├─ id, instance_id, question_id, user_answer, score, graded_by, graded_at
```

---

## 六、AI评分策略（替代问卷星手动阅卷）

```python
def ai_grade(answer_text, answer_key, question_title):
    # 提取答案解析中的关键要点
    key_points = extract_keywords(answer_key)
    
    # 统计考生答案覆盖的要点数量
    covered = sum(1 for p in key_points if p in answer_text)
    
    # 按覆盖比例映射到0-5分
    ratio = covered / len(key_points)
    if ratio >= 1.0: return 5
    elif ratio >= 0.7: return 4
    elif ratio >= 0.4: return 3
    elif ratio >= 0.2: return 2
    else: return 1
```

**宽松/严格模式可配置。**

---

## 七、已确认的设计细节

### 7.1 随机抽题逻辑
- `random.sample(questions, 20)` 从100题中无放回抽取20题
- `random.shuffle(selected)` 打乱题目顺序
- 对选择题：`random.shuffle(q.options)` 打乱选项顺序
- 正确答案存储的是选项内容而非位置（A/B/C/D），所以乱序不影响判分

### 7.2 外发方案（推荐起步）
- **内网穿透（ngrok）**：免费，5分钟搞定，域名会变（每次重启）
- **云服务器**：50元/月，固定域名，24小时在线，长期稳定
- **微信机器人**：自动发送考试链接给考生

### 7.3 响应式适配
- 一套代码，CSS Media Query 自动切换
- 手机端：大按钮（56px高）、输入框52px高、题号横向滚动、按钮吸底
- PC端：居中布局、表格展示、侧边导航栏

### 7.4 视觉风格
- 主色调：蓝色（#1677FF）
- 成功色：绿色，警告色：橙色，危险色：红色
- 背景：浅灰（#F5F5F5）

---

## 八、待办事项（下一步）

- [ ] 代码实现：确定从哪个模块开始
- [ ] 数据库初始化：`exam.db` 创建表结构
- [ ] 题库导入：100题Excel导入脚本
- [ ] 试卷生成：随机抽题 + 乱序逻辑
- [ ] 考生端：入口页 + 答题页 + 结果页
- [ ] 管理端：题库管理 + 创建考试 + 成绩统计
- [ ] AI评分：主观题自动评分引擎
- [ ] Excel导出：成绩表生成
- [ ] 测试：50人模拟测试

---

## 九、参考文件路径

- 工作区：`C:\Users\Administrator\Documents\kimi\workspace\`
- 桌面：`C:\Users\Administrator\Desktop\`
- 自动化阅卷程序：`wjx_auto_grader_by_student_v5.py`（已生成，桌面可找到）

---

## 十、快速启动（假设开始写代码）

```bash
# 环境
pip install flask sqlite3 openpyxl

# 启动
python app.py

# 访问
http://localhost:5000/admin  # 管理端
http://localhost:5000/exam   # 考生端
```

---

> 以上为本次对话的全部关键上下文，新任务可直接基于以上信息继续推进。
