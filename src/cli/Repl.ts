import { createInterface } from 'node:readline';
import { CommandDispatcher } from './CommandDispatcher.js';

export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher) {}
  async run(): Promise<void> {
    const reader = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
    reader.setPrompt('svg> ');
    reader.prompt();
    for await (const line of reader) {
      for (const message of this.dispatcher.execute(line)) process.stdout.write(`${message}\n`);
      reader.prompt();
    }
  }
}
