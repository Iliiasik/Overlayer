export function pinShadowHost(host: HTMLElement, zIndex: number): void {
  const set = (property: string, value: string) =>
    host.style.setProperty(property, value, 'important');
  set('position', 'absolute');
  set('inset', 'auto');
  set('top', '0');
  set('left', '0');
  set('width', '0');
  set('height', '0');
  set('margin', '0');
  set('padding', '0');
  set('border', 'none');
  set('background', 'transparent');
  set('overflow', 'visible');
  set('display', 'block');
  set('visibility', 'visible');
  set('opacity', '1');
  set('transform', 'none');
  set('filter', 'none');
  set('z-index', String(zIndex));
  if (typeof host.showPopover === 'function') {
    host.setAttribute('popover', 'manual');
    try {
      host.showPopover();
    } catch {
      host.removeAttribute('popover');
    }
  }
}

export function setShadowHostVisible(host: HTMLElement, visible: boolean): void {
  host.style.setProperty('visibility', visible ? 'visible' : 'hidden', 'important');
}
