import {createHash} from 'node:crypto';
import {getDatabase,migrateProjectSlugs,closeDatabase} from '../lib/crm/database.ts';

async function snapshot(){
  const projects=await getDatabase().prepare('SELECT id,name,description,start_date,end_date,published,created_by,created_at,updated_at FROM projects ORDER BY id').all();
  const images=await getDatabase().prepare("SELECT id,project_id,position,created_at,md5(encode(data,'hex')) AS hash FROM project_images ORDER BY id").all();
  return {projects:projects.length,images:images.length,hash:createHash('sha256').update(JSON.stringify({projects,images})).digest('hex')};
}
try{
  if(!process.env.DATABASE_URL)throw new Error('hosted_database_required');
  const before=await snapshot();
  console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'read-only',projects:before.projects,images:before.images}));
  if(process.argv.includes('--apply')){
    await migrateProjectSlugs();
    const after=await snapshot();
    const preserved=before.hash===after.hash;
    console.log(JSON.stringify({projects:after.projects,images:after.images,protectedDataUnchanged:preserved}));
    if(!preserved)throw new Error('concurrent_project_change_check_required');
    const result=await getDatabase().prepare('SELECT count(*) AS total,count(slug) AS assigned,count(DISTINCT slug) AS unique FROM projects').get();
    if(result.total!==result.assigned||result.total!==result.unique)throw new Error('incomplete_project_urls');
    console.log(JSON.stringify({projectUrls:result}));
  }
}catch(error){console.error('Project URL migration:',error.code||(/^[a-z_]+$/.test(error.message)?error.message:error.name));process.exitCode=1;}
finally{await closeDatabase();}
