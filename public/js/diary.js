let editMap = null;
let editMarker = null;

function createCard(plant) {
    const {
        _id,
        name,
        notes,
        type,
        plantingDate,
        location,
        reminderInterval,
        image
    } = plant;

    const card = document.createElement("div");
    card.className = "diary-card";
    card.setAttribute("data-id", _id);
    card.setAttribute("data-loc", location);
    card.setAttribute("data-user", localStorage.getItem("userId"));

    card.innerHTML = `
    <div class="diary-card collapsed">
        <img src="${image || '../images/plant1.jpg'}" alt="نبتة" class="main-img"/>
        <h4 class="plant-name">${name}</h4>
        <p class="plant-notes"><strong>📝 ملاحظات:</strong> ${notes}</p>
        <p><strong>📍 الموقع:</strong></p>
        <div class="map" id="map-${_id}"></div>
        <p><strong>🌱 نوع النبتة:</strong> <span class="plant-type">${type}</span></p>
        <p><strong>📅 تاريخ الزراعة:</strong> <span class="plant-date">${plantingDate}</span></p>
        <p><strong>🧮 عمر النبتة:</strong> <span class="plant-age"></span></p>
        <p><strong>💧 آخر سقي:</strong> <span class="last-watered">${plant.lastWatered ? new Date(plant.lastWatered).toLocaleString('ar-EG') : ''}</span></p>
        <p><strong>⏰ التذكير:</strong> <span class="plant-reminder">كل ${reminderInterval} أيام</span></p>
        <div class="progress-section">
        <h5>🖼️ سجل التقدم</h5>
        <div class="progress-gallery"></div>
        <button class="add-progress-btn">➕ أضف صورة تقدم</button>
        <input type="file" class="progress-file-input" accept="image/*" style="display: none;">
        </div>
        <div class="card-actions">
            <button class="water-btn">✔️ سقيت النبتة</button>
            <button class="edit-btn">✏️ تعديل</button>
            <button class="delete-btn">🗑️ حذف</button>
        </div>
    </div>    
    `;

    document.querySelector(".diary-grid").appendChild(card);
    initCard(card);
};

const editModal = document.getElementById("edit-modal");
    const closeEdit = editModal.querySelector(".close-edit");

    closeEdit.onclick = () => editModal.style.display = "none";
    window.addEventListener("click", e => {
        if (e.target === editModal) editModal.style.display = "none";
    });
function openEditModal(id) {
    const card = document.querySelector(`.diary-card[data-id="${id}"]`);
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-name").value = card.querySelector(".plant-name").textContent;
    document.getElementById("edit-notes").value = card.querySelector(".plant-notes").textContent.replace("📝 ملاحظات:", "").trim();
    document.getElementById("edit-type").value = card.querySelector(".plant-type").textContent;
    document.getElementById("edit-reminder").value = parseInt(card.querySelector(".plant-reminder").textContent);

    document.getElementById("edit-modal").style.display = "block";
}



// تهيئة بطاقة (حساب العمر، السقي، تعديل، حذف، خريطة، سجل التقدم)
function initCard(card) {
    // حساب عمر النبتة
    const plantId = card.getAttribute("data-id");
    const dateSpan = card.querySelector(".plant-date");
    const ageSpan = card.querySelector(".plant-age");
    const token = localStorage.getItem("token");

    if (dateSpan && ageSpan) {
        const pd = new Date(dateSpan.textContent);
        const days = Math.floor((Date.now() - pd) / (1000 * 60 * 60 * 24));
        const yrs = Math.floor(days / 365);
        const mons = Math.floor((days % 365) / 30);
        const dys = days - yrs * 365 - mons * 30;
        const parts = [];
        if (yrs) parts.push(`${yrs} سنة`);
        if (mons) parts.push(`${mons} شهر`);
        if (dys || !parts.length) parts.push(`${dys} يوم`);
        ageSpan.textContent = parts.join(" ");
    }

    // زر "سقيت النبتة"
    card.querySelector(".water-btn").addEventListener("click", () => {
        const dw = card.querySelector(".last-watered");
        const now = new Date();
        
        const dstr = now.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      
        const tstr = now.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        });
      
        // Update UI immediately with new watering time
        dw.textContent = `${dstr} ${tstr}`;
        
        alert("✅ تم تحديث تاريخ ووقت السقي!");
      
        // Make API request to update watering time in DB
        fetch(`/api/auth/plants/${plantId}/water`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lastWatered: now.toISOString() }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to update watering time');
            }
            return res.json();
          })
          .then((data) => {
            console.log("Watering time saved to DB", data);
            // You could add some feedback for the user based on the response, e.g. a confirmation message
          })
          .catch((err) => {
            console.error("Error updating watering time:", err);
            alert("❌ حدث خطأ أثناء تحديث تاريخ السقي.");
          });
      });
      
      
      
      

    // زر "تعديل"
    card.querySelector(".edit-btn").addEventListener("click", () => {
        const cardId = card.getAttribute("data-id");
        openEditModal(cardId);
    });

    // زر "حذف"
    card.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("هل تريد حذف هذه اليومية فعلاً؟")) {
            fetch(`/api/auth/plants/${plantId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                  }
            })
            .then(res => res.json())
            .then(data => {
                if (data.msg === "Plant deleted successfully") {
                    card.remove();
                    alert("تم الحذف بنجاح!");
                } else {
                    alert("فشل الحذف: " + data.msg);
                }
            })
            .catch(err => {
                console.error("Error deleting plant:", err);
            });
        }
    });
    

    // خريطة البطاقة
    const mapEl = card.querySelector(".map");
    const loc = card.getAttribute("data-loc");
    
    if (mapEl && loc) {
        const [latStr, lngStr] = loc.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
    
        if (!isNaN(lat) && !isNaN(lng)) {
            const m = new google.maps.Map(mapEl, {
                center: { lat, lng },
                zoom: 14,
            });
            new google.maps.Marker({ position: { lat, lng }, map: m });
        } else {
            console.warn("Invalid lat/lng:", loc);
        }
    }
    

    // سجل التقدم: ربط حذف صور التقدم
    card.querySelectorAll(".del-progress").forEach(del => {
        del.addEventListener("click", () => del.parentElement.remove());
    });


    // إضافة صورة تقدم
    const addProgressBtn = card.querySelector(".add-progress-btn");
    const gallery = card.querySelector(".progress-gallery");
    
    // Create or find the hidden file input
    let fileInput = card.querySelector(".progress-file-input");
    if (!fileInput) {
        fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.classList.add("progress-file-input");
        fileInput.style.display = "none";
        card.appendChild(fileInput);
    }
    
    // Button click opens file picker
    addProgressBtn.addEventListener("click", () => {
        fileInput.click();
    });
    
    // When user selects a file
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = async function () {
            const base64Image = reader.result;
            const plantId = card.getAttribute("data-id");
    
            // Optional: send to backend to save
            await uploadProgressImage(plantId, base64Image);
    
            // Add to gallery visually
            const imgDiv = document.createElement("div");
            imgDiv.classList.add("progress-img");
            imgDiv.innerHTML = `
                <img src="${base64Image}" />
                <button class="del-progress">🗑️</button>
            `;
            gallery.appendChild(imgDiv);
    
            // Delete listener
            imgDiv.querySelector(".del-progress").addEventListener("click", () => {
                imgDiv.remove();
                // Optional: send delete to server
            });
        };
        reader.readAsDataURL(file);
    });
}


async function uploadProgressImage(plantId, base64Image) {
    try {
        const res = await fetch(`/api/auth/plants/${plantId}/progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ image: base64Image })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("❌ Failed to upload progress image:", errorData);
        } else {
            console.log("✅ Progress image uploaded");
        }
    } catch (err) {
        console.error("❌ Error uploading progress image:", err);
    }
}







document.addEventListener("DOMContentLoaded", async () => {

    if (window.innerWidth <= 600) {
        const diaryCards = document.querySelectorAll('.diary-card');
  
        diaryCards.forEach(card => {
          const header = card.querySelector('.card-header');
          header.addEventListener('click', () => {
            // Close all others
            diaryCards.forEach(c => {
              if (c !== card) c.classList.remove('expanded');
            });
            card.classList.toggle('expanded');
          });
        });
      }

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
  
    navLinks.forEach(link => {
      if (link.href.includes(currentPath)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    const reminderInput = document.getElementById('plant-reminder');
    reminderInput.addEventListener('input', () => {
      if (parseInt(reminderInput.value) < 1) {
        reminderInput.value = 1;
      }
    });


    try {
        fetchPlants(); 
          
    } catch (error) {
        console.error("Error loading plants:", error);
    }
    

    
    let nextId = document.querySelectorAll(".diary-card").length + 1;
    let modalMap, modalMarker, editMap, editMarker;
    
    // تهيئة كل البطاقات عند التحميل
    document.querySelectorAll(".diary-card").forEach(initCard);


    

    // -------------- مودال إضافة يومية جديدة --------------
    const entryModal = document.getElementById("entry-modal");
    const openEntry = document.getElementById("open-modal");
    const closeEntry = entryModal.querySelector(".close");
    openEntry.addEventListener("click", e => {
        e.preventDefault();
        entryModal.style.display = "block";
        if (!modalMap) {
            modalMap = new google.maps.Map(document.getElementById("modal-map"), {
                center: { lat: 21.543333, lng: 39.172778 },
                zoom: 13
            });
            modalMap.addListener("click", ev => {
                if (modalMarker) modalMarker.setMap(null);
                modalMarker = new google.maps.Marker({ position: ev.latLng, map: modalMap });
                document.getElementById("plant-loc").value = `${ev.latLng.lat()},${ev.latLng.lng()}`;
            });
        }
    });
    closeEntry.onclick = () => entryModal.style.display = "none";
    window.addEventListener("click", e => {
        if (e.target === entryModal) entryModal.style.display = "none";
    });


    // إضافة يومية جديدة
document.getElementById("entry-form").addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("plant-name").value;
    const notes = document.getElementById("plant-notes").value;
    const type = document.getElementById("plant-type").value;
    const pDate = document.getElementById("plant-date").value;
    const loc = document.getElementById("plant-loc").value;
    const reminder = document.getElementById("plant-reminder").value;
    const fileInp = document.getElementById("plant-img-file");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const plantData = {
        name,
        notes,
        type,
        plantingDate: pDate,
        location: loc,
        reminderInterval: reminder,
        userId,
    };

    // When saving location
    const [lat, lng] = loc.split(",");
    plantData.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    function sendAndCreateCard(image) {
        plantData.image = image || "../images/plant1.jpg";

        fetch('/api/auth/plants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(plantData)
        })
        .then(res => res.json())
        .then(savedPlant => {
            createCard(savedPlant);  // Create card from saved DB version
        })
        .catch(err => console.error('Error adding plant:', err));

        // Reset modal and form
        entryModal.style.display = "none";
        document.getElementById("entry-form").reset();
        if (modalMarker) { modalMarker.setMap(null); modalMarker = null; }
    }

    if (fileInp.files[0]) {
        const reader = new FileReader();
        reader.onload = function () {
            sendAndCreateCard(reader.result);  // Pass image data to sendAndCreateCard
        };
        reader.readAsDataURL(fileInp.files[0]);
    } else {
        sendAndCreateCard("../images/plant1.jpg");  // No image provided, use default
    }    
});

        
    // -------------- مودال التعديل --------------
    document.getElementById("edit-form").addEventListener("submit", async function (e) {
        e.preventDefault();
    
        const id = document.getElementById("edit-id").value;
        const updatedPlant = {
            name: document.getElementById("edit-name").value,
            notes: document.getElementById("edit-notes").value,
            type: document.getElementById("edit-type").value,
            reminderInterval: parseInt(document.getElementById("edit-reminder").value),
        };
    
        // Check if a new image is selected
        const file = document.getElementById("edit-img-file").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function () {
                updatedPlant.image = reader.result;
                await submitEdit(id, updatedPlant);
            };
            reader.readAsDataURL(file);
        } else {
            await submitEdit(id, updatedPlant);
        }
    });

    async function submitEdit(id, updatedPlant) {
        try {
            const res = await fetch(`/api/auth/plants/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedPlant),
            });

            const data = await res.json();
            if (res.ok) {
                // Update UI
                const card = document.querySelector(`.diary-card[data-id="${id}"]`);
                card.querySelector(".plant-name").textContent = updatedPlant.name;
                card.querySelector(".plant-notes").innerHTML = `<strong>📝 ملاحظات:</strong> ${updatedPlant.notes}`;
                card.querySelector(".plant-type").textContent = updatedPlant.type;
                card.querySelector(".plant-reminder").textContent = `كل ${updatedPlant.reminderInterval} أيام`;
                if (updatedPlant.image) {
                    card.querySelector(".main-img").src = updatedPlant.image;
                }

                document.getElementById("edit-modal").style.display = "none";
                alert("✅ تم تحديث اليومية بنجاح");
            } else {
                alert("❌ فشل التحديث: " + data.msg);
            }
        } catch (err) {
            console.error("❌ Error updating plant:", err);
        }
    }

    
     
});

function fetchPlants() {
    fetch(`/api/auth/plants`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(res => res.json())
    .then(data => {
        data.forEach(plant => {
            createCard(plant); // render the plant card
            fetchPlantProgress(plant._id); // fetch & display progress images
        });
    })
    .catch(err => console.error("Error fetching plants:", err));
}




function renderProgressImages(progressImages, plantId) {
    const card = document.querySelector(`.diary-card[data-id="${plantId}"]`);
    if (!card) return console.warn("Card not found for plant ID:", plantId);
  
    const gallery = card.querySelector(".progress-gallery");
    if (!gallery) return console.warn("Gallery not found in card:", plantId);
  
    gallery.innerHTML = ""; // Clear old images first
  
    progressImages.forEach((image) => {
      const imgDiv = document.createElement("div");
      imgDiv.classList.add("progress-img");
      
      imgDiv.innerHTML = `
        <div class="progress-entry">
          <img src="${image.image}" alt="Progress Image">
          <p class="date-info">${new Date(image.date).toLocaleDateString('ar-EG')}</p>
          <button class="del-progress" data-imageid="${image._id}">🗑️</button>
        </div>
      `;
      gallery.appendChild(imgDiv);
  
      imgDiv.querySelector(".del-progress").addEventListener("click", async () => {
        const plantId = card.getAttribute("data-id");
        const imageId = imgDiv.querySelector(".del-progress").getAttribute("data-imageid");
  
        try {
          const res = await fetch(`/api/auth/plants/${plantId}/progress/${imageId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
          });
          
          if (!res.ok) {
            throw new Error("Failed to delete image from server");
          }
          
          imgDiv.remove();
          console.log("Image deleted successfully");
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      });
    });
  }

async function fetchPlantProgress(plantId) {
    try {
        const res = await fetch(`/api/auth/plants/${plantId}/progress`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!res.ok) throw new Error(`Error fetching plant progress: ${res.status}`);

        const data = await res.json();

        // Check if progressImages is an array before proceeding
        if (!Array.isArray(data.progressImages)) {
            console.error("progressImages is not an array:", data.progressImages);
            return;
        }

        renderProgressImages(data.progressImages, plantId);
    } catch (error) {
        console.error("Error fetching plant progress:", error);
    }
}
