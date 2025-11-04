// regionsData.ts
export interface RegionData {
    capital: string;
    population: string;
    area: string;
    description?: string;
    // добавьте другие поля
  }
  
  export const regionData: Record<string, RegionData> = {
    "Республика Саха (Якутия)": {
        capital: "Якутск",
        population: "1 млн",
        area: "3 083 523 км²",
        description: "Самый крупный регион России"
    },
    "Красноярский край": {
        capital: "Красноярск",
        population: "2.8 млн",
        area: "2 366 797 км²"
    },
    "Хабаровский край": {
        capital: "Хабаровск",
        population: "1.3 млн",
        area: "787 633 км²"
    },
    "Архангельская область": {
        capital: "Архангельск",
        population: "1.1 млн",
        area: "589 913 км²"
    },
    "Республика Адыгея": {
        capital: "Майкоп",
        population: "0.5 млн",
        area: "7 792 км²"
    },
    "Республика Башкортостан": {
        capital: "Уфа",
        population: "4.1 млн",
        area: "142 947 км²"
    },
    "Республика Бурятия": {
        capital: "Улан-Удэ",
        population: "0.9 млн",
        area: "351 334 км²"
    },
    "Республика Алтай": {
        capital: "Горно-Алтайск",
        population: "0.2 млн",
        area: "92 903 км²"
    },
    "Республика Дагестан": {
        capital: "Махачкала",
        population: "3.2 млн",
        area: "50 270 км²"
    },
    "Республика Ингушетия": {
        capital: "Магас",
        population: "0.5 млн",
        area: "3 628 км²"
    },
    "Кабардино-Балкарская Республика": {
        capital: "Нальчик",
        population: "0.9 млн",
        area: "12 470 км²"
    },
    "Ярославская область": {
        capital: "Ярославль",
        population: "1.2 млн",
        area: "36 177 км²"
    },
    "Московская область": {
        capital: "Москва",
        population: "7.9 млн",
        area: "44 329 км²"
    },
    "Москва": {
        capital: "Москва",
        population: "13.1 млн",
        area: "2 561 км²"
    },
    "Ленинградская область": {
        capital: "Санкт-Петербург",
        population: "2.0 млн",
        area: "83 908 км²"
    },
    "Санкт-Петербург": {
        capital: "Санкт-Петербург",
        population: "5.6 млн",
        area: "1 439 км²"
    },
    "Еврейский автономная область": {
        capital: "Биробиджан",
        population: "0.2 млн",
        area: "36 271 км²"
    },
    "Чукотский автономный округ": {
        capital: "Анадырь",
        population: "0.05 млн",
        area: "721 481 км²"
    },
    "Ненецкий автономный округ": {
        capital: "Нарьян-Мар",
        population: "0.04 млн",
        area: "176 810 км²"
    },
    "Ямало-Ненецкий автономный округ": {
        capital: "Салехард",
        population: "0.5 млн",
        area: "769 250 км²"
    },
    "Ханты-Мансийский автономный округ": {
        capital: "Ханты-Мансийск",
        population: "1.7 млн",
        area: "534 801 км²"
    },
    "Донецкая народная республика": {
        capital: "Донецк",
        population: "2.1 млн",
        area: "26 517 км²"
    },
    "Луганская народная республика": {
        capital: "Луганск",
        population: "2.1 млн",
        area: "26 684 км²"
    },
    "Республика Крым": {
        capital: "Симферополь",
        population: "1.9 млн",
        area: "26 081 км²"
    },
    "Херсонская область": {
        capital: "Херсон",
        population: "1.0 млн",
        area: "28 461 км²"
    },
    "Запорожская область": {
        capital: "Запорожье",
        population: "1.7 млн",
        area: "27 180 км²"
    }
    // Добавьте остальные регионы по мере необходимости
};

export const allRegions = Object.keys(regionData);