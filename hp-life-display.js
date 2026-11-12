/* HP LIFE: khung xem chứng nhận, không cung cấp tính năng tải từ giao diện. */
(()=>{'use strict';
const safe=/^certificates\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)$/;
let dialog,photo,heading;
function closeViewer(){
 if(!dialog)return;
 if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
}
function prepare(){
 if(dialog)return;
 dialog=document.createElement('dialog');
 dialog.className='gdd-learning-dialog';
 dialog.setAttribute('aria-label','Xem chứng nhận HP LIFE');
 dialog.innerHTML='<div class="gdd-learning-dialog-inner"><div class="gdd-learning-dialog-header"><h3></h3><button type="button" class="gdd-learning-dialog-close" aria-label="Đóng">×</button></div><div class="gdd-learning-dialog-image-wrap"><img class="gdd-learning-dialog-image" alt="" draggable="false"></div><p class="gdd-learning-view-only">Chứng nhận được hiển thị để tham khảo; website không cung cấp chức năng tải xuống.</p></div>';
 document.body.append(dialog);
 photo=dialog.querySelector('img');heading=dialog.querySelector('h3');
 dialog.querySelector('.gdd-learning-dialog-close').addEventListener('click',closeViewer);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeViewer()});
}
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('.gdd-learning-section [data-gdd-cert-open]');
 if(!btn)return;
 const url=btn.getAttribute('data-gdd-cert-open');if(!url||!safe.test(url))return;
 e.preventDefault();prepare();
 const name=btn.getAttribute('data-gdd-cert-title')||'Chứng nhận HP LIFE';
 heading.textContent=name;photo.src=url;photo.alt='Chứng nhận '+name;
 if(typeof dialog.showModal==='function')dialog.showModal();
 else if(typeof dialog.show==='function')dialog.show();
 else dialog.setAttribute('open','');
});
function isLearningImage(target){
 return !!target.closest?.('.gdd-learning-dialog-image-wrap, .gdd-learning-section .gdd-learning-badge-art img');
}
document.addEventListener('contextmenu',e=>{if(isLearningImage(e.target))e.preventDefault()});
document.addEventListener('dragstart',e=>{if(isLearningImage(e.target))e.preventDefault()});
})();