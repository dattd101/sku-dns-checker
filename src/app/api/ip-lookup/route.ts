import {NextRequest,NextResponse} from 'next/server';
import {isIP} from 'node:net';

export const runtime='nodejs';
const headers={'Cache-Control':'public, max-age=300, s-maxage=3600'};
function publicIp(ip:string){
  if(isIP(ip)===4){const [a,b,c]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===192&&b===0&&c===0||a===192&&b===0&&c===2||a===198&&b===51&&c===100||a===203&&b===0&&c===113||a===198&&[18,19].includes(b));}
  if(isIP(ip)===6){const s=ip.toLowerCase();return !(s==='::'||s==='::1'||s.startsWith('fc')||s.startsWith('fd')||/^fe[89ab]/.test(s)||s.startsWith('ff')||s.startsWith('2001:db8')||s.startsWith('::ffff:'));}
  return false;
}
function entityName(e:any):string{
  const v=e?.vcardArray?.[1];
  if(!Array.isArray(v))return '';
  const row=v.find((x:any)=>Array.isArray(x)&&x[0]==='fn');
  return typeof row?.[3]==='string'?row[3]:'';
}
export async function POST(req:NextRequest){
  try{
    const body=await req.json();const ip=typeof body?.ip==='string'?body.ip.trim():'';
    if(!isIP(ip)||!publicIp(ip))return NextResponse.json({error:'Vui lòng nhập địa chỉ IP công khai hợp lệ (IPv4 hoặc IPv6).'},{status:400});
    const [geoResult,rdapResult]=await Promise.allSettled([
      fetch(`https://ipwho.is/${encodeURIComponent(ip)}`,{signal:AbortSignal.timeout(8500),next:{revalidate:3600}}).then(async r=>{if(!r.ok)throw Error('GeoIP không phản hồi');return r.json()}),
      fetch(`https://rdap.org/ip/${encodeURIComponent(ip)}`,{signal:AbortSignal.timeout(8500),next:{revalidate:3600},headers:{accept:'application/rdap+json, application/json'}}).then(async r=>{if(!r.ok)throw Error('RDAP không phản hồi');return r.json()})
    ]);
    const g:any=geoResult.status==='fulfilled'&&geoResult.value?.success!==false?geoResult.value:null;
    const r:any=rdapResult.status==='fulfilled'?rdapResult.value:null;
    if(!g&&!r)return NextResponse.json({error:'Các dịch vụ tra cứu tạm thời không phản hồi. Vui lòng thử lại.'},{status:502});
    const roles=(r?.entities||[]).map((e:any)=>({name:entityName(e),roles:Array.isArray(e.roles)?e.roles:[]}));
    const registrant=roles.find((e:any)=>e.roles.includes('registrant'))?.name||'';
    const networkOwner=registrant||roles.find((e:any)=>e.roles.includes('administrative'))?.name||r?.name||'';
    return NextResponse.json({ip,isp:g?.connection?.isp||'',organization:g?.connection?.org||'',asn:g?.connection?.asn?`AS${String(g.connection.asn).replace(/^AS/i,'')}`:'',country:g?.country||'',countryCode:g?.country_code||'',region:g?.region||'',city:g?.city||'',latitude:g?.latitude??null,longitude:g?.longitude??null,networkName:r?.name||'',networkHandle:r?.handle||'',networkType:r?.type||'',startAddress:r?.startAddress||'',endAddress:r?.endAddress||'',networkOwner,rdapCountry:r?.country||'',rdapUrl:`https://rdap.org/ip/${encodeURIComponent(ip)}`,sources:{geo:!!g,rdap:!!r},notice:'Thông tin cho biết tổ chức quản lý mạng, không xác nhận đơn vị trực tiếp bán VPS.'},{headers});
  }catch{return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:400});}
}
