// DivisionDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Overview } from './sections/Overview';
import { divisionsApi } from '../../../api';
import { Header } from './sections/Header';
import MapView from '../../map/MapView';
import { Skeleton } from '@mui/material';
import './sections/style.css';

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
        setError('Failed to load division data');
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
      <div className="division-details-loading">
        <Skeleton variant="rectangular" width="100%" height={72} />
        <div className="division-stats-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={120}
              sx={{ borderRadius: '12px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="division-error">{error}</div>;
  }

  if (!division) {
    return <div className="division-not-found">Division not found</div>;
  }

  return (
    <div className="division-details-container">
      <Header division={division} onBack={handleBack} />
      
      <Overview division={division} />
      
      <div className="division-background-wrapper">
        <img
          src="/division-image.png"
          alt="Division background"
          className="division-background-image"
        />
        
        {/* {division.facilities_count > 0 && (
          <div className="division-map-overlay">
            <MapView divisionId={division.id} />
          </div>
        )} */}
      </div>
    </div>
  );
}