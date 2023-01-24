import chalk from 'chalk';
import { Table } from 'console-table-printer';
import path from 'path';
import { retrieveManifest } from '../scriptUtils.js';
export const divideAndRound = (dividend, divisor, round = 2) => (dividend / divisor).toFixed(round);
export const fileSizeFormatter = (size) => {
    size /= 1000;
    if (size < 0.01)
        return '<0.01 KB';
    if (size >= 100)
        return `${divideAndRound(size, 1000)} MB`;
    return `${size.toFixed(2)} KB`;
};
/**
 * Check for bundles or tabs that don't exist. If either bundles or tabs were not
 * given, then load them from the manifest
 */
export const retrieveBundlesAndTabs = async (manifestFile, modules, tabOpts) => {
    const manifest = await retrieveManifest(manifestFile);
    const knownBundles = Object.keys(manifest);
    const knownTabs = Object.values(manifest)
        .flatMap((x) => x.tabs);
    let bundles;
    let tabs;
    if (modules !== null) {
        // Some modules were specified
        const unknownModules = modules.filter((m) => !knownBundles.includes(m));
        if (unknownModules.length > 0) {
            throw new Error(`Unknown modules: ${unknownModules.join(', ')}`);
        }
        bundles = modules;
        // If a bundle is being rebuilt, add its tabs
        tabs = modules.flatMap((bundle) => manifest[bundle].tabs);
        if (tabOpts) {
            // Tabs were specified
            const unknownTabs = tabOpts.filter((t) => !knownTabs.includes(t));
            if (unknownTabs.length > 0) {
                throw new Error(`Unknown tabs: ${unknownTabs.join(', ')}`);
            }
            tabs = tabs.concat(tabOpts);
        }
        else {
            // No tabs were specified
            tabs = knownTabs;
        }
    }
    else {
        // No modules were specified
        bundles = knownBundles;
        tabs = knownTabs;
    }
    return {
        bundles: [...new Set(bundles)],
        tabs: [...new Set(tabs)],
        modulesSpecified: modules !== null,
        manifest: manifestFile,
    };
};
/**
 *
 */
export const createLogger = (handler) => (overallRes, ...args) => {
    if (typeof overallRes === 'boolean')
        return;
    handler(overallRes, ...args);
};
export const createBuildLogger = (label) => createLogger((res, verbose) => {
    if (typeof res === 'boolean')
        return;
    const uppercaseLabel = label[0].toUpperCase() + label.slice(1);
    const { severity: overallSev, results } = res;
    const entries = Object.entries(results);
    if (entries.length === 0)
        return;
    if (!verbose) {
        if (overallSev === 'success') {
            console.log(chalk.greenBright(`Successfully built all ${label}s!\n`));
            return;
        }
        if (overallSev === 'warn') {
            console.log(chalk.cyanBright(`${uppercaseLabel}s built with ${chalk.yellowBright('warnings')}\n${Object.entries(results)
                .filter(([, { severity }]) => severity === 'warn')
                .map(([bundle, { error }], i) => chalk.yellowBright(`${i + 1}. ${bundle}: ${error}`))
                .join('\n')}\n`));
            return;
        }
        console.log(chalk.cyanBright(`${uppercaseLabel} building ${chalk.redBright('failed')} with errors:\n${Object.entries(results)
            .filter(([, { severity }]) => severity !== 'success')
            .map(([bundle, { error, severity }], i) => (severity === 'warn' ? chalk.yellowBright(`${i + 1}. ${bundle}: ${error}`) : chalk.redBright(`${i + 1}. ${bundle}: ${error}`)))
            .join('\n')}\n`));
        return;
    }
    const outputTable = new Table({
        columns: [{
                name: 'name',
                title: uppercaseLabel,
            },
            {
                name: 'severity',
                title: 'Status',
            },
            {
                name: 'elapsed',
                title: 'Build Time (s)',
            },
            {
                name: 'fileSize',
                title: 'File Size',
            },
            {
                name: 'error',
                title: 'Errors',
            }],
    });
    entries.forEach(([moduleName, { elapsed, severity, error, fileSize }]) => {
        if (severity === 'error') {
            outputTable.addRow({
                name: moduleName,
                elapsed: '-',
                error,
                fileSize: '-',
                severity: 'Error',
            }, { color: 'red' });
        }
        else if (severity === 'warn') {
            outputTable.addRow({
                name: moduleName,
                elapsed: '-',
                error,
                fileSize: fileSize === undefined ? '-' : fileSizeFormatter(fileSize),
                severity: 'Warn',
            }, { color: 'yellow' });
        }
        else {
            outputTable.addRow({
                name: moduleName,
                elapsed: divideAndRound(elapsed, 1000),
                error: '-',
                fileSize: fileSizeFormatter(fileSize),
                severity: 'Success',
            }, { color: 'green' });
        }
    });
    if (overallSev === 'success') {
        console.log(`${chalk.cyanBright(`${uppercaseLabel}s built`)} ${chalk.greenBright('successfully')}:\n${outputTable.render()}\n`);
    }
    else if (overallSev === 'warn') {
        console.log(`${chalk.cyanBright(`${uppercaseLabel}s built with`)} ${chalk.yellowBright('warnings')}:\n${outputTable.render()}\n`);
    }
    else {
        console.log(`${chalk.cyanBright(`${uppercaseLabel}s failed with`)} ${chalk.redBright('errors')}:\n${outputTable.render()}\n`);
    }
});
export const expandBundleName = (srcDir) => (name) => path.join(srcDir, 'bundles', name, 'index.ts');
export const expandTabName = (srcDir) => (name) => path.join(srcDir, 'tabs', name, 'index.tsx');
