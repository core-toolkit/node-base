const assert = require('assert');

class MissingCommand extends Error { }
class InvalidCommand extends Error { }
class InvalidArgument extends Error { }
class InvalidInvocation extends Error { }

/**
 * @typedef ArgumentObject
 * @property {String} name
 * @property {String?} defaultValue
 * @property {Boolean?} optional
 * @property {Boolean?} rest
 *
 * @typedef {String|ArgumentObject} Argument
 *
 * @typedef Command
 * @property {String} name
 * @property {Function} exec
 * @property {Argument[]?} args
 * @property {String?} description
 * @property {String?} help
 *
 * @typedef Cli
 * @property {(command: Command|Command[]) => void} register
 * @property {(cmd: String, ...args: String) => Promise<Number>} run
 * @property {(cmd: String|null) => String} usage
 * @property {() => String[]} usage
 * @property {MissingCommand} MissingCommand
 * @property {InvalidCommand} InvalidCommand
 * @property {InvalidArgument} InvalidArgument
 * @property {InvalidInvocation} InvalidInvocation
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
  const commands = [{
    name: 'help',
    args: [{ name: 'command', rest: false, optional: true, defaultValue: undefined }],
    help: '',
    description: '',
    exec() {
      throw new InvalidInvocation();
    },
  }];

  /**
   * @returns {String[]}
   */
  const list = () => commands.map(({ name }) => name).filter((name) => name !== 'help');

  /**
   * @param {String} name
   * @returns {Command?}
   */
  const getCommand = (name) => commands.find((command) => command.name === name);

  /**
   *
   * @param {Argument} arg
   * @returns {ArgumentObject}
   */
  const parseArg = (arg) => {
    arg = typeof arg === 'string' ? { name: arg } : { ...arg };
    arg.defaultValue ??= undefined;
    arg.optional ??= false;
    arg.rest ??= false;

    if (arg.name[0] === '[' && arg.name[arg.name.length - 1] === ']') {
      arg.optional = true;
      arg.name = arg.name.substring(1, arg.name.length - 1);
    }

    const defaultIndex = arg.name.indexOf('=');
    if (defaultIndex !== -1) {
      arg.optional = true;
      arg.defaultValue = arg.name.substring(defaultIndex + 1);
      arg.name = arg.name.substring(0, defaultIndex);
    }

    if (arg.name.indexOf('...') === 0) {
      arg.rest = true;
      arg.name = arg.name.substring(3);
    }

    return arg;
  };

  /**
   * @param {String[]|String?} value
   * @param {ArgumentObject} arg
   * @returns {{ value: any, missing: Boolean }}
   */
  const readArg = (value, arg) => {
    if (!arg.rest) {
      return {
        value: value ?? arg.defaultValue,
        missing: value === undefined,
      };
    }
    return {
      value: value.length || !arg.defaultValue ? value : [arg.defaultValue],
      missing: !value.length,
    }
  };

  /**
   * @param {String[]} args
   * @param {Command} command
   * @returns {{ args: Object.<string, String>, invalid: String[], error: (String|null) }}
   */
  const readArgs = (args, command) => {
    const parsed = {
      args: {},
      invalid: [],
    };

    for (let i = 0; i < command.args.length; ++i) {
      const arg = command.args[i];
      const { value } = arg.rest ? readArg(args.slice(i), arg) : readArg(args[i], arg);

      if ((arg.rest && value.length) || (!arg.rest && value) || arg.optional) {
        parsed.args[arg.name] = value;
      } else {
        parsed.invalid.push(arg.name);
      }
    }

    parsed.error = parsed.invalid.length ? `Missing argument "${parsed.invalid[0]}"` : null;

    return parsed;
  };

  const register = (command, skipDuplicate) => {
    if (Array.isArray(command)) {
      return command.forEach((subCommand) => register(subCommand, skipDuplicate));
    }

    assert(command, 'No command supplied');
    assert(typeof command === 'object', 'Supplied command is of invalid type');
    assert(command.name && typeof command.name === 'string', 'Property "name" must be a non-empty string');

    const existing = getCommand(command.name);
    if (existing && skipDuplicate) {
      return;
    }
    assert(!getCommand(command.name), `Command "${command.name}" is already registered`);
    assert(typeof command.exec === 'function', 'Property "exec" must be a callback function');
    assert(command.description && typeof command.description === 'string', 'Property "description" must be a non-empty string');

    const full = Object.assign({
      args: [],
      help: '',
    }, command);

    assert(Array.isArray(full.args), 'Property "args" must be an array');

    for (let i = 0; i < full.args.length; ++i) {
      full.args[i] = parseArg(full.args[i]);
      assert(!full.args[i].rest || full.args.length - i === 1, 'The rest argument must always come last');
    }

    const firstOptional = full.args.findIndex(({ optional }) => optional);
    const lastMandatory = full.args.reduceRight((idx, { optional }, i) => (idx > -1 || optional ? idx : i), -1);
    assert(firstOptional === -1 || firstOptional > lastMandatory, 'Required arguments must come before optional ones');

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

    const parsed = readArgs(args, command);
    if (parsed.error) {
      throw new InvalidArgument(parsed.error);
    }

    process.chdir(Project.path);
    const code = await command.exec(parsed.args, CliInterface, { list, run });
    return Number.isInteger(code) ? code : 0;
  };

  const usage = (cmd) => {
    const command = getCommand(cmd);
    const args = command ? command.args.map((arg) => {
      let out = arg.name;
      if (arg.rest) {
        out = `...${out}`;
      }
      if (arg.defaultValue !== undefined) {
        out = `${out}=${arg.defaultValue}`;
      }
      return arg.optional ? `[${out}]` : `<${out}>`;
    }).join(' ') : '[...args]';
    const out = [`Usage: ${Project.cmd} ${command?.name || '<command>'} ${args}`];

    if (!command) {
      out.push(`       ${Project.cmd} help <command>`);
      out.push('', 'Available commands:');

      const table = makeTable();
      for (const name of list()) {
        const { description } = getCommand(name);
        table.addRow(name, description);
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
    InvalidInvocation,
    register,
    run,
    usage,
    list,
  };
};
