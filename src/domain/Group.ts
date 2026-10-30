import { Shape } from './Shape.js';
import { Value } from './Value.js';
export class Group extends Shape {
  private readonly members: Shape[] = [];
  constructor(id: string) { super(id, 'g'); }
  override get children(): readonly Shape[] { return [...this.members]; }
  override asGroup(): Group { return this; }
  override importAttribute(name: string, value: string): void {
    // Group opacity composites overlapping children and cannot be flattened on ungroup.
    if (name === 'opacity') throw new Error('unsupported group attribute: opacity');
    super.importAttribute(name, value);
  }
  insert(shape: Shape, index = this.members.length): void {
    if (shape.contains(this.id)) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    if (index < 0 || index > this.members.length) throw new Error('invalid insertion index');
    this.members.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.members.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.members.splice(index, 1);
    return index;
  }
  override move(dx: number, dy: number): void {
    Value.number(dx, 'dx'); Value.number(dy, 'dy');
    for (const child of this.members) child.move(dx, dy);
  }
  override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    for (const child of this.members) child.scale(factor);
  }
  // The XML reader normalizes each descendant using its cumulative transform.
  override normalizeImport(): void {}
  override clone(): Group {
    const copy = new Group(this.id); this.copyStateTo(copy);
    for (const child of this.members) copy.insert(child.clone());
    return copy;
  }
}
