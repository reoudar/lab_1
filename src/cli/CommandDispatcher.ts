import { Tokenizer } from './Tokenizer.js';

export class CommandDispatcher {
  private readonly tokenizer = new Tokenizer();
  execute(line: string): string[] {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (tokens.length === 0) return [];
      if (tokens[0]!.text !== 'help') throw new Error(`unknown command: ${tokens[0]!.text}`);
      if (tokens.length !== 1) throw new Error('usage: help');
      return ['help — show commands (editing commands arrive in subsequent stages)'];
    } catch (error) {
      return [`error: ${error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : 'unexpected error'}`];
    }
  }
}
