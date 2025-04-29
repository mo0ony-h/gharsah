let targetUserId = null;
let isFollowing = false;
let userData = {};
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {

  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    if (link.href.includes(currentPath)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const pathParts = window.location.pathname.split('/');
  const isPublicProfile = pathParts[1] === 'profile';
  const usernameInUrl = pathParts[2];

  const authSection = document.getElementById('auth-section');
  const profileSection = document.getElementById('profile-section');
  const followBtn = document.getElementById('follow-btn');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const signoutBtn = document.getElementById('signout-btn');
  const signinBtn = document.getElementById('signin-btn');
  const modal = document.getElementById('edit-modal');
  const closeBtn = document.querySelector('.close-btn');
  const profileForm = document.getElementById('profile-form');
  const fullNameInput = document.getElementById('full-name-input');
  const locationInput = document.getElementById('location-input');
  const bioTextarea = document.getElementById('bio-textarea');
  const experienceSelect = document.getElementById('experience-select');

  const token = localStorage.getItem('token');

  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
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

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      
      const experience = experienceSelect.value;
      const fullName = fullNameInput.value;
      const location = locationInput.value;
      const bio = bioTextarea.value;

      try {
        const response = await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fullName, location, bio, experience }),
        });

        const data = await response.json();
        if (response.ok) {
          userData.name = data.fullName;
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

  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      location.reload();
    });
  }
  if (!token) {
    authSection.style.display = 'block';
    profileSection.style.display = 'none';
    signinBtn.style.display = 'block';
    signinBtn.addEventListener('click', () => {
      window.location.href = '../html/signin.html';
    });
    return;
  }

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    currentUserId = decoded.id;
  } catch (err) {
    console.error('Invalid token');
  }

  if (isPublicProfile) {
    // Visiting someone else's profile
    await loadPublicProfile(usernameInUrl);
  } else {
    // Viewing my own private profile
    await loadPrivateProfile();
  }

  updateProfileUI();
  setupButtons();

  async function loadPublicProfile(username) {
    try {
      const res = await fetch(`/api/auth/profile/${username}`);
      const data = await res.json();

      if (!data || !data.username) {
        alert('😥 لم يتم العثور على المستخدم');
        return;
      }

      userData = {
        id: data._id,
        username: data.username,
        fullName: data.fullName,
        location: data.location,
        bio: data.bio,
        experience: data.experience,
        avatar: data.avatar || '../images/user-avatar.png',
        createdAt: data.createdAt,
        plantCount: data.plants?.length || 0,
        postCount: data.postCount || 0,
        replyCount: data.replyCount || 0,
        followersCount: data.followers?.length || 0,
        followingCount: data.following?.length || 0,
        followers: data.followers || [],
      };

      profileSection.style.display = 'block';
      authSection.style.display = 'none';

      targetUserId = userData.id;
      isFollowing = userData.followers.includes(currentUserId);

    } catch (err) {
      console.error('Error loading public profile:', err);
      alert('❌ حدث خطأ أثناء تحميل الملف الشخصي');
    }
  }

  async function loadPrivateProfile() {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data || !data.username) {
        authSection.style.display = 'block';
        profileSection.style.display = 'none';
        return;
      }

      userData = {
        id: data._id,
        username: data.username,
        fullName: data.fullName,
        location: data.location,
        bio: data.bio,
        experience: data.experience,
        avatar: data.avatar || '../images/user-avatar.png',
        createdAt: data.createdAt,
        plantCount: data.plantCount || 0,
        postCount: data.postCount || 0,
        replyCount: data.replyCount || 0,
        followersCount: data.followers?.length || 0,
        followingCount: data.following?.length || 0,
      };

      profileSection.style.display = 'block';
      authSection.style.display = 'none';

      localStorage.setItem('username', userData.username);

    } catch (err) {
      console.error('Error loading private profile:', err);
      authSection.style.display = 'block';
      profileSection.style.display = 'none';
    }
  }

  function updateProfileUI() {
    document.getElementById('username').textContent = userData.username;
    document.getElementById('full-name').textContent = userData.fullName;
    document.getElementById('user-location').textContent = userData.location;
    document.getElementById('user-bio').textContent = userData.bio;
    document.getElementById('user-experience').textContent = userData.experience;
    document.querySelector('.profile-avatar').src = userData.avatar;

    document.getElementById('user-joined-date').textContent =
      new Date(userData.createdAt).toLocaleDateString('ar-EG');

    document.getElementById('plants-added').textContent = userData.plantCount;
    document.getElementById('forum-posts').textContent = userData.postCount;
    document.getElementById('comments-count').textContent = userData.replyCount;
    document.getElementById('followers-count').textContent = userData.followersCount;
    document.getElementById('following-count').textContent = userData.followingCount;
  }

  function setupButtons() {
    if (isPublicProfile) {
      const loggedInUsername = localStorage.getItem('username');

      if (usernameInUrl === loggedInUsername) {
        followBtn.style.display = 'none';
        editProfileBtn.style.display = 'block';
        signoutBtn.style.display = 'block';
      } else {
        followBtn.style.display = 'block';
        editProfileBtn.style.display = 'none';
        signoutBtn.style.display = 'none';

        followBtn.textContent = isFollowing ? 'إلغاء المتابعة' : 'متابعة';
        followBtn.addEventListener('click', toggleFollow);
      }

    } else {
      followBtn.style.display = 'none';
      editProfileBtn.style.display = 'block';
      signoutBtn.style.display = 'block';
    }
  }

  async function toggleFollow() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/${isFollowing ? 'unfollow' : 'follow'}/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Toggle follow state
        isFollowing = !isFollowing;
  
        // Update the button text
        followBtn.textContent = isFollowing ? 'إلغاء المتابعة' : 'متابعة';
  
        // Update the followers count
        const followersCountEl = document.getElementById('followers-count');
        if (followersCountEl) {
          followersCountEl.innerText = data.newFollowerCount;
        }
  
  
        // Update the local userData object to reflect the changes
        userData.followingCount = data.newFollowingCount; // Update userData with new following count
      } else {
        console.error('Error:', data.msg || 'حدث خطأ أثناء متابعة المستخدم');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }
  
});
