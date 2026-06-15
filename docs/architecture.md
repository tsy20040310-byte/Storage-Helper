# 系统架构

## 单仓库结构

```text
apps/
  api/           NestJS API + domain modules
  admin/         React 管理后台
  mobile/        Flutter App
packages/
  contracts/     DTO、枚举、事件名称
infra/
  docker-compose.yml
  sql/init/
docs/
```

## 分层设计

### API

- `modules`：按领域拆分，避免巨型 service
- `common`：异常、拦截器、基类、守卫
- `config`：环境配置
- `database`：Prisma/TypeORM 可替换层，当前先保留 SQL 优先
- `integrations`：地图、实名认证、短信、支付、对象存储

### Mobile

- `core`：网络、主题、路由、鉴权
- `features`：按业务模块拆分
- `shared`：组件、状态、模型

### Admin

- `modules`：用户、整理师、订单、审核、财务、投诉
- `shared`：布局、权限、请求层

## 生产级扩展建议

- API 无状态部署，多实例挂在 Nginx / API Gateway 后
- PostgreSQL 主从 + 读写分离预留
- Redis 用于短信验证码、会话、限流、聊天在线态
- 对象存储单独域名 + CDN
- 聊天服务后续可拆 WebSocket Gateway
- 审计日志、支付流水、轨迹点全部独立表，便于风控和追责

## 核心业务流

1. 注册登录
2. 实名认证提交
3. 平台审核认证
4. 用户发布订单
5. 整理师接单
6. 用户确认锁单
7. 整理师到达并 GPS 验证
8. 输入用户验证码开始服务
9. 自动计时计费
10. 服务完成
11. 用户确认完成
12. 平台结算
13. 双方评价
14. 申诉与售后沉淀
