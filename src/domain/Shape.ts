import type { Group } from './Group.js';
import { Value } from './Value.js';

export abstract class Shape {
  private readonly geometry = new Map<string, number>();
  private readonly nonnegative = new Set<string>();
  private readonly styles = new Map<string, string>();
  private readonly imported = new Map<string, string>();

  protected constructor(private readonly identifier: string, private readonly elementName: string) {
    Value.id(identifier);
  }
  get id(): string { return this.identifier; }
  get tag(): string { return this.elementName; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }

  protected define(name: string, value: number, nonnegative = false): void {
    if (nonnegative) this.nonnegative.add(name);
    this.geometry.set(name, nonnegative ? Value.nonnegative(value, name) : Value.number(value, name));
  }
  protected coordinate(name: string): number { return this.geometry.get(name)!; }
  protected translate(xNames: readonly string[], yNames: readonly string[], dx: number, dy: number): void {
    Value.number(dx, 'dx'); Value.number(dy, 'dy');
    const next = new Map(this.geometry);
    for (const name of xNames) next.set(name, Value.number(this.coordinate(name) + dx, name));
    for (const name of yNames) next.set(name, Value.number(this.coordinate(name) + dy, name));
    for (const [name, value] of next) this.geometry.set(name, value);
  }
  abstract move(dx: number, dy: number): void;
  scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    const next = [...this.geometry].map(([name, value]) => [name, Value.number(value * factor, name)] as const);
    for (const [name, value] of next) this.geometry.set(name, value);
  }
  set(attribute: string, value: string): void {
    Value.xmlText(value);
    if (this.geometry.has(attribute)) {
      this.geometry.set(attribute, this.nonnegative.has(attribute) ? Value.nonnegative(value, attribute) : Value.number(value, attribute));
    } else if (['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      this.styles.set(attribute, attribute === 'stroke-width' ? String(Value.nonnegative(value, attribute)) : value);
    } else throw new Error(`unknown attribute: ${attribute}`);
  }
  attributes(): ReadonlyMap<string, string> {
    return new Map([['id', this.id], ...[...this.geometry].map(([key, value]) => [key, String(value)] as [string, string]), ...this.styles, ...this.imported]);
  }
  importAttribute(name: string, value: string): void {
    Value.xmlText(value);
    if (this.geometry.has(name)) { this.set(name, value.replace(/px$/, '')); return; }
    if (['font-size', 'font-family', 'font-weight', 'text-anchor', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin'].includes(name) || /^data-[\w-]+$/.test(name)) {
      this.imported.set(name, value);
    } else this.set(name, value);
  }
  normalizeImport(scale: number, dx: number, dy: number, strokeWidth: number, _fontSize: number): void {
    this.scale(scale); this.move(dx, dy);
    if (scale !== 1) this.set('stroke-width', String(Value.nonnegative(strokeWidth * scale, 'stroke-width')));
  }
  geometryDescription(): string { return [...this.geometry].map(([key, value]) => `${key}=${value}`).join(' '); }
  styleDescription(): string { return [...this.styles].map(([key, value]) => `${key}=${value}`).join(' '); }
  summary(): string { return [this.label, this.geometryDescription(), this.styleDescription()].filter(Boolean).join('  '); }
  position(): string { return this.geometryDescription(); }
  asGroup(): Group { throw new Error(`not a container: ${this.id}`); }
  contains(id: string): boolean { return this.id === id || this.children.some(child => child.contains(id)); }
  inheritStyles(parent: Shape): void {
    for (const [name, value] of parent.styles) if (!this.styles.has(name)) this.styles.set(name, value);
    for (const name of ['font-size', 'font-family', 'font-weight', 'text-anchor', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin']) {
      const value = parent.imported.get(name);
      if (value !== undefined && !this.imported.has(name)) this.imported.set(name, value);
    }
  }
  protected copyStateTo(target: Shape): void {
    for (const [key, value] of this.geometry) target.geometry.set(key, value);
    for (const [key, value] of this.styles) target.styles.set(key, value);
    for (const [key, value] of this.imported) target.imported.set(key, value);
  }
  abstract clone(): Shape;
}
