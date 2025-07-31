#!/usr/bin/env node
// tools/update-and-restore.js

const fs = require('fs/promises');
const path = require('path');

// --- 配置区 ---
const SEELIE_BASE_URL = 'https://seelie.me';
// 锚点关键词，用于智能识别绝区零数据块
const UNIQUE_ZZZ_KEYS = ['denny', 'w_engine', 'drive_disc'];
// 最终输出文件路径
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const OUTPUT_FILE_PATH = path.join(OUTPUT_DIR, 'seelie-zh.json');


/**
 * 使用内置的 fetch API 获取网络内容
 * @param {string} url - 要获取的 URL
 * @returns {Promise<string>} - 返回页面或文件的文本内容
 */
async function fetchContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`请求失败，状态码: ${response.status} - ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        throw new Error(`获取 ${url} 时网络错误: ${error.message}`);
    }
}

/**
 * 还原绝区零数据并保存
 * @param {string} jsContent - 包含所有数据的 JS 文件内容
 */
function restoreAndSave(jsContent) {
    console.log('▶️  开始从 JS 内容中还原绝区零数据...');
    
    // 1. 解析所有导出的变量
    const exportMatch = jsContent.match(/\bexport\s*\{([\s\S]*?)\}/);
    if (!exportMatch) {
        throw new Error('在JS文件中未找到 export 语句。');
    }
    
    const exportedVars = exportMatch[1]
        .split(',')
        .map(s => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);

    let executionCode = jsContent.replace(/\bexport\s*\{[\s\S]*?};/, '');
    executionCode += `\n\n// Appended by script\nreturn { ${exportedVars.map(v => `${v}: ${v}`).join(', ')} };`;

    let zzzDataObject = null;
    try {
        const scriptRunner = new Function(executionCode);
        const allDataBlocks = scriptRunner();
        
        // 2. 智能搜索正确的数据块
        console.log(`🔍 正在 ${Object.keys(allDataBlocks).length} 个数据块中搜索绝区零数据...`);
        for (const blockName in allDataBlocks) {
            const block = allDataBlocks[blockName];
            if (!block || typeof block !== 'object') continue;

            const sources = [block.default, block]; // 检查 .default 和对象本身
            for (const source of sources) {
                if (source && typeof source === 'object' && UNIQUE_ZZZ_KEYS.some(key => key in source)) {
                    console.log(`🎯 命中！在变量 '${blockName}' 中找到关键词。`);
                    zzzDataObject = source;
                    break;
                }
            }
            if (zzzDataObject) break;
        }

        if (!zzzDataObject) {
            throw new Error(`未能在任何数据块中找到绝区零的锚点关键词。`);
        }

    } catch (error) {
        throw new Error(`还原数据时发生错误: ${error.message}`);
    }

    // 3. 格式化为 JSON 并保存
    const finalJson = JSON.stringify(zzzDataObject, null, 2);
    console.log(`✅ 还原成功！正在保存文件...`);
    return finalJson;
}


/**
 * 主执行函数
 */
async function main() {
    try {
        // 1. 获取主页，找到 index-....js
        console.log('第一步：获取 Seelie.me 主页...');
        const mainPageHtml = await fetchContent(SEELIE_BASE_URL);
        const indexScriptMatch = mainPageHtml.match(/\/assets\/index-([a-f0-9]+)\.js/);
        if (!indexScriptMatch) throw new Error('在主页HTML中未找到 index-....js 脚本。');
        
        const indexScriptUrl = `${SEELIE_BASE_URL}${indexScriptMatch[0]}`;
        console.log(`第二步：发现主脚本 -> ${indexScriptUrl}`);
        
        // 2. 获取主脚本，找到 strings-zh-....js
        const indexScriptContent = await fetchContent(indexScriptUrl);
        const stringsFileMatch = indexScriptContent.match(/strings-zh-([a-f0-9]+)\.js/);
        if (!stringsFileMatch) throw new Error('在主脚本中未找到 strings-zh-....js 语言包。');
        
        const stringsFileUrl = `${SEELIE_BASE_URL}/assets/locale/${stringsFileMatch[0]}`;
        console.log(`第三步：发现中文语言包 -> ${stringsFileUrl}`);
        
        // 3. 获取语言包内容
        const stringsFileContent = await fetchContent(stringsFileUrl);
        console.log(`✅ 中文语言包内容下载成功。`);
        
        // 4. 还原并保存
        const jsonData = restoreAndSave(stringsFileContent);
        
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        await fs.writeFile(OUTPUT_FILE_PATH, jsonData, 'utf-8');
        
        console.log(`\n🎉 全部处理完成！最终文件已保存至: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error(`\n❌ 自动化流程失败: ${error.message}`);
        process.exit(1); // 失败时退出，以便 GitHub Action 知道任务失败
    }
}

// 运行主函数
main();