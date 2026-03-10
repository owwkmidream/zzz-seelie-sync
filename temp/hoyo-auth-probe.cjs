const fs = require('fs');
const crypto = require('crypto');

const DEFAULT_TWO_JS_PATH = 'D:/2.js';
const DEFAULT_FIXTURE_PATH = 'D:/download/zzz-hoyo-probe-fixture.json';
const DEFAULT_JSON_OUTPUT_PATH = 'D:/download/hoyo-auth-probe-results.json';
const DEFAULT_MARKDOWN_OUTPUT_PATH = 'D:/download/hoyo-auth-probe-report.md';

const CONSTS = {
  appVersionCurrent: '2.102.1',
  hypContainerVersion: '1.3.3.182',
  qrAppId: 'ddxf5dufpuyo',
  verifyAppId: 'cieb8o6xs1kw',
  webMiReferrer: 'https://act.mihoyo.com/zzz/gt/character-builder-h#/',
  actReferer: 'https://act.mihoyo.com/',
  webstaticReferer: 'https://webstatic.mihoyo.com/',
  mobileUserAgentCurrent: 'Mozilla/5.0 (Linux; Android 12) Mobile miHoYoBBS/2.102.1',
  teyvatGuideWindowsBbsUa: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) miHoYoBBS/2.102.1',
  starwardHyperionUa:
    'Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.90.1',
  starwardHyperionVersion: '2.90.1',
  x4Salt: 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
  zhCn: 'zh-cn',
};

const SKILL_TYPES = [0, 1, 2, 3, 5, 6];

function parseArgs(argv) {
  const args = new Map();
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const separator = arg.indexOf('=');
    if (separator === -1) {
      args.set(arg.slice(2), 'true');
      continue;
    }

    args.set(arg.slice(2, separator), arg.slice(separator + 1));
  }

  return args;
}

function getArg(args, name, fallback) {
  return args.has(name) ? args.get(name) : fallback;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function extractConst(source, name) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*"([^"]*)";`);
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing const ${name}`);
  }

  return match[1];
}

function extractHeaderValue(source, headerName) {
  const escapedName = headerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`'${escapedName}'\\s*:\\s*'([^']*)'`);
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing header ${headerName}`);
  }

  return match[1];
}

function parseCookieHeader(header) {
  const map = new Map();
  for (const part of header.split(';')) {
    const item = part.trim();
    if (!item) {
      continue;
    }

    const separator = item.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    map.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
  }

  return map;
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return JSON.parse(value);
}

function parseFixture(filePath) {
  const raw = JSON.parse(readText(filePath));
  return {
    deviceInfo: parseMaybeJson(raw.zzz_device_info),
    authBundle: parseMaybeJson(raw.zzz_hoyo_auth_bundle),
    legacyPassportTokens: parseMaybeJson(raw.zzz_passport_tokens),
  };
}

function readTwoJsContext(filePath) {
  const source = readText(filePath);
  const commonCookies = parseCookieHeader(extractConst(source, 'COMMON_COOKIES'));

  return {
    sourcePath: filePath,
    commonCookies,
    userAgent: extractConst(source, 'USER_AGENT'),
    gameBiz: extractConst(source, 'GAME_BIZ'),
    region: extractConst(source, 'REGION'),
    uid: extractConst(source, 'UID'),
    deviceFp: extractHeaderValue(source, 'x-rpc-device_fp'),
    deviceId: extractHeaderValue(source, 'x-rpc-device_id'),
  };
}

function normalizeSetCookie(headers) {
  if (!headers) {
    return [];
  }

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const single = typeof headers.get === 'function' ? headers.get('set-cookie') : null;
  if (!single) {
    return [];
  }

  return [single];
}

function getCookieValueFromSetCookie(headers, cookieName) {
  for (const line of normalizeSetCookie(headers)) {
    const first = line.split(';', 1)[0];
    const separator = first.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const name = first.slice(0, separator).trim();
    const value = first.slice(separator + 1).trim();
    if (name === cookieName) {
      return value;
    }
  }

  return '';
}

function buildCookieHeader(entries) {
  return entries
    .filter((entry) => entry && entry.name && entry.value !== undefined && entry.value !== null && entry.value !== '')
    .map((entry) => `${entry.name}=${entry.value}`)
    .join('; ');
}

function combinations(items, size, start = 0, prefix = [], output = []) {
  if (prefix.length === size) {
    output.push(prefix.slice());
    return output;
  }

  for (let index = start; index <= items.length - (size - prefix.length); index += 1) {
    prefix.push(items[index]);
    combinations(items, size, index + 1, prefix, output);
    prefix.pop();
  }

  return output;
}

async function requestJson({ url, method, headers, body }) {
  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    text,
    json,
  };
}

function buildUrl(baseUrl, query) {
  const url = new URL(baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function createDsV2(url) {
  const parsed = new URL(url);
  const query = [...parsed.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const timestamp = Math.floor(Date.now() / 1000);
  const random = String(Math.floor(100000 + Math.random() * 100000));
  const check = md5(`salt=${CONSTS.x4Salt}&t=${timestamp}&r=${random}&b=&q=${query}`);
  return `${timestamp},${random},${check}`;
}

function buildCurrentRepoExtFields(input) {
  const product = input.product;
  const deviceName = input.deviceName;
  return JSON.stringify({
    proxyStatus: 0,
    isRoot: 0,
    romCapacity: '512',
    deviceName,
    productName: product,
    romRemain: '512',
    hostname: 'dg02-pool03-kvm87',
    screenSize: '1440x2905',
    isTablet: 0,
    aaid: '',
    model: deviceName,
    brand: 'XiaoMi',
    hardware: 'qcom',
    deviceType: 'OP5913L1',
    devId: 'unknown',
    serialNumber: 'unknown',
    sdCardCapacity: 512215,
    buildTime: '1693626947000',
    buildUser: 'android-build',
    simState: '5',
    ramRemain: '239814',
    appUpdateTimeDiff: 1702604034882,
    deviceInfo: `XiaoMi ${deviceName} OP5913L1:13 SKQ1.221119.001 T.118e6c7-5aa23-73911:user release-keys`,
    vaid: '',
    buildType: 'user',
    sdkVersion: '34',
    ui_mode: 'UI_MODE_TYPE_NORMAL',
    isMockLocation: 0,
    cpuType: 'arm64-v8a',
    isAirMode: 0,
    ringMode: 2,
    chargeStatus: 1,
    manufacturer: 'XiaoMi',
    emulatorStatus: 0,
    appMemory: '512',
    osVersion: '14',
    vendor: 'unknown',
    accelerometer: '1.4883357x9.80665x-0.1963501',
    sdRemain: 239600,
    buildTags: 'release-keys',
    packageName: 'com.mihoyo.hyperion',
    networkType: 'WiFi',
    oaid: '',
    debugStatus: 1,
    ramCapacity: '469679',
    magnetometer: '20.081251x-27.457501x2.1937501',
    display: `${product}_13.1.0.181(CN01)`,
    appInstallTimeDiff: 1688455751496,
    packageVersion: CONSTS.appVersionCurrent,
    gyroscope: '0.030226856x-0.014647375x-0.0013732915',
    batteryStatus: 100,
    hasKeyboard: 0,
    board: 'taro',
  });
}

function buildStarwardExtFields(input) {
  const productName = input.product;
  return JSON.stringify({
    proxyStatus: 0,
    isRoot: 0,
    romCapacity: '512',
    deviceName: 'Pixel5',
    productName,
    romRemain: '512',
    hostname: 'db1ba5f7c000000',
    screenSize: '1080x2400',
    isTablet: 0,
    aaid: '',
    model: 'Pixel5',
    brand: 'google',
    hardware: 'windows_x86_64',
    deviceType: 'redfin',
    devId: 'REL',
    serialNumber: 'unknown',
    sdCapacity: 125943,
    buildTime: '1704316741000',
    buildUser: 'cloudtest',
    simState: 0,
    ramRemain: '124603',
    appUpdateTimeDiff: 1716369357492,
    deviceInfo: `google/${productName}/redfin:13/TQ3A.230901.001/2311.40000.5.0:user/release-keys`,
    vaid: '',
    buildType: 'user',
    sdkVersion: '33',
    ui_mode: 'UI_MODE_TYPE_NORMAL',
    isMockLocation: 0,
    cpuType: 'arm64-v8a',
    isAirMode: 0,
    ringMode: 2,
    chargeStatus: 3,
    manufacturer: 'Google',
    emulatorStatus: 0,
    appMemory: '512',
    osVersion: '13',
    vendor: 'unknown',
    accelerometer: '',
    sdRemain: 123276,
    buildTags: 'release-keys',
    packageName: 'com.mihoyo.hyperion',
    networkType: 'WiFi',
    oaid: '',
    debugStatus: 1,
    ramCapacity: '125943',
    magnetometer: '',
    display: 'TQ3A.230901.001',
    appInstallTimeDiff: 1706444666737,
    packageVersion: '2.20.2',
    gyroscope: '',
    batteryStatus: 85,
    hasKeyboard: 10,
    board: 'windows',
  });
}

function summarizeApiResult(result) {
  return {
    status: result.status,
    statusText: result.statusText,
    retcode: result.json && typeof result.json.retcode !== 'undefined' ? result.json.retcode : null,
    code: result.json && typeof result.json.code !== 'undefined' ? result.json.code : null,
    message: result.json && (result.json.message || result.json.msg) ? (result.json.message || result.json.msg) : null,
  };
}

function formatNames(names) {
  return names.length > 0 ? names.join(', ') : '(none)';
}

async function findFirstSuccessfulTemplate(spec, ctx) {
  let lastFailure = null;
  for (const templateFactory of spec.templates) {
    const template = await templateFactory(ctx);
    const result = await spec.execute(ctx, {
      template,
      cookieNames: template.cookieNames,
      headerNames: template.headerNames,
    });

    if (spec.isSuccess(result, ctx)) {
      return {
        template,
        result,
      };
    }

    lastFailure = {
      templateSource: template.source,
      summary: spec.summarize(result, ctx, template),
    };
  }

  return {
    template: null,
    result: null,
    lastFailure,
  };
}

async function minimizeCookies(spec, ctx, template) {
  for (let size = 0; size <= template.cookieNames.length; size += 1) {
    const subsets = size === 0 ? [[]] : combinations(template.cookieNames, size);
    for (const subset of subsets) {
      const result = await spec.execute(ctx, {
        template,
        cookieNames: subset,
        headerNames: template.headerNames,
      });
      if (spec.isSuccess(result, ctx)) {
        return {
          names: subset,
          result,
        };
      }
    }
  }

  throw new Error(`Unable to minimize cookies for ${spec.id}`);
}

async function minimizeHeaders(spec, ctx, template, cookieNames) {
  for (let size = 0; size <= template.headerNames.length; size += 1) {
    const subsets = size === 0 ? [[]] : combinations(template.headerNames, size);
    for (const subset of subsets) {
      const result = await spec.execute(ctx, {
        template,
        cookieNames,
        headerNames: subset,
      });
      if (spec.isSuccess(result, ctx)) {
        return {
          names: subset,
          result,
        };
      }
    }
  }

  throw new Error(`Unable to minimize headers for ${spec.id}`);
}

function createCookieEntries(ctx, keys) {
  return keys.map((key) => ({
    name: key,
    value: ctx.cookieValues.get(key),
  }));
}

function buildHeaderObject(template, names) {
  const headers = {};
  for (const name of names) {
    headers[name] = template.headers[name];
  }
  return headers;
}

function makeProbeContext(twoJs, fixture) {
  const cookieValues = new Map(twoJs.commonCookies);
  cookieValues.set('cookie_token', fixture.authBundle.cookieToken);
  cookieValues.set('account_id', fixture.authBundle.accountId || twoJs.commonCookies.get('account_id'));
  cookieValues.set('ltoken', fixture.authBundle.ltoken);
  cookieValues.set('ltuid', fixture.authBundle.ltuid);
  cookieValues.set('mid', fixture.authBundle.mid);
  cookieValues.set('stuid', fixture.authBundle.stuid);
  cookieValues.set('stoken_auth_bundle', fixture.authBundle.stoken);
  cookieValues.set('stoken_legacy', fixture.legacyPassportTokens.stoken);

  return {
    twoJs,
    fixture,
    cookieValues,
    dynamic: {
      avatarBasic: null,
      avatarDetail: null,
      calcPayload: null,
    },
  };
}

async function mintNapTokenFrom2Js(ctx) {
  const result = await requestJson({
    url: 'https://api-takumi.mihoyo.com/common/badge/v1/login/account',
    method: 'POST',
    headers: {
      Cookie: buildCookieHeader(createCookieEntries(ctx, [...ctx.twoJs.commonCookies.keys()])),
      'User-Agent': ctx.twoJs.userAgent,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_biz: ctx.twoJs.gameBiz,
      lang: CONSTS.zhCn,
      region: ctx.twoJs.region,
      uid: ctx.twoJs.uid,
    }),
  });

  const eNapToken = getCookieValueFromSetCookie(result.headers, 'e_nap_token');
  return { result, eNapToken };
}

async function ensureAvatarSamples(ctx) {
  if (ctx.dynamic.avatarBasic && ctx.dynamic.avatarDetail && ctx.dynamic.calcPayload) {
    return;
  }

  const minted = await mintNapTokenFrom2Js(ctx);
  if (!minted.result.ok || !minted.result.json || minted.result.json.retcode !== 0 || !minted.eNapToken) {
    throw new Error('Unable to mint baseline e_nap_token for sample discovery');
  }

  const commonHeaders = {
    Cookie: buildCookieHeader([{ name: 'e_nap_token', value: minted.eNapToken }]),
    'User-Agent': ctx.twoJs.userAgent,
    'x-rpc-device_fp': ctx.twoJs.deviceFp,
    'x-rpc-device_id': ctx.twoJs.deviceId,
    'x-rpc-platform': '4',
  };

  const avatarBasic = await requestJson({
    url: buildUrl('https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/avatar_basic_list', {
      uid: ctx.twoJs.uid,
      region: ctx.twoJs.region,
    }),
    method: 'GET',
    headers: commonHeaders,
  });

  if (!avatarBasic.ok || !avatarBasic.json || avatarBasic.json.retcode !== 0 || !avatarBasic.json.data?.list?.length) {
    throw new Error('Unable to fetch baseline avatar_basic_list');
  }

  const firstAvatar = avatarBasic.json.data.list[0];
  const avatarDetail = await requestJson({
    url: buildUrl('https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/batch_avatar_detail_v2', {
      uid: ctx.twoJs.uid,
      region: ctx.twoJs.region,
    }),
    method: 'POST',
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatar_list: [
        {
          avatar_id: firstAvatar.avatar.id,
          is_teaser: false,
          teaser_need_weapon: false,
          teaser_sp_skill: false,
        },
      ],
    }),
  });

  if (!avatarDetail.ok || !avatarDetail.json || avatarDetail.json.retcode !== 0 || !avatarDetail.json.data?.list?.length) {
    throw new Error('Unable to fetch baseline batch_avatar_detail_v2');
  }

  const detail = avatarDetail.json.data.list[0];
  ctx.dynamic.avatarBasic = firstAvatar;
  ctx.dynamic.avatarDetail = detail;
  ctx.dynamic.calcPayload = {
    avatar_id: detail.avatar.id,
    avatar_level: 60,
    avatar_current_level: 1,
    avatar_current_promotes: 1,
    skills: SKILL_TYPES.map((skillType) => ({
      skill_type: skillType,
      level: skillType === 5 ? 7 : 12,
      init_level: 1,
    })),
    weapon_info: {
      weapon_id: detail.weapon.id,
      weapon_level: 60,
      weapon_promotes: 0,
      weapon_init_level: 0,
    },
  };
}

function createStokenHeaders(templateName, fixture, url) {
  if (templateName === 'repo') {
    return {
      'User-Agent': CONSTS.mobileUserAgentCurrent,
      Referer: CONSTS.webstaticReferer,
      'X-Requested-With': 'com.mihoyo.hyperion',
      'x-rpc-app_version': CONSTS.appVersionCurrent,
      'x-rpc-client_type': '5',
      'x-rpc-device_id': fixture.deviceInfo.deviceId,
      'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
      DS: createDsV2(url),
    };
  }

  if (templateName === 'teyvatguide') {
    return {
      'User-Agent': CONSTS.teyvatGuideWindowsBbsUa,
      Referer: CONSTS.webstaticReferer,
      'X-Requested-With': 'com.mihoyo.hyperion',
      'x-rpc-app_version': CONSTS.appVersionCurrent,
      'x-rpc-client_type': '5',
      'x-rpc-device_id': fixture.deviceInfo.deviceId,
      'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
      DS: createDsV2(url),
    };
  }

  return {
    'User-Agent': CONSTS.starwardHyperionUa,
    Referer: CONSTS.webstaticReferer,
    'X-Requested-With': 'com.mihoyo.hyperion',
    'x-rpc-app_version': CONSTS.starwardHyperionVersion,
    'x-rpc-client_type': '5',
    'x-rpc-device_id': fixture.deviceInfo.deviceId,
    'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
    DS: createDsV2(url),
  };
}

function createGetFpBody(fixture, source) {
  const common = {
    device_id: fixture.deviceInfo.requestDeviceId,
    seed_id: fixture.deviceInfo.seedId,
    seed_time: fixture.deviceInfo.seedTime,
    platform: '2',
    device_fp: fixture.deviceInfo.deviceFp,
    app_name: 'bbs_cn',
    bbs_device_id: fixture.deviceInfo.deviceId,
  };

  return JSON.stringify({
    ...common,
    ext_fields: source === 'starward' ? buildStarwardExtFields(fixture.deviceInfo) : buildCurrentRepoExtFields(fixture.deviceInfo),
  });
}

function buildProbeSpecs(ctx) {
  const fixture = ctx.fixture;
  const selectedRole = fixture.authBundle.selectedRole;

  const qrHeadersBase = {
    'User-Agent': `HYPContainer/${CONSTS.hypContainerVersion}`,
    'x-rpc-app_id': CONSTS.qrAppId,
    'x-rpc-client_type': '3',
    'x-rpc-device_id': fixture.deviceInfo.deviceId,
  };

  const qrHeadersWithStarward = {
    ...qrHeadersBase,
    'x-rpc-game_biz': 'hyp_cn',
    'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
  };

  const noteRepoHeaders = {
    'User-Agent': CONSTS.mobileUserAgentCurrent,
    Referer: CONSTS.actReferer,
    'x-rpc-app_version': CONSTS.appVersionCurrent,
    'x-rpc-client_type': '5',
    'x-rpc-device_id': fixture.deviceInfo.deviceId,
    'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
    'x-rpc-lang': CONSTS.zhCn,
    'x-rpc-language': CONSTS.zhCn,
    'x-rpc-platform': '2',
  };

  const noteStarwardHeaders = {
    'User-Agent': CONSTS.starwardHyperionUa,
    Referer: CONSTS.actReferer,
    'x-rpc-app_version': CONSTS.starwardHyperionVersion,
    'x-rpc-client_type': '5',
    'x-rpc-device_id': fixture.deviceInfo.deviceId,
    'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
  };

  const passportSpecs = [
    {
      id: 'createQRLogin',
      method: 'POST',
      templates: [
        async () => ({
          source: 'TeyvatGuide/current-repo QR',
          headers: {
            'x-rpc-app_id': CONSTS.qrAppId,
            'x-rpc-device_id': fixture.deviceInfo.deviceId,
          },
          headerNames: ['x-rpc-app_id', 'x-rpc-device_id'],
          cookieNames: [],
        }),
        async () => ({
          source: 'Starward game-auth QR',
          headers: {
            'x-rpc-app_id': CONSTS.qrAppId,
            'x-rpc-device_id': fixture.deviceInfo.deviceId,
          },
          headerNames: ['x-rpc-app_id', 'x-rpc-device_id'],
          cookieNames: [],
        }),
      ],
      async execute(_ctx, { template, headerNames }) {
        return requestJson({
          url: 'https://passport-api.mihoyo.com/account/ma-cn-passport/app/createQRLogin',
          method: 'POST',
          headers: buildHeaderObject(template, headerNames),
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.ticket && result.json.data?.url),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        ticketIssued: Boolean(result.json?.data?.ticket),
      }),
    },
    {
      id: 'queryQRLoginStatus',
      method: 'POST',
      templates: [
        async () => ({
          source: 'TeyvatGuide/current-repo QR',
          headers: {
            'x-rpc-app_id': CONSTS.qrAppId,
            'x-rpc-device_id': fixture.deviceInfo.deviceId,
          },
          headerNames: ['x-rpc-app_id', 'x-rpc-device_id'],
          cookieNames: [],
        }),
        async () => ({
          source: 'Starward game-auth QR',
          headers: {
            'x-rpc-app_id': CONSTS.qrAppId,
            'x-rpc-device_id': fixture.deviceInfo.deviceId,
          },
          headerNames: ['x-rpc-app_id', 'x-rpc-device_id'],
          cookieNames: [],
        }),
      ],
      async execute(_ctx, { template, headerNames }) {
        const createResult = await requestJson({
          url: 'https://passport-api.mihoyo.com/account/ma-cn-passport/app/createQRLogin',
          method: 'POST',
          headers: qrHeadersBase,
        });
        const ticket = createResult.json?.data?.ticket;
        if (!ticket) {
          return createResult;
        }

        return requestJson({
          url: 'https://passport-api.mihoyo.com/account/ma-cn-passport/app/queryQRLoginStatus',
          method: 'POST',
          headers: buildHeaderObject(template, headerNames),
          body: JSON.stringify({ ticket }),
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.status),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        statusValue: result.json?.data?.status ?? null,
      }),
    },
    {
      id: 'getCookieAccountInfoBySToken.authBundle',
      method: 'GET',
      templates: [
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'current-repo X4 mobile',
            url,
            headers: createStokenHeaders('repo', fixture, url),
            headerNames: Object.keys(createStokenHeaders('repo', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'TeyvatGuide X4 doc',
            url,
            headers: createStokenHeaders('teyvatguide', fixture, url),
            headerNames: Object.keys(createStokenHeaders('teyvatguide', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'Starward Hyperion X4',
            url,
            headers: createStokenHeaders('starward', fixture, url),
            headerNames: Object.keys(createStokenHeaders('starward', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames).map((entry) => ({
          name: entry.name === 'stoken_auth_bundle' ? 'stoken' : entry.name,
          value: entry.value,
        })));
        return requestJson({ url: template.url, method: 'GET', headers });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.cookie_token),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasCookieToken: Boolean(result.json?.data?.cookie_token),
      }),
    },
    {
      id: 'getCookieAccountInfoBySToken.legacy',
      method: 'GET',
      templates: [
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'current-repo X4 mobile',
            url,
            headers: createStokenHeaders('repo', fixture, url),
            headerNames: Object.keys(createStokenHeaders('repo', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'TeyvatGuide X4 doc',
            url,
            headers: createStokenHeaders('teyvatguide', fixture, url),
            headerNames: Object.keys(createStokenHeaders('teyvatguide', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'Starward Hyperion X4',
            url,
            headers: createStokenHeaders('starward', fixture, url),
            headerNames: Object.keys(createStokenHeaders('starward', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames).map((entry) => ({
          name: entry.name === 'stoken_legacy' ? 'stoken' : entry.name,
          value: entry.value,
        })));
        return requestJson({ url: template.url, method: 'GET', headers });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.cookie_token),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasCookieToken: Boolean(result.json?.data?.cookie_token),
      }),
    },
  ];

  const stokenLTokenSpecs = [
    {
      id: 'getLTokenBySToken.authBundle',
      method: 'GET',
      templates: [
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'current-repo X4 mobile',
            url,
            headers: createStokenHeaders('repo', fixture, url),
            headerNames: Object.keys(createStokenHeaders('repo', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'TeyvatGuide X4 doc',
            url,
            headers: createStokenHeaders('teyvatguide', fixture, url),
            headerNames: Object.keys(createStokenHeaders('teyvatguide', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.authBundle.stoken,
          });
          return {
            source: 'Starward Hyperion X4',
            url,
            headers: createStokenHeaders('starward', fixture, url),
            headerNames: Object.keys(createStokenHeaders('starward', fixture, url)),
            cookieNames: ['mid', 'stoken_auth_bundle', 'stuid'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames).map((entry) => ({
          name: entry.name === 'stoken_auth_bundle' ? 'stoken' : entry.name,
          value: entry.value,
        })));
        return requestJson({ url: template.url, method: 'GET', headers });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.ltoken),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasLToken: Boolean(result.json?.data?.ltoken),
      }),
    },
    {
      id: 'getLTokenBySToken.legacy',
      method: 'GET',
      templates: [
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'current-repo X4 mobile',
            url,
            headers: createStokenHeaders('repo', fixture, url),
            headerNames: Object.keys(createStokenHeaders('repo', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'TeyvatGuide X4 doc',
            url,
            headers: createStokenHeaders('teyvatguide', fixture, url),
            headerNames: Object.keys(createStokenHeaders('teyvatguide', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
        async () => {
          const url = buildUrl('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
            stoken: fixture.legacyPassportTokens.stoken,
          });
          return {
            source: 'Starward Hyperion X4',
            url,
            headers: createStokenHeaders('starward', fixture, url),
            headerNames: Object.keys(createStokenHeaders('starward', fixture, url)),
            cookieNames: ['mid', 'stoken_legacy', 'stuid'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames).map((entry) => ({
          name: entry.name === 'stoken_legacy' ? 'stoken' : entry.name,
          value: entry.value,
        })));
        return requestJson({ url: template.url, method: 'GET', headers });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.ltoken),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasLToken: Boolean(result.json?.data?.ltoken),
      }),
    },
  ];

  const napSpecs = [
    {
      id: 'verifyCookieToken',
      method: 'POST',
      templates: [
        async () => ({
          source: '2.js minimal',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
            'x-rpc-app_id': CONSTS.verifyAppId,
            'x-rpc-game_biz': ctx.twoJs.gameBiz,
          },
          headerNames: ['User-Agent', 'x-rpc-app_id', 'x-rpc-game_biz'],
          cookieNames: ['account_mid_v2', 'cookie_token_v2', 'account_id_v2', 'cookie_token', 'account_id'],
        }),
        async () => ({
          source: 'current-repo web verify',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
            Origin: CONSTS.actReferer,
            Referer: CONSTS.actReferer,
            'x-rpc-mi_referrer': CONSTS.webMiReferrer,
            'x-rpc-app_id': CONSTS.verifyAppId,
            'x-rpc-client_type': '4',
            'x-rpc-device_id': fixture.deviceInfo.deviceId,
            'x-rpc-device_fp': fixture.deviceInfo.deviceFp,
            'x-rpc-device_model': encodeURIComponent('Chrome 146.0.0.0'),
            'x-rpc-device_name': 'Chrome',
            'x-rpc-device_os': encodeURIComponent('Windows 10 64-bit'),
            'x-rpc-game_biz': ctx.twoJs.gameBiz,
            'x-rpc-sdk_version': '2.49.0',
            'x-rpc-app_version': '',
          },
          headerNames: [
            'User-Agent',
            'Origin',
            'Referer',
            'x-rpc-mi_referrer',
            'x-rpc-app_id',
            'x-rpc-client_type',
            'x-rpc-device_id',
            'x-rpc-device_fp',
            'x-rpc-device_model',
            'x-rpc-device_name',
            'x-rpc-device_os',
            'x-rpc-game_biz',
            'x-rpc-sdk_version',
            'x-rpc-app_version',
          ],
          cookieNames: ['account_mid_v2', 'cookie_token_v2', 'account_id_v2', 'cookie_token', 'account_id'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames));
        return requestJson({
          url: 'https://passport-api.mihoyo.com/account/ma-cn-session/web/verifyCookieToken',
          method: 'POST',
          headers,
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.user_info),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasUserInfo: Boolean(result.json?.data?.user_info?.aid),
      }),
    },
    {
      id: 'getUserGameRolesByCookieToken',
      method: 'GET',
      templates: [
        async () => ({
          source: 'current-repo / cleaned-json web',
          headers: {
            Origin: CONSTS.actReferer,
            Referer: CONSTS.actReferer,
            'User-Agent': ctx.twoJs.userAgent,
            'x-rpc-mi_referrer': CONSTS.webMiReferrer,
          },
          headerNames: ['Origin', 'Referer', 'User-Agent', 'x-rpc-mi_referrer'],
          cookieNames: ['account_mid_v2', 'cookie_token_v2', 'account_id_v2', 'cookie_token', 'account_id'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames));
        return requestJson({
          url: 'https://passport-api.mihoyo.com/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn',
          method: 'GET',
          headers,
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.list?.length),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        roleCount: result.json?.data?.list?.length ?? 0,
      }),
    },
    {
      id: 'login/account',
      method: 'POST',
      templates: [
        async () => ({
          source: '2.js minimal',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
            'Content-Type': 'application/json',
          },
          headerNames: ['User-Agent', 'Content-Type'],
          cookieNames: ['account_mid_v2', 'cookie_token_v2', 'account_id_v2', 'cookie_token', 'account_id'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames));
        return requestJson({
          url: 'https://api-takumi.mihoyo.com/common/badge/v1/login/account',
          method: 'POST',
          headers,
          body: JSON.stringify({
            game_biz: ctx.twoJs.gameBiz,
            lang: CONSTS.zhCn,
            region: ctx.twoJs.region,
            uid: ctx.twoJs.uid,
          }),
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && getCookieValueFromSetCookie(result.headers, 'e_nap_token')),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        hasENapToken: Boolean(getCookieValueFromSetCookie(result.headers, 'e_nap_token')),
      }),
    },
  ];

  const businessSpecs = [
    {
      id: 'login/info',
      method: 'GET',
      templates: [
        async () => ({
          source: 'minimal web session',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
          },
          headerNames: ['User-Agent'],
          cookieNames: ['e_nap_token'],
        }),
        async () => ({
          source: 'current-repo web session',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
            Origin: CONSTS.actReferer,
            Referer: CONSTS.actReferer,
            'x-rpc-mi_referrer': CONSTS.webMiReferrer,
          },
          headerNames: ['User-Agent', 'Origin', 'Referer', 'x-rpc-mi_referrer'],
          cookieNames: ['e_nap_token'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const minted = await mintNapTokenFrom2Js(ctx);
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(
          createCookieEntries(ctx, ['e_nap_token'])
            .map((entry) => ({
              name: entry.name,
              value: entry.name === 'e_nap_token' ? minted.eNapToken : entry.value,
            }))
            .filter((entry) => cookieNames.includes(entry.name)),
        );
        return requestJson({
          url: buildUrl('https://api-takumi.mihoyo.com/common/badge/v1/login/info', {
            game_biz: ctx.twoJs.gameBiz,
            lang: CONSTS.zhCn,
            ts: Date.now(),
          }),
          method: 'GET',
          headers,
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.game_uid),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        uid: result.json?.data?.game_uid ?? null,
      }),
    },
    {
      id: 'avatar_basic_list',
      method: 'GET',
      templates: [
        async () => ({
          source: '2.js minimal cultivate',
          headers: {
            'User-Agent': ctx.twoJs.userAgent,
            'x-rpc-device_fp': ctx.twoJs.deviceFp,
            'x-rpc-device_id': ctx.twoJs.deviceId,
            'x-rpc-platform': '4',
          },
          headerNames: ['User-Agent', 'x-rpc-device_fp', 'x-rpc-device_id', 'x-rpc-platform'],
          cookieNames: ['e_nap_token'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const minted = await mintNapTokenFrom2Js(ctx);
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(
          cookieNames.map((name) => ({
            name,
            value: name === 'e_nap_token' ? minted.eNapToken : ctx.cookieValues.get(name),
          })),
        );
        return requestJson({
          url: buildUrl('https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/avatar_basic_list', {
            uid: ctx.twoJs.uid,
            region: ctx.twoJs.region,
          }),
          method: 'GET',
          headers,
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.list?.length),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        count: result.json?.data?.list?.length ?? 0,
      }),
    },
    {
      id: 'batch_avatar_detail_v2',
      method: 'POST',
      templates: [
        async () => {
          await ensureAvatarSamples(ctx);
          return {
            source: '2.js minimal cultivate',
            headers: {
              'User-Agent': ctx.twoJs.userAgent,
              'Content-Type': 'application/json',
              'x-rpc-device_fp': ctx.twoJs.deviceFp,
              'x-rpc-device_id': ctx.twoJs.deviceId,
              'x-rpc-platform': '4',
            },
            headerNames: ['User-Agent', 'Content-Type', 'x-rpc-device_fp', 'x-rpc-device_id', 'x-rpc-platform'],
            cookieNames: ['e_nap_token'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        await ensureAvatarSamples(ctx);
        const minted = await mintNapTokenFrom2Js(ctx);
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(
          cookieNames.map((name) => ({
            name,
            value: name === 'e_nap_token' ? minted.eNapToken : ctx.cookieValues.get(name),
          })),
        );
        return requestJson({
          url: buildUrl('https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/batch_avatar_detail_v2', {
            uid: ctx.twoJs.uid,
            region: ctx.twoJs.region,
          }),
          method: 'POST',
          headers,
          body: JSON.stringify({
            avatar_list: [
              {
                avatar_id: ctx.dynamic.avatarBasic.avatar.id,
                is_teaser: false,
                teaser_need_weapon: false,
                teaser_sp_skill: false,
              },
            ],
          }),
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.list?.length),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        count: result.json?.data?.list?.length ?? 0,
      }),
    },
    {
      id: 'avatar_calc',
      method: 'POST',
      templates: [
        async () => {
          await ensureAvatarSamples(ctx);
          return {
            source: '2.js minimal cultivate',
            headers: {
              'User-Agent': ctx.twoJs.userAgent,
              'Content-Type': 'application/json',
              'x-rpc-device_fp': ctx.twoJs.deviceFp,
              'x-rpc-device_id': ctx.twoJs.deviceId,
              'x-rpc-platform': '4',
            },
            headerNames: ['User-Agent', 'Content-Type', 'x-rpc-device_fp', 'x-rpc-device_id', 'x-rpc-platform'],
            cookieNames: ['e_nap_token'],
          };
        },
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        await ensureAvatarSamples(ctx);
        const minted = await mintNapTokenFrom2Js(ctx);
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(
          cookieNames.map((name) => ({
            name,
            value: name === 'e_nap_token' ? minted.eNapToken : ctx.cookieValues.get(name),
          })),
        );
        return requestJson({
          url: buildUrl('https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/avatar_calc', {
            uid: ctx.twoJs.uid,
            region: ctx.twoJs.region,
          }),
          method: 'POST',
          headers,
          body: JSON.stringify(ctx.dynamic.calcPayload),
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && typeof result.json.data?.coin_id !== 'undefined'),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        coinId: result.json?.data?.coin_id ?? null,
      }),
    },
    {
      id: 'note',
      method: 'GET',
      templates: [
        async () => ({
          source: 'current-repo mobile note',
          headers: noteRepoHeaders,
          headerNames: Object.keys(noteRepoHeaders),
          cookieNames: ['ltoken', 'ltuid'],
        }),
        async () => ({
          source: 'Starward Hyperion note',
          headers: noteStarwardHeaders,
          headerNames: Object.keys(noteStarwardHeaders),
          cookieNames: ['ltoken', 'ltuid'],
        }),
      ],
      async execute(_ctx, { template, cookieNames, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        headers.Cookie = buildCookieHeader(createCookieEntries(ctx, cookieNames));
        return requestJson({
          url: buildUrl('https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz/note', {
            server: selectedRole.region,
            role_id: selectedRole.game_uid,
          }),
          method: 'GET',
          headers,
        });
      },
      isSuccess: (result) => Boolean(result.json && result.json.retcode === 0 && result.json.data?.energy),
      summarize: (result) => ({
        ...summarizeApiResult(result),
        energyCurrent: result.json?.data?.energy?.progress?.current ?? null,
      }),
    },
    {
      id: 'getFp',
      method: 'POST',
      templates: [
        async () => ({
          source: 'current-repo / TeyvatGuide Xiaomi ext_fields',
          headers: {
            'User-Agent': CONSTS.mobileUserAgentCurrent,
            'x-rpc-app_version': CONSTS.appVersionCurrent,
            'x-rpc-client_type': '5',
            'X-Requested-With': 'com.mihoyo.hyperion',
            Referer: CONSTS.webstaticReferer,
            'Content-Type': 'application/json',
          },
          headerNames: ['User-Agent', 'x-rpc-app_version', 'x-rpc-client_type', 'X-Requested-With', 'Referer', 'Content-Type'],
          cookieNames: [],
          body: createGetFpBody(fixture, 'repo'),
          bodyProfile: 'current-repo / TeyvatGuide Xiaomi ext_fields',
        }),
        async () => ({
          source: 'Starward Pixel 5 ext_fields',
          headers: {
            'User-Agent': CONSTS.starwardHyperionUa,
            'Content-Type': 'application/json',
          },
          headerNames: ['User-Agent', 'Content-Type'],
          cookieNames: [],
          body: createGetFpBody(fixture, 'starward'),
          bodyProfile: 'Starward Pixel 5 ext_fields',
        }),
      ],
      async execute(_ctx, { template, headerNames }) {
        const headers = buildHeaderObject(template, headerNames);
        return requestJson({
          url: 'https://public-data-api.mihoyo.com/device-fp/api/getFp',
          method: 'POST',
          headers,
          body: template.body,
        });
      },
      isSuccess: (result) => Boolean(result.json && (result.json.code === 200 || result.json.retcode === 0) && (result.json.device_fp || result.json.data?.device_fp)),
      summarize: (result, _ctx, template) => ({
        ...summarizeApiResult(result),
        deviceFpReturned: result.json?.device_fp ?? result.json?.data?.device_fp ?? null,
        bodyProfile: template.bodyProfile,
      }),
    },
  ];

  return [...passportSpecs, ...stokenLTokenSpecs, ...napSpecs, ...businessSpecs];
}

async function probeSpec(spec, ctx) {
  const baseline = await findFirstSuccessfulTemplate(spec, ctx);
  if (!baseline.template) {
    const failure = baseline.lastFailure;
    return {
      id: spec.id,
      method: spec.method,
      success: false,
      failure: failure
        ? `No candidate template succeeded; last=${failure.templateSource}; status=${failure.summary.status}; retcode=${failure.summary.retcode ?? failure.summary.code ?? 'n/a'}; message=${failure.summary.message ?? 'n/a'}`
        : 'No candidate template succeeded',
    };
  }

  const minimalCookies = await minimizeCookies(spec, ctx, baseline.template);
  const minimalHeaders = await minimizeHeaders(spec, ctx, baseline.template, minimalCookies.names);

  return {
    id: spec.id,
    method: spec.method,
    success: true,
    templateSource: baseline.template.source,
    baseline: spec.summarize(baseline.result, ctx, baseline.template),
    minimalCookies: minimalCookies.names,
    minimalHeaders: minimalHeaders.names,
    final: spec.summarize(minimalHeaders.result, ctx, baseline.template),
  };
}

function buildMarkdownReport(results, metadata) {
  const lines = [];
  lines.push('# HoYo 端点最小鉴权结构实测报告');
  lines.push('');
  lines.push(`- 生成时间: ${new Date().toISOString()}`);
  lines.push(`- 2.js: \`${metadata.twoJsPath}\``);
  lines.push(`- fixture: \`${metadata.fixturePath}\``);
  lines.push('- Secrets 已脱敏；文档只记录键名、头名、模板来源与结果。');
  lines.push('');
  lines.push('## 1. 总览');
  lines.push('');
  lines.push('| 端点 | 结果 | 成功模板 | 最小 Cookie | 最小 Header | 备注 |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const item of results) {
    if (!item.success) {
      lines.push(`| \`${item.id}\` | 失败 | - | - | - | ${item.failure} |`);
      continue;
    }

    const remarkParts = [];
    if (item.final.ticketIssued) {
      remarkParts.push('ticket');
    }
    if (item.final.hasENapToken) {
      remarkParts.push('e_nap_token');
    }
    if (item.final.hasCookieToken) {
      remarkParts.push('cookie_token');
    }
    if (item.final.hasLToken) {
      remarkParts.push('ltoken');
    }
    if (item.final.bodyProfile) {
      remarkParts.push(item.final.bodyProfile);
    }
    if (item.final.count !== undefined && item.final.count !== null) {
      remarkParts.push(`count=${item.final.count}`);
    }
    if (item.final.energyCurrent !== undefined && item.final.energyCurrent !== null) {
      remarkParts.push(`energy=${item.final.energyCurrent}`);
    }
    if (item.final.statusValue) {
      remarkParts.push(`status=${item.final.statusValue}`);
    }

    lines.push(
      `| \`${item.id}\` | 成功 | ${item.templateSource} | \`${formatNames(item.minimalCookies)}\` | \`${formatNames(item.minimalHeaders)}\` | ${remarkParts.join('; ') || '-'} |`,
    );
  }
  lines.push('');
  lines.push('## 2. 逐端点结果');
  lines.push('');
  for (const item of results) {
    lines.push(`### ${item.id}`);
    lines.push('');
    if (!item.success) {
      lines.push(`- 结果: 失败`);
      lines.push(`- 原因: ${item.failure}`);
      lines.push('');
      continue;
    }

    lines.push(`- 成功模板来源: ${item.templateSource}`);
    lines.push(`- 最小 Cookie: \`${formatNames(item.minimalCookies)}\``);
    lines.push(`- 最小 Header: \`${formatNames(item.minimalHeaders)}\``);
    lines.push(`- 基线状态: status=${item.baseline.status}, retcode=${item.baseline.retcode ?? item.baseline.code ?? 'n/a'}, message=${item.baseline.message ?? 'n/a'}`);
    if (item.final.bodyProfile) {
      lines.push(`- body 画像: ${item.final.bodyProfile}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const twoJsPath = getArg(args, 'two-js', DEFAULT_TWO_JS_PATH);
  const fixturePath = getArg(args, 'fixture', DEFAULT_FIXTURE_PATH);
  const jsonOutputPath = getArg(args, 'out-json', DEFAULT_JSON_OUTPUT_PATH);
  const markdownOutputPath = getArg(args, 'out-md', DEFAULT_MARKDOWN_OUTPUT_PATH);

  const twoJs = readTwoJsContext(twoJsPath);
  const fixture = parseFixture(fixturePath);
  const ctx = makeProbeContext(twoJs, fixture);
  const specs = buildProbeSpecs(ctx);
  const results = [];

  for (const spec of specs) {
    console.log(`>>> probing ${spec.id}`);
    const result = await probeSpec(spec, ctx);
    results.push(result);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    twoJsPath,
    fixturePath,
    results,
  };

  writeText(jsonOutputPath, JSON.stringify(payload, null, 2));
  writeText(markdownOutputPath, buildMarkdownReport(results, { twoJsPath, fixturePath }));

  console.log(`JSON written to ${jsonOutputPath}`);
  console.log(`Markdown written to ${markdownOutputPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
