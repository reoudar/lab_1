import { Shape } from './Shape.js';
import { Value } from './Value.js';
export class TextShape extends Shape {
  constructor(id: string, x = 0, y = 0, private content = '') {
    super(id, 'text'); this.define('x', x); this.define('y', y);
  }
  override get textContent(): string { return this.content; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = Value.xmlText(value);
    else super.set(attribute, value);
  }
  override move(dx: number, dy: number): void { this.translate(['x'], ['y'], dx, dy); }
  override position(): string { return `(${this.coordinate('x')},${this.coordinate('y')})`; }
  override geometryDescription(): string { return `${this.position()} ${JSON.stringify(this.content)}`; }
  override normalizeImport(scale: number, dx: number, dy: number, strokeWidth: number, fontSize: number): void {
    super.normalizeImport(scale, dx, dy, strokeWidth, fontSize);
    if (scale !== 1) this.importAttribute('font-size', String(Value.nonnegative(fontSize * scale, 'font-size')));
  }
  override clone(): TextShape { const copy = new TextShape(this.id, 0, 0, this.content); this.copyStateTo(copy); return copy; }
}
