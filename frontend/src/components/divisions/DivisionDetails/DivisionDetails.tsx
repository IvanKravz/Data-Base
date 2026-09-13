// DivisionDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Overview } from './sections/Overview';
import { divisionsApi } from '../../../api';
import { Header } from './sections/Header';
import { Skeleton } from '@mui/material';
import './sections/style.css';
import { isExploitationChief, isExploitationEmployee } from '../../../api/utils/permissions';
import AccessDenied from '../../../components/errors/AccessDenied/AccessDenied';
import { MapCountry } from '../../map/MapCountry/MapCountry';

export function DivisionDetails() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [division, setDivision] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const isExploitationEmp = isExploitationEmployee();
  const isChief = isExploitationChief();
  const isExploitation = isChief || isExploitationEmp;

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const div = await divisionsApi.getDivisionById(id, token);
        setDivision(div);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsForbidden(true);
        } else {
          setError('Failed to load division data');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id, token]);

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

  if (isForbidden) {
    return <AccessDenied />;
  }

  if (error) {
    return <div className="division-error">{error}</div>;
  }

  if (!division) {
    return <div className="division-not-found">Division not found</div>;
  }

  return (
    <div className="division-details-container page-fade-in">
      <Header
        division={division}
        onBack={handleBack}
        showBackButton={!isChief && !isExploitationEmp}
      />
      <Overview division={division} />
    </div>
  );
}