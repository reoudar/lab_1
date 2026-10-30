import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, basename, extname } from 'node:path';
import ts from 'typescript';

class ArchitectureAudit {
  #root = resolve('src');
  #errors = [];
  #rules = {
    domain: [], application: ['domain'], commands: ['application', 'domain'],
    cli: ['application', 'commands'], infrastructure: ['application', 'domain'],
  };

  files(directory, extension) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? this.files(path, extension) : extname(path) === extension ? [path] : [];
    });
  }

  run() {
    const files = this.files(this.#root, '.ts');
    for (const file of files) {
      const name = relative(this.#root, file).replaceAll('\\', '/');
      const module = name.split('/')[0];
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const classes = source.statements.filter(ts.isClassDeclaration);
      if (classes.length > 1 || classes.some(item => item.name?.text !== basename(file, '.ts'))) this.#errors.push(`${name}: one-class-per-file violation`);
      if (name !== 'main.ts' && classes.length === 0 && !source.statements.some(ts.isInterfaceDeclaration)) this.#errors.push(`${name}: missing class/interface`);
      if (source.statements.some(ts.isFunctionDeclaration)) this.#errors.push(`${name}: top-level free function`);
      const inspect = node => {
        if (ts.isSwitchStatement(node)) this.#errors.push(`${name}: switch dispatch requires review`);
        ts.forEachChild(node, inspect);
      };
      inspect(source);
      for (const statement of source.statements.filter(ts.isImportDeclaration)) {
        const path = statement.moduleSpecifier.text;
        if (path.startsWith('.')) {
          const target = resolve(dirname(file), path.replace(/\.js$/, '.ts'));
          if (!existsSync(target)) this.#errors.push(`${name}: unresolved ${path}`);
          const targetModule = relative(this.#root, target).split(/[\\/]/)[0];
          if (name !== 'main.ts' && module !== targetModule && !this.#rules[module]?.includes(targetModule)) this.#errors.push(`${name}: forbidden dependency on ${targetModule}`);
        } else if (!['cli', 'infrastructure'].includes(module)) this.#errors.push(`${name}: external dependency ${path}`);
      }
    }
    // Audit emitted modules as well: type-only references do not count as runtime cycles.
    const graph = new Map();
    for (const file of this.files(resolve('dist'), '.js')) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      graph.set(file, source.statements.filter(ts.isImportDeclaration).map(item => item.moduleSpecifier.text)
        .filter(path => path.startsWith('.')).map(path => resolve(dirname(file), path)));
    }
    const visited = new Set(), active = new Set();
    const visit = file => {
      if (active.has(file)) { this.#errors.push(`runtime import cycle: ${relative(process.cwd(), file)}`); return; }
      if (visited.has(file)) return;
      active.add(file);
      for (const next of graph.get(file) ?? []) visit(next);
      active.delete(file); visited.add(file);
    };
    for (const file of graph.keys()) visit(file);
    if (this.#errors.length) throw new Error(this.#errors.join('\n'));
    console.log(`Architecture audit passed: ${files.length} TypeScript files, dependency directions, class names, no switch dispatch or runtime cycles.`);
  }
}

new ArchitectureAudit().run();
