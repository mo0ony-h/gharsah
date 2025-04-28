// DOM elements
const form = document.querySelector('.sign-in-form');
const emailOrUsernameInput = document.getElementById('emailOrUsername');
const passwordInput = document.getElementById('password');

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent form from submitting normally

  // Get user input
  const emailOrUsername = emailOrUsernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Check if fields are empty
  if (!emailOrUsername || !password) {
    alert('يرجى ملء جميع الحقول');
    return;
  }

  const loginData = emailOrUsername.includes('@') ? { email: emailOrUsername, password } : { username: emailOrUsername, password };

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (response.status === 200) {
      // Successful login, store token
      localStorage.setItem('token', data.token);
      window.location.href = '../html/profile.html'; // Redirect to user profile or homepage
    } else {
      alert(data.msg || 'حدث خطأ في تسجيل الدخول');
    }
  } catch (error) {
    alert('حدث خطأ في الشبكة');
  }
});
