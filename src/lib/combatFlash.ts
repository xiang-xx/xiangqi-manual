export type CombatFlashKind = 'check' | 'checkmate';

type Listener = (kind: CombatFlashKind) => void;

const listeners = new Set<Listener>();

export function triggerCombatFlash(kind: CombatFlashKind): void {
  for (const listener of listeners) listener(kind);
}

export function subscribeCombatFlash(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
