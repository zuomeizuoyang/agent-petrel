import { PetrelBackground, definePetrel } from './element';
import type { PetrelOptions } from './options';
/** Idempotent attachment; the host remains responsible for its own stacking order. */
export function mountPetrel(host: HTMLElement, options: Partial<PetrelOptions> = {}) {
  definePetrel();
  const existing = Array.from(host.children).find(el => el instanceof PetrelBackground) as PetrelBackground | undefined;
  if (existing) return existing;
  const element = document.createElement('petrel-background') as PetrelBackground;
  for (const [key, value] of Object.entries(options)) {
    element.setAttribute(key === 'reducedMotion' ? 'reduced-motion' : key === 'centerClear' ? 'center-clear' : key, String(value));
  }
  host.prepend(element);
  return element;
}
