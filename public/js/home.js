document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-button");
  
    // تحقّق من حالة تسجيل الدخول (وهمية)
    const isLoggedIn = localStorage.getItem("gharsahUserLoggedIn") === "true";
  
    // غيّر وجهة الزر بناءً على الحالة
    if (startBtn) {
      startBtn.setAttribute("href", isLoggedIn ? "/diary" : "../html/signup.html");
    }
  });
  