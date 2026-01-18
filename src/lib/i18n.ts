export type Language = 'en' | 'ru' | 'kz';
export type Currency = 'USD' | 'RUB' | 'KZT';

export const translations = {
  en: {
    // Navigation
    'nav.catalog': 'Catalog',
    'nav.orders': 'Orders',
    'nav.chat': 'Chat',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.becomeChef': 'Become a Chef',
    'nav.myDishes': 'My Dishes',
    'nav.earnings': 'Earnings',
    'nav.adminPanel': 'Admin Panel',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Hero
    'hero.title': 'Homemade Food,',
    'hero.titleHighlight': 'Made with Love',
    'hero.subtitle': 'Discover authentic home-cooked meals from talented local chefs in your neighborhood',
    'hero.cta': 'Explore Dishes',
    'hero.ctaSecondary': 'Become a Chef',
    
    // Catalog
    'catalog.title': 'Discover Delicious Dishes',
    'catalog.search': 'Search dishes, cuisines, or chefs...',
    'catalog.filters': 'Filters',
    'catalog.cuisine': 'Cuisine',
    'catalog.price': 'Price Range',
    'catalog.rating': 'Rating',
    'catalog.dietary': 'Dietary',
    'catalog.delivery': 'Delivery Time',
    'catalog.addToCart': 'Add to Cart',
    'catalog.viewDetails': 'View Details',
    'catalog.perPortion': 'per portion',
    'catalog.portions': 'portions',
    'catalog.available': 'available',
    
    // Auth
    'auth.login': 'Welcome Back',
    'auth.loginSubtitle': 'Sign in to your account',
    'auth.register': 'Create Account',
    'auth.registerSubtitle': 'Join our community of food lovers',
    'auth.email': 'Email',
    'auth.phone': 'Phone',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signUp': 'Sign Up',
    'auth.signIn': 'Sign In',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.success': 'Success!',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.all': 'All',
    'common.from': 'from',
  },
  ru: {
    // Navigation
    'nav.catalog': 'Каталог',
    'nav.orders': 'Заказы',
    'nav.chat': 'Чат',
    'nav.profile': 'Профиль',
    'nav.login': 'Войти',
    'nav.register': 'Регистрация',
    'nav.becomeChef': 'Стать поваром',
    'nav.myDishes': 'Мои блюда',
    'nav.earnings': 'Доходы',
    'nav.adminPanel': 'Панель админа',
    'nav.settings': 'Настройки',
    'nav.logout': 'Выйти',
    
    // Hero
    'hero.title': 'Домашняя еда,',
    'hero.titleHighlight': 'с любовью',
    'hero.subtitle': 'Откройте для себя аутентичные домашние блюда от талантливых местных поваров',
    'hero.cta': 'Смотреть блюда',
    'hero.ctaSecondary': 'Стать поваром',
    
    // Catalog
    'catalog.title': 'Откройте вкусные блюда',
    'catalog.search': 'Поиск блюд, кухонь или поваров...',
    'catalog.filters': 'Фильтры',
    'catalog.cuisine': 'Кухня',
    'catalog.price': 'Цена',
    'catalog.rating': 'Рейтинг',
    'catalog.dietary': 'Диета',
    'catalog.delivery': 'Время доставки',
    'catalog.addToCart': 'В корзину',
    'catalog.viewDetails': 'Подробнее',
    'catalog.perPortion': 'за порцию',
    'catalog.portions': 'порций',
    'catalog.available': 'доступно',
    
    // Auth
    'auth.login': 'С возвращением',
    'auth.loginSubtitle': 'Войдите в свой аккаунт',
    'auth.register': 'Создать аккаунт',
    'auth.registerSubtitle': 'Присоединяйтесь к нашему сообществу',
    'auth.email': 'Email',
    'auth.phone': 'Телефон',
    'auth.password': 'Пароль',
    'auth.confirmPassword': 'Подтвердите пароль',
    'auth.name': 'Полное имя',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
    'auth.signUp': 'Регистрация',
    'auth.signIn': 'Войти',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Что-то пошло не так',
    'common.success': 'Успешно!',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.view': 'Просмотр',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.sort': 'Сортировка',
    'common.all': 'Все',
    'common.from': 'от',
  },
  kz: {
    // Navigation
    'nav.catalog': 'Каталог',
    'nav.orders': 'Тапсырыстар',
    'nav.chat': 'Чат',
    'nav.profile': 'Профиль',
    'nav.login': 'Кіру',
    'nav.register': 'Тіркелу',
    'nav.becomeChef': 'Аспаз болу',
    'nav.myDishes': 'Менің тағамдарым',
    'nav.earnings': 'Табыс',
    'nav.adminPanel': 'Админ панелі',
    'nav.settings': 'Баптаулар',
    'nav.logout': 'Шығу',
    
    // Hero
    'hero.title': 'Үй тағамы,',
    'hero.titleHighlight': 'сүйіспеншілікпен',
    'hero.subtitle': 'Жергілікті талантты аспаздардың үй тағамдарын ашыңыз',
    'hero.cta': 'Тағамдарды қарау',
    'hero.ctaSecondary': 'Аспаз болу',
    
    // Catalog
    'catalog.title': 'Дәмді тағамдарды табыңыз',
    'catalog.search': 'Тағамдар, асүй немесе аспаздар...',
    'catalog.filters': 'Сүзгілер',
    'catalog.cuisine': 'Асүй',
    'catalog.price': 'Баға',
    'catalog.rating': 'Рейтинг',
    'catalog.dietary': 'Диета',
    'catalog.delivery': 'Жеткізу уақыты',
    'catalog.addToCart': 'Себетке қосу',
    'catalog.viewDetails': 'Толығырақ',
    'catalog.perPortion': 'бір порция',
    'catalog.portions': 'порция',
    'catalog.available': 'қол жетімді',
    
    // Auth
    'auth.login': 'Қайта оралуыңызбен',
    'auth.loginSubtitle': 'Аккаунтыңызға кіріңіз',
    'auth.register': 'Аккаунт құру',
    'auth.registerSubtitle': 'Біздің қауымдастыққа қосылыңыз',
    'auth.email': 'Email',
    'auth.phone': 'Телефон',
    'auth.password': 'Құпия сөз',
    'auth.confirmPassword': 'Құпия сөзді растаңыз',
    'auth.name': 'Толық аты',
    'auth.forgotPassword': 'Құпия сөзді ұмыттыңыз ба?',
    'auth.noAccount': 'Аккаунтыңыз жоқ па?',
    'auth.hasAccount': 'Аккаунтыңыз бар ма?',
    'auth.signUp': 'Тіркелу',
    'auth.signIn': 'Кіру',
    
    // Common
    'common.loading': 'Жүктелуде...',
    'common.error': 'Қате пайда болды',
    'common.success': 'Сәтті!',
    'common.cancel': 'Болдырмау',
    'common.save': 'Сақтау',
    'common.delete': 'Жою',
    'common.edit': 'Өзгерту',
    'common.view': 'Қарау',
    'common.search': 'Іздеу',
    'common.filter': 'Сүзгі',
    'common.sort': 'Сұрыптау',
    'common.all': 'Барлығы',
    'common.from': 'бастап',
  },
};

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  RUB: '₽',
  KZT: '₸',
};

export const currencyRates: Record<Currency, number> = {
  USD: 1,
  RUB: 92,
  KZT: 450,
};

export function formatPrice(priceUSD: number, currency: Currency): string {
  const converted = priceUSD * currencyRates[currency];
  const symbol = currencySymbols[currency];
  
  if (currency === 'USD') {
    return `${symbol}${converted.toFixed(2)}`;
  }
  return `${Math.round(converted)} ${symbol}`;
}

export function t(key: string, language: Language): string {
  return translations[language]?.[key as keyof typeof translations['en']] || key;
}
