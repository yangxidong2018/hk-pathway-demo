# 赴港通 Vercel 部署说明

## 1. 上传 GitHub

解压部署包，把解压目录中的全部内容上传到 GitHub 仓库根目录。应能在仓库首页直接看到 `api`、`lib`、`public`、`package.json` 和 `vercel.json`，不要再多套一层文件夹。

## 2. 配置 Vercel

在 Vercel 项目 Settings → Environment Variables 中配置 `.env.example` 列出的变量。密钥类变量不要写入 GitHub。

本次新增且线上必须配置：

- `FEISHU_CHAT_SESSION_TABLE_ID=tblrkxE2aWLKggvo`
- `FEISHU_CHAT_MESSAGE_TABLE_ID=tbl5V7N1H8VN2bi2`
- `FEISHU_PROVIDER_RECOMMENDATION_TABLE_ID=tblrzjJbXdqGP3Iw`
- `FEISHU_PROVIDER_TABLE_ID=tblhlxcMat7GWFw2`

同时保留原有飞书 App ID、App Secret、App Token、三张客户/评估表 ID，以及 LinkAI 的 App Code 和 API Key。

## 3. 重新部署

GitHub 提交后 Vercel 会自动部署。如果刚修改过环境变量，在 Deployments 中选择最新部署并 Redeploy，取消使用旧 Build Cache。

## 4. 线上验收

1. 使用一个新的测试手机号登录。
2. 完成赴港评估并进入个性化首页。
3. 确认首页显示 1—3 个行动事件及服务商推荐。
4. 进入 AI 对话发送两条消息，返回首页后再次进入，确认记录仍存在。
5. 使用另一台设备或无痕窗口登录同一手机号，确认云端聊天记录恢复。
6. 在飞书确认客户、评估、推荐、会话、消息五类记录的用户 ID 一致。
