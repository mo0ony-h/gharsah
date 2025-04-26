document.addEventListener('DOMContentLoaded', () => {

  const authSection = document.getElementById('auth-section');  // Ensure this is in the HTML
  const profileSection = document.getElementById('profile-section');
  
  // Immediately attach sign-in button listener when the page loads
  attachSigninButtonListener();

  function attachSigninButtonListener() {
    const signinBtn = document.getElementById('signin-btn');
    if (signinBtn) {
      signinBtn.addEventListener('click', () => {
        window.location.href = '../html/signin.html';
      });
    }
  }

  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.reload(); // Reload to reflect sign-out
    });
  }

  // Check if token exists
  const token = localStorage.getItem('token');

  if (token) {
    fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          userData = {
            name: data.name,
            fullName: data.fullName,
            location: data.location,
            bio: data.bio,
            experience: data.experience,
            avatar: data.avatar || '../images/user-avatar.png',
            createdAt: data.createdAt,
            plantCount: data.plantCount || 0,
            postCount: data.postCount || 0,
            replyCount: data.replyCount || 0
          };

          profileSection.style.display = 'block';
          authSection.style.display = 'none';
          updateProfileUI();
        } else {
          authSection.innerHTML = `<p>الرجاء تسجيل الدخول</p><button class="edit-btn" id="signin-btn">🔐 تسجيل الدخول</button>`;
          authSection.style.display = 'block';
          profileSection.style.display = 'none';
          attachSigninButtonListener(); // Reattach listener after DOM change
        }
      })
      .catch(err => {
        console.error(err);
        authSection.innerHTML = `<p>الرجاء تسجيل الدخول</p><button class="edit-btn" id="signin-btn">🔐 تسجيل الدخول</button>`;
        authSection.style.display = 'block';
        profileSection.style.display = 'none';
        attachSigninButtonListener(); // Reattach listener after DOM change
      });
  } else {
    authSection.style.display = 'block'; // Show sign-in section if no token
    profileSection.style.display = 'none';
  }


  // Modal for Editing Profile
  const editBtn = document.getElementById('edit-profile-btn');
  const modal = document.getElementById('edit-modal');
  const closeBtn = document.querySelector('.close-btn');
  const profileForm = document.getElementById('profile-form');
  const fullNameInput = document.getElementById('full-name-input');
  const locationInput = document.getElementById('location-input');
  const bioTextarea = document.getElementById('bio-textarea');
  const experienceSelect = document.getElementById('experience-select');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      fullNameInput.value = userData.fullName;
      locationInput.value = userData.location;
      bioTextarea.value = userData.bio;
      experienceSelect.value = userData.experience;

      modal.style.display = 'block';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Handle Profile Form Submission to Update Profile
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      
      const experience = experienceSelect.value;
      const name = fullNameInput.value;
      const location = locationInput.value;
      const bio = bioTextarea.value;

      try {
        const response = await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, location, bio, experience }),
        });

        const data = await response.json();
        if (response.ok) {
          userData.name = data.name;
          userData.bio = data.bio;
          userData.location = data.location;
          userData.experience = data.experience;

          updateProfileUI();
          modal.style.display = 'none';
        } else {
          alert(data.msg || 'Error updating profile');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to update profile');
      }
    });
  }



  // Function to update the profile UI with new data
  function updateProfileUI() {
    document.getElementById('username').textContent = userData.name;
    document.getElementById('user-bio').textContent = userData.bio;
    document.getElementById('full-name').textContent = userData.fullName;
    document.getElementById('user-location').textContent = userData.location;
    document.getElementById('user-experience').textContent = userData.experience;
    document.querySelector('.profile-avatar').src = userData.avatar;

    // New fields
    document.getElementById('user-joined-date').textContent =
      new Date(userData.createdAt).toLocaleDateString('ar-EG');

    document.getElementById('plants-added').textContent = userData.plantCount;
    document.getElementById('forum-posts').textContent = userData.postCount;
    document.getElementById('comments-count').textContent = userData.replyCount;
  }

});