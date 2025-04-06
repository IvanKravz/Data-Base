import { Monitor, Package, AlertTriangle, Trash2 } from 'lucide-react';

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'in-operation':
      return 'Эксплуатируется';
    case 'in-storage':
      return 'На складе';
    case 'defective':
      return 'Неисправно';
    case 'for-disposal':
      return 'На списание';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'in-operation':
      return 'text-green-500';
    case 'in-storage':
      return 'text-blue-500';
    case 'defective':
      return 'text-yellow-500';
    case 'for-disposal':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'in-operation':
      return Monitor;
    case 'in-storage':
      return Package;
    case 'defective':
      return AlertTriangle;
    case 'for-disposal':
      return Trash2;
    default:
      return Monitor;
  }
};