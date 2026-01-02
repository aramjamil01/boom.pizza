
import { MenuItem, Table } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'کەبابی گۆشت',
    category: 'خواردنی سەرەکی',
    price: 12000,
    description: 'کەبابی گۆشتی تازە لەگەڵ برنج و نان',
    image: 'https://picsum.photos/seed/kebab/400/300'
  },
  {
    id: '2',
    name: 'شۆربای نیسک',
    category: 'پێشەکی',
    price: 3500,
    description: 'شۆربای نیسکی گەرم بە تامی لیمۆ',
    image: 'https://picsum.photos/seed/soup/400/300'
  },
  {
    id: '3',
    name: 'پیتزای مریشک',
    category: 'خواردنی خێرا',
    price: 10000,
    description: 'پیتزای مریشک بە جۆرەها سەوزە',
    image: 'https://picsum.photos/seed/pizza/400/300'
  },
  {
    id: '4',
    name: 'سەڵاتەی کوردی',
    category: 'زەڵاتە',
    price: 4000,
    description: 'سەوزەواتی تەماتە و خەیار و پیاز',
    image: 'https://picsum.photos/seed/salad/400/300'
  }
];

export const TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: 'available'
}));
