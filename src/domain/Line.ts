import { Shape } from './Shape.js';
export class Line extends Shape {
  constructor(id: string, x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    super(id, 'line'); this.define('x1', x1); this.define('y1', y1); this.define('x2', x2); this.define('y2', y2);
  }
  override move(dx: number, dy: number): void { this.translate(['x1', 'x2'], ['y1', 'y2'], dx, dy); }
  override position(): string { return `(${this.coordinate('x1')},${this.coordinate('y1')}) -> (${this.coordinate('x2')},${this.coordinate('y2')})`; }
  override geometryDescription(): string { return this.position(); }
  override clone(): Line { const copy = new Line(this.id); this.copyStateTo(copy); return copy; }
}
