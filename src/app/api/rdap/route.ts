import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

type Bootstrap={services?:[string[],string[]][]};
const VN_2LD=new Set(['ac.vn','ai.vn','biz.vn','com.vn','edu.vn','gov.vn','health.vn','id.vn','info.vn','int.vn','io.vn','name.vn','net.vn','org.vn','pro.vn']);
const BKNS_DEMO='bkns_dmo_2376da23bd44858c8390aeeb93065404d21ede1ba2c5d59c0cffc33d6e83c2dd';

function cleanDomain(input:string){
  let v=input.trim().toLowerCase();
  try{if(v.includes('://'))v=new URL(v).hostname}catch{}
  v=v.replace(/^www\./,'').replace(/^\.+|\.+$/g,'');
  if(!v||v.length>253||!v.includes('.')||!/^[a-z0-9.-]+$/i.test(v))throw new Error('Tên miền không hợp lệ');
  return v;
}
function registeredDomain(host:string){
  const p=host.split('.').filter(Boolean);
  if(p.length<2)return host;
  if(p[p.length-1]==='vn'){
    const suffix=p.slice(-2).join('.');
    return VN_2LD.has(suffix)&&p.length>=3?p.slice(-3).join('.'):p.slice(-2).join('.');
  }
  return p.slice(-2).join('.');
}
function eventDate(events:any[],action:string){return events?.find((x:any)=>x?.eventAction===action)?.eventDate||null}
function cardValue(v:any,key:string){if(!Array.isArray(v))return null;const rows=v[1];if(!Array.isArray(rows))return null;const row=rows.find((x:any)=>Array.isArray(x)&&x[0]===key);return row?.[3]??null}
function entityName(e:any){return cardValue(e?.vcardArray,'fn')||cardValue(e?.vcardArray,'org')||e?.handle||null}
function entityEmail(e:any){return cardValue(e?.vcardArray,'email')||''}

async function vnWhois(domain:string){
  const key=process.env.BKNS_WHOIS_API_KEY||BKNS_DEMO;
  const r=await fetch(`https://whois.bkns.vn/api/v1/whois?domain=${encodeURIComponent(domain)}`,{
    headers:{accept:'application/json','X-API-Key':key,'user-agent':'Sku Domain Checker/1.0'},cache:'no-store',signal:AbortSignal.timeout(12000)
  });
  if(r.status===429)throw new Error('Dịch vụ tra cứu .VN đang giới hạn lượt truy vấn. Vui lòng thử lại sau.');
  if(!r.ok)throw new Error(`Không thể lấy thông tin tên miền .VN (HTTP ${r.status})`);
  const j=await r.json();
  if(j.status!=='registered'&&j.status!=='pending'){
    return {mode:'whois',source:'WHOIS .VN',domain:j.domain||domain,registered:false,availability:j.status||'unknown',registrant:null,registrar:null,created:null,updated:null,expires:null,status:[],nameservers:[],dnssec:null,entities:[],raw:null};
  }
  const x=j.data||{};
  return {
    mode:'whois',source:'WHOIS .VN',domain:j.domain||domain,registered:true,availability:j.status,
    registrant:x.registrant?.name||null,registrar:x.registrar?.name||null,registrarIanaId:null,
    created:x.dates?.created||null,updated:x.dates?.updated||null,expires:x.dates?.expiry||null,
    status:x.domainStatus||[],nameservers:x.nameservers||[],dnssec:typeof x.dnssec==='boolean'?x.dnssec:null,
    entities:[],raw:null
  };
}
async function rdapBase(domain:string){
  const tld=domain.split('.').pop()!;
  const r=await fetch('https://data.iana.org/rdap/dns.json',{cache:'force-cache',next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('Không tải được dữ liệu tra cứu tên miền');
  const b:Bootstrap=await r.json();
  for(const service of b.services||[])if(service[0].some(x=>x.toLowerCase()===tld))return service[1][0]?.replace(/\/$/,'')||null;
  return null;
}
async function internationalWhois(domain:string){
  const base=await rdapBase(domain);
  if(!base)throw new Error('Chưa hỗ trợ tra cứu thông tin đăng ký cho đuôi tên miền này.');
  const r=await fetch(`${base}/domain/${encodeURIComponent(domain)}`,{headers:{accept:'application/rdap+json, application/json','user-agent':'Sku Domain Checker/1.0'},cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(12000)});
  if(r.status===404)return {mode:'rdap',source:'RDAP',domain,registered:false,availability:'available',registrant:null,registrar:null,created:null,updated:null,expires:null,status:[],nameservers:[],dnssec:null,entities:[],raw:null};
  if(!r.ok)throw new Error(`Không thể lấy thông tin tên miền (HTTP ${r.status})`);
  const raw=await r.json();
  const registrar=(raw.entities||[]).find((e:any)=>e?.roles?.includes('registrar'));
  const registrant=(raw.entities||[]).find((e:any)=>e?.roles?.includes('registrant'));
  const iana=(registrar?.publicIds||[]).find((x:any)=>String(x?.type||'').toLowerCase().includes('iana'))?.identifier||null;
  const entities=(raw.entities||[]).map((e:any)=>({Role:(e.roles||[]).join(', ')||'N/A',Name:entityName(e)||'N/A',Handle:e.handle||'',Email:entityEmail(e)}));
  const secure=raw.secureDNS?.delegationSigned;
  return {mode:'rdap',source:'RDAP',domain:raw.ldhName||domain,registered:true,availability:'registered',registrant:entityName(registrant),registrar:entityName(registrar),registrarIanaId:iana,created:eventDate(raw.events,'registration'),updated:eventDate(raw.events,'last changed'),expires:eventDate(raw.events,'expiration'),status:raw.status||[],nameservers:(raw.nameservers||[]).map((n:any)=>n.ldhName||n.unicodeName).filter(Boolean),dnssec:typeof secure==='boolean'?secure:null,entities,raw:null};
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const host=cleanDomain(String(body?.domain||''));
    const domain=registeredDomain(host);
    const result=domain.endsWith('.vn')?await vnWhois(domain):await internationalWhois(domain);
    return NextResponse.json({...result,query:host});
  }catch(e:any){return NextResponse.json({error:e?.message||'Không thể lấy thông tin tên miền lúc này.'},{status:400})}
}
