'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TrackedGrant {
  id: string;
  title: string;
  agency: string;
  amount: string;
  deadline: string;
  status: 'new' | 'reviewing' | 'applied' | 'rejected';
}

const sampleTrackedGrants: TrackedGrant[] = [
  {
    id: '1',
    title: 'Community Arts Programme Grant',
    agency: 'National Arts Council',
    amount: '$50,000 - $100,000',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'new',
  },
  {
    id: '2',
    title: 'Healthcare Innovation Fund',
    agency: 'Ministry of Health',
    amount: '$100,000 - $250,000',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'reviewing',
  },
  {
    id: '3',
    title: 'Digital Inclusion Programme',
    agency: 'IMDA',
    amount: '$30,000 - $80,000',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'applied',
  },
];

const statusColumns = [
  { id: 'new', label: 'New', color: 'primary' },
  { id: 'reviewing', label: 'Reviewing', color: 'warning' },
  { id: 'applied', label: 'Applied', color: 'success' },
  { id: 'rejected', label: 'Rejected', color: 'error' },
] as const;

type StatusType = (typeof statusColumns)[number]['id'];

export default function TrackedGrantsPage() {
  const [grants, setGrants] = useState<TrackedGrant[]>(sampleTrackedGrants);

  const moveGrant = (grantId: string, direction: 'forward' | 'back') => {
    setGrants((prev) =>
      prev.map((grant) => {
        if (grant.id !== grantId) return grant;
        const currentIndex = statusColumns.findIndex((s) => s.id === grant.status);
        const newIndex =
          direction === 'forward'
            ? Math.min(currentIndex + 1, statusColumns.length - 1)
            : Math.max(currentIndex - 1, 0);
        return { ...grant, status: statusColumns[newIndex].id as StatusType };
      })
    );
  };

  const removeGrant = (grantId: string) => {
    setGrants((prev) => prev.filter((g) => g.id !== grantId));
  };

  const getGrantsByStatus = (status: string) =>
    grants.filter((g) => g.status === status);

  const formatDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? `${days} days left` : 'Expired';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Tracked Grants
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your grant applications with our Kanban board
        </Typography>
      </Box>

      {grants.length === 0 ? (
        <Alert severity="info">
          No tracked grants yet. Go to the Grant Feed to start tracking grants!
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
            minHeight: 400,
          }}
        >
          {statusColumns.map((column) => (
            <Paper
              key={column.id}
              sx={{
                p: 2,
                backgroundColor: 'rgba(19, 47, 76, 0.5)',
                borderRadius: 3,
                border: '1px solid rgba(78, 205, 196, 0.1)',
              }}
            >
              {/* Column Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid rgba(78, 205, 196, 0.1)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {column.label}
                  </Typography>
                  <Chip
                    label={getGrantsByStatus(column.id).length}
                    size="small"
                    color={column.color}
                    sx={{ minWidth: 28 }}
                  />
                </Stack>
              </Box>

              {/* Cards */}
              <Stack spacing={2}>
                {getGrantsByStatus(column.id).map((grant) => (
                  <Card
                    key={grant.id}
                    sx={{
                      backgroundColor: 'rgba(10, 25, 41, 0.8)',
                      border: '1px solid rgba(78, 205, 196, 0.15)',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {grant.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        {grant.agency}
                      </Typography>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Chip
                          label={formatDeadline(grant.deadline)}
                          size="small"
                          variant="outlined"
                          color={
                            Math.ceil(
                              (new Date(grant.deadline).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                            ) <= 7
                              ? 'error'
                              : 'default'
                          }
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Stack direction="row" spacing={0}>
                          {column.id !== 'new' && (
                            <IconButton
                              size="small"
                              onClick={() => moveGrant(grant.id, 'back')}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ArrowBackIcon fontSize="small" />
                            </IconButton>
                          )}
                          {column.id !== 'rejected' && (
                            <IconButton
                              size="small"
                              onClick={() => moveGrant(grant.id, 'forward')}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => removeGrant(grant.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
