// DivisionDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Overview } from './sections/Overview';
import { divisionsApi } from '../../../api';
import { Header } from './sections/Header';
import MapView from '../../map/MapView';
import { Skeleton } from '@mui/material';

export function DivisionDetails() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [division, setDivision] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        setDivision(div);
      } catch (err) {
        setError('Не удалось загрузить данные об объекте');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" width="100%" height={72} />
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i}
              variant="rectangular" 
              height={200} 
              sx={{ 
                borderRadius: '0.75rem',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.6 },
                  '50%': { opacity: 0.3 }
                }
              }} 
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!division) {
    return <div className="text-gray-500 p-4">Подразделение не найдено</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Header
        division={division}
        onBack={handleBack}
      />
      <Overview
        division={division}
      />
      {division.facilities_count > 0 && <MapView divisionId={division.id}/>}
    </div>
  );
}