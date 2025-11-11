import React, { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { useTranslation } from 'react-i18next';
import { styled } from "@mui/material/styles";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";

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
  maxWidth: 500,
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

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
  });

  const steps = [t('registerPage.steps.account'), t('registerPage.steps.personal'), t('registerPage.steps.confirm')];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return (
          formData.username.length >= 3 &&
          formData.email.includes('@') &&
          formData.email.includes('.')
        );
      case 1:
        return (
          formData.password.length >= 6 &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return formData.phone.length >= 6 && formData.location.length >= 2;
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('registerPage.passwordMismatch'));
      return;
    }
    try {
      await registerUser(formData);
      toast.success(t('registerPage.success'));
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.detail || t('registerPage.failed'));
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <StyledTextField
              fullWidth
              name="username"
              label={t('registerPage.username')}
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
              name="email"
              label={t('registerPage.email')}
              type="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <StyledTextField
              fullWidth
              name="password"
              label={t('registerPage.password')}
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
            <StyledTextField
              fullWidth
              name="confirmPassword"
              label={t('registerPage.confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 2:
        return (
          <>
            <StyledTextField
              fullWidth
              name="phone"
              label={t('registerPage.phoneNumber')}
              value={formData.phone}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <StyledTextField
              fullWidth
              name="location"
              label={t('registerPage.location')}
              value={formData.location}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      default:
        return null;
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
            {t('registerPage.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              mb: 3,
            }}
          >
            {t('registerPage.subtitle')}
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {getStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
                >
                  {t('registerPage.back')}
                </Button>
                {activeStep === steps.length - 1 ? (
                  <StyledButton
                    type="submit"
                    variant="contained"
                    disabled={!validateStep()}
                  >
                    {t('registerPage.complete')}
                  </StyledButton>
                ) : (
                  <StyledButton
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep()}
                  >
                    {t('registerPage.next')}
                  </StyledButton>
                )}
              </Box>
            </Box>
          </form>

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            {t('registerPage.already')}{' '}
            <Link
              to="/login"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {t('registerPage.signIn')}
            </Link>
          </Typography>
        </StyledPaper>
      </Fade>
    </Box>
  );
};

export default Register;
