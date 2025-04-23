// DOM elements
const form = document.querySelector('.sign-in-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent form from submitting normally

  // Get user input
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Check if fields are empty
  if (!email || !password) {
    alert('يرجى ملء جميع الحقول');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
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
