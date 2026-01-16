'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Skeleton,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useRouter } from 'next/navigation';

interface Grant {
  id: string;
  title: string;
  agency: string;
  amount: string;
}

interface Analysis {
  matchAssessment: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  tips: string[];
}

export default function ProjectAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project and recommendations
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        const data = await res.json();
        setProjectName(data.project.name);

        // Get grants from recommendations or fetch all
        if (data.project.recommendations?.length > 0) {
          setGrants(data.project.recommendations.map((r: { grant: Grant }) => r.grant));
        } else {
          // Fetch top grants if no recommendations
          const grantsRes = await fetch('/api/grants?limit=20');
          if (grantsRes.ok) {
            const grantsData = await grantsRes.json();
            setGrants(grantsData.slice(0, 10));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAnalyze = async () => {
    if (!selectedGrantId) return;
    
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch(`/api/projects/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId: selectedGrantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  const selectedGrant = grants.find(g => g.id === selectedGrantId);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push(`/dashboard/projects/${id}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            AI Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectName}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Grant Selection */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 400 }}>
            <InputLabel>Select a Grant to Analyze</InputLabel>
            <Select
              value={selectedGrantId}
              label="Select a Grant to Analyze"
              onChange={(e) => {
                setSelectedGrantId(e.target.value);
                setAnalysis(null);
              }}
            >
              {grants.map((grant) => (
                <MenuItem key={grant.id} value={grant.id}>
                  {grant.title} ({grant.agency})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            size="large"
            startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleAnalyze}
            disabled={!selectedGrantId || analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </Stack>

        {selectedGrant && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{selectedGrant.title}</strong> • {selectedGrant.agency} • {selectedGrant.amount}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Analysis Results */}
      {analysis && (
        <Stack spacing={3}>
          {/* Match Assessment */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Match Assessment</Typography>
            </Stack>
            <Typography variant="body1">{analysis.matchAssessment}</Typography>
          </Paper>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight={600}>Strengths</Typography>
                <Chip label={analysis.strengths.length} size="small" color="success" />
              </Stack>
              <List dense>
                {analysis.strengths.map((item, i) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Gaps */}
          {analysis.gaps?.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Gaps Identified</Typography>
                <Chip label={analysis.gaps.length} size="small" color="warning" />
              </Stack>
              <List dense>
                {analysis.gaps.map((item, i) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LightbulbIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Recommendations</Typography>
                <Chip label={analysis.recommendations.length} size="small" color="primary" />
              </Stack>
              <List dense>
                {analysis.recommendations.map((item, i) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LightbulbIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Application Tips */}
          {analysis.tips?.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TipsAndUpdatesIcon color="secondary" />
                <Typography variant="h6" fontWeight={600}>Application Tips</Typography>
              </Stack>
              <List dense>
                {analysis.tips.map((item, i) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TipsAndUpdatesIcon fontSize="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <Divider />

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Analysis generated by AI • Results should be reviewed by humans before use
          </Typography>
        </Stack>
      )}

      {/* Empty State */}
      {!analysis && !analyzing && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            borderRadius: 3,
            backgroundColor: 'rgba(78, 205, 196, 0.03)',
            border: '2px dashed rgba(78, 205, 196, 0.2)',
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI-Powered Gap Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a grant above and click &quot;Analyze&quot; to get AI recommendations
          </Typography>
        </Box>
      )}
    </Box>
  );
}
