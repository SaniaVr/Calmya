document.getElementById('send-btn').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    console.log('User input:', userInput);  // Log the user input
    
    if (userInput.trim() !== '') {
      const chatBox = document.getElementById('chat-box');
      
      // Append the user's message
      const userMsg = document.createElement('div');
      userMsg.classList.add('user-msg');
      userMsg.textContent = userInput;
      chatBox.appendChild(userMsg);
      
      // Clear input field
      document.getElementById('user-input').value = '';
      
      // Scroll to the bottom of the chatbox
      chatBox.scrollTop = chatBox.scrollHeight;
  
      try {
        // Send message to server
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userInput }), // Send user input to the backend
        });
  
        const data = await response.json();  // Get response from server
        console.log('Bot response:', data.reply);  // Log the response from the bot
  
        // If the response from the server is valid
        if (data && data.reply) {
          // Append the bot's response
          const botMsg = document.createElement('div');
          botMsg.classList.add('bot-msg');
          botMsg.textContent = data.reply;  // Set the response text from the server
          chatBox.appendChild(botMsg);
        } else {
          // Handle empty or unexpected responses
          const errorMsg = document.createElement('div');
          errorMsg.classList.add('bot-msg');
          errorMsg.textContent = "Sorry, I couldn't understand that.";
          chatBox.appendChild(errorMsg);
        }
  
        // Scroll to the bottom of the chatbox to show new message
        chatBox.scrollTop = chatBox.scrollHeight;
      } catch (error) {
        // If there's an error, show this message
        const errorMsg = document.createElement('div');
        errorMsg.classList.add('bot-msg');
        errorMsg.textContent = "Sorry, I'm having trouble responding right now.";
        chatBox.appendChild(errorMsg);
        
        console.error('Error:', error);  // Log the error for debugging
      }
    }
  });
  