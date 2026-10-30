import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { Repl } from './cli/Repl.js';
import { Editor } from './application/Editor.js';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';

await new Repl(new CommandDispatcher(new Editor(new FileDocumentStore()))).run();
