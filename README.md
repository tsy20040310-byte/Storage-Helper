# 收纳帮 Storage Helper

生产级 MVP 单仓库骨架，覆盖：

- `apps/api`：NestJS 后端 API
- `apps/admin`：React 管理后台
- `apps/mobile`：Flutter 移动端
- `packages/contracts`：跨端共享领域模型
- `infra`：数据库与本地基础设施
- `docs`：ER 图、表结构、API、路线图

## 核心能力

- 实名认证与审核流程
- 用户发布订单与素材上传
- 整理师接单与用户确认
- 上门 GPS 验证 + 6 位验证码开工
- 自动计时、账单、托管支付
- 订单聊天、评价、申诉、SOS
- 信誉分与风控限制

## 技术选型

- Mobile: Flutter
- API: NestJS + MySQL + Redis
- Admin: React + Vite
- Storage: S3 / OSS 抽象
- Map: 高德地图优先，Google Maps 作为国际化扩展

## 快速启动

### 1. 基础环境

- Node.js 20+
- npm 10+
- Flutter 3.22+
- Docker Desktop

### 2. 启动基础设施

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 3. 安装前端/后端依赖

```bash
npm.cmd install
```

### 4. 启动后端

```bash
npm run infra:up
npm run api:prisma:generate
npm run api:db:push
npm run dev-api
```

### 5. 启动管理后台

```bash
npm run dev:admin
```

### 6. 启动 Flutter

```bash
cd apps/mobile
flutter pub get
flutter run
```

## 本机环境说明

- Windows PowerShell 如果禁止执行 `npm.ps1`，请改用 `npm.cmd`
- 当前工作区未检测到 Flutter SDK 路径，首次运行前需先安装 Flutter 并加入 PATH
- `apps/mobile` 已提供 Flutter 业务骨架；安装好 Flutter 后可在该目录执行 `flutter create --platforms=android,ios .` 补齐原生工程

## API 开发账号

- 短信验证码开发环境固定返回并接受：`123456`
- 单主测试手机号：`13800000000`
- 整理师测试手机号：`13900000000`

## 后端数据库

后端已切换为 Prisma + MySQL，默认独立数据库名为 `storage_helper`，不会使用你的 `qi_platform`。首次启动数据库后执行：

```bash
npm run api:prisma:generate
npm run api:db:push
```

主要 CRUD 已接入：

- `POST /api/v1/auth/login`
- `POST /api/v1/verifications/identity`
- `GET /api/v1/verifications/identity/me`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/applications`
- `PATCH /api/v1/orders/:id/applications/:applicationId/confirm`
- `POST /api/v1/orders/:id/arrival-check`
- `POST /api/v1/orders/:id/start`
- `POST /api/v1/orders/:id/complete`

## 文档入口

- [系统架构](C:/Users/81230/Desktop/mika/Storage Helper/docs/architecture.md)
- [数据库 ER 图](C:/Users/81230/Desktop/mika/Storage Helper/docs/database-er.md)
- [PostgreSQL 表结构](C:/Users/81230/Desktop/mika/Storage Helper/docs/postgresql-schema.md)
- [REST API 设计](C:/Users/81230/Desktop/mika/Storage Helper/docs/rest-api.md)
- [MVP 路线图](C:/Users/81230/Desktop/mika/Storage Helper/docs/mvp-roadmap.md)

## GitHub 上传

```bash
git add .
git commit -m "feat: bootstrap storage helper mvp monorepo"
git remote add origin <your-github-repo-url>
git push -u origin master
```
