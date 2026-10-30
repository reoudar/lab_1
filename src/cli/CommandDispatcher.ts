import { Tokenizer } from './Tokenizer.js';
import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
import { InitCommand } from '../commands/InitCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { FrontCommand } from '../commands/FrontCommand.js';
import { BackCommand } from '../commands/BackCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';

export class CommandDispatcher {
  private readonly tokenizer = new Tokenizer();
  // Only command-name dispatch point; phase 2 can inject command providers.
  private readonly commands = new Map<string, new (args: Arguments) => Command>([
    ['init', InitCommand], ['canvas', CanvasCommand], ['create', CreateCommand],
    ['move', MoveCommand], ['scale', ScaleCommand], ['set', SetCommand], ['delete', DeleteCommand],
    ['undo', UndoCommand], ['redo', RedoCommand], ['help', HelpCommand],
    ['group', GroupCommand], ['ungroup', UngroupCommand], ['addto', AddToCommand],
    ['front', FrontCommand], ['back', BackCommand], ['tree', TreeCommand], ['show', ShowCommand],
    ['read', ReadCommand], ['save', SaveCommand],
  ]);
  constructor(private readonly editor = new Editor()) {}
  execute(line: string): string[] {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (tokens.length === 0) return [];
      const CommandClass = this.commands.get(tokens[0]!.text);
      if (!CommandClass) throw new Error(`unknown command: ${tokens[0]!.text}`);
      const args = tokens.slice(1);
      return new CommandClass(new Arguments(args.map(token => token.text), args.map(token => token.isQuoted))).execute(this.editor);
    } catch (error) {
      return [`error: ${error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : 'unexpected error'}`];
    }
  }
}
