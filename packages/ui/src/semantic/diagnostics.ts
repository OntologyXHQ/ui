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
      validateCommandGroup(value, path, diagnostics);
      return;
    case 'collection':
      validateCollection(value, path, diagnostics);
      return;
    case 'confirmation':
      validateConfirmation(value, path, diagnostics);
      return;
    case 'form':
      validateForm(value, path, diagnostics);
      return;
    case 'workspace':
      validateWorkspace(value, path, diagnostics);
      return;
    default:
      diagnostics.push({
        code: 'invalid-node',
        path: `${path}.kind`,
        message: `Unknown UI IR node kind: ${String(value.kind)}.`,
      });
  }
}

function validateCommandGroup(
  value: Record<string, unknown>,
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
  validateAllowedKeys(
    value,
    ['kind', 'id', 'label', 'commands', 'presentation'],
    path,
    diagnostics,
  );
  if (value.id !== undefined) validateId(value.id, `${path}.id`, diagnostics);
  requireString(value.label, `${path}.label`, 'Command group label', diagnostics);

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
      if (command.label !== undefined) {
        requireString(
          command.label,
          `${commandPath}.label`,
          'Command label override',
          diagnostics,
          'invalid-command-reference',
        );
      }
      validateEnum(
        command.emphasis,
        ['quiet', 'secondary', 'primary'],
        `${commandPath}.emphasis`,
        'Command emphasis must be quiet, secondary or primary.',
        diagnostics,
      );
    });
  }

  validatePreferredPresentation(
    value.presentation,
    ['inline', 'menu'],
    path,
    'Command-group presentation preference must be inline or menu.',
    diagnostics,
  );
}

function validateCollection(
  value: Record<string, unknown>,
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
  validateAllowedKeys(
    value,
    [
      'kind',
      'id',
      'source',
      'selection',
      'navigation',
      'commands',
      'activationCommand',
      'presentation',
    ],
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
      validateAllowedKeys(value.selection, ['mode', 'binding'], `${path}.selection`, diagnostics);
      validateEnum(
        value.selection.mode,
        ['none', 'single', 'multiple'],
        `${path}.selection.mode`,
        'Selection mode must be none, single or multiple.',
        diagnostics,
      );
      if (value.selection.binding !== undefined)
        validateId(value.selection.binding, `${path}.selection.binding`, diagnostics);
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
      validateEnum(
        value.navigation.mode,
        ['linear', 'spatial'],
        `${path}.navigation.mode`,
        'Navigation mode must be linear or spatial.',
        diagnostics,
      );
    }
  }

  if (value.activationCommand !== undefined)
    validateId(value.activationCommand, `${path}.activationCommand`, diagnostics);

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

  validatePreferredPresentation(
    value.presentation,
    ['list', 'grid'],
    path,
    'Collection presentation preference must be list or grid.',
    diagnostics,
  );
}

function validateWorkspace(
  value: Record<string, unknown>,
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
  validateAllowedKeys(value, ['kind', 'id', 'label', 'regions'], path, diagnostics);
  validateId(value.id, `${path}.id`, diagnostics);
  requireString(value.label, `${path}.label`, 'Workspace label', diagnostics);
  if (!Array.isArray(value.regions) || value.regions.length === 0) {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.regions`,
      message: 'Workspace requires at least one region.',
    });
    return;
  }
  const seen = new Set<string>();
  const seenRoles = new Set<string>();
  value.regions.forEach((region, index) => {
    const regionPath = `${path}.regions[${index}]`;
    if (!isPlainObject(region)) {
      diagnostics.push({
        code: 'invalid-node',
        path: regionPath,
        message: 'Workspace region must be an object.',
      });
      return;
    }
    validateAllowedKeys(region, ['id', 'role', 'label', 'content'], regionPath, diagnostics);
    validateId(region.id, `${regionPath}.id`, diagnostics);
    if (typeof region.id === 'string' && seen.has(region.id))
      diagnostics.push({
        code: 'invalid-node',
        path: `${regionPath}.id`,
        message: `Duplicate workspace region id: ${region.id}.`,
      });
    if (typeof region.id === 'string') seen.add(region.id);
    validateEnum(
      region.role,
      ['sidebar', 'pane', 'inspector'],
      `${regionPath}.role`,
      'Workspace region role must be sidebar, pane or inspector.',
      diagnostics,
    );
    if (typeof region.role === 'string') {
      if (seenRoles.has(region.role)) {
        diagnostics.push({
          code: 'invalid-node',
          path: `${regionPath}.role`,
          message: `Workspace currently allows at most one ${region.role} region.`,
        });
      }
      seenRoles.add(region.role);
    }
    requireString(region.label, `${regionPath}.label`, 'Workspace region label', diagnostics);
    if (!Array.isArray(region.content) || region.content.length === 0)
      diagnostics.push({
        code: 'invalid-node',
        path: `${regionPath}.content`,
        message: 'Workspace region requires at least one semantic content ID.',
      });
    else
      region.content.forEach((id, contentIndex) =>
        validateId(id, `${regionPath}.content[${contentIndex}]`, diagnostics),
      );
  });
  if (!seenRoles.has('pane')) {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.regions`,
      message: 'Workspace requires exactly one primary pane region.',
    });
  }
}

function validateConfirmation(
  value: Record<string, unknown>,
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
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
  requireString(value.title, `${path}.title`, 'Confirmation title', diagnostics);
  if (value.description !== undefined && typeof value.description !== 'string') {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.description`,
      message: 'Confirmation description must be a string.',
    });
  }
  validateId(value.confirmCommand, `${path}.confirmCommand`, diagnostics);
  if (value.confirmLabel !== undefined) {
    requireString(value.confirmLabel, `${path}.confirmLabel`, 'confirmLabel', diagnostics);
  }
  if (value.cancelLabel !== undefined) {
    requireString(value.cancelLabel, `${path}.cancelLabel`, 'cancelLabel', diagnostics);
  }
  validateEnum(
    value.intent,
    ['neutral', 'destructive'],
    `${path}.intent`,
    'Confirmation intent must be neutral or destructive.',
    diagnostics,
  );
}

function validateForm(value: Record<string, unknown>, path: string, diagnostics: UiIrDiagnostic[]) {
  validateAllowedKeys(value, ['kind', 'id', 'title', 'description', 'fields'], path, diagnostics);
  validateId(value.id, `${path}.id`, diagnostics);
  requireString(value.title, `${path}.title`, 'Form title', diagnostics);
  if (value.description !== undefined && typeof value.description !== 'string') {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.description`,
      message: 'Form description must be a string.',
    });
  }
  if (!Array.isArray(value.fields) || value.fields.length === 0) {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.fields`,
      message: 'Form requires at least one semantic field.',
    });
    return;
  }
  value.fields.forEach((field, index) =>
    validateFormControl(field, `${path}.fields[${index}]`, diagnostics),
  );
}

function validateFormControl(value: unknown, path: string, diagnostics: UiIrDiagnostic[]) {
  if (!isPlainObject(value) || typeof value.kind !== 'string') {
    diagnostics.push({
      code: 'invalid-node',
      path,
      message: 'Form control must be a plain object with a kind.',
    });
    return;
  }

  if (value.kind === 'field') {
    validateAllowedKeys(
      value,
      [
        'kind',
        'id',
        'binding',
        'label',
        'description',
        'placeholder',
        'purpose',
        'required',
        'disabled',
        'readOnly',
      ],
      path,
      diagnostics,
    );
    validateSharedFormControl(value, path, diagnostics);
    if (value.placeholder !== undefined && typeof value.placeholder !== 'string') {
      diagnostics.push({
        code: 'invalid-node',
        path: `${path}.placeholder`,
        message: 'Field placeholder must be a string.',
      });
    }
    validateEnum(
      value.purpose,
      ['text', 'search', 'url', 'email', 'number', 'decimal', 'telephone', 'password'],
      `${path}.purpose`,
      'Field purpose is not supported.',
      diagnostics,
    );
    return;
  }

  if (value.kind === 'choice') {
    validateAllowedKeys(
      value,
      [
        'kind',
        'id',
        'binding',
        'optionsSource',
        'label',
        'description',
        'placeholder',
        'required',
        'disabled',
        'readOnly',
        'presentation',
      ],
      path,
      diagnostics,
    );
    validateSharedFormControl(value, path, diagnostics);
    validateId(value.optionsSource, `${path}.optionsSource`, diagnostics);
    if (value.placeholder !== undefined && typeof value.placeholder !== 'string') {
      diagnostics.push({
        code: 'invalid-node',
        path: `${path}.placeholder`,
        message: 'Choice placeholder must be a string.',
      });
    }
    validatePreferredPresentation(
      value.presentation,
      ['select', 'segmented', 'radio'],
      path,
      'Choice presentation preference must be select, segmented or radio.',
      diagnostics,
    );
    return;
  }

  if (value.kind === 'toggle') {
    validateAllowedKeys(
      value,
      ['kind', 'id', 'binding', 'label', 'description', 'disabled', 'readOnly'],
      path,
      diagnostics,
    );
    validateSharedFormControl(value, path, diagnostics);
    return;
  }

  diagnostics.push({
    code: 'invalid-node',
    path: `${path}.kind`,
    message: `Unknown form control kind: ${String(value.kind)}.`,
  });
}

function validateSharedFormControl(
  value: Record<string, unknown>,
  path: string,
  diagnostics: UiIrDiagnostic[],
) {
  validateId(value.id, `${path}.id`, diagnostics);
  validateId(value.binding, `${path}.binding`, diagnostics);
  requireString(value.label, `${path}.label`, 'Field label', diagnostics);
  if (value.description !== undefined && typeof value.description !== 'string') {
    diagnostics.push({
      code: 'invalid-node',
      path: `${path}.description`,
      message: 'Field description must be a string.',
    });
  }
  for (const key of ['required', 'disabled', 'readOnly'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') {
      diagnostics.push({
        code: 'invalid-node',
        path: `${path}.${key}`,
        message: `${key} must be a boolean when provided.`,
      });
    }
  }
}

function validatePreferredPresentation(
  value: unknown,
  allowed: readonly string[],
  parentPath: string,
  message: string,
  diagnostics: UiIrDiagnostic[],
) {
  if (value === undefined) return;
  const path = `${parentPath}.presentation`;
  if (!isPlainObject(value)) {
    diagnostics.push({
      code: 'invalid-node',
      path,
      message: 'Presentation must be an object.',
    });
    return;
  }
  validateAllowedKeys(value, ['preferred'], path, diagnostics);
  validateEnum(value.preferred, allowed, `${path}.preferred`, message, diagnostics);
}

function validateEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  message: string,
  diagnostics: UiIrDiagnostic[],
) {
  if (value !== undefined && !allowed.includes(String(value))) {
    diagnostics.push({ code: 'invalid-enum', path, message });
  }
}

function requireString(
  value: unknown,
  path: string,
  label: string,
  diagnostics: UiIrDiagnostic[],
  code: UiIrDiagnosticCode = 'invalid-node',
) {
  if (!nonEmptyString(value)) {
    diagnostics.push({ code, path, message: `${label} must be a non-empty string.` });
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
    if (!Number.isFinite(value)) {
      diagnostics.push({
        code: 'non-serializable',
        path,
        message: 'IR numbers must be finite.',
      });
    }
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
