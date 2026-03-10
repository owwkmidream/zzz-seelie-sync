// ==UserScript==
// @name         ZZZ Seelie 数据同步
// @namespace    github.com/owwkmidream
// @version      2.2.5
// @author       owwkmidream
// @description  绝区零 Seelie 网站数据同步脚本
// @license      MIT
// @icon         https://zzz.seelie.me/img/logo.svg
// @homepageURL  https://github.com/owwkmidream/zzz-seelie-sync
// @supportURL   https://github.com/owwkmidream/zzz-seelie-sync/issues
// @downloadURL  https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.mini.user.js
// @updateURL    https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.mini.meta.js
// @match        https://zzz.seelie.me/*
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

(function () {
  'use strict';

  class Nt{prefix;timestamp;showLocation;colors;fileColorMap=new Map;onceKeys=new Set;constructor(e={}){this.prefix=e.prefix||"[zzz-seelie-sync]",this.timestamp=e.timestamp??true,this.showLocation=e.showLocation??true,this.colors={log:"#333333",info:"#2196F3",warn:"#FF9800",error:"#F44336",debug:"#9C27B0",...e.colors};}generateRandomColor(){const e=["#E91E63","#9C27B0","#673AB7","#3F51B5","#2196F3","#03A9F4","#00BCD4","#009688","#4CAF50","#8BC34A","#CDDC39","#FFC107","#FF9800","#FF5722","#795548","#607D8B","#E53935","#D81B60","#8E24AA","#5E35B1"];return e[Math.floor(Math.random()*e.length)]}getFileColor(e){return this.fileColorMap.has(e)||this.fileColorMap.set(e,this.generateRandomColor()),this.fileColorMap.get(e)}getLocationInfo(){try{const e=new Error().stack;if(!e)return null;const n=e.split(`
`);for(let r=3;r<Math.min(n.length,8);r++){const o=n[r];if(!o||o.includes("Logger.")||o.includes("formatMessage")||o.includes("getLocationInfo"))continue;const i=[/at.*?\((.+):(\d+):(\d+)\)/,/at\s+(.+):(\d+):(\d+)/,/@(.+):(\d+):(\d+)/,/(.+):(\d+):(\d+)$/];for(const s of i){const a=o.match(s);if(a){const c=a[1],u=parseInt(a[2],10),d=parseInt(a[3],10);if(!c||c.includes("chrome-extension://")||c.includes("moz-extension://"))continue;const f=c.split("/").pop()||c.split("\\").pop()||c;if(f&&!isNaN(u)&&!isNaN(d))return {fileName:f,lineNumber:u,columnNumber:d}}}}return null}catch{return null}}formatMessage(e,n,...r){const o=this.timestamp?`[${new Date().toLocaleTimeString()}]`:"",i=this.showLocation?this.getLocationInfo():null;let s=`${o} ${this.prefix} [${e.toUpperCase()}]`,a="",c="";return i&&(a=` [${i.fileName}:${i.lineNumber}]`,c=this.getFileColor(i.fileName)),typeof window<"u"?i?[`%c${s}%c${a}`,`color: ${n}; font-weight: bold;`,`color: ${c}; font-weight: bold; font-style: italic;`,...r]:[`%c${s}`,`color: ${n}; font-weight: bold;`,...r]:[s+a,...r]}log(...e){console.log(...this.formatMessage("log",this.colors.log,...e));}info(...e){console.info(...this.formatMessage("info",this.colors.info,...e));}warn(...e){console.warn(...this.formatMessage("warn",this.colors.warn,...e));}warnOnce(e,...n){this.onceKeys.has(e)||(this.onceKeys.add(e),this.warn(...n));}error(...e){console.error(...this.formatMessage("error",this.colors.error,...e));}debug(...e){}table(e,n){(this.timestamp||this.prefix)&&this.info("Table data:"),console.table(e,n);}group(e){const n=e?this.formatMessage("group",this.colors.info,e)[2]:void 0;console.group(n);}groupCollapsed(e){const n=e?this.formatMessage("group",this.colors.info,e)[2]:void 0;console.groupCollapsed(n);}groupEnd(){console.groupEnd();}time(e){console.time(e);}timeEnd(e){console.timeEnd(e);}clear(){console.clear();}createChild(e,n){const r=new Nt({prefix:`${this.prefix}:${e}`,timestamp:this.timestamp,showLocation:this.showLocation,colors:this.colors,...n});return r.fileColorMap=this.fileColorMap,r.onceKeys=this.onceKeys,r}}const l=new Nt({prefix:"[Seelie]",timestamp:true,showLocation:true,colors:{log:"#4CAF50",info:"#2196F3",warn:"#FF9800",error:"#F44336",debug:"#9C27B0"}});l.log.bind(l);l.info.bind(l);l.warn.bind(l);l.error.bind(l);let Te=[],ie=null,xe=false,Qe=false,we=false;function Pr(t){if(!t||typeof t!="object")return  false;const e=t;return typeof e.afterEach=="function"&&typeof e.beforeEach=="function"&&typeof e.push=="function"}function kt(){const t=document.querySelector("#app");if(!t?.__vue_app__)return Qe||(l.debug("🔍 未找到 Vue App 实例，可能还在加载中..."),Qe=true),null;Qe=false,l.debug("🔍 查找 Vue Router 实例...");const e=t.__vue_app__.config?.globalProperties?.$router;if(e&&typeof e.afterEach=="function"&&typeof e.beforeEach=="function"&&typeof e.push=="function")return l.info("✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例"),l.debug("Router 实例:",e),we=false,e;const n=t.__vue_app__._context;if(n?.provides){l.debug("🔍 尝试从 provides 查找 Router...");const r=n.provides,o=Object.getOwnPropertySymbols(r);for(const i of o){const s=r[i];if(Pr(s))return l.info("✓ 从 provides 找到 Router 实例:",i.toString()),l.debug("Router 实例:",s),we=false,s}}return we||(l.debug("🔍 未找到 Vue Router 实例，可能还在初始化中..."),we=true),null}function Kt(){ie&&(ie.disconnect(),ie=null),xe=false;}function Br(){xe||ie||(l.debug("👀 启动 Vue Router 观察器..."),xe=true,ie=new MutationObserver(()=>{const e=kt();e&&(l.info("✓ Vue Router 已加载，处理待注册的 Hook..."),Kt(),Qt(e));}),ie.observe(document.querySelector("#app"),{childList:false,subtree:false,attributes:true}),setTimeout(()=>{xe&&(l.warn("⚠️ Vue Router 观察器超时，停止观察"),Kt(),Qt(null));},3e3));}function Qt(t){l.debug(`🔄 处理 ${Te.length} 个待注册的 Hook...`);const e=[...Te];Te=[],e.forEach(({callback:n,options:r,unwatchRef:o})=>{if(t){const{unwatch:i}=Vn(t,n,r);o.current=i;}else l.warn("⚠️ Vue Router 未找到，Hook 注册失败"),o.current=()=>{};});}function Vn(t,e,n){const{delay:r=100,immediate:o=false}=n;o&&setTimeout(()=>{const s=t.currentRoute?.value||t.currentRoute;e(s,null);},r);const i=t.afterEach((s,a)=>{l.debug("🔄 路由变化检测到:",a?.path,"->",s?.path),setTimeout(()=>{e(s,a);},r);});return {router:t,unwatch:i,getCurrentRoute:()=>t.currentRoute?.value||t.currentRoute}}function Kn(t,e={}){l.debug("🚦 设置路由监听 Hook...");const n=kt();if(n)return l.debug("✓ Vue Router 已存在，直接注册 Hook"),Vn(n,t,e);l.debug("⏳ Vue Router 未找到，设置延迟注册...");const r={current:null};return Te.push({callback:t,options:e,unwatchRef:r}),Br(),{router:null,unwatch:()=>{r.current&&r.current();},getCurrentRoute:()=>{const o=kt();if(o)return o.currentRoute?.value||o.currentRoute}}}class Dr{component=null;config;factory;isCreating=false;createPromise=null;constructor(e,n){this.config=e,this.factory=n;}checkExistence(){const e=document.querySelector(this.config.targetSelector);return e?e.querySelector(this.config.componentSelector)!==null:false}checkCondition(){if(!(document.querySelector(this.config.targetSelector)!==null)||this.config.condition&&!this.config.condition())return  false;if(this.config.routePattern){const n=window.location.pathname;return typeof this.config.routePattern=="string"?n.includes(this.config.routePattern):this.config.routePattern.test(n)}return  true}async tryCreate(){if(this.isCreating&&this.createPromise){l.debug(`⏳ [${this.config.id}] 组件正在创建中，等待完成`),await this.createPromise;return}if(!this.checkCondition()){l.debug(`🚫 [${this.config.id}] 条件不满足，跳过创建`);return}if(this.checkExistence()){l.debug(`✅ [${this.config.id}] 组件已存在，跳过创建`);return}this.createPromise=this.createComponent(),await this.createPromise;}async createComponent(){if(this.isCreating){l.debug(`⏳ [${this.config.id}] 组件已在创建中，跳过重复创建`);return}this.isCreating=true;try{if(this.checkExistence()){l.debug(`✅ [${this.config.id}] 组件已存在，取消创建`);return}this.destroyComponent(),this.component=await this.factory(),await this.component.init(),l.debug(`✅ [${this.config.id}] 组件创建成功`);}catch(e){l.error(`❌ [${this.config.id}] 创建组件失败:`,e),this.component=null;}finally{this.isCreating=false,this.createPromise=null;}}async checkAndRecreate(){if(this.isCreating){l.debug(`⏳ [${this.config.id}] 组件正在创建中，跳过检查`);return}const e=this.checkCondition(),n=this.checkExistence();e&&!n?(l.debug(`🔧 [${this.config.id}] 组件缺失，重新创建组件`),await this.tryCreate()):!e&&n&&(l.debug(`🗑️ [${this.config.id}] 条件不满足，销毁组件`),this.destroyComponent());}destroyComponent(){if(this.isCreating&&this.createPromise){l.debug(`⏳ [${this.config.id}] 等待创建完成后销毁`),this.createPromise.then(()=>{this.component&&(this.component.destroy(),this.component=null,l.debug(`🗑️ [${this.config.id}] 组件已销毁（延迟）`));});return}this.component&&(this.component.destroy(),this.component=null,l.debug(`🗑️ [${this.config.id}] 组件已销毁`));}async refreshComponent(){this.component&&this.component.refresh&&(await this.component.refresh(),l.debug(`🔄 [${this.config.id}] 组件已刷新`));}async handleRouteChange(e,n){await this.checkAndRecreate();}async handleDOMChange(e){await this.checkAndRecreate();}cleanup(){this.isCreating=false,this.createPromise=null,this.destroyComponent();}getComponent(){return this.component}hasComponent(){return this.component!==null&&this.checkExistence()}isCreatingComponent(){return this.isCreating}getConfig(){return this.config}}class Zr{injectors=new Map;domObserver=null;routerUnwatch=null;isInitialized=false;options;constructor(e={}){this.options={observerConfig:{childList:true,subtree:true},enableGlobalRouterWatch:true,routerDelay:100,...e};}register(e,n){this.injectors.has(e.id)&&(l.warn(`⚠️ 注入器 [${e.id}] 已存在，将被覆盖`),this.unregister(e.id));const r=new Dr(e,n);return this.injectors.set(e.id,r),l.debug(`📝 注册组件注入器: [${e.id}]`),this.isInitialized&&r.tryCreate(),r}unregister(e){const n=this.injectors.get(e);return n?(n.cleanup(),this.injectors.delete(e),l.debug(`🗑️ 注销组件注入器: [${e}]`),true):false}getInjector(e){return this.injectors.get(e)||null}init(){if(this.isInitialized){l.warn("⚠️ DOM 注入管理器已经初始化");return}l.debug("🎯 初始化 DOM 注入管理器"),this.options.enableGlobalRouterWatch&&this.setupGlobalRouterWatcher(),this.setupDOMObserver(),this.createAllComponents(),this.isInitialized=true;}setupGlobalRouterWatcher(){const{unwatch:e}=Kn(async(n,r)=>{l.debug("🔄 全局路由变化检测到:",r?.path,"->",n?.path),await this.handleGlobalRouteChange(n,r);},{delay:this.options.routerDelay,immediate:false});this.routerUnwatch=e,l.debug("✅ 全局路由监听设置完成");}setupDOMObserver(){let e=null,n=false,r=[],o=0;const i=3e3;this.domObserver=new MutationObserver(async s=>{r.push(...s),e&&clearTimeout(e),e=setTimeout(async()=>{if(n){l.debug("🔍 DOM 变化处理中，跳过本次处理");return}n=true;const a=[...r];r=[];try{const c=Date.now();c-o>=i&&(o=c,l.debug(`🔍 检测到 ${a.length} 个 DOM 变化，通知所有组件`)),await this.handleGlobalDOMChange(a);}finally{n=false,e=null;}},100);}),this.domObserver.observe(document.body,this.options.observerConfig),l.debug("✅ DOM 观察器设置完成");}async handleGlobalRouteChange(e,n){const r=Array.from(this.injectors.values()).map(o=>o.handleRouteChange(e,n));await Promise.allSettled(r);}async handleGlobalDOMChange(e){const n=Array.from(this.injectors.values()).map(r=>r.handleDOMChange(e));await Promise.allSettled(n);}async createAllComponents(){const e=Array.from(this.injectors.values()).map(n=>n.tryCreate());await Promise.allSettled(e);}async refreshAllComponents(){const e=Array.from(this.injectors.values()).map(n=>n.refreshComponent());await Promise.allSettled(e);}async refreshComponent(e){const n=this.injectors.get(e);n&&await n.refreshComponent();}destroy(){l.debug("🗑️ 销毁 DOM 注入管理器");for(const e of this.injectors.values())e.cleanup();this.injectors.clear(),this.routerUnwatch&&(this.routerUnwatch(),this.routerUnwatch=null),this.domObserver&&(this.domObserver.disconnect(),this.domObserver=null),this.isInitialized=false;}getInjectorIds(){return Array.from(this.injectors.keys())}getInjectorCount(){return this.injectors.size}isInit(){return this.isInitialized}}const vt=new Zr({enableGlobalRouterWatch:true,routerDelay:200,observerConfig:{childList:true,subtree:true}});var G=typeof GM<"u"?GM:void 0;const Or=["GET","POST","PUT","DELETE","PATCH","HEAD","TRACE","OPTIONS","CONNECT"],Qn=Symbol("gmFetchRawResponseHeaders");function Fr(t){const e=t.toUpperCase();if(Or.includes(e))return e;throw new Error(`unsupported http method ${t}`)}function Hr(t){const e=new Headers;for(const n of t.split(/\r?\n/)){const r=n.indexOf(":");if(r<=0)continue;const o=n.slice(0,r).trim(),i=n.slice(r+1).trim();o&&e.append(o,i);}return e}function Ur(t){return t[Qn]??""}function Jn(t,e){const n=`${e.toLowerCase()}:`;return Ur(t).split(/\r?\n/).map(r=>r.trim()).filter(r=>r.toLowerCase().startsWith(n)).map(r=>r.slice(n.length).trim())}async function W(t,e={}){const n=new Request(t,e);let r;return e.body!==void 0&&(r=await n.text()),await new Promise((o,i)=>{if(n.signal?.aborted){i(new DOMException("Aborted","AbortError"));return}const s=G.xmlHttpRequest({url:n.url,method:Fr(n.method.toUpperCase()),headers:Object.fromEntries(n.headers.entries()),data:r,responseType:"blob",anonymous:e.anonymous,cookie:e.cookie,timeout:e.timeout,redirect:e.redirect,onload:a=>{const c=Hr(a.responseHeaders),u=a.response instanceof Blob?a.response:new Blob([a.responseText??""]),d=new Response(u,{status:a.status,statusText:a.statusText,headers:c});Object.defineProperty(d,Qn,{value:a.responseHeaders??"",enumerable:false,configurable:false,writable:false}),o(d);},onabort:()=>{i(new DOMException("Aborted","AbortError"));},ontimeout:()=>{i(new TypeError("Network request failed, timeout"));},onerror:a=>{const c=typeof a.error=="string"&&a.error?a.error:n.url;i(new TypeError(`Failed to fetch: ${c}`));}});if(n.signal){const a=()=>{s.abort();};n.signal.addEventListener("abort",a,{once:true});}})}function Oe(t){return t.filter(([,e])=>!!e).map(([e,n])=>`${e}=${n}`).join("; ")}function zr(t,e){return Oe([["account_id",t],["cookie_token",e]])}function Yn(t){const e=t.split(";",1)[0]?.trim();if(!e)return null;const n=e.indexOf("=");return n<=0?null:{name:e.slice(0,n).trim(),value:e.slice(n+1).trim()}}function Lt(t){return Oe([["mid",t.mid],["stoken",t.stoken],["stuid",t.stuid]])}function qr(t){return Oe([["ltoken",t.ltoken],["ltuid",t.ltuid]])}function jr(t){return zr(t.accountId,t.cookieToken)}function Wn(t){return Oe([["e_nap_token",t.eNapToken]])}function Gr(t,e){for(const n of t){const r=Yn(n);if(r?.name===e)return r.value}return null}function Vr(t,e){return Gr(Jn(t,"set-cookie"),e)}const Kr="2.102.1",Qr="1.3.3.182",Jr="zh-cn",Mt="0000000000000",Yr=4320*60*1e3,Wr=1440*60*1e3,ce="https://passport-api.mihoyo.com",Xn="https://api-takumi.mihoyo.com",Xr="https://act-api-takumi.mihoyo.com",eo="https://api-takumi-record.mihoyo.com",ye=`${Xr}/event/nap_cultivate_tool`,er=`${eo}/event/game_record_zzz/api/zzz`,to="https://public-data-api.mihoyo.com/device-fp/api/getFp",no=`${ce}/account/ma-cn-passport/app/createQRLogin`,ro=`${ce}/account/ma-cn-passport/app/queryQRLoginStatus`,tr=`${ce}/account/auth/api/getCookieAccountInfoBySToken`,oo=`${ce}/account/auth/api/getLTokenBySToken`,io=`${ce}/account/ma-cn-session/web/verifyCookieToken`,so=`${ce}/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn`,ao=`${Xn}/common/badge/v1/login/info?game_biz=nap_cn&lang=${Jr}`,co=`${Xn}/common/badge/v1/login/account`,lo=`HYPContainer/${Qr}`,uo="application/json, text/plain, */*",fo=new Set([1034,5003,10035,10041,10053]);function ho(t,e){if(t===ye)return "nap_cultivate";if(t===er)return "zzz_note";throw new Error(`未配置的 HoYo 鉴权路由: ${t}`)}const go={createQRLogin:{endpoint:"passport-api/account/ma-cn-passport/app/createQRLogin",templateSource:"TeyvatGuide/current-repo QR",minimalCookies:[],minimalHeaders:["x-rpc-app_id","x-rpc-device_id","x-rpc-device_fp"],refreshDependency:"none"},queryQRLoginStatus:{endpoint:"passport-api/account/ma-cn-passport/app/queryQRLoginStatus",templateSource:"TeyvatGuide/current-repo QR",minimalCookies:[],minimalHeaders:["x-rpc-app_id","x-rpc-device_id","x-rpc-device_fp"],refreshDependency:"qr_ticket"},getCookieAccountInfoBySToken:{endpoint:"passport-api/account/auth/api/getCookieAccountInfoBySToken",templateSource:"current-repo X4 mobile",minimalCookies:["mid","stoken"],minimalHeaders:[],refreshDependency:"none"},getLTokenBySToken:{endpoint:"passport-api/account/auth/api/getLTokenBySToken",templateSource:"current-repo X4 mobile",minimalCookies:["mid","stoken"],minimalHeaders:[],refreshDependency:"none"},verifyCookieToken:{endpoint:"passport-api/account/ma-cn-session/web/verifyCookieToken",templateSource:"TeyvatGuide / QR script-managed session",minimalCookies:["account_id","cookie_token"],minimalHeaders:[],refreshDependency:"none"},getUserGameRolesByCookieToken:{endpoint:"passport-api/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn",templateSource:"TeyvatGuide / QR script-managed session",minimalCookies:["account_id","cookie_token"],minimalHeaders:[],refreshDependency:"none"},"login/account":{endpoint:"api-takumi/common/badge/v1/login/account",templateSource:"TeyvatGuide / QR script-managed session",minimalCookies:["account_id","cookie_token"],minimalHeaders:[],refreshDependency:"none"},"login/info":{endpoint:"api-takumi/common/badge/v1/login/info",templateSource:"minimal web session",minimalCookies:["e_nap_token"],minimalHeaders:[],refreshDependency:"e_nap_token"},avatar_basic_list:{endpoint:"act-api-takumi/event/nap_cultivate_tool/user/avatar_basic_list",templateSource:"2.js minimal cultivate",minimalCookies:["e_nap_token"],minimalHeaders:["x-rpc-device_id","x-rpc-device_fp"],refreshDependency:"e_nap_token"},batch_avatar_detail_v2:{endpoint:"act-api-takumi/event/nap_cultivate_tool/user/batch_avatar_detail_v2",templateSource:"2.js minimal cultivate",minimalCookies:["e_nap_token"],minimalHeaders:["x-rpc-device_id","x-rpc-device_fp"],refreshDependency:"e_nap_token"},avatar_calc:{endpoint:"act-api-takumi/event/nap_cultivate_tool/user/avatar_calc",templateSource:"2.js minimal cultivate",minimalCookies:["e_nap_token"],minimalHeaders:[],refreshDependency:"e_nap_token"},note:{endpoint:"api-takumi-record/event/game_record_zzz/api/zzz/note",templateSource:"current-repo mobile note",minimalCookies:["ltoken","ltuid"],minimalHeaders:["x-rpc-device_id","x-rpc-device_fp"],refreshDependency:"none"},getFp:{endpoint:"public-data-api/device-fp/api/getFp",templateSource:"current-repo / TeyvatGuide Xiaomi ext_fields",minimalCookies:[],minimalHeaders:[],refreshDependency:"none"}};function mo(t){return go[t]}function po(t){switch(t){case "/user/avatar_basic_list":return "avatar_basic_list";case "/user/batch_avatar_detail_v2":return "batch_avatar_detail_v2";case "/user/avatar_calc":return "avatar_calc";default:throw new Error(`未配置的 NAP 鉴权结构: ${t}`)}}function X(t,e){const n={};for(const r of mo(t).minimalHeaders){if(!e)throw new Error(`缺少设备信息，无法生成鉴权头: ${r}`);if(r==="x-rpc-device_id"){n[r]=e.deviceId;continue}if(r==="x-rpc-device_fp"){n[r]=e.deviceFp;continue}}return n}function nr(t){return {Accept:uo,"User-Agent":lo,"x-rpc-app_id":"ddxf5dufpuyo","x-rpc-client_type":"3","x-rpc-device_id":t,"Content-Type":"application/json"}}function yo(){return X("getFp")}function rr(){return {}}function So(){return {}}function wo(){return X("login/account")}function bo(){return X("login/info")}function ko(t){return X("note",t)}function vo(){return X("verifyCookieToken")}function Co(){return X("getUserGameRolesByCookieToken")}function Eo(t,e){return X(po(t),e)}class z extends Error{status;statusText;context;constructor(e,n,r){super(r?`${r}: HTTP ${e}: ${n}`:`HTTP ${e}: ${n}`),this.name="HttpRequestError",this.status=e,this.statusText=n,this.context=r;}}class D extends Error{retcode;apiMessage;context;constructor(e,n,r){super(r?`${r}: API Error ${e}: ${n}`:`API Error ${e}: ${n}`),this.name="ApiResponseError",this.retcode=e,this.apiMessage=n,this.context=r;}}class Ie extends Error{retcode;apiMessage;causeError;constructor(e,n,r){super(`设备指纹刷新失败，原始错误: API Error ${e}: ${n}`),this.name="DeviceFingerprintRefreshError",this.retcode=e,this.apiMessage=n,this.causeError=r;}}class or extends Error{constructor(){super("❌ 设备指纹有误，请检查"),this.name="InvalidDeviceFingerprintError";}}function _o(t){return t instanceof Ie?`设备指纹刷新失败（${t.retcode}）：${t.apiMessage}`:t instanceof or?"设备指纹无效":t instanceof z?`网络请求失败（HTTP ${t.status} ${t.statusText}）`:t instanceof D?`接口返回错误（${t.retcode}）：${t.apiMessage}`:t instanceof Error&&t.message?t.message:String(t)}function To(t){return t instanceof Ie||t instanceof or?"请重置设备信息后重试":t instanceof z?"请检查网络后重试":t instanceof D?"请稍后重试，必要时刷新登录":"请稍后重试"}const $t="zzz_hoyo_auth_bundle",be="zzz_passport_tokens",Fe=1;let Je=null;function He(){return {updatedAt:Date.now(),schemaVersion:Fe}}function Jt(t){try{const e=JSON.parse(t);return !e.stoken||!e.mid?null:{stoken:e.stoken,mid:e.mid,updatedAt:e.updatedAt,cookieTokenUpdatedAt:e.cookieTokenUpdatedAt}}catch{return null}}function ir(t){try{const e=JSON.parse(t);return {...He(),...e,updatedAt:typeof e.updatedAt=="number"?e.updatedAt:Date.now(),schemaVersion:Fe}}catch{return null}}async function Pt(t){await G.setValue($t,JSON.stringify(t));}async function xo(){Je||(Je=(async()=>{if(ir(await G.getValue($t,"")))return;const e=await G.getValue(be,""),n=localStorage.getItem(be)??"",r=Jt(e)??Jt(n);if(!r)return;const o={...He(),stoken:r.stoken,mid:r.mid,updatedAt:Date.now(),rootTokensUpdatedAt:r.updatedAt??Date.now(),cookieTokenUpdatedAt:r.cookieTokenUpdatedAt};await Pt(o),await G.deleteValue(be),localStorage.removeItem(be),l.info("🔐 已将旧版通行证凭证迁移到新的 HoYo 鉴权存储");})()),await Je;}async function $(){await xo();const t=await G.getValue($t,"");return ir(t)??He()}async function le(t){const n={...await $(),...t,updatedAt:Date.now(),schemaVersion:Fe};return await Pt(n),n}async function Ro(t){const e=await $(),n=e.stoken!==t.stoken||e.mid!==t.mid||e.stuid!==(t.stuid??void 0),r={...He(),...e,stoken:t.stoken,mid:t.mid,stuid:t.stuid??void 0,updatedAt:Date.now(),rootTokensUpdatedAt:Date.now(),schemaVersion:Fe};return n&&(r.ltoken=void 0,r.ltuid=void 0,r.cookieToken=void 0,r.accountId=void 0,r.eNapToken=void 0,r.selectedRole=void 0,r.ltokenUpdatedAt=void 0,r.cookieTokenUpdatedAt=void 0,r.eNapTokenUpdatedAt=void 0,r.roleUpdatedAt=void 0),await Pt(r),r}async function Ao(t,e){return await le({ltoken:t,ltuid:e,ltokenUpdatedAt:Date.now()})}async function Io(t,e){return await le({cookieToken:t,accountId:e,cookieTokenUpdatedAt:Date.now()})}async function No(t){return await le({eNapToken:t,eNapTokenUpdatedAt:Date.now()})}async function Lo(t){return await le({selectedRole:t,roleUpdatedAt:Date.now()})}function sr(t){return !!(t.stoken&&t.mid)}function Mo(t){return !!(t.ltoken&&t.ltuid)}function Ct(t){return !!t.eNapToken}function Yt(t,e){for(const n of t){const r=Yn(n);if(r?.name===e)return r.value}return null}function $o(t,e){const n=e.cookie_token??Yt(t,"cookie_token"),r=Yt(t,"account_id")??e.uid;if(!n)throw new Error("获取 cookie_token 失败：响应中未返回 cookie_token");if(!r)throw new Error("获取 cookie_token 失败：响应中未返回 account_id/uid");return {uid:e.uid,cookieToken:n,accountId:r}}function Po(t){const e={proxyStatus:0,isRoot:0,romCapacity:"512",deviceName:t.deviceName,productName:t.product,romRemain:"512",hostname:"dg02-pool03-kvm87",screenSize:"1440x2905",isTablet:0,aaid:"",model:t.deviceName,brand:"XiaoMi",hardware:"qcom",deviceType:"OP5913L1",devId:"unknown",serialNumber:"unknown",sdCardCapacity:512215,buildTime:"1693626947000",buildUser:"android-build",simState:"5",ramRemain:"239814",appUpdateTimeDiff:1702604034882,deviceInfo:`XiaoMi ${t.deviceName} OP5913L1:13 SKQ1.221119.001 T.118e6c7-5aa23-73911:user release-keys`,vaid:"",buildType:"user",sdkVersion:"34",ui_mode:"UI_MODE_TYPE_NORMAL",isMockLocation:0,cpuType:"arm64-v8a",isAirMode:0,ringMode:2,chargeStatus:1,manufacturer:"XiaoMi",emulatorStatus:0,appMemory:"512",osVersion:"14",vendor:"unknown",accelerometer:"1.4883357x9.80665x-0.1963501",sdRemain:239600,buildTags:"release-keys",packageName:"com.mihoyo.hyperion",networkType:"WiFi",oaid:"",debugStatus:1,ramCapacity:"469679",magnetometer:"20.081251x-27.457501x2.1937501",display:`${t.product}_13.1.0.181(CN01)`,appInstallTimeDiff:1688455751496,packageVersion:Kr,gyroscope:"0.030226856x-0.014647375x-0.0013732915",batteryStatus:100,hasKeyboard:0,board:"taro"};return JSON.stringify(e)}function Bo(t){return {device_id:t.deviceId,seed_id:t.seedId,seed_time:t.seedTime,platform:"2",device_fp:t.deviceFp,app_name:"bbs_cn",ext_fields:Po(t)}}function Do(){return ar(6)}function Zo(){return ar(12)}function ar(t){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let n="";for(let r=0;r<t;r++)n+=e[Math.floor(Math.random()*e.length)];return n}function Oo(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){const e=Math.random()*16|0;return (t==="x"?e:e&3|8).toString(16)})}function Fo(){return Ho(16)}function Ho(t){const e=new Uint8Array(Math.ceil(t/2));if(typeof crypto<"u"&&crypto.getRandomValues)crypto.getRandomValues(e);else for(let r=0;r<e.length;r++)e[r]=Math.floor(Math.random()*256);return Array.from(e,r=>r.toString(16).padStart(2,"0")).join("").substring(0,t)}function Uo(t){function e(){return {deviceId:t.generateUUID(),product:t.generateProductName(),deviceName:t.generateDeviceName(),seedId:t.generateSeedId(),seedTime:t.now().toString(),deviceFp:t.deviceFpPlaceholder,updatedAt:t.now(),schemaVersion:1}}function n(o){try{const i=JSON.parse(o);return !i.deviceId||!i.deviceFp?null:{deviceId:i.deviceId,product:i.product||t.generateProductName(),deviceName:i.deviceName||t.generateDeviceName(),seedId:i.seedId||t.generateSeedId(),seedTime:i.seedTime||t.now().toString(),deviceFp:i.deviceFp,updatedAt:typeof i.updatedAt=="number"?i.updatedAt:typeof i.timestamp=="number"?i.timestamp:t.now(),schemaVersion:1}}catch{return null}}function r(o,i=false){return i||o.deviceFp===t.deviceFpPlaceholder?true:t.now()-o.updatedAt>t.deviceFpTtlMs}return {createDeviceProfile:e,parseDeviceProfile:n,shouldRefreshFingerprint:r}}const ge="zzz_device_info",zo=1;let M=null,ke=null;const me=Uo({now:()=>Date.now(),generateUUID:Oo,generateSeedId:Fo,generateProductName:Do,generateDeviceName:Zo,deviceFpPlaceholder:Mt,deviceFpTtlMs:Yr});async function Ne(t){const e={...t,schemaVersion:zo};await G.setValue(ge,JSON.stringify(e)),localStorage.setItem(ge,JSON.stringify(e));}async function cr(){const t=await G.getValue(ge,""),e=me.parseDeviceProfile(t);if(e)return localStorage.setItem(ge,JSON.stringify(e)),e;const n=localStorage.getItem(ge)??"",r=me.parseDeviceProfile(n);if(r)return await Ne(r),r;const o=me.createDeviceProfile();return await Ne(o),o}async function qo(t=false){return ke||(ke=(async()=>(M||(M=await cr()),me.shouldRefreshFingerprint(M,t)&&(M=await Bt(M)),M))().finally(()=>{ke=null;})),await ke}async function Bt(t){const e=Bo(t);l.info(`🔐 开始刷新设备指纹，设备档案: ${t.deviceId}`);const n=await W(to,{method:"POST",anonymous:true,headers:{...yo(),"Content-Type":"application/json"},body:JSON.stringify(e)});if(!n.ok)throw new z(n.status,n.statusText,"设备指纹获取失败");const r=await n.json();if(r.retcode!==0||r.data.code!==200||!r.data.device_fp)throw new D(r.retcode,r.message,"设备指纹获取失败");const o={...t,deviceFp:r.data.device_fp,updatedAt:Date.now()};return await Ne(o),l.info("✅ 设备指纹刷新成功"),o}async function Ue(){return M||(M=await cr(),M)}async function jo(t=false){const e=await qo(t);if(e.deviceFp===Mt)throw new Error("设备指纹仍为占位值，无法继续请求");return e}async function Go(){const t=await Ue();return M=await Bt(t),M}async function Vo(){const t=me.createDeviceProfile();await Ne(t),M=t;try{M=await Bt(t);}catch(e){l.warn("⚠️ 设备档案已重建，但首次刷新指纹失败，将保留占位值",e);}return M}function Ko(t){return !!(t.stoken&&t.mid)}function de(t){return !!(t.accountId&&t.cookieToken)}function Wt(t){return !!t.eNapToken}function Xt(t,e,n){return t?e()-t<n:false}function Qo(t){let e=null,n=null,r=null;async function o(d=false){const f=await t.readAuthBundle();if(!d&&de(f)&&Xt(f.cookieTokenUpdatedAt,t.now,t.cookieTokenTtlMs))return;if(e){t.logger.debug(`🔁 复用进行中的 cookie_token 刷新${d?"（强制）":""}`),await e;return}const g=(async()=>{const h=await t.readAuthBundle();if(!d&&de(h)&&Xt(h.cookieTokenUpdatedAt,t.now,t.cookieTokenTtlMs))return;if(!Ko(h))throw new Error("未找到 stoken/mid，请先扫码登录");const{cookieToken:S,accountId:v,uid:x}=await t.requestCookieTokenByStoken();await t.persistCookieToken(S,v),x&&!h.stuid&&await t.patchAuthBundle({stuid:x}),t.logger.info("🔐 已刷新 cookie_token");})();e=g;try{await g;}finally{e===g&&(e=null);}}async function i(d=false){const f=await t.readAuthBundle();if(!d&&f.selectedRole)return f.selectedRole;if(n)return t.logger.debug(`🔁 复用进行中的角色发现${d?"（强制）":""}`),await n;const g=(async()=>{await o(d);const h=await t.readAuthBundle();if(!de(h))throw new Error("未找到 cookie_token/account_id，请先完成扫码登录");const S=t.buildCookieTokenCookie(h);await t.verifyCookieToken(S);const x=(await t.requestGameRolesByCookieToken(S))[0];if(!x)throw new Error("未找到绝区零角色");return await t.persistSelectedRole(x),x})();n=g;try{return await g}finally{n===g&&(n=null);}}async function s(d){await o(false);let f=await t.readAuthBundle();if(!de(f))throw new Error("未找到 cookie_token/account_id，无法初始化 e_nap_token");try{return await t.requestNapBootstrap(d,t.buildCookieTokenCookie(f))}catch(g){if(!t.isAuthRefreshableError(g))throw g;if(t.logger.warn("⚠️ e_nap_token 自举命中鉴权失败，升级刷新 cookie_token 后重试"),await o(true),f=await t.readAuthBundle(),!de(f))throw new Error("刷新 cookie_token 后仍缺少 cookie_token/account_id");return await t.requestNapBootstrap(d,t.buildCookieTokenCookie(f))}}async function a(d=false,f){const g=await t.readAuthBundle();if(!d&&Wt(g))return g.eNapToken;if(r)return t.logger.debug(`🔁 复用进行中的 e_nap_token 刷新${d?"（强制）":""}`),await r;const h=(async()=>{const S=await t.readAuthBundle();if(!d&&Wt(S))return S.eNapToken;const v=f??S.selectedRole??await i(false),x=await s(v);return await t.persistNapToken(x),await t.persistSelectedRole(v),t.logger.info(`🔐 已${d?"重新":""}完成 e_nap_token 自举`),x})();r=h;try{return await h}finally{r===h&&(r=null);}}async function c(){const d=await i(false);return await a(false,d),d}function u(){e=null,n=null,r=null;}return {ensureCookieToken:o,getPrimaryGameRole:i,ensureNapBusinessToken:a,initializeNapToken:c,reset:u}}function Jo(t){return !!(t.stoken&&t.mid)}function en(t){return !!(t.ltoken&&t.ltuid)}function tn(t,e){return t.ltuid||t.stuid||e}function Yo(t){let e=null;async function n(o=false){const i=await t.readAuthBundle();if(!o&&en(i))return;if(e){t.logger.debug(`🔁 复用进行中的 ltoken 刷新${o?"（强制）":""}`),await e;return}const s=(async()=>{const a=await t.readAuthBundle();if(!o&&en(a))return;if(!Jo(a))throw new Error("未找到 stoken/mid，请先扫码登录");let c=tn(a);c||(c=(await t.requestCookieAccountInfoByStoken()).uid,c&&await t.patchAuthBundle({stuid:a.stuid||c,ltuid:c}));const u=await t.requestLTokenByStoken(),d=await t.readAuthBundle(),f=tn(d,c);if(!f)throw new Error("获取 ltoken 成功但缺少 ltuid/stuid");await t.persistLToken(u.ltoken,f),t.logger.info("🔐 已刷新 ltoken");})();e=s;try{await s;}finally{e===s&&(e=null);}}function r(){e=null;}return {ensureLToken:n,reset:r}}const lr=-106;async function ee(t,e,n){const r=await W(t,e);if(!r.ok)throw new z(r.status,r.statusText,n);const o=await r.json();if(o.retcode!==0)throw new D(o.retcode,o.message,n);return {response:r,data:o}}function ur(t){return t===401||t===403}function dr(t,e=""){const n=e.toLowerCase();return [-100,10001,10002,10101,-3101].includes(t)?true:n.includes("登录")||n.includes("未登录")||n.includes("token")||n.includes("cookie")}async function Wo(){return sr(await $())}function Xo(t){return t instanceof D?dr(t.retcode,t.apiMessage):t instanceof z?ur(t.status):false}async function ei(){const t=await $(),{response:e,data:n}=await ee(`${tr}?stoken=${encodeURIComponent(t.stoken??"")}`,{method:"GET",anonymous:true,cookie:Lt(t),headers:rr()},"获取 cookie_token 失败");return $o(Jn(e,"set-cookie"),n.data)}async function ti(){const t=await $();if(!sr(t))throw new Error("未找到 stoken/mid，请先扫码登录");const{data:e}=await ee(`${oo}?stoken=${encodeURIComponent(t.stoken)}`,{method:"GET",anonymous:true,cookie:Lt(t),headers:So()},"获取 ltoken 失败");return e.data}async function ni(){const t=await $(),{data:e}=await ee(`${tr}?stoken=${encodeURIComponent(t.stoken??"")}`,{method:"GET",anonymous:true,cookie:Lt(t),headers:rr()},"获取通行证账号信息失败");return e.data}async function ri(t){const{data:e}=await ee(so,{method:"GET",anonymous:true,cookie:t,headers:Co()},"获取绝区零角色失败");if(!e.data.list?.length)throw new Error("未找到绝区零角色");return e.data.list}async function oi(t){await ee(io,{method:"POST",anonymous:true,cookie:t,headers:vo()},"校验 cookie_token 失败");}async function ii(t,e){const{response:n}=await ee(co,{method:"POST",anonymous:true,cookie:e,headers:{...wo(),"Content-Type":"application/json"},body:JSON.stringify({game_biz:t.game_biz,lang:"zh-cn",region:t.region,uid:t.game_uid})},"初始化绝区零业务态失败"),r=Vr(n,"e_nap_token");if(!r)throw new Error("初始化绝区零业务态失败：响应中未返回 e_nap_token");return r}const Dt=Qo({now:()=>Date.now(),logger:l,readAuthBundle:$,patchAuthBundle:le,persistCookieToken:Io,persistSelectedRole:Lo,persistNapToken:No,requestCookieTokenByStoken:ei,verifyCookieToken:oi,requestGameRolesByCookieToken:ri,requestNapBootstrap:ii,buildCookieTokenCookie:jr,isAuthRefreshableError:Xo,cookieTokenTtlMs:Wr}),si=Yo({logger:l,readAuthBundle:$,patchAuthBundle:le,persistLToken:Ao,requestCookieAccountInfoByStoken:ni,requestLTokenByStoken:ti});async function fr(t=false){await si.ensureLToken(t);}async function ai(t=false){return await Dt.getPrimaryGameRole(t)}async function ci(){return await Dt.initializeNapToken()}async function Le(t=false){await Dt.ensureNapBusinessToken(t);}async function hr(){const t=await Ue(),{data:e}=await ee(no,{method:"POST",headers:nr(t.deviceId),body:JSON.stringify({})},"创建二维码失败");return e.data}async function li(t){const e=await Ue(),n=await W(ro,{method:"POST",headers:nr(e.deviceId),body:JSON.stringify({ticket:t})});if(!n.ok)throw new z(n.status,n.statusText,"查询扫码状态失败");const r=await n.json();if(r.retcode===lr)throw new D(r.retcode,r.message,"二维码已过期");if(r.retcode!==0)throw new D(r.retcode,r.message,"查询扫码状态失败");return r.data}function ui(t,e){let n=false,r=t;const o=()=>{n=true;};return (async()=>{for(;!n;){if(await di(1e3),n)return;try{const s=await li(r);if(n)return;if(e.onStatusChange(s.status),s.status==="Confirmed"){const a=s.tokens?.[0]?.token,c=s.user_info?.mid,u=s.user_info?.aid;if(!a||!c){e.onError(new Error("扫码成功但缺少 stoken/mid"));return}await Ro({stoken:a,mid:c,stuid:u});const d=await ci();e.onComplete(d);return}}catch(s){if(s instanceof D&&s.retcode===lr)try{const a=await hr();r=a.ticket,e.onQRExpired(a);continue}catch(a){e.onError(a);return}e.onError(s);return}}})(),o}function di(t){return new Promise(e=>{window.setTimeout(e,t);})}let U=null,ve=null;function Et(t){U={uid:t.game_uid,nickname:t.nickname,level:t.level,region:t.region};}function fi(t){U={uid:t.game_uid,nickname:t.nickname,level:t.level,region:t.region};}async function hi(t=false){t&&await Le(true);const e=await $();Ct(e)||await Le(false);const n=await $();if(!Ct(n))throw new Error("未找到 e_nap_token，无法请求登录信息");const r=await W(`${ao}&ts=${Date.now()}`,{method:"GET",anonymous:true,cookie:Wn(n),headers:bo()});if(!r.ok)throw new z(r.status,r.statusText,"获取登录信息失败");const o=await r.json();if(o.retcode!==0)throw new D(o.retcode,o.message,"获取登录信息失败");return o}async function gr(){U||await mr();}function gi(){return U}async function mr(){return U||(ve||(ve=(async()=>{const t=await $();if(t.selectedRole)return Et(t.selectedRole),U;try{const n=await ai(!1);return Et(n),U}catch(n){l.warn("⚠️ 通过角色发现初始化用户缓存失败，降级尝试 login/info",n);}const e=await hi(false);return fi(e.data),U})().finally(()=>{ve=null;})),await ve)}function mi(t){if(!t.game_uid||!t.region)throw new Error("角色信息不完整，无法写入用户缓存");Et(t),l.info(`👤 已使用角色信息更新用户缓存: ${t.nickname} (UID: ${t.game_uid})`);}async function pi(){await Go();}async function nn(){l.info("🔄 开始重建设备档案...");const t=await Vo();if(t.deviceFp===Mt)throw new Error("设备档案已重建，但新的 device_fp 仍未成功获取");l.info("✅ 设备档案重建完成"),l.debug("设备档案详情:",t);}function yi(t){const e=new Map;async function n(o){const i=e.get(o);if(i){t.logger.debug(`🔁 复用进行中的 ${o} 路由鉴权刷新`),await i;return}const s=t.triggerRouteAuthRefresh(o);e.set(o,s);try{await s;}finally{e.get(o)===s&&e.delete(o);}}async function r({url:o,endpoint:i,route:s,method:a,body:c,headers:u={},requestLabel:d}){const f=async(g=false,h=false)=>{const S=await t.buildRouteRequestContext(s,i,g),v={...S.headers,...u};c!==void 0&&!v["Content-Type"]&&(v["Content-Type"]="application/json"),t.logger.debug(`🌐 发起请求 ${d}${g||h?" (重试)":""}`,{endpoint:i,route:s,authRetried:g,deviceRetried:h});try{const x=await t.fetch(o,{method:a,anonymous:!0,cookie:S.cookie,headers:v,body:c!==void 0?JSON.stringify(c):void 0});if(!x.ok){if(!g&&await t.hasPersistedStoken()&&t.isPassportAuthHttpStatus(x.status))return t.logger.warn(`⚠️ 鉴权失败，准备刷新路由凭证后重试 ${d}`),await n(s),await f(!0,h);throw new z(x.status,x.statusText)}const m=await x.json();if(m.retcode!==0){if(fo.has(m.retcode)&&!h){t.logger.warn(`⚠️ 设备指纹错误，准备刷新后重试 ${d}`,{retcode:m.retcode,message:m.message});try{return await t.getDeviceFingerprint(),await f(g,!0)}catch(I){throw new Ie(m.retcode,m.message,I)}}if(!g&&await t.hasPersistedStoken()&&t.isPassportAuthRetcode(m.retcode,m.message))return t.logger.warn(`⚠️ 业务鉴权失败，准备刷新路由凭证后重试 ${d}`,{retcode:m.retcode,message:m.message}),await n(s),await f(!0,h);throw new D(m.retcode,m.message)}return m}catch(x){throw x instanceof D||x instanceof z||x instanceof Ie||t.logger.error(`❌ 请求异常 ${d}`,x),x}};return await f()}return {execute:r}}async function Si(t,e,n=false){if(t==="nap_cultivate"){const i=await jo();await Le(n);const s=await $();if(!Ct(s))throw new Error("未找到 e_nap_token，请先完成扫码登录");return {headers:Eo(e,i),cookie:Wn(s)}}await fr(n);const r=await $();if(!Mo(r))throw new Error("未找到 ltoken/ltuid，请先完成扫码登录");const o=await Ue();return {headers:ko(o),cookie:qr(r)}}async function wi(t){if(t==="nap_cultivate"){await Le(true);return}await fr(true);}const bi=yi({fetch:W,logger:l,buildRouteRequestContext:Si,triggerRouteAuthRefresh:wi,hasPersistedStoken:Wo,isPassportAuthHttpStatus:ur,isPassportAuthRetcode:dr,getDeviceFingerprint:pi});async function ze(t,e,n={}){const{method:r="GET",params:o={},body:i,headers:s={}}=n,a=ho(e);e===ye&&await gr();let c=`${e}${t}`;if(Object.keys(o).length>0){const d=new URLSearchParams;Object.entries(o).forEach(([f,g])=>{d.append(f,String(g));}),c+=`?${d.toString()}`;}const u=`${r} ${t}`;return await bi.execute({url:c,endpoint:t,route:a,method:r,body:i,headers:s,requestLabel:u})}async function qe(t,e){await gr();const n=gi();if(n)return {uid:n.uid,region:e||n.region};throw new Error("❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社")}async function ki(t,e,n){if(t.length<=e)return n(t);const r=[];for(let s=0;s<t.length;s+=e)r.push(t.slice(s,s+e));const o=r.map(s=>n(s));return (await Promise.all(o)).flat()}async function vi(t,e){const n=await qe(t,e),o=(await ze("/user/avatar_basic_list",ye,{method:"GET",params:{uid:n.uid,region:n.region}})).data.list.filter(i=>i.unlocked===true);return o.length===0?l.warn("⚠️ 角色基础列表为空（unlocked=0）"):l.debug(`✅ 获取角色基础列表成功: ${o.length} 个角色`),o}async function rn(t,e,n){if(t.length===0)return l.warn("⚠️ 批量角色详情请求为空，返回空列表"),[];const r=await qe(e,n),o=typeof t[0]=="number"?t.map(s=>({avatar_id:s,is_teaser:false,teaser_need_weapon:false,teaser_sp_skill:false})):t,i=await ki(o,10,async s=>(l.debug(`📦 拉取角色详情批次: ${s.length} 个`),(await ze("/user/batch_avatar_detail_v2",ye,{method:"POST",params:{uid:r.uid,region:r.region},body:{avatar_list:s}})).data.list));return l.debug(`✅ 批量角色详情获取完成: ${i.length} 个`),i}async function Ci(t,e){const n=await qe(t,e);l.debug(`📘 获取游戏便笺: uid=${n.uid}, region=${n.region}`);const r=await ze("/note",er,{method:"GET",params:{server:n.region,role_id:n.uid}});return l.debug("✅ 游戏便笺获取成功"),r.data}const pe="https://zzz.seelie.me",pr="seelie_site_manifest_v1",Ei=360*60*1e3,yr=/\/assets\/index-([a-f0-9]+)\.js/,_i=/strings-zh-([a-f0-9]+)\.js/,Ti=/https:\/\/stardb\.gg\/zzz\/signal-tracker[^\s"'`)]*/,on={charactersStats:/stats-characters-[a-f0-9]+\.js/,weaponsStats:/stats-weapons-[a-f0-9]+\.js/,weaponsStatsCommon:/stats-weapons-common-[a-f0-9]+\.js/};let H=null,fe=null;async function sn(t){const e=await W(t);if(!e.ok)throw new Error(`请求失败: ${e.status} ${e.statusText} (${t})`);return await e.text()}function Me(t,e){return {...t,source:e}}function _t(){try{const t=localStorage.getItem(pr);if(!t)return null;const e=JSON.parse(t);return typeof e!="object"||e===null||typeof e.fetchedAt!="number"||typeof e.indexScriptPath!="string"||typeof e.indexScriptUrl!="string"||typeof e.statsFiles!="object"||e.statsFiles===null||typeof e.adHints!="object"||e.adHints===null?null:{fetchedAt:e.fetchedAt,indexScriptPath:e.indexScriptPath,indexScriptUrl:e.indexScriptUrl,stringsZhFile:typeof e.stringsZhFile=="string"?e.stringsZhFile:null,stringsZhUrl:typeof e.stringsZhUrl=="string"?e.stringsZhUrl:null,statsFiles:e.statsFiles,adHints:{hasPleaseSticker:!!e.adHints.hasPleaseSticker,hasLeaderboardTarget:!!e.adHints.hasLeaderboardTarget,hasPwIncontent:!!e.adHints.hasPwIncontent,usesLegacyContainer:!!e.adHints.usesLegacyContainer,usesModernContainer:!!e.adHints.usesModernContainer,signalTrackerHref:typeof e.adHints.signalTrackerHref=="string"?e.adHints.signalTrackerHref:null}}}catch(t){return l.warn("读取 site manifest 缓存失败，忽略缓存:",t),null}}function xi(t){try{localStorage.setItem(pr,JSON.stringify(t));}catch(e){l.warn("写入 site manifest 缓存失败:",e);}}function Ri(t){return Date.now()-t.fetchedAt<Ei}function Ai(t){const e={};return Object.keys(on).forEach(n=>{const r=t.match(on[n]);r&&(e[n]=r[0]);}),e}function Ii(t,e){const n=t.match(yr);if(!n)throw new Error("在主页 HTML 中未找到 index-*.js");const r=n[0],o=`${pe}${r}`,i=e.match(_i),s=i?i[0]:null,a=s?`${pe}/assets/locale/${s}`:null,c=e.match(Ti),u=c?c[0]:null;return {fetchedAt:Date.now(),indexScriptPath:r,indexScriptUrl:o,stringsZhFile:s,stringsZhUrl:a,statsFiles:Ai(e),adHints:{hasPleaseSticker:e.includes("img/stickers/please.png"),hasLeaderboardTarget:e.includes("leaderboard-target"),hasPwIncontent:e.includes("pw-incontent"),usesLegacyContainer:e.includes("overflow-hidden relative text-white"),usesModernContainer:e.includes("relative mx-auto overflow-hidden shrink-0"),signalTrackerHref:u}}}async function Ni(){const t=await sn(pe),e=t.match(yr);if(!e)throw new Error("在主页 HTML 中未找到 index-*.js");const n=e[0],r=`${pe}${n}`,o=await sn(r),i=Ii(t,o);return xi(i),Me(i,"network")}function Li(){if(H)return H;const t=_t();return t?Me(t,"cache"):null}async function Sr(t={}){const{forceRefresh:e=false}=t;if(!e&&H)return H;if(!e&&fe)return fe;if(!e){const n=_t();if(n&&Ri(n))return H=Me(n,"cache"),H}return fe=(async()=>{try{const n=await Ni();return H=n,n}catch(n){const r=_t();if(r)return l.warn("刷新 site manifest 失败，回退到缓存:",n),H=Me(r,"cache"),H;throw n}finally{fe=null;}})(),fe}class Mi{static UNIQUE_ZZZ_KEYS=["denny","w_engine","drive_disc"];static async fetchContent(e){try{const n=await W(e);if(!n.ok)throw new Error(`请求失败，状态码: ${n.status} - ${n.statusText}`);return await n.text()}catch(n){const r=n instanceof Error?n.message:String(n);throw new Error(`获取 ${e} 时网络错误: ${r}`)}}static restoreZzzData(e){l.debug("▶️  开始从 JS 内容中还原绝区零数据...");const n=e.match(/\bexport\s*\{([\s\S]*?)\}/);if(!n)throw new Error("在JS文件中未找到 export 语句。");const r=n[1].split(",").map(i=>i.trim().split(/\s+as\s+/)[0]).filter(Boolean);let o=e.replace(/\bexport\s*\{[\s\S]*?};/,"");o+=`

// Appended by script
return { ${r.map(i=>`${i}: ${i}`).join(", ")} };`;try{const s=new Function(o)();l.debug(`🔍 正在 ${Object.keys(s).length} 个数据块中搜索绝区零数据...`);for(const a in s){const c=s[a];if(!c||typeof c!="object")continue;const u=[c.default,c];for(const d of u)if(d&&typeof d=="object"&&this.UNIQUE_ZZZ_KEYS.some(f=>f in d))return l.debug(`🎯 命中！在变量 '${a}' 中找到关键词。`),d}throw new Error("未能在任何数据块中找到绝区零的锚点关键词。")}catch(i){const s=i instanceof Error?i.message:String(i);throw new Error(`还原数据时发生错误: ${s}`)}}static parseStatsFile(e){try{const n=e.match(/\bexport\s*\{([\s\S]*?)\}/);if(!n)throw new Error("在统计文件中未找到 export 语句");const r=n[1].split(",").map(c=>c.trim()),o={};let i=null;r.forEach(c=>{const u=c.split(/\s+as\s+/);if(u.length===2){const[d,f]=u;f.trim()==="default"&&(i=d.trim()),o[f.trim()]=d.trim();}else {const d=c.trim();o[d]=d;}});let s=e.replace(/\bexport\s*\{[\s\S]*?};/,"");if(i)s+=`

// Appended by script
return ${i};`;else {const c=Object.values(o);s+=`

// Appended by script
return { ${c.map(u=>`${u}: ${u}`).join(", ")} };`;}return new Function(s)()}catch(n){const r=n instanceof Error?n.message:String(n);throw new Error(`解析统计文件时发生错误: ${r}`)}}static async processStatsFiles(e){l.debug("▶️  开始并行处理统计数据文件...");const r=["charactersStats","weaponsStats","weaponsStatsCommon"].map(async s=>{const a=e[s];if(!a)return l.warn(`⚠️  未找到 ${s} 文件，跳过...`),{name:s,data:null};const c=`${pe}/assets/${a}`;l.debug(`📥 下载 ${s} -> ${c}`);try{const u=await this.fetchContent(c),d=this.parseStatsFile(u);return l.debug(`✅ ${s} 处理完成`),{name:s,data:d}}catch(u){const d=u instanceof Error?u.message:String(u);return l.error(`❌ 处理 ${s} 时出错: ${d}`),{name:s,data:null}}}),o=await Promise.all(r),i={};return o.forEach(({name:s,data:a})=>{a!==null&&(i[s]=a);}),l.debug(`✅ 统计数据并行处理完成，共处理 ${Object.keys(i).length} 个文件`),i}static async updateSeelieData(){try{l.debug("🚀 开始更新 Seelie 数据...");const e=await Sr();if(l.debug(`第一步：使用站点 manifest（来源: ${e.source}）`),l.debug(`第二步：发现主脚本 -> ${e.indexScriptUrl}`),!e.stringsZhUrl)throw new Error("在主脚本中未找到 strings-zh-*.js 语言包。");l.debug(`第三步：发现中文语言包 -> ${e.stringsZhUrl}`),l.debug("🔄 开始并行处理语言包和统计数据...");const[n,r]=await Promise.all([this.fetchContent(e.stringsZhUrl),this.processStatsFiles(e.statsFiles)]);l.debug("✅ 语言包和统计数据并行处理完成");const o=this.restoreZzzData(n);return l.debug("🎉 Seelie 数据更新完成！"),{languageData:o,statsData:r}}catch(e){const n=e instanceof Error?e.message:String(e);throw l.error(`❌ Seelie 数据更新失败: ${n}`),e}}static cacheData(e,n){try{localStorage.setItem("seelie_language_data",JSON.stringify(e)),localStorage.setItem("seelie_stats_data",JSON.stringify(n)),localStorage.setItem("seelie_data_timestamp",Date.now().toString()),l.debug("✅ 数据已缓存到 localStorage");}catch(r){l.error("❌ 缓存数据失败:",r);}}static getCachedData(){try{const e=localStorage.getItem("seelie_language_data"),n=localStorage.getItem("seelie_stats_data"),r=localStorage.getItem("seelie_data_timestamp");return !e||!n||!r?null:{languageData:JSON.parse(e),statsData:JSON.parse(n),timestamp:parseInt(r)}}catch(e){return l.error("❌ 获取缓存数据失败:",e),null}}static async getLatestData(){try{l.debug("🔄 请求最新 Seelie 数据...");const{languageData:e,statsData:n}=await this.updateSeelieData();return this.cacheData(e,n),{languageData:e,statsData:n}}catch(e){l.warn("⚠️ 网络请求失败，尝试使用缓存数据:",e);const n=this.getCachedData();if(n)return l.debug("✅ 使用缓存的 Seelie 数据"),{languageData:n.languageData,statsData:n.statsData};throw new Error("网络请求失败且无可用缓存数据")}}}const B=[9,19,29,39,49,60],$i={0:"basic",1:"special",2:"dodge",3:"chain",5:"core",6:"assist"},Pi=360;let P={};const Bi={ascRate:[],rate:[]},an={charactersStats:false,weaponsStats:false,weaponsStatsCommon:false};function Zt(t,e){an[t]||(an[t]=true,l.warn(e));}async function Ot(){if(!P.loaded){if(P.loading){await P.loading;return}P.loading=(async()=>{try{l.debug("🔄 懒加载 Seelie 数据...");const{languageData:t,statsData:e}=await Mi.getLatestData();P.languageData=t,P.statsData=e,P.loaded=!0,l.info("✅ Seelie 数据加载完成");}catch(t){throw l.error("❌ Seelie 数据加载失败:",t),t}finally{P.loading=void 0;}})(),await P.loading;}}async function Di(){return await Ot(),P.languageData}async function Ft(){return await Ot(),P.statsData}async function Zi(){try{const t=await Ft();if(t?.charactersStats&&Array.isArray(t.charactersStats))return l.debug("✅ 使用动态角色统计数据"),t.charactersStats}catch(t){l.warn("⚠️ 获取角色统计数据失败:",t);}return Zt("charactersStats","⚠️ 角色统计数据缺失，回退为空数组"),[]}async function Oi(){try{const t=await Ft();if(t?.weaponsStats&&typeof t.weaponsStats=="object")return l.debug("✅ 使用动态武器统计数据"),t.weaponsStats}catch(t){l.warn("⚠️ 获取武器统计数据失败:",t);}return Zt("weaponsStats","⚠️ 武器统计数据缺失，回退为空对象"),{}}async function Fi(){try{const t=await Ft();if(t?.weaponsStatsCommon&&typeof t.weaponsStatsCommon=="object"&&Array.isArray(t.weaponsStatsCommon.ascRate)&&Array.isArray(t.weaponsStatsCommon.rate))return l.debug("✅ 使用动态武器通用统计数据"),t.weaponsStatsCommon}catch(t){l.warn("⚠️ 获取武器通用统计数据失败:",t);}return Zt("weaponsStatsCommon","⚠️ 武器通用统计数据缺失，回退为空配置"),Bi}class Hi{appElement=null;rootComponent=null;lastToast=null;constructor(){this.init();}init(){if(this.appElement=document.querySelector("#app"),!this.appElement){l.warn("⚠️ SeelieCore: 未找到 #app 元素");return}if(this.appElement._vnode?.component){this.completeInit();return}this.waitForVNodeComponent();}waitForVNodeComponent(){if(!this.appElement)return;l.debug("🔍 SeelieCore: 等待 _vnode.component 出现...",this.appElement?._vnode?.component);const n=new MutationObserver(()=>{l.debug("🔍 SeelieCore: 等待 _vnode.component 出现...",this.appElement?._vnode?.component),this.appElement?._vnode?.component&&(o(),this.completeInit());});n.observe(this.appElement,{attributes:true,childList:false,subtree:false});const r=setTimeout(()=>{this.rootComponent||(o(),l.warn(`⚠️ SeelieCore: 等待 _vnode.component 超时 ${3e3/1e3}秒`));},3e3),o=()=>{n.disconnect(),clearTimeout(r);};}completeInit(){if(!this.appElement?._vnode?.component){l.warn("⚠️ SeelieCore: 完成初始化时 _vnode.component 不存在");return}this.rootComponent=this.appElement._vnode.component,Ot(),l.debug("✅ SeelieCore: 已尝试初始化 stats 数据"),l.log("✅ SeelieCore 初始化成功");}ensureInitialized(){return this.rootComponent||this.init(),!!this.rootComponent}getProxy(){return this.ensureInitialized()?this.rootComponent?.proxy:null}getAccountResin(){const e=this.getProxy();if(!e)return l.warn("⚠️ 无法获取组件 proxy 对象"),null;const n=e.accountResin;return l.debug("📖 获取 accountResin:",n),n}setAccountResin(e){const n=this.getProxy();if(!n)return l.warn("⚠️ 无法获取组件 proxy 对象"),false;try{const r=n.accountResin,o=this.convertToAccountResinFormat(e);return n.accountResin=o,l.debug("✏️ 设置 accountResin:",{oldValue:r,inputValue:e,convertedValue:o}),!0}catch(r){return l.error("❌ 设置 accountResin 失败:",r),false}}convertToAccountResinFormat(e){if(!e||!e.progress)throw new Error("输入参数格式错误，缺少 progress 字段");const{progress:n,restore:r}=e,o=n.current,i=n.max,s=r,a=new Date,c=(i-o)*Pi,u=new Date(a.getTime()+(s-c)*1e3);return {amount:o,time:u.toString()}}setToast(e,n=""){const r=this.getProxy();if(!r)return l.warn("⚠️ 无法获取组件 proxy 对象"),false;try{const o=Date.now();return this.lastToast&&this.lastToast.message===e&&this.lastToast.type===n&&o-this.lastToast.timestamp<1500?(l.debug("🍞 跳过重复 Toast:",{message:e,type:n}),!0):(r.toast=e,r.toastType=n,this.lastToast={message:e,type:n,timestamp:o},l.debug("🍞 设置 Toast:",{message:e,type:n}),!0)}catch(o){return l.error("❌ 设置 Toast 失败:",o),false}}addGoal(e){const n=this.getProxy();if(!n)return l.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof n.addGoal!="function")return l.warn("⚠️ addGoal 方法不存在"),false;try{return n.addGoal(e),!0}catch(r){return l.error("❌ 调用 addGoal 失败:",r),false}}removeGoal(e){const n=this.getProxy();if(!n)return l.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof n.removeGoal!="function")return l.warn("⚠️ removeGoal 方法不存在"),false;try{return n.removeGoal(e),!0}catch(r){return l.error("❌ 调用 removeGoal 失败:",r),false}}setInventory(e,n,r,o){const i=this.getProxy();if(!i)return l.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof i.setInventory!="function")return l.warn("⚠️ setInventory 方法不存在"),false;try{return i.setInventory(e,n,r,o),!0}catch(s){return l.error("❌ 调用 setInventory 失败:",s),false}}getCharacters(){return this.getProxy()?.characters||{}}getWeapons(){return this.getProxy()?.weapons||{}}getGoals(){return this.getProxy()?.goals||[]}getItems(){return this.getProxy()?.items||{}}getContextInfo(){const e=this.getProxy();return e?{keys:Object.keys(e),accountResin:e.accountResin,hasAccountResin:"accountResin"in e,contextType:typeof e}:null}refresh(){l.debug("🔄 SeelieCore 重新初始化..."),this.appElement=null,this.rootComponent=null,this.init();}}async function Ui(t){try{const n=(await Zi()).find(d=>d.id===t.id);if(!n)return l.warn(`⚠️ 未找到角色 ${t.name_mi18n} 的统计数据`),B.findIndex(d=>d>=t.level);const r=t.properties.find(d=>d.property_id===1);if(!r)return l.warn(`⚠️ 角色 ${t.name_mi18n} 缺少生命值属性`),B.findIndex(d=>d>=t.level);const o=parseInt(r.base||r.final),i=n.base,s=(t.level-1)*n.growth/1e4,a=t.skills.find(d=>d.skill_type===5),c=a&&n.core&&n.core[a.level-2]||0,u=i+s+c;for(let d=0;d<n.ascHP.length;d++){const f=n.ascHP[d];if(Math.floor(u+f)===o)return d}return l.warn(`HP error: ${t.name_mi18n}, base: ${i}, growth: ${s}, core: ${c}, fixed: ${u}, target: ${o}`),B.findIndex(d=>d>=t.level)}catch(e){return l.error("❌ 计算角色突破等级失败:",e),B.findIndex(n=>n>=t.level)}}async function zi(t){try{const e=await Fi(),n=await Oi(),r=e.rate[t.level]||0,o=t.main_properties.find(u=>u.property_id===12101);if(!o)return l.warn(`⚠️ 武器 ${t.name} 缺少攻击力属性`),B.findIndex(u=>u>=t.level);const i=parseInt(o.base),s=n[t.id]||48,a=s*r/1e4,c=s+a;for(let u=0;u<e.ascRate.length;u++){const d=e.ascRate[u],f=s*d/1e4;if(Math.floor(c+f)===i)return u}return l.warn(`ATK error: ${t.name}, base: ${s}, growth: ${a}, fixed: ${c}, target: ${i}`),B.findIndex(u=>u>=t.level)}catch(e){return l.error("❌ 计算武器突破等级失败:",e),B.findIndex(n=>n>=t.level)}}function qi(t,e,n){let r=t;return e==="core"?r--:n>=5?r-=4:n>=3&&(r-=2),Math.max(1,r)}class ji extends Hi{async setCharacter(e){try{const n=e.avatar||e,r=this.findCharacterKey(n.id);if(!r)throw new Error("Character not found.");const o=this.findExistingGoal(r,"character"),i=await Ui(n),s=o;let a=s?.goal?.level;(!a||a<n.level)&&(a=n.level);let c=s?.goal?.asc;(!c||c<i)&&(c=i);const u={type:"character",character:r,cons:n.rank,current:{level:n.level,asc:i},goal:{level:a||n.level,asc:c||i}};return this.addGoal(u)?(l.debug("✓ 角色数据设置成功:",{character:r,level:n.level,rank:n.rank,currentAsc:i,targetLevel:a,targetAsc:c}),!0):!1}catch(n){return l.error("❌ 设置角色数据失败:",n),false}}setTalents(e){try{const n=e.avatar||e,r=this.findCharacterKey(n.id);if(!r)throw new Error("Character not found.");const o=this.findExistingGoal(r,"talent"),i={};n.skills.forEach(a=>{const c=$i[a.skill_type];if(!c)return;const u=qi(a.level,c,n.rank);let f=o?.[c]?.goal;(!f||f<u)&&(f=u),i[c]={current:u,goal:f||u};});const s={type:"talent",character:r,...i};return this.addGoal(s)?(l.debug("✓ 角色天赋数据设置成功:",{character:r,talents:i}),!0):!1}catch(n){return l.error("❌ 设置角色天赋数据失败:",n),false}}async setWeapon(e){try{const n=e.avatar||e,r=e.weapon,o=this.findCharacterKey(n.id);if(!o)throw new Error("Character not found.");const i=this.findExistingGoal(o,"weapon");if(!r)return i&&this.removeGoal(i)&&l.debug("✓ 移除武器目标成功"),!0;const s=this.findWeaponKey(r.id);if(!s)throw new Error("Weapon not found.");const a=await zi(r),c={level:r.level,asc:a};let u={level:c.level,asc:c.asc};const d=this.getWeapons(),f=i,g=f?.weapon?d[f.weapon]:null,h=d[s];g?.id===h?.id&&f?.goal?(u.level=Math.max(f.goal.level||c.level,c.level),u.asc=Math.max(f.goal.asc||c.asc,c.asc),h.craftable&&(c.craft=r.star,u.craft=Math.max(f.goal.craft||r.star,r.star))):h.craftable&&(c.craft=r.star,u.craft=r.star);const S={type:"weapon",character:o,weapon:s,current:c,goal:u};return this.addGoal(S)?(l.debug("✓ 武器数据设置成功:",{character:o,weapon:s,current:c,goal:u}),!0):!1}catch(n){return l.error("❌ 设置武器数据失败:",n),false}}async syncCharacter(e){const n={success:0,failed:0,errors:[]},r=e.avatar||e,o=r.name_mi18n||`角色ID:${r.id}`;l.debug(`🔄 开始同步角色: ${o}`);const s=[{name:"角色数据",fn:()=>this.setCharacter(e)},{name:"天赋数据",fn:()=>this.setTalents(e)},{name:"武器数据",fn:()=>this.setWeapon(e)}].map(async({name:c,fn:u})=>{try{return await u()?(l.debug(`✓ ${o} - ${c}同步成功`),{success:!0,error:null}):{success:!1,error:`${o} - ${c}同步失败`}}catch(d){const f=`${o} - ${c}同步错误: ${d}`;return l.error(`❌ ${f}`),{success:false,error:f}}});return (await Promise.all(s)).forEach(({success:c,error:u})=>{c?n.success++:(n.failed++,u&&n.errors.push(u));}),n.failed>0?l.warn(`⚠️ ${o} 同步完成 - 成功: ${n.success}, 失败: ${n.failed}`):l.debug(`✅ ${o} 同步完成 - 成功: ${n.success}`),n}async syncAllCharacters(e){const n={total:e.length,success:0,failed:0,errors:[],details:[]};l.debug(`🚀 开始批量同步 ${e.length} 个角色`);const r=e.map(async(i,s)=>{const a=i.avatar||i,c=a.name_mi18n||`角色ID:${a.id}`;l.debug(`📝 [${s+1}/${e.length}] 同步角色: ${c}`);try{const u=await this.syncCharacter(i);return {character:c,result:u,success:u.failed===0}}catch(u){const d=`${c} - 批量同步失败: ${u}`;return l.error(`❌ ${d}`),{character:c,result:{success:0,failed:1,errors:[d]},success:false}}});return (await Promise.all(r)).forEach(({character:i,result:s,success:a})=>{n.details.push({character:i,result:s}),a?n.success++:(n.failed++,n.errors.push(...s.errors));}),this.logBatchResult(n),n}findCharacterKey(e){const n=this.getCharacters();return Object.keys(n).find(r=>n[r].id===e)||null}findWeaponKey(e){const n=this.getWeapons();return Object.keys(n).find(r=>n[r].id===e)||null}findExistingGoal(e,n){return this.getGoals().find(o=>{const i=o;return i.character===e&&i.type===n})}logBatchResult(e){e.failed>0?(l.warn("⚠️ 批量同步完成:"),l.warn(`   总计: ${e.total} 个角色`),l.warn(`   成功: ${e.success} 个角色`),l.warn(`   失败: ${e.failed} 个角色`)):(l.debug("🎯 批量同步完成:"),l.debug(`   总计: ${e.total} 个角色`),l.debug(`   成功: ${e.success} 个角色`)),e.errors.length>0&&(l.warn("   错误详情:"),e.errors.forEach(n=>l.warn(`     - ${n}`)));}_minimumSetCoverCache=null;_minimumSetWeaponsCache=null;findMinimumSetCoverIds(){if(this._minimumSetCoverCache!==null)return l.debug("📦 使用缓存的最小集合覆盖结果"),this._minimumSetCoverCache;const e=this.getCharacters(),n=Object.values(e),r=new Set;for(const a of n)r.add(a.attribute),r.add(a.style),r.add(a.boss),r.add(a.boss_weekly);const o=new Set(r),i=[],s=new Set;for(;o.size>0;){let a=null,c=0;for(const d of n){if(s.has(d.id)||new Date(d.release)>new Date)continue;const f=new Set([d.attribute,d.style,d.boss,d.boss_weekly]);let g=0;for(const h of f)o.has(h)&&g++;g>c&&(c=g,a=d);}if(a===null){l.warn("⚠️ 无法覆盖所有属性，可能缺少某些属性的组合");break}i.push({id:a.id,style:a.style}),s.add(a.id);const u=new Set([a.attribute,a.style,a.boss,a.boss_weekly]);for(const d of u)o.delete(d);l.debug(`✅ 选择角色 ${a.id}，覆盖 ${c} 个属性`);}return l.debug(`🎯 最小集合覆盖完成，共选择 ${i.length} 个角色: ${i.join(", ")}`),this._minimumSetCoverCache=i,i}findMinimumSetWeapons(){if(this._minimumSetWeaponsCache!==null)return l.debug("📦 使用缓存的最小武器集合结果"),this._minimumSetWeaponsCache;const e=this.getWeapons(),n=Object.values(e),r={};for(const o of n)o.tier===5&&!r[o.style]&&new Date>=new Date(o.release)&&(r[o.style]=o.id);return this._minimumSetWeaponsCache=r,r}}class Gi extends ji{}const V=new Gi,Vi=t=>V.setAccountResin(t),N=(t,e="success")=>V.setToast(t,e),Ki=async t=>await V.syncCharacter(t),Qi=async t=>await V.syncAllCharacters(t),Tt=(t,e,n,r)=>V.setInventory(t,e,n,r),Ji=()=>V.findMinimumSetCoverIds(),Yi=()=>V.findMinimumSetWeapons(),Wi=()=>V.getItems();var xt=(t=>(t[t.NormalAttack=0]="NormalAttack",t[t.SpecialSkill=1]="SpecialSkill",t[t.Dodge=2]="Dodge",t[t.Chain=3]="Chain",t[t.CorePassive=5]="CorePassive",t[t.SupportSkill=6]="SupportSkill",t))(xt||{});async function Xi(t,e,n,r){const o=await qe(n,r);l.debug(`🧮 开始计算养成材料: avatar=${t}, weapon=${e}`);const i={avatar_id:Number(t),avatar_level:B[B.length-1],avatar_current_level:1,avatar_current_promotes:1,skills:Object.values(xt).filter(a=>typeof a!="string").map(a=>({skill_type:a,level:a===xt.CorePassive?7:12,init_level:1})),weapon_info:{weapon_id:Number(e),weapon_level:B[B.length-1],weapon_promotes:0,weapon_init_level:0}},s=await ze("/user/avatar_calc",ye,{method:"POST",params:{uid:o.uid,region:o.region},body:i});return l.debug(`✅ 养成材料计算完成: avatar=${t}, weapon=${e}`),s.data}async function es(t,e,n){if(t.length===0)return l.warn("⚠️ 批量养成材料计算参数为空，返回空列表"),[];l.debug(`📦 开始批量养成材料计算: ${t.length} 个角色`);const r=t.map(i=>Xi(i.avatar_id,i.weapon_id,e,n)),o=await Promise.all(r);return l.debug(`✅ 批量养成材料计算完成: ${o.length} 个结果`),o}function ts(t){const e={};for(const n of t){const r=[...n.avatar_consume,...n.weapon_consume,...n.skill_consume,...n.need_get];for(const o of r){const i=o.id.toString();i in e||(e[i]={id:o.id,name:o.name});}}return e}function ns(t,e){const n={},r={};for(const o of t)Object.assign(r,o.user_owns_materials);for(const[o,i]of Object.entries(e)){const s=r[o]||0;n[i.name]=s;}return n}function rs(t){const e={};for(const[n,r]of Object.entries(t))typeof r=="string"?e[r]=n:Array.isArray(r)&&r.forEach((o,i)=>{e[o]=`${n}+${i}`;});return e}function os(t,e,n){let r=0,o=0;for(const[i,s]of Object.entries(t)){const a=e[i];if(!a){o++;continue}try{const c=a.split("+");if(c.length>1){const u=c[0],d=Number(c[1]),f=n[u].type;f&&Tt(f,u,d,s)?r++:o++;}else {const u=n[a]?.type;u&&Tt(u,a,0,s)?r++:o++;}}catch{o++;}}return {successNum:r,failNum:o}}function is(t){const e={};for(const n of t){const r=[...n.avatar_consume,...n.weapon_consume,...n.skill_consume,...n.need_get];for(const o of r){const i=o.id.toString();i in e||(e[i]=0);}for(const[o,i]of Object.entries(n.user_owns_materials))e[o]=Math.max(e[o]??0,i);}return e}function ss(t,e){const n=new Map;for(const[r,o]of Object.entries(t))if(o.id!=null&&n.set(o.id,{key:r,tier:0,type:o.type}),o.ids)for(let i=0;i<o.ids.length;i++)n.set(o.ids[i],{key:r,tier:i,type:o.type});return e!=null&&!n.has(e)&&n.set(e,{key:"denny",tier:0,type:"denny"}),n}function as(t,e){let n=0,r=0;const o=[];for(const[i,s]of Object.entries(t)){const a=Number(i),c=e.get(a);if(!c){o.push(i),r++;continue}try{Tt(c.type,c.key,c.tier,s)?n++:(r++,l.warn(`⚠️ setInventory 失败: id=${i}, key=${c.key}`));}catch(u){r++,l.error(`❌ setInventory 异常: id=${i}`,u);}}return o.length>0&&l.warn(`⚠️ ID 映射未命中 ${o.length} 项:`,o),{successNum:n,failNum:r,unknownIds:o}}class cs{shouldNotify(e){return e?.notify!==false}buildErrorFeedback(e,n){if(!n)return {summary:e,toast:`${e}，请稍后重试`};const r=`${e}：${_o(n)}`,o=To(n);return {summary:r,toast:`${e}，${o}`}}failBooleanTask(e,n,r=true){const o=this.buildErrorFeedback(e,n);return l.error(`❌ ${o.summary}`,n),r&&N(o.toast,"error"),false}failSyncResult(e,n,r=true){const o=this.buildErrorFeedback(e,n);return l.error(`❌ ${o.summary}`,n),r&&N(o.toast,"error"),{success:0,failed:1,errors:n?[o.summary]:[e]}}failBatchSyncResult(e,n,r=true){const o=this.buildErrorFeedback(e,n);return l.error(`❌ ${o.summary}`,n),r&&N(o.toast,"error"),{success:0,failed:1,errors:n?[o.summary]:[e],total:0,details:[]}}failItemsSyncResult(e,n,r=true){const o=this.buildErrorFeedback(e,n);return l.error(`❌ ${o.summary}`,n),r&&N(o.toast,"error"),{success:false,partial:false,successNum:0,failNum:0}}async executeBooleanTask(e,n,r=true){try{return await e()}catch(o){return this.failBooleanTask(n,o,r)}}async executeSyncResultTask(e,n,r=true){try{return await e()}catch(o){return this.failSyncResult(n,o,r)}}async executeBatchSyncTask(e,n,r=true){try{return await e()}catch(o){return this.failBatchSyncResult(n,o,r)}}async syncResinData(e){const n=this.shouldNotify(e);return this.executeBooleanTask(async()=>{l.info("🔋 开始同步电量数据...");const r=await Ci();if(!r)return this.failBooleanTask("获取游戏便笺失败",void 0,n);const o=r.energy,i=Vi(o);if(i)l.info("✅ 电量数据同步成功"),n&&N(`电量同步成功: ${o.progress.current}/${o.progress.max}`,"success");else return this.failBooleanTask("电量数据设置失败",void 0,n);return i},"电量数据同步失败",n)}async syncSingleCharacter(e,n){const r=this.shouldNotify(n);return this.executeSyncResultTask(async()=>{l.info(`👤 开始同步角色数据: ${e}`);const o=await rn([e],void 0);if(!o||o.length===0)return this.failSyncResult("获取角色详细信息失败",void 0,r);const i=o[0],s=await Ki(i);return s.success>0&&s.failed===0?(l.info(`✅ 角色 ${i.avatar.name_mi18n} 同步成功`),r&&N(`角色 ${i.avatar.name_mi18n} 同步成功`,"success")):s.success>0?(l.warn(`⚠️ 角色 ${i.avatar.name_mi18n} 同步部分成功: 成功 ${s.success}，失败 ${s.failed}`),r&&N(`角色 ${i.avatar.name_mi18n} 同步部分成功`,"warning")):(l.error(`❌ 角色 ${i.avatar.name_mi18n} 同步失败`),r&&N(`角色 ${i.avatar.name_mi18n} 同步失败`,"error")),s},`角色 ${e} 同步失败`,r)}async syncAllCharacters(e){const n=this.shouldNotify(e);return this.executeBatchSyncTask(async()=>{l.info("👥 开始同步所有角色数据...");const r=await vi();if(!r||r.length===0)return this.failBatchSyncResult("获取角色列表失败或角色列表为空",void 0,n);l.info(`📋 找到 ${r.length} 个角色`),n&&N(`开始同步 ${r.length} 个角色...`,"");const o=r.map(a=>a.avatar.id),i=await rn(o,void 0);if(!i||i.length===0)return this.failBatchSyncResult("获取角色详细信息失败",void 0,n);const s=await Qi(i);return s.success>0&&s.failed===0?(l.info(`✅ 所有角色同步完成: 成功 ${s.success}`),n&&N(`角色同步完成: 成功 ${s.success}，失败 ${s.failed}`,"success")):s.success>0?(l.warn(`⚠️ 所有角色同步完成（部分失败）: 成功 ${s.success}，失败 ${s.failed}`),n&&N(`角色同步部分完成: 成功 ${s.success}，失败 ${s.failed}`,"warning")):(l.error("❌ 角色批量同步失败"),n&&N("角色批量同步失败","error")),s},"所有角色同步失败",n)}async syncItemsData(e){const n=this.shouldNotify(e);try{l.info("🔋 开始同步养成材料数据...");const r=Ji(),o=Yi(),i=r.map(d=>({avatar_id:d.id,weapon_id:o[d.style]})),s=await es(i);if(!s)return this.failItemsSyncResult("获取养成材料数据失败",void 0,n);const a=Wi(),c=s[0]?.coin_id,u=ss(a,c);if(u.size>0){const d=is(s),f=as(d,u),g=f.successNum+f.failNum,h=g>0?f.successNum/g:0;if(l.info(`📊 ID 映射命中率: ${(h*100).toFixed(1)}% (${f.successNum}/${g})`),h>=.7)return this.buildItemsSyncResult(f.successNum,f.failNum,n,{mappedBy:"id",unknownIds:f.unknownIds});l.warn(`⚠️ ID 映射命中率过低 (${(h*100).toFixed(1)}%)，降级到名字映射`);}else l.warn("⚠️ Seelie items 中无 id/ids 字段，降级到名字映射");return await this.syncItemsByName(s,a,n)}catch(r){return this.failItemsSyncResult("养成材料同步失败",r,n)}}async syncItemsByName(e,n,r){const o=ts(e),i=ns(e,o);n.denny={type:"denny"};const s=await Di();if(!s)return this.failItemsSyncResult("获取语言数据失败（名字映射降级）",void 0,r);const a=rs(s),{successNum:c,failNum:u}=os(i,a,n);return this.buildItemsSyncResult(c,u,r,{mappedBy:"name-fallback"})}buildItemsSyncResult(e,n,r,o){const i=e>0,s=e+n,a=i&&n>0;return l.info(`📦 材料同步策略: ${o.mappedBy}`),i&&!a?(l.info(`✅ 养成材料同步成功: ${e}/${s}`),r&&N(`养成材料同步完成: 成功 ${e}，失败 ${n}`,"success"),{success:true,partial:false,successNum:e,failNum:n,...o}):i?(l.warn(`⚠️ 养成材料同步部分成功: ${e}/${s}`),r&&N(`养成材料同步部分完成: 成功 ${e}，失败 ${n}`,"warning"),{success:true,partial:true,successNum:e,failNum:n,...o}):this.failItemsSyncResult("养成材料同步失败",void 0,r)}async syncAll(){l.info("🚀 开始执行完整同步..."),N("开始执行完整同步...","");const[e,n,r]=await Promise.all([this.syncResinData({notify:true}),this.syncAllCharacters({notify:true}),this.syncItemsData({notify:true})]),o=r.success,i=r.partial,s=n.success>0&&n.failed===0,a=e&&s&&o&&!i,c=!e&&n.success===0&&!o,u=o?i?`部分完成（成功 ${r.successNum}，失败 ${r.failNum}）`:"成功":"失败",d=`电量${e?"成功":"失败"}，角色成功 ${n.success} 失败 ${n.failed}，养成材料${u}`;return a?(l.info(`✅ 完整同步完成：${d}`),N(`完整同步完成：${d}`,"success")):c?(l.error(`❌ 完整同步失败：${d}`),N("完整同步失败，请刷新登录后重试","error")):(l.warn(`⚠️ 完整同步部分完成：${d}`),N(`完整同步部分完成：${d}`,"warning")),{resinSync:e,characterSync:n,itemsSync:o,itemsPartial:i}}}const Ce=new cs,se='img[src*="please.png"]',Q="#large-leaderboard-ad, #leaderboard-target, .pw-incontent",ls='a[href*="stardb.gg/zzz/signal-tracker"]',wr="div.overflow-hidden.relative.text-white:has(#leaderboard-target)",br="div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)",us="zzz.seelie.me",$e="seelie-ad-cleaner-style",ds=["! zzz-seelie-sync 强化规则（由脚本动态生成）",'zzz.seelie.me##img[src*="img/stickers/please.png"]',"zzz.seelie.me###leaderboard-target","zzz.seelie.me###large-leaderboard-ad","zzz.seelie.me##.pw-incontent","zzz.seelie.me##div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)","zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#leaderboard-target)"],Pe=new Set([wr,br]),Be=new Set([ls]);let De=false,ae=null,Re=null,Ae=false;function Ht(){return Array.from(Be).join(", ")}function fs(){const t=Ht();return t?`${se}, ${Q}, ${t}`:`${se}, ${Q}`}function Rt(){const t=[se,Q],e=Ht();e&&t.push(e);const n=new Set(Pe);return n.add(`div.overflow-hidden.relative.text-white:has(${se})`),n.add(`div.overflow-hidden.relative.text-white:has(${Q})`),n.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${se})`),n.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${Q})`),`
${t.join(`,
`)} {
  display: none !important;
  visibility: hidden !important;
}

${Array.from(n).join(`,
`)} {
  display: none !important;
}
`}function cn(){const t=document.getElementById($e);t&&(t.textContent=Rt());}function hs(){const t=document.getElementById($e);if(t){t.textContent=Rt();return}const e=document.createElement("style");e.id=$e,e.textContent=Rt();const n=document.head||document.documentElement;if(!n){l.warn("⚠️ 去广告样式注入失败：未找到 head/documentElement");return}n.appendChild(e);}function gs(){const t=document.getElementById($e);t&&t.remove();}function ln(t){const e=t.trim();return !e||Pe.has(e)?false:(Pe.add(e),true)}function ms(t){const e=t.trim();return !e||Be.has(e)?false:(Be.add(e),true)}function un(t){let e=false;if(t.adHints.usesLegacyContainer&&(e=ln(wr)||e),t.adHints.usesModernContainer&&(e=ln(br)||e),t.adHints.signalTrackerHref){const n=t.adHints.signalTrackerHref.replace(/"/g,'\\"');e=ms(`a[href="${n}"]`)||e;}return e}function ps(){const t=Li();t&&un(t)&&cn(),Sr().then(e=>{un(e)&&(l.debug("🔄 已根据 site manifest 更新去广告规则"),cn(),Ut());}).catch(e=>{l.warn("⚠️ 获取 site manifest 失败，继续使用内置去广告规则:",e);});}function ys(t){const n=t.classList,r=t.querySelector(Q)!==null,o=n.contains("overflow-hidden")&&n.contains("relative")&&n.contains("text-white"),i=n.contains("overflow-hidden")&&n.contains("relative")&&n.contains("mx-auto")&&n.contains("shrink-0");return r||o||i}function dn(t){let e=t;for(;e&&e!==document.body;){if(ys(e))return e;e=e.parentElement;}return null}function Ss(){const t=new Set;return document.querySelectorAll(se).forEach(e=>{const n=dn(e);n&&t.add(n);}),document.querySelectorAll(Q).forEach(e=>{const n=dn(e);n&&t.add(n);}),t}function ws(){const t=new Set,e=Ht();return e&&document.querySelectorAll(e).forEach(n=>{n instanceof HTMLElement&&t.add(n);}),t}function kr(){const t=Ss(),e=ws();t.forEach(r=>{r.remove();}),e.forEach(r=>{r.remove();});const n=t.size+e.size;return n>0&&l.info(`🧹 已移除广告节点 ${n} 个（横幅: ${t.size}，Signal Tracker: ${e.size}）`),n}function Ut(){Ae||(Ae=true,queueMicrotask(()=>{Ae=false,kr();}));}function bs(t){const e=fs();return t.some(n=>{if(n.type==="attributes"){const r=n.target;return r instanceof Element?r.matches(e)||r.querySelector(e)!==null:false}return Array.from(n.addedNodes).some(r=>r instanceof Element?r.matches(e)||r.querySelector(e)!==null:false)})}function ks(){ae||!document.body||(ae=new MutationObserver(t=>{bs(t)&&Ut();}),ae.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src","class","id"]}));}function fn(){if(De||!document.body)return;De=true,kr(),ks();const{unwatch:t}=Kn(()=>{Ut();},{delay:0,immediate:true});Re=t,l.info("✅ 去广告模块已启动（manifest + fallback）");}function vs(){const t=new Set(ds);return Pe.forEach(e=>{t.add(`zzz.seelie.me##${e}`);}),Be.forEach(e=>{t.add(`zzz.seelie.me##${e}`);}),Array.from(t)}function Cs(){return vs().join(`
`)}function Es(){if(window.location.hostname!==us){l.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`);return}if(ps(),hs(),De){l.debug("去广告模块已初始化，跳过重复初始化");return}if(!document.body){window.addEventListener("DOMContentLoaded",()=>{fn();},{once:true});return}fn();}function _s(){Ae=false,ae&&(ae.disconnect(),ae=null),Re&&(Re(),Re=null),gs(),De=false,l.debug("🗑️ 去广告模块已停止");}const Ts="zzz.seelie.me",vr="seelie_ad_cleaner_enabled",hn=true;function Cr(){return window.location.hostname===Ts}function Er(){try{const t=localStorage.getItem(vr);return t===null?hn:t==="1"}catch(t){return l.warn("读取去广告开关失败，使用默认值:",t),hn}}function xs(t){try{localStorage.setItem(vr,t?"1":"0");}catch(e){l.warn("写入去广告开关失败:",e);}}function _r(t){if(t){Es();return}_s();}function Rs(){return Cr()}function As(){return Er()}function Is(t){xs(t),_r(t);}async function Ns(){const t=Cs();if(!navigator?.clipboard?.writeText)return  false;try{return await navigator.clipboard.writeText(t),!0}catch(e){return l.warn("复制 uBlock 规则失败:",e),false}}function Ls(){Cr()&&_r(Er());}const gn="ZSS-settings-style";function Tr(){if(document.getElementById(gn))return;const t=document.createElement("style");t.id=gn,t.textContent=`
/* ── 设置入口按钮 ── */
.ZSS-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 20px;
  border-radius: 6px;
  border: 1px solid #dbe1eb33;
  background: rgba(49, 50, 77, 0.55);
  color: rgb(148 156 182);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  line-height: 1;
}
.ZSS-settings-btn:hover {
  color: rgb(255 255 255);
  border-color: #dbe1eb55;
  background: rgba(72, 75, 106, 0.8);
}
.ZSS-settings-btn .ZSS-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.ZSS-settings-btn:hover .ZSS-icon {
  transform: rotate(45deg);
}

/* ── icon 尺寸通用约束 ── */
.ZSS-icon {
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
}

/* ── Modal overlay ── */
.ZSS-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  transition: background 0.25s ease, backdrop-filter 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open {
  background: rgba(7, 4, 21, 0.55);
  backdrop-filter: blur(4px);
}

/* ── Modal dialog ── */
.ZSS-modal-dialog {
  width: 100%;
  max-width: 380px;
  border-radius: 12px;
  border: 1px solid #dbe1eb33;
  background: rgb(31 30 54);
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
  overflow: hidden;
  transform: translateY(16px) scale(0.97);
  opacity: 0;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open .ZSS-modal-dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* ── Modal header ── */
.ZSS-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #dbe1eb1f;
}
.ZSS-modal-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(255 255 255);
}
.ZSS-modal-title .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgb(148 156 182);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ZSS-modal-close:hover {
  background: rgba(72, 75, 106, 0.65);
  color: rgb(255 255 255);
}
.ZSS-modal-close .ZSS-icon {
  width: 16px;
  height: 16px;
}

/* ── Modal body ── */
.ZSS-modal-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Setting card ── */
.ZSS-card {
  border-radius: 8px;
  border: 1px solid #dbe1eb26;
  background: rgba(49, 50, 77, 0.28);
  padding: 12px 14px;
}

/* ── Toggle row（带开关的设置行） ── */
.ZSS-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-toggle-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-toggle-info {
  flex: 1;
  min-width: 0;
}
.ZSS-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: rgb(255 255 255);
  line-height: 1.3;
}
.ZSS-toggle-desc {
  font-size: 11px;
  color: rgb(148 156 182);
  margin-top: 2px;
  line-height: 1.4;
}

/* ── Toggle 开关 ── */
.ZSS-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}
.ZSS-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.ZSS-switch-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgb(72 75 106);
  transition: background 0.2s ease;
}
.ZSS-switch input:checked + .ZSS-switch-track {
  background: rgb(139 92 246);
}
.ZSS-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
  transition: transform 0.2s cubic-bezier(.4,0,.2,1);
}
.ZSS-switch input:checked ~ .ZSS-switch-knob {
  transform: translateX(16px);
}

/* ── Action row（带按钮的设置行） ── */
.ZSS-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-action-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-action-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ZSS-action-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
.ZSS-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── uBlock section ── */
.ZSS-ublock-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  margin-top: 10px;
  padding: 7px 0;
}
.ZSS-ublock-copy.is-loading {
  opacity: 0.7;
  cursor: wait;
}
.ZSS-ublock-copy.is-success {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-success:hover {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-error {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy.is-error:hover {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy .ZSS-icon {
  width: 13px;
  height: 13px;
}

/* ── Modal footer ── */
.ZSS-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px;
  border-top: 1px solid #dbe1eb1f;
}
.ZSS-modal-footer-btn {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.ZSS-modal-footer-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
  `,(document.head||document.documentElement).appendChild(t);}function Ze(t){return `<span class="ZSS-icon">${t}</span>`}const Y={gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>'};function Ms(t){Tr();const e=document.createElement("button");return e.type="button",e.className="ZSS-settings-btn",e.innerHTML=`${Ze(Y.gear)}<span>设置</span>`,e.addEventListener("click",t),e}function $s(t){Tr();const e=document.createElement("div");e.className="ZSS-modal-overlay",e.setAttribute("data-seelie-settings-modal","true");const n=document.createElement("div");n.className="ZSS-modal-dialog";const r=document.createElement("div");r.className="ZSS-modal-header";const o=document.createElement("div");o.className="ZSS-modal-title",o.innerHTML=`${Ze(Y.gear)}脚本设置`;const i=document.createElement("button");i.type="button",i.className="ZSS-modal-close",i.innerHTML=Ze(Y.close),i.addEventListener("click",t.onClose),r.append(o,i);const s=document.createElement("div");s.className="ZSS-modal-body",Rs()&&s.append(Ps(t),Bs(t)),s.appendChild(Ds(t));const a=document.createElement("div");a.className="ZSS-modal-footer";const c=document.createElement("button");return c.type="button",c.className="ZSS-modal-footer-btn",c.textContent="关闭",c.addEventListener("click",t.onClose),a.appendChild(c),n.append(r,s,a),e.appendChild(n),e.addEventListener("click",u=>{u.target===e&&t.onClose();}),n.addEventListener("click",u=>u.stopPropagation()),requestAnimationFrame(()=>e.classList.add("ZSS-open")),e}function Ps(t){const e=document.createElement("div");e.className="ZSS-card";const n=document.createElement("div");n.className="ZSS-toggle-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=Y.shield;const o=document.createElement("div");o.className="ZSS-toggle-info";const i=document.createElement("div");i.className="ZSS-toggle-label",i.textContent="脚本去广告";const s=document.createElement("div");s.className="ZSS-toggle-desc",s.textContent="关闭后将停止脚本内的去广告逻辑",o.append(i,s);const a=document.createElement("label");a.className="ZSS-switch";const c=document.createElement("input");c.type="checkbox",c.checked=As(),c.addEventListener("change",()=>t.onToggleAdCleaner(c.checked));const u=document.createElement("span");u.className="ZSS-switch-track";const d=document.createElement("span");return d.className="ZSS-switch-knob",a.append(c,u,d),n.append(r,o,a),e.appendChild(n),e}function Bs(t){const e=document.createElement("div");e.className="ZSS-card";const n=document.createElement("div");n.className="ZSS-action-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=Y.filter;const o=document.createElement("div");o.className="ZSS-toggle-info";const i=document.createElement("div");i.className="ZSS-toggle-label",i.textContent="uBlock Origin 规则";const s=document.createElement("div");s.className="ZSS-toggle-desc",s.textContent="复制到「我的过滤器」，在浏览器层拦截广告",o.append(i,s);const a=document.createElement("button");a.type="button",a.className="ZSS-action-btn ZSS-ublock-copy",a.innerHTML=`${Ze(Y.copy)}<span class="ZSS-ublock-copy-text">复制规则到剪贴板</span>`;const c=a.querySelector(".ZSS-ublock-copy-text");let u=null;const d=f=>{if(a.classList.remove("is-loading","is-success","is-error"),a.disabled=false,f==="loading"){a.classList.add("is-loading"),a.disabled=true,c.textContent="复制中…";return}if(f==="success"){a.classList.add("is-success"),c.textContent="已复制";return}if(f==="error"){a.classList.add("is-error"),c.textContent="复制失败";return}c.textContent="复制规则到剪贴板";};return a.addEventListener("click",async()=>{u!==null&&(window.clearTimeout(u),u=null),d("loading");try{const f=await t.onCopyUBlockRules();d(f?"success":"error");}catch{d("error");}u=window.setTimeout(()=>{d("idle"),u=null;},1800);}),n.append(r,o),e.append(n,a),e}function Ds(t){const e=document.createElement("div");e.className="ZSS-card";const n=document.createElement("div");n.className="ZSS-action-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=Y.refresh;const o=document.createElement("div");o.className="ZSS-toggle-info";const i=document.createElement("div");i.className="ZSS-toggle-label",i.textContent="重置设备信息";const s=document.createElement("div");s.className="ZSS-toggle-desc",s.textContent="同步遇到 1034 设备异常时使用",o.append(i,s);const a=document.createElement("button");return a.type="button",a.className="ZSS-action-btn",a.textContent="重置",a.addEventListener("click",async()=>{a.disabled=true,a.textContent="重置中…";try{await t.onResetDevice();}finally{a.disabled=false,a.textContent="重置";}}),n.append(r,o,a),e.appendChild(n),e}function Zs(t){const e=String(t);return e.includes("获取用户角色失败")||e.includes("未登录")||e.includes("stoken")||e.includes("ltoken")||e.includes("e_nap_token")||e.includes("扫码登录")||e.includes("HTTP 401")||e.includes("HTTP 403")?{error:"login_required",message:"请先扫码登录"}:e.includes("未找到绝区零游戏角色")?{error:"no_character",message:"未找到绝区零游戏角色"}:e.includes("网络")||e.includes("timeout")||e.includes("fetch")?{error:"network_error",message:"网络连接失败，请重试"}:{error:"unknown",message:"用户信息加载失败"}}const Os=[{action:"resin",text:"同步电量",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>`},{action:"characters",text:"同步角色",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>`},{action:"items",text:"同步材料",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
    </svg>`},{action:"reset_device",text:"重置设备",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15M12 3v9m0 0l-3-3m3 3l3-3"></path>
    </svg>`}];function Fs(t){const e=t.total>0?t.total:t.success+t.failed;return t.success>0&&t.failed===0?{status:"success",summary:`角色同步成功（${t.success}/${e}）`}:t.success>0?{status:"partial",summary:`角色同步部分完成（成功 ${t.success}，失败 ${t.failed}）`}:{status:"failed",summary:"角色同步失败"}}function Hs(t){const{resinSync:e,characterSync:n,itemsSync:r,itemsPartial:o}=t,i=Fs(n),s=r?o?"养成材料同步部分完成":"养成材料同步成功":"养成材料同步失败",a=[e?"电量同步成功":"电量同步失败",i.summary,s];if(n.errors.length>0){const d=n.errors.slice(0,2).join("；");a.push(`角色错误摘要：${d}`);}const c=e&&i.status==="success"&&r&&!o,u=!e&&i.status==="failed"&&!r;return c?{status:"success",summary:"完整同步成功",details:a}:u?{status:"failed",summary:"完整同步失败，请检查登录状态和网络后重试",details:a}:{status:"partial",summary:`完整同步部分完成：角色成功 ${n.success}，失败 ${n.failed}，养成材料${r?o?"部分完成":"成功":"失败"}`,details:a}}function Ye(t,e,n){const r=document.createElement("button");return r.className=t,r.textContent=e,r.addEventListener("click",n),r}function Ee(t){const e=document.createElement("div");return e.className="ZSS-error-hint",e.textContent=t,e}function Us(t,e){const n=document.createElement("div");n.className="ZSS-error-container";const r=document.createElement("div");r.className="ZSS-error-icon",r.innerHTML=`
    <svg class="ZSS-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
  `;const o=document.createElement("div");return o.className="ZSS-error-message",o.textContent=t.message,n.appendChild(r),n.appendChild(o),t.error==="login_required"?(n.appendChild(Ee("请使用扫码登录完成鉴权")),e.onStartQRLogin&&n.appendChild(Ye("ZSS-action-button ZSS-action-button--login","扫码登录",e.onStartQRLogin)),n):t.error==="no_character"?(n.appendChild(Ee("请先绑定绝区零游戏角色后再扫码登录")),n):t.error==="network_error"?(n.appendChild(Ee("请检查网络或代理设置后重试，必要时刷新登录状态")),n.appendChild(Ye("ZSS-action-button ZSS-action-button--retry-network","重试",e.onRetry)),n):(n.appendChild(Ee("请先重试；若持续失败，请刷新页面并重新扫码登录。")),n.appendChild(Ye("ZSS-action-button ZSS-action-button--retry-default","重试",e.onRetry)),n)}function zs(t,e){const n=document.createElement("div");n.className="ZSS-user-section";const r=document.createElement("div");if(r.className="ZSS-user-info-text",t&&!("error"in t)){const o=document.createElement("div");o.className="ZSS-user-nickname",o.textContent=t.nickname;const i=document.createElement("div");i.className="ZSS-user-uid",i.textContent=`UID: ${t.uid}`,r.appendChild(o),r.appendChild(i);}else if(t&&"error"in t){const o=Us(t,{onRetry:e.onRetry,onStartQRLogin:e.onStartQRLogin});r.appendChild(o);}else {const o=document.createElement("div");o.className="ZSS-user-error-fallback",o.textContent="用户信息加载失败",r.appendChild(o);}return n.appendChild(r),n}function qs(t,e,n){const r=document.createElement("div");return r.className="ZSS-sync-grid",t.forEach(o=>{const i=document.createElement("button"),s=e?"ZSS-sync-option-btn--enabled":"ZSS-sync-option-btn--disabled";i.className=`ZSS-sync-option-btn ${s}`,i.disabled=!e,i.innerHTML=`${o.icon}<span class="ZSS-sync-text">${o.text}</span>`,e&&i.addEventListener("click",a=>{n.onSyncAction(o.action,a);}),r.appendChild(i);}),r}function js(t){const{isUserInfoValid:e,syncOptions:n,actions:r}=t,o=document.createElement("div");o.className="ZSS-sync-section";const i=e?"ZSS-main-sync-btn--enabled":"ZSS-main-sync-btn--disabled",s=document.createElement("button");s.className=`ZSS-main-sync-btn ${i}`,s.setAttribute("data-sync-main","true"),s.disabled=!e,s.innerHTML=`
    <svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <span class="ZSS-sync-text">${e?"同步全部":"请先登录"}</span>
  `;const a=e?"ZSS-expand-btn--enabled":"ZSS-expand-btn--disabled",c=document.createElement("button");c.className=`ZSS-expand-btn ${a}`,c.disabled=!e,c.innerHTML=`
    <span class="ZSS-expand-label">更多选项</span>
    <svg class="ZSS-icon-sm ZSS-expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `,e&&(s.addEventListener("click",()=>{r.onSyncAll(s);}),c.addEventListener("click",()=>{r.onToggleExpanded(c);}));const u=document.createElement("div");u.className="ZSS-details-container",u.style.maxHeight="0",u.style.opacity="0",u.appendChild(qs(n,e,r));const d=document.createElement("div");return d.className="ZSS-settings-wrapper",d.appendChild(Ms(()=>r.onOpenSettings())),o.appendChild(s),o.appendChild(c),o.appendChild(u),o.appendChild(d),o}var oe={},We,mn;function Gs(){return mn||(mn=1,We=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),We}var Xe={},j={},pn;function te(){if(pn)return j;pn=1;let t;const e=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return j.getSymbolSize=function(r){if(!r)throw new Error('"version" cannot be null or undefined');if(r<1||r>40)throw new Error('"version" should be in range from 1 to 40');return r*4+17},j.getSymbolTotalCodewords=function(r){return e[r]},j.getBCHDigit=function(n){let r=0;for(;n!==0;)r++,n>>>=1;return r},j.setToSJISFunction=function(r){if(typeof r!="function")throw new Error('"toSJISFunc" is not a valid function.');t=r;},j.isKanjiModeEnabled=function(){return typeof t<"u"},j.toSJIS=function(r){return t(r)},j}var et={},yn;function zt(){return yn||(yn=1,function(t){t.L={bit:1},t.M={bit:0},t.Q={bit:3},t.H={bit:2};function e(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case "l":case "low":return t.L;case "m":case "medium":return t.M;case "q":case "quartile":return t.Q;case "h":case "high":return t.H;default:throw new Error("Unknown EC Level: "+n)}}t.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},t.from=function(r,o){if(t.isValid(r))return r;try{return e(r)}catch{return o}};}(et)),et}var tt,Sn;function Vs(){if(Sn)return tt;Sn=1;function t(){this.buffer=[],this.length=0;}return t.prototype={get:function(e){const n=Math.floor(e/8);return (this.buffer[n]>>>7-e%8&1)===1},put:function(e,n){for(let r=0;r<n;r++)this.putBit((e>>>n-r-1&1)===1);},getLengthInBits:function(){return this.length},putBit:function(e){const n=Math.floor(this.length/8);this.buffer.length<=n&&this.buffer.push(0),e&&(this.buffer[n]|=128>>>this.length%8),this.length++;}},tt=t,tt}var nt,wn;function Ks(){if(wn)return nt;wn=1;function t(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e);}return t.prototype.set=function(e,n,r,o){const i=e*this.size+n;this.data[i]=r,o&&(this.reservedBit[i]=true);},t.prototype.get=function(e,n){return this.data[e*this.size+n]},t.prototype.xor=function(e,n,r){this.data[e*this.size+n]^=r;},t.prototype.isReserved=function(e,n){return this.reservedBit[e*this.size+n]},nt=t,nt}var rt={},bn;function Qs(){return bn||(bn=1,function(t){const e=te().getSymbolSize;t.getRowColCoords=function(r){if(r===1)return [];const o=Math.floor(r/7)+2,i=e(r),s=i===145?26:Math.ceil((i-13)/(2*o-2))*2,a=[i-7];for(let c=1;c<o-1;c++)a[c]=a[c-1]-s;return a.push(6),a.reverse()},t.getPositions=function(r){const o=[],i=t.getRowColCoords(r),s=i.length;for(let a=0;a<s;a++)for(let c=0;c<s;c++)a===0&&c===0||a===0&&c===s-1||a===s-1&&c===0||o.push([i[a],i[c]]);return o};}(rt)),rt}var ot={},kn;function Js(){if(kn)return ot;kn=1;const t=te().getSymbolSize,e=7;return ot.getPositions=function(r){const o=t(r);return [[0,0],[o-e,0],[0,o-e]]},ot}var it={},vn;function Ys(){return vn||(vn=1,function(t){t.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};t.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},t.from=function(o){return t.isValid(o)?parseInt(o,10):void 0},t.getPenaltyN1=function(o){const i=o.size;let s=0,a=0,c=0,u=null,d=null;for(let f=0;f<i;f++){a=c=0,u=d=null;for(let g=0;g<i;g++){let h=o.get(f,g);h===u?a++:(a>=5&&(s+=e.N1+(a-5)),u=h,a=1),h=o.get(g,f),h===d?c++:(c>=5&&(s+=e.N1+(c-5)),d=h,c=1);}a>=5&&(s+=e.N1+(a-5)),c>=5&&(s+=e.N1+(c-5));}return s},t.getPenaltyN2=function(o){const i=o.size;let s=0;for(let a=0;a<i-1;a++)for(let c=0;c<i-1;c++){const u=o.get(a,c)+o.get(a,c+1)+o.get(a+1,c)+o.get(a+1,c+1);(u===4||u===0)&&s++;}return s*e.N2},t.getPenaltyN3=function(o){const i=o.size;let s=0,a=0,c=0;for(let u=0;u<i;u++){a=c=0;for(let d=0;d<i;d++)a=a<<1&2047|o.get(u,d),d>=10&&(a===1488||a===93)&&s++,c=c<<1&2047|o.get(d,u),d>=10&&(c===1488||c===93)&&s++;}return s*e.N3},t.getPenaltyN4=function(o){let i=0;const s=o.data.length;for(let c=0;c<s;c++)i+=o.data[c];return Math.abs(Math.ceil(i*100/s/5)-10)*e.N4};function n(r,o,i){switch(r){case t.Patterns.PATTERN000:return (o+i)%2===0;case t.Patterns.PATTERN001:return o%2===0;case t.Patterns.PATTERN010:return i%3===0;case t.Patterns.PATTERN011:return (o+i)%3===0;case t.Patterns.PATTERN100:return (Math.floor(o/2)+Math.floor(i/3))%2===0;case t.Patterns.PATTERN101:return o*i%2+o*i%3===0;case t.Patterns.PATTERN110:return (o*i%2+o*i%3)%2===0;case t.Patterns.PATTERN111:return (o*i%3+(o+i)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}t.applyMask=function(o,i){const s=i.size;for(let a=0;a<s;a++)for(let c=0;c<s;c++)i.isReserved(c,a)||i.xor(c,a,n(o,c,a));},t.getBestMask=function(o,i){const s=Object.keys(t.Patterns).length;let a=0,c=1/0;for(let u=0;u<s;u++){i(u),t.applyMask(u,o);const d=t.getPenaltyN1(o)+t.getPenaltyN2(o)+t.getPenaltyN3(o)+t.getPenaltyN4(o);t.applyMask(u,o),d<c&&(c=d,a=u);}return a};}(it)),it}var _e={},Cn;function xr(){if(Cn)return _e;Cn=1;const t=zt(),e=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],n=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return _e.getBlocksCount=function(o,i){switch(i){case t.L:return e[(o-1)*4+0];case t.M:return e[(o-1)*4+1];case t.Q:return e[(o-1)*4+2];case t.H:return e[(o-1)*4+3];default:return}},_e.getTotalCodewordsCount=function(o,i){switch(i){case t.L:return n[(o-1)*4+0];case t.M:return n[(o-1)*4+1];case t.Q:return n[(o-1)*4+2];case t.H:return n[(o-1)*4+3];default:return}},_e}var st={},he={},En;function Ws(){if(En)return he;En=1;const t=new Uint8Array(512),e=new Uint8Array(256);return function(){let r=1;for(let o=0;o<255;o++)t[o]=r,e[r]=o,r<<=1,r&256&&(r^=285);for(let o=255;o<512;o++)t[o]=t[o-255];}(),he.log=function(r){if(r<1)throw new Error("log("+r+")");return e[r]},he.exp=function(r){return t[r]},he.mul=function(r,o){return r===0||o===0?0:t[e[r]+e[o]]},he}var _n;function Xs(){return _n||(_n=1,function(t){const e=Ws();t.mul=function(r,o){const i=new Uint8Array(r.length+o.length-1);for(let s=0;s<r.length;s++)for(let a=0;a<o.length;a++)i[s+a]^=e.mul(r[s],o[a]);return i},t.mod=function(r,o){let i=new Uint8Array(r);for(;i.length-o.length>=0;){const s=i[0];for(let c=0;c<o.length;c++)i[c]^=e.mul(o[c],s);let a=0;for(;a<i.length&&i[a]===0;)a++;i=i.slice(a);}return i},t.generateECPolynomial=function(r){let o=new Uint8Array([1]);for(let i=0;i<r;i++)o=t.mul(o,new Uint8Array([1,e.exp(i)]));return o};}(st)),st}var at,Tn;function ea(){if(Tn)return at;Tn=1;const t=Xs();function e(n){this.genPoly=void 0,this.degree=n,this.degree&&this.initialize(this.degree);}return e.prototype.initialize=function(r){this.degree=r,this.genPoly=t.generateECPolynomial(this.degree);},e.prototype.encode=function(r){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(r.length+this.degree);o.set(r);const i=t.mod(o,this.genPoly),s=this.degree-i.length;if(s>0){const a=new Uint8Array(this.degree);return a.set(i,s),a}return i},at=e,at}var ct={},lt={},ut={},xn;function Rr(){return xn||(xn=1,ut.isValid=function(e){return !isNaN(e)&&e>=1&&e<=40}),ut}var Z={},Rn;function Ar(){if(Rn)return Z;Rn=1;const t="[0-9]+",e="[A-Z $%*+\\-./:]+";let n="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";n=n.replace(/u/g,"\\u");const r="(?:(?![A-Z0-9 $%*+\\-./:]|"+n+`)(?:.|[\r
]))+`;Z.KANJI=new RegExp(n,"g"),Z.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),Z.BYTE=new RegExp(r,"g"),Z.NUMERIC=new RegExp(t,"g"),Z.ALPHANUMERIC=new RegExp(e,"g");const o=new RegExp("^"+n+"$"),i=new RegExp("^"+t+"$"),s=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return Z.testKanji=function(c){return o.test(c)},Z.testNumeric=function(c){return i.test(c)},Z.testAlphanumeric=function(c){return s.test(c)},Z}var An;function ne(){return An||(An=1,function(t){const e=Rr(),n=Ar();t.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},t.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},t.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},t.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},t.MIXED={bit:-1},t.getCharCountIndicator=function(i,s){if(!i.ccBits)throw new Error("Invalid mode: "+i);if(!e.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?i.ccBits[0]:s<27?i.ccBits[1]:i.ccBits[2]},t.getBestModeForData=function(i){return n.testNumeric(i)?t.NUMERIC:n.testAlphanumeric(i)?t.ALPHANUMERIC:n.testKanji(i)?t.KANJI:t.BYTE},t.toString=function(i){if(i&&i.id)return i.id;throw new Error("Invalid mode")},t.isValid=function(i){return i&&i.bit&&i.ccBits};function r(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case "numeric":return t.NUMERIC;case "alphanumeric":return t.ALPHANUMERIC;case "kanji":return t.KANJI;case "byte":return t.BYTE;default:throw new Error("Unknown mode: "+o)}}t.from=function(i,s){if(t.isValid(i))return i;try{return r(i)}catch{return s}};}(lt)),lt}var In;function ta(){return In||(In=1,function(t){const e=te(),n=xr(),r=zt(),o=ne(),i=Rr(),s=7973,a=e.getBCHDigit(s);function c(g,h,S){for(let v=1;v<=40;v++)if(h<=t.getCapacity(v,S,g))return v}function u(g,h){return o.getCharCountIndicator(g,h)+4}function d(g,h){let S=0;return g.forEach(function(v){const x=u(v.mode,h);S+=x+v.getBitsLength();}),S}function f(g,h){for(let S=1;S<=40;S++)if(d(g,S)<=t.getCapacity(S,h,o.MIXED))return S}t.from=function(h,S){return i.isValid(h)?parseInt(h,10):S},t.getCapacity=function(h,S,v){if(!i.isValid(h))throw new Error("Invalid QR Code version");typeof v>"u"&&(v=o.BYTE);const x=e.getSymbolTotalCodewords(h),m=n.getTotalCodewordsCount(h,S),I=(x-m)*8;if(v===o.MIXED)return I;const R=I-u(v,h);switch(v){case o.NUMERIC:return Math.floor(R/10*3);case o.ALPHANUMERIC:return Math.floor(R/11*2);case o.KANJI:return Math.floor(R/13);case o.BYTE:default:return Math.floor(R/8)}},t.getBestVersionForData=function(h,S){let v;const x=r.from(S,r.M);if(Array.isArray(h)){if(h.length>1)return f(h,x);if(h.length===0)return 1;v=h[0];}else v=h;return c(v.mode,v.getLength(),x)},t.getEncodedBits=function(h){if(!i.isValid(h)||h<7)throw new Error("Invalid QR Code version");let S=h<<12;for(;e.getBCHDigit(S)-a>=0;)S^=s<<e.getBCHDigit(S)-a;return h<<12|S};}(ct)),ct}var dt={},Nn;function na(){if(Nn)return dt;Nn=1;const t=te(),e=1335,n=21522,r=t.getBCHDigit(e);return dt.getEncodedBits=function(i,s){const a=i.bit<<3|s;let c=a<<10;for(;t.getBCHDigit(c)-r>=0;)c^=e<<t.getBCHDigit(c)-r;return (a<<10|c)^n},dt}var ft={},ht,Ln;function ra(){if(Ln)return ht;Ln=1;const t=ne();function e(n){this.mode=t.NUMERIC,this.data=n.toString();}return e.getBitsLength=function(r){return 10*Math.floor(r/3)+(r%3?r%3*3+1:0)},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(r){let o,i,s;for(o=0;o+3<=this.data.length;o+=3)i=this.data.substr(o,3),s=parseInt(i,10),r.put(s,10);const a=this.data.length-o;a>0&&(i=this.data.substr(o),s=parseInt(i,10),r.put(s,a*3+1));},ht=e,ht}var gt,Mn;function oa(){if(Mn)return gt;Mn=1;const t=ne(),e=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function n(r){this.mode=t.ALPHANUMERIC,this.data=r;}return n.getBitsLength=function(o){return 11*Math.floor(o/2)+6*(o%2)},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(o){let i;for(i=0;i+2<=this.data.length;i+=2){let s=e.indexOf(this.data[i])*45;s+=e.indexOf(this.data[i+1]),o.put(s,11);}this.data.length%2&&o.put(e.indexOf(this.data[i]),6);},gt=n,gt}var mt,$n;function ia(){if($n)return mt;$n=1;const t=ne();function e(n){this.mode=t.BYTE,typeof n=="string"?this.data=new TextEncoder().encode(n):this.data=new Uint8Array(n);}return e.getBitsLength=function(r){return r*8},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(n){for(let r=0,o=this.data.length;r<o;r++)n.put(this.data[r],8);},mt=e,mt}var pt,Pn;function sa(){if(Pn)return pt;Pn=1;const t=ne(),e=te();function n(r){this.mode=t.KANJI,this.data=r;}return n.getBitsLength=function(o){return o*13},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(r){let o;for(o=0;o<this.data.length;o++){let i=e.toSJIS(this.data[o]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw new Error("Invalid SJIS character: "+this.data[o]+`
Make sure your charset is UTF-8`);i=(i>>>8&255)*192+(i&255),r.put(i,13);}},pt=n,pt}var yt={exports:{}},Bn;function aa(){return Bn||(Bn=1,function(t){var e={single_source_shortest_paths:function(n,r,o){var i={},s={};s[r]=0;var a=e.PriorityQueue.make();a.push(r,0);for(var c,u,d,f,g,h,S,v,x;!a.empty();){c=a.pop(),u=c.value,f=c.cost,g=n[u]||{};for(d in g)g.hasOwnProperty(d)&&(h=g[d],S=f+h,v=s[d],x=typeof s[d]>"u",(x||v>S)&&(s[d]=S,a.push(d,S),i[d]=u));}if(typeof o<"u"&&typeof s[o]>"u"){var m=["Could not find a path from ",r," to ",o,"."].join("");throw new Error(m)}return i},extract_shortest_path_from_predecessor_list:function(n,r){for(var o=[],i=r;i;)o.push(i),n[i],i=n[i];return o.reverse(),o},find_path:function(n,r,o){var i=e.single_source_shortest_paths(n,r,o);return e.extract_shortest_path_from_predecessor_list(i,o)},PriorityQueue:{make:function(n){var r=e.PriorityQueue,o={},i;n=n||{};for(i in r)r.hasOwnProperty(i)&&(o[i]=r[i]);return o.queue=[],o.sorter=n.sorter||r.default_sorter,o},default_sorter:function(n,r){return n.cost-r.cost},push:function(n,r){var o={value:n,cost:r};this.queue.push(o),this.queue.sort(this.sorter);},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};t.exports=e;}(yt)),yt.exports}var Dn;function ca(){return Dn||(Dn=1,function(t){const e=ne(),n=ra(),r=oa(),o=ia(),i=sa(),s=Ar(),a=te(),c=aa();function u(m){return unescape(encodeURIComponent(m)).length}function d(m,I,R){const _=[];let L;for(;(L=m.exec(R))!==null;)_.push({data:L[0],index:L.index,mode:I,length:L[0].length});return _}function f(m){const I=d(s.NUMERIC,e.NUMERIC,m),R=d(s.ALPHANUMERIC,e.ALPHANUMERIC,m);let _,L;return a.isKanjiModeEnabled()?(_=d(s.BYTE,e.BYTE,m),L=d(s.KANJI,e.KANJI,m)):(_=d(s.BYTE_KANJI,e.BYTE,m),L=[]),I.concat(R,_,L).sort(function(C,k){return C.index-k.index}).map(function(C){return {data:C.data,mode:C.mode,length:C.length}})}function g(m,I){switch(I){case e.NUMERIC:return n.getBitsLength(m);case e.ALPHANUMERIC:return r.getBitsLength(m);case e.KANJI:return i.getBitsLength(m);case e.BYTE:return o.getBitsLength(m)}}function h(m){return m.reduce(function(I,R){const _=I.length-1>=0?I[I.length-1]:null;return _&&_.mode===R.mode?(I[I.length-1].data+=R.data,I):(I.push(R),I)},[])}function S(m){const I=[];for(let R=0;R<m.length;R++){const _=m[R];switch(_.mode){case e.NUMERIC:I.push([_,{data:_.data,mode:e.ALPHANUMERIC,length:_.length},{data:_.data,mode:e.BYTE,length:_.length}]);break;case e.ALPHANUMERIC:I.push([_,{data:_.data,mode:e.BYTE,length:_.length}]);break;case e.KANJI:I.push([_,{data:_.data,mode:e.BYTE,length:u(_.data)}]);break;case e.BYTE:I.push([{data:_.data,mode:e.BYTE,length:u(_.data)}]);}}return I}function v(m,I){const R={},_={start:{}};let L=["start"];for(let y=0;y<m.length;y++){const C=m[y],k=[];for(let p=0;p<C.length;p++){const T=C[p],w=""+y+p;k.push(w),R[w]={node:T,lastCount:0},_[w]={};for(let E=0;E<L.length;E++){const b=L[E];R[b]&&R[b].node.mode===T.mode?(_[b][w]=g(R[b].lastCount+T.length,T.mode)-g(R[b].lastCount,T.mode),R[b].lastCount+=T.length):(R[b]&&(R[b].lastCount=T.length),_[b][w]=g(T.length,T.mode)+4+e.getCharCountIndicator(T.mode,I));}}L=k;}for(let y=0;y<L.length;y++)_[L[y]].end=0;return {map:_,table:R}}function x(m,I){let R;const _=e.getBestModeForData(m);if(R=e.from(I,_),R!==e.BYTE&&R.bit<_.bit)throw new Error('"'+m+'" cannot be encoded with mode '+e.toString(R)+`.
 Suggested mode is: `+e.toString(_));switch(R===e.KANJI&&!a.isKanjiModeEnabled()&&(R=e.BYTE),R){case e.NUMERIC:return new n(m);case e.ALPHANUMERIC:return new r(m);case e.KANJI:return new i(m);case e.BYTE:return new o(m)}}t.fromArray=function(I){return I.reduce(function(R,_){return typeof _=="string"?R.push(x(_,null)):_.data&&R.push(x(_.data,_.mode)),R},[])},t.fromString=function(I,R){const _=f(I,a.isKanjiModeEnabled()),L=S(_),y=v(L,R),C=c.find_path(y.map,"start","end"),k=[];for(let p=1;p<C.length-1;p++)k.push(y.table[C[p]].node);return t.fromArray(h(k))},t.rawSplit=function(I){return t.fromArray(f(I,a.isKanjiModeEnabled()))};}(ft)),ft}var Zn;function la(){if(Zn)return Xe;Zn=1;const t=te(),e=zt(),n=Vs(),r=Ks(),o=Qs(),i=Js(),s=Ys(),a=xr(),c=ea(),u=ta(),d=na(),f=ne(),g=ca();function h(y,C){const k=y.size,p=i.getPositions(C);for(let T=0;T<p.length;T++){const w=p[T][0],E=p[T][1];for(let b=-1;b<=7;b++)if(!(w+b<=-1||k<=w+b))for(let A=-1;A<=7;A++)E+A<=-1||k<=E+A||(b>=0&&b<=6&&(A===0||A===6)||A>=0&&A<=6&&(b===0||b===6)||b>=2&&b<=4&&A>=2&&A<=4?y.set(w+b,E+A,true,true):y.set(w+b,E+A,false,true));}}function S(y){const C=y.size;for(let k=8;k<C-8;k++){const p=k%2===0;y.set(k,6,p,true),y.set(6,k,p,true);}}function v(y,C){const k=o.getPositions(C);for(let p=0;p<k.length;p++){const T=k[p][0],w=k[p][1];for(let E=-2;E<=2;E++)for(let b=-2;b<=2;b++)E===-2||E===2||b===-2||b===2||E===0&&b===0?y.set(T+E,w+b,true,true):y.set(T+E,w+b,false,true);}}function x(y,C){const k=y.size,p=u.getEncodedBits(C);let T,w,E;for(let b=0;b<18;b++)T=Math.floor(b/3),w=b%3+k-8-3,E=(p>>b&1)===1,y.set(T,w,E,true),y.set(w,T,E,true);}function m(y,C,k){const p=y.size,T=d.getEncodedBits(C,k);let w,E;for(w=0;w<15;w++)E=(T>>w&1)===1,w<6?y.set(w,8,E,true):w<8?y.set(w+1,8,E,true):y.set(p-15+w,8,E,true),w<8?y.set(8,p-w-1,E,true):w<9?y.set(8,15-w-1+1,E,true):y.set(8,15-w-1,E,true);y.set(p-8,8,1,true);}function I(y,C){const k=y.size;let p=-1,T=k-1,w=7,E=0;for(let b=k-1;b>0;b-=2)for(b===6&&b--;;){for(let A=0;A<2;A++)if(!y.isReserved(T,b-A)){let q=false;E<C.length&&(q=(C[E]>>>w&1)===1),y.set(T,b-A,q),w--,w===-1&&(E++,w=7);}if(T+=p,T<0||k<=T){T-=p,p=-p;break}}}function R(y,C,k){const p=new n;k.forEach(function(A){p.put(A.mode.bit,4),p.put(A.getLength(),f.getCharCountIndicator(A.mode,y)),A.write(p);});const T=t.getSymbolTotalCodewords(y),w=a.getTotalCodewordsCount(y,C),E=(T-w)*8;for(p.getLengthInBits()+4<=E&&p.put(0,4);p.getLengthInBits()%8!==0;)p.putBit(0);const b=(E-p.getLengthInBits())/8;for(let A=0;A<b;A++)p.put(A%2?17:236,8);return _(p,y,C)}function _(y,C,k){const p=t.getSymbolTotalCodewords(C),T=a.getTotalCodewordsCount(C,k),w=p-T,E=a.getBlocksCount(C,k),b=p%E,A=E-b,q=Math.floor(p/E),ue=Math.floor(w/E),Lr=ue+1,jt=q-ue,Mr=new c(jt);let je=0;const Se=new Array(E),Gt=new Array(E);let Ge=0;const $r=new Uint8Array(y.buffer);for(let re=0;re<E;re++){const Ke=re<A?ue:Lr;Se[re]=$r.slice(je,je+Ke),Gt[re]=Mr.encode(Se[re]),je+=Ke,Ge=Math.max(Ge,Ke);}const Ve=new Uint8Array(p);let Vt=0,O,F;for(O=0;O<Ge;O++)for(F=0;F<E;F++)O<Se[F].length&&(Ve[Vt++]=Se[F][O]);for(O=0;O<jt;O++)for(F=0;F<E;F++)Ve[Vt++]=Gt[F][O];return Ve}function L(y,C,k,p){let T;if(Array.isArray(y))T=g.fromArray(y);else if(typeof y=="string"){let q=C;if(!q){const ue=g.rawSplit(y);q=u.getBestVersionForData(ue,k);}T=g.fromString(y,q||40);}else throw new Error("Invalid data");const w=u.getBestVersionForData(T,k);if(!w)throw new Error("The amount of data is too big to be stored in a QR Code");if(!C)C=w;else if(C<w)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+w+`.
`);const E=R(C,k,T),b=t.getSymbolSize(C),A=new r(b);return h(A,C),S(A),v(A,C),m(A,k,0),C>=7&&x(A,C),I(A,E),isNaN(p)&&(p=s.getBestMask(A,m.bind(null,A,k))),s.applyMask(p,A),m(A,k,p),{modules:A,version:C,errorCorrectionLevel:k,maskPattern:p,segments:T}}return Xe.create=function(C,k){if(typeof C>"u"||C==="")throw new Error("No input text");let p=e.M,T,w;return typeof k<"u"&&(p=e.from(k.errorCorrectionLevel,e.M),T=u.from(k.version),w=s.from(k.maskPattern),k.toSJISFunc&&t.setToSJISFunction(k.toSJISFunc)),L(C,T,p,w)},Xe}var St={},wt={},On;function Ir(){return On||(On=1,function(t){function e(n){if(typeof n=="number"&&(n=n.toString()),typeof n!="string")throw new Error("Color should be defined as hex string");let r=n.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+n);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(i){return [i,i]}))),r.length===6&&r.push("F","F");const o=parseInt(r.join(""),16);return {r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+r.slice(0,6).join("")}}t.getOptions=function(r){r||(r={}),r.color||(r.color={});const o=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,i=r.width&&r.width>=21?r.width:void 0,s=r.scale||4;return {width:i,scale:i?4:s,margin:o,color:{dark:e(r.color.dark||"#000000ff"),light:e(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},t.getScale=function(r,o){return o.width&&o.width>=r+o.margin*2?o.width/(r+o.margin*2):o.scale},t.getImageWidth=function(r,o){const i=t.getScale(r,o);return Math.floor((r+o.margin*2)*i)},t.qrToImageData=function(r,o,i){const s=o.modules.size,a=o.modules.data,c=t.getScale(s,i),u=Math.floor((s+i.margin*2)*c),d=i.margin*c,f=[i.color.light,i.color.dark];for(let g=0;g<u;g++)for(let h=0;h<u;h++){let S=(g*u+h)*4,v=i.color.light;if(g>=d&&h>=d&&g<u-d&&h<u-d){const x=Math.floor((g-d)/c),m=Math.floor((h-d)/c);v=f[a[x*s+m]?1:0];}r[S++]=v.r,r[S++]=v.g,r[S++]=v.b,r[S]=v.a;}};}(wt)),wt}var Fn;function ua(){return Fn||(Fn=1,function(t){const e=Ir();function n(o,i,s){o.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=s,i.width=s,i.style.height=s+"px",i.style.width=s+"px";}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}t.render=function(i,s,a){let c=a,u=s;typeof c>"u"&&(!s||!s.getContext)&&(c=s,s=void 0),s||(u=r()),c=e.getOptions(c);const d=e.getImageWidth(i.modules.size,c),f=u.getContext("2d"),g=f.createImageData(d,d);return e.qrToImageData(g.data,i,c),n(f,u,d),f.putImageData(g,0,0),u},t.renderToDataURL=function(i,s,a){let c=a;typeof c>"u"&&(!s||!s.getContext)&&(c=s,s=void 0),c||(c={});const u=t.render(i,s,c),d=c.type||"image/png",f=c.rendererOpts||{};return u.toDataURL(d,f.quality)};}(St)),St}var bt={},Hn;function da(){if(Hn)return bt;Hn=1;const t=Ir();function e(o,i){const s=o.a/255,a=i+'="'+o.hex+'"';return s<1?a+" "+i+'-opacity="'+s.toFixed(2).slice(1)+'"':a}function n(o,i,s){let a=o+i;return typeof s<"u"&&(a+=" "+s),a}function r(o,i,s){let a="",c=0,u=false,d=0;for(let f=0;f<o.length;f++){const g=Math.floor(f%i),h=Math.floor(f/i);!g&&!u&&(u=true),o[f]?(d++,f>0&&g>0&&o[f-1]||(a+=u?n("M",g+s,.5+h+s):n("m",c,0),c=0,u=false),g+1<i&&o[f+1]||(a+=n("h",d),d=0)):c++;}return a}return bt.render=function(i,s,a){const c=t.getOptions(s),u=i.modules.size,d=i.modules.data,f=u+c.margin*2,g=c.color.light.a?"<path "+e(c.color.light,"fill")+' d="M0 0h'+f+"v"+f+'H0z"/>':"",h="<path "+e(c.color.dark,"stroke")+' d="'+r(d,u,c.margin)+'"/>',S='viewBox="0 0 '+f+" "+f+'"',x='<svg xmlns="http://www.w3.org/2000/svg" '+(c.width?'width="'+c.width+'" height="'+c.width+'" ':"")+S+' shape-rendering="crispEdges">'+g+h+`</svg>
`;return typeof a=="function"&&a(null,x),x},bt}var Un;function fa(){if(Un)return oe;Un=1;const t=Gs(),e=la(),n=ua(),r=da();function o(i,s,a,c,u){const d=[].slice.call(arguments,1),f=d.length,g=typeof d[f-1]=="function";if(!g&&!t())throw new Error("Callback required as last argument");if(g){if(f<2)throw new Error("Too few arguments provided");f===2?(u=a,a=s,s=c=void 0):f===3&&(s.getContext&&typeof u>"u"?(u=c,c=void 0):(u=c,c=a,a=s,s=void 0));}else {if(f<1)throw new Error("Too few arguments provided");return f===1?(a=s,s=c=void 0):f===2&&!s.getContext&&(c=a,a=s,s=void 0),new Promise(function(h,S){try{const v=e.create(a,c);h(i(v,s,c));}catch(v){S(v);}})}try{const h=e.create(a,c);u(null,i(h,s,c));}catch(h){u(h);}}return oe.create=e.create,oe.toCanvas=o.bind(null,n.render),oe.toDataURL=o.bind(null,n.renderToDataURL),oe.toString=o.bind(null,function(i,s,a){return r.render(i,a)}),oe}var ha=fa();const At=180,ga="二维码加载失败，请重试",qt={Created:"请使用 App 扫描二维码",Scanned:"已扫码，请在手机上确认",Confirmed:"登录成功，正在刷新…"},zn={qrcode:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'};function qn(t){return `<span class="ZSS-icon">${t}</span>`}function It(t){const e=t.getContext("2d");e&&(e.fillStyle="#ffffff",e.fillRect(0,0,t.width,t.height));}function ma(t){const n=Number(t.dataset.renderToken||"0")+1;return t.dataset.renderToken=String(n),n}function jn(t,e){return t.dataset.renderToken===String(e)}async function Nr(t,e){const n=ma(t.qrImage);It(t.qrImage);try{if(await ha.toCanvas(t.qrImage,e,{width:At,margin:1,errorCorrectionLevel:"L"}),!jn(t.qrImage,n))return}catch(r){if(!jn(t.qrImage,n))return;It(t.qrImage),t.statusText.textContent=ga,t.statusText.classList.remove("ZSS-qr-status--success"),l.error("二维码渲染失败:",r);}}function pa(t,e){const n=document.createElement("div");n.className="ZSS-modal-overlay",n.setAttribute("data-seelie-qr-modal","true");const r=document.createElement("div");r.className="ZSS-modal-dialog";const o=document.createElement("div");o.className="ZSS-modal-header";const i=document.createElement("div");i.className="ZSS-modal-title",i.innerHTML=`${qn(zn.qrcode)}扫码登录`;const s=document.createElement("button");s.type="button",s.className="ZSS-modal-close",s.innerHTML=qn(zn.close),s.addEventListener("click",e),o.append(i,s);const a=document.createElement("div");a.className="ZSS-modal-body",a.style.alignItems="center";const c=document.createElement("canvas");c.className="ZSS-qr-image",c.width=At,c.height=At,c.setAttribute("aria-label","扫码登录二维码"),It(c);const u=document.createElement("div");u.className="ZSS-qr-status",u.textContent=qt.Created,a.append(c,u);const d=document.createElement("div");d.className="ZSS-modal-footer";const f=document.createElement("button");f.type="button",f.className="ZSS-modal-footer-btn",f.textContent="取消",f.addEventListener("click",e),d.appendChild(f),r.append(o,a,d),n.appendChild(r),n.addEventListener("click",h=>{h.target===n&&e();}),r.addEventListener("click",h=>h.stopPropagation()),requestAnimationFrame(()=>n.classList.add("ZSS-open"));const g={overlay:n,qrImage:c,statusText:u};return Nr(g,t.url),g}function ya(t,e){t.statusText.textContent=qt[e]||e,e==="Confirmed"&&t.statusText.classList.add("ZSS-qr-status--success");}function Sa(t,e){t.statusText.textContent=qt.Created,t.statusText.classList.remove("ZSS-qr-status--success"),Nr(t,e.url);}const Gn="ZSS-panel-style",K="cubic-bezier(.4,0,.2,1)";function wa(){if(document.getElementById(Gn))return;const t=document.createElement("style");t.id=Gn,t.textContent=`
.ZSS-panel {
  width: 100%;
  margin-bottom: .75rem;
  padding: .75rem;
  background-color: rgb(31 30 54);
  border-radius: .5rem;
  border-width: 1px;
  border-style: solid;
  border-color: #dbe1eb33;
}

.ZSS-user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: .75rem;
}

.ZSS-user-info-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ZSS-user-nickname {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
}

.ZSS-user-uid {
  font-size: .75rem;
  line-height: 1rem;
  color: rgb(148 156 182);
}

.ZSS-user-error-fallback {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(251 113 133);
}

.ZSS-error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ZSS-error-icon {
  margin-bottom: .5rem;
  color: rgb(251 113 133);
}

.ZSS-error-message {
  margin-bottom: .5rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(251 113 133);
}

.ZSS-error-hint {
  margin-bottom: .5rem;
  font-size: .75rem;
  line-height: 1rem;
  text-align: center;
  color: rgb(148 156 182);
}

.ZSS-action-button {
  padding: .25rem .75rem;
  border-radius: .25rem;
  font-size: .75rem;
  line-height: 1rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${K};
  transition-duration: .2s;
}

.ZSS-action-button--login {
  background-color: rgb(2 132 199);
}

.ZSS-action-button--bind {
  background-color: rgb(124 58 237);
}

.ZSS-action-button--retry-network {
  background-color: rgb(5 150 105);
}

.ZSS-action-button--retry-default {
  background-color: rgb(72 75 106);
}

.ZSS-action-button--retry-default:hover {
  background-color: rgb(49 50 77);
}

.ZSS-sync-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ZSS-main-sync-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: .5rem;
  padding: .5rem 1.5rem;
  border-radius: .5rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${K};
  transition-duration: .2s;
}

.ZSS-main-sync-btn--enabled {
  background-color: rgb(49 50 77);
}

.ZSS-main-sync-btn--enabled:hover {
  background-color: rgb(72 75 106);
}

.ZSS-main-sync-btn--disabled {
  background-color: rgb(31 30 54);
}

.ZSS-main-sync-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .25rem 1rem;
  border-radius: .25rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${K};
  transition-duration: .2s;
}

.ZSS-expand-btn--enabled {
  background-color: rgb(72 75 106);
}

.ZSS-expand-btn--enabled:hover {
  background-color: rgb(97 104 138);
}

.ZSS-expand-btn--disabled {
  background-color: rgb(49 50 77);
}

.ZSS-expand-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-details-container {
  width: 100%;
  margin-top: .5rem;
  overflow: hidden;
  transition-property: all;
  transition-timing-function: ${K};
  transition-duration: .3s;
}

.ZSS-sync-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;
}

.ZSS-sync-option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .5rem .75rem;
  border-radius: .25rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${K};
  transition-duration: .2s;
}

.ZSS-sync-option-btn--enabled {
  background-color: rgb(72 75 106);
}

.ZSS-sync-option-btn--enabled:hover {
  background-color: rgb(97 104 138);
}

.ZSS-sync-option-btn--disabled {
  background-color: rgb(49 50 77);
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-sync-option-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-settings-wrapper {
  display: flex;
  justify-content: center;
  margin-top: .5rem;
}

.ZSS-sync-state-success {
  background-color: rgb(5 150 105);
}

.ZSS-sync-state-success:hover {
  background-color: rgb(5 150 105);
}

.ZSS-sync-state-warning {
  background-color: transparent;
}

.ZSS-sync-state-warning:hover {
  background-color: transparent;
}

.ZSS-sync-state-error {
  background-color: rgb(225 29 72);
}

.ZSS-sync-state-error:hover {
  background-color: rgb(225 29 72);
}

.ZSS-expand-label {
  margin-right: .25rem;
  font-size: .75rem;
  line-height: 1rem;
}

.ZSS-expand-icon {
  transition-property: transform;
  transition-timing-function: ${K};
  transition-duration: .2s;
}

.ZSS-icon-sm {
  width: .75rem;
  height: .75rem;
}

.ZSS-icon-md {
  width: 1rem;
  height: 1rem;
}

.ZSS-icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.ZSS-mr-2 {
  margin-right: .5rem;
}

.ZSS-animate-spin {
  animation: ZSS-spin 1s linear infinite;
}

@keyframes ZSS-spin {
  to {
    transform: rotate(360deg);
  }
}

.ZSS-mt-2 {
  margin-top: .5rem;
}

.ZSS-qr-image {
  width: 180px;
  height: 180px;
  border-radius: .5rem;
  background-color: rgb(255 255 255);
  display: block;
  box-sizing: border-box;
  object-fit: contain;
  image-rendering: pixelated;
  margin-bottom: .75rem;
}

.ZSS-qr-status {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(148 156 182);
  margin-bottom: .5rem;
  text-align: center;
  transition: color .2s ${K};
}

.ZSS-qr-status--success {
  color: rgb(52 211 153);
}

  `,(document.head||document.documentElement).appendChild(t);}class J{container=null;userInfo=null;isLoading=false;isExpanded=false;settingsModal=null;settingsModalKeydownHandler=null;qrLoginCancelFn=null;qrLoginModal=null;qrLoginKeydownHandler=null;qrLoginGeneration=0;static TARGET_SELECTOR="div.flex.flex-col.items-center.justify-center.w-full.mt-3";static PANEL_SELECTOR='[data-seelie-panel="true"]';constructor(){}async init(){try{await this.createPanel();}catch(e){throw l.error("初始化 Seelie 面板失败:",e),e}}async createPanel(){const e=document.querySelector(J.TARGET_SELECTOR);if(!e)throw new Error("目标容器未找到");const n=e.querySelector(J.PANEL_SELECTOR);if(n&&(n.remove(),l.debug("清理了目标容器中的旧面板")),this.container&&e.contains(this.container)){l.debug("面板已存在，跳过创建");return}await this.loadUserInfo(),this.container=this.createPanelElement(),e.insertBefore(this.container,e.firstChild),l.info("✅ Seelie 面板创建成功");}async loadUserInfo(){try{this.userInfo=await mr(),l.debug("用户信息加载成功:",this.userInfo);}catch(e){l.error("加载用户信息失败:",e),N("用户信息加载失败，部分同步功能可能不可用","warning"),this.userInfo=Zs(e);}}createPanelElement(){wa();const e=document.createElement("div");e.className="ZSS-panel",e.setAttribute("data-seelie-panel","true");const n=zs(this.userInfo,{onRetry:()=>this.refreshUserInfo(),onStartQRLogin:()=>this.startQRLogin()}),r=this.createSyncSection();return e.appendChild(n),e.appendChild(r),e}openSettingsModal(){if(!this.container||this.settingsModal)return;const e=$s({onToggleAdCleaner:n=>{Is(n),N(`脚本去广告已${n?"开启":"关闭"}，如未生效可刷新页面`,"success");},onCopyUBlockRules:async()=>Ns(),onResetDevice:()=>this.handleResetDeviceInfo(),onClose:()=>this.closeSettingsModal()});this.settingsModal=e,document.body.appendChild(e),this.settingsModalKeydownHandler=n=>{n.key==="Escape"&&this.closeSettingsModal();},window.addEventListener("keydown",this.settingsModalKeydownHandler);}closeSettingsModal(){if(this.settingsModal){this.settingsModal.classList.remove("ZSS-open");const e=this.settingsModal;setTimeout(()=>e.remove(),300),this.settingsModal=null;}this.settingsModalKeydownHandler&&(window.removeEventListener("keydown",this.settingsModalKeydownHandler),this.settingsModalKeydownHandler=null);}async startQRLogin(){if(!this.container)return;this.cancelQRLogin();const e=++this.qrLoginGeneration;try{const n=await hr();if(this.qrLoginGeneration!==e||!this.container)return;const r=pa(n,()=>{this.cancelQRLogin(),this.refreshUserInfo();});this.qrLoginModal=r.overlay,document.body.appendChild(this.qrLoginModal),this.qrLoginKeydownHandler=o=>{o.key==="Escape"&&(this.cancelQRLogin(),this.refreshUserInfo());},window.addEventListener("keydown",this.qrLoginKeydownHandler),this.qrLoginCancelFn=ui(n.ticket,{onStatusChange:o=>{ya(r,o),o==="Scanned"&&l.info("扫码登录：用户已扫码，等待确认");},onQRExpired:o=>{Sa(r,o),l.info("扫码登录：二维码已过期，已自动刷新"),N("二维码已过期，已自动刷新","warning");},onComplete:o=>{this.qrLoginCancelFn=null,this.closeQRLoginModal(),l.info("扫码登录成功，刷新面板"),N("登录成功","success"),mi(o),this.refreshUserInfo();},onError:o=>{this.qrLoginCancelFn=null,this.closeQRLoginModal(),l.error("扫码登录失败:",o),N("扫码登录失败，请重试","error"),this.refreshUserInfo();}});}catch(n){l.error("启动扫码登录失败:",n),N("无法创建二维码，请重试","error");}}closeQRLoginModal(){if(this.qrLoginModal){this.qrLoginModal.classList.remove("ZSS-open");const e=this.qrLoginModal;setTimeout(()=>e.remove(),300),this.qrLoginModal=null;}this.qrLoginKeydownHandler&&(window.removeEventListener("keydown",this.qrLoginKeydownHandler),this.qrLoginKeydownHandler=null);}cancelQRLogin(){this.qrLoginCancelFn&&(this.qrLoginCancelFn(),this.qrLoginCancelFn=null),this.closeQRLoginModal();}createSyncSection(){const e=!!this.userInfo&&!("error"in this.userInfo),n={resin:r=>this.handleSyncResin(r),characters:r=>this.handleSyncCharacters(r),items:r=>this.handleSyncItems(r),reset_device:r=>this.handleResetDeviceInfo(r)};return js({isUserInfoValid:e,syncOptions:Os,actions:{onSyncAll:r=>this.handleSyncAll(r),onToggleExpanded:r=>this.toggleExpanded(r),onSyncAction:(r,o)=>n[r](o),onOpenSettings:()=>this.openSettingsModal()}})}toggleExpanded(e){if(this.isLoading)return;this.isExpanded=!this.isExpanded;const n=this.container?.querySelector(".ZSS-details-container"),r=e.querySelector(".ZSS-expand-icon");!n||!r||(this.isExpanded?(n.style.maxHeight="200px",n.style.opacity="1",r.style.transform="rotate(180deg)"):(n.style.maxHeight="0",n.style.opacity="0",r.style.transform="rotate(0deg)"));}async handleSyncAll(e){this.isLoading||!e&&(e=this.container?.querySelector('[data-sync-main="true"]'),!e)||await this.performSyncOperation(e,"同步中...",async()=>this.performSync());}async handleSyncResin(e){await this.handleSyncActionFromEvent(e,"同步中...","同步电量数据",async()=>{const n=await Ce.syncResinData();return {status:n?"success":"error",message:n?"电量同步完成":"电量同步失败"}});}async handleSyncCharacters(e){await this.handleSyncActionFromEvent(e,"同步中...","同步角色数据",async()=>{const n=await Ce.syncAllCharacters();return n.success===0?{status:"error",message:"角色同步失败"}:n.failed>0?{status:"warning",message:`角色同步部分完成：成功 ${n.success}，失败 ${n.failed}`}:{status:"success",message:`角色同步完成：成功 ${n.success}`}});}async handleSyncItems(e){await this.handleSyncActionFromEvent(e,"同步中...","同步材料数据",async()=>{const n=await Ce.syncItemsData();return n.success?n.partial?{status:"warning",message:`养成材料同步部分完成：成功 ${n.successNum}，失败 ${n.failNum}`}:{status:"success",message:`养成材料同步完成：成功 ${n.successNum}，失败 ${n.failNum}`}:{status:"error",message:"养成材料同步失败"}});}async handleResetDeviceInfo(e){if(!e){try{await nn(),N("设备信息已重置","success"),l.info("设备信息重置完成");}catch(n){N("设备信息重置失败","error"),l.error("设备信息重置失败:",n);}return}await this.handleSyncActionFromEvent(e,"重置中...","重置设备信息",async()=>{try{return await nn(),N("设备信息已重置","success"),{status:"success",message:"设备信息重置完成"}}catch(n){return N("设备信息重置失败","error"),l.error("设备信息重置失败:",n),{status:"error",message:"设备信息重置失败"}}});}async performSyncOperation(e,n,r){if(this.isLoading)return;this.isLoading=true;const o=e.querySelector(".ZSS-sync-text");if(!o){this.isLoading=false;return}const i=o.textContent;try{this.setAllButtonsDisabled(!0),o.textContent=n;const s=e.querySelector("svg");s&&s.classList.add("ZSS-animate-spin");const a=await r();a.status==="success"?l.info(a.message):(a.status,l.warn(a.message)),this.showSyncResult(e,o,i,s,a.status);}catch(s){l.error("同步失败:",s);const a=e.querySelector("svg");this.showSyncResult(e,o,i,a,"error");}}getButtonFromEvent(e){return e?.target?.closest("button")||null}async handleSyncActionFromEvent(e,n,r,o){const i=this.getButtonFromEvent(e);i&&await this.performSyncOperation(i,n,async()=>{const s=await o();return s.status==="warning"&&l.warn(`${r}部分完成`),s});}async performSync(){try{l.info("开始执行完整同步...");const e=await Ce.syncAll(),n=Hs(e),r={summary:n.summary,detail:n.details};return n.status==="success"?(l.info("完整同步成功",r),{status:"success",message:n.summary}):n.status==="partial"?(l.warn("完整同步部分完成",r),{status:"warning",message:n.summary}):(l.error("完整同步失败",r),{status:"error",message:n.summary})}catch(e){return l.error("同步操作失败:",e),{status:"error",message:"同步失败，请稍后重试"}}}setAllButtonsDisabled(e){if(!this.container)return;this.container.querySelectorAll("button").forEach(r=>{r.disabled=e;});}showSyncResult(e,n,r,o,i){const s={success:"同步完成",warning:"部分完成",error:"同步失败"},a={success:"ZSS-sync-state-success",warning:"ZSS-sync-state-warning",error:"ZSS-sync-state-error"},c=Object.values(a),u=a[i];n.textContent=s[i],e.classList.remove(...c),e.classList.add(u),setTimeout(()=>{n.textContent=r||"同步全部",e.classList.remove(u),o&&o.classList.remove("ZSS-animate-spin"),this.setAllButtonsDisabled(false),this.isLoading=false;},2e3);}destroy(){this.closeSettingsModal(),this.cancelQRLogin(),this.closeQRLoginModal(),this.container&&this.container.parentNode&&(this.container.parentNode.removeChild(this.container),this.container=null),document.querySelectorAll(J.PANEL_SELECTOR).forEach(n=>{n.parentNode&&n.parentNode.removeChild(n);}),l.debug("Seelie 面板已销毁");}async refresh(){await this.refreshUserInfo();}async refreshUserInfo(){try{if(!this.container)return;this.cancelQRLogin(),await this.loadUserInfo();const e=this.createPanelElement();this.container.replaceWith(e),this.container=e;}catch(e){l.error("刷新用户信息失败:",e);}}}function ba(){const t={id:"seelie-panel",targetSelector:J.TARGET_SELECTOR,componentSelector:J.PANEL_SELECTOR};vt.register(t,()=>new J),l.debug("📝 Seelie 面板组件注册完成");}function ka(){l.info("🎯 开始注册所有组件"),ba(),l.info("✅ 所有组件注册完成");}function va(){l.info("🎯 zzz-seelie-sync 脚本已加载"),Ls(),Ca(()=>{Ea();});}function Ca(t){if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",t,{once:true});return}t();}function Ea(){try{if(vt.isInit()){l.debug("DOM 注入管理器已初始化，跳过");return}ka(),vt.init(),l.info("✅ DOM 注入管理器初始化完成");}catch(t){l.error("❌ 初始化 DOM 注入管理器失败:",t);}}function _a(){if(typeof window>"u")return;const t=false;Reflect.set(window,"__ZSS_DEV__",t),Reflect.set(window,"isZssDevEnvironment",()=>t);}_a();va();

})();