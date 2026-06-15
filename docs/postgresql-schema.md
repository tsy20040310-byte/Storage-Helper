# PostgreSQL 表结构设计

完整 SQL 见：

- [infra/sql/init/001_schema.sql](C:/Users/81230/Documents/整理收纳app/infra/sql/init/001_schema.sql)

## 设计原则

- 主键统一使用 `uuid`
- 所有金额用 `numeric(12,2)`
- 所有时间用 `timestamptz`
- 订单、支付、认证、信誉日志都保留状态流转字段
- 高频查询字段建立组合索引

## 核心表

### 用户与认证

- `users`
- `user_profiles`
- `identity_verifications`
- `addresses`
- `trust_score_logs`

### 整理师能力

- `service_profiles`
- `organizer_services`
- `organizer_pricing_rules`

### 订单与履约

- `orders`
- `order_media`
- `order_applications`
- `service_sessions`
- `gps_checkins`
- `order_bills`

### 沟通与售后

- `chats`
- `chat_participants`
- `messages`
- `reviews`
- `disputes`
- `dispute_evidences`

### 支付结算

- `payment_transactions`
- `payouts`

## 关键状态枚举

### `users.role`

- `client`
- `organizer`
- `admin`

### `identity_verifications.review_status`

- `unverified`
- `pending`
- `approved`
- `rejected`

### `orders.status`

- `draft`
- `published`
- `applied`
- `awaiting_client_confirmation`
- `locked`
- `in_service`
- `awaiting_completion_confirmation`
- `completed`
- `cancelled`
- `disputed`

### `order_applications.status`

- `pending`
- `accepted`
- `rejected`
- `withdrawn`

### `payment_transactions.status`

- `pending`
- `authorized`
- `escrowed`
- `settled`
- `refunded`
- `failed`
