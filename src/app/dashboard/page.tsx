'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GrantCard, { Grant } from '@/components/GrantCard';

const filterTags = ['All', 'Seniors', 'Healthcare', 'Arts', 'Technology', 'Community'];

export default function DashboardPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  // Fetch grants from API
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        setLoading(true);
        setError(null);
        const startTime = performance.now();
        
        const response = await fetch('/api/grants');
        
        if (!response.ok) {
          throw new Error('Failed to fetch grants');
        }
        
        const data = await response.json();
        const endTime = performance.now();
        
        console.log(`[Performance] Grants API: ${(endTime - startTime).toFixed(2)}ms`);
        
        // Add matchScore for demo (would come from backend in production)
        const grantsWithScore = data.map((grant: Grant, index: number) => ({
          ...grant,
          matchScore: 95 - (index * 5) + Math.floor(Math.random() * 10),
        }));
        
        setGrants(grantsWithScore);
      } catch (err) {
        console.error('Error fetching grants:', err);
        setError('Failed to load grants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, []);

  const handleTrack = async (grantId: string) => {
    try {
      const response = await fetch('/api/grants/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
      
      if (response.ok) {
        setTrackedIds((prev) => new Set([...prev, grantId]));
      }
    } catch (error) {
      console.error('Error tracking grant:', error);
    }
  };

  const handleUntrack = async (grantId: string) => {
    try {
      const response = await fetch(`/api/grants/track?grantId=${grantId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTrackedIds((prev) => {
          const next = new Set(prev);
          next.delete(grantId);
          return next;
        });
      }
    } catch (error) {
      console.error('Error untracking grant:', error);
    }
  };

  const filteredGrants = grants
    .filter((grant) => {
      const matchesSearch =
        grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        selectedTag === 'All' || grant.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Discover Grants
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find funding opportunities tailored to your organization&apos;s mission
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search grants by title, agency, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {filterTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => setSelectedTag(tag)}
              color={selectedTag === tag ? 'primary' : 'default'}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results count */}
      {!loading && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Showing {filteredGrants.length} grant{filteredGrants.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedTag !== 'All' && ` in ${selectedTag}`}
        </Typography>
      )}

      {/* Grants Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
              <Skeleton
                variant="rounded"
                height={320}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : filteredGrants.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No grants found matching your criteria. Try adjusting your search or filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredGrants.map((grant) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={grant.id}>
              <GrantCard
                grant={{ ...grant, isTracked: trackedIds.has(grant.id) }}
                onTrack={handleTrack}
                onUntrack={handleUntrack}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
