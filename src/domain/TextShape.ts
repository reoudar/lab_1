import { Shape } from './Shape.js';
export class TextShape extends Shape {
  constructor(id: string, x = 0, y = 0, private content = '') {
    super(id, 'text'); this.define('x', x); this.define('y', y);
  }
  override get textContent(): string { return this.content; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = value;
    else super.set(attribute, value);
  }
  override move(dx: number, dy: number): void { this.translate(['x'], ['y'], dx, dy); }
  override position(): string { return `(${this.coordinate('x')},${this.coordinate('y')})`; }
  override geometryDescription(): string { return `${this.position()} ${JSON.stringify(this.content)}`; }
  override clone(): TextShape { const copy = new TextShape(this.id, 0, 0, this.content); this.copyStateTo(copy); return copy; }
}
