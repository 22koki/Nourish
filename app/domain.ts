import type { Recipe } from './recipes';
export type Meal={day:number;slot:string;recipe:number;servings:number};
export type Constraints={allergens:string[];equipment:string;maxTime:number;servings:number;factor:number;budget:number};
export function isEligible(recipe:Recipe,p:Constraints){return !recipe.provider&&recipe.time!==null&&recipe.cost!==null&&!recipe.allergens.some(a=>p.allergens.includes(a))&&(p.equipment!=='No-cook'||recipe.equipment==='No-cook')&&recipe.time<=p.maxTime}
export function buildWeek(recipes:Recipe[],p:Constraints):{plan:Meal[];error?:string}{
 const pool=recipes.filter(r=>isEligible(r,p));if(!pool.length)return {plan:[],error:'No meals match these restrictions yet. Adjust preferences or expand the recipe library.'};
 const plan:Meal[]=[];for(let d=0;d<7;d++)for(const slot of ['Breakfast','Lunch','Dinner']){const choices=pool.filter(r=>r.category===slot).sort((a,b)=>(a.cost??Infinity)-(b.cost??Infinity));if(!choices.length)continue;const r=choices[d%choices.length];plan.push({day:d,slot,recipe:r.id,servings:p.servings})}
 const cost=plan.reduce((a,m)=>a+recipes.find(r=>r.id===m.recipe)!.cost!*m.servings,0)*p.factor;
 if(cost>p.budget)return {plan:[],error:'This week exceeds your budget estimate. Increase the budget or build a smaller plan manually.'};return {plan};
}
export function ingredientList(plan:Meal[],recipes:Recipe[]){return Object.values(plan.reduce((all,p)=>{const recipe=recipes.find(r=>r.id===p.recipe);if(!recipe)return all;recipe.ingredients.forEach(i=>{const key=i.name+'|'+i.unit+(i.amount===null?'|'+recipe.id+'|'+(i.measure||''): '');if(!all[key])all[key]={...i,key,amount:i.amount===null?null:0,occurrences:0};if(i.amount!==null)all[key].amount=(all[key].amount||0)+i.amount*p.servings;all[key].occurrences++});return all},{} as Record<string,{name:string;amount:number|null;unit:string;measure?:string;key:string;occurrences:number}>))}
