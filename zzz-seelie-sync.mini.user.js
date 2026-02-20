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
// @downloadURL  https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.mini.user.js
// @updateURL    https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.mini.meta.js
// @match        https://zzz.seelie.me/*
// @match        https://do-not-exist.mihoyo.com/
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

  class vt{prefix;timestamp;showLocation;colors;fileColorMap=new Map;onceKeys=new Set;constructor(e={}){this.prefix=e.prefix||"[zzz-seelie-sync]",this.timestamp=e.timestamp??true,this.showLocation=e.showLocation??true,this.colors={log:"#333333",info:"#2196F3",warn:"#FF9800",error:"#F44336",debug:"#9C27B0",...e.colors};}generateRandomColor(){const e=["#E91E63","#9C27B0","#673AB7","#3F51B5","#2196F3","#03A9F4","#00BCD4","#009688","#4CAF50","#8BC34A","#CDDC39","#FFC107","#FF9800","#FF5722","#795548","#607D8B","#E53935","#D81B60","#8E24AA","#5E35B1"];return e[Math.floor(Math.random()*e.length)]}getFileColor(e){return this.fileColorMap.has(e)||this.fileColorMap.set(e,this.generateRandomColor()),this.fileColorMap.get(e)}getLocationInfo(){try{const e=new Error().stack;if(!e)return null;const t=e.split(`
`);for(let r=3;r<Math.min(t.length,8);r++){const o=t[r];if(!o||o.includes("Logger.")||o.includes("formatMessage")||o.includes("getLocationInfo"))continue;const s=[/at.*?\((.+):(\d+):(\d+)\)/,/at\s+(.+):(\d+):(\d+)/,/@(.+):(\d+):(\d+)/,/(.+):(\d+):(\d+)$/];for(const i of s){const a=o.match(i);if(a){const l=a[1],f=parseInt(a[2],10),u=parseInt(a[3],10);if(!l||l.includes("chrome-extension://")||l.includes("moz-extension://"))continue;const d=l.split("/").pop()||l.split("\\").pop()||l;if(d&&!isNaN(f)&&!isNaN(u))return {fileName:d,lineNumber:f,columnNumber:u}}}}return null}catch{return null}}formatMessage(e,t,...r){const o=this.timestamp?`[${new Date().toLocaleTimeString()}]`:"",s=this.showLocation?this.getLocationInfo():null;let i=`${o} ${this.prefix} [${e.toUpperCase()}]`,a="",l="";return s&&(a=` [${s.fileName}:${s.lineNumber}]`,l=this.getFileColor(s.fileName)),typeof window<"u"?s?[`%c${i}%c${a}`,`color: ${t}; font-weight: bold;`,`color: ${l}; font-weight: bold; font-style: italic;`,...r]:[`%c${i}`,`color: ${t}; font-weight: bold;`,...r]:[i+a,...r]}log(...e){console.log(...this.formatMessage("log",this.colors.log,...e));}info(...e){console.info(...this.formatMessage("info",this.colors.info,...e));}warn(...e){console.warn(...this.formatMessage("warn",this.colors.warn,...e));}warnOnce(e,...t){this.onceKeys.has(e)||(this.onceKeys.add(e),this.warn(...t));}error(...e){console.error(...this.formatMessage("error",this.colors.error,...e));}debug(...e){}table(e,t){(this.timestamp||this.prefix)&&this.info("Table data:"),console.table(e,t);}group(e){const t=e?this.formatMessage("group",this.colors.info,e)[2]:void 0;console.group(t);}groupCollapsed(e){const t=e?this.formatMessage("group",this.colors.info,e)[2]:void 0;console.groupCollapsed(t);}groupEnd(){console.groupEnd();}time(e){console.time(e);}timeEnd(e){console.timeEnd(e);}clear(){console.clear();}createChild(e,t){const r=new vt({prefix:`${this.prefix}:${e}`,timestamp:this.timestamp,showLocation:this.showLocation,colors:this.colors,...t});return r.fileColorMap=this.fileColorMap,r.onceKeys=this.onceKeys,r}}const c=new vt({prefix:"[Seelie]",timestamp:true,showLocation:true,colors:{log:"#4CAF50",info:"#2196F3",warn:"#FF9800",error:"#F44336",debug:"#9C27B0"}});c.log.bind(c);c.info.bind(c);c.warn.bind(c);c.error.bind(c);let ye=[],te=null,we=false,He=false,he=false;function gr(n){if(!n||typeof n!="object")return  false;const e=n;return typeof e.afterEach=="function"&&typeof e.beforeEach=="function"&&typeof e.push=="function"}function ht(){const n=document.querySelector("#app");if(!n?.__vue_app__)return He||(c.debug("🔍 未找到 Vue App 实例，可能还在加载中..."),He=true),null;He=false,c.debug("🔍 查找 Vue Router 实例...");const e=n.__vue_app__.config?.globalProperties?.$router;if(e&&typeof e.afterEach=="function"&&typeof e.beforeEach=="function"&&typeof e.push=="function")return c.info("✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例"),c.debug("Router 实例:",e),he=false,e;const t=n.__vue_app__._context;if(t?.provides){c.debug("🔍 尝试从 provides 查找 Router...");const r=t.provides,o=Object.getOwnPropertySymbols(r);for(const s of o){const i=r[s];if(gr(i))return c.info("✓ 从 provides 找到 Router 实例:",s.toString()),c.debug("Router 实例:",i),he=false,i}}return he||(c.debug("🔍 未找到 Vue Router 实例，可能还在初始化中..."),he=true),null}function Dt(){te&&(te.disconnect(),te=null),we=false;}function mr(){we||te||(c.debug("👀 启动 Vue Router 观察器..."),we=true,te=new MutationObserver(()=>{const e=ht();e&&(c.info("✓ Vue Router 已加载，处理待注册的 Hook..."),Dt(),Bt(e));}),te.observe(document.querySelector("#app"),{childList:false,subtree:false,attributes:true}),setTimeout(()=>{we&&(c.warn("⚠️ Vue Router 观察器超时，停止观察"),Dt(),Bt(null));},3e3));}function Bt(n){c.debug(`🔄 处理 ${ye.length} 个待注册的 Hook...`);const e=[...ye];ye=[],e.forEach(({callback:t,options:r,unwatchRef:o})=>{if(n){const{unwatch:s}=Mn(n,t,r);o.current=s;}else c.warn("⚠️ Vue Router 未找到，Hook 注册失败"),o.current=()=>{};});}function Mn(n,e,t){const{delay:r=100,immediate:o=false}=t;o&&setTimeout(()=>{const i=n.currentRoute?.value||n.currentRoute;e(i,null);},r);const s=n.afterEach((i,a)=>{c.debug("🔄 路由变化检测到:",a?.path,"->",i?.path),setTimeout(()=>{e(i,a);},r);});return {router:n,unwatch:s,getCurrentRoute:()=>n.currentRoute?.value||n.currentRoute}}function $n(n,e={}){c.debug("🚦 设置路由监听 Hook...");const t=ht();if(t)return c.debug("✓ Vue Router 已存在，直接注册 Hook"),Mn(t,n,e);c.debug("⏳ Vue Router 未找到，设置延迟注册...");const r={current:null};return ye.push({callback:n,options:e,unwatchRef:r}),mr(),{router:null,unwatch:()=>{r.current&&r.current();},getCurrentRoute:()=>{const o=ht();if(o)return o.currentRoute?.value||o.currentRoute}}}class pr{component=null;config;factory;isCreating=false;createPromise=null;constructor(e,t){this.config=e,this.factory=t;}checkExistence(){const e=document.querySelector(this.config.targetSelector);return e?e.querySelector(this.config.componentSelector)!==null:false}checkCondition(){if(!(document.querySelector(this.config.targetSelector)!==null)||this.config.condition&&!this.config.condition())return  false;if(this.config.routePattern){const t=window.location.pathname;return typeof this.config.routePattern=="string"?t.includes(this.config.routePattern):this.config.routePattern.test(t)}return  true}async tryCreate(){if(this.isCreating&&this.createPromise){c.debug(`⏳ [${this.config.id}] 组件正在创建中，等待完成`),await this.createPromise;return}if(!this.checkCondition()){c.debug(`🚫 [${this.config.id}] 条件不满足，跳过创建`);return}if(this.checkExistence()){c.debug(`✅ [${this.config.id}] 组件已存在，跳过创建`);return}this.createPromise=this.createComponent(),await this.createPromise;}async createComponent(){if(this.isCreating){c.debug(`⏳ [${this.config.id}] 组件已在创建中，跳过重复创建`);return}this.isCreating=true;try{if(this.checkExistence()){c.debug(`✅ [${this.config.id}] 组件已存在，取消创建`);return}this.destroyComponent(),this.component=await this.factory(),await this.component.init(),c.debug(`✅ [${this.config.id}] 组件创建成功`);}catch(e){c.error(`❌ [${this.config.id}] 创建组件失败:`,e),this.component=null;}finally{this.isCreating=false,this.createPromise=null;}}async checkAndRecreate(){if(this.isCreating){c.debug(`⏳ [${this.config.id}] 组件正在创建中，跳过检查`);return}const e=this.checkCondition(),t=this.checkExistence();e&&!t?(c.debug(`🔧 [${this.config.id}] 组件缺失，重新创建组件`),await this.tryCreate()):!e&&t&&(c.debug(`🗑️ [${this.config.id}] 条件不满足，销毁组件`),this.destroyComponent());}destroyComponent(){if(this.isCreating&&this.createPromise){c.debug(`⏳ [${this.config.id}] 等待创建完成后销毁`),this.createPromise.then(()=>{this.component&&(this.component.destroy(),this.component=null,c.debug(`🗑️ [${this.config.id}] 组件已销毁（延迟）`));});return}this.component&&(this.component.destroy(),this.component=null,c.debug(`🗑️ [${this.config.id}] 组件已销毁`));}async refreshComponent(){this.component&&this.component.refresh&&(await this.component.refresh(),c.debug(`🔄 [${this.config.id}] 组件已刷新`));}async handleRouteChange(e,t){await this.checkAndRecreate();}async handleDOMChange(e){await this.checkAndRecreate();}cleanup(){this.isCreating=false,this.createPromise=null,this.destroyComponent();}getComponent(){return this.component}hasComponent(){return this.component!==null&&this.checkExistence()}isCreatingComponent(){return this.isCreating}getConfig(){return this.config}}class yr{injectors=new Map;domObserver=null;routerUnwatch=null;isInitialized=false;options;constructor(e={}){this.options={observerConfig:{childList:true,subtree:true},enableGlobalRouterWatch:true,routerDelay:100,...e};}register(e,t){this.injectors.has(e.id)&&(c.warn(`⚠️ 注入器 [${e.id}] 已存在，将被覆盖`),this.unregister(e.id));const r=new pr(e,t);return this.injectors.set(e.id,r),c.debug(`📝 注册组件注入器: [${e.id}]`),this.isInitialized&&r.tryCreate(),r}unregister(e){const t=this.injectors.get(e);return t?(t.cleanup(),this.injectors.delete(e),c.debug(`🗑️ 注销组件注入器: [${e}]`),true):false}getInjector(e){return this.injectors.get(e)||null}init(){if(this.isInitialized){c.warn("⚠️ DOM 注入管理器已经初始化");return}c.debug("🎯 初始化 DOM 注入管理器"),this.options.enableGlobalRouterWatch&&this.setupGlobalRouterWatcher(),this.setupDOMObserver(),this.createAllComponents(),this.isInitialized=true;}setupGlobalRouterWatcher(){const{unwatch:e}=$n(async(t,r)=>{c.debug("🔄 全局路由变化检测到:",r?.path,"->",t?.path),await this.handleGlobalRouteChange(t,r);},{delay:this.options.routerDelay,immediate:false});this.routerUnwatch=e,c.debug("✅ 全局路由监听设置完成");}setupDOMObserver(){let e=null,t=false,r=[],o=0;const s=3e3;this.domObserver=new MutationObserver(async i=>{r.push(...i),e&&clearTimeout(e),e=setTimeout(async()=>{if(t){c.debug("🔍 DOM 变化处理中，跳过本次处理");return}t=true;const a=[...r];r=[];try{const l=Date.now();l-o>=s&&(o=l,c.debug(`🔍 检测到 ${a.length} 个 DOM 变化，通知所有组件`)),await this.handleGlobalDOMChange(a);}finally{t=false,e=null;}},100);}),this.domObserver.observe(document.body,this.options.observerConfig),c.debug("✅ DOM 观察器设置完成");}async handleGlobalRouteChange(e,t){const r=Array.from(this.injectors.values()).map(o=>o.handleRouteChange(e,t));await Promise.allSettled(r);}async handleGlobalDOMChange(e){const t=Array.from(this.injectors.values()).map(r=>r.handleDOMChange(e));await Promise.allSettled(t);}async createAllComponents(){const e=Array.from(this.injectors.values()).map(t=>t.tryCreate());await Promise.allSettled(e);}async refreshAllComponents(){const e=Array.from(this.injectors.values()).map(t=>t.refreshComponent());await Promise.allSettled(e);}async refreshComponent(e){const t=this.injectors.get(e);t&&await t.refreshComponent();}destroy(){c.debug("🗑️ 销毁 DOM 注入管理器");for(const e of this.injectors.values())e.cleanup();this.injectors.clear(),this.routerUnwatch&&(this.routerUnwatch(),this.routerUnwatch=null),this.domObserver&&(this.domObserver.disconnect(),this.domObserver=null),this.isInitialized=false;}getInjectorIds(){return Array.from(this.injectors.keys())}getInjectorCount(){return this.injectors.size}isInit(){return this.isInitialized}}const gt=new yr({enableGlobalRouterWatch:true,routerDelay:200,observerConfig:{childList:true,subtree:true}});function wr(n){const e=n.trim();if(!e)return new Headers;const t=e.split(`\r
`).map(r=>{let o=r.split(":");return [o[0].trim(),o[1].trim()]});return new Headers(t)}function Sr(n,e){const t=wr(e.responseHeaders),r=typeof e.response=="string"?new Blob([e.response],{type:t.get("Content-Type")||"text/plain"}):e.response;return new Ct(r,{statusCode:e.status,statusText:e.statusText,headers:t,finalUrl:e.finalUrl,redirected:e.finalUrl===n.url})}class Ct{constructor(e,t){this.rawBody=e,this.init=t,this.body=e.stream();const{headers:r,statusCode:o,statusText:s,finalUrl:i,redirected:a}=t;this.headers=r,this.status=o,this.statusText=s,this.url=i,this.type="basic",this.redirected=a,this._bodyUsed=false;}get bodyUsed(){return this._bodyUsed}get ok(){return this.status<300}arrayBuffer(){if(this.bodyUsed)throw new TypeError("Failed to execute 'arrayBuffer' on 'Response': body stream already read");return this._bodyUsed=true,this.rawBody.arrayBuffer()}blob(){if(this.bodyUsed)throw new TypeError("Failed to execute 'blob' on 'Response': body stream already read");return this._bodyUsed=true,Promise.resolve(this.rawBody.slice(0,this.rawBody.size,this.rawBody.type))}clone(){if(this.bodyUsed)throw new TypeError("Failed to execute 'clone' on 'Response': body stream already read");return new Ct(this.rawBody,this.init)}formData(){if(this.bodyUsed)throw new TypeError("Failed to execute 'formData' on 'Response': body stream already read");return this._bodyUsed=true,this.rawBody.text().then(br)}async json(){if(this.bodyUsed)throw new TypeError("Failed to execute 'json' on 'Response': body stream already read");return this._bodyUsed=true,JSON.parse(await this.rawBody.text())}text(){if(this.bodyUsed)throw new TypeError("Failed to execute 'text' on 'Response': body stream already read");return this._bodyUsed=true,this.rawBody.text()}async bytes(){if(this.bodyUsed)throw new TypeError("Failed to execute 'bytes' on 'Response': body stream already read");return this._bodyUsed=true,new Uint8Array(await this.rawBody.arrayBuffer())}}function br(n){const e=new FormData;return n.trim().split("&").forEach(function(t){if(t){const r=t.split("="),o=r.shift()?.replace(/\+/g," "),s=r.join("=").replace(/\+/g," ");e.append(decodeURIComponent(o),decodeURIComponent(s));}}),e}async function Z(n,e){const t=new Request(n,e);let r;return e?.body&&(r=await t.text()),await Er(t,e,r)}function Er(n,e,t){return new Promise((r,o)=>{if(n.signal&&n.signal.aborted)return o(new DOMException("Aborted","AbortError"));GM.xmlHttpRequest({url:n.url,method:kr(n.method.toUpperCase()),headers:Object.fromEntries(new Headers(e?.headers).entries()),data:t,responseType:"blob",onload(s){try{r(Sr(n,s));}catch(i){o(i);}},onabort(){o(new DOMException("Aborted","AbortError"));},ontimeout(){o(new TypeError("Network request failed, timeout"));},onerror(s){o(new TypeError("Failed to fetch: "+s.finalUrl));}});})}const vr=["GET","POST","PUT","DELETE","PATCH","HEAD","TRACE","OPTIONS","CONNECT"];function Cr(n,e){return n.includes(e)}function kr(n){if(Cr(vr,n))return n;throw new Error(`unsupported http method ${n}`)}var le=typeof GM<"u"?GM:void 0;const Ln="2.85.1",Ae="https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool",xr="https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz",Tr="https://public-data-api.mihoyo.com/device-fp/api/getFp",Rr="https://api-takumi.mihoyo.com/common/badge/v1/login/info?game_biz=nap_cn&lang=zh-cn",_r="https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn",Ir="https://api-takumi.mihoyo.com/common/badge/v1/login/account",ue={Accept:"application/json","User-Agent":`Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 miHoYoBBS/${Ln}`};function Ar(){const n="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let e="";for(let t=0;t<6;t++)e+=n[Math.floor(Math.random()*n.length)];return e}function Nn(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(n){const e=Math.random()*16|0;return (n==="x"?e:e&3|8).toString(16)})}function Mr(){return $r(16)}function $r(n){const e=new Uint8Array(Math.ceil(n/2));if(typeof crypto<"u"&&crypto.getRandomValues)crypto.getRandomValues(e);else for(let r=0;r<e.length;r++)e[r]=Math.floor(Math.random()*256);return Array.from(e,r=>r.toString(16).padStart(2,"0")).join("").substring(0,n)}function Lr(n){const e={proxyStatus:0,isRoot:0,romCapacity:"512",deviceName:"Pixel5",productName:n,romRemain:"512",hostname:"db1ba5f7c000000",screenSize:"1080x2400",isTablet:0,aaid:"",model:"Pixel5",brand:"google",hardware:"windows_x86_64",deviceType:"redfin",devId:"REL",serialNumber:"unknown",sdCapacity:125943,buildTime:"1704316741000",buildUser:"cloudtest",simState:0,ramRemain:"124603",appUpdateTimeDiff:1716369357492,deviceInfo:`google/${n}/redfin:13/TQ3A.230901.001/2311.40000.5.0:user/release-keys`,vaid:"",buildType:"user",sdkVersion:"33",ui_mode:"UI_MODE_TYPE_NORMAL",isMockLocation:0,cpuType:"arm64-v8a",isAirMode:0,ringMode:2,chargeStatus:3,manufacturer:"Google",emulatorStatus:0,appMemory:"512",osVersion:"13",vendor:"unknown",accelerometer:"",sdRemain:123276,buildTags:"release-keys",packageName:"com.mihoyo.hyperion",networkType:"WiFi",oaid:"",debugStatus:1,ramCapacity:"125943",magnetometer:"",display:"TQ3A.230901.001",appInstallTimeDiff:1706444666737,packageVersion:"2.20.2",gyroscope:"",batteryStatus:85,hasKeyboard:10,board:"windows"};return JSON.stringify(e)}function Nr(n,e){const t=Ar();return {device_id:Mr(),seed_id:Nn(),seed_time:Date.now().toString(),platform:"2",device_fp:e,app_name:"bbs_cn",ext_fields:Lr(t),bbs_device_id:n}}class N extends Error{status;statusText;context;constructor(e,t,r){super(r?`${r}: HTTP ${e}: ${t}`:`HTTP ${e}: ${t}`),this.name="HttpRequestError",this.status=e,this.statusText=t,this.context=r;}}class L extends Error{retcode;apiMessage;context;constructor(e,t,r){super(r?`${r}: API Error ${e}: ${t}`:`API Error ${e}: ${t}`),this.name="ApiResponseError",this.retcode=e,this.apiMessage=t,this.context=r;}}class Ee extends Error{retcode;apiMessage;causeError;constructor(e,t,r){super(`设备指纹刷新失败，原始错误: API Error ${e}: ${t}`),this.name="DeviceFingerprintRefreshError",this.retcode=e,this.apiMessage=t,this.causeError=r;}}class ve extends Error{constructor(){super("❌ 设备指纹有误，请检查"),this.name="InvalidDeviceFingerprintError";}}function Pr(n){return n instanceof Ee?`设备指纹刷新失败（${n.retcode}）：${n.apiMessage}`:n instanceof ve?"设备指纹无效":n instanceof N?`网络请求失败（HTTP ${n.status} ${n.statusText}）`:n instanceof L?`接口返回错误（${n.retcode}）：${n.apiMessage}`:n instanceof Error&&n.message?n.message:String(n)}function Dr(n){return n instanceof Ee||n instanceof ve?"请重置设备信息后重试":n instanceof N?"请检查网络后重试":n instanceof L?"请稍后重试，必要时刷新登录":"请稍后重试"}const Pn="zzz_device_info";let D={deviceId:Nn(),deviceFp:"0000000000000",timestamp:Date.now()},se=null;async function Br(){const n=await kt();return {...ue,Referer:"https://act.mihoyo.com/","x-rpc-app_version":Ln,"x-rpc-client_type":"5","x-rpc-device_fp":n.deviceFp,"x-rpc-device_id":n.deviceId}}async function Dn(){const n=await le.cookie.list({url:"https://do-not-exist.mihoyo.com/"});if(n.length!==0)for(const t of n)t.name==="_MHYUUID"&&(c.debug("🔐 从米游社获取到UUID",t.value),D.deviceId=t.value);const e=Nr(D.deviceId,D.deviceFp);c.info(`🔐 开始获取设备指纹，设备ID: ${D.deviceId}`);try{const t=await Z(`${Tr}`,{method:"POST",headers:{...ue,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new N(t.status,t.statusText,"设备指纹获取失败");const r=await t.json();if(r.retcode!==0||r.data.code!==200)throw new L(r.retcode,r.message,"设备指纹获取失败");D.deviceFp=r.data.device_fp,D.timestamp=Date.now(),localStorage.setItem(Pn,JSON.stringify(D)),c.info("✅ 设备指纹获取成功并更新缓存");}catch(t){throw c.error("❌ 设备指纹获取失败:",t),t}}async function kt(n){if(se)return se;se=(async()=>{const t=localStorage.getItem(Pn);if(t)try{const o=JSON.parse(t);c.debug("📱 从localStorage获取设备信息:",o),D=o;}catch(o){c.warn("⚠️ 解析设备信息失败，将重新生成:",o);}let r=false;if(n===true)r=true,c.info("📱 强制刷新设备指纹");else if(n===false)r=false,c.debug("📱 跳过设备指纹刷新");else {const o=Date.now(),s=4320*60*1e3;D.deviceFp==="0000000000000"?(r=true,c.debug("📱 设备指纹为初始值，需要获取真实指纹")):o-D.timestamp>s?(r=true,c.debug("📱 设备信息超过3天，需要刷新")):c.debug("📱 设备信息仍在有效期内");}if(r)try{await Dn(),c.info("✅ 设备指纹刷新完成");}catch(o){throw c.error("❌ 设备指纹刷新失败:",o),o}return D})();const e=await se;return se=null,e}async function Me(){return await kt()}async function Zt(){c.info("🔄 开始刷新设备信息...");const n=await kt(true);c.info("✅ 设备信息刷新完成"),c.debug("设备信息详情:",n);}const $e="https://passport-api.mihoyo.com",Zr=`${$e}/account/ma-cn-session/web/verifyCookieToken`,Or=1440*60*1e3,Bn={"user-agent":"HYPContainer/1.3.3.182","x-rpc-app_id":"ddxf5dufpuyo","x-rpc-client_type":"3","content-type":"application/json"},Zn={"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) miHoYoBBS/2.102.1","x-rpc-app_version":"2.102.1","x-rpc-client_type":"5","x-requested-with":"com.mihoyo.hyperion",referer:"https://webstatic.mihoyo.com"},Ur="xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs",On=-106,ee="zzz_passport_tokens";let Ot=false;function Un(n){try{const e=JSON.parse(n);return !e||typeof e.stoken!="string"||typeof e.mid!="string"?null:{stoken:e.stoken,mid:e.mid,updatedAt:typeof e.updatedAt=="number"?e.updatedAt:Date.now(),cookieTokenUpdatedAt:typeof e.cookieTokenUpdatedAt=="number"?e.cookieTokenUpdatedAt:void 0}}catch{return null}}async function zn(){if(Ot)return;Ot=true;const n=localStorage.getItem(ee);if(!n)return;if(localStorage.removeItem(ee),await le.getValue(ee,"")){c.warn("⚠️ 检测到旧版 localStorage 通行证凭证，已清理旧存储");return}const t=Un(n);if(!t){c.warn("⚠️ 旧版 localStorage 通行证凭证无效，已清理");return}await le.setValue(ee,JSON.stringify(t)),c.info("🔐 已将通行证凭证迁移到脚本隔离存储");}async function Le(){await zn();const n=await le.getValue(ee,"");return n?Un(n):null}async function Fn(n){await zn(),await le.setValue(ee,JSON.stringify(n));}function zr(n){return n instanceof N?Ne(n.status):n instanceof L?Pe(n.retcode,n.apiMessage):false}async function Fr(n,e){const t=await Le(),r=!t||t.stoken!==n||t.mid!==e;await Fn({stoken:n,mid:e,updatedAt:Date.now(),cookieTokenUpdatedAt:r?void 0:t?.cookieTokenUpdatedAt});}async function mt(){const n=await Le();if(!n?.stoken||!n?.mid)throw new Error("未找到 stoken/mid，无法持久化 cookie_token");const e={...n,updatedAt:Date.now(),cookieTokenUpdatedAt:Date.now()};return await Fn(e),e}function Hr(n){return n.cookieTokenUpdatedAt?Date.now()-n.cookieTokenUpdatedAt<Or:false}async function qr(){const n=await Me(),e=await Z(Zr,{method:"POST",headers:{...Zn,"x-rpc-device_id":n.deviceId,"x-rpc-device_fp":n.deviceFp||"0000000000000"}});if(!e.ok){if(Ne(e.status))return  false;throw new N(e.status,e.statusText,"校验 cookie_token 失败")}const t=await e.json();if(t.retcode===0)return  true;if(t.retcode===-100||Pe(t.retcode,t.message))return  false;throw new L(t.retcode,t.message,"校验 cookie_token 失败")}async function jr(n=false){const e=await Le();if(!e?.stoken||!e?.mid)throw new Error("未找到持久化 stoken，请先扫码登录");if(!n){if(Hr(e))return e;try{if(await qr())return await mt();c.warn("⚠️ cookie_token 已失效（retcode -100），尝试使用 stoken 刷新");}catch(t){c.warn("⚠️ cookie_token 校验异常，降级为使用 stoken 刷新",t);}}return await jn(e.stoken,e.mid),await mt()}async function Hn(){const n=await Le();return !!(n?.stoken&&n?.mid)}async function Ce(n=false){await jr(n);}function Ne(n){return n===401||n===403}function Pe(n,e=""){const t=e.toLowerCase();return [-100,10001,10002,10101,-3101].includes(n)?true:t.includes("登录")||t.includes("未登录")||t.includes("token")||t.includes("cookie")}function Gr(n){const e=(p,y)=>{const w=(p&65535)+(y&65535);return (p>>16)+(y>>16)+(w>>16)<<16|w&65535},t=(p,y)=>p<<y|p>>>32-y,r=(p,y,w,b,E,$)=>e(t(e(e(y,p),e(b,$)),E),w),o=(p,y,w,b,E,$,S)=>r(y&w|~y&b,p,y,E,$,S),s=(p,y,w,b,E,$,S)=>r(y&b|w&~b,p,y,E,$,S),i=(p,y,w,b,E,$,S)=>r(y^w^b,p,y,E,$,S),a=(p,y,w,b,E,$,S)=>r(w^(y|~b),p,y,E,$,S),l=new TextEncoder().encode(n),f=(l.length+8>>6)+1,u=new Array(f*16).fill(0);for(let p=0;p<l.length;p++)u[p>>2]|=l[p]<<p%4*8;u[l.length>>2]|=128<<l.length%4*8,u[f*16-2]=l.length*8;let d=1732584193,g=-271733879,h=-1732584194,m=271733878;for(let p=0;p<u.length;p+=16){const y=d,w=g,b=h,E=m;d=o(d,g,h,m,u[p],7,-680876936),m=o(m,d,g,h,u[p+1],12,-389564586),h=o(h,m,d,g,u[p+2],17,606105819),g=o(g,h,m,d,u[p+3],22,-1044525330),d=o(d,g,h,m,u[p+4],7,-176418897),m=o(m,d,g,h,u[p+5],12,1200080426),h=o(h,m,d,g,u[p+6],17,-1473231341),g=o(g,h,m,d,u[p+7],22,-45705983),d=o(d,g,h,m,u[p+8],7,1770035416),m=o(m,d,g,h,u[p+9],12,-1958414417),h=o(h,m,d,g,u[p+10],17,-42063),g=o(g,h,m,d,u[p+11],22,-1990404162),d=o(d,g,h,m,u[p+12],7,1804603682),m=o(m,d,g,h,u[p+13],12,-40341101),h=o(h,m,d,g,u[p+14],17,-1502002290),g=o(g,h,m,d,u[p+15],22,1236535329),d=s(d,g,h,m,u[p+1],5,-165796510),m=s(m,d,g,h,u[p+6],9,-1069501632),h=s(h,m,d,g,u[p+11],14,643717713),g=s(g,h,m,d,u[p],20,-373897302),d=s(d,g,h,m,u[p+5],5,-701558691),m=s(m,d,g,h,u[p+10],9,38016083),h=s(h,m,d,g,u[p+15],14,-660478335),g=s(g,h,m,d,u[p+4],20,-405537848),d=s(d,g,h,m,u[p+9],5,568446438),m=s(m,d,g,h,u[p+14],9,-1019803690),h=s(h,m,d,g,u[p+3],14,-187363961),g=s(g,h,m,d,u[p+8],20,1163531501),d=s(d,g,h,m,u[p+13],5,-1444681467),m=s(m,d,g,h,u[p+2],9,-51403784),h=s(h,m,d,g,u[p+7],14,1735328473),g=s(g,h,m,d,u[p+12],20,-1926607734),d=i(d,g,h,m,u[p+5],4,-378558),m=i(m,d,g,h,u[p+8],11,-2022574463),h=i(h,m,d,g,u[p+11],16,1839030562),g=i(g,h,m,d,u[p+14],23,-35309556),d=i(d,g,h,m,u[p+1],4,-1530992060),m=i(m,d,g,h,u[p+4],11,1272893353),h=i(h,m,d,g,u[p+7],16,-155497632),g=i(g,h,m,d,u[p+10],23,-1094730640),d=i(d,g,h,m,u[p+13],4,681279174),m=i(m,d,g,h,u[p],11,-358537222),h=i(h,m,d,g,u[p+3],16,-722521979),g=i(g,h,m,d,u[p+6],23,76029189),d=i(d,g,h,m,u[p+9],4,-640364487),m=i(m,d,g,h,u[p+12],11,-421815835),h=i(h,m,d,g,u[p+15],16,530742520),g=i(g,h,m,d,u[p+2],23,-995338651),d=a(d,g,h,m,u[p],6,-198630844),m=a(m,d,g,h,u[p+7],10,1126891415),h=a(h,m,d,g,u[p+14],15,-1416354905),g=a(g,h,m,d,u[p+5],21,-57434055),d=a(d,g,h,m,u[p+12],6,1700485571),m=a(m,d,g,h,u[p+3],10,-1894986606),h=a(h,m,d,g,u[p+10],15,-1051523),g=a(g,h,m,d,u[p+1],21,-2054922799),d=a(d,g,h,m,u[p+8],6,1873313359),m=a(m,d,g,h,u[p+15],10,-30611744),h=a(h,m,d,g,u[p+6],15,-1560198380),g=a(g,h,m,d,u[p+13],21,1309151649),d=a(d,g,h,m,u[p+4],6,-145523070),m=a(m,d,g,h,u[p+11],10,-1120210379),h=a(h,m,d,g,u[p+2],15,718787259),g=a(g,h,m,d,u[p+9],21,-343485551),d=e(d,y),g=e(g,w),h=e(h,b),m=e(m,E);}const _=p=>{let y="";for(let w=0;w<4;w++)y+=(p>>w*8+4&15).toString(16)+(p>>w*8&15).toString(16);return y};return _(d)+_(g)+_(h)+_(m)}function Vr(n){const e=Math.floor(Date.now()/1e3),t=Math.floor(Math.random()*100001)+1e5,r=Gr(`salt=${Ur}&t=${e}&r=${t}&b=&q=${n}`);return `${e},${t},${r}`}async function qn(){const n=await Me(),e=await Z(`${$e}/account/ma-cn-passport/app/createQRLogin`,{method:"POST",headers:{...Bn,"x-rpc-device_id":n.deviceId}});if(!e.ok)throw new N(e.status,e.statusText,"创建二维码失败");const t=await e.json();if(t.retcode!==0)throw new L(t.retcode,t.message,"创建二维码失败");return c.info("✅ 创建二维码成功"),t.data}async function Kr(n){const e=await Me(),t=await Z(`${$e}/account/ma-cn-passport/app/queryQRLoginStatus`,{method:"POST",headers:{...Bn,"x-rpc-device_id":e.deviceId},body:JSON.stringify({ticket:n})});if(!t.ok)throw new N(t.status,t.statusText,"查询扫码状态失败");const r=await t.json();if(r.retcode===On)throw new L(r.retcode,r.message,"二维码已过期");if(r.retcode!==0)throw new L(r.retcode,r.message,"查询扫码状态失败");return r.data}async function jn(n,e){const t=await Me(),r=`stoken=${n}`,o=Vr(r),s=`${$e}/account/auth/api/getCookieAccountInfoBySToken?stoken=${encodeURIComponent(n)}`,i=await Z(s,{method:"GET",headers:{...Zn,"x-rpc-device_id":t.deviceId,"x-rpc-device_fp":t.deviceFp||"0000000000000",cookie:`mid=${e};stoken=${n};`,ds:o}});if(!i.ok)throw new N(i.status,i.statusText,"获取 cookie_token 失败");const a=await i.json();if(a.retcode!==0)throw new L(a.retcode,a.message,"获取 cookie_token 失败");return c.info("✅ cookie_token 获取成功"),a.data}async function Gn(){c.info("🔄 开始初始化 nap_token...");const n=async e=>{await Ce(e);const t=await Z(_r,{method:"GET",headers:{...ue}});if(!t.ok)throw new N(t.status,t.statusText,"获取用户角色失败");const r=await t.json();if(r.retcode!==0)throw new L(r.retcode,r.message,"获取用户角色失败");if(!r.data?.list||r.data.list.length===0)throw new Error("未找到绝区零游戏角色");const o=r.data.list[0];c.info(`🎮 找到角色: ${o.nickname} (UID: ${o.game_uid}, 等级: ${o.level})`);const s=await Z(Ir,{method:"POST",headers:{"Content-Type":"application/json",...ue},body:JSON.stringify({region:o.region,uid:o.game_uid,game_biz:o.game_biz})});if(!s.ok)throw new N(s.status,s.statusText,"设置 nap_token 失败");const i=await s.json();if(i.retcode!==0)throw new L(i.retcode,i.message,"设置 nap_token 失败");return o};try{const e=await n(!1);return c.info("✅ nap_token 初始化完成"),e}catch(e){if(!zr(e))throw e;c.warn("⚠️ nap_token 初始化鉴权失败，尝试刷新 cookie_token 后重试");const t=await n(true);return c.info("✅ nap_token 初始化完成"),t}}function Wr(n,e){let t=false,r=n;const o=()=>{t=true;};return (async()=>{for(;!t;){if(await Qr(1e3),t)return;try{const i=await Kr(r);if(t||(e.onStatusChange(i.status),t))return;if(i.status==="Confirmed"){const a=i.tokens?.[0]?.token,l=i.user_info?.mid;if(!a||!l){e.onError(new Error("扫码登录成功但缺少必要凭证(stoken/mid)"));return}try{if(await Fr(a,l),t||(await jn(a,l),t)||(await mt(),t))return;const f=await Gn();if(t)return;e.onComplete(f);}catch(f){if(t)return;e.onError(f);}return}}catch(i){if(t)return;if(i instanceof L&&i.retcode===On)try{const a=await qn();if(t)return;r=a.ticket,e.onQRExpired(a);}catch(a){if(t)return;e.onError(a);return}else {e.onError(i);return}}}})(),o}function Qr(n){return new Promise(e=>setTimeout(e,n))}let Vn=false,De=null;function Kn(n){De={uid:n.game_uid,nickname:n.nickname,level:n.level,region:n.region},Vn=true;}function Yr(n){if(n instanceof N)return Ne(n.status);if(n instanceof L)return Pe(n.retcode,n.apiMessage);if(n instanceof Error){const e=n.message.toLowerCase();return e.includes("登录")||e.includes("token")||e.includes("cookie")}return  false}async function Ut(){const n={...ue,Accept:"*/*",Referer:"https://act.mihoyo.com/"},e=await Z(`${Rr}&ts=${Date.now()}`,{method:"GET",headers:n});if(!e.ok)throw new N(e.status,e.statusText,"获取登录信息失败");const t=await e.json();if(t.retcode!==0)throw new L(t.retcode,t.message,"获取登录信息失败");return t}async function Jr(){if(!Vn){c.info("🔄 开始初始化 nap_token 与用户信息...");try{let n;try{n=await Ut();}catch(t){if(!await Hn()||!Yr(t))throw t;c.warn("⚠️ 现有登录态不可用，尝试使用持久化 stoken 刷新登录态"),await Gn(),await Ce(),n=await Ut();}if(!n.data?.game_uid||!n.data.region)throw c.warn("⚠️ 登录信息缺少必要字段，无法初始化用户态"),new Error("登录信息不完整，未找到绝区零角色信息");const e=n.data;c.info(`🎮 登录角色: ${e.nickname} (UID: ${e.game_uid}, 等级: ${e.level})`),Kn(e),c.info("✅ nap_token 初始化完成"),c.info(`👤 用户信息: ${e.nickname} (UID: ${e.game_uid}, 等级: ${e.level}, 区服: ${e.region})`);}catch(n){throw c.error("❌ 初始化 nap_token 失败:",n),n}}}async function xt(){De||await Jr();}function Xr(){return De}async function eo(){return await xt(),De}function to(n){if(!n.game_uid||!n.region)throw new Error("角色信息不完整，无法写入用户缓存");Kn(n),c.info(`👤 已使用角色信息更新用户缓存: ${n.nickname} (UID: ${n.game_uid})`);}async function Be(n,e,t={}){const{method:r="GET",params:o={},body:s,headers:i={}}=t;e===Ae&&await xt();let a=`${e}${n}`;if(Object.keys(o).length>0){const d=new URLSearchParams;Object.entries(o).forEach(([g,h])=>{d.append(g,String(h));}),a+=`?${d.toString()}`;}const l=[1034,5003,10035,10041,10053],f=`${r} ${n}`,u=async(d=false,g=false)=>{const m={...await Br(),...i},_=await Hn();if(m["x-rpc-device_fp"]==="0000000000000")throw new ve;c.debug(`🌐 发起请求 ${f}${d?" (重试)":""}`,{endpoint:n,baseUrl:e,isRetry:d});try{const p=[a,{method:r,headers:m,body:s?JSON.stringify(s):void 0}],y=await Z(...p);if(!y.ok){if(!g&&_&&Ne(y.status))return c.warn(`⚠️ 鉴权失败，尝试刷新 cookie_token 并重试 ${f}`,{status:y.status,statusText:y.statusText}),await Ce(!0),await u(d,!0);throw new N(y.status,y.statusText)}const w=await y.json();if(w.retcode!==0){if(l.includes(w.retcode)&&!d){c.warn(`⚠️ 设备指纹错误，准备刷新并重试 ${f}`,{retcode:w.retcode,message:w.message});try{return await Dn(),c.info(`✅ 设备指纹刷新完成，重试 ${f}`),await u(!0)}catch(b){throw c.error(`❌ 设备指纹刷新失败，无法重试 ${f}`,b),new Ee(w.retcode,w.message,b)}}if(!g&&_&&Pe(w.retcode,w.message))return c.warn(`⚠️ 业务鉴权失败，尝试刷新 cookie_token 并重试 ${f}`,{retcode:w.retcode,message:w.message}),await Ce(!0),await u(d,!0);throw c.error(`❌ 请求失败 ${f}`,{retcode:w.retcode,message:w.message,status:y.status}),new L(w.retcode,w.message)}return c.debug(`✅ 请求成功 ${f}`,{retcode:w.retcode,message:w.message,retried:d}),w}catch(p){throw p instanceof L||p instanceof N||p instanceof Ee||p instanceof ve||c.error(`❌ 请求异常 ${f}`,p),p}};return await u()}async function Ze(n,e){await xt();const t=Xr();if(t)return {uid:t.uid,region:e||t.region};throw new Error("❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社")}async function no(n,e,t){if(n.length<=e)return t(n);const r=[];for(let i=0;i<n.length;i+=e)r.push(n.slice(i,i+e));const o=r.map(i=>t(i));return (await Promise.all(o)).flat()}async function ro(n,e){const t=await Ze(n,e),o=(await Be("/user/avatar_basic_list",Ae,{method:"GET",params:{uid:t.uid,region:t.region}})).data.list.filter(s=>s.unlocked===true);return o.length===0?c.warn("⚠️ 角色基础列表为空（unlocked=0）"):c.debug(`✅ 获取角色基础列表成功: ${o.length} 个角色`),o}async function zt(n,e,t){if(n.length===0)return c.warn("⚠️ 批量角色详情请求为空，返回空列表"),[];const r=await Ze(e,t),o=typeof n[0]=="number"?n.map(i=>({avatar_id:i,is_teaser:false,teaser_need_weapon:false,teaser_sp_skill:false})):n,s=await no(o,10,async i=>(c.debug(`📦 拉取角色详情批次: ${i.length} 个`),(await Be("/user/batch_avatar_detail_v2",Ae,{method:"POST",params:{uid:r.uid,region:r.region},body:{avatar_list:i}})).data.list));return c.debug(`✅ 批量角色详情获取完成: ${s.length} 个`),s}async function oo(n,e){const t=await Ze(n,e);c.debug(`📘 获取游戏便笺: uid=${t.uid}, region=${t.region}`);const r=await Be("/note",xr,{method:"GET",params:{server:t.region,role_id:t.uid}});return c.debug("✅ 游戏便笺获取成功"),r.data}const de="https://zzz.seelie.me",Wn="seelie_site_manifest_v1",so=360*60*1e3,Qn=/\/assets\/index-([a-f0-9]+)\.js/,io=/strings-zh-([a-f0-9]+)\.js/,ao=/https:\/\/stardb\.gg\/zzz\/signal-tracker[^\s"'`)]*/,Ft={charactersStats:/stats-characters-[a-f0-9]+\.js/,weaponsStats:/stats-weapons-[a-f0-9]+\.js/,weaponsStatsCommon:/stats-weapons-common-[a-f0-9]+\.js/};let F=null,ie=null;async function Ht(n){const e=await Z(n);if(!e.ok)throw new Error(`请求失败: ${e.status} ${e.statusText} (${n})`);return await e.text()}function ke(n,e){return {...n,source:e}}function pt(){try{const n=localStorage.getItem(Wn);if(!n)return null;const e=JSON.parse(n);return typeof e!="object"||e===null||typeof e.fetchedAt!="number"||typeof e.indexScriptPath!="string"||typeof e.indexScriptUrl!="string"||typeof e.statsFiles!="object"||e.statsFiles===null||typeof e.adHints!="object"||e.adHints===null?null:{fetchedAt:e.fetchedAt,indexScriptPath:e.indexScriptPath,indexScriptUrl:e.indexScriptUrl,stringsZhFile:typeof e.stringsZhFile=="string"?e.stringsZhFile:null,stringsZhUrl:typeof e.stringsZhUrl=="string"?e.stringsZhUrl:null,statsFiles:e.statsFiles,adHints:{hasPleaseSticker:!!e.adHints.hasPleaseSticker,hasLeaderboardTarget:!!e.adHints.hasLeaderboardTarget,hasPwIncontent:!!e.adHints.hasPwIncontent,usesLegacyContainer:!!e.adHints.usesLegacyContainer,usesModernContainer:!!e.adHints.usesModernContainer,signalTrackerHref:typeof e.adHints.signalTrackerHref=="string"?e.adHints.signalTrackerHref:null}}}catch(n){return c.warn("读取 site manifest 缓存失败，忽略缓存:",n),null}}function co(n){try{localStorage.setItem(Wn,JSON.stringify(n));}catch(e){c.warn("写入 site manifest 缓存失败:",e);}}function lo(n){return Date.now()-n.fetchedAt<so}function uo(n){const e={};return Object.keys(Ft).forEach(t=>{const r=n.match(Ft[t]);r&&(e[t]=r[0]);}),e}function fo(n,e){const t=n.match(Qn);if(!t)throw new Error("在主页 HTML 中未找到 index-*.js");const r=t[0],o=`${de}${r}`,s=e.match(io),i=s?s[0]:null,a=i?`${de}/assets/locale/${i}`:null,l=e.match(ao),f=l?l[0]:null;return {fetchedAt:Date.now(),indexScriptPath:r,indexScriptUrl:o,stringsZhFile:i,stringsZhUrl:a,statsFiles:uo(e),adHints:{hasPleaseSticker:e.includes("img/stickers/please.png"),hasLeaderboardTarget:e.includes("leaderboard-target"),hasPwIncontent:e.includes("pw-incontent"),usesLegacyContainer:e.includes("overflow-hidden relative text-white"),usesModernContainer:e.includes("relative mx-auto overflow-hidden shrink-0"),signalTrackerHref:f}}}async function ho(){const n=await Ht(de),e=n.match(Qn);if(!e)throw new Error("在主页 HTML 中未找到 index-*.js");const t=e[0],r=`${de}${t}`,o=await Ht(r),s=fo(n,o);return co(s),ke(s,"network")}function go(){if(F)return F;const n=pt();return n?ke(n,"cache"):null}async function Yn(n={}){const{forceRefresh:e=false}=n;if(!e&&F)return F;if(!e&&ie)return ie;if(!e){const t=pt();if(t&&lo(t))return F=ke(t,"cache"),F}return ie=(async()=>{try{const t=await ho();return F=t,t}catch(t){const r=pt();if(r)return c.warn("刷新 site manifest 失败，回退到缓存:",t),F=ke(r,"cache"),F;throw t}finally{ie=null;}})(),ie}class mo{static UNIQUE_ZZZ_KEYS=["denny","w_engine","drive_disc"];static async fetchContent(e){try{const t=await Z(e);if(!t.ok)throw new Error(`请求失败，状态码: ${t.status} - ${t.statusText}`);return await t.text()}catch(t){const r=t instanceof Error?t.message:String(t);throw new Error(`获取 ${e} 时网络错误: ${r}`)}}static restoreZzzData(e){c.debug("▶️  开始从 JS 内容中还原绝区零数据...");const t=e.match(/\bexport\s*\{([\s\S]*?)\}/);if(!t)throw new Error("在JS文件中未找到 export 语句。");const r=t[1].split(",").map(s=>s.trim().split(/\s+as\s+/)[0]).filter(Boolean);let o=e.replace(/\bexport\s*\{[\s\S]*?};/,"");o+=`

// Appended by script
return { ${r.map(s=>`${s}: ${s}`).join(", ")} };`;try{const i=new Function(o)();c.debug(`🔍 正在 ${Object.keys(i).length} 个数据块中搜索绝区零数据...`);for(const a in i){const l=i[a];if(!l||typeof l!="object")continue;const f=[l.default,l];for(const u of f)if(u&&typeof u=="object"&&this.UNIQUE_ZZZ_KEYS.some(d=>d in u))return c.debug(`🎯 命中！在变量 '${a}' 中找到关键词。`),u}throw new Error("未能在任何数据块中找到绝区零的锚点关键词。")}catch(s){const i=s instanceof Error?s.message:String(s);throw new Error(`还原数据时发生错误: ${i}`)}}static parseStatsFile(e){try{const t=e.match(/\bexport\s*\{([\s\S]*?)\}/);if(!t)throw new Error("在统计文件中未找到 export 语句");const r=t[1].split(",").map(l=>l.trim()),o={};let s=null;r.forEach(l=>{const f=l.split(/\s+as\s+/);if(f.length===2){const[u,d]=f;d.trim()==="default"&&(s=u.trim()),o[d.trim()]=u.trim();}else {const u=l.trim();o[u]=u;}});let i=e.replace(/\bexport\s*\{[\s\S]*?};/,"");if(s)i+=`

// Appended by script
return ${s};`;else {const l=Object.values(o);i+=`

// Appended by script
return { ${l.map(f=>`${f}: ${f}`).join(", ")} };`;}return new Function(i)()}catch(t){const r=t instanceof Error?t.message:String(t);throw new Error(`解析统计文件时发生错误: ${r}`)}}static async processStatsFiles(e){c.debug("▶️  开始并行处理统计数据文件...");const r=["charactersStats","weaponsStats","weaponsStatsCommon"].map(async i=>{const a=e[i];if(!a)return c.warn(`⚠️  未找到 ${i} 文件，跳过...`),{name:i,data:null};const l=`${de}/assets/${a}`;c.debug(`📥 下载 ${i} -> ${l}`);try{const f=await this.fetchContent(l),u=this.parseStatsFile(f);return c.debug(`✅ ${i} 处理完成`),{name:i,data:u}}catch(f){const u=f instanceof Error?f.message:String(f);return c.error(`❌ 处理 ${i} 时出错: ${u}`),{name:i,data:null}}}),o=await Promise.all(r),s={};return o.forEach(({name:i,data:a})=>{a!==null&&(s[i]=a);}),c.debug(`✅ 统计数据并行处理完成，共处理 ${Object.keys(s).length} 个文件`),s}static async updateSeelieData(){try{c.debug("🚀 开始更新 Seelie 数据...");const e=await Yn();if(c.debug(`第一步：使用站点 manifest（来源: ${e.source}）`),c.debug(`第二步：发现主脚本 -> ${e.indexScriptUrl}`),!e.stringsZhUrl)throw new Error("在主脚本中未找到 strings-zh-*.js 语言包。");c.debug(`第三步：发现中文语言包 -> ${e.stringsZhUrl}`),c.debug("🔄 开始并行处理语言包和统计数据...");const[t,r]=await Promise.all([this.fetchContent(e.stringsZhUrl),this.processStatsFiles(e.statsFiles)]);c.debug("✅ 语言包和统计数据并行处理完成");const o=this.restoreZzzData(t);return c.debug("🎉 Seelie 数据更新完成！"),{languageData:o,statsData:r}}catch(e){const t=e instanceof Error?e.message:String(e);throw c.error(`❌ Seelie 数据更新失败: ${t}`),e}}static cacheData(e,t){try{localStorage.setItem("seelie_language_data",JSON.stringify(e)),localStorage.setItem("seelie_stats_data",JSON.stringify(t)),localStorage.setItem("seelie_data_timestamp",Date.now().toString()),c.debug("✅ 数据已缓存到 localStorage");}catch(r){c.error("❌ 缓存数据失败:",r);}}static getCachedData(){try{const e=localStorage.getItem("seelie_language_data"),t=localStorage.getItem("seelie_stats_data"),r=localStorage.getItem("seelie_data_timestamp");return !e||!t||!r?null:{languageData:JSON.parse(e),statsData:JSON.parse(t),timestamp:parseInt(r)}}catch(e){return c.error("❌ 获取缓存数据失败:",e),null}}static async getLatestData(){try{c.debug("🔄 请求最新 Seelie 数据...");const{languageData:e,statsData:t}=await this.updateSeelieData();return this.cacheData(e,t),{languageData:e,statsData:t}}catch(e){c.warn("⚠️ 网络请求失败，尝试使用缓存数据:",e);const t=this.getCachedData();if(t)return c.debug("✅ 使用缓存的 Seelie 数据"),{languageData:t.languageData,statsData:t.statsData};throw new Error("网络请求失败且无可用缓存数据")}}}const B=[9,19,29,39,49,60],po={0:"basic",1:"special",2:"dodge",3:"chain",5:"core",6:"assist"},yo=360;let P={};const wo={ascRate:[],rate:[]},qt={charactersStats:false,weaponsStats:false,weaponsStatsCommon:false};function Tt(n,e){qt[n]||(qt[n]=true,c.warn(e));}async function Rt(){if(!P.loaded){if(P.loading){await P.loading;return}P.loading=(async()=>{try{c.debug("🔄 懒加载 Seelie 数据...");const{languageData:n,statsData:e}=await mo.getLatestData();P.languageData=n,P.statsData=e,P.loaded=!0,c.info("✅ Seelie 数据加载完成");}catch(n){throw c.error("❌ Seelie 数据加载失败:",n),n}finally{P.loading=void 0;}})(),await P.loading;}}async function So(){return await Rt(),P.languageData}async function _t(){return await Rt(),P.statsData}async function bo(){try{const n=await _t();if(n?.charactersStats&&Array.isArray(n.charactersStats))return c.debug("✅ 使用动态角色统计数据"),n.charactersStats}catch(n){c.warn("⚠️ 获取角色统计数据失败:",n);}return Tt("charactersStats","⚠️ 角色统计数据缺失，回退为空数组"),[]}async function Eo(){try{const n=await _t();if(n?.weaponsStats&&typeof n.weaponsStats=="object")return c.debug("✅ 使用动态武器统计数据"),n.weaponsStats}catch(n){c.warn("⚠️ 获取武器统计数据失败:",n);}return Tt("weaponsStats","⚠️ 武器统计数据缺失，回退为空对象"),{}}async function vo(){try{const n=await _t();if(n?.weaponsStatsCommon&&typeof n.weaponsStatsCommon=="object"&&Array.isArray(n.weaponsStatsCommon.ascRate)&&Array.isArray(n.weaponsStatsCommon.rate))return c.debug("✅ 使用动态武器通用统计数据"),n.weaponsStatsCommon}catch(n){c.warn("⚠️ 获取武器通用统计数据失败:",n);}return Tt("weaponsStatsCommon","⚠️ 武器通用统计数据缺失，回退为空配置"),wo}class Co{appElement=null;rootComponent=null;lastToast=null;constructor(){this.init();}init(){if(this.appElement=document.querySelector("#app"),!this.appElement){c.warn("⚠️ SeelieCore: 未找到 #app 元素");return}if(this.appElement._vnode?.component){this.completeInit();return}this.waitForVNodeComponent();}waitForVNodeComponent(){if(!this.appElement)return;c.debug("🔍 SeelieCore: 等待 _vnode.component 出现...",this.appElement?._vnode?.component);const t=new MutationObserver(()=>{c.debug("🔍 SeelieCore: 等待 _vnode.component 出现...",this.appElement?._vnode?.component),this.appElement?._vnode?.component&&(o(),this.completeInit());});t.observe(this.appElement,{attributes:true,childList:false,subtree:false});const r=setTimeout(()=>{this.rootComponent||(o(),c.warn(`⚠️ SeelieCore: 等待 _vnode.component 超时 ${3e3/1e3}秒`));},3e3),o=()=>{t.disconnect(),clearTimeout(r);};}completeInit(){if(!this.appElement?._vnode?.component){c.warn("⚠️ SeelieCore: 完成初始化时 _vnode.component 不存在");return}this.rootComponent=this.appElement._vnode.component,Rt(),c.debug("✅ SeelieCore: 已尝试初始化 stats 数据"),c.log("✅ SeelieCore 初始化成功");}ensureInitialized(){return this.rootComponent||this.init(),!!this.rootComponent}getProxy(){return this.ensureInitialized()?this.rootComponent?.proxy:null}getAccountResin(){const e=this.getProxy();if(!e)return c.warn("⚠️ 无法获取组件 proxy 对象"),null;const t=e.accountResin;return c.debug("📖 获取 accountResin:",t),t}setAccountResin(e){const t=this.getProxy();if(!t)return c.warn("⚠️ 无法获取组件 proxy 对象"),false;try{const r=t.accountResin,o=this.convertToAccountResinFormat(e);return t.accountResin=o,c.debug("✏️ 设置 accountResin:",{oldValue:r,inputValue:e,convertedValue:o}),!0}catch(r){return c.error("❌ 设置 accountResin 失败:",r),false}}convertToAccountResinFormat(e){if(!e||!e.progress)throw new Error("输入参数格式错误，缺少 progress 字段");const{progress:t,restore:r}=e,o=t.current,s=t.max,i=r,a=new Date,l=(s-o)*yo,f=new Date(a.getTime()+(i-l)*1e3);return {amount:o,time:f.toString()}}setToast(e,t=""){const r=this.getProxy();if(!r)return c.warn("⚠️ 无法获取组件 proxy 对象"),false;try{const o=Date.now();return this.lastToast&&this.lastToast.message===e&&this.lastToast.type===t&&o-this.lastToast.timestamp<1500?(c.debug("🍞 跳过重复 Toast:",{message:e,type:t}),!0):(r.toast=e,r.toastType=t,this.lastToast={message:e,type:t,timestamp:o},c.debug("🍞 设置 Toast:",{message:e,type:t}),!0)}catch(o){return c.error("❌ 设置 Toast 失败:",o),false}}addGoal(e){const t=this.getProxy();if(!t)return c.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof t.addGoal!="function")return c.warn("⚠️ addGoal 方法不存在"),false;try{return t.addGoal(e),!0}catch(r){return c.error("❌ 调用 addGoal 失败:",r),false}}removeGoal(e){const t=this.getProxy();if(!t)return c.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof t.removeGoal!="function")return c.warn("⚠️ removeGoal 方法不存在"),false;try{return t.removeGoal(e),!0}catch(r){return c.error("❌ 调用 removeGoal 失败:",r),false}}setInventory(e,t,r,o){const s=this.getProxy();if(!s)return c.warn("⚠️ 无法获取组件 proxy 对象"),false;if(typeof s.setInventory!="function")return c.warn("⚠️ setInventory 方法不存在"),false;try{return s.setInventory(e,t,r,o),!0}catch(i){return c.error("❌ 调用 setInventory 失败:",i),false}}getCharacters(){return this.getProxy()?.characters||{}}getWeapons(){return this.getProxy()?.weapons||{}}getGoals(){return this.getProxy()?.goals||[]}getItems(){return this.getProxy()?.items||{}}getContextInfo(){const e=this.getProxy();return e?{keys:Object.keys(e),accountResin:e.accountResin,hasAccountResin:"accountResin"in e,contextType:typeof e}:null}refresh(){c.debug("🔄 SeelieCore 重新初始化..."),this.appElement=null,this.rootComponent=null,this.init();}}async function ko(n){try{const t=(await bo()).find(u=>u.id===n.id);if(!t)return c.warn(`⚠️ 未找到角色 ${n.name_mi18n} 的统计数据`),B.findIndex(u=>u>=n.level);const r=n.properties.find(u=>u.property_id===1);if(!r)return c.warn(`⚠️ 角色 ${n.name_mi18n} 缺少生命值属性`),B.findIndex(u=>u>=n.level);const o=parseInt(r.base||r.final),s=t.base,i=(n.level-1)*t.growth/1e4,a=n.skills.find(u=>u.skill_type===5),l=a&&t.core&&t.core[a.level-2]||0,f=s+i+l;for(let u=0;u<t.ascHP.length;u++){const d=t.ascHP[u];if(Math.floor(f+d)===o)return u}return c.warn(`HP error: ${n.name_mi18n}, base: ${s}, growth: ${i}, core: ${l}, fixed: ${f}, target: ${o}`),B.findIndex(u=>u>=n.level)}catch(e){return c.error("❌ 计算角色突破等级失败:",e),B.findIndex(t=>t>=n.level)}}async function xo(n){try{const e=await vo(),t=await Eo(),r=e.rate[n.level]||0,o=n.main_properties.find(f=>f.property_id===12101);if(!o)return c.warn(`⚠️ 武器 ${n.name} 缺少攻击力属性`),B.findIndex(f=>f>=n.level);const s=parseInt(o.base),i=t[n.id]||48,a=i*r/1e4,l=i+a;for(let f=0;f<e.ascRate.length;f++){const u=e.ascRate[f],d=i*u/1e4;if(Math.floor(l+d)===s)return f}return c.warn(`ATK error: ${n.name}, base: ${i}, growth: ${a}, fixed: ${l}, target: ${s}`),B.findIndex(f=>f>=n.level)}catch(e){return c.error("❌ 计算武器突破等级失败:",e),B.findIndex(t=>t>=n.level)}}function To(n,e,t){let r=n;return e==="core"?r--:t>=5?r-=4:t>=3&&(r-=2),Math.max(1,r)}class Ro extends Co{async setCharacter(e){try{const t=e.avatar||e,r=this.findCharacterKey(t.id);if(!r)throw new Error("Character not found.");const o=this.findExistingGoal(r,"character"),s=await ko(t),i=o;let a=i?.goal?.level;(!a||a<t.level)&&(a=t.level);let l=i?.goal?.asc;(!l||l<s)&&(l=s);const f={type:"character",character:r,cons:t.rank,current:{level:t.level,asc:s},goal:{level:a||t.level,asc:l||s}};return this.addGoal(f)?(c.debug("✓ 角色数据设置成功:",{character:r,level:t.level,rank:t.rank,currentAsc:s,targetLevel:a,targetAsc:l}),!0):!1}catch(t){return c.error("❌ 设置角色数据失败:",t),false}}setTalents(e){try{const t=e.avatar||e,r=this.findCharacterKey(t.id);if(!r)throw new Error("Character not found.");const o=this.findExistingGoal(r,"talent"),s={};t.skills.forEach(a=>{const l=po[a.skill_type];if(!l)return;const f=To(a.level,l,t.rank);let d=o?.[l]?.goal;(!d||d<f)&&(d=f),s[l]={current:f,goal:d||f};});const i={type:"talent",character:r,...s};return this.addGoal(i)?(c.debug("✓ 角色天赋数据设置成功:",{character:r,talents:s}),!0):!1}catch(t){return c.error("❌ 设置角色天赋数据失败:",t),false}}async setWeapon(e){try{const t=e.avatar||e,r=e.weapon,o=this.findCharacterKey(t.id);if(!o)throw new Error("Character not found.");const s=this.findExistingGoal(o,"weapon");if(!r)return s&&this.removeGoal(s)&&c.debug("✓ 移除武器目标成功"),!0;const i=this.findWeaponKey(r.id);if(!i)throw new Error("Weapon not found.");const a=await xo(r),l={level:r.level,asc:a};let f={level:l.level,asc:l.asc};const u=this.getWeapons(),d=s,g=d?.weapon?u[d.weapon]:null,h=u[i];g?.id===h?.id&&d?.goal?(f.level=Math.max(d.goal.level||l.level,l.level),f.asc=Math.max(d.goal.asc||l.asc,l.asc),h.craftable&&(l.craft=r.star,f.craft=Math.max(d.goal.craft||r.star,r.star))):h.craftable&&(l.craft=r.star,f.craft=r.star);const m={type:"weapon",character:o,weapon:i,current:l,goal:f};return this.addGoal(m)?(c.debug("✓ 武器数据设置成功:",{character:o,weapon:i,current:l,goal:f}),!0):!1}catch(t){return c.error("❌ 设置武器数据失败:",t),false}}async syncCharacter(e){const t={success:0,failed:0,errors:[]},r=e.avatar||e,o=r.name_mi18n||`角色ID:${r.id}`;c.debug(`🔄 开始同步角色: ${o}`);const i=[{name:"角色数据",fn:()=>this.setCharacter(e)},{name:"天赋数据",fn:()=>this.setTalents(e)},{name:"武器数据",fn:()=>this.setWeapon(e)}].map(async({name:l,fn:f})=>{try{return await f()?(c.debug(`✓ ${o} - ${l}同步成功`),{success:!0,error:null}):{success:!1,error:`${o} - ${l}同步失败`}}catch(u){const d=`${o} - ${l}同步错误: ${u}`;return c.error(`❌ ${d}`),{success:false,error:d}}});return (await Promise.all(i)).forEach(({success:l,error:f})=>{l?t.success++:(t.failed++,f&&t.errors.push(f));}),t.failed>0?c.warn(`⚠️ ${o} 同步完成 - 成功: ${t.success}, 失败: ${t.failed}`):c.debug(`✅ ${o} 同步完成 - 成功: ${t.success}`),t}async syncAllCharacters(e){const t={total:e.length,success:0,failed:0,errors:[],details:[]};c.debug(`🚀 开始批量同步 ${e.length} 个角色`);const r=e.map(async(s,i)=>{const a=s.avatar||s,l=a.name_mi18n||`角色ID:${a.id}`;c.debug(`📝 [${i+1}/${e.length}] 同步角色: ${l}`);try{const f=await this.syncCharacter(s);return {character:l,result:f,success:f.failed===0}}catch(f){const u=`${l} - 批量同步失败: ${f}`;return c.error(`❌ ${u}`),{character:l,result:{success:0,failed:1,errors:[u]},success:false}}});return (await Promise.all(r)).forEach(({character:s,result:i,success:a})=>{t.details.push({character:s,result:i}),a?t.success++:(t.failed++,t.errors.push(...i.errors));}),this.logBatchResult(t),t}findCharacterKey(e){const t=this.getCharacters();return Object.keys(t).find(r=>t[r].id===e)||null}findWeaponKey(e){const t=this.getWeapons();return Object.keys(t).find(r=>t[r].id===e)||null}findExistingGoal(e,t){return this.getGoals().find(o=>{const s=o;return s.character===e&&s.type===t})}logBatchResult(e){e.failed>0?(c.warn("⚠️ 批量同步完成:"),c.warn(`   总计: ${e.total} 个角色`),c.warn(`   成功: ${e.success} 个角色`),c.warn(`   失败: ${e.failed} 个角色`)):(c.debug("🎯 批量同步完成:"),c.debug(`   总计: ${e.total} 个角色`),c.debug(`   成功: ${e.success} 个角色`)),e.errors.length>0&&(c.warn("   错误详情:"),e.errors.forEach(t=>c.warn(`     - ${t}`)));}_minimumSetCoverCache=null;_minimumSetWeaponsCache=null;findMinimumSetCoverIds(){if(this._minimumSetCoverCache!==null)return c.debug("📦 使用缓存的最小集合覆盖结果"),this._minimumSetCoverCache;const e=this.getCharacters(),t=Object.values(e),r=new Set;for(const a of t)r.add(a.attribute),r.add(a.style),r.add(a.boss),r.add(a.boss_weekly);const o=new Set(r),s=[],i=new Set;for(;o.size>0;){let a=null,l=0;for(const u of t){if(i.has(u.id)||new Date(u.release)>new Date)continue;const d=new Set([u.attribute,u.style,u.boss,u.boss_weekly]);let g=0;for(const h of d)o.has(h)&&g++;g>l&&(l=g,a=u);}if(a===null){c.warn("⚠️ 无法覆盖所有属性，可能缺少某些属性的组合");break}s.push({id:a.id,style:a.style}),i.add(a.id);const f=new Set([a.attribute,a.style,a.boss,a.boss_weekly]);for(const u of f)o.delete(u);c.debug(`✅ 选择角色 ${a.id}，覆盖 ${l} 个属性`);}return c.debug(`🎯 最小集合覆盖完成，共选择 ${s.length} 个角色: ${s.join(", ")}`),this._minimumSetCoverCache=s,s}findMinimumSetWeapons(){if(this._minimumSetWeaponsCache!==null)return c.debug("📦 使用缓存的最小武器集合结果"),this._minimumSetWeaponsCache;const e=this.getWeapons(),t=Object.values(e),r={};for(const o of t)o.tier===5&&!r[o.style]&&new Date>=new Date(o.release)&&(r[o.style]=o.id);return this._minimumSetWeaponsCache=r,r}}class _o extends Ro{}const j=new _o,Io=n=>j.setAccountResin(n),M=(n,e="success")=>j.setToast(n,e),Ao=async n=>await j.syncCharacter(n),Mo=async n=>await j.syncAllCharacters(n),yt=(n,e,t,r)=>j.setInventory(n,e,t,r),$o=()=>j.findMinimumSetCoverIds(),Lo=()=>j.findMinimumSetWeapons(),No=()=>j.getItems();var wt=(n=>(n[n.NormalAttack=0]="NormalAttack",n[n.SpecialSkill=1]="SpecialSkill",n[n.Dodge=2]="Dodge",n[n.Chain=3]="Chain",n[n.CorePassive=5]="CorePassive",n[n.SupportSkill=6]="SupportSkill",n))(wt||{});async function Po(n,e,t,r){const o=await Ze(t,r);c.debug(`🧮 开始计算养成材料: avatar=${n}, weapon=${e}`);const s={avatar_id:Number(n),avatar_level:B[B.length-1],avatar_current_level:1,avatar_current_promotes:1,skills:Object.values(wt).filter(a=>typeof a!="string").map(a=>({skill_type:a,level:a===wt.CorePassive?7:12,init_level:1})),weapon_info:{weapon_id:Number(e),weapon_level:B[B.length-1],weapon_promotes:0,weapon_init_level:0}},i=await Be("/user/avatar_calc",Ae,{method:"POST",params:{uid:o.uid,region:o.region},body:s});return c.debug(`✅ 养成材料计算完成: avatar=${n}, weapon=${e}`),i.data}async function Do(n,e,t){if(n.length===0)return c.warn("⚠️ 批量养成材料计算参数为空，返回空列表"),[];c.debug(`📦 开始批量养成材料计算: ${n.length} 个角色`);const r=n.map(s=>Po(s.avatar_id,s.weapon_id,e,t)),o=await Promise.all(r);return c.debug(`✅ 批量养成材料计算完成: ${o.length} 个结果`),o}function Bo(n){const e={};for(const t of n){const r=[...t.avatar_consume,...t.weapon_consume,...t.skill_consume,...t.need_get];for(const o of r){const s=o.id.toString();s in e||(e[s]={id:o.id,name:o.name});}}return e}function Zo(n,e){const t={},r={};for(const o of n)Object.assign(r,o.user_owns_materials);for(const[o,s]of Object.entries(e)){const i=r[o]||0;t[s.name]=i;}return t}function Oo(n){const e={};for(const[t,r]of Object.entries(n))typeof r=="string"?e[r]=t:Array.isArray(r)&&r.forEach((o,s)=>{e[o]=`${t}+${s}`;});return e}function Uo(n,e,t){let r=0,o=0;for(const[s,i]of Object.entries(n)){const a=e[s];if(!a){o++;continue}try{const l=a.split("+");if(l.length>1){const f=l[0],u=Number(l[1]),d=t[f].type;d&&yt(d,f,u,i)?r++:o++;}else {const f=t[a]?.type;f&&yt(f,a,0,i)?r++:o++;}}catch{o++;}}return {successNum:r,failNum:o}}function zo(n){const e={};for(const t of n){const r=[...t.avatar_consume,...t.weapon_consume,...t.skill_consume,...t.need_get];for(const o of r){const s=o.id.toString();s in e||(e[s]=0);}for(const[o,s]of Object.entries(t.user_owns_materials))e[o]=Math.max(e[o]??0,s);}return e}function Fo(n,e){const t=new Map;for(const[r,o]of Object.entries(n))if(o.id!=null&&t.set(o.id,{key:r,tier:0,type:o.type}),o.ids)for(let s=0;s<o.ids.length;s++)t.set(o.ids[s],{key:r,tier:s,type:o.type});return e!=null&&!t.has(e)&&t.set(e,{key:"denny",tier:0,type:"denny"}),t}function Ho(n,e){let t=0,r=0;const o=[];for(const[s,i]of Object.entries(n)){const a=Number(s),l=e.get(a);if(!l){o.push(s),r++;continue}try{yt(l.type,l.key,l.tier,i)?t++:(r++,c.warn(`⚠️ setInventory 失败: id=${s}, key=${l.key}`));}catch(f){r++,c.error(`❌ setInventory 异常: id=${s}`,f);}}return o.length>0&&c.warn(`⚠️ ID 映射未命中 ${o.length} 项:`,o),{successNum:t,failNum:r,unknownIds:o}}class qo{shouldNotify(e){return e?.notify!==false}buildErrorFeedback(e,t){if(!t)return {summary:e,toast:`${e}，请稍后重试`};const r=`${e}：${Pr(t)}`,o=Dr(t);return {summary:r,toast:`${e}，${o}`}}failBooleanTask(e,t,r=true){const o=this.buildErrorFeedback(e,t);return c.error(`❌ ${o.summary}`,t),r&&M(o.toast,"error"),false}failSyncResult(e,t,r=true){const o=this.buildErrorFeedback(e,t);return c.error(`❌ ${o.summary}`,t),r&&M(o.toast,"error"),{success:0,failed:1,errors:t?[o.summary]:[e]}}failBatchSyncResult(e,t,r=true){const o=this.buildErrorFeedback(e,t);return c.error(`❌ ${o.summary}`,t),r&&M(o.toast,"error"),{success:0,failed:1,errors:t?[o.summary]:[e],total:0,details:[]}}failItemsSyncResult(e,t,r=true){const o=this.buildErrorFeedback(e,t);return c.error(`❌ ${o.summary}`,t),r&&M(o.toast,"error"),{success:false,partial:false,successNum:0,failNum:0}}async executeBooleanTask(e,t,r=true){try{return await e()}catch(o){return this.failBooleanTask(t,o,r)}}async executeSyncResultTask(e,t,r=true){try{return await e()}catch(o){return this.failSyncResult(t,o,r)}}async executeBatchSyncTask(e,t,r=true){try{return await e()}catch(o){return this.failBatchSyncResult(t,o,r)}}async syncResinData(e){const t=this.shouldNotify(e);return this.executeBooleanTask(async()=>{c.info("🔋 开始同步电量数据...");const r=await oo();if(!r)return this.failBooleanTask("获取游戏便笺失败",void 0,t);const o=r.energy,s=Io(o);if(s)c.info("✅ 电量数据同步成功"),t&&M(`电量同步成功: ${o.progress.current}/${o.progress.max}`,"success");else return this.failBooleanTask("电量数据设置失败",void 0,t);return s},"电量数据同步失败",t)}async syncSingleCharacter(e,t){const r=this.shouldNotify(t);return this.executeSyncResultTask(async()=>{c.info(`👤 开始同步角色数据: ${e}`);const o=await zt([e],void 0);if(!o||o.length===0)return this.failSyncResult("获取角色详细信息失败",void 0,r);const s=o[0],i=await Ao(s);return i.success>0&&i.failed===0?(c.info(`✅ 角色 ${s.avatar.name_mi18n} 同步成功`),r&&M(`角色 ${s.avatar.name_mi18n} 同步成功`,"success")):i.success>0?(c.warn(`⚠️ 角色 ${s.avatar.name_mi18n} 同步部分成功: 成功 ${i.success}，失败 ${i.failed}`),r&&M(`角色 ${s.avatar.name_mi18n} 同步部分成功`,"warning")):(c.error(`❌ 角色 ${s.avatar.name_mi18n} 同步失败`),r&&M(`角色 ${s.avatar.name_mi18n} 同步失败`,"error")),i},`角色 ${e} 同步失败`,r)}async syncAllCharacters(e){const t=this.shouldNotify(e);return this.executeBatchSyncTask(async()=>{c.info("👥 开始同步所有角色数据...");const r=await ro();if(!r||r.length===0)return this.failBatchSyncResult("获取角色列表失败或角色列表为空",void 0,t);c.info(`📋 找到 ${r.length} 个角色`),t&&M(`开始同步 ${r.length} 个角色...`,"");const o=r.map(a=>a.avatar.id),s=await zt(o,void 0);if(!s||s.length===0)return this.failBatchSyncResult("获取角色详细信息失败",void 0,t);const i=await Mo(s);return i.success>0&&i.failed===0?(c.info(`✅ 所有角色同步完成: 成功 ${i.success}`),t&&M(`角色同步完成: 成功 ${i.success}，失败 ${i.failed}`,"success")):i.success>0?(c.warn(`⚠️ 所有角色同步完成（部分失败）: 成功 ${i.success}，失败 ${i.failed}`),t&&M(`角色同步部分完成: 成功 ${i.success}，失败 ${i.failed}`,"warning")):(c.error("❌ 角色批量同步失败"),t&&M("角色批量同步失败","error")),i},"所有角色同步失败",t)}async syncItemsData(e){const t=this.shouldNotify(e);try{c.info("🔋 开始同步养成材料数据...");const r=$o(),o=Lo(),s=r.map(u=>({avatar_id:u.id,weapon_id:o[u.style]})),i=await Do(s);if(!i)return this.failItemsSyncResult("获取养成材料数据失败",void 0,t);const a=No(),l=i[0]?.coin_id,f=Fo(a,l);if(f.size>0){const u=zo(i),d=Ho(u,f),g=d.successNum+d.failNum,h=g>0?d.successNum/g:0;if(c.info(`📊 ID 映射命中率: ${(h*100).toFixed(1)}% (${d.successNum}/${g})`),h>=.7)return this.buildItemsSyncResult(d.successNum,d.failNum,t,{mappedBy:"id",unknownIds:d.unknownIds});c.warn(`⚠️ ID 映射命中率过低 (${(h*100).toFixed(1)}%)，降级到名字映射`);}else c.warn("⚠️ Seelie items 中无 id/ids 字段，降级到名字映射");return await this.syncItemsByName(i,a,t)}catch(r){return this.failItemsSyncResult("养成材料同步失败",r,t)}}async syncItemsByName(e,t,r){const o=Bo(e),s=Zo(e,o);t.denny={type:"denny"};const i=await So();if(!i)return this.failItemsSyncResult("获取语言数据失败（名字映射降级）",void 0,r);const a=Oo(i),{successNum:l,failNum:f}=Uo(s,a,t);return this.buildItemsSyncResult(l,f,r,{mappedBy:"name-fallback"})}buildItemsSyncResult(e,t,r,o){const s=e>0,i=e+t,a=s&&t>0;return c.info(`📦 材料同步策略: ${o.mappedBy}`),s&&!a?(c.info(`✅ 养成材料同步成功: ${e}/${i}`),r&&M(`养成材料同步完成: 成功 ${e}，失败 ${t}`,"success"),{success:true,partial:false,successNum:e,failNum:t,...o}):s?(c.warn(`⚠️ 养成材料同步部分成功: ${e}/${i}`),r&&M(`养成材料同步部分完成: 成功 ${e}，失败 ${t}`,"warning"),{success:true,partial:true,successNum:e,failNum:t,...o}):this.failItemsSyncResult("养成材料同步失败",void 0,r)}async syncAll(){c.info("🚀 开始执行完整同步..."),M("开始执行完整同步...","");const[e,t,r]=await Promise.all([this.syncResinData({notify:true}),this.syncAllCharacters({notify:true}),this.syncItemsData({notify:true})]),o=r.success,s=r.partial,i=t.success>0&&t.failed===0,a=e&&i&&o&&!s,l=!e&&t.success===0&&!o,f=o?s?`部分完成（成功 ${r.successNum}，失败 ${r.failNum}）`:"成功":"失败",u=`电量${e?"成功":"失败"}，角色成功 ${t.success} 失败 ${t.failed}，养成材料${f}`;return a?(c.info(`✅ 完整同步完成：${u}`),M(`完整同步完成：${u}`,"success")):l?(c.error(`❌ 完整同步失败：${u}`),M("完整同步失败，请刷新登录后重试","error")):(c.warn(`⚠️ 完整同步部分完成：${u}`),M(`完整同步部分完成：${u}`,"warning")),{resinSync:e,characterSync:t,itemsSync:o,itemsPartial:s}}}const ge=new qo,ne='img[src*="please.png"]',V="#large-leaderboard-ad, #leaderboard-target, .pw-incontent",jo='a[href*="stardb.gg/zzz/signal-tracker"]',Jn="div.overflow-hidden.relative.text-white:has(#leaderboard-target)",Xn="div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)",Go="zzz.seelie.me",xe="seelie-ad-cleaner-style",Vo=["! zzz-seelie-sync 强化规则（由脚本动态生成）",'zzz.seelie.me##img[src*="img/stickers/please.png"]',"zzz.seelie.me###leaderboard-target","zzz.seelie.me###large-leaderboard-ad","zzz.seelie.me##.pw-incontent","zzz.seelie.me##div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)","zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#leaderboard-target)"],Te=new Set([Jn,Xn]),Re=new Set([jo]);let _e=false,re=null,Se=null,be=false;function It(){return Array.from(Re).join(", ")}function Ko(){const n=It();return n?`${ne}, ${V}, ${n}`:`${ne}, ${V}`}function St(){const n=[ne,V],e=It();e&&n.push(e);const t=new Set(Te);return t.add(`div.overflow-hidden.relative.text-white:has(${ne})`),t.add(`div.overflow-hidden.relative.text-white:has(${V})`),t.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${ne})`),t.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${V})`),`
${n.join(`,
`)} {
  display: none !important;
  visibility: hidden !important;
}

${Array.from(t).join(`,
`)} {
  display: none !important;
}
`}function jt(){const n=document.getElementById(xe);n&&(n.textContent=St());}function Wo(){const n=document.getElementById(xe);if(n){n.textContent=St();return}const e=document.createElement("style");e.id=xe,e.textContent=St();const t=document.head||document.documentElement;if(!t){c.warn("⚠️ 去广告样式注入失败：未找到 head/documentElement");return}t.appendChild(e);}function Qo(){const n=document.getElementById(xe);n&&n.remove();}function Gt(n){const e=n.trim();return !e||Te.has(e)?false:(Te.add(e),true)}function Yo(n){const e=n.trim();return !e||Re.has(e)?false:(Re.add(e),true)}function Vt(n){let e=false;if(n.adHints.usesLegacyContainer&&(e=Gt(Jn)||e),n.adHints.usesModernContainer&&(e=Gt(Xn)||e),n.adHints.signalTrackerHref){const t=n.adHints.signalTrackerHref.replace(/"/g,'\\"');e=Yo(`a[href="${t}"]`)||e;}return e}function Jo(){const n=go();n&&Vt(n)&&jt(),Yn().then(e=>{Vt(e)&&(c.debug("🔄 已根据 site manifest 更新去广告规则"),jt(),At());}).catch(e=>{c.warn("⚠️ 获取 site manifest 失败，继续使用内置去广告规则:",e);});}function Xo(n){const t=n.classList,r=n.querySelector(V)!==null,o=t.contains("overflow-hidden")&&t.contains("relative")&&t.contains("text-white"),s=t.contains("overflow-hidden")&&t.contains("relative")&&t.contains("mx-auto")&&t.contains("shrink-0");return r||o||s}function Kt(n){let e=n;for(;e&&e!==document.body;){if(Xo(e))return e;e=e.parentElement;}return null}function es(){const n=new Set;return document.querySelectorAll(ne).forEach(e=>{const t=Kt(e);t&&n.add(t);}),document.querySelectorAll(V).forEach(e=>{const t=Kt(e);t&&n.add(t);}),n}function ts(){const n=new Set,e=It();return e&&document.querySelectorAll(e).forEach(t=>{t instanceof HTMLElement&&n.add(t);}),n}function er(){const n=es(),e=ts();n.forEach(r=>{r.remove();}),e.forEach(r=>{r.remove();});const t=n.size+e.size;return t>0&&c.info(`🧹 已移除广告节点 ${t} 个（横幅: ${n.size}，Signal Tracker: ${e.size}）`),t}function At(){be||(be=true,queueMicrotask(()=>{be=false,er();}));}function ns(n){const e=Ko();return n.some(t=>{if(t.type==="attributes"){const r=t.target;return r instanceof Element?r.matches(e)||r.querySelector(e)!==null:false}return Array.from(t.addedNodes).some(r=>r instanceof Element?r.matches(e)||r.querySelector(e)!==null:false)})}function rs(){re||!document.body||(re=new MutationObserver(n=>{ns(n)&&At();}),re.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src","class","id"]}));}function Wt(){if(_e||!document.body)return;_e=true,er(),rs();const{unwatch:n}=$n(()=>{At();},{delay:0,immediate:true});Se=n,c.info("✅ 去广告模块已启动（manifest + fallback）");}function os(){const n=new Set(Vo);return Te.forEach(e=>{n.add(`zzz.seelie.me##${e}`);}),Re.forEach(e=>{n.add(`zzz.seelie.me##${e}`);}),Array.from(n)}function ss(){return os().join(`
`)}function is(){if(window.location.hostname!==Go){c.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`);return}if(Jo(),Wo(),_e){c.debug("去广告模块已初始化，跳过重复初始化");return}if(!document.body){window.addEventListener("DOMContentLoaded",()=>{Wt();},{once:true});return}Wt();}function as(){be=false,re&&(re.disconnect(),re=null),Se&&(Se(),Se=null),Qo(),_e=false,c.debug("🗑️ 去广告模块已停止");}const cs="zzz.seelie.me",tr="seelie_ad_cleaner_enabled",Qt=true;function nr(){return window.location.hostname===cs}function rr(){try{const n=localStorage.getItem(tr);return n===null?Qt:n==="1"}catch(n){return c.warn("读取去广告开关失败，使用默认值:",n),Qt}}function ls(n){try{localStorage.setItem(tr,n?"1":"0");}catch(e){c.warn("写入去广告开关失败:",e);}}function or(n){if(n){is();return}as();}function us(){return nr()}function ds(){return rr()}function fs(n){ls(n),or(n);}async function hs(){const n=ss();if(!navigator?.clipboard?.writeText)return  false;try{return await navigator.clipboard.writeText(n),!0}catch(e){return c.warn("复制 uBlock 规则失败:",e),false}}function gs(){nr()&&or(rr());}const Yt="ZSS-settings-style";function sr(){if(document.getElementById(Yt))return;const n=document.createElement("style");n.id=Yt,n.textContent=`
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
  `,(document.head||document.documentElement).appendChild(n);}function Ie(n){return `<span class="ZSS-icon">${n}</span>`}const W={gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>'};function ms(n){sr();const e=document.createElement("button");return e.type="button",e.className="ZSS-settings-btn",e.innerHTML=`${Ie(W.gear)}<span>设置</span>`,e.addEventListener("click",n),e}function ps(n){sr();const e=document.createElement("div");e.className="ZSS-modal-overlay",e.setAttribute("data-seelie-settings-modal","true");const t=document.createElement("div");t.className="ZSS-modal-dialog";const r=document.createElement("div");r.className="ZSS-modal-header";const o=document.createElement("div");o.className="ZSS-modal-title",o.innerHTML=`${Ie(W.gear)}脚本设置`;const s=document.createElement("button");s.type="button",s.className="ZSS-modal-close",s.innerHTML=Ie(W.close),s.addEventListener("click",n.onClose),r.append(o,s);const i=document.createElement("div");i.className="ZSS-modal-body",us()&&i.append(ys(n),ws(n)),i.appendChild(Ss(n));const a=document.createElement("div");a.className="ZSS-modal-footer";const l=document.createElement("button");return l.type="button",l.className="ZSS-modal-footer-btn",l.textContent="关闭",l.addEventListener("click",n.onClose),a.appendChild(l),t.append(r,i,a),e.appendChild(t),e.addEventListener("click",f=>{f.target===e&&n.onClose();}),t.addEventListener("click",f=>f.stopPropagation()),requestAnimationFrame(()=>e.classList.add("ZSS-open")),e}function ys(n){const e=document.createElement("div");e.className="ZSS-card";const t=document.createElement("div");t.className="ZSS-toggle-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=W.shield;const o=document.createElement("div");o.className="ZSS-toggle-info";const s=document.createElement("div");s.className="ZSS-toggle-label",s.textContent="脚本去广告";const i=document.createElement("div");i.className="ZSS-toggle-desc",i.textContent="关闭后将停止脚本内的去广告逻辑",o.append(s,i);const a=document.createElement("label");a.className="ZSS-switch";const l=document.createElement("input");l.type="checkbox",l.checked=ds(),l.addEventListener("change",()=>n.onToggleAdCleaner(l.checked));const f=document.createElement("span");f.className="ZSS-switch-track";const u=document.createElement("span");return u.className="ZSS-switch-knob",a.append(l,f,u),t.append(r,o,a),e.appendChild(t),e}function ws(n){const e=document.createElement("div");e.className="ZSS-card";const t=document.createElement("div");t.className="ZSS-action-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=W.filter;const o=document.createElement("div");o.className="ZSS-toggle-info";const s=document.createElement("div");s.className="ZSS-toggle-label",s.textContent="uBlock Origin 规则";const i=document.createElement("div");i.className="ZSS-toggle-desc",i.textContent="复制到「我的过滤器」，在浏览器层拦截广告",o.append(s,i);const a=document.createElement("button");a.type="button",a.className="ZSS-action-btn ZSS-ublock-copy",a.innerHTML=`${Ie(W.copy)}<span class="ZSS-ublock-copy-text">复制规则到剪贴板</span>`;const l=a.querySelector(".ZSS-ublock-copy-text");let f=null;const u=d=>{if(a.classList.remove("is-loading","is-success","is-error"),a.disabled=false,d==="loading"){a.classList.add("is-loading"),a.disabled=true,l.textContent="复制中…";return}if(d==="success"){a.classList.add("is-success"),l.textContent="已复制";return}if(d==="error"){a.classList.add("is-error"),l.textContent="复制失败";return}l.textContent="复制规则到剪贴板";};return a.addEventListener("click",async()=>{f!==null&&(window.clearTimeout(f),f=null),u("loading");try{const d=await n.onCopyUBlockRules();u(d?"success":"error");}catch{u("error");}f=window.setTimeout(()=>{u("idle"),f=null;},1800);}),t.append(r,o),e.append(t,a),e}function Ss(n){const e=document.createElement("div");e.className="ZSS-card";const t=document.createElement("div");t.className="ZSS-action-row";const r=document.createElement("span");r.className="ZSS-icon",r.innerHTML=W.refresh;const o=document.createElement("div");o.className="ZSS-toggle-info";const s=document.createElement("div");s.className="ZSS-toggle-label",s.textContent="重置设备信息";const i=document.createElement("div");i.className="ZSS-toggle-desc",i.textContent="同步遇到 1034 设备异常时使用",o.append(s,i);const a=document.createElement("button");return a.type="button",a.className="ZSS-action-btn",a.textContent="重置",a.addEventListener("click",async()=>{a.disabled=true,a.textContent="重置中…";try{await n.onResetDevice();}finally{a.disabled=false,a.textContent="重置";}}),t.append(r,o,a),e.appendChild(t),e}function bs(n){const e=String(n);return e.includes("获取用户角色失败")||e.includes("未登录")||e.includes("HTTP 401")||e.includes("HTTP 403")?{error:"login_required",message:"请先登录米游社账号"}:e.includes("未找到绝区零游戏角色")?{error:"no_character",message:"未找到绝区零游戏角色"}:e.includes("网络")||e.includes("timeout")||e.includes("fetch")?{error:"network_error",message:"网络连接失败，请重试"}:{error:"unknown",message:"用户信息加载失败"}}const Es=[{action:"resin",text:"同步电量",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>`},{action:"characters",text:"同步角色",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>`},{action:"items",text:"同步材料",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
    </svg>`},{action:"reset_device",text:"重置设备",icon:`<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15M12 3v9m0 0l-3-3m3 3l3-3"></path>
    </svg>`}];function vs(n){const e=n.total>0?n.total:n.success+n.failed;return n.success>0&&n.failed===0?{status:"success",summary:`角色同步成功（${n.success}/${e}）`}:n.success>0?{status:"partial",summary:`角色同步部分完成（成功 ${n.success}，失败 ${n.failed}）`}:{status:"failed",summary:"角色同步失败"}}function Cs(n){const{resinSync:e,characterSync:t,itemsSync:r,itemsPartial:o}=n,s=vs(t),i=r?o?"养成材料同步部分完成":"养成材料同步成功":"养成材料同步失败",a=[e?"电量同步成功":"电量同步失败",s.summary,i];if(t.errors.length>0){const u=t.errors.slice(0,2).join("；");a.push(`角色错误摘要：${u}`);}const l=e&&s.status==="success"&&r&&!o,f=!e&&s.status==="failed"&&!r;return l?{status:"success",summary:"完整同步成功",details:a}:f?{status:"failed",summary:"完整同步失败，请检查登录状态和网络后重试",details:a}:{status:"partial",summary:`完整同步部分完成：角色成功 ${t.success}，失败 ${t.failed}，养成材料${r?o?"部分完成":"成功":"失败"}`,details:a}}function ae(n,e,t){const r=document.createElement("button");return r.className=n,r.textContent=e,r.addEventListener("click",t),r}function me(n){const e=document.createElement("div");return e.className="ZSS-error-hint",e.textContent=n,e}function ks(n,e){const t=document.createElement("div");t.className="ZSS-error-container";const r=document.createElement("div");r.className="ZSS-error-icon",r.innerHTML=`
    <svg class="ZSS-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
  `;const o=document.createElement("div");return o.className="ZSS-error-message",o.textContent=n.message,t.appendChild(r),t.appendChild(o),n.error==="login_required"?(t.appendChild(me("使用米游社 App 扫码登录，或前往米游社网页登录")),e.onStartQRLogin&&t.appendChild(ae("ZSS-action-button ZSS-action-button--login","扫码登录",e.onStartQRLogin)),t.appendChild(ae("ZSS-action-button ZSS-action-button--retry-default ZSS-mt-2","前往米游社登录",e.onOpenMys)),t):n.error==="no_character"?(t.appendChild(me("请先在米游社绑定绝区零游戏角色")),t.appendChild(ae("ZSS-action-button ZSS-action-button--bind","前往绑定角色",e.onOpenMys)),t):n.error==="network_error"?(t.appendChild(me("请检查网络或代理设置后重试，必要时刷新登录状态")),t.appendChild(ae("ZSS-action-button ZSS-action-button--retry-network","重试",e.onRetry)),t):(t.appendChild(me("请先重试；若持续失败，请刷新页面并重新登录米游社。")),t.appendChild(ae("ZSS-action-button ZSS-action-button--retry-default","重试",e.onRetry)),t)}function xs(n,e){const t=document.createElement("div");t.className="ZSS-user-section";const r=document.createElement("div");if(r.className="ZSS-user-info-text",n&&!("error"in n)){const o=document.createElement("div");o.className="ZSS-user-nickname",o.textContent=n.nickname;const s=document.createElement("div");s.className="ZSS-user-uid",s.textContent=`UID: ${n.uid}`,r.appendChild(o),r.appendChild(s);}else if(n&&"error"in n){const o=ks(n,{onOpenMys:e.onOpenMys,onRetry:e.onRetry,onStartQRLogin:e.onStartQRLogin});r.appendChild(o);}else {const o=document.createElement("div");o.className="ZSS-user-error-fallback",o.textContent="用户信息加载失败",r.appendChild(o);}return t.appendChild(r),t}function Ts(n,e,t){const r=document.createElement("div");return r.className="ZSS-sync-grid",n.forEach(o=>{const s=document.createElement("button"),i=e?"ZSS-sync-option-btn--enabled":"ZSS-sync-option-btn--disabled";s.className=`ZSS-sync-option-btn ${i}`,s.disabled=!e,s.innerHTML=`${o.icon}<span class="ZSS-sync-text">${o.text}</span>`,e&&s.addEventListener("click",a=>{t.onSyncAction(o.action,a);}),r.appendChild(s);}),r}function Rs(n){const{isUserInfoValid:e,syncOptions:t,actions:r}=n,o=document.createElement("div");o.className="ZSS-sync-section";const s=e?"ZSS-main-sync-btn--enabled":"ZSS-main-sync-btn--disabled",i=document.createElement("button");i.className=`ZSS-main-sync-btn ${s}`,i.setAttribute("data-sync-main","true"),i.disabled=!e,i.innerHTML=`
    <svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <span class="ZSS-sync-text">${e?"同步全部":"请先登录"}</span>
  `;const a=e?"ZSS-expand-btn--enabled":"ZSS-expand-btn--disabled",l=document.createElement("button");l.className=`ZSS-expand-btn ${a}`,l.disabled=!e,l.innerHTML=`
    <span class="ZSS-expand-label">更多选项</span>
    <svg class="ZSS-icon-sm ZSS-expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `,e&&(i.addEventListener("click",()=>{r.onSyncAll(i);}),l.addEventListener("click",()=>{r.onToggleExpanded(l);}));const f=document.createElement("div");f.className="ZSS-details-container",f.style.maxHeight="0",f.style.opacity="0",f.appendChild(Ts(t,e,r));const u=document.createElement("div");return u.className="ZSS-settings-wrapper",u.appendChild(ms(()=>r.onOpenSettings())),o.appendChild(i),o.appendChild(l),o.appendChild(f),o.appendChild(u),o}var X={},qe,Jt;function _s(){return Jt||(Jt=1,qe=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),qe}var je={},q={},Xt;function Q(){if(Xt)return q;Xt=1;let n;const e=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return q.getSymbolSize=function(r){if(!r)throw new Error('"version" cannot be null or undefined');if(r<1||r>40)throw new Error('"version" should be in range from 1 to 40');return r*4+17},q.getSymbolTotalCodewords=function(r){return e[r]},q.getBCHDigit=function(t){let r=0;for(;t!==0;)r++,t>>>=1;return r},q.setToSJISFunction=function(r){if(typeof r!="function")throw new Error('"toSJISFunc" is not a valid function.');n=r;},q.isKanjiModeEnabled=function(){return typeof n<"u"},q.toSJIS=function(r){return n(r)},q}var Ge={},en;function Mt(){return en||(en=1,function(n){n.L={bit:1},n.M={bit:0},n.Q={bit:3},n.H={bit:2};function e(t){if(typeof t!="string")throw new Error("Param is not a string");switch(t.toLowerCase()){case "l":case "low":return n.L;case "m":case "medium":return n.M;case "q":case "quartile":return n.Q;case "h":case "high":return n.H;default:throw new Error("Unknown EC Level: "+t)}}n.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},n.from=function(r,o){if(n.isValid(r))return r;try{return e(r)}catch{return o}};}(Ge)),Ge}var Ve,tn;function Is(){if(tn)return Ve;tn=1;function n(){this.buffer=[],this.length=0;}return n.prototype={get:function(e){const t=Math.floor(e/8);return (this.buffer[t]>>>7-e%8&1)===1},put:function(e,t){for(let r=0;r<t;r++)this.putBit((e>>>t-r-1&1)===1);},getLengthInBits:function(){return this.length},putBit:function(e){const t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++;}},Ve=n,Ve}var Ke,nn;function As(){if(nn)return Ke;nn=1;function n(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e);}return n.prototype.set=function(e,t,r,o){const s=e*this.size+t;this.data[s]=r,o&&(this.reservedBit[s]=true);},n.prototype.get=function(e,t){return this.data[e*this.size+t]},n.prototype.xor=function(e,t,r){this.data[e*this.size+t]^=r;},n.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]},Ke=n,Ke}var We={},rn;function Ms(){return rn||(rn=1,function(n){const e=Q().getSymbolSize;n.getRowColCoords=function(r){if(r===1)return [];const o=Math.floor(r/7)+2,s=e(r),i=s===145?26:Math.ceil((s-13)/(2*o-2))*2,a=[s-7];for(let l=1;l<o-1;l++)a[l]=a[l-1]-i;return a.push(6),a.reverse()},n.getPositions=function(r){const o=[],s=n.getRowColCoords(r),i=s.length;for(let a=0;a<i;a++)for(let l=0;l<i;l++)a===0&&l===0||a===0&&l===i-1||a===i-1&&l===0||o.push([s[a],s[l]]);return o};}(We)),We}var Qe={},on;function $s(){if(on)return Qe;on=1;const n=Q().getSymbolSize,e=7;return Qe.getPositions=function(r){const o=n(r);return [[0,0],[o-e,0],[0,o-e]]},Qe}var Ye={},sn;function Ls(){return sn||(sn=1,function(n){n.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};n.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},n.from=function(o){return n.isValid(o)?parseInt(o,10):void 0},n.getPenaltyN1=function(o){const s=o.size;let i=0,a=0,l=0,f=null,u=null;for(let d=0;d<s;d++){a=l=0,f=u=null;for(let g=0;g<s;g++){let h=o.get(d,g);h===f?a++:(a>=5&&(i+=e.N1+(a-5)),f=h,a=1),h=o.get(g,d),h===u?l++:(l>=5&&(i+=e.N1+(l-5)),u=h,l=1);}a>=5&&(i+=e.N1+(a-5)),l>=5&&(i+=e.N1+(l-5));}return i},n.getPenaltyN2=function(o){const s=o.size;let i=0;for(let a=0;a<s-1;a++)for(let l=0;l<s-1;l++){const f=o.get(a,l)+o.get(a,l+1)+o.get(a+1,l)+o.get(a+1,l+1);(f===4||f===0)&&i++;}return i*e.N2},n.getPenaltyN3=function(o){const s=o.size;let i=0,a=0,l=0;for(let f=0;f<s;f++){a=l=0;for(let u=0;u<s;u++)a=a<<1&2047|o.get(f,u),u>=10&&(a===1488||a===93)&&i++,l=l<<1&2047|o.get(u,f),u>=10&&(l===1488||l===93)&&i++;}return i*e.N3},n.getPenaltyN4=function(o){let s=0;const i=o.data.length;for(let l=0;l<i;l++)s+=o.data[l];return Math.abs(Math.ceil(s*100/i/5)-10)*e.N4};function t(r,o,s){switch(r){case n.Patterns.PATTERN000:return (o+s)%2===0;case n.Patterns.PATTERN001:return o%2===0;case n.Patterns.PATTERN010:return s%3===0;case n.Patterns.PATTERN011:return (o+s)%3===0;case n.Patterns.PATTERN100:return (Math.floor(o/2)+Math.floor(s/3))%2===0;case n.Patterns.PATTERN101:return o*s%2+o*s%3===0;case n.Patterns.PATTERN110:return (o*s%2+o*s%3)%2===0;case n.Patterns.PATTERN111:return (o*s%3+(o+s)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}n.applyMask=function(o,s){const i=s.size;for(let a=0;a<i;a++)for(let l=0;l<i;l++)s.isReserved(l,a)||s.xor(l,a,t(o,l,a));},n.getBestMask=function(o,s){const i=Object.keys(n.Patterns).length;let a=0,l=1/0;for(let f=0;f<i;f++){s(f),n.applyMask(f,o);const u=n.getPenaltyN1(o)+n.getPenaltyN2(o)+n.getPenaltyN3(o)+n.getPenaltyN4(o);n.applyMask(f,o),u<l&&(l=u,a=f);}return a};}(Ye)),Ye}var pe={},an;function ir(){if(an)return pe;an=1;const n=Mt(),e=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],t=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return pe.getBlocksCount=function(o,s){switch(s){case n.L:return e[(o-1)*4+0];case n.M:return e[(o-1)*4+1];case n.Q:return e[(o-1)*4+2];case n.H:return e[(o-1)*4+3];default:return}},pe.getTotalCodewordsCount=function(o,s){switch(s){case n.L:return t[(o-1)*4+0];case n.M:return t[(o-1)*4+1];case n.Q:return t[(o-1)*4+2];case n.H:return t[(o-1)*4+3];default:return}},pe}var Je={},ce={},cn;function Ns(){if(cn)return ce;cn=1;const n=new Uint8Array(512),e=new Uint8Array(256);return function(){let r=1;for(let o=0;o<255;o++)n[o]=r,e[r]=o,r<<=1,r&256&&(r^=285);for(let o=255;o<512;o++)n[o]=n[o-255];}(),ce.log=function(r){if(r<1)throw new Error("log("+r+")");return e[r]},ce.exp=function(r){return n[r]},ce.mul=function(r,o){return r===0||o===0?0:n[e[r]+e[o]]},ce}var ln;function Ps(){return ln||(ln=1,function(n){const e=Ns();n.mul=function(r,o){const s=new Uint8Array(r.length+o.length-1);for(let i=0;i<r.length;i++)for(let a=0;a<o.length;a++)s[i+a]^=e.mul(r[i],o[a]);return s},n.mod=function(r,o){let s=new Uint8Array(r);for(;s.length-o.length>=0;){const i=s[0];for(let l=0;l<o.length;l++)s[l]^=e.mul(o[l],i);let a=0;for(;a<s.length&&s[a]===0;)a++;s=s.slice(a);}return s},n.generateECPolynomial=function(r){let o=new Uint8Array([1]);for(let s=0;s<r;s++)o=n.mul(o,new Uint8Array([1,e.exp(s)]));return o};}(Je)),Je}var Xe,un;function Ds(){if(un)return Xe;un=1;const n=Ps();function e(t){this.genPoly=void 0,this.degree=t,this.degree&&this.initialize(this.degree);}return e.prototype.initialize=function(r){this.degree=r,this.genPoly=n.generateECPolynomial(this.degree);},e.prototype.encode=function(r){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(r.length+this.degree);o.set(r);const s=n.mod(o,this.genPoly),i=this.degree-s.length;if(i>0){const a=new Uint8Array(this.degree);return a.set(s,i),a}return s},Xe=e,Xe}var et={},tt={},nt={},dn;function ar(){return dn||(dn=1,nt.isValid=function(e){return !isNaN(e)&&e>=1&&e<=40}),nt}var O={},fn;function cr(){if(fn)return O;fn=1;const n="[0-9]+",e="[A-Z $%*+\\-./:]+";let t="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";t=t.replace(/u/g,"\\u");const r="(?:(?![A-Z0-9 $%*+\\-./:]|"+t+`)(?:.|[\r
]))+`;O.KANJI=new RegExp(t,"g"),O.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),O.BYTE=new RegExp(r,"g"),O.NUMERIC=new RegExp(n,"g"),O.ALPHANUMERIC=new RegExp(e,"g");const o=new RegExp("^"+t+"$"),s=new RegExp("^"+n+"$"),i=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return O.testKanji=function(l){return o.test(l)},O.testNumeric=function(l){return s.test(l)},O.testAlphanumeric=function(l){return i.test(l)},O}var hn;function Y(){return hn||(hn=1,function(n){const e=ar(),t=cr();n.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},n.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},n.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},n.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},n.MIXED={bit:-1},n.getCharCountIndicator=function(s,i){if(!s.ccBits)throw new Error("Invalid mode: "+s);if(!e.isValid(i))throw new Error("Invalid version: "+i);return i>=1&&i<10?s.ccBits[0]:i<27?s.ccBits[1]:s.ccBits[2]},n.getBestModeForData=function(s){return t.testNumeric(s)?n.NUMERIC:t.testAlphanumeric(s)?n.ALPHANUMERIC:t.testKanji(s)?n.KANJI:n.BYTE},n.toString=function(s){if(s&&s.id)return s.id;throw new Error("Invalid mode")},n.isValid=function(s){return s&&s.bit&&s.ccBits};function r(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case "numeric":return n.NUMERIC;case "alphanumeric":return n.ALPHANUMERIC;case "kanji":return n.KANJI;case "byte":return n.BYTE;default:throw new Error("Unknown mode: "+o)}}n.from=function(s,i){if(n.isValid(s))return s;try{return r(s)}catch{return i}};}(tt)),tt}var gn;function Bs(){return gn||(gn=1,function(n){const e=Q(),t=ir(),r=Mt(),o=Y(),s=ar(),i=7973,a=e.getBCHDigit(i);function l(g,h,m){for(let _=1;_<=40;_++)if(h<=n.getCapacity(_,m,g))return _}function f(g,h){return o.getCharCountIndicator(g,h)+4}function u(g,h){let m=0;return g.forEach(function(_){const p=f(_.mode,h);m+=p+_.getBitsLength();}),m}function d(g,h){for(let m=1;m<=40;m++)if(u(g,m)<=n.getCapacity(m,h,o.MIXED))return m}n.from=function(h,m){return s.isValid(h)?parseInt(h,10):m},n.getCapacity=function(h,m,_){if(!s.isValid(h))throw new Error("Invalid QR Code version");typeof _>"u"&&(_=o.BYTE);const p=e.getSymbolTotalCodewords(h),y=t.getTotalCodewordsCount(h,m),w=(p-y)*8;if(_===o.MIXED)return w;const b=w-f(_,h);switch(_){case o.NUMERIC:return Math.floor(b/10*3);case o.ALPHANUMERIC:return Math.floor(b/11*2);case o.KANJI:return Math.floor(b/13);case o.BYTE:default:return Math.floor(b/8)}},n.getBestVersionForData=function(h,m){let _;const p=r.from(m,r.M);if(Array.isArray(h)){if(h.length>1)return d(h,p);if(h.length===0)return 1;_=h[0];}else _=h;return l(_.mode,_.getLength(),p)},n.getEncodedBits=function(h){if(!s.isValid(h)||h<7)throw new Error("Invalid QR Code version");let m=h<<12;for(;e.getBCHDigit(m)-a>=0;)m^=i<<e.getBCHDigit(m)-a;return h<<12|m};}(et)),et}var rt={},mn;function Zs(){if(mn)return rt;mn=1;const n=Q(),e=1335,t=21522,r=n.getBCHDigit(e);return rt.getEncodedBits=function(s,i){const a=s.bit<<3|i;let l=a<<10;for(;n.getBCHDigit(l)-r>=0;)l^=e<<n.getBCHDigit(l)-r;return (a<<10|l)^t},rt}var ot={},st,pn;function Os(){if(pn)return st;pn=1;const n=Y();function e(t){this.mode=n.NUMERIC,this.data=t.toString();}return e.getBitsLength=function(r){return 10*Math.floor(r/3)+(r%3?r%3*3+1:0)},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(r){let o,s,i;for(o=0;o+3<=this.data.length;o+=3)s=this.data.substr(o,3),i=parseInt(s,10),r.put(i,10);const a=this.data.length-o;a>0&&(s=this.data.substr(o),i=parseInt(s,10),r.put(i,a*3+1));},st=e,st}var it,yn;function Us(){if(yn)return it;yn=1;const n=Y(),e=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function t(r){this.mode=n.ALPHANUMERIC,this.data=r;}return t.getBitsLength=function(o){return 11*Math.floor(o/2)+6*(o%2)},t.prototype.getLength=function(){return this.data.length},t.prototype.getBitsLength=function(){return t.getBitsLength(this.data.length)},t.prototype.write=function(o){let s;for(s=0;s+2<=this.data.length;s+=2){let i=e.indexOf(this.data[s])*45;i+=e.indexOf(this.data[s+1]),o.put(i,11);}this.data.length%2&&o.put(e.indexOf(this.data[s]),6);},it=t,it}var at,wn;function zs(){if(wn)return at;wn=1;const n=Y();function e(t){this.mode=n.BYTE,typeof t=="string"?this.data=new TextEncoder().encode(t):this.data=new Uint8Array(t);}return e.getBitsLength=function(r){return r*8},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(t){for(let r=0,o=this.data.length;r<o;r++)t.put(this.data[r],8);},at=e,at}var ct,Sn;function Fs(){if(Sn)return ct;Sn=1;const n=Y(),e=Q();function t(r){this.mode=n.KANJI,this.data=r;}return t.getBitsLength=function(o){return o*13},t.prototype.getLength=function(){return this.data.length},t.prototype.getBitsLength=function(){return t.getBitsLength(this.data.length)},t.prototype.write=function(r){let o;for(o=0;o<this.data.length;o++){let s=e.toSJIS(this.data[o]);if(s>=33088&&s<=40956)s-=33088;else if(s>=57408&&s<=60351)s-=49472;else throw new Error("Invalid SJIS character: "+this.data[o]+`
Make sure your charset is UTF-8`);s=(s>>>8&255)*192+(s&255),r.put(s,13);}},ct=t,ct}var lt={exports:{}},bn;function Hs(){return bn||(bn=1,function(n){var e={single_source_shortest_paths:function(t,r,o){var s={},i={};i[r]=0;var a=e.PriorityQueue.make();a.push(r,0);for(var l,f,u,d,g,h,m,_,p;!a.empty();){l=a.pop(),f=l.value,d=l.cost,g=t[f]||{};for(u in g)g.hasOwnProperty(u)&&(h=g[u],m=d+h,_=i[u],p=typeof i[u]>"u",(p||_>m)&&(i[u]=m,a.push(u,m),s[u]=f));}if(typeof o<"u"&&typeof i[o]>"u"){var y=["Could not find a path from ",r," to ",o,"."].join("");throw new Error(y)}return s},extract_shortest_path_from_predecessor_list:function(t,r){for(var o=[],s=r;s;)o.push(s),t[s],s=t[s];return o.reverse(),o},find_path:function(t,r,o){var s=e.single_source_shortest_paths(t,r,o);return e.extract_shortest_path_from_predecessor_list(s,o)},PriorityQueue:{make:function(t){var r=e.PriorityQueue,o={},s;t=t||{};for(s in r)r.hasOwnProperty(s)&&(o[s]=r[s]);return o.queue=[],o.sorter=t.sorter||r.default_sorter,o},default_sorter:function(t,r){return t.cost-r.cost},push:function(t,r){var o={value:t,cost:r};this.queue.push(o),this.queue.sort(this.sorter);},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};n.exports=e;}(lt)),lt.exports}var En;function qs(){return En||(En=1,function(n){const e=Y(),t=Os(),r=Us(),o=zs(),s=Fs(),i=cr(),a=Q(),l=Hs();function f(y){return unescape(encodeURIComponent(y)).length}function u(y,w,b){const E=[];let $;for(;($=y.exec(b))!==null;)E.push({data:$[0],index:$.index,mode:w,length:$[0].length});return E}function d(y){const w=u(i.NUMERIC,e.NUMERIC,y),b=u(i.ALPHANUMERIC,e.ALPHANUMERIC,y);let E,$;return a.isKanjiModeEnabled()?(E=u(i.BYTE,e.BYTE,y),$=u(i.KANJI,e.KANJI,y)):(E=u(i.BYTE_KANJI,e.BYTE,y),$=[]),w.concat(b,E,$).sort(function(T,x){return T.index-x.index}).map(function(T){return {data:T.data,mode:T.mode,length:T.length}})}function g(y,w){switch(w){case e.NUMERIC:return t.getBitsLength(y);case e.ALPHANUMERIC:return r.getBitsLength(y);case e.KANJI:return s.getBitsLength(y);case e.BYTE:return o.getBitsLength(y)}}function h(y){return y.reduce(function(w,b){const E=w.length-1>=0?w[w.length-1]:null;return E&&E.mode===b.mode?(w[w.length-1].data+=b.data,w):(w.push(b),w)},[])}function m(y){const w=[];for(let b=0;b<y.length;b++){const E=y[b];switch(E.mode){case e.NUMERIC:w.push([E,{data:E.data,mode:e.ALPHANUMERIC,length:E.length},{data:E.data,mode:e.BYTE,length:E.length}]);break;case e.ALPHANUMERIC:w.push([E,{data:E.data,mode:e.BYTE,length:E.length}]);break;case e.KANJI:w.push([E,{data:E.data,mode:e.BYTE,length:f(E.data)}]);break;case e.BYTE:w.push([{data:E.data,mode:e.BYTE,length:f(E.data)}]);}}return w}function _(y,w){const b={},E={start:{}};let $=["start"];for(let S=0;S<y.length;S++){const T=y[S],x=[];for(let v=0;v<T.length;v++){const I=T[v],C=""+S+v;x.push(C),b[C]={node:I,lastCount:0},E[C]={};for(let R=0;R<$.length;R++){const k=$[R];b[k]&&b[k].node.mode===I.mode?(E[k][C]=g(b[k].lastCount+I.length,I.mode)-g(b[k].lastCount,I.mode),b[k].lastCount+=I.length):(b[k]&&(b[k].lastCount=I.length),E[k][C]=g(I.length,I.mode)+4+e.getCharCountIndicator(I.mode,w));}}$=x;}for(let S=0;S<$.length;S++)E[$[S]].end=0;return {map:E,table:b}}function p(y,w){let b;const E=e.getBestModeForData(y);if(b=e.from(w,E),b!==e.BYTE&&b.bit<E.bit)throw new Error('"'+y+'" cannot be encoded with mode '+e.toString(b)+`.
 Suggested mode is: `+e.toString(E));switch(b===e.KANJI&&!a.isKanjiModeEnabled()&&(b=e.BYTE),b){case e.NUMERIC:return new t(y);case e.ALPHANUMERIC:return new r(y);case e.KANJI:return new s(y);case e.BYTE:return new o(y)}}n.fromArray=function(w){return w.reduce(function(b,E){return typeof E=="string"?b.push(p(E,null)):E.data&&b.push(p(E.data,E.mode)),b},[])},n.fromString=function(w,b){const E=d(w,a.isKanjiModeEnabled()),$=m(E),S=_($,b),T=l.find_path(S.map,"start","end"),x=[];for(let v=1;v<T.length-1;v++)x.push(S.table[T[v]].node);return n.fromArray(h(x))},n.rawSplit=function(w){return n.fromArray(d(w,a.isKanjiModeEnabled()))};}(ot)),ot}var vn;function js(){if(vn)return je;vn=1;const n=Q(),e=Mt(),t=Is(),r=As(),o=Ms(),s=$s(),i=Ls(),a=ir(),l=Ds(),f=Bs(),u=Zs(),d=Y(),g=qs();function h(S,T){const x=S.size,v=s.getPositions(T);for(let I=0;I<v.length;I++){const C=v[I][0],R=v[I][1];for(let k=-1;k<=7;k++)if(!(C+k<=-1||x<=C+k))for(let A=-1;A<=7;A++)R+A<=-1||x<=R+A||(k>=0&&k<=6&&(A===0||A===6)||A>=0&&A<=6&&(k===0||k===6)||k>=2&&k<=4&&A>=2&&A<=4?S.set(C+k,R+A,true,true):S.set(C+k,R+A,false,true));}}function m(S){const T=S.size;for(let x=8;x<T-8;x++){const v=x%2===0;S.set(x,6,v,true),S.set(6,x,v,true);}}function _(S,T){const x=o.getPositions(T);for(let v=0;v<x.length;v++){const I=x[v][0],C=x[v][1];for(let R=-2;R<=2;R++)for(let k=-2;k<=2;k++)R===-2||R===2||k===-2||k===2||R===0&&k===0?S.set(I+R,C+k,true,true):S.set(I+R,C+k,false,true);}}function p(S,T){const x=S.size,v=f.getEncodedBits(T);let I,C,R;for(let k=0;k<18;k++)I=Math.floor(k/3),C=k%3+x-8-3,R=(v>>k&1)===1,S.set(I,C,R,true),S.set(C,I,R,true);}function y(S,T,x){const v=S.size,I=u.getEncodedBits(T,x);let C,R;for(C=0;C<15;C++)R=(I>>C&1)===1,C<6?S.set(C,8,R,true):C<8?S.set(C+1,8,R,true):S.set(v-15+C,8,R,true),C<8?S.set(8,v-C-1,R,true):C<9?S.set(8,15-C-1+1,R,true):S.set(8,15-C-1,R,true);S.set(v-8,8,1,true);}function w(S,T){const x=S.size;let v=-1,I=x-1,C=7,R=0;for(let k=x-1;k>0;k-=2)for(k===6&&k--;;){for(let A=0;A<2;A++)if(!S.isReserved(I,k-A)){let H=false;R<T.length&&(H=(T[R]>>>C&1)===1),S.set(I,k-A,H),C--,C===-1&&(R++,C=7);}if(I+=v,I<0||x<=I){I-=v,v=-v;break}}}function b(S,T,x){const v=new t;x.forEach(function(A){v.put(A.mode.bit,4),v.put(A.getLength(),d.getCharCountIndicator(A.mode,S)),A.write(v);});const I=n.getSymbolTotalCodewords(S),C=a.getTotalCodewordsCount(S,T),R=(I-C)*8;for(v.getLengthInBits()+4<=R&&v.put(0,4);v.getLengthInBits()%8!==0;)v.putBit(0);const k=(R-v.getLengthInBits())/8;for(let A=0;A<k;A++)v.put(A%2?17:236,8);return E(v,S,T)}function E(S,T,x){const v=n.getSymbolTotalCodewords(T),I=a.getTotalCodewordsCount(T,x),C=v-I,R=a.getBlocksCount(T,x),k=v%R,A=R-k,H=Math.floor(v/R),oe=Math.floor(C/R),dr=oe+1,Lt=H-oe,fr=new l(Lt);let Oe=0;const fe=new Array(R),Nt=new Array(R);let Ue=0;const hr=new Uint8Array(S.buffer);for(let J=0;J<R;J++){const Fe=J<A?oe:dr;fe[J]=hr.slice(Oe,Oe+Fe),Nt[J]=fr.encode(fe[J]),Oe+=Fe,Ue=Math.max(Ue,Fe);}const ze=new Uint8Array(v);let Pt=0,U,z;for(U=0;U<Ue;U++)for(z=0;z<R;z++)U<fe[z].length&&(ze[Pt++]=fe[z][U]);for(U=0;U<Lt;U++)for(z=0;z<R;z++)ze[Pt++]=Nt[z][U];return ze}function $(S,T,x,v){let I;if(Array.isArray(S))I=g.fromArray(S);else if(typeof S=="string"){let H=T;if(!H){const oe=g.rawSplit(S);H=f.getBestVersionForData(oe,x);}I=g.fromString(S,H||40);}else throw new Error("Invalid data");const C=f.getBestVersionForData(I,x);if(!C)throw new Error("The amount of data is too big to be stored in a QR Code");if(!T)T=C;else if(T<C)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+C+`.
`);const R=b(T,x,I),k=n.getSymbolSize(T),A=new r(k);return h(A,T),m(A),_(A,T),y(A,x,0),T>=7&&p(A,T),w(A,R),isNaN(v)&&(v=i.getBestMask(A,y.bind(null,A,x))),i.applyMask(v,A),y(A,x,v),{modules:A,version:T,errorCorrectionLevel:x,maskPattern:v,segments:I}}return je.create=function(T,x){if(typeof T>"u"||T==="")throw new Error("No input text");let v=e.M,I,C;return typeof x<"u"&&(v=e.from(x.errorCorrectionLevel,e.M),I=f.from(x.version),C=i.from(x.maskPattern),x.toSJISFunc&&n.setToSJISFunction(x.toSJISFunc)),$(T,I,v,C)},je}var ut={},dt={},Cn;function lr(){return Cn||(Cn=1,function(n){function e(t){if(typeof t=="number"&&(t=t.toString()),typeof t!="string")throw new Error("Color should be defined as hex string");let r=t.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+t);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(s){return [s,s]}))),r.length===6&&r.push("F","F");const o=parseInt(r.join(""),16);return {r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+r.slice(0,6).join("")}}n.getOptions=function(r){r||(r={}),r.color||(r.color={});const o=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,s=r.width&&r.width>=21?r.width:void 0,i=r.scale||4;return {width:s,scale:s?4:i,margin:o,color:{dark:e(r.color.dark||"#000000ff"),light:e(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},n.getScale=function(r,o){return o.width&&o.width>=r+o.margin*2?o.width/(r+o.margin*2):o.scale},n.getImageWidth=function(r,o){const s=n.getScale(r,o);return Math.floor((r+o.margin*2)*s)},n.qrToImageData=function(r,o,s){const i=o.modules.size,a=o.modules.data,l=n.getScale(i,s),f=Math.floor((i+s.margin*2)*l),u=s.margin*l,d=[s.color.light,s.color.dark];for(let g=0;g<f;g++)for(let h=0;h<f;h++){let m=(g*f+h)*4,_=s.color.light;if(g>=u&&h>=u&&g<f-u&&h<f-u){const p=Math.floor((g-u)/l),y=Math.floor((h-u)/l);_=d[a[p*i+y]?1:0];}r[m++]=_.r,r[m++]=_.g,r[m++]=_.b,r[m]=_.a;}};}(dt)),dt}var kn;function Gs(){return kn||(kn=1,function(n){const e=lr();function t(o,s,i){o.clearRect(0,0,s.width,s.height),s.style||(s.style={}),s.height=i,s.width=i,s.style.height=i+"px",s.style.width=i+"px";}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}n.render=function(s,i,a){let l=a,f=i;typeof l>"u"&&(!i||!i.getContext)&&(l=i,i=void 0),i||(f=r()),l=e.getOptions(l);const u=e.getImageWidth(s.modules.size,l),d=f.getContext("2d"),g=d.createImageData(u,u);return e.qrToImageData(g.data,s,l),t(d,f,u),d.putImageData(g,0,0),f},n.renderToDataURL=function(s,i,a){let l=a;typeof l>"u"&&(!i||!i.getContext)&&(l=i,i=void 0),l||(l={});const f=n.render(s,i,l),u=l.type||"image/png",d=l.rendererOpts||{};return f.toDataURL(u,d.quality)};}(ut)),ut}var ft={},xn;function Vs(){if(xn)return ft;xn=1;const n=lr();function e(o,s){const i=o.a/255,a=s+'="'+o.hex+'"';return i<1?a+" "+s+'-opacity="'+i.toFixed(2).slice(1)+'"':a}function t(o,s,i){let a=o+s;return typeof i<"u"&&(a+=" "+i),a}function r(o,s,i){let a="",l=0,f=false,u=0;for(let d=0;d<o.length;d++){const g=Math.floor(d%s),h=Math.floor(d/s);!g&&!f&&(f=true),o[d]?(u++,d>0&&g>0&&o[d-1]||(a+=f?t("M",g+i,.5+h+i):t("m",l,0),l=0,f=false),g+1<s&&o[d+1]||(a+=t("h",u),u=0)):l++;}return a}return ft.render=function(s,i,a){const l=n.getOptions(i),f=s.modules.size,u=s.modules.data,d=f+l.margin*2,g=l.color.light.a?"<path "+e(l.color.light,"fill")+' d="M0 0h'+d+"v"+d+'H0z"/>':"",h="<path "+e(l.color.dark,"stroke")+' d="'+r(u,f,l.margin)+'"/>',m='viewBox="0 0 '+d+" "+d+'"',p='<svg xmlns="http://www.w3.org/2000/svg" '+(l.width?'width="'+l.width+'" height="'+l.width+'" ':"")+m+' shape-rendering="crispEdges">'+g+h+`</svg>
`;return typeof a=="function"&&a(null,p),p},ft}var Tn;function Ks(){if(Tn)return X;Tn=1;const n=_s(),e=js(),t=Gs(),r=Vs();function o(s,i,a,l,f){const u=[].slice.call(arguments,1),d=u.length,g=typeof u[d-1]=="function";if(!g&&!n())throw new Error("Callback required as last argument");if(g){if(d<2)throw new Error("Too few arguments provided");d===2?(f=a,a=i,i=l=void 0):d===3&&(i.getContext&&typeof f>"u"?(f=l,l=void 0):(f=l,l=a,a=i,i=void 0));}else {if(d<1)throw new Error("Too few arguments provided");return d===1?(a=i,i=l=void 0):d===2&&!i.getContext&&(l=a,a=i,i=void 0),new Promise(function(h,m){try{const _=e.create(a,l);h(s(_,i,l));}catch(_){m(_);}})}try{const h=e.create(a,l);f(null,s(h,i,l));}catch(h){f(h);}}return X.create=e.create,X.toCanvas=o.bind(null,t.render),X.toDataURL=o.bind(null,t.renderToDataURL),X.toString=o.bind(null,function(s,i,a){return r.render(s,a)}),X}var Ws=Ks();const bt=180,Qs="二维码加载失败，请重试",$t={Created:"请使用米游社 App 扫描二维码",Scanned:"已扫码，请在手机上确认",Confirmed:"登录成功，正在刷新…"},Rn={qrcode:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'};function _n(n){return `<span class="ZSS-icon">${n}</span>`}function Et(n){const e=n.getContext("2d");e&&(e.fillStyle="#ffffff",e.fillRect(0,0,n.width,n.height));}function Ys(n){const t=Number(n.dataset.renderToken||"0")+1;return n.dataset.renderToken=String(t),t}function In(n,e){return n.dataset.renderToken===String(e)}async function ur(n,e){const t=Ys(n.qrImage);Et(n.qrImage);try{if(await Ws.toCanvas(n.qrImage,e,{width:bt,margin:1,errorCorrectionLevel:"L"}),!In(n.qrImage,t))return}catch(r){if(!In(n.qrImage,t))return;Et(n.qrImage),n.statusText.textContent=Qs,n.statusText.classList.remove("ZSS-qr-status--success"),c.error("二维码渲染失败:",r);}}function Js(n,e){const t=document.createElement("div");t.className="ZSS-modal-overlay",t.setAttribute("data-seelie-qr-modal","true");const r=document.createElement("div");r.className="ZSS-modal-dialog";const o=document.createElement("div");o.className="ZSS-modal-header";const s=document.createElement("div");s.className="ZSS-modal-title",s.innerHTML=`${_n(Rn.qrcode)}扫码登录`;const i=document.createElement("button");i.type="button",i.className="ZSS-modal-close",i.innerHTML=_n(Rn.close),i.addEventListener("click",e),o.append(s,i);const a=document.createElement("div");a.className="ZSS-modal-body",a.style.alignItems="center";const l=document.createElement("canvas");l.className="ZSS-qr-image",l.width=bt,l.height=bt,l.setAttribute("aria-label","扫码登录二维码"),Et(l);const f=document.createElement("div");f.className="ZSS-qr-status",f.textContent=$t.Created,a.append(l,f);const u=document.createElement("div");u.className="ZSS-modal-footer";const d=document.createElement("button");d.type="button",d.className="ZSS-modal-footer-btn",d.textContent="取消",d.addEventListener("click",e),u.appendChild(d),r.append(o,a,u),t.appendChild(r),t.addEventListener("click",h=>{h.target===t&&e();}),r.addEventListener("click",h=>h.stopPropagation()),requestAnimationFrame(()=>t.classList.add("ZSS-open"));const g={overlay:t,qrImage:l,statusText:f};return ur(g,n.url),g}function Xs(n,e){n.statusText.textContent=$t[e]||e,e==="Confirmed"&&n.statusText.classList.add("ZSS-qr-status--success");}function ei(n,e){n.statusText.textContent=$t.Created,n.statusText.classList.remove("ZSS-qr-status--success"),ur(n,e.url);}const An="ZSS-panel-style",G="cubic-bezier(.4,0,.2,1)";function ti(){if(document.getElementById(An))return;const n=document.createElement("style");n.id=An,n.textContent=`
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
  transition-timing-function: ${G};
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
  transition-timing-function: ${G};
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
  transition-timing-function: ${G};
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
  transition-timing-function: ${G};
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
  transition-timing-function: ${G};
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
  transition-timing-function: ${G};
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
  transition: color .2s ${G};
}

.ZSS-qr-status--success {
  color: rgb(52 211 153);
}

  `,(document.head||document.documentElement).appendChild(n);}const ni="https://act.mihoyo.com/zzz/gt/character-builder-h#/",ri="zzz-seelie-mys-auth",oi=1120,si=900;class K{container=null;userInfo=null;isLoading=false;isExpanded=false;mysPopupCloseWatcher=null;settingsModal=null;settingsModalKeydownHandler=null;qrLoginCancelFn=null;qrLoginModal=null;qrLoginKeydownHandler=null;qrLoginGeneration=0;static TARGET_SELECTOR="div.flex.flex-col.items-center.justify-center.w-full.mt-3";static PANEL_SELECTOR='[data-seelie-panel="true"]';constructor(){}async init(){try{await this.createPanel();}catch(e){throw c.error("初始化 Seelie 面板失败:",e),e}}async createPanel(){const e=document.querySelector(K.TARGET_SELECTOR);if(!e)throw new Error("目标容器未找到");const t=e.querySelector(K.PANEL_SELECTOR);if(t&&(t.remove(),c.debug("清理了目标容器中的旧面板")),this.container&&e.contains(this.container)){c.debug("面板已存在，跳过创建");return}await this.loadUserInfo(),this.container=this.createPanelElement(),e.insertBefore(this.container,e.firstChild),c.info("✅ Seelie 面板创建成功");}async loadUserInfo(){try{this.userInfo=await eo(),c.debug("用户信息加载成功:",this.userInfo);}catch(e){c.error("加载用户信息失败:",e),M("用户信息加载失败，部分同步功能可能不可用","warning"),this.userInfo=bs(e);}}createPanelElement(){ti();const e=document.createElement("div");e.className="ZSS-panel",e.setAttribute("data-seelie-panel","true");const t=xs(this.userInfo,{onOpenMys:()=>this.openMysPopup(),onRetry:()=>this.refreshUserInfo(),onStartQRLogin:()=>this.startQRLogin()}),r=this.createSyncSection();return e.appendChild(t),e.appendChild(r),e}openSettingsModal(){if(!this.container||this.settingsModal)return;const e=ps({onToggleAdCleaner:t=>{fs(t),M(`脚本去广告已${t?"开启":"关闭"}，如未生效可刷新页面`,"success");},onCopyUBlockRules:async()=>hs(),onResetDevice:()=>this.handleResetDeviceInfo(),onClose:()=>this.closeSettingsModal()});this.settingsModal=e,document.body.appendChild(e),this.settingsModalKeydownHandler=t=>{t.key==="Escape"&&this.closeSettingsModal();},window.addEventListener("keydown",this.settingsModalKeydownHandler);}closeSettingsModal(){if(this.settingsModal){this.settingsModal.classList.remove("ZSS-open");const e=this.settingsModal;setTimeout(()=>e.remove(),300),this.settingsModal=null;}this.settingsModalKeydownHandler&&(window.removeEventListener("keydown",this.settingsModalKeydownHandler),this.settingsModalKeydownHandler=null);}openMysPopup(){const e=Math.min(oi,window.outerWidth),t=Math.min(si,window.outerHeight),r=typeof window.screenLeft=="number"?window.screenLeft:window.screenX,o=typeof window.screenTop=="number"?window.screenTop:window.screenY,s=r+Math.round((window.outerWidth-e)/2),i=o+Math.round((window.outerHeight-t)/2),a=window.open(ni,ri,`popup=yes,resizable=yes,scrollbars=yes,width=${e},height=${t},left=${s},top=${i}`);if(!a){M("登录弹窗被拦截，请允许弹窗后重试","warning");return}try{a.focus();}catch(l){c.warn("弹窗聚焦失败，但登录窗口已打开:",l);}this.startMysPopupCloseWatcher(a);}startMysPopupCloseWatcher(e){this.stopMysPopupCloseWatcher(),this.mysPopupCloseWatcher=window.setInterval(()=>{e.closed&&(this.stopMysPopupCloseWatcher(),c.info("检测到米游社弹窗关闭，刷新页面以更新登录状态"),window.location.reload());},500);}stopMysPopupCloseWatcher(){this.mysPopupCloseWatcher!==null&&(window.clearInterval(this.mysPopupCloseWatcher),this.mysPopupCloseWatcher=null);}async startQRLogin(){if(!this.container)return;this.cancelQRLogin();const e=++this.qrLoginGeneration;try{const t=await qn();if(this.qrLoginGeneration!==e||!this.container)return;const r=Js(t,()=>{this.cancelQRLogin(),this.refreshUserInfo();});this.qrLoginModal=r.overlay,document.body.appendChild(this.qrLoginModal),this.qrLoginKeydownHandler=o=>{o.key==="Escape"&&(this.cancelQRLogin(),this.refreshUserInfo());},window.addEventListener("keydown",this.qrLoginKeydownHandler),this.qrLoginCancelFn=Wr(t.ticket,{onStatusChange:o=>{Xs(r,o),o==="Scanned"&&c.info("扫码登录：用户已扫码，等待确认");},onQRExpired:o=>{ei(r,o),c.info("扫码登录：二维码已过期，已自动刷新"),M("二维码已过期，已自动刷新","warning");},onComplete:o=>{this.qrLoginCancelFn=null,this.closeQRLoginModal(),c.info("扫码登录成功，刷新面板"),M("登录成功","success"),to(o),this.refreshUserInfo();},onError:o=>{this.qrLoginCancelFn=null,this.closeQRLoginModal(),c.error("扫码登录失败:",o),M("扫码登录失败，请重试","error"),this.refreshUserInfo();}});}catch(t){c.error("启动扫码登录失败:",t),M("无法创建二维码，请重试","error");}}closeQRLoginModal(){if(this.qrLoginModal){this.qrLoginModal.classList.remove("ZSS-open");const e=this.qrLoginModal;setTimeout(()=>e.remove(),300),this.qrLoginModal=null;}this.qrLoginKeydownHandler&&(window.removeEventListener("keydown",this.qrLoginKeydownHandler),this.qrLoginKeydownHandler=null);}cancelQRLogin(){this.qrLoginCancelFn&&(this.qrLoginCancelFn(),this.qrLoginCancelFn=null),this.closeQRLoginModal();}createSyncSection(){const e=!!this.userInfo&&!("error"in this.userInfo),t={resin:r=>this.handleSyncResin(r),characters:r=>this.handleSyncCharacters(r),items:r=>this.handleSyncItems(r),reset_device:r=>this.handleResetDeviceInfo(r)};return Rs({isUserInfoValid:e,syncOptions:Es,actions:{onSyncAll:r=>this.handleSyncAll(r),onToggleExpanded:r=>this.toggleExpanded(r),onSyncAction:(r,o)=>t[r](o),onOpenSettings:()=>this.openSettingsModal()}})}toggleExpanded(e){if(this.isLoading)return;this.isExpanded=!this.isExpanded;const t=this.container?.querySelector(".ZSS-details-container"),r=e.querySelector(".ZSS-expand-icon");!t||!r||(this.isExpanded?(t.style.maxHeight="200px",t.style.opacity="1",r.style.transform="rotate(180deg)"):(t.style.maxHeight="0",t.style.opacity="0",r.style.transform="rotate(0deg)"));}async handleSyncAll(e){this.isLoading||!e&&(e=this.container?.querySelector('[data-sync-main="true"]'),!e)||await this.performSyncOperation(e,"同步中...",async()=>this.performSync());}async handleSyncResin(e){await this.handleSyncActionFromEvent(e,"同步中...","同步电量数据",async()=>{const t=await ge.syncResinData();return {status:t?"success":"error",message:t?"电量同步完成":"电量同步失败"}});}async handleSyncCharacters(e){await this.handleSyncActionFromEvent(e,"同步中...","同步角色数据",async()=>{const t=await ge.syncAllCharacters();return t.success===0?{status:"error",message:"角色同步失败"}:t.failed>0?{status:"warning",message:`角色同步部分完成：成功 ${t.success}，失败 ${t.failed}`}:{status:"success",message:`角色同步完成：成功 ${t.success}`}});}async handleSyncItems(e){await this.handleSyncActionFromEvent(e,"同步中...","同步材料数据",async()=>{const t=await ge.syncItemsData();return t.success?t.partial?{status:"warning",message:`养成材料同步部分完成：成功 ${t.successNum}，失败 ${t.failNum}`}:{status:"success",message:`养成材料同步完成：成功 ${t.successNum}，失败 ${t.failNum}`}:{status:"error",message:"养成材料同步失败"}});}async handleResetDeviceInfo(e){if(!e){try{await Zt(),M("设备信息已重置","success"),c.info("设备信息重置完成");}catch(t){M("设备信息重置失败","error"),c.error("设备信息重置失败:",t);}return}await this.handleSyncActionFromEvent(e,"重置中...","重置设备信息",async()=>{try{return await Zt(),M("设备信息已重置","success"),{status:"success",message:"设备信息重置完成"}}catch(t){return M("设备信息重置失败","error"),c.error("设备信息重置失败:",t),{status:"error",message:"设备信息重置失败"}}});}async performSyncOperation(e,t,r){if(this.isLoading)return;this.isLoading=true;const o=e.querySelector(".ZSS-sync-text");if(!o){this.isLoading=false;return}const s=o.textContent;try{this.setAllButtonsDisabled(!0),o.textContent=t;const i=e.querySelector("svg");i&&i.classList.add("ZSS-animate-spin");const a=await r();a.status==="success"?c.info(a.message):(a.status,c.warn(a.message)),this.showSyncResult(e,o,s,i,a.status);}catch(i){c.error("同步失败:",i);const a=e.querySelector("svg");this.showSyncResult(e,o,s,a,"error");}}getButtonFromEvent(e){return e?.target?.closest("button")||null}async handleSyncActionFromEvent(e,t,r,o){const s=this.getButtonFromEvent(e);s&&await this.performSyncOperation(s,t,async()=>{const i=await o();return i.status==="warning"&&c.warn(`${r}部分完成`),i});}async performSync(){try{c.info("开始执行完整同步...");const e=await ge.syncAll(),t=Cs(e),r={summary:t.summary,detail:t.details};return t.status==="success"?(c.info("完整同步成功",r),{status:"success",message:t.summary}):t.status==="partial"?(c.warn("完整同步部分完成",r),{status:"warning",message:t.summary}):(c.error("完整同步失败",r),{status:"error",message:t.summary})}catch(e){return c.error("同步操作失败:",e),{status:"error",message:"同步失败，请稍后重试"}}}setAllButtonsDisabled(e){if(!this.container)return;this.container.querySelectorAll("button").forEach(r=>{r.disabled=e;});}showSyncResult(e,t,r,o,s){const i={success:"同步完成",warning:"部分完成",error:"同步失败"},a={success:"ZSS-sync-state-success",warning:"ZSS-sync-state-warning",error:"ZSS-sync-state-error"},l=Object.values(a),f=a[s];t.textContent=i[s],e.classList.remove(...l),e.classList.add(f),setTimeout(()=>{t.textContent=r||"同步全部",e.classList.remove(f),o&&o.classList.remove("ZSS-animate-spin"),this.setAllButtonsDisabled(false),this.isLoading=false;},2e3);}destroy(){this.stopMysPopupCloseWatcher(),this.closeSettingsModal(),this.cancelQRLogin(),this.closeQRLoginModal(),this.container&&this.container.parentNode&&(this.container.parentNode.removeChild(this.container),this.container=null),document.querySelectorAll(K.PANEL_SELECTOR).forEach(t=>{t.parentNode&&t.parentNode.removeChild(t);}),c.debug("Seelie 面板已销毁");}async refresh(){await this.refreshUserInfo();}async refreshUserInfo(){try{if(!this.container)return;this.cancelQRLogin(),await this.loadUserInfo();const e=this.createPanelElement();this.container.replaceWith(e),this.container=e;}catch(e){c.error("刷新用户信息失败:",e);}}}function ii(){const n={id:"seelie-panel",targetSelector:K.TARGET_SELECTOR,componentSelector:K.PANEL_SELECTOR};gt.register(n,()=>new K),c.debug("📝 Seelie 面板组件注册完成");}function ai(){c.info("🎯 开始注册所有组件"),ii(),c.info("✅ 所有组件注册完成");}function ci(){c.info("🎯 zzz-seelie-sync 脚本已加载"),gs(),li(()=>{ui();});}function li(n){if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",n,{once:true});return}n();}function ui(){try{if(gt.isInit()){c.debug("DOM 注入管理器已初始化，跳过");return}ai(),gt.init(),c.info("✅ DOM 注入管理器初始化完成");}catch(n){c.error("❌ 初始化 DOM 注入管理器失败:",n);}}function di(){if(typeof window>"u")return;const n=false;Reflect.set(window,"__ZSS_DEV__",n),Reflect.set(window,"isZssDevEnvironment",()=>n);}di();ci();

})();