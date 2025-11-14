// Sign up functionality
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (!email || !password || !confirmPassword) {
            errorMessage.textContent = 'Please fill in all fields.';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match.';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        // Get existing users
        let users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            errorMessage.textContent = 'User already exists.';
            return;
        }

        // Add new user
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));

        errorMessage.textContent = '';
        alert('Sign up successful! Please log in.');
        window.location.href = 'index.html';
    });
}

// Login functionality
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        if (!email || !password) {
            errorMessage.textContent = 'Please enter email and password.';
            return;
        }

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check credentials
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userPassword', password); // Store password for API
            window.location.href = 'chatbot.html';
        } else {
            errorMessage.textContent = 'Invalid email or password.';
        }
    });
}

// Check login on chatbot page
if (window.location.pathname.includes('chatbot.html')) {
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'index.html';
    }
}

// Chat functionality
let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
const messages = [];

function addMessage(text, sender, isLoading = false) {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    if (isLoading) {
        messageDiv.className += ' loading';
        messageDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    } else {
        messageDiv.innerHTML = marked.parse(text);
    }
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    if (!isLoading) {
        messages.push({ text, sender });
        // Save chat history to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
    return messageDiv;
}



// Language translations
const translations = {
    en: {
        placeholder: "Type your message...",
        send: "Send",
        voice: "🎤",
        speak: "🔊"
    },
    hi: {
        placeholder: "अपना संदेश टाइप करें...",
        send: "भेजें",
        voice: "🎤",
        speak: "🔊"
    },
    mr: {
        placeholder: "तुमचा संदेश टाइप करा...",
        send: "पाठवा",
        voice: "🎤",
        speak: "🔊"
    }
};

function updateLanguage() {
    const lang = document.getElementById('languageSelect').value;
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    const trans = translations[lang];
    document.getElementById('messageInput').placeholder = trans.placeholder;
    document.getElementById('sendButton').textContent = trans.send;
}

// Voice functionality
let recognition;
let synthesis = window.speechSynthesis;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('messageInput').value = transcript;
        sendMessage(transcript);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
    };
}

function startVoiceRecognition() {
    if (recognition) {
        recognition.lang = currentLanguage === 'en' ? 'en-US' : currentLanguage === 'hi' ? 'hi-IN' : 'mr-IN';
        recognition.start();
    } else {
        alert('Speech recognition not supported in this browser.');
    }
}

function speakText(text) {
    if (synthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Use Hindi TTS agent for both Hindi and Marathi since they share similar phonetics
        utterance.lang = currentLanguage === 'en' ? 'en-US' : 'hi-IN';

        // Get available voices and select a suitable one for better tone
        const voices = synthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang.startsWith(utterance.lang) && (voice.name.includes('Female') || voice.name.includes('Google') || voice.default));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        } else {
            // Fallback to first voice matching lang
            const langVoice = voices.find(voice => voice.lang.startsWith(utterance.lang));
            if (langVoice) {
                utterance.voice = langVoice;
            }
        }

        synthesis.speak(utterance);
    } else {
        alert('Speech synthesis not supported in this browser.');
    }
}

// Advisory fetching (mock for now)
async function fetchAdvisory() {
    // Mock advisory - replace with real API if available
    return "Latest Advisory: Stay alert for weather updates. Follow local authorities.";
}

// Event listeners
if (document.getElementById('sendButton')) {
    document.getElementById('sendButton').addEventListener('click', function() {
        const message = document.getElementById('messageInput').value;
        if (message.trim()) {
            sendMessage(message);
        }
    });

    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const message = document.getElementById('messageInput').value;
            if (message.trim()) {
                sendMessage(message);
            }
        }
    });

    document.getElementById('voiceButton').addEventListener('click', startVoiceRecognition);

    document.getElementById('speakButton').addEventListener('click', function() {
        const lastBotMessage = messages.filter(m => m.sender === 'bot').pop();
        if (lastBotMessage) {
            speakText(lastBotMessage.text);
        }
    });

    document.getElementById('languageSelect').addEventListener('change', updateLanguage);

    document.getElementById('logoutButton').addEventListener('click', function() {
        localStorage.removeItem('loggedIn');
        // Keep all other data (userPassword, chatHistory, selectedLanguage)
        window.location.href = 'index.html';
    });

    // Initial language setup
    document.getElementById('languageSelect').value = currentLanguage;
    updateLanguage();

    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        history.forEach(msg => {
            addMessage(msg.text, msg.sender);
        });
    } else {
        // Load advisory on page load if no history
        fetchAdvisory().then(advisory => addMessage(advisory, 'bot'));
    }
}

async function sendMessage(message) {
    if (!message.trim()) {
        return; // Don't send empty messages
    }
    addMessage(message, 'user');
    const loadingMessage = addMessage('', 'bot', true);
    const userPassword = localStorage.getItem('userPassword');
    const systemPrompt = "You are a multilingual disaster-response assistant of india. Use only verified information. Prioritize official advisories. Give concise, stepwise actions for floods, cyclones, and heatwaves. No speculation, no invented data, no emotional content. Match the user’s language (EN/HI/MR). Avoid medical diagnosis; give only basic first-aid steps. If advisories exist, summarize them first, then provide clear actions for the user’s location. Respond in " + currentLanguage.toUpperCase() + ".";

    try {
        console.log('Sending request to API...');
        const response = await fetch(`https://ds-chatbot-api-platform.onrender.com/ai?query=${encodeURIComponent(message)}&model=gemini&id=${encodeURIComponent(userPassword)}&system_prompt=${encodeURIComponent(systemPrompt)}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('API response data:', data);
        const botResponse = data.response || 'Sorry, I could not process your request.';
        loadingMessage.remove();
        addMessage(botResponse, 'bot');
    } catch (error) {
        console.error('Error fetching response:', error);
        const fallbackResponse = 'Sorry, I could not process your request. Please try again.';
        loadingMessage.remove();
        addMessage(fallbackResponse, 'bot');
    }
    document.getElementById('messageInput').value = '';
}
