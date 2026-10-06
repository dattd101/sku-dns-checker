import {NextRequest,NextResponse} from 'next/server';
import {lookupGeo} from '@/lib/analyzer/geo';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{
    const {target}=await req.json();
    if(!target||typeof target!=='string') return NextResponse.json({error:'Thiếu IP hoặc domain'},{status:400});
    const geo=await lookupGeo(target);
    if(!geo) return NextResponse.json({error:'Không lấy được dữ liệu GeoIP'},{status:404});
    return NextResponse.json(geo);
  }catch(e:any){return NextResponse.json({error:e?.message||'GeoIP lookup thất bại'},{status:400})}
}
