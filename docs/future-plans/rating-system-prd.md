# DeBetter Debate Rating System - PRD (Product Requirements Document)

## Executive Summary

This PRD outlines the development of a comprehensive debate rating system for DeBetter inspired by Codeforces' "darkness = higher rating" visual hierarchy. The system will transform the current static leaderboard into a dynamic, skill-based rating platform that motivates debaters through clear progression paths and visual status recognition.

## Problem Statement

### Current State
- Static hardcoded leaderboard with fake data
- No dynamic rating calculation or progression system
- Limited visual hierarchy for skill differentiation
- No integration with tournament results or debate performance
- Missing backend infrastructure for rating management

### Pain Points
- Users cannot track their debate skill progression
- No motivation system for competitive improvement
- Tournament organizers lack tools for fair matchmaking
- No standardized skill assessment across debates

## Goals and Objectives

### Primary Goals
1. **Implement Dynamic Rating System**: Replace static data with live, calculation-based ratings
2. **Visual Skill Hierarchy**: Create intuitive color-based rating tiers using darkness progression
3. **Performance Integration**: Connect ratings to actual debate results and tournament outcomes
4. **Motivation & Engagement**: Provide clear progression paths and achievement recognition

### Success Metrics
- 80% of active users engage with rating features within first month
- 40% increase in tournament participation post-launch
- Average session time increases by 25%
- User retention improves by 35%

## User Stories

### Debater Personas
**As a novice debater, I want to:**
- See my current rating and tier clearly displayed
- Understand what I need to do to improve my rating
- Feel motivated by achieving the next color tier
- Compare my progress with peers

**As an experienced debater, I want to:**
- Maintain my high rating status through consistent performance
- Be recognized visually for my expertise level
- Use ratings for tournament seeding and matchmaking
- Track long-term rating trends and performance analytics

**As a tournament organizer, I want to:**
- Use ratings for fair team/opponent matching
- Automatically update participant ratings based on results
- Display rating-based leaderboards during events
- Filter participants by skill level for appropriate divisions

## Technical Requirements

### Rating Tier System (Darkness Progression)

Inspired by Codeforces rating system with debate-specific adaptations:

| Tier | Name | Rating Range | Color Code | Visual Characteristics |
|------|------|--------------|------------|----------------------|
| 1 | **Novice** | 0-999 | `#9CA3AF` (Gray-400) | Light gray, basic tier |
| 2 | **Apprentice** | 1000-1299 | `#10B981` (Emerald-500) | Bright green, growth phase |
| 3 | **Advocate** | 1300-1599 | `#06B6D4` (Cyan-500) | Cyan blue, developing skills |
| 4 | **Expert** | 1600-1899 | `#3B82F6` (Blue-500) | Medium blue, competent |
| 5 | **Master** | 1900-2199 | `#0D1321` (Dark Navy) | **Current brand dark blue** |
| 6 | **Grandmaster** | 2200-2499 | `#7C3AED` (Violet-600) | Deep purple, elite tier |
| 7 | **Legend** | 2500+ | `#F59E0B` (Amber-500) | Gold, legendary status |

### Database Schema

```typescript
// User Rating Entity
interface UserRating {
  id: string
  userId: string
  currentRating: number
  peakRating: number
  tier: RatingTier
  ratingHistory: RatingChange[]
  totalDebates: number
  wins: number
  losses: number
  lastUpdated: Date
  createdAt: Date
}

// Rating Change History
interface RatingChange {
  id: string
  userId: string
  tournamentId?: string
  debateId?: string
  oldRating: number
  newRating: number
  ratingDelta: number
  reason: 'tournament_win' | 'tournament_loss' | 'debate_victory' | 'debate_defeat' | 'adjustment'
  timestamp: Date
}

// Rating Tier Enum
enum RatingTier {
  NOVICE = 'novice',
  APPRENTICE = 'apprentice', 
  ADVOCATE = 'advocate',
  EXPERT = 'expert',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
  LEGEND = 'legend'
}
```

### API Endpoints

```typescript
// Rating Management APIs
GET /api/ratings/leaderboard?limit=50&offset=0
GET /api/ratings/user/:userId
POST /api/ratings/calculate  // Triggered after tournaments
PUT /api/ratings/user/:userId/adjust  // Admin adjustments
GET /api/ratings/history/:userId?period=6months
GET /api/ratings/statistics/global  // Overall rating distribution
```

### Rating Calculation Algorithm

```typescript
// ELO-style rating system adapted for debates
interface RatingCalculation {
  // K-factor based on rating tier (higher rated = lower volatility)
  kFactor: {
    novice: 32,
    apprentice: 24, 
    advocate: 16,
    expert: 12,
    master: 8,
    grandmaster: 6,
    legend: 4
  }
  
  // Performance factors
  performanceMultipliers: {
    tournamentWin: 1.5,
    tournamentFinal: 1.3,
    tournamentSemifinal: 1.2,
    regularDebateWin: 1.0,
    qualityOfOpponent: 0.8-1.4  // Based on opponent rating difference
  }
}
```

## UI/UX Requirements

### Rating Display Components

1. **User Profile Rating Badge**
   - Large hexagonal badge with tier color
   - Current rating number prominently displayed
   - Progress bar to next tier
   - Tier name and icon

2. **Leaderboard Enhancements**  
   - Color-coded rating tiers throughout table
   - Rating change indicators (↑↓ arrows with delta)
   - Filter by rating tier
   - Search by username or rating range

3. **Rating History Charts**
   - Line graph showing rating progression over time
   - Tournament markers on timeline
   - Zoom capabilities (1M, 3M, 6M, 1Y, All)
   - Peak rating indicator

4. **Tournament Integration**
   - Pre-tournament rating display for seeding
   - Live rating updates during tournaments
   - Post-tournament rating change notifications
   - Rating-based division brackets

### Responsive Design Requirements
- Mobile-first approach for rating displays
- Touch-friendly rating tier filters
- Collapsible detailed statistics on smaller screens
- Progressive disclosure of rating history details

## Implementation Plan

### Phase 1: Core Infrastructure (2-3 weeks)
- [ ] Database schema implementation (Prisma/Supabase)
- [ ] Rating calculation service development
- [ ] Basic API endpoints creation
- [ ] User rating entity relationships

### Phase 2: Visual System (1-2 weeks)  
- [ ] Rating tier color system integration
- [ ] Hexagon badge component development
- [ ] Leaderboard UI updates with new color scheme
- [ ] Rating display components creation

### Phase 3: Rating Logic (2-3 weeks)
- [ ] ELO-style rating algorithm implementation
- [ ] Tournament result integration
- [ ] Rating change history tracking
- [ ] Tier progression notifications

### Phase 4: Advanced Features (2-3 weeks)
- [ ] Rating history visualization
- [ ] Statistics dashboard
- [ ] Rating-based matchmaking suggestions
- [ ] Admin rating adjustment tools

### Phase 5: Polish & Testing (1-2 weeks)
- [ ] Performance optimization
- [ ] Mobile responsiveness testing
- [ ] User acceptance testing
- [ ] Rating system balance adjustments

## Risk Assessment

### Technical Risks
- **Rating Algorithm Balance**: Initial K-factors may need adjustment based on user behavior
- **Database Performance**: Large rating history tables may require optimization
- **Real-time Updates**: Rating changes during live tournaments need efficient synchronization

### Product Risks  
- **User Adoption**: Complex rating system might intimidate casual users
- **Rating Inflation**: Need mechanisms to prevent system-wide rating inflation
- **Fairness Perception**: Users may dispute rating calculations

### Mitigation Strategies
- Start with conservative rating changes and adjust based on data
- Implement rating system transparency with detailed calculation explanations
- Create rating "seasons" to reset and rebalance periodically
- Provide clear appeal/adjustment processes for disputed ratings

## Future Enhancements

### Advanced Features (Post-Launch)
- **Achievement System**: Unlock badges for rating milestones
- **Rating Decay**: Implement activity-based rating maintenance
- **Team Ratings**: Extend system to debate teams and partnerships  
- **Regional Leaderboards**: Location-based rating competitions
- **Rating Predictions**: ML-based performance forecasting

### Integration Opportunities
- **Tournament Seeding**: Automatic bracket generation based on ratings
- **Debate Matchmaking**: Suggest optimal opponents for practice debates
- **Educational Content**: Personalized improvement recommendations based on rating tier
- **Social Features**: Rating-based debate clubs and communities

## Success Criteria

### Launch Success (Month 1)
- 95% uptime for rating system APIs
- <500ms average response time for leaderboard queries
- Zero critical rating calculation bugs
- 80% user satisfaction score in post-launch survey

### Long-term Success (Month 6)
- 500+ active rated users
- 50+ rated tournaments completed
- 25% month-over-month growth in rating engagement
- Integration with 3+ external tournament management systems

---

**Document Version**: 1.0  
**Created**: July 23, 2025  
**Last Updated**: July 23, 2025  
**Owner**: DeBetter Development Team  
**Status**: Planning Phase