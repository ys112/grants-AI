'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouter } from 'next/navigation';
import RecommendationCard, { Recommendation } from '@/components/RecommendationCard';

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  targetPopulation: string;
  focusAreas: string[];
  deliverables: string[];
  fundingMin: number | null;
  fundingMax: number | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cached, setCached] = useState(false);

  // Fetch project and auto-get recommendations
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        const data = await res.json();
        
        const proj = data.project;
        setProject({
          ...proj,
          focusAreas: typeof proj.focusAreas === 'string' ? JSON.parse(proj.focusAreas) : proj.focusAreas,
          deliverables: typeof proj.deliverables === 'string' ? JSON.parse(proj.deliverables || '[]') : proj.deliverables || [],
        });

        // Load cached recommendations (GET) - only regenerate on explicit Refresh
        setRecommendLoading(true);
        try {
          const recRes = await fetch(`/api/projects/${id}/recommend`);
          if (recRes.ok) {
            const recData = await recRes.json();
            if (recData.recommendations && recData.recommendations.length > 0) {
              setRecommendations(recData.recommendations);
              setCached(true);
            }
            // If no cached recommendations, user can click Refresh to generate
          }
        } finally {
          setRecommendLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  // Fetch tracked grant IDs
  useEffect(() => {
    async function fetchTrackedIds() {
      try {
        const res = await fetch('/api/grants/tracked');
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>(data.map((t: { grantId: string }) => t.grantId));
          setTrackedIds(ids);
        }
      } catch {
        // Ignore
      }
    }
    fetchTrackedIds();
  }, []);

  const handleGetRecommendations = async (forceRefresh = false) => {
    setRecommendLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh }),
      });
      if (!res.ok) throw new Error('Failed to get recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations);
      setCached(data.meta?.cached === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
    setDeleteDialogOpen(false);
  };

  const handleTrack = async (grantId: string) => {
    try {
      await fetch('/api/grants/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
      setTrackedIds((prev) => new Set([...prev, grantId]));
    } catch {
      // Ignore
    }
  };

  const handleUntrack = async (grantId: string) => {
    try {
      await fetch(`/api/grants/track?grantId=${grantId}`, { method: 'DELETE' });
      setTrackedIds((prev) => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!project) {
    return <Alert severity="error">Project not found</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/projects')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {project.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label={project.status} size="small" color="primary" variant="outlined" />
            <Chip label={project.priority} size="small" />
            <Chip label={project.targetPopulation} size="small" variant="outlined" />
          </Stack>
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => { router.push(`/dashboard/projects/${id}/edit`); setAnchorEl(null); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Project Info */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
          {project.focusAreas.map((area) => (
            <Chip key={area} label={area} size="small" color='primary' sx={{ color: 'white' }} variant="outlined" />
          ))}
        </Stack>
        {(project.fundingMin || project.fundingMax) && (
          <Typography variant="body2" color="text.secondary">
            Budget: Up to ${(project.fundingMax || project.fundingMin)?.toLocaleString()}
          </Typography>
        )}
      </Paper>

      {/* Recommendations Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Grant Recommendations
          </Typography>
          {cached && <Chip label="Cached" size="small" variant="outlined" />}
        </Stack>
        <Button
          variant="contained"
          startIcon={recommendLoading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={() => handleGetRecommendations(true)}
          disabled={recommendLoading}
        >
          {recommendations.length === 0 ? 'Get Recommendations' : 'Refresh'}
        </Button>
      </Box>

      {recommendations.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(78, 205, 196, 0.03)',
            border: '2px dashed rgba(78, 205, 196, 0.2)',
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No recommendations yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click &quot;Get Recommendations&quot; to find matching grants
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {recommendations.map((rec) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={rec.grant.id}>
              <RecommendationCard
                recommendation={rec}
                projectId={id}
                isTracked={trackedIds.has(rec.grant.id)}
                onTrack={handleTrack}
                onUntrack={handleUntrack}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete &quot;{project.name}&quot; and all its recommendations. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
