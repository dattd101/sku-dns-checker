import {NextResponse} from 'next/server'; import {z} from 'zod'; import {analyze} from '@/lib/analyzer';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const Schema=z.object({url:z.string().min(1).max(2048)});
export async function POST(req:Request){try{const body=Schema.parse(await req.json());return NextResponse.json(await analyze(body.url))}catch(e:any){return NextResponse.json({error:e?.message||'Không thể phân tích URL'},{status:400})}}
