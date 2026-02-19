import {Localized} from '@/lib/types/localized';

export type Trainer = {
  id: string;
  name: string;
  lastName: string;
  photoUrl: string;
  tags: string[];
  bio: Localized;
};

