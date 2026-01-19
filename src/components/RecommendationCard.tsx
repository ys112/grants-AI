'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

export interface Recommendation {
  id?: string;
  grant: {
    id: string;
    title: string;
    agency: string;
    amount: string;
    deadline: string | null;
    description: string;
    url?: string;
  };
  scores: {
    overall: number;
    category?: number | null;
    funding?: number | null;
    deadline?: number | null;
    semantic?: number | null;
  };
  llmScores?: {
    purposeAlignment: number;
    eligibilityFit: number;
    impactRelevance: number;
    overall: number;
    reasoning: string;
  } | null;
  matchReason?: string;
  status?: string;
}

interface Analysis {
  matchAssessment: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  tips: string[];
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  projectId: string;
  isTracked?: boolean;
  onTrack?: (grantId: string) => void;
  onUntrack?: (grantId: string) => void;
}

function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

export default function RecommendationCard({
  recommendation,
  projectId,
  isTracked = false,
  onTrack,
  onUntrack,
}: RecommendationCardProps) {
  const { grant, scores, llmScores, matchReason } = recommendation;
  
  // Handle null deadline
  const hasDeadline = grant.deadline !== null && grant.deadline !== undefined;
  const deadline = hasDeadline ? new Date(grant.deadline!) : null;
  const daysUntil = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Analysis state
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalysisOpen(true);
    
    // Skip if already loaded
    if (analysis) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId: grant.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 4px 16px rgba(78, 205, 196, 0.15)',
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Score Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${Math.round(scores.overall)}% Match`}
              color={getScoreColor(scores.overall)}
              size="small"
            />
            {daysUntil !== null && daysUntil > 0 && (
              <Chip
                label={`${daysUntil}d left`}
                color={daysUntil <= 7 ? 'error' : daysUntil <= 14 ? 'warning' : 'primary'}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Title */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {grant.title}
          </Typography>

          {/* Agency & Amount */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {grant.agency}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Deadline: {deadline ? deadline.toLocaleDateString() : 'Open'}
              </Typography>
            </Box>
            {grant.amount && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {grant.amount == "Varies" ? grant.amount : "Up to $" + Number(grant.amount).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Score Breakdown - All Components */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Match Score Breakdown
            </Typography>
            <Stack spacing={1}>
              {/* Overall Semantic Score */}
              {/* {scores.semantic != null && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">🤖 AI Semantic</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(scores.semantic)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={scores.semantic}
                    color="info"
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )} */}
              {/* Category Match */}
              {scores.category != null && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">🏷️ Focus Areas</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(scores.category)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={scores.category}
                    color="secondary"
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}
              {/* Funding Match */}
              {scores.funding != null && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">💰 Funding Fit</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(scores.funding)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={scores.funding}
                    color="success"
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}
              {/* Deadline Urgency */}
              {scores.deadline != null && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">⏰ Deadline Urgency</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(scores.deadline)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={scores.deadline}
                    color="warning"
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}
            </Stack>
          </Box>

          {/* LLM AI Analysis - Primary Scores */}
          {llmScores && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(78, 205, 196, 0.08)' }}>
              <Typography variant="caption" color="primary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                🤖 AI Analysis
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">🎯 Purpose Alignment</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {llmScores.purposeAlignment}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={llmScores.purposeAlignment}
                    color="primary"
                    sx={{ height: 5, borderRadius: 2 }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">✅ Eligibility Fit</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {llmScores.eligibilityFit}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={llmScores.eligibilityFit}
                    color="primary"
                    sx={{ height: 5, borderRadius: 2 }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">📈 Impact Relevance</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {llmScores.impactRelevance}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={llmScores.impactRelevance}
                    color="primary"
                    sx={{ height: 5, borderRadius: 2 }}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* Match Reason */}
          {matchReason && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(78, 205, 196, 0.05)',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {matchReason}
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleAnalyze}
            color="primary"
            sx={{ flexGrow: 1 }}
          >
            Generate Gap Report
          </Button>
          <Button
            variant="outlined"
            size="small"
            href={grant.url ? `${grant.url}/instruction` : '#'}
            target="_blank"
          >
            View
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={isTracked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            onClick={() => isTracked ? onUntrack?.(grant.id) : onTrack?.(grant.id)}
          >
            {isTracked ? 'Tracked' : 'Track'}
          </Button>
        </CardActions>
      </Card>

      {/* Analysis Modal */}
      <Dialog
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          AI Analysis: {grant.title}
          <IconButton
            onClick={() => setAnalysisOpen(false)}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analyzing && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Analyzing gaps with AI...</Typography>
            </Box>
          )}

          {analysisError && (
            <Alert severity="error" sx={{ mb: 2 }}>{analysisError}</Alert>
          )}

          {analysis && !analyzing && (
            <Stack spacing={3}>
              {/* Match Assessment */}
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Match Assessment
                </Typography>
                <Typography>{analysis.matchAssessment}</Typography>
              </Box>

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} color="success.main" gutterBottom>
                    ✓ Strengths
                  </Typography>
                  <List dense>
                    {analysis.strengths.map((item, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Gaps */}
              {analysis.gaps?.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} color="warning.main" gutterBottom>
                    ⚠ Gaps Identified
                  </Typography>
                  <List dense>
                    {analysis.gaps.map((item, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <WarningIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                    💡 Recommendations
                  </Typography>
                  <List dense>
                    {analysis.recommendations.map((item, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <LightbulbIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, pl: 2 }}>
            Generated by AI • Review before use
          </Typography>
          <Button onClick={() => setAnalysisOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
