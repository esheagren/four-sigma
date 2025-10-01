# Source Attribution

## Overview

Four Sigma displays the source of information for each question's true value, promoting transparency and allowing users to verify facts.

## Source Display

Sources appear at the bottom of each result card:

```
Source: National Geographic
```

When a URL is provided, the source becomes a clickable link:

```
Source: National Geographic [↗]
```

## Current Sources

All questions include credible sources:

1. **Height of Mount Everest** - National Geographic
2. **Printing Press Invention** - Britannica
3. **Number of Bones** - Cleveland Clinic
4. **Earth-Moon Distance** - NASA
5. **Boiling Point of Water** - NIST (National Institute of Standards and Technology)
6. **UN Member Countries** - United Nations
7. **Speed of Light** - NIST
8. **Tokyo Population** - World Population Review

## Benefits

✅ **Transparency** - Users can verify the information  
✅ **Credibility** - Shows we use authoritative sources  
✅ **Education** - Users can learn more by clicking through  
✅ **Trust** - Builds confidence in the game's accuracy

## Adding New Questions

When adding questions to the database, include:

```typescript
{
  id: 'q9',
  prompt: 'Your question here',
  unit: 'units',
  trueValue: 123,
  source: 'Source Name',           // Required
  sourceUrl: 'https://...',        // Optional but recommended
}
```

## Source Guidelines

### Preferred Sources
- Government agencies (NASA, NIST, UN, etc.)
- Academic institutions
- Scientific journals
- Established encyclopedias (Britannica, National Geographic)
- Official organizations

### Requirements
- Must be publicly accessible
- Must be authoritative and credible
- Should be stable (unlikely to change URLs)
- Should provide clear, verifiable data

### URL Selection
- Link to the specific page with the information
- Avoid paywalled content when possible
- Use HTTPS when available
- Prefer permanent URLs over dynamic ones

## Future Enhancements

- Source reputation scoring
- Multiple sources per question
- Community-submitted sources
- Source verification system
- Citation format options (APA, MLA, etc.)

