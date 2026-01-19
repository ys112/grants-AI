'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useSession } from '@/lib/auth-client';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  // Fetch grants from API
  useEffect(() => {
    async function fetchGrants() {
      const startTime = performance.now();
      try {
        const res = await fetch('/api/grants');
        if (!res.ok) throw new Error('Failed to fetch grants');
        const data = await res.json();

        const endTime = performance.now();
        console.log(`[Performance] Grants API loaded in ${(endTime - startTime).toFixed(2)}ms`);

        setGrants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load grants');
      } finally {
        setLoading(false);
      }
    }
    fetchGrants();
  }, []);

  // Extract unique tags from all grants (dynamic filter tags)
  const filterTags = useMemo(() => {
    const allTags = new Set<string>();
    grants.forEach((grant) => {
      grant.tags.forEach((tag) => allTags.add(tag));
    });
    return ['All', ...Array.from(allTags).sort()];
  }, [grants]);

  // Calculate match score based on user profile (funding + tags match)
  const calculateMatchScore = (grant: Grant): number => {
    let score = 0; // Base score starts at 0

    if (!session?.user) return score;

    // Parse user interests from JSON string
    let userInterests: string[] = [];
    try {
      const interestsStr = session.user.interests || '[]';
      userInterests = JSON.parse(interestsStr);
    } catch {
      userInterests = [];
    }
    const userMinFunding = session.user.minFunding || 0;

    // Tags match scoring (up to +70 points)
    if (userInterests.length > 0) {
      const matchingTags = grant.tags.filter((tag) =>
        userInterests.some((interest) => interest.toLowerCase() === tag.toLowerCase())
      );
      const tagMatchPercent = matchingTags.length / Math.max(userInterests.length, 1);
      score += Math.round(tagMatchPercent * 70);
    }

    // Funding match scoring (up to +30 points)
    if (userMinFunding > 0 && grant.amount && grant.amount !== 'Varies') {
      const grantAmount = parseInt(grant.amount.replace(/\D/g, '')) || 0;
      if (grantAmount >= userMinFunding) {
        score += 30; // Grant meets minimum funding requirement
      }
    }

    return Math.min(score, 100); // Cap at 100
  };

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
      } catch (err) {
        console.log('Could not fetch tracked grants:', err);
      }
    }
    fetchTrackedIds();
  }, []);

  const handleTrack = async (grantId: string) => {
    try {
      const res = await fetch('/api/grants/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to track grant');
      }

      setTrackedIds((prev) => new Set([...prev, grantId]));
    } catch (err) {
      console.error('Track error:', err);
    }
  };

  const handleUntrack = async (grantId: string) => {
    try {
      const res = await fetch(`/api/grants/track?grantId=${grantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to untrack grant');

      setTrackedIds((prev) => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
    } catch (err) {
      console.error('Untrack error:', err);
    }
  };

  // Filter and sort grants
  const processedGrants = useMemo(() => {
    return grants
      .map((grant) => ({
        ...grant,
        matchScore: calculateMatchScore(grant),
      }))
      .filter((grant) => {
        // 1. Search filtering (title, agency, description)
        const matchesSearch =
          !searchQuery ||
          grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grant.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grant.description.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Tag filtering (only when a specific tag is clicked)
        const matchesTag = selectedTag === 'All' || grant.tags.includes(selectedTag);

        // No interest-based filtering! Only search and tag click filter.
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        // Sort by match score (descending) - higher scores first
        return (b.matchScore || 0) - (a.matchScore || 0);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, searchQuery, selectedTag, session]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Grants Feed
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Grants sorted by match score based on your organization&apos;s interests
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
          Showing {processedGrants.length} grant{processedGrants.length !== 1 ? 's' : ''}
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
      ) : processedGrants.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No grants found matching your criteria. Try adjusting your search or filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {processedGrants.map((grant) => (
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
