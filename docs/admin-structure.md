# 管理后台结构

## 页面模块

- 总览 Dashboard
- 用户管理
- 整理师管理
- 订单管理
- 实名认证审核
- 投诉与维权
- 财务统计
- 信誉分管理
- 内容审核
- 数据报表

## 权限分层

- `super_admin`
- `ops_admin`
- `finance_admin`
- `support_admin`
- `review_admin`

## 前端目录建议

```text
src/
  app/
  modules/
    dashboard/
    users/
    organizers/
    orders/
    verifications/
    disputes/
    finance/
  shared/
    api/
    components/
    layout/
    router/
```
