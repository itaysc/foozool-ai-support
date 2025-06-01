import { useState } from "react";
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
import authStore from "@/stores/auth.store";
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

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isWrongCredentials, setIsWrongCredentials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { requestedUrl, setRequestedUrl } = useMainLayoutContext();

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
        const res = await authStore.login(values);
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

  return (
    <Container>
      <ColumnWrapper>
        <Logo src="/logo/logo-transparent-blue.svg" alt="foozool logo" />
        <FormWrapper>
          <Typography variant="h5" align="center" gutterBottom color={theme.main}>
            Login
          </Typography>
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
