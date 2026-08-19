type OxLoadingMarkProps = {
  className?: string;
};

/**
 * Internal OntologyX loading mark shared by feedback and control loading states.
 * The choreography writes the X, closes the O, lands a two-beat pulse, then releases
 * back into an equivalent loop boundary. Accessibility semantics stay with the owner.
 */
export function OxLoadingMark({ className = '' }: OxLoadingMarkProps) {
  return (
    <svg
      className={`ui-ox-loading-mark ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-oxs-loading-mark="ox"
      data-oxs-loading-choreography="write-heartbeat-release"
    >
      <circle
        className="ui-ox-loading-mark__echo ui-ox-loading-mark__echo--primary"
        cx="12"
        cy="12"
        r="8.25"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="ui-ox-loading-mark__echo ui-ox-loading-mark__echo--secondary"
        cx="12"
        cy="12"
        r="8.25"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="ui-ox-loading-mark__track"
        cx="12"
        cy="12"
        r="8.25"
        pathLength="100"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="ui-ox-loading-mark__orbit"
        cx="12"
        cy="12"
        r="8.25"
        pathLength="100"
        vectorEffect="non-scaling-stroke"
      />
      <g className="ui-ox-loading-mark__cross">
        <path
          className="ui-ox-loading-mark__cross-stroke ui-ox-loading-mark__cross-stroke--a"
          d="M8.4 8.4 15.6 15.6"
          pathLength="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="ui-ox-loading-mark__cross-stroke ui-ox-loading-mark__cross-stroke--b"
          d="M15.6 8.4 8.4 15.6"
          pathLength="1"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
