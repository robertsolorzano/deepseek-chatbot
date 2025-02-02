document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  // Track think tag visibility state
  let showThinkTags = true;
  const thinkToggle = document.getElementById('think-toggle');
  thinkToggle.addEventListener('change', (e) => {
    showThinkTags = e.target.checked;
    document.querySelectorAll('.think-tag').forEach(tag => {
      tag.style.display = showThinkTags ? 'block' : 'none';
    });
  });

  // Function to handle sending a message
  const sendMessage = async () => {
    const message = userInput.value.trim();
    if (message) {
      addMessage(message, 'user');
      userInput.value = '';

      try {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-r1:7b',
            messages: [{ role: 'user', content: message }],
            stream: true
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('bot-message');
        chatBox.appendChild(messageDiv);

        let fullMessage = '';
        let isInThinkTag = false;
        let hasThinkContent = false;
        let thinkStartIndex = -1;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const parsedChunk = JSON.parse(line);
              if (parsedChunk.message?.content) {
                const content = parsedChunk.message.content;

                // Process content character by character to handle think tags
                for (let i = 0; i < content.length; i++) {
                  if (content.substr(i, 7) === '<think>') {
                    isInThinkTag = true;
                    hasThinkContent = false;
                    thinkStartIndex = fullMessage.length;
                    fullMessage += `<div class="think-tag" style="display: ${showThinkTags ? 'block' : 'none'}">💭 `;
                    i += 6;
                    continue;
                  }
                  if (content.substr(i, 8) === '</think>') {
                    isInThinkTag = false;
                    if (!hasThinkContent) {
                      // Remove empty think tag
                      fullMessage = fullMessage.substring(0, thinkStartIndex);
                    } else {
                      fullMessage += '</div>';
                    }
                    i += 7;
                    continue;
                  }

                  if (isInThinkTag) {
                    if (!hasThinkContent && content[i].trim()) {
                      hasThinkContent = true;
                    }
                    fullMessage += content[i];
                  } else {
                    fullMessage += content[i];
                  }

                  messageDiv.innerHTML = marked.parse(fullMessage);
                  scrollToBottom();
                }
              }
            } catch (e) {
              console.error('Error parsing JSON chunk:', e);
            }
          }
        }

      } catch (error) {
        console.error('Error communicating with API:', error);
        addMessage("Sorry, there was an error processing your request.", 'bot');
      }
    }
  };

  // Event listener for the send button click
  sendButton.addEventListener('click', sendMessage);

  // Event listener for the Enter key press in the textarea
  userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line
      sendMessage();
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

  function scrollToBottom() {
    const scrollOptions = {
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    };
    chatBox.scrollTo(scrollOptions);
  }
});
