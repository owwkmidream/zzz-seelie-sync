# HoYo 鉴权与 Cookie 路由清单

## 1. 目的

这份文档记录 `zzz-seelie-sync` 当前已经落地的 HoYo 鉴权架构。

它不再是“猜测某个接口可能吃哪些 Cookie”的草稿，而是当前代码中的**实现事实**：

- 根凭证怎么来
- 脚本如何派生 `ltoken` / `cookie_token` / `e_nap_token`
- 每类接口走哪一组 Cookie
- 每类接口带哪一套手机头 profile
- 设备档案如何持久化与刷新

## 2. 当前总架构

### 2.1 主链路

```text
扫码登录
  -> stoken + mid (+ stuid)
  -> getCookieAccountInfoBySToken
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
  - `deviceId / requestDeviceId / seedId / seedTime / product / deviceName / deviceFp`
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

### 3.2 DeviceProfile

存储位置：

- `GM` 真值
- `localStorage` 镜像
- key: `zzz_device_info`

核心字段：

- `deviceId`
  - 请求头与 `bbs_device_id` 使用的稳定 UUID
- `requestDeviceId`
  - `getFp` body 里的稳定 16 位 hex
- `seedId`
- `seedTime`
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

- `getLTokenBySToken`
- `getCookieAccountInfoBySToken`

特征：

- 纯手机 UA
- `Referer: https://webstatic.mihoyo.com/`
- `X-Requested-With: com.mihoyo.hyperion`
- `x-rpc-app_version`
- `x-rpc-client_type: 5`
- `x-rpc-device_id`
- `x-rpc-device_fp`
- `DS(X4)`

### 4.3 Role Discovery Profile

用途：

- `passport-api/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn`

特征：

- Web/PC UA
- `Origin/Referer: https://act.mihoyo.com/`
- `x-rpc-mi_referrer: https://act.mihoyo.com/zzz/gt/character-builder-h#/`

### 4.4 Nap Bootstrap / Nap Session Profile

用途：

- `common/badge/v1/login/account`
- `common/badge/v1/login/info`
- `event/nap_cultivate_tool/*`

特征：

- Web/PC UA
- `Referer: https://act.mihoyo.com/`
- `Origin: https://act.mihoyo.com/`
- `x-rpc-mi_referrer: https://act.mihoyo.com/zzz/gt/character-builder-h#/`
- `login/account` 不要求设备头
- `nap_cultivate_tool` 会补 `x-rpc-device_id/x-rpc-device_fp` 与 `x-rpc-platform=4`

### 4.5 Game Record Profile

用途：

- `event/game_record_zzz/api/zzz/note`

特征：

- 纯手机 UA
- `Referer: https://act.mihoyo.com/`
- `x-rpc-app_version`
- `x-rpc-client_type: 5`
- `x-rpc-device_id`
- `x-rpc-device_fp`
- 当前实现**不附带 DS**

## 5. 接口路由矩阵

| 接口族 | 主 Cookie 组 | 备用组 | 头部 profile | 说明 |
| --- | --- | --- | --- | --- |
| `createQRLogin` / `queryQRLoginStatus` | 无 | 无 | `QR_PROFILE` | 只依赖设备 ID |
| `getLTokenBySToken` | `mid + stoken (+ stuid)` | 无 | `STOKEN_EXCHANGE` | 从根凭证派生 `ltoken`（用于战绩接口） |
| `getCookieAccountInfoBySToken` | `mid + stoken (+ stuid)` | 无 | `STOKEN_EXCHANGE` | 从根凭证派生 `cookie_token` |
| `getUserGameRolesByCookieToken` | `cookie_token + account_id` | 无 | `ROLE_DISCOVERY` | passport-api 角色发现入口 |
| `login/account` | `cookie_token + account_id` | 无 | `NAP_BOOTSTRAP` | 从响应 `Set-Cookie` 抓 `e_nap_token` |
| `login/info` | `e_nap_token` | 无 | `NAP_SESSION` | 用于确认业务态与补齐用户缓存 |
| `avatar_basic_list` | `e_nap_token` | 无 | `NAP_SESSION` | `client.request()` 自动路由 |
| `batch_avatar_detail_v2` | `e_nap_token` | 无 | `NAP_SESSION` | `client.request()` 自动路由 |
| `avatar_calc` | `e_nap_token` | 无 | `NAP_SESSION` | `client.request()` 自动路由 |
| `game_record_zzz/api/zzz/note` | `ltoken + ltuid` | 无 | `GAME_RECORD` | `client.request()` 自动路由 |

## 6. 代码模块分工

- `src/api/hoyo/authStore.ts`
  - 托管 `AuthBundle`
- `src/api/hoyo/deviceProfile.ts`
  - 托管 `DeviceProfile`
- `src/api/hoyo/cookieJar.ts`
  - 负责拼 Cookie 与解析 `Set-Cookie`
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

- 这次改造已经完成静态实现，并通过：
  - `type-check`
  - `lint`
  - `build`
- 但**尚未使用真实账号重新回归整套新链路**，尤其是：
  - `login/account` 当前只走 `ltoken + ltuid`，不会再尝试其它 Cookie 组合
  - `Set-Cookie` 在 Tampermonkey `GM.xmlHttpRequest` 响应头中的稳定性
- 当前没有实现 `action_ticket` 分支。
  - 如果后续发现 `login/account` 仍不稳定，再把 `stoken -> action_ticket -> role` 作为第二阶段链路引入。
