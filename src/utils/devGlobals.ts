/**
 * DEV 环境全局调试挂载工具
 * 统一处理 window 类型断言与挂载逻辑，避免各模块重复样板代码
 */
export function exposeDevGlobals(globals: Record<string, unknown>): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  for (const [key, value] of Object.entries(globals)) {
    Reflect.set(window, key, value);
  }
}

type RuntimeModule = Record<string, unknown>;
type ModuleLoader = () => Promise<unknown>;

interface ExportLookupResult {
  modules: string[];
  values: unknown[];
}

interface DevModuleRegistry {
  modules: Record<string, RuntimeModule>;
  modulePaths: string[];
  uniqueExports: Record<string, unknown>;
  duplicateExports: Record<string, string[]>;
  getModule: (modulePath: string) => RuntimeModule | undefined;
  findExport: (exportName: string) => ExportLookupResult | null;
}

const DEV_GLOBAL_MODULE_SKIP_LIST = new Set<string>([
  'src/main.ts',
]);

let devRegistryExposed = false;
let devRegistryExposePromise: Promise<void> | null = null;

function normalizeModulePath(modulePath: string): string {
  return modulePath
    .replace(/\\/g, '/')
    .replace(/^\.\.\//, 'src/');
}

function shouldSkipModule(modulePath: string): boolean {
  const normalizedPath = normalizeModulePath(modulePath);
  return normalizedPath.endsWith('.d.ts') || DEV_GLOBAL_MODULE_SKIP_LIST.has(normalizedPath);
}

function getRuntimeExports(moduleNamespace: unknown): RuntimeModule {
  if (!moduleNamespace || typeof moduleNamespace !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(moduleNamespace as RuntimeModule).filter(([exportName, exportValue]) => (
      exportName !== '__esModule' && exportValue !== undefined
    ))
  );
}

function buildDevModuleRegistry(modules: Record<string, RuntimeModule>): DevModuleRegistry {
  const uniqueExports: Record<string, unknown> = {};
  const duplicateExports: Record<string, string[]> = {};
  const exportToModules = new Map<string, string[]>();
  const modulePaths = Object.keys(modules).sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));

  for (const modulePath of modulePaths) {
    const moduleExports = modules[modulePath];
    for (const [exportName, exportValue] of Object.entries(moduleExports)) {
      const existingModules = exportToModules.get(exportName);
      if (!existingModules) {
        exportToModules.set(exportName, [modulePath]);
        uniqueExports[exportName] = exportValue;
        continue;
      }

      existingModules.push(modulePath);
      duplicateExports[exportName] = [...existingModules];
      delete uniqueExports[exportName];
    }
  }

  return {
    modules,
    modulePaths,
    uniqueExports,
    duplicateExports,
    getModule: (modulePath: string) => modules[modulePath],
    findExport: (exportName: string): ExportLookupResult | null => {
      const resolvedModules = exportToModules.get(exportName);
      if (!resolvedModules || resolvedModules.length === 0) {
        return null;
      }

      return {
        modules: [...resolvedModules],
        values: resolvedModules.map((modulePath) => modules[modulePath][exportName]),
      };
    },
  };
}

function resolveBusinessDomain(modulePath: string): string {
  if (modulePath.startsWith('src/api/')) {
    return 'api';
  }
  if (modulePath.startsWith('src/services/')) {
    return 'sync';
  }
  if (modulePath.startsWith('src/utils/seelie/')) {
    return 'seelie';
  }
  if (modulePath.startsWith('src/components/')) {
    return 'panel';
  }
  if (
    modulePath.startsWith('src/utils/adCleaner')
    || modulePath === 'src/utils/siteManifest.ts'
  ) {
    return 'adCleaner';
  }
  if (modulePath === 'src/app.ts') {
    return 'app';
  }
  if (modulePath.startsWith('src/utils/')) {
    return 'runtime';
  }
  return 'other';
}

function buildDomainRegistries(modules: Record<string, RuntimeModule>): Record<string, DevModuleRegistry> {
  const modulesByDomain: Record<string, Record<string, RuntimeModule>> = {};

  for (const [modulePath, moduleExports] of Object.entries(modules)) {
    const domain = resolveBusinessDomain(modulePath);
    if (!modulesByDomain[domain]) {
      modulesByDomain[domain] = {};
    }
    modulesByDomain[domain][modulePath] = moduleExports;
  }

  const registries: Record<string, DevModuleRegistry> = {};
  for (const domain of Object.keys(modulesByDomain).sort((left, right) => left.localeCompare(right))) {
    registries[domain] = buildDevModuleRegistry(modulesByDomain[domain]);
  }

  return registries;
}

/**
 * DEV 环境下将项目所有运行时模块统一挂载到全局对象，便于调试定位。
 */
export async function exposeAllModulesAsDevGlobals(): Promise<void> {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  if (devRegistryExposed) {
    return;
  }

  if (devRegistryExposePromise) {
    await devRegistryExposePromise;
    return;
  }

  devRegistryExposePromise = (async () => {
    const moduleLoaders = import.meta.glob('../**/*.ts') as Record<string, ModuleLoader>;
    const modulesByPath: Record<string, RuntimeModule> = {};
    const moduleEntries = Object.entries(moduleLoaders)
      .filter(([modulePath]) => !shouldSkipModule(modulePath))
      .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath));

    for (const [rawModulePath, loadModule] of moduleEntries) {
      const normalizedModulePath = normalizeModulePath(rawModulePath);
      try {
        const moduleNamespace = await loadModule();
        const runtimeExports = getRuntimeExports(moduleNamespace);
        if (Object.keys(runtimeExports).length > 0) {
          modulesByPath[normalizedModulePath] = runtimeExports;
        }
      } catch (error) {
        modulesByPath[normalizedModulePath] = {
          __loadError: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const registry = buildDevModuleRegistry(modulesByPath);
    const domainRegistries = buildDomainRegistries(modulesByPath);
    const domainAliasExports: Record<string, Record<string, unknown>> = {};
    const domainModules: Record<string, Record<string, RuntimeModule>> = {};
    const domainModulePaths: Record<string, string[]> = {};
    const domainDuplicateExports: Record<string, Record<string, string[]>> = {};

    for (const [domain, domainRegistry] of Object.entries(domainRegistries)) {
      domainAliasExports[domain] = domainRegistry.uniqueExports;
      domainModules[domain] = domainRegistry.modules;
      domainModulePaths[domain] = domainRegistry.modulePaths;
      domainDuplicateExports[domain] = domainRegistry.duplicateExports;
    }

    exposeDevGlobals({
      zssDevModules: registry.modules,
      zssDevModulePaths: registry.modulePaths,
      zssDevExports: registry.uniqueExports,
      zssDevDuplicateExports: registry.duplicateExports,
      getZssDevModule: registry.getModule,
      findZssDevExport: registry.findExport,
      zssDev: domainAliasExports,
      zssDevDomainModules: domainModules,
      zssDevDomainModulePaths: domainModulePaths,
      zssDevDomainDuplicateExports: domainDuplicateExports,
      getZssDevDomain: (domain: string) => domainRegistries[domain],
      findZssDevExportInDomain: (domain: string, exportName: string): ExportLookupResult | null => {
        const domainRegistry = domainRegistries[domain];
        if (!domainRegistry) {
          return null;
        }
        return domainRegistry.findExport(exportName);
      },
    });

    devRegistryExposed = true;
  })();

  await devRegistryExposePromise;
}
