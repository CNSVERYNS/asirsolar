import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('public/fonts',{recursive:true});
for(const [remote,local] of [['AtkinsonHyperlegible-Bold.ttf','AtkinsonHyperlegible-Bold.ttf'],['OFL.txt','AtkinsonHyperlegible-LICENSE.txt']]){
 const response=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/atkinsonhyperlegible/${remote}`,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`Font source HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!bytes.length||bytes.length>500000)throw new Error('Unexpected font asset size');
 await writeFile(`public/fonts/${local}`,bytes);
 console.log(`${local}: ${bytes.length} bytes`);
}
