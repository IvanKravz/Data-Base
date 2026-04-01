import { Users, Plug, Building2, ListTodo } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Division } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { divisionsApi } from '../../../api/divisions';
import { useState, useEffect } from 'react';
import './style.css';
import { setDivisions } from '../../../store/slices/facilitiesSlice';
import { MapCountry } from '../../map/MapCountry/MapCountry';

interface DivisionListProps {
  onSelectDivision: (division: Division) => void;
  viewType: 'grid' | 'table';
}

export function DivisionList({ onSelectDivision }: DivisionListProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [divisions, getDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        getDivisions(data);
        dispatch(setDivisions(data));
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, [token]);

  const handleDivisionClick = (division: Division) => {
    onSelectDivision(division);
    navigate(`/divisions/${division.id}`);
  };

  if (loading) {
    return <div className="loading-divisions">Загрузка подразделений...</div>;
  }

  if (error) {
    return <div className="loading-divisions">{error}</div>;
  }

  return (
    <>
      <div className="division-list-header-text">Отделы и отделения</div>
      <div className="grid-container">
        {divisions.map((division, index) => (
          <div
            key={division.id}
            onClick={() => handleDivisionClick(division)}
            className="division-card"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="division-card-title">
              <h3>{division.name}</h3>
            </div>
            <div className="division-metrics">
              <div className="metric-item">
                <Users className="metric-icon metric-icon--blue" />
                <span>Персонал: {division.employees_count}</span>
              </div>
              <div className="metric-item">
                <Plug className="metric-icon metric-icon--green" />
                <span>Техника: {division.equipment_count}</span>
              </div>
              <div className="metric-item">
                <Building2 className="metric-icon metric-icon--purple" />
                <span>Объекты: {division.facilities_count}</span>
              </div>
              <div className="metric-item">
                <ListTodo className="metric-icon metric-icon--orange" />
                <span>Задачи: {division.tasks_count}</span>
              </div>
            </div>
          </div>
        ))}

      </div>
      <div className='map-country animate-fadeInUp'>
        <MapCountry />
      </div>
    </>
  );
}