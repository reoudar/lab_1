import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Value } from './Value.js';

export class SvgDocument {
  private readonly roots: Shape[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  constructor(width = 800, height = 600) {
    this.canvasWidth = Value.positive(width, 'width');
    this.canvasHeight = Value.positive(height, 'height');
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return [...this.roots]; }
  resize(width: number, height: number): void {
    Value.positive(width, 'width'); Value.positive(height, 'height');
    this.canvasWidth = width; this.canvasHeight = height;
  }
  all(): Shape[] {
    const result: Shape[] = [];
    const pending = [...this.children].reverse();
    while (pending.length) {
      const shape = pending.pop()!; result.push(shape);
      pending.push(...[...shape.children].reverse());
    }
    return result;
  }
  find(id: string): Shape | undefined { return this.all().find(shape => shape.id === id); }
  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  requireContainer(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    return shape.asGroup();
  }
  parentOf(id: string): Group | undefined {
    this.require(id);
    return this.all().find(shape => shape.children.some(child => child.id === id))?.asGroup();
  }
  parentLabel(id: string): string { return this.parentOf(id)?.label ?? 'svg'; }
  add(shape: Shape, parentId?: string): void {
    const parent = parentId === undefined ? undefined : this.requireContainer(parentId);
    const seen = new Set(this.all().map(item => item.id));
    const pending = [shape];
    while (pending.length) {
      const next = pending.pop()!;
      if (seen.has(next.id)) throw new Error(`id already exists: ${next.id}`);
      seen.add(next.id); pending.push(...next.children);
    }
    if (parent) parent.insert(shape); else this.roots.push(shape);
  }
  delete(id: string): void {
    const shape = this.require(id);
    const parent = this.parentOf(id);
    if (parent) parent.remove(shape); else this.roots.splice(this.roots.indexOf(shape), 1);
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const shape of this.roots) copy.roots.push(shape.clone());
    return copy;
  }
}
