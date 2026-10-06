export type LinkInfo={href:string;text:string,rel:string,internal:boolean};
export type AnalyzeReport={
 target:{input:string,url:string,hostname:string};
 http:{status:number,statusText:string,responseTimeMs:number,finalUrl:string,redirects:string[],headers:Record<string,string>,sizeBytes:number};
 seo:{title:string,titleLength:number,description:string,descriptionLength:number,canonical:string,robots:string,lang:string,headings:Record<string,string[]>,og:Record<string,string>,twitter:Record<string,string>,wordCount:number,score:number,issues:string[]};
 links:{total:number,internal:number,external:number,nofollow:number,items:LinkInfo[]};
 images:{total:number,missingAlt:number,items:{src:string,alt:string}[]};
 dns:{A:string[],AAAA:string[],MX:unknown[],NS:string[],TXT:string[],CNAME:string[],SOA:unknown|null,SPF:string|null,DMARC:string|null};
 ssl:{valid:boolean,authorized:boolean,authorizationError:string|null,protocol:string|null,subject:unknown,issuer:unknown,validFrom:string|null,validTo:string|null,fingerprint256:string|null,daysRemaining:number|null}|null;
 security:{https:boolean,headers:{name:string,value:string|null,ok:boolean}[]};
 robots:{url:string,status:number|null,content:string|null}; sitemap:{url:string,status:number|null,found:boolean};
};
