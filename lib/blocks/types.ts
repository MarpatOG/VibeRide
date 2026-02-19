import {Locale} from '@/lib/locale';

export type BlockBase = {
  id: string;
  type: string;
  version: number;
  enabled: boolean;
  props: Record<string, unknown>;
};

export type ContentPageJson = {
  pageKey: string;
  locale: Locale | string;
  blocks: BlockBase[];
};

