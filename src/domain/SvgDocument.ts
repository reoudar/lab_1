import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Value } from './Value.js';

export class SvgDocument {
  private readonly roots: Shape[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly rootAttributes = new Map<string, string>();
  constructor(width = 800, height = 600) {
    this.canvasWidth = Value.positive(width, 'width');
    this.canvasHeight = Value.positive(height, 'height');
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return [...this.roots]; }
  attributes(): ReadonlyMap<string, string> {
    return new Map([['width', String(this.width)], ['height', String(this.height)], ['viewBox', `0 0 ${this.width} ${this.height}`], ...this.rootAttributes]);
  }
  importAttribute(name: string, value: string): void {
    if (!['viewBox', 'preserveAspectRatio', 'id', 'fill', 'stroke', 'stroke-width', 'font-size', 'font-family', 'font-weight', 'text-anchor'].includes(name)) {
      throw new Error(`unsupported svg attribute: ${name}`);
    }
    if (name === 'id') Value.id(value);
    this.rootAttributes.set(name, Value.xmlText(value));
  }
  resize(width: number, height: number): void {
    Value.positive(width, 'width'); Value.positive(height, 'height');
    this.canvasWidth = width; this.canvasHeight = height;
    this.rootAttributes.delete('viewBox');
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
    const rootId = this.rootAttributes.get('id');
    if (rootId !== undefined) seen.add(rootId);
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
  private insert(shape: Shape, parent: Group | undefined, index: number): void {
    if (parent) parent.insert(shape, index); else this.roots.splice(index, 0, shape);
  }
  group(id: string, ids: readonly string[]): Group {
    if (this.find(id) || this.rootAttributes.get('id') === id) throw new Error(`id already exists: ${id}`);
    const group = new Group(id);
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const requested = ids.map(member => this.require(member));
    for (const shape of requested) {
      if (requested.some(other => other !== shape && shape.contains(other.id))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const selected = this.all().filter(shape => ids.includes(shape.id));
    const firstParent = this.parentOf(selected[0]!.id);
    const sameParent = selected.every(shape => this.parentOf(shape.id) === firstParent);
    const parent = sameParent ? firstParent : undefined;
    const siblings = parent?.children ?? this.children;
    const index = sameParent ? siblings.indexOf(selected[0]!) : siblings.length;
    for (const shape of selected) this.delete(shape.id);
    for (const shape of selected) group.insert(shape);
    this.insert(group, parent, index);
    return group;
  }
  ungroup(id: string): number {
    const group = this.require(id).asGroup();
    const parent = this.parentOf(id);
    if (!parent) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.children;
    const index = parent.remove(group);
    children.forEach((child, offset) => {
      child.inheritStyles(group);
      group.remove(child); parent.insert(child, index + offset);
    });
    return children.length;
  }
  addTo(gid: string, id: string): void {
    const parent = this.requireContainer(gid);
    const shape = this.require(id);
    if (shape.contains(gid)) throw new Error(`cannot group a container into its own descendant: ${id}`);
    this.delete(id); parent.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.require(id), parent = this.parentOf(id);
    this.delete(id);
    this.insert(shape, parent, front ? (parent?.children ?? this.children).length : 0);
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const [key, value] of this.rootAttributes) copy.rootAttributes.set(key, value);
    for (const shape of this.roots) copy.roots.push(shape.clone());
    return copy;
  }
}
