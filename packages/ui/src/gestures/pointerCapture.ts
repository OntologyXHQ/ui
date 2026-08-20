export function setPointerCaptureIfSupported(target: HTMLElement, pointerId: number) {
  const setPointerCapture = target.setPointerCapture;
  if (typeof setPointerCapture !== 'function') return false;
  try {
    setPointerCapture.call(target, pointerId);
    return true;
  } catch {
    return false;
  }
}

export function releasePointerCaptureIfSupported(target: HTMLElement, pointerId: number) {
  const releasePointerCapture = target.releasePointerCapture;
  if (typeof releasePointerCapture !== 'function') return false;
  try {
    const hasPointerCapture = target.hasPointerCapture;
    if (typeof hasPointerCapture === 'function' && !hasPointerCapture.call(target, pointerId))
      return false;
    releasePointerCapture.call(target, pointerId);
    return true;
  } catch {
    return false;
  }
}
