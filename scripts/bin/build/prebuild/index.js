import { Command } from 'commander';
import { retrieveBundlesAndTabs } from '../buildUtils.js';
import { logLintResult, runEslint } from './eslint.js';
import { logTscResults, runTsc } from './tsc.js';
/**
 * Run both `tsc` and `eslint` in parallel if `--fix` was not specified. Otherwise, run eslint
 * to fix linting errors first, then run tsc for type checking
 *
 * @returns An object that contains the results from linting and typechecking, as well
 * as a boolean `proceed` to indicate if either eslint or tsc encountered a fatal error
 */
export const preBuild = async (opts, assets) => {
    if (opts.fix) {
        // Run tsc and then lint
        const lintResult = await runEslint(opts, assets);
        if (!opts.tsc || lintResult.result.severity === 'error') {
            return {
                lintResult,
                tscResult: false,
                proceed: false,
            };
        }
        const tscResult = await runTsc(opts, assets);
        return {
            lintResult,
            tscResult,
            proceed: tscResult.result.severity !== 'error',
        };
        // eslint-disable-next-line no-else-return
    }
    else {
        const [lintResult, tscResult] = await Promise.all([
            opts.lint ? runEslint(opts, assets) : Promise.resolve(false),
            opts.tsc ? runTsc(opts, assets) : Promise.resolve(false),
        ]);
        return {
            lintResult,
            tscResult,
            proceed: (!lintResult || (lintResult && lintResult.result.severity !== 'error'))
                && (!tscResult || (tscResult && tscResult.result.severity !== 'error')),
        };
    }
};
const prebuildCommand = new Command('prebuild')
    .description('Run both tsc and eslint')
    .option('--fix', 'Ask eslint to autofix linting errors', false)
    .option('--srcDir <srcdir>', 'Source directory for files', 'src')
    .option('--manifest <file>', 'Manifest file', 'modules.json')
    .option('-m, --modules [modules...]', 'Manually specify which modules to check')
    .option('-t, --tabs [tabs...]', 'Manually specify which tabs to check')
    .action(async ({ modules, tabs, manifest, ...opts }) => {
    const assets = await retrieveBundlesAndTabs(manifest, modules, tabs, false);
    const { lintResult, tscResult } = await preBuild({
        ...opts,
        tsc: true,
        lint: true,
    }, assets);
    logLintResult(lintResult);
    logTscResults(tscResult, opts.srcDir);
});
export default prebuildCommand;
export { lintCommand } from './eslint.js';
export { tscCommand } from './tsc.js';
