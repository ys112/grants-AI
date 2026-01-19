'use client';

import { useState, useEffect } from 'react';
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
  Skeleton,
  Autocomplete,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TrackedGrant {
  id: string;
  grantId: string;
  title: string;
  agency: string;
  amount: string;
  deadline: string;
  status: 'new' | 'reviewing' | 'applied' | 'rejected';
}

const statusColumns = [
  { id: 'new', label: 'New', color: 'primary' },
  { id: 'reviewing', label: 'Reviewing', color: 'warning' },
  { id: 'applied', label: 'Applied', color: 'success' },
  { id: 'rejected', label: 'Rejected', color: 'error' },
] as const;

type StatusType = (typeof statusColumns)[number]['id'];

export default function TrackedGrantsPage() {
  const [grants, setGrants] = useState<TrackedGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('All');
  const agencies = ['All', ...Array.from(new Set(grants.map((g) => g.agency)))];

  // Fetch tracked grants from API
  useEffect(() => {
    async function fetchTrackedGrants() {
      try {
        const res = await fetch('/api/grants/tracked');
        if (!res.ok) {
          if (res.status === 401) {
            setError('Please log in to view your tracked grants');
            return;
          }
          throw new Error('Failed to fetch tracked grants');
        }
        const data = await res.json();
        setGrants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tracked grants');
      } finally {
        setLoading(false);
      }
    }
    fetchTrackedGrants();
  }, []);

  const moveGrant = async (grantId: string, direction: 'forward' | 'back') => {
    const grant = grants.find((g) => g.grantId === grantId);
    if (!grant) return;

    const currentIndex = statusColumns.findIndex((s) => s.id === grant.status);
    const newIndex =
      direction === 'forward'
        ? Math.min(currentIndex + 1, statusColumns.length - 1)
        : Math.max(currentIndex - 1, 0);
    const newStatus = statusColumns[newIndex].id as StatusType;

    if (newStatus === grant.status) return;

    // Optimistic update
    setGrants((prev) =>
      prev.map((g) => (g.grantId === grantId ? { ...g, status: newStatus } : g))
    );

    try {
      const res = await fetch('/api/grants/track', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        setGrants((prev) =>
          prev.map((g) => (g.grantId === grantId ? { ...g, status: grant.status } : g))
        );
        console.error('Failed to update grant status');
      }
    } catch (err) {
      // Revert on error
      setGrants((prev) =>
        prev.map((g) => (g.grantId === grantId ? { ...g, status: grant.status } : g))
      );
      console.error('Error updating status:', err);
    }
  };

  const removeGrant = async (grantId: string) => {
    const grantToRemove = grants.find((g) => g.grantId === grantId);
    if (!grantToRemove) return;

    // Optimistic update
    setGrants((prev) => prev.filter((g) => g.grantId !== grantId));

    try {
      const res = await fetch(`/api/grants/track?grantId=${grantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        // Revert on error
        setGrants((prev) => [...prev, grantToRemove]);
        console.error('Failed to remove grant');
      }
    } catch (err) {
      // Revert on error
      setGrants((prev) => [...prev, grantToRemove]);
      console.error('Error removing grant:', err);
    }
  };

  const filteredGrants = grants.filter((grant) => {
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgency = selectedAgency === 'All' || grant.agency === selectedAgency;

    return matchesSearch && matchesAgency;
  });

  const getGrantsByStatus = (status: string) =>
    filteredGrants.filter((g) => g.status === status);

  const formatDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? `${days} days left` : 'Expired';
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tracked Grants
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your grant applications with our Kanban board
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {statusColumns.map((column) => (
            <Skeleton
              key={column.id}
              variant="rounded"
              height={300}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tracked Grants
          </Typography>
        </Box>
        <Alert severity="warning">{error}</Alert>
      </Box>
    );
  }

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
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        width: '100%'
      }}>
        <Autocomplete
          freeSolo // Allows the user to type custom text without selecting an option
          sx={{ width: '100%' }}
          options={grants.map((option) => option.title)}
          onInputChange={(event, newInputValue) => {
            setSearchQuery(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Grant Titles"
              sx={{ mb: 4, backgroundColor: 'rgba(19, 47, 76, 0.3)' }}
            />
          )}
        />
        <FormControl sx={{ flex: 1, minWidth: 200 }}>
          <InputLabel id="agency-filter-label">Agency</InputLabel>
          <Select
            labelId="agency-filter-label"
            value={selectedAgency}
            label="Agency"
            onChange={(e) => setSelectedAgency(e.target.value)}
            sx={{ backgroundColor: 'rgba(19, 47, 76, 0.3)' }}
          >
            {agencies.map((agency) => (
              <MenuItem key={agency} value={agency}>
                {agency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
                            (() => {
                              const days = Math.ceil(
                                (new Date(grant.deadline).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                              );
                              if (days <= 7) return 'error';
                              if (days <= 14) return 'warning';
                              return 'primary';
                            })()
                          }
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Stack direction="row" spacing={0}>
                          {column.id !== 'new' && (
                            <IconButton
                              size="small"
                              onClick={() => moveGrant(grant.grantId, 'back')}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ArrowBackIcon fontSize="small" />
                            </IconButton>
                          )}
                          {column.id !== 'rejected' && (
                            <IconButton
                              size="small"
                              onClick={() => moveGrant(grant.grantId, 'forward')}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => removeGrant(grant.grantId)}
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
