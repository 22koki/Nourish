import Nourish from './studio';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home(){ const user=await getChatGPTUser();return <Nourish userName={user?.fullName?.split(' ')[0]||'friend'} signedIn={!!user}/> }
