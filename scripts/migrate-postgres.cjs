require('@next/env').loadEnvConfig(process.cwd());
const fs=require('fs');const {Client}=require('pg');const Database=require('better-sqlite3');
const c=new Client({connectionString:(process.env.SUPABASE_DATABASE_ADMIN_URL || process.env.SUPABASE_DATABASE_URL),ssl:{rejectUnauthorized:true,ca:fs.readFileSync('config/supabase-ca.crt','utf8')}});
(async()=>{let source;try{
 await c.connect();const url=new URL((process.env.SUPABASE_DATABASE_ADMIN_URL || process.env.SUPABASE_DATABASE_URL));if(!url.username.endsWith('uwpxtkvjolxupkccfoif'))throw new Error('Unexpected target project');
 const exists=await c.query("select schema_name from information_schema.schemata where schema_name='gratitude'");if(exists.rowCount)throw new Error('Target schema already exists; refusing to overwrite');
 source=new Database('.data/backups/pre-supabase.sqlite',{readonly:true});
 await c.query('BEGIN');
 const ddl=fs.readFileSync('supabase/migrations/202609120001_gratitude.sql','utf8');
 // Create tables, copy all rows, then validate all foreign keys.
 const lines=ddl.split('\n'), constraints=lines.filter(l=>l.startsWith('ALTER TABLE')&&l.includes('ADD FOREIGN KEY'));
 await c.query(lines.filter(l=>!constraints.includes(l)).join('\n'));
 await c.query('ALTER TABLE gratitude.auth_sessions DISABLE TRIGGER track_gratitude_login');
 const tables=source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 let total=0;
 for(const {name} of tables){const rows=source.prepare(`SELECT * FROM "${name}"`).all();for(const row of rows){const cols=Object.keys(row);await c.query(`INSERT INTO gratitude."${name}" (${cols.map(c=>'"'+c+'"').join(',')}) VALUES (${cols.map((_,i)=>'$'+(i+1)).join(',')})`,cols.map(k=>row[k]));}const count=await c.query(`SELECT count(*)::int n FROM gratitude."${name}"`);if(count.rows[0].n!==rows.length)throw new Error('Count mismatch');total+=rows.length;console.log(name+': '+rows.length+' rows verified');}
 await c.query(constraints.join('\n'));await c.query('ALTER TABLE gratitude.auth_sessions ENABLE TRIGGER track_gratitude_login');await c.query('COMMIT');console.log('Migration committed; '+total+' rows preserved.');
}catch(e){await c.query('ROLLBACK').catch(()=>{});console.error('Migration failed:',e.message);process.exitCode=1;}finally{source?.close();await c.end();}})();
