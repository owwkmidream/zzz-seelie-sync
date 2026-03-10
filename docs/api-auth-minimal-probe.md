# HoYo 端点最小鉴权结构实测报告

## 1. 说明

这份文档只记录一件事：

- 当前仓库 `src/api/hoyo/*` 涉及到的 HoYo 端点
- 在真实环境下，按 `D:\2.js` + 真实存储样本复现后，端点真正接受的最小显式鉴权结构

本次输入样本：

- `D:\2.js`
  - 提供 `COMMON_COOKIES`
  - 提供 `USER_AGENT`
  - 提供 `UID / REGION / GAME_BIZ`
  - 提供 `x-rpc-device_id / x-rpc-device_fp`
- 外部 fixture
  - `zzz_device_info`
  - `zzz_hoyo_auth_bundle`
  - `zzz_passport_tokens`

约束：

- 文档只记录键名、头名、模板来源与结果
- 不落任何真实 token / cookie 实值
- `stoken` 端点按 `authBundle` / `legacy` 两套 `stoken` 分别实测

## 2. 方法

临时脚本：`temp/hoyo-auth-probe.cjs`

探测流程固定为两步：

1. 先用 `2.js` 或参考仓库模板找一套能成功的基线请求
2. 再对同一套基线做最小化：
   - 先缩 Cookie
   - 再缩 Header

口径说明：

- “最小 Cookie / 最小 Header”指**显式发送**的最小集合
- 不把传输层自动头算进来
- `e_nap_token` 依赖端点每次都会 fresh 一次 token 再测
- `getFp` 额外记录 body 画像来源，因为它的关键约束不只在 header

## 3. 结果总览

| 端点 | 结果 | 成功模板 | 最小 Cookie | 最小 Header | 备注 |
| --- | --- | --- | --- | --- | --- |
| `createQRLogin` | 成功 | `TeyvatGuide/current-repo QR` | 无 | `x-rpc-app_id`, `x-rpc-device_id` | 探测期曾短暂命中过 `-3502`，但最终复跑成功 |
| `queryQRLoginStatus` | 成功 | `TeyvatGuide/current-repo QR` | 无 | `x-rpc-app_id`, `x-rpc-device_id` | 对 fresh ticket 返回 `Created` |
| `getCookieAccountInfoBySToken.authBundle` | 成功 | `current-repo X4 mobile` | `mid`, `stoken` | 无 | `authBundle.stoken` 可用 |
| `getCookieAccountInfoBySToken.legacy` | 成功 | `current-repo X4 mobile` | `mid`, `stoken` | 无 | `legacy stoken` 也可用 |
| `getLTokenBySToken.authBundle` | 成功 | `current-repo X4 mobile` | `mid`, `stoken` | 无 | `authBundle.stoken` 可用 |
| `getLTokenBySToken.legacy` | 成功 | `current-repo X4 mobile` | `mid`, `stoken` | 无 | `legacy stoken` 也可用 |
| `verifyCookieToken` | 成功 | `2.js minimal` | `account_mid_v2`, `cookie_token_v2` | 无 | 不需要额外显式头 |
| `getUserGameRolesByCookieToken` | 成功 | `current-repo / cleaned-json web` | `account_mid_v2`, `cookie_token_v2` | 无 | 角色发现最小显式结构与 `verifyCookieToken` 一致 |
| `login/account` | 成功 | `2.js minimal` | `account_mid_v2`, `cookie_token_v2` | 无 | 成功返回 `e_nap_token` |
| `login/info` | 成功 | `minimal web session` | `e_nap_token` | 无 | 只要 fresh `e_nap_token` |
| `avatar_basic_list` | 成功 | `2.js minimal cultivate` | `e_nap_token` | `x-rpc-device_fp` | `device_id` / `platform` 可不显式带 |
| `batch_avatar_detail_v2` | 成功 | `2.js minimal cultivate` | `e_nap_token` | `x-rpc-device_fp` | 与 `avatar_basic_list` 一致 |
| `avatar_calc` | 成功 | `2.js minimal cultivate` | `e_nap_token` | 无 | body 使用真实角色样本参数 |
| `note` | 成功 | `current-repo mobile note` | `ltoken`, `ltuid` | `x-rpc-device_id` | `device_fp` 可不显式带 |
| `getFp` | 成功 | `current-repo / TeyvatGuide Xiaomi ext_fields` | 无 | 无 | 关键在 body：`device_id/seed_id/seed_time/device_fp/bbs_device_id/ext_fields` |

## 4. 关键结论

### 4.1 Passport / Token 派生

- `getCookieAccountInfoBySToken`
  - 最小显式 Cookie：`mid + stoken`
  - 当前样本下，不需要额外显式 Header 就能成功
- `getLTokenBySToken`
  - 最小显式 Cookie：`mid + stoken`
  - 当前样本下，不需要额外显式 Header 就能成功
- 两套 `stoken` 都能换出结果：
  - `zzz_hoyo_auth_bundle.stoken`
  - `zzz_passport_tokens.stoken`

### 4.2 CookieToken / NapToken 链

- `verifyCookieToken`
  - 最小显式 Cookie：`account_mid_v2 + cookie_token_v2`
- `getUserGameRolesByCookieToken`
  - 最小显式 Cookie：`account_mid_v2 + cookie_token_v2`
- `login/account`
  - 最小显式 Cookie：`account_mid_v2 + cookie_token_v2`
  - 成功后从 `Set-Cookie` 抽 `e_nap_token`

### 4.3 Nap 业务端点

- `login/info`
  - 最小显式 Cookie：`e_nap_token`
  - 不需要额外显式 Header
- `avatar_basic_list`
  - 最小显式 Cookie：`e_nap_token`
  - 最小显式 Header：`x-rpc-device_fp`
- `batch_avatar_detail_v2`
  - 最小显式 Cookie：`e_nap_token`
  - 最小显式 Header：`x-rpc-device_fp`
- `avatar_calc`
  - 最小显式 Cookie：`e_nap_token`
  - 当前样本下不需要额外显式 Header

说明：

- 上面四个端点的结果都基于 fresh `e_nap_token`
- 这表示“端点本身”的最小结构，不包含“如何先拿到 `e_nap_token`”

### 4.4 Game Record / Device

- `note`
  - 最小显式 Cookie：`ltoken + ltuid`
  - 最小显式 Header：`x-rpc-device_id`
- `getFp`
  - header/cookie 不是关键约束
  - 当前成功模板的关键是 body 画像：
    - `device_id`
    - `seed_id`
    - `seed_time`
    - `device_fp`
    - `bbs_device_id`
    - `ext_fields`
  - 当前成功 body 画像来源：`current-repo / TeyvatGuide Xiaomi ext_fields`

## 5. QR 端点说明

`createQRLogin` / `queryQRLoginStatus` 在最终复跑里都成功了：

- `createQRLogin`
  - `retcode = 0`
  - 可正常拿到 `ticket`
- `queryQRLoginStatus`
  - 对 fresh `ticket` 返回 `status = Created`

当前显式最小 Header 为：

- `x-rpc-app_id`
- `x-rpc-device_id`

补充说明：

- 这两个端点在同一轮探测里曾短暂命中过 `retcode=-3502`
- 说明 QR 端点存在频控窗口，但在当前样本下仍可被真实复现

## 6. 对当前脚本改造的直接意义

这次实测后，当前仓库里最值得保留的“真实最小结构”是：

- `mid + stoken` -> `cookie_token / ltoken`
- `account_mid_v2 + cookie_token_v2` -> `verifyCookieToken / getUserGameRolesByCookieToken / login/account`
- `e_nap_token` -> `login/info / avatar_*`
- `ltoken + ltuid` -> `note`
- `getFp` 关键在 body 画像，而不是额外 Cookie

换句话说，后续如果继续收紧运行时鉴权逻辑，应优先删掉：

- 对 `stoken` 交换端点的多余显式头依赖
- 对 NAP 业务端点里不必要的浏览器风格显式头
- 对 `note` 端点里不必要的显式 `device_fp`

同时要保留：

- `e_nap_token` 的 fresh 获取
- `getFp` 的稳定设备画像与 `ext_fields`
