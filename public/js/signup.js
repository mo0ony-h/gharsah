document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    // Check if any required field is empty
    if (!username || !email || !password || !confirmPassword) {
      alert('❌ يرجى ملء جميع الحقول');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      alert('❌ كلمتا المرور غير متطابقتين');
      return;
    }

    // Check for password strength (without special characters)
    if (!isStrongPassword(password)) {
      alert('❌ يجب أن تحتوي كلمة المرور على الأقل على 8 أحرف، مع حرف كبير، حرف صغير، ورقم');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ تم التسجيل بنجاح! سيتم توجيهك لتسجيل الدخول.');
        window.location.href = '../html/signin.html';
      } else {
        alert(`❌ ${data.msg || 'حدث خطأ أثناء التسجيل'}`);
      }
    } catch (error) {
      console.error('Registration Error:', error);
      alert('❌ حدث خطأ أثناء الاتصال بالخادم');
    }

  });

  // Password strength check function without special characters
  function isStrongPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  }
});
