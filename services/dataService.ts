
import { DictionaryWord, CiItem, XiehouyuItem } from "../types";
import { cacheService } from "./cacheService";

const WORD_JSON_URL = "https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/word.json";
const CI_JSON_URL = "https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/ci.json";
const XIEHOUYU_JSON_URL = "https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/xiehouyu.json";

let wordsData: DictionaryWord[] = [];
let ciData: CiItem[] = [];
let xiehouyuData: XiehouyuItem[] = [];

export const dataService = {
  async initModule(type: 'word' | 'ci' | 'xiehouyu', forceRefresh = false): Promise<void> {
    const urls = { word: WORD_JSON_URL, ci: CI_JSON_URL, xiehouyu: XIEHOUYU_JSON_URL };
    const cacheKey = `json_data_${type}`;

    if (!forceRefresh) {
      if (type === 'word' && wordsData.length > 0) return;
      if (type === 'ci' && ciData.length > 0) return;
      if (type === 'xiehouyu' && xiehouyuData.length > 0) return;

      const cached = await cacheService.getItem<any[]>(cacheKey);
      if (cached) {
        if (type === 'word') wordsData = cached;
        else if (type === 'ci') ciData = cached;
        else if (type === 'xiehouyu') xiehouyuData = cached;
        return;
      }
    }

    try {
      const response = await fetch(urls[type]);
      if (!response.ok) throw new Error(`${type} 数据加载失败`);
      const data = await response.json();
      await cacheService.setItem(cacheKey, data);
      
      if (type === 'word') wordsData = data;
      else if (type === 'ci') ciData = data;
      else if (type === 'xiehouyu') xiehouyuData = data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  searchWord(query: string): DictionaryWord[] {
    if (!query) return [];
    return wordsData.filter(item => item.word.includes(query)).slice(0, 50);
  },

  searchCi(query: string): CiItem[] {
    if (!query) return [];
    return ciData.filter(item => item.ci.includes(query)).slice(0, 50);
  },

  searchXiehouyu(query: string): XiehouyuItem[] {
    if (!query) return [];
    return xiehouyuData.filter(item => item.riddle.includes(query) || item.answer.includes(query)).slice(0, 50);
  }
};
