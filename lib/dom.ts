export function isEditableElement(node: EventTarget | null): boolean {
  return (
    node instanceof HTMLElement &&
    (node.isContentEditable || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')
  );
}
