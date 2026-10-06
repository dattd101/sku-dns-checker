import dns from 'node:dns/promises';
import net from 'node:net';
import type { GeoInfo } from './types';

function isPublicIp(ip:string){
  if(net.isIPv4(ip)){
    const p=ip.split('.').map(Number);
    return !(p[0]===10||p[0]===127||p[0]===0||p[0]===169&&p[1]===254||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&p[1]===168||p[0]>=224);
  }
  if(net.isIPv6(ip)){
    const x=ip.toLowerCase();
    return !(x==='::1'||x==='::'||x.startsWith('fc')||x.startsWith('fd')||x.startsWith('fe8')||x.startsWith('fe9')||x.startsWith('fea')||x.startsWith('feb'));
  }
  return false;
}

export async function resolveIp(input:string){
  const raw=input.trim();
  if(net.isIP(raw)) return raw;
  let host=raw;
  try { host=new URL(/^https?:\/\//i.test(raw)?raw:`https://${raw}`).hostname; } catch {}
  const all=await dns.lookup(host,{all:true,verbatim:true});
  const found=all.find(x=>isPublicIp(x.address));
  if(!found) throw new Error('Không tìm thấy public IP cho domain này');
  return found.address;
}

export async function lookupGeo(input:string):Promise<GeoInfo>{
  try{
    const ip=await resolveIp(input);
    if(!isPublicIp(ip)) return null;
    // Free, no-key fallback. Replace with a local MMDB reader later if desired.
    const res=await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`,{signal:AbortSignal.timeout(8000),cache:'no-store'});
    if(!res.ok) return null;
    const j:any=await res.json();
    if(j.success===false) return null;
    const connection=j.connection||{};
    return {
      ip:j.ip||ip,
      city:j.city||'',
      region:j.region||'',
      postal:j.postal||'',
      countryCode:j.country_code||'',
      country:j.country||'',
      latitude:typeof j.latitude==='number'?j.latitude:null,
      longitude:typeof j.longitude==='number'?j.longitude:null,
      isp:connection.isp||connection.org||'',
      asn:connection.asn?`AS${String(connection.asn).replace(/^AS/i,'')}`:'',
    };
  }catch{return null}
}
