import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

class Replay {
  run(path) {
    const result = spawnSync(process.execPath, ['dist/main.js'], {
      input: readFileSync(path, 'utf8'), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.status ?? 1;
  }
}

new Replay().run(process.argv[2] ?? 'examples/flowchart.txt');
