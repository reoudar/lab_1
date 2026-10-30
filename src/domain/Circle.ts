import { Shape } from './Shape.js';
export class Circle extends Shape {
  constructor(id: string, cx = 0, cy = 0, r = 0) {
    super(id, 'circle'); this.define('cx', cx); this.define('cy', cy); this.define('r', r, true);
  }
  override move(dx: number, dy: number): void { this.translate(['cx'], ['cy'], dx, dy); }
  override position(): string { return `(${this.coordinate('cx')},${this.coordinate('cy')})`; }
  override clone(): Circle { const copy = new Circle(this.id); this.copyStateTo(copy); return copy; }
}
