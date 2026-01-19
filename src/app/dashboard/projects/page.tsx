'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Skeleton,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import ProjectCard, { Project } from '@/components/ProjectCard';

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'info' as const },
  active: { label: 'Active', color: 'success' as const },
  funded: { label: 'Funded', color: 'primary' as const },
  completed: { label: 'Completed', color: 'default' as const },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('planning');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        
        // Parse focusAreas from JSON string if needed
        const parsedProjects = data.projects.map((p: Project & { focusAreas: string | string[] }) => ({
          ...p,
          focusAreas: typeof p.focusAreas === 'string' ? JSON.parse(p.focusAreas) : p.focusAreas,
        }));
        
        setProjects(parsedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status || 'planning';
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const handleAccordionChange = (panel: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your projects and discover matching grants
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/projects/new')}
          sx={{ height: 48 }}
        >
          New Project
        </Button>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : projects.length === 0 ? (
        /* Empty state */
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(78, 205, 196, 0.03)',
            border: '2px dashed rgba(78, 205, 196, 0.2)',
          }}
        >
          <FolderOffIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to start discovering matching grants
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/dashboard/projects/new')}
          >
            Create Your First Project
          </Button>
        </Box>
      ) : (
        /* Accordions grouped by status */
        <Stack spacing={2}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusProjects = projectsByStatus[status] || [];
            const count = statusProjects.length;
            
            return (
              <Accordion
                key={status}
                expanded={expanded === status}
                onChange={handleAccordionChange(status)}
                sx={{
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 3 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {config.label}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      color={config.color}
                      variant={count > 0 ? 'filled' : 'outlined'}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  {count === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No projects in this stage
                    </Typography>
                  ) : (
                    <Grid container spacing={3}>
                      {statusProjects.map((project) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
                          <ProjectCard project={project} />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      {/* Stats */}
      {!loading && projects.length > 0 && (
        <Stack
          direction="row"
          spacing={4}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 3,
            backgroundColor: 'rgba(78, 205, 196, 0.05)',
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary">
              {projects.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Projects
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {projectsByStatus['planning']?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Planning
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {projectsByStatus['active']?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
