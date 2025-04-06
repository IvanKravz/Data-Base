import React from 'react';
import { divisions } from '../../data/divisionsData';
import { Tabs, Tab } from '@mui/material';

interface DivisionSelectorProps {
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

export function DivisionSelector({ selectedDivision, onDivisionChange }: DivisionSelectorProps) {
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    onDivisionChange(newValue);
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <Tabs 
        value={selectedDivision}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: '48px',
          '& .MuiTab-root': {
            minHeight: '48px',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#2563eb',
          }
        }}
      >
        <Tab 
          label="Все подразделения" 
          value="all"
          sx={{
            color: 'text.secondary',
            '&.Mui-selected': {
              color: '#2563eb',
            }
          }}
        />
        {divisions.map((division) => (
          <Tab
            key={division.id}
            label={division.name}
            value={division.name}
            sx={{
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#2563eb',
              }
            }}
          />
        ))}
      </Tabs>
    </div>
  );
}