import type { Manual } from '../../types/manual';

import zhongpaoPingfengmaShort from './zhongpao-pingfengma-short.json';

export const manuals: Manual[] = [zhongpaoPingfengmaShort as Manual];

export function getManualById(id: string | undefined): Manual | undefined {
  if (!id) return undefined;
  return manuals.find((manual) => manual.id === id);
}
