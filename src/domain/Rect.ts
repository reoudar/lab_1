import { Shape } from './Shape.js';
export class Rect extends Shape {
  constructor(id: string, x = 0, y = 0, width = 0, height = 0) {
    super(id, 'rect'); this.define('x', x); this.define('y', y); this.define('width', width, true); this.define('height', height, true);
  }
  override move(dx: number, dy: number): void { this.translate(['x'], ['y'], dx, dy); }
  override position(): string { return `(${this.coordinate('x')},${this.coordinate('y')})`; }
  override geometryDescription(): string { return `x=${this.coordinate('x')} y=${this.coordinate('y')} w=${this.coordinate('width')} h=${this.coordinate('height')}`; }
  override clone(): Rect { const copy = new Rect(this.id); this.copyStateTo(copy); return copy; }
}
