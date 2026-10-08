import type { Ingredient,Recipe } from './recipes';
export type MealDBRecord=Record<string,string|null>;
const allowedURL=(value:string|null|undefined,hosts?:string[])=>{try{const u=new URL(value||'');return u.protocol==='https:'&&(!hosts||hosts.includes(u.hostname))?u.href:undefined}catch{return undefined}};
export function normalizeMeal(record:MealDBRecord):Recipe|null{
 const id=Number(record.idMeal);if(!Number.isInteger(id)||id<1||id>999999||!record.strMeal?.trim()||!record.strInstructions?.trim())return null;
 const ingredients:Ingredient[]=[];for(let n=1;n<=20;n++){const name=record['strIngredient'+n]?.trim();if(name)ingredients.push({name,amount:null,unit:'',measure:record['strMeasure'+n]?.trim()||''})}
 if(!ingredients.length)return null;
 return {id:1000000+id,name:record.strMeal.trim(),subtitle:record.strCategory||'Recipe discovery',cuisine:record.strArea||'Cuisine not provided',category:record.strCategory==='Breakfast'?'Breakfast':'Dinner',time:null,cost:null,equipment:'Not provided',diet:'Not assessed',allergens:[],image:allowedURL(record.strMealThumb,['www.themealdb.com','themealdb.com'])||'',ingredients,steps:record.strInstructions.trim().split(/\r?\n+/).filter(Boolean),provider:'TheMealDB',providerId:String(id),sourceUrl:'https://www.themealdb.com/meal/'+id,originalSource:allowedURL(record.strSource),videoUrl:allowedURL(record.strYoutube,['www.youtube.com','youtube.com','youtu.be']),licenseNote:record.strCreativeCommonsConfirmed||undefined};
}
export function canonicalIngredient(value:string){
 let s=value.toLowerCase().trim().replace(/_/g,' ').replace(/\s+/g,' ');
 const aliases:Record<string,string>={'eggs':'egg','chicken breasts':'chicken breast','chickpeas':'chickpea','garbanzo beans':'chickpea','tomatoes':'tomato','potatoes':'potato','onions':'onion','carrots':'carrot','scallions':'spring onion','spring onions':'spring onion','cilantro':'coriander','bell peppers':'bell pepper','capsicum':'bell pepper'};
 s=aliases[s]||s;return s;
}
export function ingredientMatches(needed:string,owned:string){const a=canonicalIngredient(needed),b=canonicalIngredient(owned);if(a===b)return true;if(b==='chicken'&&/^(chicken (breast|thigh|wing|leg|drumstick)s?|boneless chicken|whole chicken)$/.test(a))return true;return false}
export function pantryCoverage(recipe:Recipe,pantry:string[]){const available=recipe.ingredients.filter(i=>pantry.some(p=>ingredientMatches(i.name,p)));const missing=recipe.ingredients.filter(i=>!pantry.some(p=>ingredientMatches(i.name,p)));return {available,missing}}
export function quantityText(i:Ingredient,servings=1){return i.amount===null?(i.measure||'Quantity not provided'):`${+(i.amount*servings).toFixed(2)} ${i.unit}`.trim()}
export function timeText(r:Recipe){return r.time===null?'Time not provided':r.time+' min'}
