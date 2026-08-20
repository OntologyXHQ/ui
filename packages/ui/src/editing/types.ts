export const EDITABLE_CONTENT_PURPOSES = [
  'text',
  'search',
  'url',
  'email',
  'number',
  'decimal',
  'telephone',
  'password',
] as const;

export type EditableContentPurpose = (typeof EDITABLE_CONTENT_PURPOSES)[number];

export type EditableInputMode =
  | 'none'
  | 'text'
  | 'decimal'
  | 'numeric'
  | 'tel'
  | 'search'
  | 'email'
  | 'url';

export type EditableEnterKeyHint =
  | 'enter'
  | 'done'
  | 'go'
  | 'next'
  | 'previous'
  | 'search'
  | 'send';

export type EditableSelection = {
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
};

/**
 * Host-facing text state. It intentionally excludes the committed text value.
 * Secure sessions additionally redact preedit text so platform bridges never receive secret content.
 */
export type EditableTextState = {
  valueLength: number;
  selection: EditableSelection;
  composing: boolean;
  preedit: string;
  contentPurpose: EditableContentPurpose;
  secure: boolean;
};

/** Host-neutral hints for a focused native text session; the host still owns IME/keyboard lifecycle. */
export type EditableTextSessionDescriptor = {
  multiline: boolean;
  inputMode: EditableInputMode;
  enterKeyHint?: EditableEnterKeyHint;
  readOnly: boolean;
};

export type EditableTextSessionSnapshot = {
  id: string;
  descriptor: EditableTextSessionDescriptor;
  state: EditableTextState;
};
