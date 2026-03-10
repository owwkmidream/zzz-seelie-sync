# HoYo 鉴权与 Cookie 路由清单

## 1. 目的

这份文档记录两类事实：

- 当前仓库里的 HoYo 鉴权架构
- 基于真实样本跑出来的端点最小鉴权结构

详细实测报告见：

- `docs/api-auth-minimal-probe.md`

这里保留总览，不再把“实现意图”和“实测结论”混在一起。

## 1.1 本次实测输入

- `D:\2.js`
  - 提供 `COMMON_COOKIES`
  - 提供 `USER_AGENT`
  - 提供 `UID / REGION / GAME_BIZ`
  - 提供 `x-rpc-device_id / x-rpc-device_fp`
- 外部 fixture
  - `zzz_device_info`
  - `zzz_hoyo_auth_bundle`
  - `zzz_passport_tokens`

## 1.2 实测摘要

| 端点 | 当前实测最小 Cookie | 当前实测最小 Header | 备注 |
| --- | --- | --- | --- |
| `getCookieAccountInfoBySToken` | `mid + stoken` | 无 | `authBundle` / `legacy` 两套 `stoken` 都成功 |
| `getLTokenBySToken` | `mid + stoken` | 无 | `authBundle` / `legacy` 两套 `stoken` 都成功 |
| `verifyCookieToken` | `account_id + cookie_token` | 无 | 以脚本托管 QR 链路为准 |
| `getUserGameRolesByCookieToken` | `account_id + cookie_token` | 无 | 以脚本托管 QR 链路为准 |
| `login/account` | `account_id + cookie_token` | 无 | 成功写出 `e_nap_token` |
| `login/info` | `e_nap_token` | 无 | 只认业务 token |
| `avatar_basic_list` | `e_nap_token` | `x-rpc-device_fp` | `device_id` / `platform` 可不显式带 |
| `batch_avatar_detail_v2` | `e_nap_token` | `x-rpc-device_fp` | 与基础列表一致 |
| `avatar_calc` | `e_nap_token` | 无 | 当前样本下不需要额外显式头 |
| `note` | `ltoken + ltuid` | `x-rpc-device_id` | `device_fp` 可不显式带 |
| `getFp` | 无 | 无 | 关键在 body 的设备画像与 `ext_fields` |
| `createQRLogin` / `queryQRLoginStatus` | 无 | `x-rpc-app_id + x-rpc-device_id` | 最终复跑成功；探测过程中出现过短暂 `-3502` 频控 |

## 2. 当前总架构

### 2.1 主链路

```text
扫码登录
  -> stoken + mid (+ stuid)
  -> getCookieAccountInfoBySToken
  -> cookie_token + account_id
  -> getUserGameRolesByCookieToken (passport-api)
  -> login/account
  -> 从 Set-Cookie 抓取 e_nap_token
  -> login/info / nap_cultivate_tool/*
```

### 2.2 当前原则

- **不再依赖浏览器自动 Cookie**
  - 所有 HoYo 鉴权请求默认走 `anonymous: true`
  - Cookie 由脚本显式拼接并注入
- **不再依赖浏览器 `_MHYUUID`**
  - 设备档案完全由脚本持久化
- **统一纯手机 persona**
  - 非二维码接口统一走 Android 手机头
  - 不再使用旧版 `Pixel + windows_x86_64 + 浏览器环境` 的混搭画像
- **设备身份长期复用**
  - `deviceId / seedId / seedTime / product / deviceName / deviceFp`
    都由脚本长期持久化

## 3. 存储模型

### 3.1 AuthBundle

存储位置：

- `GM` 存储
- key: `zzz_hoyo_auth_bundle`

核心字段：

- 根凭证
  - `stoken`
  - `mid`
  - `stuid`
- 派生 token
  - `ltoken`
  - `ltuid`
  - `cookieToken`
  - `accountId`
  - `eNapToken`
- 运行态辅助信息
  - `selectedRole`
  - `rootTokensUpdatedAt`
  - `ltokenUpdatedAt`
  - `cookieTokenUpdatedAt`
  - `eNapTokenUpdatedAt`
  - `roleUpdatedAt`

迁移规则：

- 旧版 `zzz_passport_tokens` 会自动迁移到新结构
- 根凭证发生变化时，派生 token 会整体失效并重建
- 2026-03-11 起，当前 NAP 运行时重新以 `cookieToken + accountId` 为主
- 早前基于 `D:\\2.js` 观察到的 `cookie_token_v2/account_mid_v2` 仅视为浏览器上下文现象，不再当作脚本托管主链事实

### 3.2 DeviceProfile

存储位置：

- `GM` 真值
- `localStorage` 镜像
- key: `zzz_device_info`

核心字段：

- `deviceId`
  - 请求头与 `getFp.body.device_id` 使用的稳定 UUID
- `seedId`
  - `getFp` body 里的稳定 16 位 hex
- `seedTime`
  - `getFp` body 里的稳定毫秒时间戳
- `product`
- `deviceName`
- `deviceFp`
- `updatedAt`

刷新规则：

- 首次创建时 `deviceFp = 0000000000000`
- 以下情况刷新 `device_fp`
  - 占位值
  - 超过 3 天
  - 命中设备相关错误码
  - 用户手动“重置设备信息”
- 普通刷新只更新：
  - `deviceFp`
  - `updatedAt`
- 用户手动重置时才重建整份设备档案

## 4. Header Profile

### 4.1 QR Profile

用途：

- `createQRLogin`
- `queryQRLoginStatus`

特征：

- `User-Agent: HYPContainer/1.3.3.182`
- `x-rpc-app_id: ddxf5dufpuyo`
- `x-rpc-client_type: 3`
- `x-rpc-device_id: <deviceId>`

### 4.2 Stoken Exchange Profile

用途：

- `getCookieAccountInfoBySToken`
- `getLTokenBySToken`

特征：

- 当前 NAP 主链只依赖 `mid + stoken`
- `getCookieAccountInfoBySToken` 运行时不再显式拼额外鉴权头
- `getLTokenBySToken` 运行时也不再显式拼额外鉴权头
- `note` 链若缺 `ltuid/stuid`，会先用 `getCookieAccountInfoBySToken` 自动补 uid，再刷新 `ltoken`

### 4.3 Role Discovery Profile

用途：

- `passport-api/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn`

特征：

- 当前运行时只依赖 `account_id + cookie_token`
- 不再显式拼额外鉴权头

### 4.4 Nap Bootstrap / Nap Session Profile

用途：

- `common/badge/v1/login/account`
- `common/badge/v1/login/info`
- `event/nap_cultivate_tool/*`

特征：

- `login/account` 不再显式拼业务鉴权头
- `login/info` 不再显式拼业务鉴权头
- `avatar_basic_list` / `batch_avatar_detail_v2` 只显式补 `x-rpc-device_fp`
- `avatar_calc` 不再显式拼业务鉴权头

### 4.5 Game Record Profile

用途：

- `event/game_record_zzz/api/zzz/note`

特征：

- 当前运行时只依赖 `ltoken + ltuid`
- 当前显式最小业务头只保留 `x-rpc-device_id`
- `note` 路由不再强制要求已刷新 `device_fp`
- 当前实现**不附带 DS**

## 5. 接口路由矩阵

| 接口族 | 当前实测最小 Cookie | 当前实测最小 Header | 说明 |
| --- | --- | --- | --- |
| `createQRLogin` / `queryQRLoginStatus` | 无 | `x-rpc-app_id + x-rpc-device_id` | 当前样本下已真实成功；中途出现过短暂 `-3502` 频控 |
| `getLTokenBySToken` | `mid + stoken` | 无 | `authBundle` / `legacy` 两套都成功 |
| `getCookieAccountInfoBySToken` | `mid + stoken` | 无 | `authBundle` / `legacy` 两套都成功 |
| `getUserGameRolesByCookieToken` | `account_id + cookie_token` | 无 | passport-api 角色发现入口 |
| `login/account` | `account_id + cookie_token` | 无 | 从响应 `Set-Cookie` 抓 `e_nap_token` |
| `login/info` | `e_nap_token` | 无 | 只依赖业务 token |
| `avatar_basic_list` | `e_nap_token` | `x-rpc-device_fp` | 当前显式最小头只剩 `device_fp` |
| `batch_avatar_detail_v2` | `e_nap_token` | `x-rpc-device_fp` | 与基础列表一致 |
| `avatar_calc` | `e_nap_token` | 无 | 当前样本下不需要额外显式头 |
| `game_record_zzz/api/zzz/note` | `ltoken + ltuid` | `x-rpc-device_id` | 当前显式最小头只剩 `device_id` |
| `device-fp/api/getFp` | 无 | 无 | 关键在 body：`device_id/seed_id/seed_time/device_fp/ext_fields` |

## 6. 代码模块分工

- `src/api/hoyo/authStore.ts`
  - 托管 `AuthBundle`
- `src/api/hoyo/deviceProfile.ts`
  - 托管 `DeviceProfile`
- `src/api/hoyo/deviceProfileCore.ts`
  - 负责设备档案的创建、解析与 `device_fp` 刷新判定
- `src/api/hoyo/cookieJar.ts`
  - 负责拼 Cookie 与解析 `Set-Cookie`
- `src/api/hoyo/passportCore.ts`
  - 负责 `stoken -> cookie_token -> role -> e_nap_token` 的可测核心流程
- `src/api/hoyo/recordAuthCore.ts`
  - 负责 `mid + stoken -> uid/ltuid -> ltoken` 的可测核心流程
- `src/api/hoyo/requestCore.ts`
  - 负责 NAP/Note 请求的重试、singleflight 与 `device_fp` 刷新编排
- `src/api/hoyo/headerProfiles.ts`
  - 负责手机头 profile
- `src/api/hoyo/ds.ts`
  - 负责 `DS` 生成
- `src/api/hoyo/passportService.ts`
  - 负责扫码、`stoken -> cookie_token`、角色发现（passport-api）、`e_nap_token` 自举
- `src/api/hoyo/authService.ts`
  - 负责用户缓存与 `login/info`
- `src/api/hoyo/client.ts`
  - 负责把业务请求路由到 `NAP_SESSION` 或 `GAME_RECORD`

## 7. 与旧实现的关键差异

旧实现：

- 依赖浏览器自动 Cookie
- 依赖 `GM.cookie.list()` 读取 `_MHYUUID`
- 设备画像混入 `windows_x86_64`
- `login/account` 写出来的 `e_nap_token` 不会被脚本主动捕获

当前实现：

- Cookie 全部脚本手工注入
- `GM_fetch` 会保留原始响应头，脚本主动从 `Set-Cookie` 解析 `e_nap_token`
- 设备档案长期持久化，且与手机头 profile 一致
- `note` 与 `nap_cultivate_tool` 被明确拆成两套路由

## 8. 当前已知边界

- 这份文档里的“最小结构”是**当前样本**下的真实结果，不承诺跨账号、跨地区、跨时间都完全一致。
- `createQRLogin` / `queryQRLoginStatus` 在本次探测中既出现过成功，也出现过短暂 `retcode=-3502`。
  - 说明当前结构可用，但频控窗口确实存在。
- `getFp` 不能只看 header/cookie。
  - 它真正敏感的是 body 里的设备画像，尤其是 `ext_fields`。
- 当前 `getFp` 运行时已经不再显式拼业务鉴权头，但这不代表 body 画像可以随便改。
  - 真正需要长期保持稳定的是：`deviceId / seedId / seedTime / product / deviceName / ext_fields`。
- `note` 运行时已经按最小结构收敛，但这仍然是静态/单测层验证，不代表已经完成浏览器实网回归。
- `e_nap_token` 依赖端点的最小 Cookie 指“端点本身”只需要 `e_nap_token`。
  - 不包含“如何先拿到 `e_nap_token`”这一条前置链路。
