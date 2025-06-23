const form = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmDiv = document.getElementById('confirm-password-div');
const confirmInput = document.getElementById('confirm-password');
const submitBtn = document.getElementById('submit-btn');
const msgDiv = document.getElementById('msg');
const formTitle = document.getElementById('form-title');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-link');

let isLogin = true; // الوضع الحالي: true = تسجيل دخول، false = إنشاء حساب

function showMsg(text, type = 'error') {
  msgDiv.innerHTML = `<div class="${type}-msg">${text}</div>`;
}

function clearMsg() {
  msgDiv.innerHTML = '';
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function findUser(username) {
  return getUsers().find(u => u.username === username);
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email === email);
}

// إنشاء صورة رمزية حسب الجنس
function createAvatar(gender) {
  if (gender === 'male') {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="%234a90e2"/><path d="M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30" fill="%234a90e2"/></svg>';
  } else if (gender === 'female') {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="%23e91e63"/><path d="M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30" fill="%23e91e63"/></svg>';
  } else {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="%23b8860b"/><path d="M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30" fill="%23b8860b"/></svg>';
  }
}

// تبديل بين تسجيل الدخول وإنشاء حساب
function toggleMode() {
  isLogin = !isLogin;
  if (isLogin) {
    formTitle.textContent = 'تسجيل الدخول';
    submitBtn.textContent = 'دخول';
    toggleText.textContent = 'ليس لديك حساب؟';
    toggleLink.textContent = 'إنشاء حساب';
    confirmDiv.style.display = 'none';
    // إخفاء حقل البريد الإلكتروني في تسجيل الدخول
    document.getElementById('email-div').style.display = 'none';
  } else {
    formTitle.textContent = 'إنشاء حساب';
    submitBtn.textContent = 'إنشاء حساب';
    toggleText.textContent = 'لديك حساب بالفعل؟';
    toggleLink.textContent = 'تسجيل الدخول';
    confirmDiv.style.display = 'block';
    // إظهار حقل البريد الإلكتروني في إنشاء الحساب
    document.getElementById('email-div').style.display = 'block';
  }
  clearMsg();
  form.reset();
}

toggleLink.addEventListener('click', toggleMode);

form.addEventListener('submit', function(e) {
  e.preventDefault();
  clearMsg();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const gender = document.getElementById('gender')?.value || '';
  
  if (!username || !password) {
    showMsg('يرجى إدخال جميع البيانات المطلوبة');
    return;
  }
  
  // تسجيل دخول المسؤول
  if (username === 'manager' && password === 'manager123456') {
    const adminUser = {
      name: 'المسؤول',
      email: 'manager',
      password: password,
      gender: 'male',
      avatar: createAvatar('male'),
      joinDate: new Date().toISOString(),
      isAdmin: true
    };
    localStorage.setItem('currentUser', JSON.stringify(adminUser));
    showMsg('تم تسجيل دخول المسؤول بنجاح!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    return;
  }
  
  if (isLogin) {
    // تسجيل الدخول
    const user = findUser(username);
    if (!user || user.password !== password) {
      showMsg('اسم المستخدم أو كلمة المرور غير صحيحة');
      return;
    }
    
    // إنشاء كائن المستخدم الحالي
    const currentUser = {
      name: user.name || user.username,
      email: user.email || user.username,
      password: user.password,
      gender: user.gender,
      avatar: user.avatar || createAvatar(user.gender),
      joinDate: user.joinDate || new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMsg('تم تسجيل الدخول بنجاح!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } else {
    // إنشاء حساب
    const email = document.getElementById('email')?.value?.trim() || '';
    const confirm = confirmInput.value;
    
    if (!email) {
      showMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }
    
    if (password.length < 4) {
      showMsg('كلمة المرور يجب أن تكون 4 أحرف أو أكثر');
      return;
    }
    
    if (password !== confirm) {
      showMsg('كلمتا المرور غير متطابقتين');
      return;
    }
    
    if (!gender) {
      showMsg('يرجى اختيار الجنس');
      return;
    }
    
    if (findUser(username)) {
      showMsg('اسم المستخدم مستخدم بالفعل');
      return;
    }
    
    if (findUserByEmail(email)) {
      showMsg('البريد الإلكتروني مستخدم بالفعل');
      return;
    }
    
    const users = getUsers();
    const newUser = {
      name: username,
      username: username,
      email: email,
      password: password,
      gender: gender,
      avatar: createAvatar(gender),
      joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    setUsers(users);
    
    showMsg('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.', 'success');
    setTimeout(() => { toggleMode(); }, 1200);
  }
}); 