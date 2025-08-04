### 获取设备指纹（`device_fp`）

**国服：**

_请求方式：POST_

`https://public-data-api.mihoyo.com/device-fp/api/getFp`

**JSON 请求：**

| 字段       | 类型 | 内容                                  | 备注                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| device_id  | str  | 设备 ID                               |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| seed_id    | str  | 一般为随机值                          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| seed_time  | str  | 当前的 Unix 时间戳                    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| platform   | str  | 设备平台<br>1 iOS<br>2 安卓<br>4 网页 | 不同的设备平台需要在`ext_fields`字段中填写的的内容不同                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| device_fp  | str  | 设备指纹                              | 在此处可随机生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| app_name   | str  | 请求的应用标识符<br>bbs_cn 米游社     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ext_fields | str  | 一些设备信息                          | 为 JSON 字符串。若`platform`为`4`，则必须包含`userAgent`字段；若`platform`为`2`，则需要包含['cpuType', 'romCapacity', 'productName', 'romRemain', 'manufacturer', 'appMemory', 'hostname', 'screenSize', 'osVersion', 'aaid', 'vendor', 'accelerometer', 'buildTags', 'model', 'brand', 'oaid', 'hardware', 'deviceType', 'devId', 'serialNumber', 'buildTime', 'buildUser', 'ramCapacity', 'magnetometer', 'display', 'ramRemain', 'deviceInfo', 'gyroscope', 'vaid', 'buildType', 'sdkVersion', 'board']字段 |

```json
{
    "device_id": "2d356b22f39b708c",
    "seed_id": "d81de6f4-6aa3-4e5f-b8e8-6a4f98e15a76",
    "seed_time": "1692248006205",
    "platform": "2",
    "device_fp": "38d7efe8b7f79",
    "app_name": "bbs_cn",
    "ext_fields": "{
    \"cpuType\":\"arm64-v8a\",
    \"romCapacity\":\"512\",
    \"productName\":\"ishtar\",
    \"romRemain\":\"459\",
    \"manufacturer\":\"Xiaomi\",
    \"appMemory\":\"512\",
    \"hostname\":\"xiaomi.eu\",
    \"screenSize\":\"1440x3022\",
    \"osVersion\":\"13\",
    \"aaid\":\"a945fe0c-5f49-4481-9ee8-418e74508414\",
    \"vendor\":\"中国电信\",
    \"accelerometer\":\"0.061016977x0.8362915x9.826724\",
    \"buildTags\":\"release-keys\",
    \"model\":\"2304FPN6DC\",
    \"brand\":\"Xiaomi\",
    \"oaid\":\"67b292338ad57a24\",
    \"hardware\":\"qcom\",
    \"deviceType\":\"ishtar\",
    \"devId\":\"REL\",
    \"serialNumber\":\"unknown\",
    \"buildTime\":\"1690889245000\",
    \"buildUser\":\"builder\",
    \"ramCapacity\":\"229481\",
    \"magnetometer\":\"80.64375x-14.1x77.90625\",
    \"display\":\"TKQ1.221114.001 release-keys\",
    \"ramRemain\":\"110308\",
    \"deviceInfo\":\"Xiaomi/ishtar/ishtar:13/TKQ1.221114.001/V14.0.17.0.TMACNXM:user/release-keys\",
    \"gyroscope\":\"7.9894776E-4x-1.3315796E-4x6.6578976E-4\",
    \"vaid\":\"4c10d338150078d8\",
    \"buildType\":\"user\",
    \"sdkVersion\":\"33\",
    \"board\":\"kalama\"
  }",
    "bbs_device_id": "b66a6178-f56d-30ed-97aa-297560c98fc1"
}
```

**JSON 返回：**

根对象：

| 字段    | 类型 | 内容                          | 备注 |
| ------- | ---- | ----------------------------- | ---- |
| retcode | num  | 返回码<br>-502 传入的内容有误 |      |
| message | str  | 返回消息                      |      |
| data    | obj  | 设备指纹                      |      |

`data`对象：

| 字段      | 类型 | 内容     | 备注 |
| --------- | ---- | -------- | ---- |
| device_fp | str  | 设备指纹 |      |
| code      | num  | 返回码   |      |
| msg       | str  | 错误消息 |      |

```json
{
  "message": "OK",
  "retcode": 0,
  "data": {
    "code": 200,
    "device_fp": "ui33vcedffou",
    "msg": "ok"
  }
}
```
