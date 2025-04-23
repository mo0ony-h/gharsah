// @ts-nocheck
document.addEventListener("DOMContentLoaded", () => {
  const postsListEl      = document.querySelector(".posts-list");
  const newPostBtn       = document.getElementById("new-post-btn");
  const postModal        = document.getElementById("post-modal");
  const closePostModal   = document.getElementById("close-post-modal");
  const postForm         = document.getElementById("post-form");
  const filterCategory   = document.getElementById("filter-category");
  const searchInput      = document.getElementById("search-input");
  const detailModal      = document.getElementById("detail-modal");
  const closeDetailModal = document.getElementById("close-detail-modal");
  const detailContainer  = document.getElementById("detail-container");
  const lightbox         = document.getElementById("lightbox");
  const lightboxImg      = document.getElementById("lightbox-img");
  const lightboxClose    = document.querySelector(".lightbox-close");

  let posts = [];

  function fetchPosts() {
    posts = [
      // بيانات محاكاة...
    ];
    renderPosts();
  }

  function applyFilter() {
    const cat = filterCategory.value;
    const q   = searchInput.value.trim().toLowerCase();
    return posts.filter(p =>
      (!cat || p.category === cat) &&
      (!q   || p.title.toLowerCase().includes(q))
    );
  }

  function renderPosts() {
    postsListEl.innerHTML = "";
    applyFilter().forEach(post => {
      const hasImageIcon = post.image ? `<span class="has-image">📷</span>` : "";
      const card = document.createElement("div");
      card.className   = "post-card";
      card.dataset.id  = post.id;
      card.innerHTML   = `
        <div class="post-header">
          <h4>
            <a href="#" class="detail-link">${post.title}</a>
            ${hasImageIcon}
          </h4>
          <div class="meta">${post.author} • ${new Date(post.created_at).toLocaleDateString("ar-EG")}</div>
        </div>
        <div class="post-actions">
          <span class="post-category">${post.category}</span>
          <button class="like-btn">❤️ ${post.likes}</button>
          <span class="reply-count">💬 ${post.replies.length}</span>
        </div>`;
      postsListEl.appendChild(card);
      bindCardEvents(card);
    });

    document.querySelectorAll(".detail-link").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        openDetailModal(e.target.closest(".post-card").dataset.id);
      });
    });
  }

  function bindCardEvents(card) {
    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", () => {
      const post = posts.find(p => p.id == card.dataset.id);
      if (!post) return;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      likeBtn.textContent = `❤️ ${post.likes}`;
    });
  }

  function openDetailModal(id) {
    const post = posts.find(p => p.id == id);
    if (!post) return;
    post.replies.sort((a,b) => (b.score||0) - (a.score||0));
    detailContainer.innerHTML = `
      <div class="post-detail-card">
        <h2>${post.title}</h2>
        <div class="meta">
          <a href="/profile.html?user=${encodeURIComponent(post.author)}" class="detail-author">${post.author}</a>
          • ${new Date(post.created_at).toLocaleString("ar-EG")}
        </div>
        ${post.image ? `<img class="post-image" src="${post.image}">` : ""}
        <div class="post-content">${post.content}</div>
        <div class="replies">
          <h3>الردود (${post.replies.length})</h3>
          ${post.replies.map((r,i) => `
            <div class="reply-card" data-index="${i}">
              <div class="reply-header">
                <div class="reply-votes">
                  <button class="upvote-btn">▲</button>
                  <span class="vote-count">${r.score||0}</span>
                  <button class="downvote-btn">▼</button>
                </div>
                <div class="reply-meta">
                  <span>${r.author}</span>
                  <span>${new Date(r.created_at).toLocaleTimeString("ar-EG",{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
              <div class="reply-content">${r.content}</div>
              ${r.image ? `<img class="reply-image" src="${r.image}">` : ""}
            </div>`).join("")}
        </div>
        <form class="reply-form" id="detail-reply-form">
          <div class="form-group">
            <textarea id="detail-reply" placeholder="اكتب ردك هنا..." required></textarea>
          </div>
          <div class="form-group">
            <label for="reply-img-file">أضف صورة (اختياري)</label>
            <input type="file" id="reply-img-file" accept="image/*">
          </div>
          <button type="submit" class="btn-submit">نشر الرد</button>
        </form>
      </div>`;
    detailModal.style.display = "flex";

    // إعادة ربط أحداث التصويت
    detailContainer.querySelectorAll(".reply-card").forEach(card => {
      const idx = +card.dataset.index;
      const up  = card.querySelector(".upvote-btn");
      const dn  = card.querySelector(".downvote-btn");
      up.onclick = () => voteReply(post, idx, 1, id);
      dn.onclick = () => voteReply(post, idx, -1, id);
    });

    // تكبير الصور
    detailContainer.querySelectorAll(".post-image, .reply-image").forEach(img => {
      img.onclick = () => { lightboxImg.src = img.src; lightbox.style.display = "flex"; };
    });

    // **هنا ربط إرسال الرد** بعد حقن الـ HTML
    const detailForm = document.getElementById("detail-reply-form");
    detailForm.addEventListener("submit", e => {
      e.preventDefault();
      const textField = document.getElementById("detail-reply");
      const fileInput = document.getElementById("reply-img-file");
      const txt       = textField.value.trim();
      const file      = fileInput.files[0];
      if (!txt) return;
      const reply = {
        author: "أنت",
        content: txt,
        created_at: new Date().toISOString(),
        score: 0,
        userVote: 0,
        image: null
      };
      const finalize = () => {
        post.replies.push(reply);
        openDetailModal(id);
      };
      if (file) {
        const fr = new FileReader();
        fr.onload = () => { reply.image = fr.result; finalize(); };
        fr.readAsDataURL(file);
      } else {
        finalize();
      }
    });
  }

  function voteReply(post, idx, dir, modalPostId) {
    const r = post.replies[idx];
    if (r.userVote === dir) {
      r.score -= dir;
      r.userVote = 0;
    } else {
      if (r.userVote !== 0) r.score -= r.userVote;
      r.score += dir;
      r.userVote = dir;
    }
    openDetailModal(modalPostId);
  }

  // Lightbox إغلاق
  lightboxClose.onclick = () => lightbox.style.display = "none";
  lightbox.onclick      = e => { if (e.target === lightbox) lightbox.style.display = "none"; };

  // فتح/إغلاق المودالات
  newPostBtn.onclick       = () => postModal.style.display = "flex";
  closePostModal.onclick   = () => postModal.style.display = "none";
  closeDetailModal.onclick = () => detailModal.style.display = "none";
  window.onclick = e => {
    if (e.target === postModal)    postModal.style.display = "none";
    if (e.target === detailModal)  detailModal.style.display = "none";
  };

  // نشر منشور جديد
  postForm.onsubmit = e => {
    e.preventDefault();
    const t    = document.getElementById("post-title").value.trim();
    const c    = document.getElementById("post-category").value;
    const cnt  = document.getElementById("post-content").value.trim();
    const file = document.getElementById("post-img-file").files[0];
    if (!t || !cnt) return;
    const newPost = {
      id: Date.now(),
      title: t,
      category: c,
      content: cnt,
      image: null,
      author: "أنت",
      created_at: new Date().toISOString(),
      likes: 0,
      liked: false,
      replies: []
    };
    const finalizePost = () => {
      posts.unshift(newPost);
      renderPosts();
      postForm.reset();
      postModal.style.display = "none";
    };
    if (file) {
      const fr = new FileReader();
      fr.onload = () => { newPost.image = fr.result; finalizePost(); };
      fr.readAsDataURL(file);
    } else {
      finalizePost();
    }
  };

  filterCategory.onchange = renderPosts;
  searchInput.oninput     = renderPosts;

  fetchPosts();
});
