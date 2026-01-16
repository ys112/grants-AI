'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';

const FOCUS_AREAS = [
  'Arts',
  'Care',
  'Community',
  'Digital Skills/Tools',
  'Education/Learning',
  'Environment',
  'Health',
  'Heritage',
  'Social Cohesion',
  'Social Service',
  'Sport',
  'Youth',
];

const TARGET_POPULATIONS = [
  { value: 'seniors', label: 'Seniors' },
  { value: 'youth', label: 'Youth' },
  { value: 'disabled', label: 'Persons with Disabilities' },
  { value: 'low-income', label: 'Low-income Families' },
  { value: 'general', label: 'General Public' },
];

const DELIVERABLES = [
  'Classes/Seminar/Workshop',
  'Dialogue/Conversation',
  'Event/Exhibition/Performance',
  'Music/Video',
  'Publication',
  'Research/Documentation/Prototype',
  'Apps/Social Media/Website',
];

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'funded', label: 'Funded' },
  { value: 'completed', label: 'Completed' },
];

interface ProjectFormProps {
  initialData?: {
    name: string;
    description: string;
    targetPopulation: string;
    focusAreas: string[];
    deliverables: string[];
    fundingMin: number | null;
    fundingMax: number | null;
    expectedOutcomes: string;
    status: string;
    priority: string;
  };
  mode?: 'create' | 'edit';
  projectId?: string;
}

export default function ProjectForm({ initialData, mode = 'create', projectId }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    targetPopulation: initialData?.targetPopulation || 'general',
    focusAreas: initialData?.focusAreas || [],
    deliverables: initialData?.deliverables || [],
    fundingMin: initialData?.fundingMin || '',
    fundingMax: initialData?.fundingMax || '',
    expectedOutcomes: initialData?.expectedOutcomes || '',
    status: initialData?.status || 'planning',
    priority: initialData?.priority || 'medium',
  });

  const handleFocusAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const handleDeliverableToggle = (deliverable: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.includes(deliverable)
        ? prev.deliverables.filter((d) => d !== deliverable)
        : [...prev.deliverables, deliverable],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        fundingMin: formData.fundingMin ? Number(formData.fundingMin) : null,
        fundingMax: formData.fundingMax ? Number(formData.fundingMax) : null,
      };

      const url = mode === 'edit' ? `/api/projects/${projectId}` : '/api/projects';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save project');
      }

      const { project } = await res.json();
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Name */}
        <TextField
          label="Project Name"
          required
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Dementia Daycare Expansion"
        />

        {/* Description */}
        <TextField
          label="Project Description"
          required
          fullWidth
          multiline
          minRows={3}
          maxRows={10}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your project goals, activities, and expected outcomes..."
        />

        {/* Target Population */}
        <FormControl fullWidth>
          <InputLabel>Target Population</InputLabel>
          <Select
            value={formData.targetPopulation}
            label="Target Population"
            onChange={(e) => setFormData({ ...formData, targetPopulation: e.target.value })}
          >
            {TARGET_POPULATIONS.map((pop) => (
              <MenuItem key={pop.value} value={pop.value}>
                {pop.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Focus Areas */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Focus Areas (select all that apply) *
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {FOCUS_AREAS.map((area) => (
              <Chip
                key={area}
                label={area}
                onClick={() => handleFocusAreaToggle(area)}
                color={formData.focusAreas.includes(area) ? 'primary' : 'default'}
                variant={formData.focusAreas.includes(area) ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
          {formData.focusAreas.length === 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Please select at least one focus area
            </Typography>
          )}
        </Box>

        {/* Deliverables */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Expected Deliverables (optional)
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {DELIVERABLES.map((deliverable) => (
              <Chip
                key={deliverable}
                label={deliverable}
                onClick={() => handleDeliverableToggle(deliverable)}
                color={formData.deliverables.includes(deliverable) ? 'secondary' : 'default'}
                variant={formData.deliverables.includes(deliverable) ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>

        {/* Expected Outcomes */}
        <TextField
          label="Expected Outcomes & KPIs"
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          value={formData.expectedOutcomes}
          onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
          placeholder="e.g., Serve 50 additional seniors, improve mental wellness scores by 20%, train 10 caregivers..."
          helperText="Describe the measurable outcomes and impact you expect from this project"
        />

        {/* Funding Range */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Funding Requirements (optional)
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Minimum"
              type="number"
              value={formData.fundingMin}
              onChange={(e) => setFormData({ ...formData, fundingMin: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 200 }}
            />
            <TextField
              label="Maximum"
              type="number"
              value={formData.fundingMax}
              onChange={(e) => setFormData({ ...formData, fundingMax: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 200 }}
            />
          </Stack>
        </Box>

        {/* Status (only in edit mode) */}
        {mode === 'edit' && (
          <FormControl fullWidth>
            <InputLabel>Project Status</InputLabel>
            <Select
              value={formData.status}
              label="Project Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Priority */}
        <FormControl>
          <FormLabel>Priority</FormLabel>
          <RadioGroup
            row
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <FormControlLabel value="low" control={<Radio />} label="Low" />
            <FormControlLabel value="medium" control={<Radio />} label="Medium" />
            <FormControlLabel value="high" control={<Radio />} label="High" />
          </RadioGroup>
        </FormControl>

        {/* Submit */}
        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || formData.focusAreas.length === 0}
            sx={{ minWidth: 200 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : mode === 'edit' ? (
              'Save Changes'
            ) : (
              'Create Project'
            )}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
