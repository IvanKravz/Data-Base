// AccessDenied.tsx
import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { ShieldAlert, Home } from 'lucide-react';

const AccessDenied: React.FC = () => {

  const handleGoHome = () => {
    // Полная перезагрузка главной страницы для сброса всех состояний
    window.location.href = '/';
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
      {/* Иконка доступа запрещено */}
      <Box 
        sx={{ 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: 'error.light',
          color: 'error.contrastText',
          '& svg': {
            width: 64,
            height: 64
          }
        }}
      >
        <ShieldAlert />
      </Box>

      {/* Заголовок и текст */}
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom 
        color="error.main"
        sx={{ fontWeight: 'bold', mb: 2 }}
      >
        Доступ ограничен
      </Typography>
      
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ mb: 4, maxWidth: 800, lineHeight: 1.6 }}
      >
        У вас недостаточно прав для просмотра этой страницы. 
        Если вам необходим доступ к этому ресурсу, обратитесь к администратору системы.
      </Typography>

      {/* Кнопки действий */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Home size={20} />}
          onClick={handleGoHome}
          size="large"
          sx={{ px: 3 }}
        >
          На главную
        </Button>
      </Box>

      {/* Дополнительная информация */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Код ошибки: 403 Forbidden • Отказано в доступе
        </Typography>
      </Box>
    </Container>
  );
};

export default AccessDenied;