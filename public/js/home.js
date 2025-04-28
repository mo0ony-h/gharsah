document.addEventListener("DOMContentLoaded", function () {

  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    if (link.href.includes(currentPath)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
    const startBtn = document.getElementById("start-button");
  
    // تحقّق من حالة تسجيل الدخول (وهمية)
    const isLoggedIn = localStorage.getItem("gharsahUserLoggedIn") === "true";
  
    // غيّر وجهة الزر بناءً على الحالة
    if (startBtn) {
      startBtn.setAttribute("href", isLoggedIn ? "/diary" : "../html/signup.html");
    }
  });
  