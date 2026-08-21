import type { EditableTextSessionSnapshot, UiClipboardAdapter } from '@ontologyx/ui';
import {
  Button,
  Code,
  SearchField,
  Stack,
  Text,
  TextArea,
  TextField,
  UiRoot,
  Wrap,
} from '@ontologyx/ui';
import { useMemo, useRef, useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'TextField',
    layer: 'components',
    category: 'Fields',
    order: 30,
    summary:
      'Single-line native field with shared relationships and a host-neutral editable-text session bridge.',
    usage:
      'Use for generic single-line text entry. Keep validation/product state outside the component; native form, label, affix, selection, composition and secure-session rules remain intact.',
    status: 'accepted',
    accessibility:
      'Uses native input/label/required/read-only/disabled/validation semantics, aria-errormessage for explicit errors, and descriptive relationships for guidance and meaningful affixes.',
    rtl: 'Field chrome uses logical edges while editable content can independently use auto, LTR or RTL bidi direction.',
    touch:
      'Preserves the shared field target floor and root-scoped text-session bridge without taking ownership of a native IME or keyboard.',
    responsive:
      'Fills the available container and publishes occlusion-aware logical scroll margins from UiRoot environment insets.',
    examples: [
      {
        id: 'native-form',
        title: 'Native form contract',
        description:
          'Controlled/uncontrolled values, required validation, autocomplete, reset and FormData submission remain native.',
        component: 'TextFieldNativeFormExample',
      },
      {
        id: 'host-session',
        title: 'Host text session + occlusion',
        description:
          'UiRoot exposes a metadata-only editing bridge while transient keyboard occlusion stays a separate logical host input.',
        component: 'EditableHostSessionExample',
      },
      {
        id: 'clipboard-race',
        title: 'Clipboard adapter race cancellation',
        description:
          'A delayed paste is invalidated when its root swaps clipboard transport; stale text never enters the active field.',
        component: 'ClipboardRaceExample',
      },
    ],
  },
  {
    exportName: 'SearchField',
    layer: 'components',
    category: 'Fields',
    order: 30,
    summary:
      'Controlled searchbox with composition-safe clear behavior and a caller-owned suggestions seam.',
    usage:
      'Use for search/filter entry. SearchField owns clear/search affordances but never owns suggestion data or a popup; callers provide the value and suggestions request behavior.',
    status: 'accepted',
    accessibility:
      'Carries native searchbox semantics, a real label, and labelled clear/suggestions actions that remain unavailable while composition is active.',
    rtl: 'Search text and affordances preserve logical ordering and independent bidi text direction.',
    touch:
      'Clear and suggestions actions preserve the accepted IconButton/Button target floor inside the field.',
    responsive:
      'Fits narrow toolbars/containers without shrinking trailing actions below their target contract.',
    examples: [
      {
        id: 'composition-safe-search',
        title: 'Composition-safe search',
        description:
          'Clear and suggestions requests pause while an IME composition is active, then resume without stealing focus.',
        component: 'SearchFieldCompositionExample',
      },
    ],
    playground: {
      preferredWidth: 'medium',
      controls: ['value', 'disabled', 'readOnly', 'suggestionsAvailable'],
      fixture: {
        value: 'Launcher',
        label: 'Search applications',
        placeholder: 'Search apps and commands',
      },
    },
  },
  {
    exportName: 'TextArea',
    layer: 'components',
    category: 'Fields',
    order: 30,
    summary: 'Multiline native field sharing the field-frame and host text-session contracts.',
    usage:
      'Use for multiline text. Keep validation and controlled state in application code; resize, character guidance, selection and composition remain native/browser-owned.',
    status: 'accepted',
    accessibility:
      'Uses native textarea label/required/read-only/disabled semantics with explicit description/error relationships; character guidance is visible but not a per-keystroke live region.',
    rtl: 'Supports content bidi direction independently of logical field chrome and resize policy.',
    touch:
      'Selection/composition flow through the same root-scoped editable-text session without replacing native textarea gestures.',
    responsive:
      'Logical block resize and occlusion-aware scroll margins remain safe inside narrow containers.',
    examples: [
      {
        id: 'multiline-native',
        title: 'Multiline native contract',
        description:
          'Textarea selection, character guidance and native form/reset behavior share the canonical field frame.',
        component: 'TextAreaNativeExample',
      },
    ],
  },
] as const);

export function TextFieldNativeFormExample() {
  const initialAlias = 'controlled';
  const [alias, setAlias] = useState(initialAlias);
  const [submission, setSubmission] = useState('Not submitted');

  return (
    <Stack gap="md">
      <form
        data-field-native-form
        onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget).entries());
          setSubmission(JSON.stringify(values));
        }}
        onReset={() => {
          setAlias(initialAlias);
          setSubmission('Reset');
        }}
      >
        <Stack gap="sm">
          <TextField
            label="Workspace name"
            name="workspace"
            defaultValue="OntologyX"
            description="Native uncontrolled value with browser autocomplete enabled."
            autoComplete="organization"
            required
          />
          <TextField
            label="Alias"
            name="alias"
            value={alias}
            onChange={(event) => setAlias(event.currentTarget.value)}
            prefix="@"
            suffix=".local"
          />
          <TextField label="Tenant" name="tenant" value="local" readOnly />
          <TextField label="Ignored disabled field" name="ignored" value="omit-me" disabled />
          <TextField
            label="Recovery code"
            value="expired"
            readOnly
            error="This code has expired."
            supportingAction={
              <Button size="sm" variant="quiet">
                Request new code
              </Button>
            }
          />
          <Wrap gap="sm">
            <Button type="submit" variant="primary">
              Submit native form
            </Button>
            <Button type="reset" variant="secondary">
              Reset native form
            </Button>
          </Wrap>
        </Stack>
      </form>
      <Text tone="secondary">Form result</Text>
      <Code data-field-form-result>{submission}</Code>
    </Stack>
  );
}

export function SearchFieldCompositionExample() {
  const [value, setValue] = useState('Launcher');
  const [composing, setComposing] = useState(false);
  const [suggestionRequests, setSuggestionRequests] = useState(0);

  return (
    <Stack gap="sm">
      <SearchField
        label="Search applications"
        value={value}
        onValueChange={setValue}
        suggestionsAvailable
        onSuggestionsRequest={() => setSuggestionRequests((count) => count + 1)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
      />
      <Code data-search-value>{value || '∅'}</Code>
      <Code data-search-composing>{composing ? 'composing' : 'settled'}</Code>
      <Code data-search-suggestions>{String(suggestionRequests)}</Code>
    </Stack>
  );
}

export function TextAreaNativeExample() {
  const [result, setResult] = useState('Not submitted');
  return (
    <Stack gap="sm">
      <form
        data-textarea-native-form
        onSubmit={(event) => {
          event.preventDefault();
          setResult(String(new FormData(event.currentTarget).get('notes') ?? ''));
        }}
        onReset={() => setResult('Reset')}
      >
        <Stack gap="sm">
          <TextArea
            label="Notes"
            name="notes"
            defaultValue="Touch-first, responsive and RTL-safe."
            maxLength={160}
            showCharacterCount
            rows={5}
            required
          />
          <Wrap gap="sm">
            <Button type="submit" variant="primary">
              Submit notes
            </Button>
            <Button type="reset" variant="secondary">
              Reset notes
            </Button>
          </Wrap>
        </Stack>
      </form>
      <Code data-textarea-form-result>{result}</Code>
    </Stack>
  );
}

export function EditableHostSessionExample() {
  const [active, setActive] = useState(false);
  const [session, setSession] = useState<EditableTextSessionSnapshot | null>(null);
  const bridge = useMemo(
    () => ({
      begin: (next: EditableTextSessionSnapshot) => {
        setSession(next);
        setActive(true);
      },
      update: (next: EditableTextSessionSnapshot) => setSession(next),
      end: () => setActive(false),
    }),
    [],
  );

  return (
    <UiRoot occlusion={{ blockEnd: '280px' }} editingBridge={bridge}>
      <Stack gap="md" data-editable-host-session>
        <TextField
          label="IME target"
          defaultValue="hello@example.com"
          contentPurpose="email"
          enterKeyHint="next"
        />
        <TextField
          label="Secure target"
          defaultValue="secret-value"
          secure
          contentPurpose="password"
          autoComplete="current-password"
        />
        <TextArea label="Multiline host target" defaultValue="Line one" enterKeyHint="done" />
        <Code data-editable-session-active>{active ? 'active' : 'inactive'}</Code>
        <Code data-editable-session-id>{session?.id ?? 'none'}</Code>
        <Code data-editable-session-purpose>{session?.state.contentPurpose ?? 'none'}</Code>
        <Code data-editable-session-composing>{session?.state.composing ? 'true' : 'false'}</Code>
        <Code data-editable-session-preedit>{session?.state.preedit || '∅'}</Code>
        <Code data-editable-session-multiline>
          {session?.descriptor.multiline ? 'true' : 'false'}
        </Code>
        <Code data-editable-session-inputmode>{session?.descriptor.inputMode ?? 'none'}</Code>
        <Code data-editable-session-selection>
          {session ? `${session.state.selection.start}:${session.state.selection.end}` : 'none'}
        </Code>
        <Code data-editable-session-enterkey>{session?.descriptor.enterKeyHint ?? 'none'}</Code>
      </Stack>
    </UiRoot>
  );
}

export function ClipboardRaceExample() {
  const [adapterVersion, setAdapterVersion] = useState(1);
  const [value, setValue] = useState('seed');
  const pendingPasteRef = useRef<((text: string) => void) | null>(null);
  const adapter = useMemo<UiClipboardAdapter>(
    () => ({
      isAvailable: () => true,
      writeText: () => true,
      readText: () =>
        new Promise<string>((resolve) => {
          pendingPasteRef.current = resolve;
        }),
    }),
    [adapterVersion],
  );

  return (
    <UiRoot clipboardAdapter={adapter}>
      <Stack gap="sm" data-clipboard-race-example>
        <TextField
          label="Clipboard race target"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
        <Wrap gap="sm">
          <Button
            data-rotate-clipboard-adapter
            onClick={() => setAdapterVersion((version) => version + 1)}
          >
            Rotate clipboard adapter
          </Button>
          <Button
            data-resolve-pending-paste
            variant="secondary"
            onClick={() => {
              pendingPasteRef.current?.('stale-paste');
              pendingPasteRef.current = null;
            }}
          >
            Resolve pending paste
          </Button>
        </Wrap>
        <Code data-clipboard-adapter-version>{String(adapterVersion)}</Code>
        <Code data-clipboard-race-value>{value}</Code>
      </Stack>
    </UiRoot>
  );
}
