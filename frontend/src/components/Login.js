import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';
import { loginUser } from '../services/authService';
import { getCurrentUser } from '../services/userService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import { keyframes } from '@emotion/react';
import { useTranslation } from 'react-i18next';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  maxWidth: 400,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  animation: `${fadeIn} 0.5s ease-out`,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 32px',
  fontSize: '1rem',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
  },
}));

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useContext(UserContext);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData.username, formData.password);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Fetch user data and update context
      const userData = await getCurrentUser();
      setUser(userData);
      
      toast.success(t('loginPage.success'));
      navigate('/');
    } catch (error) {
      toast.error(error?.response?.data?.detail || t('loginPage.failed'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(2),
        background: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
        mt: '-64px', // Compensate for navbar
      }}
    >
      <Fade in timeout={500}>
        <StyledPaper elevation={3}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              textAlign: 'center',
              mb: 1,
            }}
          >
            {t('loginPage.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              mb: 3,
            }}
          >
            {t('loginPage.subtitle')}
          </Typography>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StyledTextField
                fullWidth
                name="username"
                label={t('loginPage.username')}
                value={formData.username}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <StyledTextField
                fullWidth
                name="password"
                label={t('loginPage.password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <StyledButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
              >
                {t('loginPage.signIn')}
              </StyledButton>
            </Box>
          </form>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            {t('loginPage.noAccount')}{' '}
            <Link
              to="/register"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {t('loginPage.signUp')}
            </Link>
          </Typography>
        </StyledPaper>
      </Fade>
    </Box>
  );
};

export default Login;
