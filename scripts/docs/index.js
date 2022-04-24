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
async function build_html() {
  app.bootstrap({
    entryPoints: Object.keys(modules).map(
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
 * Build the json documentation for the specified modules
 */
async function build_jsons(modules) {
  app.bootstrap({
    entryPoints: modules.map(
      (module) => `${paths.root}/src/bundles/${module}/functions.ts`
    ),
    excludeInternal: true,
    categorizeByGroup: true,
  });

  const project = app.convert();
  if (!project) return;

  fs.mkdirSync(`build/jsons/output`, {});
  await app.generateJson(project, `build/jsons/output/documentation.json`);

  const parsers = {
    Variable: (element) => {
      let desc = element.comment?.shortText;
      if (!desc) {
        desc = element.name;
        console.warn(
          `${chalk.yellow('Warning:')} ${module}: No description found for ${
            element.name
          }`
        );
      } else {
        desc = drawdown(desc);
      }

      const typeStr =
        element.type?.name !== undefined ? `:${element.type.name}` : '';

      return `<div><h4>${element.name}${typeStr}</h4><div class="description">${desc}</div></div>`;
    },
    Function: (element) => {
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
          `${chalk.yellow('Warning:')} ${module}: No description found for ${
            element.name
          }`
        );
      } else {
        desc = drawdown(desc);
      }

      return `<div><h4>${element.name}${paramStr} → {${resultStr}}</h4><div class="description">${desc}</div></div>`;
    },
  };

  // Read from the TypeDoc output and retrieve the JSON relevant to the each module
  fs.readFile('build/jsons/output/documentation.json', 'utf-8', (err, data) => {
    if (err) throw err;

    const parsedJSON = JSON.parse(data)?.children;

    if (!parsedJSON) {
      throw new Error('Failed to parse documentation.json');
    }

    for (const module of modules) {
      const moduleDocs = parsedJSON.find((x) => x.name === module)?.children;

      let output;
      if (moduleDocs === undefined) {
        console.warn(
          `${chalk.yellow('Warning:')} No documentation found for ${module}`
        );
        output = {};
      } else {
        output = moduleDocs.reduce((result, element) => {
          if (parsers[element.kindString]) {
            result[element.name] = parsers[element.kindString](element);
          } else {
            console.warn(
              `${chalk.yellow('Warning:')} ${module}: No parser found for ${
                element.name
              } of type ${element.type}`
            );
          }
          return result;
        }, {});
      }

      fs.writeFile(
        `build/jsons/${module}.json`,
        JSON.stringify(output, null, 2),
        errHandler
      );

      fs.rm(
        'build/jsons/output/',
        { recursive: true, force: true },
        errHandler
      );
    }
  });
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

  await Promise.all([build_jsons(moduleBundles), build_html()]);
}

main().catch(console.error);
