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

// Sample grants data for MVP demo
const sampleGrants: Grant[] = [
  {
    id: '1',
    title: 'Community Arts Programme Grant',
    agency: 'National Arts Council',
    amount: '$50,000 - $100,000',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Supporting community-based arts programmes that promote cultural engagement and social cohesion among seniors and intergenerational groups.',
    tags: ['Arts', 'Seniors', 'Community'],
    matchScore: 92,
  },
  {
    id: '2',
    title: 'Healthcare Innovation Fund',
    agency: 'Ministry of Health',
    amount: '$100,000 - $250,000',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Funding for innovative healthcare solutions targeting aging population needs, including telemedicine and home care services.',
    tags: ['Healthcare', 'Innovation', 'Seniors', 'Technology'],
    matchScore: 88,
  },
  {
    id: '3',
    title: 'Social Enterprise Development Grant',
    agency: 'National Council of Social Service',
    amount: '$25,000 - $75,000',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Supporting nonprofits in developing sustainable social enterprise models to support their mission delivery.',
    tags: ['Social Enterprise', 'Sustainability', 'Capacity Building'],
    matchScore: 75,
  },
  {
    id: '4',
    title: 'Digital Inclusion Programme',
    agency: 'Infocomm Media Development Authority',
    amount: '$30,000 - $80,000',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Bridging the digital divide for seniors through technology training and device accessibility programmes.',
    tags: ['Technology', 'Seniors', 'Digital Literacy', 'Inclusion'],
    matchScore: 85,
  },
  {
    id: '5',
    title: 'Volunteer Management Excellence Grant',
    agency: "People's Association",
    amount: '$15,000 - $40,000',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Enhancing volunteer management capabilities and building sustainable volunteering programmes in community organizations.',
    tags: ['Volunteers', 'Community', 'Capacity Building'],
    matchScore: 62,
  },
  {
    id: '6',
    title: 'Mental Wellness Initiative Fund',
    agency: 'Agency for Integrated Care',
    amount: '$50,000 - $120,000',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Supporting mental wellness programmes for seniors, including counseling services, support groups, and community outreach.',
    tags: ['Healthcare', 'Mental Health', 'Seniors', 'Wellness'],
    matchScore: 90,
  },
];

const filterTags = ['All', 'Seniors', 'Healthcare', 'Arts', 'Technology', 'Community'];

export default function DashboardPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setGrants(sampleGrants);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleTrack = async (grantId: string) => {
    // In production, this would call the API
    setTrackedIds((prev) => new Set([...prev, grantId]));
  };

  const handleUntrack = async (grantId: string) => {
    setTrackedIds((prev) => {
      const next = new Set(prev);
      next.delete(grantId);
      return next;
    });
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

      {/* Results count */}
      {!loading && (
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
