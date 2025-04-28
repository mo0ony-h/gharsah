// Submit new post
async function submitPost() {
  const title = document.getElementById('post-title').value;
  const category = document.getElementById('post-category').value;
  const content = document.getElementById('post-content').value;

  if (!title || !category || !content) {
    alert("الرجاء ملء جميع الحقول");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("يجب تسجيل الدخول للقيام بذلك");
    return;
  }

  try {
    const image = document.getElementById('post-img-file').files[0];
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('content', content);
    if (image) formData.append('image', image);

    const res = await fetch('/api/auth/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!res.ok) throw new Error('Post submission failed');

    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-content').value = '';
    
    loadPosts();
    closePostModal();

  } catch (err) {
    alert("فشل إرسال المشاركة");
    console.error("Submit error:", err);
  }
}


// Handle the filter change
document.getElementById('filter-category').addEventListener('change', loadPosts);

// Loading posts with filtering
async function loadPosts() {
  const container = document.getElementById("postsList");
  const categoryFilter = document.getElementById("filter-category").value;
  const token = localStorage.getItem('token');

  const tokenPayload = JSON.parse(atob(token.split('.')[1]));
  const loggedInUserId = tokenPayload.id;  
  

  try {
    let url = '/api/auth/posts';
    if (categoryFilter) {
      url += `?category=${categoryFilter}`;
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to load posts");

    const posts = await res.json();

    if (!Array.isArray(posts)) {
      throw new Error("Posts response is not an array");
    }

    container.innerHTML = posts.map(post => `
      <div class="post">
      <h4><a href="/profile/${post.author?.username}" class="author-link">${post.author?.username || "Unknown"}</a></h4>
        <p>العنوان: ${post.title}</p>
        <p>المحتوى: ${post.content}</p>
        <small>${new Date(post.createdAt).toLocaleString('ar-EG')}</small>
        <div class="post-actions">
          <button class="btn-action" onclick="likePost('${post._id}')">❤️ ${post.likes ?? 0}</button>
          <button class="btn-action" onclick="openReplyModal('${post._id}')">💬 رد</button>
          ${post.author?._id === loggedInUserId ? `
            <button class="btn-action" onclick="deletePost('${post._id}')">🗑️ حذف المنشور</button>
          ` : ''}
        </div>
        ${post.replies.map(reply => `
          <div class="reply">
            <p><strong><a href="/profile/${reply.author?.username}" class="author-link">${reply.author?.username || "Unknown"}</a></strong>: ${reply.content}</p>
            ${reply.author?._id === loggedInUserId ? `
          <button class="btn-action" onclick="deleteReply('${post._id}', '${reply._id}')">🗑️ حذف الرد</button>
        ` : ''}
          </div>
        `).join('')}        
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = "<p>فشل في تحميل المشاركات.</p>";
    console.error("Error loading posts:", err);
  }
}


// Like a post
async function likePost(postId) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/auth/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(errData.error || 'فشل تسجيل الإعجاب');
      return;
    }

    const updatedPost = await res.json();
    
    // Update the like count in the DOM
    const likeButton = document.querySelector(`.btn-action[onclick="likePost('${postId}')"]`);
    if (likeButton) {
      likeButton.innerHTML = `❤️ ${updatedPost.likes}`;
    }

  } catch (err) {
    console.error('Error liking post:', err);
    alert('حدث خطأ أثناء تسجيل الإعجاب');
  }
}

async function deletePost(postId) {
  const token = localStorage.getItem("token");
  if (!confirm("هل أنت متأكد من حذف المنشور؟")) return;

  try {
    const res = await fetch(`/api/auth/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete post');
    await loadPosts(); // refresh
  } catch (err) {
    console.error('Error deleting post:', err);
    alert('فشل في حذف المنشور');
  }
}

async function deleteReply(postId, replyId) {
  const token = localStorage.getItem("token");

  try {
    // Log the values to check if they are correct
    console.log('Deleting reply with postId:', postId, 'and replyId:', replyId);

    const res = await fetch(`/api/auth/posts/${postId}/reply/${replyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(errData.error || 'فشل حذف الرد');
      return;
    }

    // If the reply is deleted successfully, remove it from the DOM
    const replyElement = document.querySelector(`.reply[data-reply-id="${replyId}"]`);
    if (replyElement) {
      replyElement.remove();  // Remove the reply from the DOM
    }

    alert('تم حذف الرد بنجاح');
  } catch (err) {
    console.error('Error deleting reply:', err);
    alert('حدث خطأ أثناء حذف الرد');
  }
}




// Open reply modal
function openReplyModal(postId) {
  const replyModal = document.getElementById('reply-modal');
  replyModal.style.display = 'flex';
  replyModal.dataset.postId = postId; // Save the post ID to the modal for later use
}

// Close reply modal
document.getElementById('close-reply-modal').addEventListener('click', () => {
  document.getElementById('reply-modal').style.display = 'none';
});

// Submit a reply
// Submit a reply
document.getElementById('submit-reply').addEventListener('click', async () => {
  const replyContent = document.getElementById('reply-content').value;
  const replyImage = document.getElementById('reply-image').files[0];
  const postId = document.getElementById('reply-modal').dataset.postId;
  const token = localStorage.getItem("token");

  if (!replyContent) {
    alert("الرجاء كتابة الرد");
    return;
  }

  const formData = new FormData();
  formData.append('content', replyContent);
  if (replyImage) {
    formData.append('image', replyImage);
  }

  try {
    const res = await fetch(`/api/auth/posts/${postId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(errData.error || 'فشل إرسال الرد');
      return;
    }

    await loadPosts();

    // Reset & close modal
    document.getElementById('reply-content').value = '';
    document.getElementById('reply-image').value = '';
    document.getElementById('reply-modal').style.display = 'none';

  } catch (err) {
    console.error('Error submitting reply:', err);
    alert('حدث خطأ أثناء إرسال الرد');
  }
});



document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // prevent the form from reloading the page
  await submitPost();
});


// Open the post modal
document.getElementById("new-post-btn").addEventListener("click", () => {
  document.getElementById("post-modal").style.display = "flex";
});

// Close the post modal
document.getElementById("close-post-modal").addEventListener("click", () => {
  document.getElementById("post-modal").style.display = "none";
});

// Close modal function
function closePostModal() {
  document.getElementById("post-modal").style.display = "none";
}

window.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    if (link.href.includes(currentPath)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  loadPosts();
});
