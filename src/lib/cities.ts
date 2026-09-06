// Kazakhstan cities used for buyer search and chef cooking location
export const CITIES = [
  'Almaty',
  'Astana',
  'Shymkent',
  'Karaganda',
  'Aktobe',
  'Taraz',
  'Pavlodar',
  'Ust-Kamenogorsk',
  'Semey',
  'Atyrau',
  'Kostanay',
  'Kyzylorda',
  'Uralsk',
  'Petropavl',
  'Aktau',
  'Temirtau',
  'Turkestan',
  'Kokshetau',
  'Taldykorgan',
  'Ekibastuz',
] as const;

export type City = (typeof CITIES)[number];

const CITY_NAMES: Record<string, { ru: string; kz: string }> = {
  Almaty: { ru: 'Алматы', kz: 'Алматы' },
  Astana: { ru: 'Астана', kz: 'Астана' },
  Shymkent: { ru: 'Шымкент', kz: 'Шымкент' },
  Karaganda: { ru: 'Караганда', kz: 'Қарағанды' },
  Aktobe: { ru: 'Актобе', kz: 'Ақтөбе' },
  Taraz: { ru: 'Тараз', kz: 'Тараз' },
  Pavlodar: { ru: 'Павлодар', kz: 'Павлодар' },
  'Ust-Kamenogorsk': { ru: 'Усть-Каменогорск', kz: 'Өскемен' },
  Semey: { ru: 'Семей', kz: 'Семей' },
  Atyrau: { ru: 'Атырау', kz: 'Атырау' },
  Kostanay: { ru: 'Костанай', kz: 'Қостанай' },
  Kyzylorda: { ru: 'Кызылорда', kz: 'Қызылорда' },
  Uralsk: { ru: 'Уральск', kz: 'Орал' },
  Petropavl: { ru: 'Петропавловск', kz: 'Петропавл' },
  Aktau: { ru: 'Актау', kz: 'Ақтау' },
  Temirtau: { ru: 'Темиртау', kz: 'Теміртау' },
  Turkestan: { ru: 'Туркестан', kz: 'Түркістан' },
  Kokshetau: { ru: 'Кокшетау', kz: 'Көкшетау' },
  Taldykorgan: { ru: 'Талдыкорган', kz: 'Талдықорған' },
  Ekibastuz: { ru: 'Экибастуз', kz: 'Екібастұз' },
};

export function getCityLabel(city: string, language: string): string {
  const entry = CITY_NAMES[city];
  if (!entry) return city;
  if (language === 'ru') return entry.ru;
  if (language === 'kz') return entry.kz;
  return city;
}
