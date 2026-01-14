'use client';

import { Box, Container, Typography, Button, Stack, Card, CardContent, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Smart Discovery',
      description: 'AI-powered grant matching based on your organization\'s mission and needs.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Track Progress',
      description: 'Kanban-style board to manage your grant applications from discovery to success.',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Ecosystem Collaboration',
      description: 'Share opportunities across your organization network with parent-child hierarchy.',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0A1929 0%, #132F4C 50%, #0A1929 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78, 205, 196, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GrantSync
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.push('/auth/sign-in')}
              sx={{ borderColor: 'rgba(78, 205, 196, 0.5)' }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/auth/sign-in')}
            >
              Get Started
            </Button>
          </Stack>
        </Box>

        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #B2BAC2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Orchestrate Your
            <br />
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Funding Sustainability
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: 600,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
            }}
          >
            Discover, track, and manage grants tailored to your nonprofit&apos;s mission.
            Built for the Tsao Foundation ecosystem.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/sign-in')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Start Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderColor: 'rgba(78, 205, 196, 0.5)',
              }}
            >
              Watch Demo
            </Button>
          </Stack>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ py: 8 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderTop: '1px solid rgba(78, 205, 196, 0.1)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2026 GrantSync. Built for the Tsao Foundation Hackathon.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
