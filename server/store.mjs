import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
export function createStore(dir){
 mkdirSync(dir,{recursive:true});const db=new DatabaseSync(join(dir,'curelab.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, mission TEXT, type TEXT, body TEXT, created TEXT);');
 return {db,all:()=>db.prepare('SELECT body FROM state').all().map(r=>JSON.parse(r.body)),save:(s,type,payload={})=>{db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO state VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(s.id,JSON.stringify(s));db.prepare('INSERT INTO events(mission,type,body,created) VALUES(?,?,?,?)').run(s.id,type,JSON.stringify(payload),new Date().toISOString());db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}},events:id=>db.prepare('SELECT * FROM events WHERE mission=? ORDER BY seq').all(id).map(e=>({...e,body:JSON.parse(e.body)}))};
}
