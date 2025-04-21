// --- DOM Elements ---
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusArea = document.getElementById('statusArea');

// --- Configuration ---
// !!! WARNING: Exposing API keys directly in frontend code is HIGHLY INSECURE! !!!
// !!! Replace with your actual API key ONLY for local, private testing.       !!!
// !!! For any shared or public use, build a backend proxy server.            !!!
const API_KEY = 'AIzaSyAsTWNzp8SXMjYGWgDPxQVeKg0MKcAjPyI'; // <-- PASTE YOUR KEY HERE FOR LOCAL TEST ONLY

// --- Use a current and valid model name ---
// 'gemini-1.5-pro-latest' is a powerful option (as of early 2025)
// You can also try 'gemini-1.5-flash-latest' for faster responses
// Always check Google AI documentation for the latest models.
const MODEL_NAME = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// --- Conversation History ---
// Stores the chat context to send to the API
let conversationHistory = [];

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (event) => {
    // Send message on Enter key, but allow Shift+Enter for new lines
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent adding a new line
        handleSendMessage();
    }
});

// --- Functions ---

/**
 * Adds a message to the chatbox UI.
 * @param {string} text The message content.
 * @param {'user' | 'bot'} sender Specifies if the message is from the user or the bot.
 */
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender); // adds 'message' and 'user'/'bot' class
    messageElement.textContent = text;
    chatBox.appendChild(messageElement);
    // Scroll to the bottom to show the latest message
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Handles sending the user's message and fetching the bot's response.
 */
async function handleSendMessage() {
    const userText = userInput.value.trim();
    if (!userText) return; // Don't send empty messages

    // Display user message immediately
    addMessage(userText, 'user');

    // Add user message to conversation history BEFORE sending to API
    conversationHistory.push({ role: 'user', parts: [{ text: userText }] });

    // Clear input field and show thinking status
    userInput.value = '';
    statusArea.textContent = 'Gemini is thinking...';
    sendButton.disabled = true; // Disable button while processing

    try {
        // Prepare the request payload using the conversation history
        const requestBody = {
            contents: conversationHistory,
            // Optional: Add generation configuration
            // generationConfig: {
            //   temperature: 0.7,
            //   maxOutputTokens: 1000,
            // },
            // Optional: Add safety settings if needed
            // safetySettings: [
            //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            //   // Add other categories as needed
            // ]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            // Try to get error details from the response body
            let errorDetails = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.error?.message || 'Unknown API error'}`;
                console.error('API Error Response:', errorData);
            } catch (e) {
                // If parsing error response fails, use the status text
                errorDetails += ` - ${response.statusText}`;
            }
             // If the API rejects the request, remove the user message that caused it from history
            conversationHistory.pop();
            throw new Error(errorDetails);
        }

        const data = await response.json();

        // Extract text response - structure may vary slightly
        let botResponseText = 'Sorry, I could not process that response.'; // Default
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            botResponseText = data.candidates[0].content.parts[0].text;
            // Add bot response to history ONLY if successful
             conversationHistory.push({ role: 'model', parts: [{ text: botResponseText }] });
        } else {
            console.warn("Could not extract valid text from response:", data);
             // If response format is weird, remove the preceding user message from history
            conversationHistory.pop();
            // Optionally add a specific error message to UI
            botResponseText = "Received an unexpected response format.";
        }

        addMessage(botResponseText, 'bot');

    } catch (error) {
        console.error('Failed to fetch from Gemini API:', error);
        addMessage(`Error: ${error.message}`, 'bot');
        // Keep the user message in history even on error, or pop it if preferred:
        // conversationHistory.pop();
    } finally {
        // Clear status and re-enable button regardless of success or failure
        statusArea.textContent = '';
        sendButton.disabled = false;
        userInput.focus(); // Put focus back on input field
    }
}

// --- Initial Setup ---
// Add the initial greeting from the bot to the UI when the page loads
// (Don't add this initial greeting to the conversationHistory array)
// addMessage("Hi! How can I help you today?", 'bot'); // Moved initial message to HTML

// --- Basic Voice Input/Output (Conceptual - Requires more setup & Permissions) ---
/*
// (Keep the commented-out voice code here if you want to implement it later)
// ... Your existing commented-out voice code ...
*/
