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

export type EditableSelection = {
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
};

export type EditableTextState = {
  valueLength: number;
  selection: EditableSelection;
  composing: boolean;
  preedit: string;
  contentPurpose: EditableContentPurpose;
  secure: boolean;
};


export type EditableTextSessionSnapshot = {
  id: string;
  state: EditableTextState;
};
