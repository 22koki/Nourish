import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { workspaces } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
const recipeId=z.number().int().refine(id=>(id>=1&&id<=8)||(id>1000000&&id<2000000));
const safeHttps=z.string().max(2000).refine(s=>{try{return new URL(s).protocol==='https:'}catch{return false}});
const externalRecipe=z.object({id:z.number().int().min(1000001).max(1999999),name:z.string().min(1).max(300),subtitle:z.string().max(200),cuisine:z.string().max(100),category:z.string().max(50),time:z.null(),cost:z.null(),equipment:z.literal('Not provided'),diet:z.literal('Not assessed'),allergens:z.array(z.string()).max(0),image:z.string().max(2000).refine(s=>s===''||/^https:\/\/(www\.)?themealdb\.com\//.test(s)),ingredients:z.array(z.object({name:z.string().max(300),amount:z.null(),unit:z.literal(''),measure:z.string().max(300)})).min(1).max(20),steps:z.array(z.string().max(30000)).min(1).max(300),provider:z.literal('TheMealDB'),providerId:z.string().regex(/^\d{1,6}$/),sourceUrl:safeHttps,originalSource:safeHttps.optional(),videoUrl:safeHttps.optional(),licenseNote:z.string().max(200).optional()}).refine(r=>r.id===1000000+Number(r.providerId)&&r.sourceUrl==='https://www.themealdb.com/meal/'+r.providerId);
const meal=z.object({day:z.number().int().min(0).max(6),slot:z.enum(['Breakfast','Lunch','Dinner']),recipe:recipeId,servings:z.number().int().min(1).max(12)});
const workspaceSchema=z.object({external:z.array(externalRecipe).max(100).default([]),profile:z.object({name:z.string().max(60),country:z.string().max(80),currency:z.enum(['USD','EUR','GBP','KES','CAD','AUD','INR','ZAR']),factor:z.number().min(0.01).max(10000),budget:z.number().min(1).max(1000000),servings:z.number().int().min(1).max(12),diet:z.string().max(30),allergens:z.array(z.string().max(30)).max(20),equipment:z.enum(['Stovetop','No-cook']),maxTime:z.number().min(1).max(120),goal:z.string().max(200),onboarded:z.boolean()}),plan:z.array(meal).max(21),pantry:z.array(z.object({name:z.string().min(1).max(100),amount:z.string().max(100),expiry:z.string().max(20)})).max(500),checked:z.array(z.string().max(150)).max(500),favorites:z.array(recipeId).max(108),logs:z.array(z.object({id:z.string().max(100),date:z.string().max(50),recipe:z.string().max(200),status:z.enum(['Cooked','Changed','Skipped']),barrier:z.string().max(200)})).max(2000),clients:z.array(z.object({id:z.string().max(100),name:z.string().min(1).max(100),email:z.string().max(200),goal:z.string().max(200),notes:z.string().max(5000),plan:z.array(meal).max(21),status:z.enum(['Draft','Prepared'])})).max(200)});
export async function GET() {
 const user=await getChatGPTUser(); if(!user) return Response.json({error:'Sign in to access your workspace'},{status:401});
 const rows=await getDb().select().from(workspaces).where(eq(workspaces.userId,user.userId));
 return Response.json({data:rows[0]?JSON.parse(rows[0].data):null},{headers:{'Cache-Control':'no-store'}});
}
export async function PUT(req: Request) {
 const user=await getChatGPTUser(); if(!user) return Response.json({error:'Sign in required'},{status:401});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const raw=await req.text();if(raw.length>1500000)return Response.json({error:'Workspace too large'},{status:413});
 let data;try{data=JSON.parse(raw)}catch{return Response.json({error:'Invalid JSON'},{status:400})}
 const parsed=workspaceSchema.safeParse(data);if(!parsed.success) return Response.json({error:'Invalid workspace'},{status:400});
 const knownIds=new Set([1,2,3,4,5,6,7,8,...parsed.data.external.map(r=>r.id)]);if([...parsed.data.plan,...parsed.data.clients.flatMap(c=>c.plan)].some(p=>!knownIds.has(p.recipe))||parsed.data.favorites.some(id=>!knownIds.has(id)))return Response.json({error:'Unknown recipe reference'},{status:400});
 await getDb().insert(workspaces).values({userId:user.userId,data:JSON.stringify(parsed.data),updatedAt:Date.now()}).onConflictDoUpdate({target:workspaces.userId,set:{data:JSON.stringify(parsed.data),updatedAt:Date.now()}});
 return Response.json({saved:true});
}
export async function DELETE(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});await getDb().delete(workspaces).where(eq(workspaces.userId,user.userId));return Response.json({deleted:true})}
