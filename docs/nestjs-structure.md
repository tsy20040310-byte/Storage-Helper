# NestJS 后端项目结构

```text
apps/api/src/
  main.ts
  app.module.ts
  common/
    api-response.ts
  modules/
    auth/
    verifications/
    orders/
    chats/
    payments/
    reviews/
    disputes/
    admin/
```

## 模块职责

- `auth`：短信验证码、登录、token 刷新
- `verifications`：实名认证提交流程、后台审核
- `orders`：发布订单、接单、锁单、到达验证、开工、完成
- `chats`：订单聊天、消息记录
- `payments`：预付款托管、回调、结算
- `reviews`：双向评价
- `disputes`：申诉、举报、SOS
- `admin`：运营看板、用户/订单/财务数据入口

## 下一步建议

- 接入 ORM：推荐 Prisma
- 增加 JWT 鉴权与 RBAC
- Redis 短信验证码与限流
- 文件上传签名接口
- WebSocket 聊天
- 支付 provider 抽象
- GPS 距离校验服务
