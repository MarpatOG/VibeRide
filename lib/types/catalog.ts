import {Localized} from '@/lib/types/localized';

export type Product = {
  id: string;
  type: 'plan' | 'certificate' | 'single';
  name: Localized;
  description: Localized;
  price: number;
  credits?: number;
};

export type Promotion = {
  id: string;
  title: Localized;
  description: Localized;
  packageRides: number;
  active: boolean;
};

export type FaqItem = {
  id: string;
  question: Localized;
  answer: Localized;
  category?: string;
};

export type Notification = {
  id: string;
  title: Localized;
  body: Localized;
  time: string;
  type: 'waitlist' | 'reminder';
  isRead?: boolean;
};

