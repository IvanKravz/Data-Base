// SziTable.tsx
import React from 'react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { ShieldCheck } from 'lucide-react';

interface SziTableProps {
    /** Отфильтрованный список СЗИ (с учётом поиска) */
    equipment: Equipment[];
    /** Общее количество СЗИ на объекте (до поиска) */
    totalCount?: number;
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${d}.${m}.${date.getFullYear()}`;
    } catch {
        return '—';
    }
}

export function SziTable({ equipment, totalCount }: SziTableProps) {
    const count = totalCount ?? equipment.length;

    return (
        <Section title="">
            <div className="facility-szi-block">
                <div className="facility-szi-header">
                    <ShieldCheck size={18} className="facility-szi-icon" />
                    <span className="facility-szi-title">
                        Средства защиты информации (СЗИ)
                    </span>
                    <span className="facility-szi-count">({count})</span>
                </div>

                {equipment.length === 0 ? (
                    <div className="facility-details-comments-empty">Ничего не найдено</div>
                ) : (
                    <div className="facility-equipment-table-wrapper">
                        <table className="facility-equipment-table facility-szi-table">
                            <thead>
                                <tr>
                                    <th>№ п/п</th>
                                    <th>Название</th>
                                    <th>Серийный номер</th>
                                    <th>Инв. номер</th>
                                    <th>№ сертификата</th>
                                    <th>Дата сертификата</th>
                                    <th>Закреплено</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((item, index) => (
                                    <tr key={item.id} className="facility-equipment-row facility-szi-row">
                                        <td>{index + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.serial_number || '—'}</td>
                                        <td>{item.inventory_number || '—'}</td>
                                        <td>{item.szi_certificate_number || '—'}</td>
                                        <td>{formatDate(item.szi_certificate_date)}</td>
                                        <td>{item.assigned_to?.full_name || '—'}</td>
                                        <td>
                                            <span className={`facility-equipment-status-badge ${getStatusColor(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Section>
    );
}