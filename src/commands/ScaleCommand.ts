import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class ScaleCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('scale'); }
  protected override change(document: SvgDocument): string {
    this.args.count(2, 2, 'scale <id> <factor>');
    const shape = document.require(this.args.at(0));
    const factor = this.args.number(1, 'scale factor'); shape.scale(factor);
    return `${shape.label} scaled by ${factor}`;
  }
}
