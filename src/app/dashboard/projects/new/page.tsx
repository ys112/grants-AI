'use client';

import { Box, Typography, Paper } from '@mui/material';
import ProjectForm from '@/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Create New Project
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Define your project to get matched with relevant grants
        </Typography>
      </Box>

      {/* Form */}
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 800,
        }}
      >
        <ProjectForm mode="create" />
      </Paper>
    </Box>
  );
}
