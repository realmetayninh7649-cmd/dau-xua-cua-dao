/* DẤU XƯA CỬA ĐẠO — future image-display relay for already-published Supabase image URLs.
 * No live cutover while maintenance. Originals and admin editing always keep original URLs.
 * Existing album codes, QR links, captions, and watermark overlays remain unchanged.
 */
((root)=>{
  'use strict';
  const ENABLED=true; // Approved release: only previously published Supabase images use verified R2 WebP Worker.
  const SOURCE_ORIGIN='https://gwpdgubxoquhrfbolftq.supabase.co';
  const SOURCE_PREFIX='/storage/v1/object/public/dao-su-images/';
  const WORKER_PREFIX='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-preview/';
  const VALID=/^(?:documents|media|people|posts|videos|obituaries|memorials|radio|calendar-qui-vi)\/[A-Za-z0-9_.\/-]{1,110}$/;
  // Fixed allowlist: only 133 already-published document scans may expose a
  // separate stamped A4 print derivative. Never expose private source JPEGs.
  const PRINT_PATHS=new Set([
    "documents/1793751867587-m0vmt9onf.jpg",
    "documents/1793751871563-58c25058-631b-4f44-9e15-607de5056dc7.jpg",
    "documents/1793751872840-03cad3b7-f1af-44de-b301-fba2e02b3be4.jpg",
    "documents/1793751874787-cf680cf5-e311-41d1-b2d7-7e18ec7154a1.jpg",
    "documents/1793751875868-b3018c76-04f9-439f-93a0-027ded8db52a.jpg",
    "documents/1793841021301-1hfrwd4hf.jpg",
    "documents/1793841024293-7ae14460-3d75-4eef-8a25-954d83abd0d2.jpg",
    "documents/1793841026261-5ade7096-1752-4e0d-93fe-8fa4ed69cf95.jpg",
    "documents/1793841027978-dc31b3ab-341d-41fb-b196-393c748b68fd.jpg",
    "documents/1793841029950-af9158a7-5718-49d3-a3fa-978a6cab0e04.jpg",
    "documents/1793841030971-8f99af34-0f2e-400d-a7a8-9cc2dd5bb5c4.jpg",
    "documents/1793842074312-7dtknj1ps.jpg",
    "documents/1793842077512-44e161d0-f3a4-4203-84f5-71ec475e4a99.jpg",
    "documents/1793842079448-be082557-ac86-4158-9d0c-2810a1e67d0f.jpg",
    "documents/1793842080699-9a05451a-09df-46e2-b23e-7adcb6bbd4d9.jpg",
    "documents/1793842082420-1694ff29-5a98-446f-9419-b19d56770d7a.jpg",
    "documents/1793842084500-5297e5bb-be40-4596-8619-09f8f4327634.jpg",
    "documents/1793842085628-dd218e80-d6c9-4b37-960c-cd84d2c587c5.jpg",
    "documents/1793842086718-d92ce4a5-a7be-4df1-a87a-89bec9b4e96a.jpg",
    "documents/1793842087780-31f0b177-a354-482f-be2f-75db2bf3030f.jpg",
    "documents/1793842088793-38afc1c3-0096-4a6e-b4a6-1b79ddf10273.jpg",
    "documents/1793845052643-g7tkyqiop.jpg",
    "documents/1793845056096-3e69e2ca-0eb9-466a-b2d3-8eebf3b3a79b.jpg",
    "documents/1793845058056-d92d934c-86f4-462d-8808-2f6f78d0151b.jpg",
    "documents/1793845060312-502bc457-e2af-493f-bd04-5b93c1ea423c.jpg",
    "documents/1793845062563-d42c90a2-41d0-4ff3-9551-7724265632d5.jpg",
    "documents/1793845064815-ac35f771-4015-4d23-88a3-d680d1d65812.jpg",
    "documents/1793845066424-b7f75746-d666-4860-bbe1-ca20c3f0cc28.jpg",
    "documents/1794637687658-kztdtkeyr.jpg",
    "documents/1794637691049-0756d8e4-1632-429a-b328-378e56fa8ffa.jpg",
    "documents/1794684369975-j1fndpy7g.jpg",
    "documents/1794684459591-8x15czjc2.jpg",
    "documents/1794706540125-gyar5wqv5.jpg",
    "documents/1794706542677-c63b5309-792a-4aec-a0fa-031e87c3cd7b.jpg",
    "documents/1794706543702-a1b47e28-b8de-4185-a6a0-81e743cbd82e.jpg",
    "documents/1794706545031-53b287e5-f1ed-4e90-a448-10b9b0999905.jpg",
    "documents/1794706546380-30e9e12c-6286-4e63-a235-b06c74931bb1.jpg",
    "documents/1794706698790-act6j0dei.jpg",
    "documents/1794706943558-y6ijoguyq.jpg",
    "documents/1794706946030-8dafa2f1-1d39-4bfe-8480-5d8d97f635c7.jpg",
    "documents/1794706947054-9ea8bf56-ec7c-4b18-b443-183a550913c9.jpg",
    "documents/1794707018470-mord4uzd1.jpg",
    "documents/1794981843538-e74add98-69a7-499b-a95a-719cc6ac7de8-trace.jpg",
    "documents/1794981848810-8fa5fecd-d022-4f83-9ff3-8837ee5515e4-trace.jpg",
    "documents/1794981854640-e72ee92c-63d9-478f-a3c7-abfe5ea35467-trace.jpg",
    "documents/1794981859758-6d0b6460-7b78-4652-90e3-435632dd8e8c-trace.jpg",
    "documents/1794981866011-1a649897-caf9-46fd-88c6-e11940ede47c-trace.jpg",
    "documents/1794981870993-81980602-e15b-4ae0-a733-554734fe9ea7-trace.jpg",
    "documents/1794981876351-e8319fab-9ccc-4341-9df8-7091c001d809-trace.jpg",
    "documents/1794981881038-c2fc41ba-962e-445c-a128-684b924d01df-trace.jpg",
    "documents/1794981885592-7c38365f-8321-4522-a97e-d56788eb8dfd-trace.jpg",
    "documents/1794981890203-5b2ea53e-8ac4-48b6-9d2f-93ea7afb6fc3-trace.jpg",
    "documents/1794981894806-acd8a020-a74f-499e-86f3-f582bc986a39-trace.jpg",
    "documents/1794981901147-b552fa53-b61e-4a2b-ae04-bf1c374899d9-trace.jpg",
    "documents/1794981907202-0390818f-866a-4f5b-bc5b-6bdb9475a15c-trace.jpg",
    "documents/1794981912836-be012109-6f52-4f2f-b35e-767bdaf01442-trace.jpg",
    "documents/1794981918052-6a49bd9f-98d5-4d62-bc6b-42fd600706e9-trace.jpg",
    "documents/1794981922868-2ec73dfc-eba4-4d2c-b5fd-adcd54ded9d3-trace.jpg",
    "documents/1794981929992-bcc3eba6-3ea0-496a-950d-64847a57937f-trace.jpg",
    "documents/1794981940071-8ef3f9b6-5613-4e60-a46c-a99d80838c45-trace.jpg",
    "documents/1794981945703-39130cb3-4d27-4c9e-9ccc-3345f9cbd83a-trace.jpg",
    "documents/1794981949968-938fd3aa-cc29-45fc-9c9f-c4c95711dda0-trace.jpg",
    "documents/1794981954378-bcf0b4d0-4f34-41e0-ac00-08eb59c64e08-trace.jpg",
    "documents/1794981961760-62088881-7e60-4212-b704-5d9e44b9bee8-trace.jpg",
    "documents/1794981973037-095f2dbd-34d4-4953-83f7-ed315bca82a8-trace.jpg",
    "documents/1794981978755-35400373-9c90-4403-aef5-5d1bbae5afa0-trace.jpg",
    "documents/1794981983761-ca6bd7a4-f6e9-4ed8-bc56-b87e567808e6-trace.jpg",
    "documents/1794981989074-28139e94-ac4f-413f-b216-493fe6a8dfc8-trace.jpg",
    "documents/1794981993794-4fedb37c-4e9c-4e8e-a22f-9889df0c459a-trace.jpg",
    "documents/1794981998725-ea7e34c8-9d3c-4413-9b9f-387e686f43c7-trace.jpg",
    "documents/1794982003505-d9aa32ca-032c-485b-96e1-0aa909e2af1d-trace.jpg",
    "documents/1794982008973-5183cb4f-f2b7-4d21-8a3e-8f1c7c5e5a0e-trace.jpg",
    "documents/1794982014012-37117693-788e-42ac-8758-1221e5def73a-trace.jpg",
    "documents/1794982018828-6df67a21-e9a7-4dff-9649-75c7e3818952-trace.jpg",
    "documents/1794982148012-d15ac958-ce89-4b92-acf2-0ecf78237d06-trace.jpg",
    "documents/1794982884747-73693ea0-0201-4209-bec7-69b82954d848-trace.jpg",
    "documents/1794982893239-94b67b2f-481e-457e-a9e4-60e1422522e3-trace.jpg",
    "documents/1794982899166-3d3df85b-ed71-4edd-a5ba-75e5c6febe89-trace.jpg",
    "documents/1794982905735-68c2a4e7-5101-4c25-bbb2-7b26bc915418-trace.jpg",
    "documents/1794982911890-dda07d6c-7cdf-40ba-9b40-0c0568ad5632-trace.jpg",
    "documents/1794982916376-605df1de-02c0-4f52-b513-f12315d688c8-trace.jpg",
    "documents/1794983802098-b4f409f7-d7fd-420a-b3c2-1ea547e61357-trace.jpg",
    "documents/1794983809160-eef2bf65-d43b-454c-baf5-716a17cef936-trace.jpg",
    "documents/1794983809467-39ecd22b-7570-4a8d-97de-56f125027db7-trace.jpg",
    "documents/1794983813843-eb577777-26a4-4fab-8f61-b259471ed529-trace.jpg",
    "documents/1794983815265-1bb98239-3a35-449c-971c-bcde086e6a9f-trace.jpg",
    "documents/1794983818446-54b0f2af-35cc-48ef-96de-d26387619466-trace.jpg",
    "documents/1794983820131-dade841c-dfdb-47bd-880e-35a273e4f658-trace.jpg",
    "documents/1794983857188-6ba8024a-1782-4e03-88c1-242705567fe5-trace.jpg",
    "documents/1794985126609-d3b52bf0-8cce-4fa4-97f4-123abb6b7cff-trace.jpg",
    "documents/1794985134097-dc435123-e46a-44ce-bd81-4939a4500d9f-trace.jpg",
    "documents/1794985134727-2ca6fdfe-1cd7-4e82-8829-e95ee814b0b1-trace.jpg",
    "documents/1794985140433-726f146a-475a-4e52-93e4-c79a8fba5958-trace.jpg",
    "documents/1794985140762-c83a9677-9ec4-48cf-9ae6-79cb27dca167-trace.jpg",
    "documents/1794986118626-d6e7ba48-4ec3-451d-9c1d-8e9ff555f975-trace.jpg",
    "documents/1794986127544-b37bd840-5de4-49be-9045-c351ab1172dc-trace.jpg",
    "documents/1794986127795-ef585da3-bba2-456a-b8e1-2af14e62bc34-trace.jpg",
    "documents/1794986137775-26b8fbd7-797a-4149-a1d1-b4b88c9110d0-trace.jpg",
    "documents/1794986138018-54ca55f3-7959-4dbc-b023-e5c5a002c1c0-trace.jpg",
    "documents/1794986142291-0bb69822-38fc-4d2d-b0e2-8513b5e0e2f2-trace.jpg",
    "documents/1794986144134-b7d3430a-ded7-44ab-9723-0a383cb0308a-trace.jpg",
    "documents/1794986379031-aaa13a16-fcee-4369-b814-c1f886aad80d-trace.jpg",
    "documents/1794986385397-1922dd21-130c-4c5f-92e3-7bad3e020396-trace.jpg",
    "documents/1794986386706-0b1d0236-fd57-480f-8813-e020d4a2ae9c-trace.jpg",
    "documents/1794986784281-56333be7-68ca-4e22-83a6-b07f1e916c4e-trace.jpg",
    "documents/1794986791367-c707d0d9-7ae4-42b3-b81d-e676a9fea029-trace.jpg",
    "documents/1794986791678-443d84c2-a7e6-42e9-bd58-c9cab2c4de97-trace.jpg",
    "documents/1794986797906-5cf87134-354c-46c2-a0f7-ad3e88731d2d-trace.jpg",
    "documents/1794986798148-15ea8933-04b4-4139-8a9a-c6667cd887eb-trace.jpg",
    "documents/1794986802988-881ba3df-2317-4205-a9dd-cf5a771276b4-trace.jpg",
    "documents/1794986803587-a2dc616d-05db-4750-ab94-9fbd00fb6449-trace.jpg",
    "documents/1794986807674-9f9b6aab-72eb-4846-b13f-976fe3c941d9-trace.jpg",
    "documents/1794986809054-7adb857b-8449-4ac4-bec4-6475c0cc600d-trace.jpg",
    "documents/1794986813366-60757497-b8fe-4be4-b23b-576dba3e1989-trace.jpg",
    "documents/1794986813700-8bb2238b-8962-4999-9d95-406cd6f67c9f-trace.jpg",
    "documents/1794986817804-546ff94a-cf15-4089-81b2-01da6a03a712-trace.jpg",
    "documents/1794986818455-89411c57-e53e-43ba-9d17-01399d305eea-trace.jpg",
    "documents/1794986822373-c123d31b-e4ac-4f67-878a-0b10bb406c77-trace.jpg",
    "documents/1794986824248-365ba961-1147-40ee-a46f-14ec8aa8d53f-trace.jpg",
    "documents/1794986828369-c8995c38-020e-4ec9-8854-934d290e36ca-trace.jpg",
    "documents/1794986828985-66a36e54-e16e-4414-993d-f20ec45ffd58-trace.jpg",
    "documents/1794986833625-863176bf-8e24-474c-8801-8be2284653e2-trace.jpg",
    "documents/1794986834564-3eeda8c9-1602-46d8-8543-86acc80e2dda-trace.jpg",
    "documents/1794986838204-abf57f13-ac7b-431d-8c8f-fcb76839d6b3-trace.jpg",
    "documents/1794986839691-391b043d-21f7-4178-815a-b2f26831577f-trace.jpg",
    "documents/1794987053321-0de561ad-3745-4e71-acd4-c027291a7df9-trace.jpg",
    "documents/1794987299873-ed89e97c-ce2a-436d-9953-d7855e64a1c2-trace.jpg",
    "documents/1794987307692-28329c2c-87b0-46e6-8831-94fc11f5507f-trace.jpg",
    "documents/1794987310022-29068edf-5c2a-4bf3-b5e4-ce0873d4d42f-trace.jpg",
    "documents/1794987314457-9340698b-518f-43b1-9aa2-37db0bb56b67-trace.jpg",
    "documents/1794987514314-b04bdc2f-fb5b-4f51-8513-aac6c17aab42-trace.jpg",
    "documents/1794987521912-be72dd0c-340a-4c3b-aedc-c22e45e32376-trace.jpg",
    "documents/1794987523011-d8d55f5b-bbbe-4166-a3a1-648cfcf58e49-trace.jpg"
  ]);
  const PRINT_ENABLED=true; // 133/133 built, R2 Worker deployed, live privacy smoke passed 2026-11-19.
  function candidate(original){
    if(typeof original!=='string'||original.length>800)return '';
    let url;
    try{url=new URL(original)}catch{return ''}
    if(url.origin!==SOURCE_ORIGIN || url.protocol!=='https:' ||
      !url.pathname.startsWith(SOURCE_PREFIX) || url.username||url.password||
      url.search||url.hash)return '';
    const tail=url.pathname.slice(SOURCE_PREFIX.length);
    let path;
    try{path=decodeURIComponent(tail)}catch{return ''}
    if(!VALID.test(path)||path.split('/').includes('..')||path.split('/').includes('.'))return '';
    // Worker enforces the authoritative 700-path published allowlist too.
    return WORKER_PREFIX+path+'.webp';
  }
  function printUrl(original){
    // R2-published documentary scans use a higher-resolution approved JPEG,
    // never the archival original object.
    if(window.GDDPrivatePublishing?.isPreviewURL?.(original)){
      const id=String(original).split('/').at(-2);
      return window.GDDPrivatePublishing.printUrl(id);
    }
    if(!PRINT_ENABLED)return String(original||'');
    let url;
    try{url=new URL(String(original||''))}catch{return String(original||'')}
    if(url.origin!==SOURCE_ORIGIN||url.protocol!=='https:'||url.username||url.password||
       url.search||url.hash||!url.pathname.startsWith(SOURCE_PREFIX))return String(original||'');
    let path;
    try{path=decodeURIComponent(url.pathname.slice(SOURCE_PREFIX.length))}catch{return String(original||'')}
    if(!PRINT_PATHS.has(path))return String(original||'');
    return 'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-print/'+path+'.jpg';
  }
  const api=Object.freeze({
    enabled:ENABLED,
    candidate,
    printUrl,
    displayUrl(original){
      return ENABLED?(candidate(original)||original):original;
    }
  });
  root.GDDLegacyImages=api;
})(typeof window==='object'?window:globalThis);
