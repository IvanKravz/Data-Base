export interface MapObject {
    id: number;
    name: string;
    lat: number;
    lng: number;
    address: string;
    description?: string;
  }
  
  export const objects: MapObject[] = [
    {
      id: 1,
      name: "Администрация Хабаровска",
      lat: 48.4748,
      lng: 135.0788,
      address: "Хабаровск, ул. Карла Маркса, 66",
      description: "Здание городской администрации"
    },
    {
      id: 2,
      name: "Железнодорожный вокзал",
      lat: 48.4833,
      lng: 135.0667,
      address: "Хабаровск, Привокзальная площадь, 1"
    },
    // Добавьте другие объекты
  ];