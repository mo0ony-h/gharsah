document.addEventListener('DOMContentLoaded', () => {
  const userInput = document.getElementById('userInput');
  const sendBtn = document.querySelector('.send-btn'); 
  const loadingIndicator = document.getElementById('loadingIndicator');

  sendBtn.addEventListener('click', () => handleUserInput(userInput, loadingIndicator));
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput(userInput, loadingIndicator);
  });
});

async function handleUserInput(inputElement, loader) {
    const message = inputElement.value.trim();
    if (!message) return;
  
    // Show loading indicator
    loader.style.display = 'block';
    inputElement.disabled = true;
  
    try {
      // Add user's message
      addMessage(message, 'user-msg');
      
      // Get bot response
      const response = await getBotResponse(message);
      
      // Add bot's message
      addMessage(response, 'bot-msg');
      
    } catch (error) {
      addMessage('عذراً، حدث خطأ في الاتصال بالخدمة', 'bot-msg');
      console.error('Error:', error);
    } finally {
      // Hide loading indicator
      loader.style.display = 'none';
      inputElement.disabled = false;
      inputElement.value = '';
    }
}

function addMessage(content, className) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.innerHTML = `<p>${content}</p>`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getBotResponse(userMessage) {
  const sessionID = `session_${Date.now()}`;
  const url = `https://your-botpress-server-url/webchat/message`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: userMessage,
        conversationId: sessionID
      })
    });

    const data = await response.json();
    return data.text || 'عذراً، لا أستطيع الاستجابة الآن';

  } catch (error) {
    console.error('API Error:', error);
    return 'عذراً، لا أستطيع الاستجابة الآن';
  }
}
