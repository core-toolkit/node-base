const assert = require('assert');
const { relative } = require('path');

/**
 * @typedef Command
 * @property {Object} command
 * @property {String} command.name
 * @property {Function} command.exec
 * @property {String[]?} command.args
 * @property {String?} command.description
 * @property {String?} command.help
 */


const [, cli, supplpiedCmd, ...suppliedArgs] = process.argv;
const userCli = process.env.npm_command ? 'npm run' : `${process.argv0} ${relative(process.cwd(), cli)}`;

const makeTable = (padding = 4) => {
  const rows = [];
  const max = [];

  const format = (cols) => cols.reduce((str, col, i) => str.concat(col.padEnd(i < max.length - 1 ? max[i] + padding : 0, ' ')), '');

  return {
    addRow(...cols) {
      const strCols = cols.map((col) => String(col));
      for (let i = 0; i < strCols.length; ++i) {
        max[i] = max[i] ? Math.max(strCols[i].length, max[i]) : strCols[i].length;
      }
      rows.push(strCols);
    },
    alignedRows() {
      return rows.map(format);
    },
  };
};

module.exports = () => {
  const commands = [];

  /**
   * @param {String} name
   * @returns {Command?}
   */
  const getCmd = (name) => commands.find((cmd) => cmd.name === name);

  const parseArgs = (args) => {
    const parsed = {
      args: {},
      invalid: [],
    };

    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      const suppliedArg = suppliedArgs[i];
      if (suppliedArg) {
        parsed.args[arg] = suppliedArg;
      } else {
        parsed.invalid.push(arg);
      }
    }

    parsed.error = parsed.invalid.length ? `Missing argument "${parsed.invalid[0]}"` : null;

    return parsed;
  };

  const showHelp = (error, cmd) => {
    if (error) {
      console.error(`${error}\n`);
    }

    let command = '<command>', argsHint = '[...args]';
    if (cmd) {
      command = cmd.name;
      argsHint = cmd.args.map((arg) => `<${arg}>`).join(' ');
    }

    console.log(`Usage: ${userCli} ${command} ${argsHint}`);

    if (!cmd) {
      console.log('\nAvailable commands:');

      const table = makeTable();
      for (const command of commands) {
        table.addRow(command.name, command.description);
      }
      table.alignedRows().forEach((row) => console.log(`    ${row}`));
    } else if (cmd.help) {
      console.log(`\n${cmd.help}`);
    }
  };

  return {
    /**
     * @param {Command|Command[]} command
     */
    register(command) {
      if (Array.isArray(command)) {
        return command.forEach(this.register);
      }

      assert(command, 'No command supplied');
      assert(typeof command === 'object', 'Supplied command is of invalid type');
      assert(command.name && typeof command.name === 'string', 'Property "name" must be a non-empty string');
      assert(!getCmd(command.name), `Command "${command.name}" is already registered`);
      assert(typeof command.exec === 'function', 'Property "exec" must be a callback function');
      assert(command.description && typeof command.description === 'string', 'Property "description" must be a non-empty string');

      const fullCommand = Object.assign({
        args: [],
        help: '',
      }, command);
      commands.push(fullCommand);
    },

    async start() {
      const cmd = getCmd(supplpiedCmd);
      if (!cmd) {
        const error = supplpiedCmd ? `Unrecognized command "${supplpiedCmd}"` : null;
        showHelp(error);
        process.exit(1);
      }

      const parsed = parseArgs(cmd.args);
      if (parsed.error) {
        showHelp(parsed.error, cmd);
        process.exit(2);
      }

      await cmd.exec(parsed.args);

      process.exit(0);
    },
  };
};
