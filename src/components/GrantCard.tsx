'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  LinearProgress,
  Stack,
  Tooltip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';

export interface Grant {
  id: string;
  title: string;
  agency: string;
  amount: string;
  deadline: string;
  description: string;
  tags: string[];
  url?: string;
  matchScore?: number;
  isTracked?: boolean;
}

interface GrantCardProps {
  grant: Grant;
  onTrack?: (grantId: string) => void;
  onUntrack?: (grantId: string) => void;
}

export default function GrantCard({ grant, onTrack, onUntrack }: GrantCardProps) {
  const daysUntilDeadline = Math.ceil(
    (new Date(grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const deadlineProgress = Math.max(0, Math.min(100, (30 - daysUntilDeadline) / 30 * 100));
  
  const getDeadlineColor = () => {
    if (daysUntilDeadline <= 7) return 'error';
    if (daysUntilDeadline <= 14) return 'warning';
    return 'primary';
  };

  const getMatchBadgeColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'default';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Match Score Badge */}
      {grant.matchScore !== undefined && grant.matchScore > 0 && (
        <Chip
          label={`${grant.matchScore}% Match`}
          color={getMatchBadgeColor(grant.matchScore)}
          size="small"
          sx={{
            position: 'absolute',
            top: -10,
            right: 16,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
          }}
        >
          {grant.title}
        </Typography>

        {/* Agency */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {grant.agency}
          </Typography>
        </Stack>

        {/* Amount and Deadline */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Tooltip title="Funding Amount">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AttachMoneyIcon sx={{ fontSize: 18, color: 'success.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {grant.amount}
              </Typography>
            </Stack>
          </Tooltip>
          <Tooltip title="Application Deadline">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <CalendarTodayIcon sx={{ fontSize: 16, color: getDeadlineColor() + '.main' }} />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: getDeadlineColor() + '.main',
                }}
              >
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Expired'}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>

        {/* Deadline Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={deadlineProgress}
            color={getDeadlineColor()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {grant.description}
        </Typography>

        {/* Tags */}
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {grant.tags.slice(0, 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
          {grant.tags.length > 3 && (
            <Chip
              label={`+${grant.tags.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          )}
        </Stack>
      </CardContent>

      {/* Actions */}
      <Box sx={{ p: 2, pt: 0 }}>
        {grant.isTracked ? (
          <Button
            fullWidth
            variant="outlined"
            color="success"
            startIcon={<BookmarkAddedIcon />}
            onClick={() => onUntrack?.(grant.id)}
            sx={{
              borderColor: 'success.main',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
              },
            }}
          >
            Tracking
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<BookmarkAddIcon />}
            onClick={() => onTrack?.(grant.id)}
          >
            Track this Grant
          </Button>
        )}
      </Box>
    </Card>
  );
}
