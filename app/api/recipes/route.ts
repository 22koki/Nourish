import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { normalizeMeal,type MealDBRecord } from '../../recipe-source';
const cache=new Map<string,{expires:number;data:MealDBRecord[]}>();
async function request(path:string,key:string):Promise<MealDBRecord[]>{
 const cacheKey=key+':'+path,hit=cache.get(cacheKey);if(hit&&hit.expires>Date.now())return hit.data;
 const response=await fetch(`https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/${path}`,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('Recipe source unavailable');const data=await response.json() as {meals:MealDBRecord[]|null};const meals=Array.isArray(data.meals)?data.meals:[];
 if(cache.size>300)cache.clear();cache.set(cacheKey,{expires:Date.now()+15*60*1000,data:meals});return meals;
}
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to search recipes.'},{status:401});
 const url=new URL(req.url);const mode=url.searchParams.get('mode')||'ingredient';const query=(url.searchParams.get('q')||'chicken').trim();const page=Number(url.searchParams.get('page')||'0');
 if(!['ingredient','name','category'].includes(mode)||query.length<2||query.length>80||!Number.isInteger(page)||page<0||page>100)return Response.json({error:'Enter an ingredient or recipe name between 2 and 80 characters.'},{status:400});
 const vars=env as unknown as Record<string,string|undefined>;
 // Public commercial deployments must configure a licensed key. The current owner-private development project uses the documented test key.
 const key=vars.THEMEALDB_API_KEY||'1';
 try{
 const path=mode==='name'?'search.php?s='+encodeURIComponent(query):'filter.php?'+(mode==='category'?'c':'i')+'='+encodeURIComponent(query.replaceAll(' ','_'));
 const found=await request(path,key);const chunk=found.slice(page*8,page*8+8);const recipes=[];let failed=0;
 for(let n=0;n<chunk.length;n+=4){const group=await Promise.allSettled(chunk.slice(n,n+4).map(async m=>{const full=mode==='name'?m:(await request('lookup.php?i='+encodeURIComponent(m.idMeal||''),key))[0];return full?normalizeMeal(full):null}));for(const result of group){if(result.status==='fulfilled'&&result.value)recipes.push(result.value);else failed++}}
 return Response.json({recipes,total:found.length,page,hasMore:(page+1)*8<found.length,partial:failed>0,source:'TheMealDB',access:key==='1'?'development':'configured',nutritionAvailable:false},{headers:{'Cache-Control':'private, max-age=60'}});
 }catch{return Response.json({error:'The recipe database is temporarily unavailable. Your saved recipes still work. Please try again.'},{status:502})}
}
