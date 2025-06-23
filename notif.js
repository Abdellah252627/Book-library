// دوال الإشعارات
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

function getNotifs() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  const allNotifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  return allNotifs.filter(notif => notif.userEmail === currentUser.email);
}

function addNotif(text, type = 'info', link = null) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const notifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  notifs.unshift({
    id: Date.now(),
    text: text,
    type: type,
    link: link,
    date: new Date().toISOString(),
    read: false,
    userEmail: currentUser.email
  });
  localStorage.setItem('centerNotifs', JSON.stringify(notifs));
  updateNotifUI();
}

function addNotifForUser(userEmail, text, type = 'info', link = null) {
  if (!userEmail) return;
  
  const notifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  notifs.unshift({
    id: Date.now(),
    text: text,
    type: type,
    link: link,
    date: new Date().toISOString(),
    read: false,
    userEmail: userEmail
  });
  localStorage.setItem('centerNotifs', JSON.stringify(notifs));
}

function clearNotifs() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const allNotifs = JSON.parse(localStorage.getItem('centerNotifs') || '[]');
  const updatedNotifs = allNotifs.map(notif => {
    if (notif.userEmail === currentUser.email) {
      notif.read = true;
    }
    return notif;
  });
  
  localStorage.setItem('centerNotifs', JSON.stringify(updatedNotifs));
  updateNotifUI();
}

function updateNotifUI() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const notifs = getNotifs();
  const unreadNotifs = notifs.filter(notif => !notif.read);
  
  // تحديث عداد الإشعارات
  const countSpan = document.getElementById('notif-center-count');
  if (countSpan) {
    if (unreadNotifs.length > 0) {
      countSpan.textContent = unreadNotifs.length > 99 ? '99+' : unreadNotifs.length;
      countSpan.style.display = 'inline-block';
    } else {
      countSpan.style.display = 'none';
    }
  }
  
  // تحديث قائمة الإشعارات
  const listDiv = document.getElementById('notif-center-list');
  if (listDiv) {
    if (notifs.length === 0) {
      listDiv.innerHTML = '<div style="padding:1rem;color:#888;text-align:center;">لا توجد إشعارات</div>';
    } else {
      listDiv.innerHTML = notifs.slice(0, 10).map(notif => `
        <div style="padding:0.8rem;border-bottom:1px solid #f0f0f0;${!notif.read ? 'background:#f8f9fa;' : ''}">
          <div style="font-size:0.9rem;color:#666;">${new Date(notif.date).toLocaleDateString('ar-SA')}</div>
          <div style="margin-top:0.3rem;">${notif.text}</div>
          ${notif.link ? `<a href="${notif.link}" style="color:#b8860b;font-size:0.9rem;">عرض التفاصيل</a>` : ''}
        </div>
      `).join('');
    }
  }
}

// إظهار/إخفاء قائمة الإشعارات
const notifBtn = document.getElementById('notif-center-btn');
const notifList = document.getElementById('notif-center-list');

if (notifBtn && notifList) {
  notifBtn.onclick = function(e) {
    e.stopPropagation();
    notifList.style.display = notifList.style.display === 'block' ? 'none' : 'block';
    if (notifList.style.display === 'block') {
      clearNotifs();
    }
  };
  
  // إغلاق القائمة عند النقر خارجها
  document.addEventListener('click', function(e) {
    if (!notifBtn.contains(e.target) && !notifList.contains(e.target)) {
      notifList.style.display = 'none';
    }
  });
}

// تحديث واجهة الإشعارات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  updateNotifUI();
});

// يمكن استدعاء addNotif(text) من أي مكان لإضافة إشعار جديد 