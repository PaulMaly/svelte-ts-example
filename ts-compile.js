import * as ts from 'typescript';
import colors from 'colors';

import options from './tsconfig.json';

function printDiagnostics(diagnostics) {
    diagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(colors.yellow(`${diagnostic.file.fileName.replace('.ts', '')} (${line + 1},${character + 1}): ${message}`));
        } else {
            console.log(colors.yellow(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`));
        }
    });
}

function transpile(content, options) {
    const { outputText: code, diagnostics } = ts.transpileModule(content, options);
    printDiagnostics(diagnostics); // always empty array for some reasons, maybe a bug
    return { code, map: null };
}

export function compile({ content, filename }) {
    const opts = Object.assign({}, ts.getDefaultCompilerOptions(), options),
        realHost = ts.createCompilerHost(opts, true),
        dummyFilePath = `/${filename}.ts`,
        dummySourceFile = ts.createSourceFile(dummyFilePath, content, ts.ScriptTarget.Latest);

    let libs = opts.compilerOptions.lib || [], code;

    const host = {
        fileExists: filePath => filePath === dummyFilePath || realHost.fileExists(filePath),
        directoryExists: realHost.directoryExists && realHost.directoryExists.bind(realHost),
        getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
        getDirectories: realHost.getDirectories.bind(realHost),
        getCanonicalFileName: fileName => realHost.getCanonicalFileName(fileName),
        getNewLine: realHost.getNewLine.bind(realHost),
        getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
        getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => fileName === dummyFilePath 
            ? dummySourceFile 
            : realHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile),
        readFile: filePath => filePath === dummyFilePath ? source : realHost.readFile(filePath),
        useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
        writeFile: (fileName, data) => (code = data),
    };

    const rootNames = libs.map(lib => require.resolve(`typescript/lib/lib.${lib}.d.ts`)),
        program = ts.createProgram(rootNames.concat([dummyFilePath]), opts, host),
        emitResult = program.emit(),
        diagnostics = ts.getPreEmitDiagnostics(program);

    printDiagnostics(emitResult.diagnostics.concat(diagnostics));

    return transpile(content, opts);
}