import type { UiDefinition } from './model';

export type UiIrDiagnosticCode =
  | 'invalid-root'
  | 'invalid-version'
  | 'invalid-id'
  | 'invalid-node'
  | 'invalid-command-reference'
  | 'invalid-enum'
  | 'unknown-field'
  | 'non-serializable';

export type UiIrDiagnostic = {
  code: UiIrDiagnosticCode;
  path: string;
  message: string;
};

export class UiIrValidationError extends Error {
  readonly diagnostics: readonly UiIrDiagnostic[];

  constructor(diagnostics: readonly UiIrDiagnostic[]) {
    super(formatUiIrDiagnostics(diagnostics));
    this.name = 'UiIrValidationError';
    this.diagnostics = diagnostics;
  }
}

export function formatUiIrDiagnostics(diagnostics: readonly UiIrDiagnostic[]) {
  return diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join('\n');
}

export function assertValidUiDefinition(value: unknown): asserts value is UiDefinition {
  const diagnostics = validateUiDefinition(value);
  if (diagnostics.length > 0) throw new UiIrValidationError(diagnostics);
}

export function validateUiDefinition(value: unknown): readonly UiIrDiagnostic[] {
  const diagnostics: UiIrDiagnostic[] = [];
  if (!isPlainObject(value)) {
    return [{ code: 'invalid-root', path: '$', message: 'UI IR root must be a plain object.' }];
  }

  validateSerializable(value, '$', diagnostics, new Set());
  validateAllowedKeys(value, ['irVersion', 'kind', 'id', 'nodes'], '$', diagnostics);

  if (value.irVersion !== 1) {
    diagnostics.push({
      code: 'invalid-version',
      path: '$.irVersion',
      message: 'UI IR irVersion must be 1.',
    });
  }
  if (value.kind !== 'surface') {
    diagnostics.push({
      code: 'invalid-root',
      path: '$.kind',
      message: 'UI IR root kind must be "surface".',
    });
  }
  validateId(value.id, '$.id', diagnostics);
  if (!Array.isArray(value.nodes)) {
    diagnostics.push({
      code: 'invalid-root',
      path: '$.nodes',
      message: 'Surface nodes must be an array.',
    });
    return diagnostics;
  }

  value.nodes.forEach((node, index) => validateNode(node, `$.nodes[${index}]`, diagnostics));
  return diagnostics;
}

function validateNode(value: unknown, path: string, diagnostics: UiIrDiagnostic[]) {
  if (!isPlainObject(value) || typeof value.kind !== 'string') {
    diagnostics.push({
      code: 'invalid-node',
      path,
      message: 'IR node must be a plain object with a kind.',
    });
    return;
  }

  switch (value.kind) {
    case 'command-group':
      validateAllowedKeys(
        value,
        ['kind', 'id', 'label', 'commands', 'presentation'],
        path,
        diagnostics,
      );
      if (value.id !== undefined) validateId(value.id, `${path}.id`, diagnostics);
      if (!nonEmptyString(value.label)) {
        diagnostics.push({
          code: 'invalid-node',
          path: `${path}.label`,
          message: 'Command group label must be a non-empty string.',
        });
      }
      if (!Array.isArray(value.commands) || value.commands.length === 0) {
        diagnostics.push({
          code: 'invalid-node',
          path: `${path}.commands`,
          message: 'Command group requires at least one command reference.',
        });
      } else {
        value.commands.forEach((command, index) => {
          const commandPath = `${path}.commands[${index}]`;
          if (!isPlainObject(command)) {
            diagnostics.push({
              code: 'invalid-command-reference',
              path: commandPath,
              message: 'Command reference must be an object.',
            });
            return;
          }
          validateAllowedKeys(command, ['command', 'label', 'emphasis'], commandPath, diagnostics);
          validateId(command.command, `${commandPath}.command`, diagnostics);
          if (command.label !== undefined && !nonEmptyString(command.label)) {
            diagnostics.push({
              code: 'invalid-command-reference',
              path: `${commandPath}.label`,
              message: 'Command label override must be a non-empty string.',
            });
          }
          if (
            command.emphasis !== undefined &&
            !['quiet', 'secondary', 'primary'].includes(String(command.emphasis))
          ) {
            diagnostics.push({
              code: 'invalid-enum',
              path: `${commandPath}.emphasis`,
              message: 'Command emphasis must be quiet, secondary or primary.',
            });
          }
        });
      }
      if (value.presentation !== undefined) {
        if (!isPlainObject(value.presentation)) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.presentation`,
            message: 'Command-group presentation must be an object.',
          });
        } else {
          validateAllowedKeys(
            value.presentation,
            ['preferred'],
            `${path}.presentation`,
            diagnostics,
          );
          if (
            value.presentation.preferred !== undefined &&
            !['inline', 'menu'].includes(String(value.presentation.preferred))
          ) {
            diagnostics.push({
              code: 'invalid-enum',
              path: `${path}.presentation.preferred`,
              message: 'Command-group presentation preference must be inline or menu.',
            });
          }
        }
      }
      break;

    case 'collection':
      validateAllowedKeys(
        value,
        ['kind', 'id', 'source', 'selection', 'navigation', 'commands', 'presentation'],
        path,
        diagnostics,
      );
      validateId(value.id, `${path}.id`, diagnostics);
      validateId(value.source, `${path}.source`, diagnostics);
      if (value.selection !== undefined) {
        if (!isPlainObject(value.selection)) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.selection`,
            message: 'Collection selection must be an object.',
          });
        } else {
          validateAllowedKeys(value.selection, ['mode'], `${path}.selection`, diagnostics);
          if (
            value.selection.mode !== undefined &&
            !['none', 'single', 'multiple'].includes(String(value.selection.mode))
          ) {
            diagnostics.push({
              code: 'invalid-enum',
              path: `${path}.selection.mode`,
              message: 'Selection mode must be none, single or multiple.',
            });
          }
        }
      }
      if (value.navigation !== undefined) {
        if (!isPlainObject(value.navigation)) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.navigation`,
            message: 'Collection navigation must be an object.',
          });
        } else {
          validateAllowedKeys(value.navigation, ['mode'], `${path}.navigation`, diagnostics);
          if (
            value.navigation.mode !== undefined &&
            !['linear', 'spatial'].includes(String(value.navigation.mode))
          ) {
            diagnostics.push({
              code: 'invalid-enum',
              path: `${path}.navigation.mode`,
              message: 'Navigation mode must be linear or spatial.',
            });
          }
        }
      }
      if (value.commands !== undefined) {
        if (!Array.isArray(value.commands)) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.commands`,
            message: 'Collection commands must be an array of command IDs.',
          });
        } else {
          value.commands.forEach((command, index) =>
            validateId(command, `${path}.commands[${index}]`, diagnostics),
          );
        }
      }
      if (value.presentation !== undefined) {
        if (!isPlainObject(value.presentation)) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.presentation`,
            message: 'Collection presentation must be an object.',
          });
        } else {
          validateAllowedKeys(
            value.presentation,
            ['preferred'],
            `${path}.presentation`,
            diagnostics,
          );
          if (
            value.presentation.preferred !== undefined &&
            !['list', 'grid'].includes(String(value.presentation.preferred))
          ) {
            diagnostics.push({
              code: 'invalid-enum',
              path: `${path}.presentation.preferred`,
              message: 'Collection presentation preference must be list or grid.',
            });
          }
        }
      }
      break;

    case 'confirmation':
      validateAllowedKeys(
        value,
        [
          'kind',
          'id',
          'title',
          'description',
          'confirmCommand',
          'confirmLabel',
          'cancelLabel',
          'intent',
        ],
        path,
        diagnostics,
      );
      if (value.id !== undefined) validateId(value.id, `${path}.id`, diagnostics);
      if (!nonEmptyString(value.title)) {
        diagnostics.push({
          code: 'invalid-node',
          path: `${path}.title`,
          message: 'Confirmation title must be a non-empty string.',
        });
      }
      if (value.description !== undefined && typeof value.description !== 'string') {
        diagnostics.push({
          code: 'invalid-node',
          path: `${path}.description`,
          message: 'Confirmation description must be a string.',
        });
      }
      validateId(value.confirmCommand, `${path}.confirmCommand`, diagnostics);
      for (const field of ['confirmLabel', 'cancelLabel'] as const) {
        if (value[field] !== undefined && !nonEmptyString(value[field])) {
          diagnostics.push({
            code: 'invalid-node',
            path: `${path}.${field}`,
            message: `${field} must be a non-empty string when provided.`,
          });
        }
      }
      if (
        value.intent !== undefined &&
        !['neutral', 'destructive'].includes(String(value.intent))
      ) {
        diagnostics.push({
          code: 'invalid-enum',
          path: `${path}.intent`,
          message: 'Confirmation intent must be neutral or destructive.',
        });
      }
      break;

    default:
      diagnostics.push({
        code: 'invalid-node',
        path: `${path}.kind`,
        message: `Unknown UI IR node kind: ${String(value.kind)}.`,
      });
  }
}

function validateAllowedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (allowedSet.has(key)) continue;
    diagnostics.push({
      code: 'unknown-field',
      path: `${path}.${key}`,
      message: `Unsupported UI IR field: ${key}.`,
    });
  }
}

function validateId(value: unknown, path: string, diagnostics: UiIrDiagnostic[]) {
  if (!nonEmptyString(value) || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/u.test(value)) {
    diagnostics.push({
      code: 'invalid-id',
      path,
      message:
        'Semantic IDs must be non-empty and contain only letters, numbers, dot, underscore, colon, slash or dash.',
    });
  }
}

function validateSerializable(
  value: unknown,
  path: string,
  diagnostics: UiIrDiagnostic[],
  ancestors: Set<object>,
) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      diagnostics.push({ code: 'non-serializable', path, message: 'IR numbers must be finite.' });
    return;
  }
  if (['undefined', 'function', 'symbol', 'bigint'].includes(typeof value)) {
    diagnostics.push({
      code: 'non-serializable',
      path,
      message: `IR values must be JSON-serializable; found ${typeof value}.`,
    });
    return;
  }
  if (typeof value !== 'object') return;
  if (ancestors.has(value)) {
    diagnostics.push({
      code: 'non-serializable',
      path,
      message: 'IR values must not contain cycles.',
    });
    return;
  }
  if (!Array.isArray(value) && !isPlainObject(value)) {
    diagnostics.push({
      code: 'non-serializable',
      path,
      message: 'IR objects must be plain JSON objects or arrays.',
    });
    return;
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateSerializable(item, `${path}[${index}]`, diagnostics, nextAncestors),
    );
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    validateSerializable(item, `${path}.${key}`, diagnostics, nextAncestors);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
