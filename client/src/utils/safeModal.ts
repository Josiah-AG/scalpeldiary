import DOMPurify from 'dompurify';
// Legacy detail popups share one restricted renderer until migrated to React dialogs.
export function setModalContent(modal: HTMLElement, html: string) {
  modal.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div','p','span','strong','h2','h3','h4','button','svg','path','br'],
    ALLOWED_ATTR: ['class','viewBox','fill','stroke','d','stroke-width','stroke-linecap','stroke-linejoin'],
  });
  const previous = document.activeElement as HTMLElement | null;
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label', modal.querySelector('h3')?.textContent || 'Details');
  const close = () => { modal.remove(); previous?.focus(); };
  modal.onclick = event => { if (event.target === modal) close(); };
  const button = modal.querySelector('button');
  if (button) { button.setAttribute('aria-label','Close details'); button.onclick = close; }
  modal.onkeydown = event => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') { event.preventDefault(); button?.focus(); }
  };
  queueMicrotask(() => button?.focus());
}
