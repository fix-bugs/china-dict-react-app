
export interface Idiom {
  word: string;
  pinyin: string;
  explanation: string;
  derivation: string; 
  example?: string;
}

export interface GameStep {
  idiom: Idiom;
  speaker: 'user' | 'ai';
  timestamp: number;
}

export interface JielongResponse {
  isValid: boolean;
  message?: string;
  userIdiom?: Idiom;
  aiIdiom?: Idiom;
}

export interface DictionaryWord {
  word: string;
  oldword?: string;
  pinyin: string;
  radicals: string;
  strokes: string;
  explanation: string;
  more?: string;
}

export interface CiItem {
  ci: string;
  explanation: string;
}

export interface XiehouyuItem {
  riddle: string;
  answer: string;
}

export type ModuleType = 'jielong' | 'dictionary' | 'ci' | 'xiehouyu' | 'idiom_search' | 'mine';
