'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Skeleton,
  Alert,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import ProjectForm from '@/components/ProjectForm';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [projectData, setProjectData] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        const data = await res.json();
        const p = data.project;
        
        setProjectData({
          name: p.name,
          description: p.description,
          targetPopulation: p.targetPopulation,
          focusAreas: typeof p.focusAreas === 'string' ? JSON.parse(p.focusAreas) : p.focusAreas,
          deliverables: typeof p.deliverables === 'string' ? JSON.parse(p.deliverables || '[]') : p.deliverables || [],
          fundingMin: p.fundingMin,
          fundingMax: p.fundingMax,
          expectedOutcomes: p.expectedOutcomes || '',
          status: p.status || 'planning',
          priority: p.priority,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (error || !projectData) {
    return <Alert severity="error">{error || 'Project not found'}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push(`/dashboard/projects/${id}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Edit Project
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectData.name}
          </Typography>
        </Box>
      </Box>

      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 800,
        }}
      >
        <ProjectForm 
          initialData={projectData}
          mode="edit"
          projectId={id}
        />
      </Paper>
    </Box>
  );
}
