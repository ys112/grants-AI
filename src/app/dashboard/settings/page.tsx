'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
  Snackbar,
  Divider,
  Stack,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSession } from '@/lib/auth-client';

const interestOptions = [
  'Arts',
  'Healthcare',
  'Seniors',
  'Youth',
  'Technology',
  'Community',
  'Education',
  'Environment',
  'Mental Health',
  'Social Enterprise',
];

export default function SettingsPage() {
  const { data: session, refetch } = useSession();
  const [interests, setInterests] = useState<string[]>([]);
  const [minFunding, setMinFunding] = useState<string>('');
  const [orgDescription, setOrgDescription] = useState<string>('');
  const [savedMessage, setSavedMessage] = useState(false);

  // Sync form state when session data is loaded
  useEffect(() => {
    if (session?.user) {
      const dbInterests = session.user.interests;

      try {
        const parsed = dbInterests ? JSON.parse(dbInterests) : [];
        setInterests(parsed);
      } catch {
        setInterests([]);
      }

      setMinFunding(session.user.minFunding?.toString() || '');
      setOrgDescription(session.user.orgDescription || '');
    }
  }, [session]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: JSON.stringify(interests),
          minFunding: parseInt(minFunding, 10) || null,
          orgDescription: orgDescription || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      await refetch();
      setSavedMessage(true);
    } catch (error) {
      console.error('Update error:', error);
      alert("Failed to save settings. Please try again.");
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your profile to get personalized grant recommendations
        </Typography>
      </Box>

      {/* Profile Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
            Profile Information
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(78, 205, 196, 0.1)' }} />

          <Stack spacing={3}>
            <TextField
              label="Name"
              value={session?.user?.name || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Email"
              value={session?.user?.email || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Organization Name"
              value="Tsao Foundation"
              disabled
              fullWidth
            />
            <TextField
              label="Organization Description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your organization's mission, focus areas, and the communities you serve..."
              helperText="This helps our AI provide more personalized grant recommendations"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Grant Preferences Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
            Grant Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These preferences help us find the most relevant grants for your organization
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(78, 205, 196, 0.1)' }} />

          <Stack spacing={3}>
            {/* Interest Areas */}
            <FormControl fullWidth>
              <InputLabel id="interests-label">Interest Areas</InputLabel>
              <Select
                labelId="interests-label"
                multiple
                value={interests}
                onChange={(e) => setInterests(e.target.value as string[])}
                input={<OutlinedInput label="Interest Areas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        sx={{
                          backgroundColor: '#2a9d8f',
                          color: '#fff',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': {
                              color: '#fff',
                            },
                          },
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDelete={() =>
                          setInterests(interests.filter((i) => i !== value))
                        }
                      />
                    ))}
                  </Box>
                )}
              >
                {interestOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Minimum Funding */}
            <TextField
              label="Minimum Funding Amount"
              type="number"
              value={minFunding}
              onChange={(e) => setMinFunding(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="We'll prioritize grants meeting or exceeding this amount"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          size="large"
        >
          Save Profile
        </Button>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={savedMessage}
        autoHideDuration={3000}
        onClose={() => setSavedMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSavedMessage(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Profile saved successfully! Your grant feed will now show personalized results.
        </Alert>
      </Snackbar>
    </Box>
  );
}

