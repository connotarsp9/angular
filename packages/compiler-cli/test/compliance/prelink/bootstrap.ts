/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {PluginObj, transformSync} from '@babel/core';

import {createEs2015LinkerPlugin} from '../../../linker/babel';
import {compileFiles, CompileFn, setCompileFn} from '../mock_compile';

/**
 * A function to compile the given code in two steps:
 *
 * - first compile the code in partial mode
 * - then compile the partially compiled code using the linker
 *
 * This should produce the same output as the full AOT compilation
 */
const linkedCompile: CompileFn = (data, angularFiles, options) => {
  const compiledFiles = compileFiles(data, angularFiles, {...options, compilationMode: 'partial'});

  const linkerPlugin = createEs2015LinkerPlugin({
    enableI18nLegacyMessageIdFormat: options?.enableI18nLegacyMessageIdFormat,
    i18nNormalizeLineEndingsInICUs: options?.i18nNormalizeLineEndingsInICUs,
  });

  const source = compiledFiles.map(file => applyLinker(file, linkerPlugin)).join('\n');

  return {source};
};

/**
 * Runs the provided code through the Babel linker plugin, if the file has the .js extension.
 *
 * @param file The file name and its source to be transformed using the linker.
 * @param linkerPlugin The linker plugin to apply.
 * @returns The file's source content, which has been transformed using the linker if necessary.
 */
function applyLinker(file: {fileName: string; source: string}, linkerPlugin: PluginObj): string {
  if (!file.fileName.endsWith('.js')) {
    return file.source;
  }
  const result = transformSync(file.source, {
    filename: file.fileName,
    plugins: [linkerPlugin],
    parserOpts: {sourceType: 'unambiguous'},
  });
  if (result === null) {
    throw fail('Babel transform did not have output');
  }
  if (result.code == null) {
    throw fail('Babel transform result does not have any code');
  }
  return result.code;
}

// Update the function that will do the compiling with this specialised version that
// runs the prelink and postlink parts of AOT compilation, to check it produces the
// same result as a normal full AOT compile.
setCompileFn(linkedCompile);
