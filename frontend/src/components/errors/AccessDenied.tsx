import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

// Импортируем изображение
import forbiddenImage from '../../assets/images/errors/403-forbidden.png';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Возврат на предыдущую страницу
  };

  const handleGoHome = () => {
    navigate('/'); // Переход на главную
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        py: 4
      }}
    >
      {/* Изображение */}
      <Box sx={{ mb: 4, maxWidth: 300 }}>
        <img 
          src={forbiddenImage} 
          alt="Доступ запрещен" 
          style={{ 
            width: '100%', 
            height: 'auto',
            filter: 'grayscale(30%)'
          }} 
        />
      </Box>

      {/* Заголовок и текст */}
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom 
        color="error.main"
        sx={{ fontWeight: 'bold', mb: 2 }}
      >
        Доступ запрещен
      </Typography>
      
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ mb: 4, maxWidth: 600 }}
      >
        У вас недостаточно прав для просмотра этой страницы. 
        Обратитесь к администратору для получения доступа.
      </Typography>

      {/* Кнопки действий */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft />}
          onClick={handleGoBack}
          size="large"
        >
          Назад
        </Button>
        
        <Button
          variant="contained"
          onClick={handleGoHome}
          size="large"
        >
          На главную
        </Button>
      </Box>

      {/* Дополнительная информация */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Код ошибки: 403 Forbidden
        </Typography>
      </Box>
    </Container>
  );
};

export default AccessDenied;