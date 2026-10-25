// components/ScheduleTabs/ScheduleTabs.tsx
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import './ScheduleTabs.css';

export interface ScheduleTab {
    id: string;
    name: string;
    count: number;
    order: number;
}

interface ScheduleTabsProps {
    divisionTabs: ScheduleTab[];
    subdivisionTabs: ScheduleTab[];
    activeDivisionTab: string;
    activeSubdivisionTab: string;
    onDivisionChange: (id: string) => void;
    onSubdivisionChange: (id: string) => void;
    showDivisionTabs: boolean;
    showSubdivisionTabs: boolean;
}

const ScheduleTabs: React.FC<ScheduleTabsProps> = ({
    divisionTabs,
    subdivisionTabs,
    activeDivisionTab,
    activeSubdivisionTab,
    onDivisionChange,
    onSubdivisionChange,
    showDivisionTabs,
    showSubdivisionTabs,
}) => {
    const divisionTabsRef = useRef<HTMLDivElement>(null);
    const subdivisionTabsRef = useRef<HTMLDivElement>(null);
    const [divisionIndicator, setDivisionIndicator] = useState({ left: 0, width: 0 });
    const [subdivisionIndicator, setSubdivisionIndicator] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        if (!divisionTabsRef.current) return;
        const btn = divisionTabsRef.current.querySelector('.schedule-division-tab.active') as HTMLElement | null;
        if (btn) setDivisionIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
        else setDivisionIndicator({ left: 0, width: 0 });
    }, [activeDivisionTab, divisionTabs, showDivisionTabs]);

    useLayoutEffect(() => {
        if (!subdivisionTabsRef.current) return;
        const btn = subdivisionTabsRef.current.querySelector('.schedule-subdivision-tab.active') as HTMLElement | null;
        if (btn) setSubdivisionIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
        else setSubdivisionIndicator({ left: 0, width: 0 });
    }, [activeSubdivisionTab, subdivisionTabs, showSubdivisionTabs]);

    useEffect(() => {
        const onResize = () => {
            if (divisionTabsRef.current) {
                const btn = divisionTabsRef.current.querySelector('.schedule-division-tab.active') as HTMLElement | null;
                if (btn) setDivisionIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
            }
            if (subdivisionTabsRef.current) {
                const btn = subdivisionTabsRef.current.querySelector('.schedule-subdivision-tab.active') as HTMLElement | null;
                if (btn) setSubdivisionIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (!showDivisionTabs && !showSubdivisionTabs) return null;

    return (
        <>
            {showDivisionTabs && (
                <div className="schedule-division-tabs" ref={divisionTabsRef}>
                    {divisionTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`schedule-division-tab ${activeDivisionTab === tab.id ? 'active' : ''}`}
                            onClick={() => onDivisionChange(tab.id)}
                        >
                            <span>{tab.name}</span>
                            <span className="schedule-division-tab-count">{tab.count}</span>
                        </button>
                    ))}
                    <div
                        className="schedule-division-tabs-indicator"
                        style={{ left: `${divisionIndicator.left}px`, width: `${divisionIndicator.width}px` }}
                    />
                </div>
            )}

            {showSubdivisionTabs && (
                <div className="schedule-subdivision-tabs" ref={subdivisionTabsRef}>
                    {subdivisionTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`schedule-subdivision-tab ${activeSubdivisionTab === tab.id ? 'active' : ''}`}
                            onClick={() => onSubdivisionChange(tab.id)}
                        >
                            <span>{tab.name}</span>
                            <span className="schedule-subdivision-tab-count">{tab.count}</span>
                        </button>
                    ))}
                    <div
                        className="schedule-subdivision-tabs-indicator"
                        style={{ left: `${subdivisionIndicator.left}px`, width: `${subdivisionIndicator.width}px` }}
                    />
                </div>
            )}
        </>
    );
};

export default ScheduleTabs;