class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.apiUrl = 'http://localhost:8000';
        this.createWidget();
    }

    createWidget() {
        // Создаем контейнер для виджета
        this.chatContainer = document.createElement('div');
        this.chatContainer.innerHTML = `
            <div id="chatWidget" style="
                position: fixed; 
                bottom: 20px; 
                right: 20px; 
                z-index: 10000;
            ">
                <!-- Кнопка чата -->
                <div id="chatButton" style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    color: white;
                    font-size: 24px;
                    transition: transform 0.3s ease;
                ">💬</div>

                <!-- Окно чата -->
                <div id="chatWindow" style="
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    display: none;
                    flex-direction: column;
                    border: 1px solid #e2e8f0;
                    z-index: 10001;
                ">
                    <!-- Заголовок -->
                    <div style="
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 15px 15px 0 0;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <div style="font-size: 20px;">🤖</div>
                        <div>
                            <div>Помощник CompanyName</div>
                            <div style="font-size: 12px; opacity: 0.9;">Готов ответить на ваши вопросы</div>
                        </div>
                    </div>
                    
                    <!-- Сообщения -->
                    <div id="chatMessages" style="
                        flex: 1;
                        padding: 15px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        background: #f7fafc;
                    "></div>
                    
                    <!-- Поле ввода -->
                    <div style="padding: 15px; border-top: 1px solid #e2e8f0; background: white; border-radius: 0 0 15px 15px;">
                        <div style="display: flex; gap: 10px;">
                            <input 
                                type="text" 
                                id="messageInput" 
                                placeholder="Задайте вопрос о работе..."
                                style="
                                    flex: 1;
                                    padding: 12px 15px;
                                    border: 1px solid #cbd5e0;
                                    border-radius: 25px;
                                    outline: none;
                                    font-size: 14px;
                                "
                            >
                            <button 
                                id="sendButton"
                                style="
                                    padding: 12px 20px;
                                    background: #667eea;
                                    color: white;
                                    border: none;
                                    border-radius: 25px;
                                    cursor: pointer;
                                    font-size: 14px;
                                "
                            >➤</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Добавляем виджет в тело документа
        document.body.appendChild(this.chatContainer);

        // Привязываем обработчики событий
        this.attachEventListeners();

        // Добавляем приветственное сообщение
        setTimeout(() => {
            this.addMessage("Привет! Я помощник для наставников CompanyName. Могу ответить на вопросы о работе, расписании, выплатах и многом другом. Чем могу помочь?", "bot");
        }, 1000);
    }

    attachEventListeners() {
        const chatButton = document.getElementById('chatButton');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Обработчик для кнопки чата
        if (chatButton) {
            chatButton.addEventListener('click', () => {
                console.log('Chat button clicked');
                this.toggleChat();
            });
        }

        // Обработчик для поля ввода (Enter)
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Обработчик для кнопки отправки
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    toggleChat() {
        console.log('toggleChat called, current state:', this.isOpen);
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chatWindow');
        const chatButton = document.getElementById('chatButton');
        
        if (chatWindow) {
            chatWindow.style.display = this.isOpen ? 'flex' : 'none';
            console.log('Chat window display set to:', chatWindow.style.display);
        }
        
        if (chatButton) {
            chatButton.style.transform = this.isOpen ? 'scale(1.1)' : 'scale(1)';
        }
        
        if (this.isOpen) {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }
        
        const messageElement = document.createElement('div');
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div style="
                align-self: ${sender === 'user' ? 'flex-end' : 'flex-start'};
                background: ${sender === 'user' ? '#667eea' : 'white'};
                color: ${sender === 'user' ? 'white' : '#2d3748'};
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 85%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border: ${sender === 'bot' ? '1px solid #e2e8f0' : 'none'};
            ">
                <div>${text}</div>
                <div style="
                    font-size: 10px; 
                    opacity: 0.7; 
                    margin-top: 5px; 
                    text-align: ${sender === 'user' ? 'right' : 'left'};
                ">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Показываем индикатор загрузки
        const loadingId = 'loading-' + Date.now();
        this.addMessage("Думаю... 🤔", "bot");

        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Удаляем сообщение "Думаю" и добавляем ответ
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer && messagesContainer.lastChild) {
                messagesContainer.removeChild(messagesContainer.lastChild);
            }
            
            this.addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Error sending message:', error);
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer && messagesContainer.lastChild) {
                messagesContainer.removeChild(messagesContainer.lastChild);
            }
            
            this.addMessage("Извините, произошла ошибка соединения с сервером. Попробуйте позже или обратитесь к кураторам в бот.", "bot");
        }
    }
}

// Инициализация виджета
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatWidget();
    });
} else {
    new ChatWidget();
}