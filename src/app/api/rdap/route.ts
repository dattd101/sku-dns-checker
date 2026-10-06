import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

type Bootstrap={services?:[string[],string[]][]};

function cleanDomain(input:string){
  let v=input.trim().toLowerCase();
  try{if(v.includes('://'))v=new URL(v).hostname}catch{}
  v=v.replace(/^\.+|\.+$/g,'');
  if(!v || v.length>253 || !v.includes('.') || !/^[a-z0-9.-]+$/i.test(v)) throw new Error('Domain không hợp lệ');
  return v;
}
function eventDate(events:any[],action:string){return events?.find((x:any)=>x?.eventAction===action)?.eventDate||null}
function cardValue(v:any,key:string){
  if(!Array.isArray(v))return null;
  const rows=v[1]; if(!Array.isArray(rows))return null;
  const row=rows.find((x:any)=>Array.isArray(x)&&x[0]===key); return row?.[3]??null;
}
function entityName(e:any){return cardValue(e?.vcardArray,'fn')||cardValue(e?.vcardArray,'org')||e?.handle||'N/A'}
function entityEmail(e:any){return cardValue(e?.vcardArray,'email')||''}

async function rdapBase(domain:string){
  const tld=domain.split('.').pop()!;
  const r=await fetch('https://data.iana.org/rdap/dns.json',{cache:'force-cache',next:{revalidate:86400}});
  if(!r.ok)throw new Error('Không tải được RDAP bootstrap của IANA');
  const b:Bootstrap=await r.json();
  for(const service of b.services||[]){
    if(service[0].some(x=>x.toLowerCase()===tld)) return service[1][0]?.replace(/\/$/,'');
  }
  throw new Error(`Không tìm thấy RDAP server cho .${tld}`);
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const domain=cleanDomain(String(body?.domain||''));
    const base=await rdapBase(domain);
    const url=`${base}/domain/${encodeURIComponent(domain)}`;
    const r=await fetch(url,{headers:{accept:'application/rdap+json, application/json','user-agent':'Sku Domain Checker/1.0'},cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(12000)});
    if(r.status===404)return NextResponse.json({error:'Không tìm thấy thông tin RDAP cho domain này'},{status:404});
    if(!r.ok)throw new Error(`RDAP server trả về HTTP ${r.status}`);
    const raw=await r.json();
    const registrar=(raw.entities||[]).find((e:any)=>e?.roles?.includes('registrar'));
    const iana=(registrar?.publicIds||[]).find((x:any)=>String(x?.type||'').toLowerCase().includes('iana'))?.identifier||null;
    const entities=(raw.entities||[]).map((e:any)=>({
      Role:(e.roles||[]).join(', ')||'N/A',
      Name:entityName(e),
      Handle:e.handle||'',
      Email:entityEmail(e)
    }));
    return NextResponse.json({
      domain:raw.ldhName||domain,
      unicodeName:raw.unicodeName||null,
      handle:raw.handle||null,
      status:raw.status||[],
      registrar:registrar?entityName(registrar):null,
      registrarIanaId:iana,
      created:eventDate(raw.events,'registration'),
      updated:eventDate(raw.events,'last changed'),
      expires:eventDate(raw.events,'expiration'),
      nameservers:(raw.nameservers||[]).map((n:any)=>n.ldhName||n.unicodeName).filter(Boolean),
      entities,
      rdapServer:new URL(r.url).origin,
      raw
    });
  }catch(e:any){return NextResponse.json({error:e?.message||'RDAP lookup thất bại'},{status:400})}
}
