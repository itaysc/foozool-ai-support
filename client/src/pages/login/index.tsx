import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Container,
  ColumnWrapper,
  Logo,
  FormWrapper,
  StyledForm,
  WrongCredentials,
} from "./styled";
import theme from "@/styles/theme";
import { useMainLayoutContext } from "@/context/mainLayout.context";
import { useAuth } from "@/context/auth.context";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isWrongCredentials, setIsWrongCredentials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { requestedUrl, setRequestedUrl } = useMainLayoutContext();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Redirect to home page if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('🔄 User already authenticated, redirecting to home...');
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Additional protection: if we somehow end up on login page with valid cookies,
  // force a sign out to ensure clean state
  useEffect(() => {
    const checkForStaleCookies = async () => {
      try {
        // Check if there are any auth cookies in the document
        const cookies = document.cookie.split(';');
        const hasAuthCookies = cookies.some(cookie => {
          const [name] = cookie.trim().split('=');
          return ['accessToken', 'refreshToken', 'foozool-jwt', 'jwt'].includes(name);
        });
        
        if (hasAuthCookies && !isAuthenticated && !isLoading) {
          console.log('⚠️ Found stale auth cookies on login page, clearing them...');
          // Import and use clearAuthCookies directly
          const { clearAuthCookies } = await import('@/utils/cookies');
          clearAuthCookies();
        }
      } catch (error) {
        console.error('Error checking for stale cookies:', error);
      }
    };
    
    checkForStaleCookies();
  }, [isAuthenticated, isLoading]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("This field is required"),
      password: Yup.string().min(6, "Password must be at least 6 characters").required("This field is required"),
    }),
    onSubmit: async (values) => {
      setIsWrongCredentials(false);
      setIsSubmitting(true);
      try {
        const res = await login(values);
        if (res?.redirecting) {
          return;
        }
        setIsSubmitting(false);
        if (res?.isAuthorized) {
          if (requestedUrl) {
            navigate(requestedUrl);
            setRequestedUrl(null);
          } else {
            navigate("/");
          }
        } else {
          setIsWrongCredentials(true);
        }
      } catch (err) {
        console.error("Login error", err);
        setIsWrongCredentials(true);
        setIsSubmitting(false);
      }
    },
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Container>
        <ColumnWrapper>
          <Logo src="/logo/logo-transparent-blue.svg" alt="foozool logo" />
          <FormWrapper>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CircularProgress size={40} />
              <Typography variant="h6" style={{ marginTop: '1rem' }}>
                Checking authentication...
              </Typography>
            </div>
          </FormWrapper>
        </ColumnWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <ColumnWrapper>
        {/* <Logo src="/logo/logo-transparent-blue.svg" alt="foozool logo" /> */}
        <img 
          src="/logo/foozool_logo_transparent_bg.png" 
          alt="Foozool Logo" 
          style={{ 
            height: '140px', 
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto 2rem auto'
          }} 
        />
        <FormWrapper>
          {/* <Typography variant="h5" align="center" gutterBottom color={theme.colors.primary.main}>
            Login
          </Typography> */}
          <StyledForm onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              variant="outlined"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {isWrongCredentials && <WrongCredentials>Wrong Email/Password</WrongCredentials>}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </StyledForm>
        </FormWrapper>
      </ColumnWrapper>
    </Container>
  );
};

export default Login;
