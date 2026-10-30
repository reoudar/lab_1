import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
export class CreateCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('create'); }
  protected override change(document: SvgDocument): string {
    this.args.count(2, 10, 'create <type> <id> [params...] [in <containerId>]');
    const hasParent = this.args.length >= 4 && this.args.isKeyword(this.args.length - 2, 'in');
    const parent = hasParent ? this.args.at(this.args.length - 1) : undefined;
    const shape = new ShapeFactory().create(this.args.at(0), this.args.at(1), this.args.slice(2, hasParent ? this.args.length - 2 : this.args.length));
    document.add(shape, parent);
    return `${shape.label} created${parent === undefined ? '' : ` in ${document.requireContainer(parent).label}`}`;
  }
}
