# REST API 设计

Base URL: `/api/v1`

## 认证

### `POST /auth/send-code`

发送短信验证码。

### `POST /auth/login`

手机号 + 验证码登录，返回 access token / refresh token。

### `POST /auth/refresh`

刷新 token。

## 实名认证

### `POST /verifications/identity`

提交实名信息与证件照片。

### `GET /verifications/identity/me`

查看自己的认证状态。

### `PATCH /admin/verifications/identity/:id/review`

后台审核实名认证。

## 订单

### `POST /orders`

创建订单。

请求体核心字段：

- `title`
- `description`
- `serviceAddress`
- `floor`
- `hasElevator`
- `scheduledStartAt`
- `estimatedDurationMinutes`
- `storageSupplyStatus`
- `sameGenderOnly`
- `media[]`

### `GET /orders`

订单列表，支持城市、状态、时间、价格区间筛选。

### `GET /orders/:id`

订单详情。

### `POST /orders/:id/applications`

整理师申请接单。

### `PATCH /orders/:id/applications/:applicationId/confirm`

用户确认整理师，订单锁定。

### `POST /orders/:id/arrival-check`

上门 GPS 验证。

### `POST /orders/:id/start`

输入 6 位验证码开始计时。

### `POST /orders/:id/complete`

整理师提交服务完成。

### `POST /orders/:id/client-confirm-completion`

用户确认完成，触发结算。

## 聊天

### `GET /chats`

会话列表。

### `GET /chats/:id/messages`

消息列表。

### `POST /chats/:id/messages`

发送消息，支持文本、图片、视频、位置。

## 支付

### `POST /payments/orders/:id/prepay`

用户预付款托管。

### `POST /payments/webhooks/provider`

支付回调。

### `POST /admin/payouts/:id/settle`

后台结算给整理师。

## 评价

### `POST /orders/:id/reviews`

订单完成后互评。

## 售后

### `POST /disputes`

提交申诉或举报。

### `POST /sos`

紧急求助，记录订单、位置、时间。

## 管理后台

### `GET /admin/dashboard/overview`

返回：

- 日活
- 新增用户
- 订单量
- 成交额
- 客单价
- 复购率

### `GET /admin/users`
### `GET /admin/organizers`
### `GET /admin/orders`
### `GET /admin/disputes`
### `GET /admin/finance/summary`

## 鉴权与权限

- `client`：发布订单、支付、评价、申诉
- `organizer`：申请接单、到达打卡、开始/完成服务
- `admin`：审核、风控、客服、财务、运营

## 扩展约定

- 所有列表接口统一支持 `page`、`pageSize`
- 统一响应包结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "uuid"
}
```
