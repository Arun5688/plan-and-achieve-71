export interface ParsedCommand {
  intent: CommandIntent;
  entities: CommandEntities;
  confidence: number;
  rawText: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

export type CommandIntent =
  | 'search_cases'
  | 'filter_cases'
  | 'temporal_query'
  | 'location_query'
  | 'suspect_query'
  | 'crime_type_query'
  | 'unknown';

export interface CommandEntities {
  crimeType?: string[];
  location?: string;
  timeRange?: TimeRange;
  suspect?: string;
  caseId?: string;
  keywords?: string[];
}

export interface TimeRange {
  start?: Date;
  end?: Date;
  relative?: string; // e.g., "this month", "last week"
}

const CRIME_TYPES = [
  'armed robbery',
  'robbery',
  'burglary',
  'theft',
  'assault',
  'homicide',
  'murder',
  'fraud',
  'arson',
  'kidnapping',
  'vandalism',
  'drug trafficking',
  'weapons violation',
];

const TEMPORAL_KEYWORDS = {
  today: { days: 0 },
  yesterday: { days: 1 },
  'this week': { days: 7 },
  'last week': { days: 14, offset: 7 },
  'this month': { days: 30 },
  'last month': { days: 60, offset: 30 },
  'this year': { days: 365 },
};

/**
 * Parse natural language command into structured format
 */
export const parseVoiceCommand = (text: string): ParsedCommand => {
  const normalizedText = text.toLowerCase().trim();

  // Determine intent
  const intent = determineIntent(normalizedText);

  // Extract entities
  const entities = extractEntities(normalizedText);

  // Calculate confidence
  const confidence = calculateConfidence(intent, entities, normalizedText);

  // Check if clarification is needed
  const needsClarification = confidence < 0.7;
  const clarificationQuestion = needsClarification
    ? generateClarificationQuestion(intent, entities, normalizedText)
    : undefined;

  return {
    intent,
    entities,
    confidence,
    rawText: text,
    needsClarification,
    clarificationQuestion,
  };
};

/**
 * Determine the intent of the command
 */
const determineIntent = (text: string): CommandIntent => {
  // Search queries
  if (
    text.includes('show') ||
    text.includes('find') ||
    text.includes('search') ||
    text.includes('get')
  ) {
    if (containsCrimeType(text)) return 'crime_type_query';
    if (containsLocation(text)) return 'location_query';
    if (containsTimeReference(text)) return 'temporal_query';
    return 'search_cases';
  }

  // Filter commands
  if (text.includes('filter') || text.includes('narrow') || text.includes('matching')) {
    return 'filter_cases';
  }

  // Temporal queries
  if (containsTimeReference(text)) {
    return 'temporal_query';
  }

  // Location queries
  if (containsLocation(text)) {
    return 'location_query';
  }

  // Suspect queries
  if (text.includes('suspect') || text.includes('perpetrator')) {
    return 'suspect_query';
  }

  return 'unknown';
};

/**
 * Extract entities from the text
 */
const extractEntities = (text: string): CommandEntities => {
  const entities: CommandEntities = {};

  // Extract crime types
  const crimeTypes = CRIME_TYPES.filter((type) => text.includes(type));
  if (crimeTypes.length > 0) {
    entities.crimeType = crimeTypes;
  }

  // Extract location
  const locationMatch =
    text.match(/(?:in|near|at|around)\s+([a-z0-9\s]+?)(?:\s|$)/i) ||
    text.match(/sector\s+(\d+)/i) ||
    text.match(/district\s+([a-z0-9\s]+)/i);
  if (locationMatch) {
    entities.location = locationMatch[1].trim();
  }

  // Extract time range
  const timeRange = extractTimeRange(text);
  if (timeRange) {
    entities.timeRange = timeRange;
  }

  // Extract suspect name
  const suspectMatch = text.match(/suspect(?:\s+named)?\s+([a-z\s]+?)(?:\s|$)/i);
  if (suspectMatch) {
    entities.suspect = suspectMatch[1].trim();
  }

  // Extract case ID
  const caseIdMatch = text.match(/case\s+(?:id\s+)?([a-z0-9-]+)/i);
  if (caseIdMatch) {
    entities.caseId = caseIdMatch[1];
  }

  // Extract keywords
  const keywords = extractKeywords(text);
  if (keywords.length > 0) {
    entities.keywords = keywords;
  }

  return entities;
};

/**
 * Extract time range from text
 */
const extractTimeRange = (text: string): TimeRange | undefined => {
  // Check for relative time references
  for (const [keyword, value] of Object.entries(TEMPORAL_KEYWORDS)) {
    if (text.includes(keyword)) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - value.days);
      
      if ('offset' in value && value.offset) {
        end.setDate(end.getDate() - value.offset);
      }

      return {
        start,
        end,
        relative: keyword,
      };
    }
  }

  // Check for specific dates
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    const date = new Date(dateMatch[1]);
    return {
      start: date,
      end: date,
    };
  }

  return undefined;
};

/**
 * Extract keywords from text
 */
const extractKeywords = (text: string): string[] => {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'show',
    'find',
    'search',
    'get',
    'me',
    'all',
  ];

  const words = text
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  return [...new Set(words)]; // Remove duplicates
};

/**
 * Check if text contains crime type
 */
const containsCrimeType = (text: string): boolean => {
  return CRIME_TYPES.some((type) => text.includes(type));
};

/**
 * Check if text contains location reference
 */
const containsLocation = (text: string): boolean => {
  return (
    text.includes('in ') ||
    text.includes('near ') ||
    text.includes('at ') ||
    text.includes('around ') ||
    text.includes('sector') ||
    text.includes('district')
  );
};

/**
 * Check if text contains time reference
 */
const containsTimeReference = (text: string): boolean => {
  return Object.keys(TEMPORAL_KEYWORDS).some((keyword) => text.includes(keyword));
};

/**
 * Calculate confidence score
 */
const calculateConfidence = (
  intent: CommandIntent,
  entities: CommandEntities,
  text: string
): number => {
  let score = 0;

  // Intent confidence
  if (intent !== 'unknown') score += 0.3;

  // Entity extraction confidence
  const entityCount = Object.keys(entities).length;
  score += Math.min(entityCount * 0.2, 0.4);

  // Text clarity (longer, more specific commands are more confident)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 4) score += 0.2;
  if (wordCount >= 8) score += 0.1;

  return Math.min(score, 1.0);
};

/**
 * Generate clarification question
 */
const generateClarificationQuestion = (
  intent: CommandIntent,
  entities: CommandEntities,
  text: string
): string => {
  if (intent === 'unknown') {
    return 'I didn\'t quite understand that. Could you please rephrase your query?';
  }

  if (!entities.crimeType && !entities.location && !entities.timeRange) {
    return 'Could you please specify more details, such as crime type, location, or time period?';
  }

  if (entities.crimeType && entities.crimeType.length > 1) {
    return `I detected multiple crime types: ${entities.crimeType.join(', ')}. Which one would you like to search for?`;
  }

  if (!entities.timeRange) {
    return 'What time period would you like to search? For example: this month, last week, or a specific date?';
  }

  if (!entities.location) {
    return 'Which location or sector would you like to search?';
  }

  return 'Could you please provide more specific details for your search?';
};

/**
 * Format parsed command for display
 */
export const formatCommandSummary = (parsed: ParsedCommand): string => {
  const parts: string[] = [];

  if (parsed.entities.crimeType && parsed.entities.crimeType.length > 0) {
    parts.push(`Crime: ${parsed.entities.crimeType.join(', ')}`);
  }

  if (parsed.entities.location) {
    parts.push(`Location: ${parsed.entities.location}`);
  }

  if (parsed.entities.timeRange?.relative) {
    parts.push(`Time: ${parsed.entities.timeRange.relative}`);
  }

  if (parsed.entities.suspect) {
    parts.push(`Suspect: ${parsed.entities.suspect}`);
  }

  if (parsed.entities.caseId) {
    parts.push(`Case ID: ${parsed.entities.caseId}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'General search';
};
