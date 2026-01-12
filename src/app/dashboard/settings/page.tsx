'use client';

import { useState } from 'react';
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

const populationOptions = [
  'Seniors (60+)',
  'Youth (Under 25)',
  'Persons with Disabilities',
  'Low-Income Families',
  'Migrant Workers',
  'General Population',
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [interests, setInterests] = useState<string[]>(['Seniors', 'Healthcare']);
  const [targetPopulation, setTargetPopulation] = useState('Seniors (60+)');
  const [minFunding, setMinFunding] = useState('25000');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async () => {
    // In production, this would call the API to save settings
    console.log('Saving settings:', { interests, targetPopulation, minFunding });
    setSavedMessage(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your profile to get personalized grant recommendations
        </Typography>
      </Box>

      {/* Profile Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
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
              label="Organization"
              value="Tsao Foundation"
              disabled
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Sustainability Needs Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Sustainability Needs
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
                        color="primary"
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

            {/* Target Population */}
            <FormControl fullWidth>
              <InputLabel id="population-label">Target Population</InputLabel>
              <Select
                labelId="population-label"
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                label="Target Population"
              >
                {populationOptions.map((option) => (
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
              helperText="We'll only show grants meeting or exceeding this amount"
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
          Save Settings
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
          Settings saved successfully! Your grant feed will now show personalized results.
        </Alert>
      </Snackbar>
    </Box>
  );
}
