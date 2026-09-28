import type { Manual } from '../../types/manual';
import { sortTags } from '../tags';

import cheshaDuansha from './chesha-duansha.json';
import feixiangJu from './feixiang-ju.json';
import meihuapuSample from './meihuapu-sample.json';
import shunpaoZhijun from './shunpao-zhijun.json';
import xianrenZhilu from './xianren-zhilu.json';
import zhongpaoPingfengmaShort from './zhongpao-pingfengma-short.json';

export const manuals: Manual[] = [
  zhongpaoPingfengmaShort as Manual,
  shunpaoZhijun as Manual,
  feixiangJu as Manual,
  xianrenZhilu as Manual,
  meihuapuSample as Manual,
  cheshaDuansha as Manual,
];

export function getManualById(id: string | undefined): Manual | undefined {
  if (!id) return undefined;
  return manuals.find((manual) => manual.id === id);
}

export function allTags(): string[] {
  return sortTags(manuals.flatMap((m) => m.tags));
}

/** 多 tag 取交集；空选中则返回全部 */
export function filterManualsByTags(selectedTags: string[]): Manual[] {
  if (selectedTags.length === 0) return manuals;
  return manuals.filter((manual) => selectedTags.every((tag) => manual.tags.includes(tag)));
}
