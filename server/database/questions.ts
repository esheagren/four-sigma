import { Question } from '../types/index.js';

// Mock question bank - in v2 this will be replaced with Supabase queries
export const questions: Question[] = [
  {
    id: 'q1',
    prompt: 'Height of Mount Everest in meters',
    unit: 'meters',
    trueValue: 8849,
    source: 'National Geographic',
    sourceUrl: 'https://www.nationalgeographic.com/adventure/article/mount-everest',
  },
  {
    id: 'q2',
    prompt: 'Year the printing press was invented',
    unit: 'year',
    trueValue: 1440,
    source: 'Britannica',
    sourceUrl: 'https://www.britannica.com/technology/printing-press',
  },
  {
    id: 'q3',
    prompt: 'Number of bones in the adult human body',
    unit: 'bones',
    trueValue: 206,
    source: 'Cleveland Clinic',
    sourceUrl: 'https://my.clevelandclinic.org/health/body/23042-bones',
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


