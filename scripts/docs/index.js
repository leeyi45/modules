const TypeDoc = require('typedoc');
const paths = require('./paths');
const modules = require('../../modules.json');
const fs = require('fs');

const app = new TypeDoc.Application();
app.options.addReader(new TypeDoc.TSConfigReader());
app.options.addReader(new TypeDoc.TypeDocReader());

const errHandler = (err) => {
  if (err) console.error(err);
};

/**
 * Build the html documentation for all modules
 */
async function build_all() {
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
 * Build the json output for the specified module
 */
async function build_json(module) {
  app.bootstrap({
    entryPoints: [`${paths.root}/src/bundles/${module}/functions.ts`],
    excludeInternal: true,
    categorizeByGroup: true,
  });

  const project = app.convert();

  if (project) {
    // Because typedoc clears the output directory every time it outputs,
    // we make a new directory to temporarily store the output for each module
    const outputDir = `build/documentation/${module}`;
    fs.mkdir(outputDir, { recursive: true }, errHandler);
    await app.generateJson(project, outputDir + `/documentation.json`);
  }
}

async function main() {
  await build_all();
  await Promise.all(Object.keys(modules).map(build_json));

  // Copy each module's json file to the jsons folder which is used
  // by js-slang to import documentation
  const dir = `${paths.root}/build/documentation`;
  fs.mkdir(`${dir}/jsons`, errHandler);
  for (const module of Object.keys(modules)) {
    fs.rename(
      `${dir}/${module}/documentation.json`,
      `${dir}/jsons/${module}.json`,
      errHandler
    );

    fs.rm(`${dir}/${module}`, { recursive: true, force: true }, errHandler);
  }
}

main().catch(console.error);
