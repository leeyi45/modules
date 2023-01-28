import chalk from 'chalk';
import { Command } from 'commander';
import { Table } from 'console-table-printer';
import path from 'path';
import { retrieveManifest } from '../scriptUtils.js';
export const wrapWithTimer = (func) => async (...params) => {
    const startTime = performance.now();
    const result = await func(...params);
    const endTime = performance.now();
    return {
        elapsed: endTime - startTime,
        result,
    };
};
export const divideAndRound = (dividend, divisor, round) => (dividend / divisor).toFixed(round);
export const findSeverity = (items, processor) => {
    let severity = 'success';
    for (const item of items) {
        const itemSev = processor(item);
        if (itemSev === 'error')
            return 'error';
        if (itemSev === 'warn' && severity === 'success')
            severity = 'warn';
    }
    return severity;
};
export const fileSizeFormatter = (size) => {
    size /= 1000;
    if (size < 0.01)
        return '<0.01 KB';
    if (size >= 100)
        return `${divideAndRound(size, 1000, 2)} MB`;
    return `${size.toFixed(2)} KB`;
};
export const logResult = (unreduced, verbose) => {
    const overallResult = unreduced.reduce((res, [type, name, entry]) => {
        if (!res[type]) {
            res[type] = {
                severity: 'success',
                results: {},
            };
        }
        if (entry.severity === 'error')
            res[type].severity = 'error';
        else if (res[type].severity === 'success' && entry.severity === 'warn')
            res[type].severity = 'warn';
        res[type].results[name] = entry;
        return res;
    }, {});
    return console.log(Object.entries(overallResult)
        .map(([label, toLog]) => {
        if (typeof toLog === 'boolean' || typeof toLog === 'undefined')
            return null;
        const upperCaseLabel = label[0].toUpperCase() + label.slice(1);
        const { severity: overallSev, results } = toLog;
        const entries = Object.entries(overallResult);
        if (entries.length === 0)
            return '';
        if (!verbose) {
            if (overallSev === 'success') {
                return `${chalk.cyanBright(`${upperCaseLabel}s built`)} ${chalk.greenBright('successfully')}\n`;
            }
            if (overallSev === 'warn') {
                return chalk.cyanBright(`${upperCaseLabel}s built with ${chalk.yellowBright('warnings')}:\n${Object.entries(results)
                    .filter(([, { severity }]) => severity === 'warn')
                    .map(([bundle, { error }], i) => chalk.yellowBright(`${i + 1}. ${bundle}: ${error}`))
                    .join('\n')}\n`);
            }
            return chalk.cyanBright(`${upperCaseLabel}s build ${chalk.redBright('failed')} with errors:\n${Object.entries(results)
                .filter(([, { severity }]) => severity !== 'success')
                .map(([bundle, { error, severity }], i) => (severity === 'error'
                ? chalk.redBright(`${i + 1}. Error ${bundle}: ${error}`)
                : chalk.yellowBright(`${i + 1}. Warning ${bundle}: +${error}`)))
                .join('\n')}\n`);
        }
        const outputTable = new Table({
            columns: [{
                    name: 'bundle',
                    title: upperCaseLabel,
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
        Object.entries(results)
            .forEach(([moduleName, { elapsed, severity, error, fileSize }]) => {
            if (severity === 'error') {
                outputTable.addRow({
                    bundle: moduleName,
                    elapsed: '-',
                    error,
                    fileSize: '-',
                    severity: 'Error',
                }, { color: 'red' });
            }
            else if (severity === 'warn') {
                outputTable.addRow({
                    bundle: moduleName,
                    elapsed: divideAndRound(elapsed, 1000, 2),
                    error: '-',
                    fileSize: fileSize !== undefined ? fileSizeFormatter(fileSize) : '-',
                    severity: 'Warning',
                }, { color: 'yellow' });
            }
            else {
                outputTable.addRow({
                    bundle: moduleName,
                    elapsed: divideAndRound(elapsed, 1000, 2),
                    error: '-',
                    fileSize: fileSizeFormatter(fileSize),
                    severity: 'Success',
                }, { color: 'green' });
            }
        });
        if (overallSev === 'success') {
            return `${chalk.cyanBright(`${upperCaseLabel}s built`)} ${chalk.greenBright('successfully')}:\n${outputTable.render()}\n`;
        }
        if (overallSev === 'warn') {
            return `${chalk.cyanBright(`${upperCaseLabel}s built`)} with ${chalk.yellowBright('warnings')}:\n${outputTable.render()}\n`;
        }
        return `${chalk.cyanBright(`${upperCaseLabel}s build ${chalk.redBright('failed')} with errors`)}:\n${outputTable.render()}\n`;
    })
        .filter((str) => str !== null)
        .join('\n'));
};
/**
 * Function to determine which bundles and tabs to build based on the user's input.
 *
 * @param modules
 * - Pass `null` to indicate that the user did not specify any modules. This
 *   will add all bundles currently registered in the manifest
 * - Pass `[]` to indicate not to add any modules
 * - Pass an array of strings to manually specify modules to process
 * @param tabOpts
 * - Pass `null` to indicate that the user did not specify any tabs. This
 *   will add all tabs currently registered in the manifest
 * - Pass `[]` to indicate not to add any tabs
 * - Pass an array of strings to manually specify tabs to process
 * @param addTabs If `true`, then all tabs of selected bundles will be added to
 * the list of tabs to build.
 */
export const retrieveBundlesAndTabs = async (manifestFile, modules, tabOpts, addTabs = true) => {
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
        if (addTabs) {
            // If a bundle is being rebuilt, add its tabs
            tabs = modules.flatMap((bundle) => manifest[bundle].tabs);
        }
        else {
            tabs = [];
        }
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
    };
};
export const bundleNameExpander = (srcdir) => (name) => path.join(srcdir, 'bundles', name, 'index.ts');
export const tabNameExpander = (srcdir) => (name) => path.join(srcdir, 'tabs', name, 'index.tsx');
export const createBuildCommand = (label) => new Command(label)
    .option('--outDir <outdir>', 'Output directory', 'build')
    .option('--srcDir <srcdir>', 'Source directory for files', 'src')
    .option('--manifest <file>', 'Manifest file', 'modules.json')
    .option('-v, --verbose', 'Display more information about the build results', false);
