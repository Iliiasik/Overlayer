export function isEditableElement(node: EventTarget | null): boolean {
  return (
    node instanceof HTMLElement &&
    (node.isContentEditable || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')
  );
}

export function isEditableEventTarget(event: Event): boolean {
  return isEditableElement(event.composedPath()[0] ?? null);
}
