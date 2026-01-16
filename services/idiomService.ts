
import { Idiom, JielongResponse } from "../types";

// import { cacheService } from "./cacheService";

// const DB_URL = "https://raw.githubusercontent.com/by-syk/chinese-idiom-db/master/chinese-idioms-12976.db";
// const WASM_URL = "./sql-wasm.wasm";

const  dbFileUrl = "/data/chinese-idioms-12976.db";
const  sqlWasmUrl = "/data/sql-wasm.wasm";

let db: any = null;

export const idiomService = {
  async init(forceRefresh = false): Promise<void> {
    if (db && !forceRefresh) return;
    
    // @ts-ignore
    const initSqlJs = window.initSqlJs;
    const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });

    // let buffer: ArrayBuffer | null = forceRefresh ? null : await cacheService.getItem('idiom_db_buffer');
    let buffer: ArrayBuffer | null;

    // if (!buffer) {
      const res = await fetch(dbFileUrl);
      if (!res.ok) throw new Error("数据库下载失败");
      buffer = await res.arrayBuffer();
      // await cacheService.setItem('idiom_db_buffer', buffer);
    // }

    db = new SQL.Database(new Uint8Array(buffer as ArrayBuffer));
  },

  mapRowToIdiom(row: any[], columns: string[]): Idiom {
    const getVal = (col: string) => {
      const idx = columns.indexOf(col);
      return idx !== -1 ? row[idx] : "";
    };
    const word = `${getVal('char1')}${getVal('char2')}${getVal('char3')}${getVal('char4')}`;
    const pinyin = `${getVal('py1')} ${getVal('py2')} ${getVal('py3')} ${getVal('py4')}`.trim();
    return {
      word,
      pinyin,
      explanation: getVal('mean') || "暂无解释",
      derivation: getVal('source') || "暂无典故",
      example: getVal('example') || ""
    };
  },

  async getIdiom(word: string): Promise<Idiom | null> {
    if (!db) await this.init();
    const chars = Array.from(word);
    if (chars.length !== 4) return null;
    const result = db.exec("SELECT * FROM idiom WHERE char1=? AND char2=? AND char3=? AND char4=?", [chars[0], chars[1], chars[2], chars[3]]);
    if (result.length > 0 && result[0].values.length > 0) return this.mapRowToIdiom(result[0].values[0], result[0].columns);
    return null;
  },

  async getRandomIdioms(count: number = 5): Promise<string[]> {
    if (!db) await this.init();
    try {
      const result = db.exec(`SELECT char1, char2, char3, char4 FROM idiom ORDER BY RANDOM() LIMIT ${count}`);
      if (result.length === 0 || result[0].values.length === 0) return [];
      return result[0].values.map((row: any[]) => row.join(''));
    } catch (e) { return []; }
  },

  async getSuggestions(input: string, startChar?: string): Promise<string[]> {
    if (!db) await this.init();
    const chars = Array.from(input);
    let query = "SELECT char1, char2, char3, char4 FROM idiom WHERE 1=1";
    const params: string[] = [];
    if (startChar) { query += " AND char1 = ?"; params.push(startChar); }
    const isInputIncludingStart = startChar && chars[0] === startChar;
    chars.forEach((char, index) => {
      let pos = startChar ? (isInputIncludingStart ? (index + 1) : (index + 2)) : index + 1;
      if (pos === 1 && startChar) return;
      if (pos <= 4 && char) { query += ` AND char${pos} = ?`; params.push(char); }
    });
    query += " LIMIT 10";
    console.log("sql:", query);
    try {
      const result = db.exec(query, params);
      console.log("---> sql:result", result);
      if (result.length === 0 || result[0].values.length === 0) return [];
      return result[0].values.map((row: any[]) => row.join(''));
    } catch (e) { return []; }
  },

  async validateAndNext(userWord: string, lastWord?: string): Promise<JielongResponse> {
    if (!db) await this.init();
    const chars = Array.from(userWord);
    if (chars.length !== 4) return { isValid: false, message: "请输入四字成语哦" };
    if (lastWord) {
      const lastChar = Array.from(lastWord).pop();
      if (lastChar !== chars[0]) return { isValid: false, message: `应该以“${lastChar}”开头哦` };
    }
    const userResult = db.exec("SELECT * FROM idiom WHERE char1=? AND char2=? AND char3=? AND char4=?", [chars[0], chars[1], chars[2], chars[3]]);
    if (userResult.length === 0 || userResult[0].values.length === 0) return { isValid: false, message: "未在辞海中查到此成语" };
    const userIdiom = this.mapRowToIdiom(userResult[0].values[0], userResult[0].columns);
    const aiResult = db.exec("SELECT * FROM idiom WHERE char1=? ORDER BY RANDOM() LIMIT 1", [chars[3]]);
    if (aiResult.length === 0 || aiResult[0].values.length === 0) return { isValid: true, userIdiom, message: "夫子才疏学浅，接不上啦！你赢了！" };
    const aiIdiom = this.mapRowToIdiom(aiResult[0].values[0], aiResult[0].columns);
    return { isValid: true, userIdiom, aiIdiom };
  }
};
