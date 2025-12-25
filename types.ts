
export interface StoryCharacter {
  name: string;
  age: number;
  gender: 'dreng' | 'pige' | 'mand' | 'kvinde' | 'andet';
}

export interface AdvancedStoryParams {
  location?: string;
  year?: string;
  characters: StoryCharacter[];
}

export interface StorySource {
  uri: string;
  title: string;
}

export interface Story {
  title: string;
  content: string;
  topic: string;
  timestamp: number;
  sources?: StorySource[];
  choices?: string[]; // De to uhyggelige valgmuligheder
  isFinished?: boolean; // Om historien er slut
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  READING = 'READING',
  ERROR = 'ERROR'
}
