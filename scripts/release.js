#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ 版本类型必须是 patch, minor, 或 major');
  process.exit(1);
}

try {
  console.log(`🚀 开始发布 ${versionType} 版本...`);

  // 检查工作区是否干净
  try {
    execSync('git diff --exit-code', { stdio: 'ignore' });
    execSync('git diff --cached --exit-code', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ 工作区不干净，请先提交所有更改');
    process.exit(1);
  }

  // 更新版本号
  console.log('📝 更新版本号...');
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

  // 读取新版本号
  const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
  const newVersion = packageJson.version;
  console.log(`✅ 版本号已更新为: ${newVersion}`);

  // 提交更改
  console.log('📦 提交版本更改...');
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });

  // 创建标签
  console.log('🏷️  创建 Git 标签...');
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  // 推送到远程
  console.log('🚀 推送到远程仓库...');
  execSync('git push', { stdio: 'inherit' });
  execSync('git push --tags', { stdio: 'inherit' });

  console.log(`🎉 版本 v${newVersion} 发布成功！`);
  console.log('📋 GitHub Actions 将自动构建并创建 Release');

} catch (error) {
  console.error('❌ 发布失败:', error.message);
  process.exit(1);
}