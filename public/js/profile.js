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
            forumPostsCount: data.forumPostsCount || 0,
            commentsCount: data.commentsCount || 0
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

  // Follow/Unfollow functionality
  const followBtn = document.getElementById('follow-btn');
  // Get user ID from query string
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('user'); // e.g. '68034e61767a42e1cad008dc'

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
  const decoded = parseJwt(token);
  const loggedInUserId = decoded?.id;


  if (targetUserId !== loggedInUserId) {
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        const action = followBtn.textContent.toLowerCase();
        const url = action === 'follow' ? `/api/auth/follow/${targetUserId}` : `/api/auth/unfollow/${targetUserId}`;
    
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
    
          const data = await response.json();
    
          if (response.ok) {
            followBtn.textContent = action === 'follow' ? 'Unfollow' : 'Follow';
            alert(data.msg);
          } else {
            alert(data.msg || 'Error following/unfollowing');
          }
        } catch (err) {
          console.error(err);
          alert('Error following/unfollowing');
        }
      });
    }
  } else {
    // Hide Follow button if viewing own profile
    if (followBtn) {
      followBtn.style.display = 'none';
    }
  }

  // Display follower and following counts
  const followersCountElem = document.getElementById('followers-count');
  const followingCountElem = document.getElementById('following-count');

  if (targetUserId) {
    fetch(`/api/auth/profile/${targetUserId}`)
      .then(response => response.json())
      .then(data => {
        if (followersCountElem) followersCountElem.textContent = data.followers;
        if (followingCountElem) followingCountElem.textContent = data.following;
      })
      .catch(err => console.error('Error fetching user data:', err));
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
    document.getElementById('forum-posts').textContent = userData.forumPostsCount;
    document.getElementById('comments-count').textContent = userData.commentsCount;
  }

});