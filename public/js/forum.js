async function submitPost() {
    const author = document.getElementById('author').value;
    const content = document.getElementById('postContent').value;
  
    if (!author || !content) {
      alert("الرجاء ملء جميع الحقول");
      return;
    }
  
    try {
      await fetch('/api/auth/posts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ author, content })
      });
  
      // Clear inputs
      document.getElementById('author').value = '';
      document.getElementById('postContent').value = '';
      loadPosts(); // reload posts after submitting
    } catch (err) {
      alert("فشل إرسال المشاركة");
      console.error("Submit error:", err);
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("postsList");
    const submitBtn = document.getElementById("submitPost");
  
    async function loadPosts() {
      try {
        const res = await fetch('/api/auth/posts');
        const posts = await res.json();
  
        container.innerHTML = posts.map(p => `
          <div class="post">
            <h4>${p.author}</h4>
            <p>${p.content}</p>
            <small>${new Date(p.createdAt).toLocaleString('ar-EG')}</small>
          </div>
        `).join('');
      } catch (err) {
        container.innerHTML = "<p>فشل في تحميل المشاركات.</p>";
        console.error("Error loading posts:", err);
      }
    }
  
    // Attach submit event
    if (submitBtn) {
      submitBtn.addEventListener('click', submitPost);
    }
  
    // Load posts on page load
    loadPosts();
  });
  