import { Question } from '../types/index.js';

// Mock question bank - in v2 this will be replaced with Supabase queries
export const questions: Question[] = [
  {
    id: 'q1',
    prompt: 'Global CO2 emissions in gigatons',
    unit: 'gigatons',
    trueValue: 37,
    source: 'IEA',
    sourceUrl: 'https://www.iea.org',
  },
  {
    id: 'q2',
    prompt: 'Total number of publicly traded companies on the New York Stock Exchange',
    unit: 'companies',
    trueValue: 2400,
    source: 'NYSE',
    sourceUrl: 'https://www.nyse.com',
  },
  {
    id: 'q3',
    prompt: 'Percentage of the world\'s population that has access to the internet as of 2023, representing roughly the proportion of humanity connected to digital networks',
    unit: 'percent',
    trueValue: 64,
    source: 'ITU',
    sourceUrl: 'https://www.itu.int',
  },
  {
    id: 'q4',
    prompt: 'Distance from Earth to the Moon in kilometers',
    unit: 'km',
    trueValue: 384400,
    source: 'NASA',
    sourceUrl: 'https://www.nasa.gov/moon',
  },
  {
    id: 'q5',
    prompt: 'Boiling point of water in Celsius at sea level',
    unit: '°C',
    trueValue: 100,
    source: 'NIST',
    sourceUrl: 'https://www.nist.gov',
  },
  {
    id: 'q6',
    prompt: 'Number of countries in the United Nations (2023)',
    unit: 'countries',
    trueValue: 193,
    source: 'United Nations',
    sourceUrl: 'https://www.un.org/en/about-us/member-states',
  },
  {
    id: 'q7',
    prompt: 'Speed of light in kilometers per second',
    unit: 'km/s',
    trueValue: 299792,
    source: 'NIST',
    sourceUrl: 'https://www.nist.gov/pml/special-publication-811',
  },
  {
    id: 'q8',
    prompt: 'Population of Tokyo metropolitan area in millions (2023)',
    unit: 'millions',
    trueValue: 37,
    source: 'World Population Review',
    sourceUrl: 'https://worldpopulationreview.com/world-cities/tokyo-population',
  },
];

/**
 * Get a question by ID
 */
export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}

/**
 * Get a set of questions for a new session
 * Currently returns first 3 for determinism
 * Can be changed to random selection later
 */
export function getQuestionsForSession(count: number = 3): Question[] {
  return questions.slice(0, count);
}


