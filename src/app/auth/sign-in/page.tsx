'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.email({
          email,
          password,
          name,
        });
        if (result.error) {
          setError(result.error.message || 'Sign up failed');
        } else {
          router.push('/dashboard');
        }
      } else {
        const result = await signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message || 'Sign in failed');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0A1929 0%, #132F4C 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78, 205, 196, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            GrantSync
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Typography>
        </Box>

        <Card
          sx={{
            p: 2,
            backgroundImage: 'linear-gradient(135deg, rgba(19, 47, 76, 0.95) 0%, rgba(10, 25, 41, 0.98) 100%)',
          }}
        >
          <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                />
              )}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
                inputProps={{ minLength: 8 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isSignUp ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(78, 205, 196, 0.2)' } }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Link>
              </Typography>
            </Box>

            {/* Demo Credentials */}
            {!isSignUp && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'rgba(78, 205, 196, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(78, 205, 196, 0.2)',
                }}
              >
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}
                >
                  🔑 DEMO CREDENTIALS
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { email: 'admin@tsao.org', password: 'admin123', label: 'Admin' },
                    { email: 'partner@huamei.org', password: 'partner123', label: 'Partner' },
                    { email: 'demo@grantsync.com', password: 'demo123', label: 'Demo' },
                  ].map((cred) => (
                    <Button
                      key={cred.email}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEmail(cred.email);
                        setPassword(cred.password);
                      }}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        borderColor: 'rgba(78, 205, 196, 0.3)',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(78, 205, 196, 0.1)',
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {cred.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cred.email}
                      </Typography>
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Link
            href="/"
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            ← Back to Home
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
