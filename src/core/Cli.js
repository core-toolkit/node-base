const assert = require('assert');

class MissingCommand extends Error { }
class InvalidCommand extends Error { }
class InvalidArgument extends Error { }
class InvalidInvocation extends Error { }

/**
 * @typedef Command
 * @property {String} name
 * @property {Function} exec
 * @property {String[]?} args
 * @property {Object.<string, String>?} defaults
 * @property {String[]?} optional
 * @property {Boolean?} rest
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
    args: ['command'],
    defaults: {},
    optional: ['command'],
    rest: false,
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
      const isRest = command.args.length - i === 1 && command.rest;
      const arg = command.args[i];
      const suppliedArg = (
        isRest ? (args.length >= command.args.length ? args.slice(i) : undefined) : args[i]
      ) || command.defaults[arg];

      if ((isRest && suppliedArg.length) || (!isRest && suppliedArg) || command.optional.includes(arg)) {
        parsed.args[arg] = suppliedArg;
      } else {
        parsed.invalid.push(arg);
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
      defaults: {},
      optional: [],
      rest: false,
      help: '',
    }, command);

    assert(Array.isArray(full.args), 'Property "args" must be an array');
    assert(full.defaults && typeof full.defaults === 'object', 'Property "defaults" must be an object');
    assert(Array.isArray(full.optional), 'Property "optional" must be an array');
    assert(typeof full.rest === 'boolean', 'Property "rest" must be a boolean');

    for (let i = 0; i < full.args.length; ++i) {
      let optional = false, defaultValue = undefined;

      if (full.args[i][0] === '[' && full.args[i][full.args[i].length - 1] === ']') {
        optional = true;
        full.args[i] = full.args[i].substring(1, full.args[i].length - 1);
      }

      const defaultIndex = full.args[i].indexOf('=');
      if (defaultIndex !== -1) {
        optional = true;
        defaultValue = full.args[i].substring(defaultIndex + 1);
        full.args[i] = full.args[i].substring(0, defaultIndex);
      }

      if (full.args[i].indexOf('...') === 0) {
        assert(full.args.length - i === 1, 'The rest argument must always come last');
        full.rest = true;
        defaultValue = defaultValue !== undefined ? [defaultValue] : [];
        full.args[i] = full.args[i].substring(3);
      }

      optional ||= full.defaults[full.args[i]] !== undefined;

      full.defaults[full.args[i]] = defaultValue ?? full.defaults[full.args[i]];
      if (optional) {
        full.optional.push(full.args[i]);
      }
    }

    const firstOptional = full.args.findIndex((v) => full.optional.includes(v));
    const lastMandatory = full.args.reduceRight((idx, v, i) => (idx > -1 || full.optional.includes(v) ? idx : i), -1);
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

    const parsed = parseArgs(args, command);
    if (parsed.error) {
      throw new InvalidArgument(parsed.error);
    }

    process.chdir(Project.path);
    const code = await command.exec(parsed.args, CliInterface, { list, run });
    return Number.isInteger(code) ? code : 0;
  };

  const usage = (cmd) => {
    const command = getCommand(cmd);
    const args = command ? command.args.map((arg, i) => {
      let out = arg;
      if (command.rest && i === command.args.length - 1) {
        out = `...${arg}`;
      }
      if (command.defaults[arg] !== undefined) {
        out = `${arg}=${command.defaults[arg]}`;
      }
      return command.optional.includes(arg) ? `[${out}]` : `<${out}>`;
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
