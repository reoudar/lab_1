import { Shape } from './Shape.js';
export class Ellipse extends Shape {
  constructor(id: string, cx = 0, cy = 0, rx = 0, ry = 0) {
    super(id, 'ellipse'); this.define('cx', cx); this.define('cy', cy); this.define('rx', rx, true); this.define('ry', ry, true);
  }
  override move(dx: number, dy: number): void { this.translate(['cx'], ['cy'], dx, dy); }
  override position(): string { return `(${this.coordinate('cx')},${this.coordinate('cy')})`; }
  override clone(): Ellipse { const copy = new Ellipse(this.id); this.copyStateTo(copy); return copy; }
}
