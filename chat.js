document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
  
    sendButton.addEventListener('click', async () => {
      const message = userInput.value.trim();
      if (message) {
        addMessage(message, 'user');
        userInput.value = '';
        try {
          const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'deepseek-r1:1.5b',
              messages: [{ role: 'user', content: message }],
              stream: false
            }),
          });
          console.log('Response Status:', response.status);
          const data = await response.json();
          console.log('Response Data:', data);
          const botMessage = (data.message?.content || "Sorry, I didn't understand that.");
          const cleanMessage = botMessage.replace(/<think>.*?<\/think>/gis, '').trim();
          typeMessage(cleanMessage, 'bot');
        } catch (error) {
          console.error('Error communicating with API:', error);
        }
      }
    });
  
    function addMessage(message, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
      
      if (sender === 'user') {
        messageDiv.textContent = message;
      } else {
        messageDiv.innerHTML = marked.parse(message);
      }
      
      chatBox.appendChild(messageDiv);
      scrollToBottom();
    }
  
    // Smooth scroll function
    function scrollToBottom() {
      const scrollOptions = {
        top: chatBox.scrollHeight,
        behavior: 'smooth'
      };
      chatBox.scrollTo(scrollOptions);
    }
  
    function typeMessage(message, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
      chatBox.appendChild(messageDiv);
  
      let i = 0;
      let currentMessage = '';
      
      const typingInterval = setInterval(() => {
        currentMessage += message[i] || '';
        messageDiv.innerHTML = marked.parse(currentMessage);
        
        // Scroll after each character update
        scrollToBottom();
        
        i++;
        if (i >= message.length) {
          clearInterval(typingInterval);
        }
      }, 20);
    }
  });