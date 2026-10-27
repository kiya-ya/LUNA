# 试卷系统外发方案 — 发送给外部用户

> 场景：系统部署在一台电脑上，需要让外部用户（不在同一局域网）访问答题。

---

## 方案对比（推荐度由高到低）

| 方案 | 成本 | 复杂度 | 稳定性 | 适用场景 |
|------|------|--------|--------|----------|
| **A. 内网穿透** | 免费~20元/月 | 低 | 中 | 单次考试、临时使用 |
| **B. 云服务器** | 50~100元/月 | 中 | 高 | 长期使用、频繁考试 |
| **C. 微信机器人发送** | 免费 | 中 | 高 | 自动化分发、批量通知 |

---

## 方案A：内网穿透（推荐，最快速）

### 原理

```
外部用户 ──→ 公网域名（如 https://abc123.ngrok.io）
              ↑
         ngrok 服务器（转发请求）
              ↑
你的电脑 ──→ 本地Flask服务（localhost:5000）
```

> 你的电脑不需要公网IP，ngrok 提供一个临时域名，外部用户访问这个域名，ngrok 把请求转发到你电脑。

### 具体步骤

**1. 下载 ngrok**
- 官网：`https://ngrok.com`
- 下载 Windows 版本，解压到任意目录

**2. 注册并获取 Token**
- 用邮箱注册免费账号
- 在 Dashboard 获取 `Authtoken`（一串字符）

**3. 配置并启动**

```bash
# 首次配置（只需一次）
ngrok.exe authtoken YOUR_TOKEN_HERE

# 启动穿透（把本地5000端口映射到公网）
ngrok.exe http 5000
```

**4. 获取公网地址**

启动后终端显示：
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

**5. 发送给外部用户**

- 把 `https://abc123.ngrok-free.app` 复制到微信/钉钉/QQ 发送给考生
- 考生点击链接即可直接进入答题页面

### 优缺点

| 优点 | 缺点 |
|------|------|
| 免费（基础版） | 每次重启 ngrok 域名会变 |
| 5分钟搞定 | 免费版连接数有限制（50人够用） |
| 无需购买服务器 | 你的电脑必须保持开机且联网 |

### 进阶：固定域名（付费）

- ngrok 付费版（约 $5/月）可绑定固定域名
- 如 `https://yourname.ngrok.io`，重启不会变
- 适合频繁使用

---

## 方案B：云服务器部署（推荐，长期稳定）

### 原理

```
外部用户 ──→ 云服务器公网IP/域名
              ↑
         阿里云/腾讯云ECS（CentOS/Ubuntu）
              ↑
         Flask + Nginx + Gunicorn
```

### 具体步骤

**1. 购买云服务器**
- 阿里云/腾讯云/华为云，最便宜的配置即可（1核1G，约50元/月）
- 选择 CentOS 7 或 Ubuntu 20.04 系统

**2. 部署代码**

```bash
# 连接服务器（SSH）
ssh root@你的服务器IP

# 安装Python和依赖
apt update
apt install python3 python3-pip
pip3 install flask openpyxl

# 上传代码（用SCP或FTP工具）
scp -r exam_system root@服务器IP:/opt/

# 启动服务
nohup python3 /opt/exam_system/app.py > log.txt 2>&1 &
```

**3. 配置Nginx（域名访问，可选）**

```bash
# 安装Nginx
apt install nginx

# 配置反向代理
server {
    listen 80;
    server_name exam.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

**4. 发送给外部用户**

- 直接发送服务器IP：`http://123.45.67.89:5000`
- 或绑定域名：`http://exam.yourdomain.com`

### 优缺点

| 优点 | 缺点 |
|------|------|
| 24小时在线，无需电脑开机 | 每月约50元成本 |
| 固定IP/域名，长期可用 | 需要基础Linux运维知识 |
| 支持高并发（50人绰绰有余） | 首次配置需要30分钟 |

---

## 方案C：微信/钉钉机器人自动发送（自动化分发）

### 原理

```
系统生成试卷链接
      ↓
调用微信机器人API / 钉钉机器人API
      ↓
自动发送给考生个人或群聊
```

### 具体步骤

**1. 获取考生名单**
- 从Excel导入：姓名 + 手机号
- 系统为每个考生生成唯一的试卷链接（含token）

**2. 配置微信/钉钉机器人**

**微信企业版机器人：**
- 在企业微信群中创建机器人
- 获取 Webhook URL（如 `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`）

**3. 自动发送代码**

```python
import requests

def send_exam_link(phone, name, exam_url):
    """通过微信机器人发送考试链接"""
    webhook = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
    message = {
        "msgtype": "text",
        "text": {
            "content": f"【考试通知】\n{name} 您好，您有一场在线考试：\n\n点击链接进入：{exam_url}\n\n考试时间：30分钟\n请按时完成。"
        }
    }
    requests.post(webhook, json=message)

# 批量发送
for student in students:
    url = generate_unique_url(student)  # 生成唯一链接
    send_exam_link(student.phone, student.name, url)
```

**4. 效果**

- 考生收到微信消息："您有一场在线考试，点击链接进入..."
- 点击链接直接进入答题页面（无需注册登录）
- 每个链接只能提交一次，防止重复答题

---

## 推荐方案组合

### 场景1：单次临时考试（最省钱）

```
你的电脑（Windows）
  ├─ 启动 Flask 服务
  ├─ 启动 ngrok 穿透
  └─ 获取公网链接
       ↓
   复制链接到微信群/钉钉群
       ↓
   考生点击链接答题
```

**成本：0元**（电脑保持开机即可）

### 场景2：长期频繁使用（最稳定）

```
阿里云ECS（1核1G，50元/月）
  ├─ 部署 Flask + SQLite
  ├─ 绑定域名 exam.yourcompany.com
  └─ 配置微信机器人自动发送
       ↓
   考生收到微信通知
       ↓
   点击链接答题
```

**成本：50元/月**（服务器）

### 场景3：自动化流程（最省心）

```
1. 管理员在后台创建考试
2. 上传考生名单（Excel）
3. 点击"发放试卷"
   ├─ 系统自动生成50个唯一链接
   ├─ 调用微信机器人API
   └─ 自动发送给每个考生
4. 考生收到微信消息，点击链接答题
5. 时间到，系统自动收卷
6. 管理员后台一键导出Excel成绩表
```

---

## 发送方式总结

| 发送渠道 | 方式 | 效果 |
|----------|------|------|
| **微信群** | 复制 ngrok 链接发到群里 | 群里所有人可见 |
| **微信私聊** | 通过微信机器人逐个发送 | 每人收到专属链接 |
| **钉钉** | 钉钉机器人发送 | 同微信机器人 |
| **短信** | 调用短信API发送链接 | 成本稍高（0.05元/条） |
| **邮件** | 发送邮件含链接 | 适合办公场景 |
| **二维码** | 生成二维码图片，群里发 | 手机扫码直接进入 |

---

## 关键安全提醒

- **链接有效期**：考试链接可设置有效期（如24小时），过期失效
- **一人一链**：每个考生生成唯一token，防止转发分享
- **IP绑定**：可选绑定首次访问IP，防止代考
- **HTTPS**：ngrok 默认HTTPS，云服务器建议配置SSL证书

---

> 最推荐的起步方案：**方案A（内网穿透）+ 微信群发链接**，0成本，5分钟搞定。
