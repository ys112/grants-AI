'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Divider,
    Breadcrumbs,
    Link as MuiLink,
    Paper,
    Skeleton,
    Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/types/project';
import { projectStore } from '@/lib/project-store';
import GrantCard, { Grant } from '@/components/GrantCard';

export default function ProjectDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const p = projectStore.getProjectById(id);
        if (p) {
            setProject(p);
        } else {
            setError('Project not found');
        }
    }, [id]);

    useEffect(() => {
        async function fetchRelevantGrants() {
            if (!project) return;

            try {
                const res = await fetch('/api/grants');
                if (!res.ok) throw new Error('Failed to fetch grants');
                const allGrants: Grant[] = await res.json();

                // Filter grants based on focus areas or target population
                // This is a simplified matching logic for the demo
                const relevant = allGrants.filter(grant => {
                    const projectTags = [
                        project.targetPopulation.toLowerCase(),
                        ...project.focusAreas.split(',').map(s => s.trim().toLowerCase())
                    ];

                    return grant.tags.some(tag =>
                        projectTags.includes(tag.toLowerCase()) ||
                        project.description.toLowerCase().includes(tag.toLowerCase())
                    );
                }).map(grant => ({
                    ...grant,
                    matchScore: Math.floor(70 + Math.random() * 25) // Higher scores for filtered results
                }));

                setGrants(relevant);
            } catch (err) {
                console.error('Failed to load relevant grants:', err);
            } finally {
                setLoading(false);
            }
        }

        if (project) {
            fetchRelevantGrants();
        }
    }, [project]);

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/dashboard/projects')}
                    sx={{ mt: 2 }}
                >
                    Back to Projects
                </Button>
            </Box>
        );
    }

    if (!project) {
        return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />;
    }

    return (
        <Box>
            {/* Breadcrumbs & Back Button */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link href="/dashboard/projects" passHref style={{ textDecoration: 'none' }}>
                        <MuiLink component="span" underline="hover" color="inherit">Projects</MuiLink>
                    </Link>
                    <Typography color="text.primary">{project.name}</Typography>
                </Breadcrumbs>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/dashboard/projects')}
                    sx={{ mb: 1 }}
                >
                    Back to Projects
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* Project Details Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                {project.name}
                            </Typography>
                            <Chip
                                label={project.priority}
                                color={project.priority === 'high' ? 'error' : project.priority === 'medium' ? 'warning' : 'success'}
                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                            />
                        </Box>

                        <Stack spacing={3}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <AssignmentIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Description</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {project.description}
                                </Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <PeopleIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Target Population</Typography>
                                </Stack>
                                <Typography variant="body2">{project.targetPopulation}</Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <CategoryIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Focus Areas</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {project.focusAreas.split(',').map(area => (
                                        <Chip key={area} label={area.trim()} size="small" variant="outlined" />
                                    ))}
                                </Stack>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <CategoryIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Deliverables</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {project.deliverables.map(d => (
                                        <Chip key={d} label={d} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                    ))}
                                </Stack>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <AttachMoneyIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Funding Needed</Typography>
                                </Stack>
                                <Typography variant="body2">
                                    ${project.fundingNeeded.min.toLocaleString()} - ${project.fundingNeeded.max.toLocaleString()}
                                </Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <CalendarTodayIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Timeline</Typography>
                                </Stack>
                                <Typography variant="body2">
                                    {new Date(project.timeline.startDate).toLocaleDateString()} - {new Date(project.timeline.endDate).toLocaleDateString()}
                                </Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <TrackChangesIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600}>Expected Outcomes</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {project.expectedOutcomes}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Relevant Grants Section */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Relevant Funding Opportunities
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Based on your project's focus areas and target population.
                        </Typography>
                    </Box>

                    {loading ? (
                        <Grid container spacing={2}>
                            {[1, 2, 3].map(i => (
                                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                    <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : grants.length === 0 ? (
                        <Alert severity="info" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                            No matching grants found for this project's criteria yet.
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {grants.map(grant => (
                                <Grid size={{ xs: 12, sm: 6 }} key={grant.id}>
                                    <GrantCard grant={grant} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
