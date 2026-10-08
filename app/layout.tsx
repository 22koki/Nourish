import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Nourish — Good food. Real life.',description:'A thoughtful space to plan, shop, cook and build healthier habits. Your kitchen. Your culture. Your pace.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
