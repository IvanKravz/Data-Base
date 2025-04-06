import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Overview } from './sections/Overview';
// import { useSelector } from 'react-redux'
// import { RootState } from '../../../store/store';
import { divisionsApi } from '../../../api';
// import { PersonnelSection } from './sections/PersonnelSection';
// import { EquipmentSection } from './sections/EquipmentSection';
// import { FacilitiesSection } from './sections/FacilitiesSection';
// import { TasksSection } from './sections/DivisionTasksSection';
import { Header } from './sections/Header';

type ActiveSection = 'overview' | 'personnel' | 'equipment' | 'facilities' | 'tasks';
type ActiveSubdivision = string | null;

export function DivisionDetails() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  // const { divisions } = useSelector((state: RootState) => state.facilities);
  // const division = divisions.results?.find(d => d.id == id);

  const [division, getDivisions] = useState('')
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}