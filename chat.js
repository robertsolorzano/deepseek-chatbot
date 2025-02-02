document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  // Configure marked to use highlight.js
  marked.setOptions({
    highlight: function(code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          return hljs.highlight(code, { language }).value;
        } catch (err) {
          console.error('Highlight.js error:', err);
        }
      }
      return code; // Use original code if language not found
    },
    langPrefix: 'hljs language-'
  });

  // Track think tag visibility state
  let showThinkTags = true;
  const thinkToggle = document.getElementById('think-toggle');
  thinkToggle.addEventListener('change', (e) => {
    showThinkTags = e.target.checked;
    document.querySelectorAll('.think-tag').forEach(tag => {
      tag.style.display = showThinkTags ? 'block' : 'none';
    });
  });

  // Debounce function to limit scroll calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounced scroll function
  const debouncedScroll = debounce(() => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    });
  }, 10);

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
        let accumulatedChars = 0;

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

                  // Only update DOM/scroll after accumulating some characters
                  accumulatedChars++;
                  if (accumulatedChars >= 10 || i === content.length - 1) {
                    messageDiv.innerHTML = marked.parse(fullMessage);
                    // Apply highlight.js to any new code blocks
                    messageDiv.querySelectorAll('pre code').forEach(block => {
                      hljs.highlightElement(block);
                    });
                    debouncedScroll();
                    accumulatedChars = 0;
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing JSON chunk:', e);
            }
          }
        }

        // final scroll to ensure we're at the bottom
        setTimeout(() => {
          chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: 'auto'
          });
        }, 10);

      } catch (error) {
        console.error('Error communicating with API:', error);
        addMessage("Sorry, there was an error processing your request.", 'bot');
      }
    }
  };

  sendButton.addEventListener('click', sendMessage);

  userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
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
      // Apply highlight.js to code blocks in the message
      messageDiv.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }

    chatBox.appendChild(messageDiv);
    debouncedScroll();
  }

  document.getElementById('user-input').addEventListener('input', function() {
    const sendButton = document.getElementById('send-btn');
    if (this.value.trim() !== '') {
      sendButton.classList.add('visible');
    } else {
      sendButton.classList.remove('visible');
    }
  });
});