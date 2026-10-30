import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { TextShape } from './TextShape.js';
import { Group } from './Group.js';

// Only shape-name dispatch point; replace built-ins with providers in phase 2.
export class ShapeFactory {
  private readonly definitions = new Map<string, {
    make: (id: string) => Shape; attributes: readonly string[]; optionalStyle?: string;
  }>([
    ['rect', { make: id => new Rect(id), attributes: ['x', 'y', 'width', 'height'], optionalStyle: 'fill' }],
    ['circle', { make: id => new Circle(id), attributes: ['cx', 'cy', 'r'], optionalStyle: 'fill' }],
    ['ellipse', { make: id => new Ellipse(id), attributes: ['cx', 'cy', 'rx', 'ry'], optionalStyle: 'fill' }],
    ['line', { make: id => new Line(id), attributes: ['x1', 'y1', 'x2', 'y2'], optionalStyle: 'stroke' }],
    ['text', { make: id => new TextShape(id), attributes: ['x', 'y', 'text'] }],
    ['g', { make: id => new Group(id), attributes: [] }],
  ]);
  private definition(type: string) {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  empty(type: string, id: string): Shape { return this.definition(type).make(id); }
  create(type: string, id: string, args: readonly string[]): Shape {
    const definition = this.definition(type);
    const required = definition.attributes.length;
    if (args.length < required || args.length > required + (definition.optionalStyle ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}; see help`);
    }
    const shape = definition.make(id);
    definition.attributes.forEach((attribute, index) => shape.set(attribute, args[index]!));
    if (args.length > required) shape.set(definition.optionalStyle!, args[required]!);
    return shape;
  }
}
