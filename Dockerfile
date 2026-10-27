# 使用 Node 24 官方镜像（支持 node:sqlite 内置模块）
# 国内镜像源：docker.m.daocloud.io
FROM docker.m.daocloud.io/library/node:24-slim

WORKDIR /app

# 安装 Python 3 和依赖（用于文档解析和智能生题）
RUN apt-get update && apt-get install -y python3 python3-pip && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    pip3 install python-docx openpyxl --break-system-packages && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 复制前端依赖并安装
COPY package.json package-lock.json ./
RUN npm ci

# 复制所有代码
COPY . .

# 构建前端（生成 dist 目录）
RUN npm run build

# 暴露后端端口
EXPOSE 5000

# 运行后端（同时 serve 前端静态文件）
CMD ["node", "backend/server.js"]
