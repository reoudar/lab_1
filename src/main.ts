import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { Repl } from './cli/Repl.js';

await new Repl(new CommandDispatcher()).run();
