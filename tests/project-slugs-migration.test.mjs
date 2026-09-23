import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('slug backfill keeps existing project records and images and stays idempotent',async()=>{
  const db=new PGlite();
  try{
    for(const path of ['202609090001_crm.sql','202609150001_projects.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+path,import.meta.url),'utf8'));
    await db.exec("INSERT INTO asir_crm.users(id,email,name,password_hash,created_at) VALUES('test','test@example.invalid','Test','not-a-real-hash','2026-09-01')");
    await db.exec("INSERT INTO asir_crm.projects(id,name,description,start_date,created_by,created_at,updated_at) VALUES ('one','Çatı GES','existing description','2026-09-01','test','2026-09-01','2026-09-01'),('two','Çatı GES','other description','2026-09-01','test','2026-09-02','2026-09-02')");
    await db.exec("INSERT INTO asir_crm.project_images VALUES('image','one',decode('1234','hex'),0,'2026-09-01')");
    const before=await db.query('SELECT * FROM asir_crm.projects ORDER BY id');
    const images=await db.query('SELECT * FROM asir_crm.project_images');
    const migration=await readFile(new URL('../supabase/migrations/202609230002_project_slugs.sql',import.meta.url),'utf8');
    await db.exec(migration);await db.exec(migration);
    const after=await db.query('SELECT * FROM asir_crm.projects ORDER BY id');
    assert.deepEqual(after.rows.map(row=>Object.fromEntries(Object.entries(row).filter(([key])=>key!=='slug'))),before.rows);
    assert.deepEqual(after.rows.map(row=>row.slug),['cati-ges','cati-ges-2']);
    assert.deepEqual((await db.query('SELECT * FROM asir_crm.project_images')).rows,images.rows);
  }finally{await db.close();}
});
