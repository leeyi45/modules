import chalk from 'chalk';
import { Command } from 'commander';
import { ESLint } from 'eslint';
import pathlib from 'path';

import { printList, wrapWithTimer } from '../../scriptUtils.js';
import { createLogger, divideAndRound, retrieveBundlesAndTabs } from '../buildUtils.js';
import type { AssetParams, CommandHandler, CommandInputs, Severity } from '../types.js';

export type LintOpts = {
  fix: boolean;
} & Omit<CommandInputs, 'manifest'>;

type LintResults = {
  formatted: string;
  results: ESLint.LintResult[],
  severity: Severity;
};

/**
 * Run eslint programmatically
 * Refer to https://eslint.org/docs/latest/integrate/nodejs-api for documentation
 */
export const runEslint: CommandHandler<LintOpts, {
  elapsed: number;
  result: LintResults
}> = wrapWithTimer(async (opts: LintOpts, { bundles, tabs }: AssetParams): Promise<LintResults> => {
  const linter = new ESLint({
    cwd: pathlib.resolve(opts.srcDir),
    overrideConfigFile: '.eslintrc.cjs',
    extensions: ['ts', 'tsx'],
    fix: opts.fix,
    useEslintrc: false,
  });

  const promises: Promise<ESLint.LintResult[]>[] = [
    bundles.length > 0 ? linter.lintFiles(bundles.map((bundle) => pathlib.join('bundles', bundle))) : Promise.resolve([]),
    tabs.length > 0 ? linter.lintFiles(tabs.map((tabName) => pathlib.join('tabs', tabName))) : Promise.resolve([]),
  ];

  const [lintBundles, lintTabs] = await Promise.all(promises);

  if (bundles.length > 0) {
    printList(`${chalk.magentaBright('Running eslint on the following bundles')}:\n`, bundles);
  }

  if (tabs.length > 0) {
    printList(`${chalk.magentaBright('Running eslint on the following tabs')}:\n`, tabs);
  }
  const lintResults = [...lintBundles, ...lintTabs];

  if (opts.fix) {
    await ESLint.outputFixes(lintResults);
  }

  const lintSeverity = lintResults.reduce((res, { errorCount, warningCount }) => {
    if (errorCount > 0 || res === 'error') return 'error';
    if (warningCount > 0) return 'warn';
    return res;
  }, 'success' as Severity);

  const outputFormatter = await linter.loadFormatter('stylish');
  const formatterOutput = outputFormatter.format(lintResults);

  return {
    formatted: typeof formatterOutput === 'string' ? formatterOutput : await formatterOutput,
    results: lintResults,
    severity: lintSeverity,
  };
});

export const logLintResult = createLogger(({ elapsed, result: { formatted, severity } }: Awaited<ReturnType<typeof runEslint>>) => {
  let errStr: string;

  if (severity === 'error') errStr = chalk.cyanBright('with ') + chalk.redBright('errors');
  else if (severity === 'warn') errStr = chalk.cyanBright('with ') + chalk.yellowBright('warnings');
  else errStr = chalk.greenBright('successfully');

  console.log(`${chalk.cyanBright(`Linting completed in ${divideAndRound(elapsed, 1000)}s ${errStr}:`)}\n${formatted}`);
});

export type LintCommandInputs = {
  fix: boolean;
} & CommandInputs;

export const lintCommand = new Command('lint')
  .description('Run eslint')
  .option('--fix', 'Ask eslint to autofix linting errors', false)
  .option('--srcDir <srcdir>', 'Source directory for files', 'src')
  .option('--manifest <file>', 'Manifest file', 'modules.json')
  .option('-m, --modules <modules...>', 'Manually specify which modules to check', null)
  .option('-t, --tabs <tabs...>', 'Manually specify which tabs to check', null)
  .action(async ({ modules, tabs, manifest, ...opts }: LintCommandInputs) => {
    const assets = await retrieveBundlesAndTabs(manifest, modules, tabs);
    const result = await runEslint(opts, assets);
    logLintResult(result);
  });
