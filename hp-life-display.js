/* HP LIFE: trình xem ảnh riêng, không ảnh hưởng các tính năng khác. */
(()=>{'use strict';
const safe=/^certificates\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)$/;
let dialog,photo,heading,full,download;
function prepare(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='gdd-learning-dialog';
 dialog.setAttribute('aria-label','Xem chứng nhận HP LIFE');
 dialog.innerHTML='<div class="gdd-learning-dialog-inner"><div class="gdd-learning-dialog-header"><h3></h3><button type="button" class="gdd-learning-dialog-close" aria-label="Đóng">×</button></div><img class="gdd-learning-dialog-image" alt=""><div class="gdd-learning-dialog-actions"><a class="gdd-learning-full" target="_blank" rel="noopener noreferrer">Mở ảnh đầy đủ ↗</a><a class="gdd-learning-download" download>Tải ảnh chứng nhận ↓</a></div></div>';
 document.body.append(dialog);
 photo=dialog.querySelector('img');heading=dialog.querySelector('h3');full=dialog.querySelector('.gdd-learning-full');download=dialog.querySelector('.gdd-learning-download');
 dialog.querySelector('.gdd-learning-dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
document.addEventListener('click',e=>{
 let btn=e.target.closest?.('[data-gdd-cert-open]');if(!btn)return;
 let url=btn.getAttribute('data-gdd-cert-open');if(!url||!safe.test(url))return;
 e.preventDefault();prepare();
 const name=btn.getAttribute('data-gdd-cert-title')||'Chứng nhận HP LIFE';
 heading.textContent=name;photo.src=url;photo.alt='Chứng nhận '+name;full.href=url;download.href=url;
 if(typeof dialog.showModal==='function')dialog.showModal();else window.open(url,'_blank','noopener');
});
})();