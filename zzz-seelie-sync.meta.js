// ==UserScript==
// @name         ZZZ Seelie 数据同步
// @namespace    github.com/owwkmidream
// @version      2.2.1
// @author       owwkmidream
// @description  绝区零 Seelie 网站数据同步脚本
// @license      MIT
// @icon         https://zzz.seelie.me/img/logo.svg
// @homepageURL  https://github.com/owwkmidream/zzz-seelie-sync
// @supportURL   https://github.com/owwkmidream/zzz-seelie-sync/issues
// @downloadURL  https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.user.js
// @updateURL    https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.meta.js
// @match        https://zzz.seelie.me/*
// @match        https://do-not-exist.mihoyo.com/
// @require      https://fastly.jsdelivr.net/npm/@trim21/gm-fetch@0.3.0
// @require      https://fastly.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js
// @connect      act-api-takumi.mihoyo.com
// @connect      api-takumi-record.mihoyo.com
// @connect      public-data-api.mihoyo.com
// @connect      api-takumi.mihoyo.com
// @connect      passport-api.mihoyo.com
// @grant        GM.cookie
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==