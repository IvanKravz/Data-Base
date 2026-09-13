// components/equipment/categoryIcons.tsx
import {
    Server,
    RadioTower,
    Monitor,
    BatteryCharging,
    Antenna,
    Zap,
    Box,
    KeyRound,
    type LucideIcon,
  } from 'lucide-react';
  
  /**
   * Соответствие «код категории → иконка» для ОТКРЫТЫХ категорий.
   * Для закрытых категорий (is_closed === true) всегда используется KeyRound —
   * см. getCategoryIconComponent.
   */
  export const CATEGORY_ICON_COMPONENTS: Record<string, LucideIcon> = {
    tko: Server,
    radio: RadioTower,
    computer: Monitor,
    battery: BatteryCharging,
    antenna: Antenna,
    power: Zap,
    material: Box,
    // На случай, если где-то в данных реально придёт value='closed':
    closed: KeyRound,
  };
  
  interface CategoryLike {
    value?: string | null;
    is_closed?: boolean | null;
  }
  
  /**
   * Возвращает компонент иконки для категории.
   *
   * Поддерживает два варианта вызова:
   *   • getCategoryIconComponent(item.category)        // объект — учитывает is_closed
   *   • getCategoryIconComponent(category.value)       // строка value — обратная совместимость
   *
   * Логика:
   *   — если передан объект и is_closed === true → KeyRound;
   *   — иначе ищем по value в CATEGORY_ICON_COMPONENTS;
   *   — если не нашли — возвращаем null (вызывающий код подставит фолбэк Box).
   */
  export function getCategoryIconComponent(
    categoryOrValue?: CategoryLike | string | null,
  ): LucideIcon | null {
    if (!categoryOrValue) return null;
  
    // Объект категории
    if (typeof categoryOrValue === 'object') {
      if (categoryOrValue.is_closed) return KeyRound;
  
      const value = categoryOrValue.value;
      if (!value) return null;
      return CATEGORY_ICON_COMPONENTS[String(value).toLowerCase()] ?? null;
    }
  
    // Строка value — старое поведение
    return CATEGORY_ICON_COMPONENTS[String(categoryOrValue).toLowerCase()] ?? null;
  }