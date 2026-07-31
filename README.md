# 📚 试卷系统 (Exam Paper System)

![Version](https://img.shields.io/badge/version-1.6.0-blue)
![Vue](https://img.shields.io/badge/Vue-3.4-green)
![Node](https://img.shields.io/badge/Node-24+-yellow)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

> 一款轻量级、功能完善的在线考试与题库管理系统，支持 AI 智能生题、Word/Excel 批量导入、反作弊检测和多题库管理。

---

## ✨ 功能特性

| 模块 | 功能描述 |
|------|----------|
| 📖 **题库管理** | 支持多题库切换，题目按题型分类（单选/多选/填空/简答） |
| 📝 **题目管理** | 增删改查题目，支持启用/禁用题目，批量导入导出 |
| 📄 **批量导入** | 支持 Word (.docx) 和 Excel (.xlsx) 文件批量导入题目 |
| 🤖 **AI 生题** | 基于 SiliconFlow API 智能生成题目，自动解析文档提炼考点 |
| 🎲 **随机组卷** | 按题型和数量配置，随机抽题生成试卷，支持分值自定义 |
| ⏰ **定时发布** | 支持试卷定时发布和定时截止，到期自动停止考试 |
| 🛡️ **反作弊** | 设备指纹绑定、同一试卷防重复作答、IP 异常检测 |
| 🗑️ **回收站** | 7 天自动保留，支持恢复误删的题目和试卷配置 |
| 📊 **成绩统计** | 答题记录存储，支持查看考试结果和答题详情 |

---

## 🏗️ 技术架构

### 前端
- **Vue 3** — 组合式 API，响应式数据管理
- **Vue Router** — 单页应用路由
- **Pinia** — 状态管理
- **Tailwind CSS** — 原子化 CSS 样式
- **Vite** — 构建工具，开发服务器代理

### 后端
- **Node.js 24** — 原生 `http` 模块，轻量高效
- **SQLite** — 嵌入式数据库，零配置部署
- **Python 3** — 文档解析（python-docx、openpyxl）和 AI 交互
- **SiliconFlow API** — 大模型 API，智能生题与 AI 阅卷

### 部署
- **Docker** — 容器化部署，开箱即用
- **Docker Compose** — 一键启动，数据持久化
- **Git Bash** — 命令行工具，方便部署和管理，版本的更新与回退


---

## 📁 项目结构

```
试卷系统/
├── src/                    # 前端源代码
│   ├── views/              # 页面视图
│   ├── components/         # 公共组件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── assets/             # 静态资源
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── backend/                # 后端源代码
│   ├── server.js           # HTTP 服务主入口
│   ├── db.js               # SQLite 数据库操作
│   ├── ai_service.js       # AI 服务接口
│   ├── parse_import.py     # 文档解析脚本
│   └── parse_doc_for_ai.py # AI 文档解析
├── dist/                   # 前端构建产物（生产环境）
├── public/                 # 静态资源目录
├── package.json            # 前端依赖配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── Dockerfile              # Docker 镜像构建
├── docker-compose.yml      # Docker Compose 编排
└── data.db                 # SQLite 数据库文件
```

---

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

确保已安装 [Docker](https://www.docker.com/) 和 [Docker Compose](https://docs.docker.com/compose/)。

```bash
# 1. 进入项目目录
cd 试卷系统

# 2. 构建并启动服务
docker-compose up -d --build

# 3. 访问系统
# 打开浏览器访问 http://localhost:5000
```

> **注意**：首次启动需要构建 Docker 镜像，耗时约 3-5 分钟。

### 方式二：本地开发环境

**环境要求：**
- Node.js 18+（推荐 20+）
- Python 3.9+（安装 `python-docx` 和 `openpyxl`）

```bash
# 1. 进入项目目录
cd 试卷系统

# 2. 安装前端依赖
npm install

# 3. 启动开发服务器（端口 5173，自动代理后端 API）
npm run dev

# 4. 另开一个终端，启动后端服务（端口 5000）
node backend/server.js

# 5. 访问系统
# 打开浏览器访问 http://localhost:5173
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SILICONFLOW_API_KEY` | SiliconFlow API 密钥（AI 生题/阅卷必需） | — |
| `PYTHON_PATH` | Python 可执行文件路径 | `python3` |
| `NODE_ENV` | 运行环境 | `production` |

### 配置 SiliconFlow API

1. 注册 [SiliconFlow](https://www.siliconflow.cn/) 账号
2. 获取 API Key
3. 在 `docker-compose.yml` 或环境变量中设置 `SILICONFLOW_API_KEY`

---

## 🐳 Docker 常用命令

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新镜像版本后重建
docker-compose up -d --build --force-recreate
```

---

## 📋 API 接口概览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/questions` | GET/POST | 获取/新增题目 |
| `/api/questions/import` | POST | 批量导入题目 |
| `/api/question-banks` | GET/POST | 获取/创建题库 |
| `/api/exam-configs` | GET/POST | 获取/创建考试配置 |
| `/api/exam-config` | GET | 获取当前发布的试卷题目 |
| `/api/submit` | POST | 提交考试答案 |
| `/api/results` | GET | 获取考试结果 |
| `/api/recycle-bin` | GET/POST | 回收站管理 |

---

## 🔄 数据库迁移与备份

数据库文件 `data.db` 直接保存在项目根目录下，方便备份和迁移。

```bash
# 备份数据库
cp data.db data.db.backup.$(date +%Y%m%d)

# 恢复数据库
cp data.db.backup.20250727 data.db
```

Docker 部署时，`data.db` 通过 Volume 挂载实现数据持久化：

```yaml
volumes:
  - ./data.db:/app/data.db
```

---

## 🛡️ 反作弊机制

本系统内置多层反作弊保护：

1. **设备指纹绑定** — 每台设备仅限一位考生答题
2. **试卷防重复** — 同一试卷每位考生仅能作答一次
3. **IP 异常预警** — 同一 IP 24 小时内超过 5 个不同 UID 提交时触发预警
4. **定时截止** — 试卷到期后自动停止接受答题

> 管理员可通过 `?admin_mode=1` 参数进入测试模式，跳过反作弊检查。

---

## 🐛 常见问题

### Q1: Docker 启动后 5000 端口无法访问？

- 检查 Docker 容器是否正常运行：`docker-compose ps`
- 查看容器日志：`docker-compose logs -f`
- 确认端口未被占用：`netstat -ano | findstr :5000`

### Q2: 提示"未找到 Python"？

Docker 镜像已内置 Python 3。如果是本地开发，请确保：
```bash
# 安装 Python 依赖
pip install python-docx openpyxl
```

### Q3: AI 生题失败？

- 检查 `SILICONFLOW_API_KEY` 是否配置正确
- 检查网络是否能访问 SiliconFlow API
- 查看后端日志获取详细错误信息

### Q4: 如何导出数据库中的题目？

题目数据存储在 SQLite 的 `data.db` 中，可使用 [SQLite Browser](https://sqlitebrowser.org/) 或命令行工具查看和导出：

```bash
sqlite3 data.db "SELECT * FROM questions;" > questions_export.txt
```

---

## 📦 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.6.0 | 2025-07 | 多题库支持、定时发布、反作弊增强、Docker 优化 |
| v1.5.x | 2025-06 | AI 智能生题、回收站功能、设备指纹绑定 |
| v1.0.0 | 2025-06 | 项目初始版本，基础题库和考试功能 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m "feat: add xxx"`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- GitCode Issues: [提交问题](https://gitcode.com/the_finals/试卷系统/issues)
- CSDN 博客: [饺子可爱捏](https://blog.csdn.net/你的ID)

---

> 💡 **提示**：建议定期备份 `data.db` 数据库文件，以防数据丢失。
