'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  Button,
  LinearProgress,
  IconButton,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/navigation';

export interface Project {
  id: string;
  name: string;
  description: string;
  targetPopulation: string;
  focusAreas: string[];
  status: string;
  priority: string;
  createdAt: string;
  recommendations?: {
    grant: {
      id: string;
      title: string;
      agency: string;
    };
    overallScore: number;
  }[];
}

interface ProjectCardProps {
  project: Project;
}

const priorityColors: Record<string, 'error' | 'warning' | 'success'> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
};

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'info'> = {
  planning: 'default',
  active: 'primary',
  funded: 'success',
  completed: 'info',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const focusAreas = Array.isArray(project.focusAreas) 
    ? project.focusAreas 
    : JSON.parse(project.focusAreas || '[]');

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(78, 205, 196, 0.15)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(78, 205, 196, 0.1)',
              display: 'flex',
            }}
          >
            <FolderIcon color="primary" />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {project.name}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={project.status}
                size="small"
                color={statusColors[project.status] || 'default'}
                variant="outlined"
              />
              <Chip
                label={project.priority}
                size="small"
                color={priorityColors[project.priority] || 'default'}
              />
            </Stack>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description}
        </Typography>

        {/* Focus Areas */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
          {focusAreas.slice(0, 3).map((area: string) => (
            <Chip key={area} label={area} size="small" variant="outlined" />
          ))}
          {focusAreas.length > 3 && (
            <Chip label={`+${focusAreas.length - 3}`} size="small" />
          )}
        </Stack>

        {/* Top Recommendations Preview */}
        {project.recommendations && project.recommendations.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(78, 205, 196, 0.05)',
              border: '1px solid rgba(78, 205, 196, 0.1)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AutoAwesomeIcon fontSize="small" color="primary" />
              <Typography variant="caption" fontWeight={600} color="primary">
                Top Matches
              </Typography>
            </Stack>
            {project.recommendations.slice(0, 2).map((rec) => (
              <Box key={rec.grant.id} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {rec.grant.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={rec.overallScore}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" fontWeight={600}>
                    {Math.round(rec.overallScore)}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ChevronRightIcon />}
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
