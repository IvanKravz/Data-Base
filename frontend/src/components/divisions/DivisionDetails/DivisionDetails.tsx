import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Overview } from './sections/Overview';
import { divisionsApi } from '../../../api';
import { Header } from './sections/Header';
import MapView from '../../map/MapView';

type ActiveSection = 'overview' | 'personnel' | 'equipment' | 'facilities' | 'tasks';
type ActiveSubdivision = string | null;

export function DivisionDetails() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [division, getDivisions] = useState('')
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log('division', division.id)
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        getDivisions(div);
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

  return (
    <div className="space-y-6">
      <Header
        division={division}
        onBack={handleBack}
      />
      {/* Отображаем Overview по умолчанию */}
      <Overview
        division={division}
        onSectionChange={(section) => {
          // Переход на соответствующую страницу
          navigate(`/divisions/${id}/${section}`);
        }}
      />
      <MapView divisionId={division.id}/>
    </div>
    
  );
}