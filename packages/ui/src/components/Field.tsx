import type { FieldsetHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { useId } from 'react';
import { Heading } from '../primitives';
import type { ControlSize } from './Button';

export type FieldStateProps = {
  /** Visible or visually-hidden accessible label owned by the field. */
  label: ReactNode;
  /** Supplemental guidance associated with the native control through aria-describedby. */
  description?: ReactNode;
  /** Validation error associated through aria-describedby/aria-errormessage. */
  error?: ReactNode;
  /** Visually hides the label while preserving the native label relationship. @default false */
  hideLabel?: boolean;
  /** Projects native required semantics and a visual required indicator. @default false */
  required?: boolean;
  /** Visual copy shown for non-required fields. Hidden from the accessibility tree. @default Optional */
  optionalLabel?: ReactNode;
  /** Projects native disabled semantics and disabled field presentation. @default false */
  disabled?: boolean;
  /** Projects native read-only semantics without disabling selection or form submission. @default false */
  readOnly?: boolean;
  /** Shared control target/height scale. @default md */
  fieldSize?: ControlSize;
  /** Logical-leading visual slot. Decorative unless leadingLabel is supplied. */
  leading?: ReactNode;
  /** Accessible label for a meaningful leading visual. Omit to keep the slot decorative. */
  leadingLabel?: string;
  /** Visible logical prefix associated with the control description. */
  prefix?: ReactNode;
  /** Visible logical suffix associated with the control description. */
  suffix?: ReactNode;
  /** Logical-trailing control/content slot. Interactive children retain their own semantics. */
  trailing?: ReactNode;
  /** Optional action adjacent to support/error copy; the child owns its own interaction semantics. */
  supportingAction?: ReactNode;
};

export type FieldIds = {
  controlId: string;
  labelId: string;
  descriptionId?: string;
  errorId?: string;
  prefixId?: string;
  suffixId?: string;
  describedBy?: string;
};

export function useFieldIds({
  id,
  description,
  error,
  prefix,
  suffix,
  describedBy,
}: {
  id?: string;
  description?: ReactNode;
  error?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  describedBy?: string;
}): FieldIds {
  const generatedId = useId();
  const controlId = id ?? `oxs-field-${generatedId}`;
  const labelId = `${controlId}-label`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const prefixId = prefix ? `${controlId}-prefix` : undefined;
  const suffixId = suffix ? `${controlId}-suffix` : undefined;
  const resolvedDescribedBy =
    [describedBy, prefixId, suffixId, descriptionId, errorId].filter(Boolean).join(' ') ||
    undefined;

  return {
    controlId,
    labelId,
    descriptionId,
    errorId,
    prefixId,
    suffixId,
    describedBy: resolvedDescribedBy,
  };
}

export function FieldFrame({
  ids,
  label,
  description,
  error,
  hideLabel = false,
  required = false,
  optionalLabel = 'Optional',
  disabled = false,
  readOnly = false,
  fieldSize = 'md',
  leading,
  leadingLabel,
  prefix,
  suffix,
  trailing,
  supportingAction,
  multiline = false,
  className = '',
  children,
}: PropsWithChildren<
  FieldStateProps & {
    ids: FieldIds;
    multiline?: boolean;
    className?: string;
  }
>) {
  return (
    <div
      className={[
        'ui-field',
        `ui-field--${fieldSize}`,
        multiline ? 'ui-field--multiline' : '',
        disabled ? 'ui-field--disabled' : '',
        readOnly ? 'ui-field--readonly' : '',
        error ? 'ui-field--invalid' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={Boolean(error) || undefined}
    >
      <div className="ui-field__heading">
        <span className="ui-field__label-row">
          <label
            id={ids.labelId}
            className={hideLabel ? 'ui-visually-hidden' : 'ui-field__label'}
            htmlFor={ids.controlId}
          >
            {label}
          </label>
          {required && !hideLabel ? (
            <span className="ui-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {!required && optionalLabel && !hideLabel ? (
          <span className="ui-field__optional" aria-hidden="true">
            {optionalLabel}
          </span>
        ) : null}
      </div>

      <div className="ui-field__control">
        {leading ? (
          leadingLabel ? (
            <span
              className="ui-field__slot ui-field__slot--leading"
              role="img"
              aria-label={leadingLabel}
            >
              {leading}
            </span>
          ) : (
            <span className="ui-field__slot ui-field__slot--leading" aria-hidden="true">
              {leading}
            </span>
          )
        ) : null}
        {prefix ? (
          <span id={ids.prefixId} className="ui-field__affix ui-field__affix--prefix">
            {prefix}
          </span>
        ) : null}
        {children}
        {suffix ? (
          <span id={ids.suffixId} className="ui-field__affix ui-field__affix--suffix">
            {suffix}
          </span>
        ) : null}
        {trailing ? (
          <span className="ui-field__slot ui-field__slot--trailing">{trailing}</span>
        ) : null}
      </div>

      {description || error || supportingAction ? (
        <div className="ui-field__support-row">
          <div className="ui-field__support-copy">
            {description ? (
              <span id={ids.descriptionId} className="ui-field__support">
                {description}
              </span>
            ) : null}
            {error ? (
              <span
                id={ids.errorId}
                className="ui-field__support ui-field__support--error"
                role="alert"
              >
                {error}
              </span>
            ) : null}
          </div>
          {supportingAction ? (
            <div className="ui-field__support-action">{supportingAction}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type FieldGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> & {
  /** Native legend for the related field group. Omit only when an external accessible name is supplied. */
  label?: ReactNode;
  /** Supplemental group guidance associated through aria-describedby. */
  description?: ReactNode;
  /** Logical visual arrangement of the child fields; native fieldset semantics stay unchanged. @default vertical */
  orientation?: 'vertical' | 'horizontal';
};

export function FieldGroup({
  label,
  description,
  orientation = 'vertical',
  className = '',
  children,
  'aria-describedby': ariaDescribedBy,
  ...props
}: PropsWithChildren<FieldGroupProps>) {
  const generatedId = useId();
  const labelId = label ? `oxs-field-group-${generatedId}` : undefined;
  const descriptionId = description ? `oxs-field-group-description-${generatedId}` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      {...props}
      aria-describedby={describedBy}
      className={`ui-field-group ui-field-group--${orientation} ${className}`.trim()}
    >
      {label ? (
        <legend id={labelId} className="ui-field-group__label">
          {label}
        </legend>
      ) : null}
      {description ? (
        <div id={descriptionId} className="ui-field-group__description">
          {description}
        </div>
      ) : null}
      <div className="ui-field-group__content">{children}</div>
    </fieldset>
  );
}

export type FieldSectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** Accessible section heading. */
  title: ReactNode;
  /** Native heading level used by the public Heading primitive. @default 3 */
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  /** Supplemental section guidance associated through aria-describedby. */
  description?: ReactNode;
  /** Optional section-level action region; child controls retain their own semantics. */
  action?: ReactNode;
};

export function FieldSection({
  title,
  titleLevel = 3,
  description,
  action,
  className = '',
  children,
  ...props
}: PropsWithChildren<FieldSectionProps>) {
  const generatedId = useId();
  const titleId = `oxs-field-section-${generatedId}`;
  const descriptionId = description ? `oxs-field-section-description-${generatedId}` : undefined;

  return (
    <section
      {...props}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`ui-field-section ${className}`.trim()}
    >
      <header className="ui-field-section__header">
        <div className="ui-field-section__copy">
          <Heading id={titleId} className="ui-field-section__title" level={titleLevel}>
            {title}
          </Heading>
          {description ? (
            <p id={descriptionId} className="ui-field-section__description">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="ui-field-section__action">{action}</div> : null}
      </header>
      <div className="ui-field-section__content">{children}</div>
    </section>
  );
}
