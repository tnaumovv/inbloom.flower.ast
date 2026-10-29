import { describe, expect, it, vi } from 'vitest';
import { parseSheet } from '@/features/catalog/parse-sheet';
import { createCatalogLoader } from '@/features/catalog/sheets';
const headers=['ID','Название','Цена','Фото','Описание','Состав','Показывать','Порядок','Категория'];
const row=['rose','Розы',15000,'https://images.example.com/rose.webp','Описание','Роза — 5 шт.; Эвкалипт — 1 шт.',true,2,'Розы'];
describe('catalogue sheet boundary',()=>{
 it('reads numeric prices, checkbox visibility and composition',()=>{const [p]=parseSheet([headers,row]);expect(p).toMatchObject({id:'rose',slug:'rose',name:'Розы',priceKzt:15000,category:'Розы',composition:['Роза — 5 шт.','Эвкалипт — 1 шт.']});});
 it('supports reordered columns and formatted space separators',()=>{expect(parseSheet([['Цена','Фото','Показывать','Название','ID'],['15 700 ₸','/images/catalogue/a.webp','ДА','Букет','a']])[0].priceKzt).toBe(15700)});
 it.each(['',0,-1,'договорная','12,50','1e5','15₸700','1₸2₸',Infinity])('rejects bad active price %s',price=>{const r=[...row];r[2]=price as string;expect(()=>parseSheet([headers,r])).toThrow(/строка 2/i)});
 it('skips incomplete drafts and allows intentionally empty catalogues',()=>{expect(parseSheet([headers,['draft','','','','','','FALSE']])).toEqual([]);expect(parseSheet([headers])).toEqual([])});
 it('rejects duplicate IDs and missing/duplicate headers',()=>{expect(()=>parseSheet([headers,row,row])).toThrow(/ID/);expect(()=>parseSheet([['ID'],['a']])).toThrow();expect(()=>parseSheet([['ID','ID']])).toThrow()});
 it.each(['javascript:alert(1)','http://example.com/x.jpg','//example.com/a.jpg','/images/../secret','https://user:pass@evil.com/x.jpg'])('rejects unsafe image %s',image=>{const r=[...row];r[3]=image;expect(()=>parseSheet([headers,r])).toThrow()});
 it('sorts explicit order and does not require a made-up category',()=>{const a=[...row],b=[...row];a[0]='a';a[7]=8;b[0]='b';b[7]=1;b[8]='';expect(parseSheet([headers,a,b]).map(p=>p.id)).toEqual(['b','a'])});
});
describe('live catalogue loader',()=>{
 it('uses clearly identified preview only when completely unconfigured',async()=>{const get=createCatalogLoader({env:{}});expect(await get()).toMatchObject({source:'preview',status:'ok'});expect((await get()).bouquets).toHaveLength(24)});
 it('fails closed on partial config',async()=>{expect(await createCatalogLoader({env:{GOOGLE_SHEET_ID:'abc'}})()).toMatchObject({status:'unavailable',bouquets:[]})});
 it('deduplicates requests, expires cache and bypasses network caches',async()=>{let now=0;const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({values:[headers,row]})));const get=createCatalogLoader({env:{GOOGLE_SHEET_ID:'abc',GOOGLE_SHEETS_API_KEY:'test'},fetcher,now:()=>now});await Promise.all([get(),get()]);expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][1]).toMatchObject({cache:'no-store'});now=2001;await get();expect(fetcher).toHaveBeenCalledTimes(2)});
 it('does not substitute fixtures on Google or validation failure',async()=>{for(const response of [new Response('denied',{status:403}),new Response(JSON.stringify({values:[headers,[...row.slice(0,2),0,...row.slice(3)]]}))]){const get=createCatalogLoader({env:{GOOGLE_SHEET_ID:'abc',GOOGLE_SHEETS_API_KEY:'test'},fetcher:async()=>response});expect(await get()).toMatchObject({source:'sheets',status:'unavailable',bouquets:[]})}});
 it('changes revision when a price changes and removes hidden products',async()=>{let now=0;let values=[headers,row];const get=createCatalogLoader({env:{GOOGLE_SHEET_ID:'abc',GOOGLE_SHEETS_API_KEY:'test'},fetcher:async()=>new Response(JSON.stringify({values})),now:()=>now});const first=await get();now=2100;values=[headers,[...row.slice(0,2),17000,...row.slice(3)]];const next=await get();expect(next.bouquets[0].priceKzt).toBe(17000);expect(next.revision).not.toBe(first.revision);now=4200;values=[headers,[...row.slice(0,6),false,...row.slice(7)]];expect((await get()).bouquets).toEqual([])});
});
