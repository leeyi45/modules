const chalk = require('chalk');
const fs = require('fs');
const TypeDoc = require('typedoc');
const paths = require('./paths');
const modules = require('../../modules.json');
const drawdown = require('./drawdown');

const app = new TypeDoc.Application();
app.options.addReader(new TypeDoc.TSConfigReader());
app.options.addReader(new TypeDoc.TypeDocReader());

const errHandler = (err) => {
  if (err) console.error(err);
};

/**
 * Build the html documentation for all modules
 */
async function build_all(modules) {
  app.bootstrap({
    entryPoints: modules.map(
      (module) => `${paths.root}/src/bundles/${module}/functions.ts`
    ),
    theme: 'typedoc-modules-theme',
    readme: `${paths.root}/scripts/docs/README.md`,
    excludeInternal: true,
    categorizeByGroup: true,
    name: 'Source Academy Modules',
  });

  const project = app.convert();
  if (project) {
    await app.generateDocs(project, 'build/documentation');
  }
}

/**
 * Build the json output for the specified module
 */
async function build_json(module) {
  app.bootstrap({
    entryPoints: [`${paths.root}/src/bundles/${module}/functions.ts`],
    excludeInternal: true,
    categorizeByGroup: true,
  });

  const project = app.convert();

  if (!project) return undefined;

  // Because typedoc clears the output directory every time it outputs,
  // we make a new directory to temporarily store the output for each module
  fs.mkdirSync(`build/jsons/${module}`, errHandler);
  await app.generateJson(project, `build/jsons/${module}/documentation.json`);

  // Read the json output from typedoc and format it into html
  fs.readFile(
    `build/jsons/${module}/documentation.json`,
    'utf-8',
    (err, data) => {
      if (err) console.error(err);
      else {
        const docs = JSON.parse(data).children;

        let output;

        if (docs) {
          output = docs.reduce((result, element) => {
            if (element.kindString === 'Variable') {
              let desc = element.comment?.shortText;
              if (!desc) {
                desc = element.name;
                console.warn(
                  `${chalk.yellow(
                    'Warning:'
                  )} ${module}: No description found for ${element.name}`
                );
              } else {
                desc = drawdown(desc);
              }

              const typeStr =
                element.type?.name !== undefined ? `:${element.type.name}` : '';

              result[
                element.name
              ] = `<div><h4>${element.name}${typeStr}</h4><div class="description">${desc}</div></div>`;
            } else if (element.kindString === 'Function') {
              // If the documentation is for a function
              if (!element.signatures || element.signatures[0] === undefined)
                throw new Error(
                  `Error: ${module}: Unable to find a signature for function ${element.name}!`
                );

              // In source all functions should only have one signature
              const signature = element.signatures[0];

              // Form the parameter string for the function
              let paramStr;
              if (!signature.parameters) paramStr = `()`;
              else
                paramStr = `(${signature.parameters
                  .map((param) => param.name)
                  .join(', ')})`;

              // Form the result representation for the function
              let resultStr;
              if (!signature.type) resultStr = `void`;
              else resultStr = signature.type.name;

              let desc = signature.comment?.shortText;
              if (!desc) {
                desc = element.name;
                console.warn(
                  `${module}: No description found for signature of ${element.name}`
                );
              } else {
                desc = drawdown(desc);
              }

              result[
                element.name
              ] = `<div><h4>${element.name}${paramStr} → {${resultStr}}</h4><div class="description">${desc}</div></div>`;
            }
            return result;
          }, {});
        } else {
          // If there was no documentation for that module, just
          // return nothing
          output = {};
        }

        fs.writeFile(
          `build/jsons/${module}.json`,
          JSON.stringify(output, null, 2),
          (err) => {
            if (err) console.error(err);
            fs.rm(
              `build/jsons/${module}`,
              { recursive: true, force: true },
              errHandler
            );
          }
        );
      }
    }
  );
}

async function main() {
  let moduleBundles;

  // Specifically build the provided modules
  if (process.argv[2] === '--module') {
    if (process.argv.length < 4) {
      throw new Error('No modules specified');
    }

    moduleBundles = process.argv[3].split(',');

    const undefineds = moduleBundles.filter(
      (x) => !Object.keys(modules).includes(x)
    );
    if (undefineds.length > 0) {
      throw new Error(`Unknown modules: ${undefineds.length(', ')}`);
    }
  } else {
    // Build all available modules
    moduleBundles = Object.keys(modules);
  }

  fs.rmSync(`${paths.root}/build/jsons`, { recursive: true, force: true });
  await build_all(moduleBundles);
  fs.mkdirSync(`${paths.root}/build/jsons`);
  await Promise.all(moduleBundles.map(build_json));
}

main().catch(console.error);
