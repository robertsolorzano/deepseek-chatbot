document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    sendButton.addEventListener('click', async () => {
        const message = userInput.value.trim();

        if (message) {
            addMessage(message, 'user');
            userInput.value = '';  // Clear input after sending

            // Send message to Ollama API and get the response
            try {
                const response = await fetch('http://localhost:11434/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'deepseek-r1:7b',  // Your model name
                        messages: [
                            { role: 'user', content: message } // Use the message as the user input
                        ],
                        stream: false
                    }),
                });

                // Check the status and log the response for debugging
                console.log('Response Status:', response.status);
                const data = await response.json();
                console.log('Response Data:', data);

                const botMessage = data.message.content || "Sorry, I didn't understand that.";

                // Show the bot's response
                addMessage(botMessage, 'bot');
            } catch (error) {
                console.error('Error communicating with Ollama API:', error);
            }
        }
    });

    // Function to add message to the chat window
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = message;
        chatBox.appendChild(messageDiv);

        // Scroll to the bottom to see the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Optionally, focus the input field when the user starts typing
    userInput.addEventListener('focus', () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});
