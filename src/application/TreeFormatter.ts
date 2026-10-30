import { Shape } from '../domain/Shape.js';
import { SvgDocument } from '../domain/SvgDocument.js';

export class TreeFormatter {
  tree(document: SvgDocument, id?: string): string[] {
    const root = id === undefined ? undefined : document.require(id);
    const lines = [root?.summary() ?? `svg (${document.width}x${document.height})`];
    this.append(root?.children ?? document.children, '', lines);
    return lines;
  }
  private append(children: readonly Shape[], prefix: string, lines: string[]): void {
    children.forEach((shape, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${shape.summary()}`);
      this.append(shape.children, prefix + (last ? '    ' : '│   '), lines);
    });
  }
  show(document: SvgDocument, id: string): string[] {
    const shape = document.require(id);
    const lines = [`${shape.label}  parent=${document.parentLabel(id)}`];
    for (const [name, value] of shape.attributes()) if (name !== 'id') lines.push(`  ${name}=${value}`);
    if (shape.textContent !== undefined) lines.push(`  text=${JSON.stringify(shape.textContent)}`);
    return lines;
  }
}
