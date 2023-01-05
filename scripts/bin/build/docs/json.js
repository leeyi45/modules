import chalk from 'chalk';
import { Table } from 'console-table-printer';
import fs from 'fs/promises';
import { divideAndRound, fileSizeFormatter, findSeverity, wrapWithTimer } from '../buildUtils';
import drawdown from './drawdown';
const typeToName = (type, alt = 'unknown') => (type ? type.name : alt);
const parsers = {
    Variable(element) {
        const { comment: { summary } } = element;
        const desc = drawdown(summary.map(({ text }) => text)
            .join(''));
        return `<div><h4>${element.name}: ${typeToName(element.type)}</h4><div class="description">${desc}</div></div>`;
    },
    Function({ name: elementName, signatures: [signature] }) {
        const { comment: { summary } } = signature;
        // Form the parameter string for the function
        let paramStr;
        if (!signature.parameters)
            paramStr = '()';
        else {
            paramStr = `(${signature.parameters
                .map(({ type, name }) => {
                const typeStr = typeToName(type);
                return `${name}: ${typeStr}`;
            })
                .join(', ')})`;
        }
        const resultStr = typeToName(signature.type, 'void');
        const desc = drawdown(summary.map(({ text }) => text)
            .join(''));
        const header = `${elementName}${paramStr} → {${resultStr}}`;
        return `<div><h4>${header}</h4><div class="description">${desc}</div></div>`;
    },
};
const buildJson = wrapWithTimer(async (bundle, moduleDocs, buildOpts) => {
    try {
        if (!moduleDocs) {
            return {
                severity: 'error',
                error: `Could not find generated docs for ${bundle}`,
            };
        }
        const [sevRes, result] = moduleDocs.children.reduce(([{ severity, errors }, decls], decl) => {
            try {
                const parser = parsers[decl.kindString];
                if (!parser) {
                    return [{
                            severity: 'warn',
                            errors: [...errors, `Could not find parser for type ${decl.kindString}`],
                        }, decls];
                }
                return [{
                        severity,
                        errors,
                    }, {
                        ...decls,
                        [decl.name]: parser(decl),
                    }];
            }
            catch (error) {
                return [{
                        severity: 'warn',
                        errors: [...errors, `Could not parse declaration for ${decl.name}: ${error}`],
                    }];
            }
        }, [
            {
                severity: 'success',
                errors: [],
            },
            {},
        ]);
        if (!result) {
            return {
                elapsed: 0,
                severity: 'warn',
                error: `No json generated for ${bundle}`,
                fileSize: 0,
            };
        }
        const outFile = `${buildOpts.outDir}/jsons/${bundle}.json`;
        await fs.writeFile(outFile, JSON.stringify(result, null, 2));
        const { size } = await fs.stat(outFile);
        const errorStr = sevRes.errors.length > 1 ? `${sevRes.errors[0]} +${sevRes.errors.length - 1}` : sevRes.errors[0];
        return {
            severity: sevRes.severity,
            fileSize: size,
            error: errorStr,
        };
    }
    catch (error) {
        return {
            severity: 'error',
            error,
        };
    }
});
export default async (project, buildOpts) => {
    const bundles = buildOpts.modules;
    if (bundles.length === 0)
        return false;
    if (bundles.length === 1) {
        const jsonStartTime = performance.now();
        const [bundle] = buildOpts.modules;
        const result = await buildJson(bundle, project, buildOpts);
        return {
            elapsed: performance.now() - jsonStartTime,
            results: { [bundle]: result },
            severity: result.result.severity,
        };
    }
    const jsonStartTime = performance.now();
    const results = await Promise.all(bundles.map(async (bundle) => [bundle, await buildJson(bundle, project.getChildByName(bundle), buildOpts)]));
    const resultObj = results.reduce((res, [bundle, result]) => ({
        ...res,
        [bundle]: result,
    }), {});
    const jsonEndTime = performance.now();
    return {
        severity: findSeverity(results, ([, { result: { severity } }]) => severity),
        results: resultObj,
        elapsed: jsonEndTime - jsonStartTime,
    };
};
export const logJsonResults = (jsonResults) => {
    if (typeof jsonResults === 'boolean')
        return;
    const { elapsed: jsonTime, severity: jsonSeverity, results } = jsonResults;
    const entries = Object.entries(results);
    if (entries.length === 0)
        return;
    const jsonTable = new Table({
        columns: [
            {
                name: 'bundle',
                title: 'Bundle',
            },
            {
                name: 'jsonSeverity',
                title: 'Status',
            },
            {
                name: 'fileSize',
                title: 'File Size',
            },
            {
                name: 'jsonTime',
                title: 'Build Time(s)',
            },
            {
                name: 'jsonError',
                title: 'Errors',
            },
        ],
    });
    entries.forEach(([moduleName, { elapsed, result: { severity, error, fileSize } }]) => {
        if (severity === 'error') {
            jsonTable.addRow({
                jsonSeverity: 'Error',
                jsonTime: '-',
                jsonError: error,
                fileSize: '-',
            }, { color: 'red' });
        }
        else {
            jsonTable.addRow({
                bundle: moduleName,
                jsonSeverity: severity === 'warn' ? 'Warning' : 'Success',
                jsonTime: divideAndRound(elapsed, 1000, 2),
                jsonError: error || '-',
                fileSize: fileSizeFormatter(fileSize),
            }, { color: severity === 'warn' ? 'yellow' : 'green' });
        }
    });
    const jsonTimeStr = `${divideAndRound(jsonTime, 1000, 2)}s`;
    if (jsonSeverity === 'success') {
        console.log(`${chalk.cyanBright('JSONS built')} ${chalk.greenBright('successfully')} in ${jsonTimeStr}:\n${jsonTable.render()}\n`);
    }
    else if (jsonSeverity === 'warn') {
        console.log(`${chalk.cyanBright('JSONS built with')} ${chalk.yellowBright('warnings')} in ${jsonTimeStr}:\n${jsonTable.render()}\n`);
    }
    else {
        console.log(`${chalk.cyanBright('JSONS failed with')} ${chalk.redBright('errors')}:\n${jsonTable.render()}\n`);
    }
};