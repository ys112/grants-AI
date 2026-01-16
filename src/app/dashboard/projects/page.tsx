'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { Project, ProjectDeliverable, ProjectPriority } from '@/types/project';
import { projectStore } from '@/lib/project-store';

const DELIVERABLES: ProjectDeliverable[] = ['classes', 'workshops', 'research', 'events'];
const PRIORITIES: ProjectPriority[] = ['high', 'medium', 'low'];

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        description: '',
        targetPopulation: '',
        focusAreas: '',
        deliverables: [],
        fundingNeeded: { min: 0, max: 0 },
        timeline: { startDate: '', endDate: '' },
        expectedOutcomes: '',
        priority: 'medium',
    });

    useEffect(() => {
        setProjects(projectStore.getProjects());
    }, []);

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData(project);
        } else {
            setEditingProject(null);
            setFormData({
                name: '',
                description: '',
                targetPopulation: '',
                focusAreas: '',
                deliverables: [],
                fundingNeeded: { min: 0, max: 0 },
                timeline: { startDate: '', endDate: '' },
                expectedOutcomes: '',
                priority: 'medium',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            projectStore.updateProject(editingProject.id, formData);
        } else {
            projectStore.addProject(formData as any);
        }
        setProjects(projectStore.getProjects());
        handleCloseDialog();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            projectStore.deleteProject(id);
            setProjects(projectStore.getProjects());
        }
    };

    const handleProjectClick = (id: string) => {
        router.push(`/dashboard/projects/${id}`);
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Projects
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your organization's projects and track potential funding.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Project
                </Button>
            </Box>

            {projects.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    You haven't added any projects yet. Click "Add Project" to get started.
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 6 }
                                }}
                                onClick={() => handleProjectClick(project.id)}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: '80%' }}>
                                            {project.name}
                                        </Typography>
                                        <Chip
                                            label={project.priority}
                                            size="small"
                                            color={project.priority === 'high' ? 'error' : project.priority === 'medium' ? 'warning' : 'success'}
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {project.description}
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
                                        <Chip label={project.targetPopulation} size="small" variant="outlined" />
                                        {project.deliverables.map(d => (
                                            <Chip key={d} label={d} size="small" variant="outlined" color="primary" sx={{ textTransform: 'capitalize' }} />
                                        ))}
                                    </Stack>
                                </CardContent>
                                <CardActions sx={{ borderTop: '1px solid rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
                                    <Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDialog(project); }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => handleDelete(project.id, e)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Button size="small" endIcon={<ArrowForwardIcon />}>
                                        Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Project Name"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <TextField
                                label="Target Population"
                                placeholder="e.g. seniors, youth"
                                fullWidth
                                required
                                value={formData.targetPopulation}
                                onChange={(e) => setFormData({ ...formData, targetPopulation: e.target.value })}
                            />
                            <TextField
                                label="Focus Areas"
                                placeholder="e.g. healthcare, education"
                                fullWidth
                                required
                                value={formData.focusAreas}
                                onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Deliverables</InputLabel>
                                <Select
                                    multiple
                                    value={formData.deliverables}
                                    label="Deliverables"
                                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value as ProjectDeliverable[] })}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {DELIVERABLES.map((name) => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Min Funding"
                                    type="number"
                                    fullWidth
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    value={formData.fundingNeeded?.min}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        fundingNeeded: { ...formData.fundingNeeded!, min: Number(e.target.value) }
                                    })}
                                />
                                <TextField
                                    label="Max Funding"
                                    type="number"
                                    fullWidth
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    value={formData.fundingNeeded?.max}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        fundingNeeded: { ...formData.fundingNeeded!, max: Number(e.target.value) }
                                    })}
                                />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.timeline?.startDate}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        timeline: { ...formData.timeline!, startDate: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.timeline?.endDate}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        timeline: { ...formData.timeline!, endDate: e.target.value }
                                    })}
                                />
                            </Stack>
                            <TextField
                                label="Expected Outcomes (KPIs)"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.expectedOutcomes}
                                onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={formData.priority}
                                    label="Priority"
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProjectPriority })}
                                >
                                    {PRIORITIES.map((p) => (
                                        <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            {editingProject ? 'Save Changes' : 'Add Project'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
