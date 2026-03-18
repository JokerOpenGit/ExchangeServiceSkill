# ExchangeService (Exchange On-Prem EWS Skill)

A Node.js skill for OpenClaw that provides EWS (SOAP) operations against on‑prem Exchange Server 2016 CU21. It supports mail, folders, and calendar/meeting workflows with explicit write confirmations.

## Highlights
- Mail list/search/read and unread count
- Mail create/update/move/copy/delete/send/reply
- Mark-all-read for a folder
- Folder CRUD
- Calendar read (CalendarView) and meeting creation
- Encrypted config for credentials (AES‑256‑GCM)

## Requirements
- Node.js 20+ (22+ recommended)
- Exchange EWS endpoint: `/EWS/Exchange.asmx`

## Install
```bash
npm install
```

## Configuration (No Plaintext Passwords)
This project **does not store passwords in plaintext**. Credentials are encrypted into `secret_store` using **AES‑256‑GCM** with a **master key** you provide.

### Generate Encrypted Config
```bash
npm run setup-config -- \
  --exchange-url https://mail.example.com/EWS/Exchange.asmx \
  --username user \
  --auth-mode ntlm \
  --password "<password>" \
  --master-key "<masterKey>"
```

This creates:
- `config/exchange.config.json` (encrypted password stored in `secret_store`)
- Sample for sharing: `config/exchange.config.sample.json`

### Core Input Parameters (Important)
- `exchange_url` / `EXCHANGE_URL`
  - Your EWS endpoint, e.g. `https://mail.example.com/EWS/Exchange.asmx`
- `username` / `EXCHANGE_USERNAME`
  - Mailbox account (can be `DOMAIN\user` or user principal)
- `auth_mode` / `EXCHANGE_AUTH_MODE`
  - `ntlm` (default) or `basic`
- `password` / `EXCHANGE_PASSWORD`
  - Used **only** during config generation; not stored in plaintext
- `master_key` / `EXCHANGE_SKILL_MASTER_KEY`
  - Used to encrypt/decrypt `secret_store` in config
- `domain` / `EXCHANGE_DOMAIN` (optional)
  - Separate domain if not embedded in username

## Safety Policy
- Read‑first by default
- Any write operation requires explicit confirmation
- Write commands require `--confirm true` (or `EXCHANGE_WRITE_CONFIRM=true`)
- `--dry-run` is supported for write commands to preview SOAP body

## Defaults That Matter
- `get-mail` / `search-mail` default scope is `all` (msgfolderroot)
- Default includes subfolders of the scope
- Default time window is last 3650 days (use `--days-back` to narrow)
- `get-calendar` default window is next 7 days (use `--start-time` / `--end-time` to override)

## Usage

Read commands:
```bash
npm run verify-login
npm run get-mail -- --unread-only --limit 10
npm run get-mail -- --scope all --limit 10
npm run get-mail -- --scope all --days-back 3650 --limit 10
npm run search-mail -- --query "keyword" --limit 10
npm run search-mail -- --scope all --query "keyword" --limit 10
npm run get-item -- --item-id <EWS_ITEM_ID>
npm run get-unread-count -- --scope all
npm run get-folder -- --distinguished-id inbox
npm run find-folder -- --parent-distinguished-id msgfolderroot --traversal Shallow --limit 50
npm run get-calendar -- --limit 20
npm run get-calendar -- --start-time 2026-03-01T00:00:00+08:00 --end-time 2026-05-01T00:00:00+08:00 --limit 200
```

Write commands (require confirm):
```bash
npm run create-mail -- --confirm true --to a@b.com --subject "s" --body "b"
npm run reply-item -- --confirm true --item-id <id> --body "thanks" --reply-all true
npm run update-item -- --confirm true --item-id <id> --subject "new"
npm run mark-all-read -- --confirm true --distinguished-id inbox
npm run create-folder -- --confirm true --display-name "My Folder" --parent-distinguished-id inbox
npm run update-folder -- --confirm true --folder-id <id> --change-key <ck> --display-name "New Name"
npm run delete-folder -- --confirm true --folder-id <id> --delete-type MoveToDeletedItems
npm run move-item -- --confirm true --item-id <id> --target-distinguished-id inbox
npm run copy-item -- --confirm true --item-id <id> --target-distinguished-id drafts
npm run delete-item -- --confirm true --item-id <id> --delete-type MoveToDeletedItems
npm run send-item -- --confirm true --item-id <draftId>
npm run send-item -- --confirm true --item-id <draftId> --change-key <ck>
npm run archive-item -- --confirm true --item-id <id>
npm run create-meeting -- --confirm true --subject "Weekly Sync" --start "2026-03-18T09:00:00+08:00" --end "2026-03-18T09:30:00+08:00" --required a@b.com --location "Room A" --body "Agenda" --send-invitations SendToAllAndSaveCopy
```

## Security Notes
- `--insecure true` relaxes TLS verification **per request only** (no global TLS disable).
- Always keep `EXCHANGE_SKILL_MASTER_KEY` private.

## Skill Listings
- ClawHub: [ExchangeService Skill](https://clawhub.ai/JokerMeC/exchangeserviceskill)

## References
- https://learn.microsoft.com/en-us/exchange/client-developer/web-service-reference/ews-operations-in-exchange

---

# 中文说明

## 项目简介
ExchangeService 是一个用于 OpenClaw 的 Node.js 技能，基于 EWS (SOAP) 访问本地部署的 Exchange Server 2016 CU21，覆盖邮件、文件夹与日历/会议能力。所有写操作需要显式确认，凭据使用 AES‑256‑GCM 加密保存。

## 主要功能
- 邮件列表/搜索/详情/未读统计
- 邮件创建/更新/移动/复制/删除/发送/回复
- 文件夹创建/更新/删除/查找
- 日历读取与创建会议

## 安装
```bash
npm install
```

## 配置（不保存明文密码）
通过 `setup-config` 生成加密配置：
```bash
npm run setup-config -- \
  --exchange-url https://mail.example.com/EWS/Exchange.asmx \
  --username user \
  --auth-mode ntlm \
  --password "<password>" \
  --master-key "<masterKey>"
```
生成文件：
- `config/exchange.config.json`（含 secret_store 加密字段）
- `config/exchange.config.sample.json`（示例配置）

## 核心输入参数说明
- `exchange_url` / `EXCHANGE_URL`：EWS 入口地址
- `username` / `EXCHANGE_USERNAME`：账号（可 `DOMAIN\user`）
- `auth_mode` / `EXCHANGE_AUTH_MODE`：`ntlm` 或 `basic`
- `password` / `EXCHANGE_PASSWORD`：仅用于生成加密配置
- `master_key` / `EXCHANGE_SKILL_MASTER_KEY`：用于加解密 `secret_store`
- `domain` / `EXCHANGE_DOMAIN`（可选）：域名

## 默认行为
- `get-mail` / `search-mail` 默认范围为全文件夹（msgfolderroot）
- 默认包含子文件夹
- 默认时间范围为最近 3650 天（可通过 `--days-back` 缩小范围）
- `get-calendar` 默认查询未来 7 天（可用 `--start-time/--end-time` 覆盖）

## 安全策略
- 读优先；写操作需 `--confirm true`
- 支持 `--dry-run` 预览 SOAP
- `--insecure true` 仅对单次请求生效，不影响全局 TLS

## 常用命令（示例）
```bash
npm run get-mail -- --unread-only --limit 10
npm run get-mail -- --scope all --days-back 3650 --limit 10
npm run search-mail -- --scope all --query "keyword" --limit 10
npm run get-unread-count -- --scope all
npm run get-calendar -- --limit 20
```

## Skill 平台收录
- ClawHub： [ExchangeService Skill](https://clawhub.ai/JokerMeC/exchangeserviceskill)
