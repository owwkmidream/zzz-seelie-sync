import type { DSSaltType } from './config';
import { DS_SALTS } from './config';

type DsScalar = string | number | boolean;
type DsRecordValue = DsScalar | Array<DsScalar> | undefined | null;
type DsRecord = Record<string, DsRecordValue>;
type DsPayload = DsRecord | string | undefined;

function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
}

function bitRotateLeft(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}

function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md5(input: string): string {
  const input8 = new TextEncoder().encode(input);
  const blockCount = ((input8.length + 8) >> 6) + 1;
  const blocks = new Array<number>(blockCount * 16).fill(0);

  for (let i = 0; i < input8.length; i++) {
    blocks[i >> 2] |= input8[i] << ((i % 4) * 8);
  }

  blocks[input8.length >> 2] |= 0x80 << ((input8.length % 4) * 8);
  blocks[blockCount * 16 - 2] = input8.length * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < blocks.length; i += 16) {
    const originalA = a;
    const originalB = b;
    const originalC = c;
    const originalD = d;

    a = md5ff(a, b, c, d, blocks[i], 7, -680876936);
    d = md5ff(d, a, b, c, blocks[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, blocks[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, blocks[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, blocks[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, blocks[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, blocks[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, blocks[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, blocks[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, blocks[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, blocks[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, blocks[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, blocks[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, blocks[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, blocks[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, blocks[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, blocks[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, blocks[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, blocks[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, blocks[i], 20, -373897302);
    a = md5gg(a, b, c, d, blocks[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, blocks[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, blocks[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, blocks[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, blocks[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, blocks[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, blocks[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, blocks[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, blocks[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, blocks[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, blocks[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, blocks[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, blocks[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, blocks[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, blocks[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, blocks[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, blocks[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, blocks[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, blocks[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, blocks[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, blocks[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, blocks[i], 11, -358537222);
    c = md5hh(c, d, a, b, blocks[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, blocks[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, blocks[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, blocks[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, blocks[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, blocks[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, blocks[i], 6, -198630844);
    d = md5ii(d, a, b, c, blocks[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, blocks[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, blocks[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, blocks[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, blocks[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, blocks[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, blocks[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, blocks[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, blocks[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, blocks[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, blocks[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, blocks[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, blocks[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, blocks[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, blocks[i + 9], 21, -343485551);

    a = safeAdd(a, originalA);
    b = safeAdd(b, originalB);
    c = safeAdd(c, originalC);
    d = safeAdd(d, originalD);
  }

  const hex = (value: number): string => {
    let output = '';
    for (let i = 0; i < 4; i++) {
      output += ((value >> (i * 8 + 4)) & 0xf).toString(16);
      output += ((value >> (i * 8)) & 0xf).toString(16);
    }
    return output;
  };

  return hex(a) + hex(b) + hex(c) + hex(d);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function serializeDsData(data: DsPayload): string {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  return Object.keys(data)
    .sort()
    .flatMap((key) => {
      const value = data[key];
      if (value === undefined || value === null) {
        return [];
      }
      if (Array.isArray(value)) {
        return [`${key}=${value.join(',')}`];
      }
      return [`${key}=${value}`];
    })
    .join('&');
}

export function generateDS(
  saltType: DSSaltType,
  method: 'GET' | 'POST',
  payload: DsPayload,
  isSign = false,
): string {
  const salt = DS_SALTS[saltType];
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const random = isSign ? randomBetween(100000, 200000).toString().slice(0, 6) : randomBetween(100000, 200000).toString();
  const query = method === 'GET' ? serializeDsData(payload) : '';
  const body = method === 'POST' ? serializeDsData(payload) : '';
  const hashSource = isSign
    ? `salt=${salt}&t=${timestamp}&r=${random}`
    : `salt=${salt}&t=${timestamp}&r=${random}&b=${body}&q=${query}`;

  return `${timestamp},${random},${md5(hashSource)}`;
}
