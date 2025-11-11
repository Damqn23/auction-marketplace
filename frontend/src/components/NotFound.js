// src/components/NotFound.js

import React from 'react';
import { Box, Typography, Button, Container, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslation } from 'react-i18next';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Container>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          mt: '-64px', // Compensate for navbar
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: '150px',
            color: theme.palette.primary.main,
            animation: `${float} 3s ease-in-out infinite`,
            mb: 4,
          }}
        />
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 700,
            color: theme.palette.primary.main,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            animation: `${pulse} 2s ease-in-out infinite`,
            mb: 2,
          }}
        >
          {t('notFound.code')}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            color: theme.palette.text.primary,
            fontWeight: 500,
          }}
        >
          {t('notFound.title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: theme.palette.text.secondary,
            maxWidth: '600px',
          }}
        >
          {t('notFound.message')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{
            borderRadius: '30px',
            padding: '12px 32px',
            fontSize: '1.1rem',
            textTransform: 'none',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            },
          }}
        >
          {t('notFound.backHome')}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
