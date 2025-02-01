document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();

        if (message) {
            addMessage(message, 'user');
            userInput.value = '';  // Clear input after sending

            // Placeholder for chatbot response
            setTimeout(() => {
                addMessage("This is a response from the chatbot.", 'bot');
            }, 1000);
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

    //focus the input field when user starts typing
    userInput.addEventListener('focus', () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});
