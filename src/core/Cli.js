const assert = require('assert');

class MissingCommand extends Error { }
class InvalidCommand extends Error { }
class InvalidArgument extends Error { }

/**
 * @typedef Command
 * @property {String} name
 * @property {Function} exec
 * @property {String[]?} args
 * @property {Object.<string, String>?} defaults
 * @property {String?} description
 * @property {String?} help
 *
 * @typedef Cli
 * @property {(command: Command|Command[]) => void} register
 * @property {(cmd: String, ...args: String) => Promise} run
 * @property {(cmd: String|null) => String} usage
 * @property {MissingCommand} MissingCommand
 * @property {InvalidCommand} InvalidCommand
 * @property {InvalidArgument} InvalidArgument
 *
 * @typedef Table
 * @property {(...cols: String) => void} addRow
 * @property {() => String[]} alignedRows
 */

/**
 * @param {Number} [padding]
 * @returns {Table}
 */
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

/**
 * @param {Object} app
 * @param {Object} app.Core
 * @param {Object} app.Core.Project
 * @param {String} app.Core.Project.cmd
 * @returns {Cli}
 */
module.exports = ({ Core: { Project, CliInterface } }) => {
  const commands = [];

  /**
   * @param {String} name
   * @returns {Command?}
   */
  const getCommand = (name) => commands.find((command) => command.name === name);

  /**
   * @param {String[]} args
   * @param {Command} command
   * @returns {{ args: Object.<string, String>, invalid: String[], error: (String|null) }}
   */
  const parseArgs = (args, command) => {
    const parsed = {
      args: {},
      invalid: [],
    };

    for (let i = 0; i < command.args.length; ++i) {
      const arg = command.args[i];
      const suppliedArg = args[i] || command.defaults[arg];
      if (suppliedArg) {
        parsed.args[arg] = suppliedArg;
      } else {
        parsed.invalid.push(arg);
      }
    }

    parsed.error = parsed.invalid.length ? `Missing argument "${parsed.invalid[0]}"` : null;

    return parsed;
  };

  const register = (command) => {
    if (Array.isArray(command)) {
      return command.forEach(register);
    }

    assert(command, 'No command supplied');
    assert(typeof command === 'object', 'Supplied command is of invalid type');
    assert(command.name && typeof command.name === 'string', 'Property "name" must be a non-empty string');
    assert(!getCommand(command.name), `Command "${command.name}" is already registered`);
    assert(typeof command.exec === 'function', 'Property "exec" must be a callback function');
    assert(command.description && typeof command.description === 'string', 'Property "description" must be a non-empty string');

    const full = Object.assign({
      args: [],
      defaults: {},
      help: '',
    }, command);

    assert(Array.isArray(full.args), 'Property "args" must be an array');
    assert(full.defaults && typeof full.defaults === 'object', 'Property "defaults" must be an object');

    for (let i = 0; i < full.args.length; ++i) {
      const arg = full.args[i];
      const index = arg.indexOf('=');
      if (index !== -1) {
        full.args[i] = arg.substring(0, index);
        full.defaults[full.args[i]] = arg.substring(index + 1);
      }
    }

    commands.push(full);
  };

  const run = async (cmd, ...args) => {
    if (!cmd) {
      throw new MissingCommand();
    }

    const command = getCommand(cmd);
    if (!command) {
      throw new InvalidCommand(`Unrecognized command "${cmd}"`);
    }

    const parsed = parseArgs(args, command);
    if (parsed.error) {
      throw new InvalidArgument(parsed.error);
    }

    process.chdir(Project.path);
    await command.exec(parsed.args, CliInterface);
  };

  const usage = (cmd) => {
    const command = getCommand(cmd);
    const args = command ? command.args.map((arg) => `<${arg}>`).join(' ') : '[...args]';
    const out = [`Usage: ${Project.cmd} ${command?.name || '<command>'} ${args}`];

    if (!command) {
      out.push('', 'Available commands:');

      const table = makeTable();
      for (const command of commands) {
        table.addRow(command.name, command.description);
      }
      table.alignedRows().forEach((row) => out.push(`    ${row}`));
    } else if (command.help) {
      out.push('', command.help);
    }

    return out.join('\n');
  };

  return {
    MissingCommand,
    InvalidCommand,
    InvalidArgument,
    register,
    run,
    usage,
  };
};
