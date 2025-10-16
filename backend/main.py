from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv
import logging

from knowledge_base import knowledge_base

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация Gemini с проверкой
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    logger.warning("GEMINI_API_KEY не найден в переменных окружения. Gemini будет отключен.")
    model = None
else:
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-flash-2.5')
        logger.info("Gemini успешно инициализирован")
    except Exception as e:
        logger.error(f"Ошибка инициализации Gemini: {str(e)}")
        model = None

class Message(BaseModel):
    text: str

def preprocess_text(text: str) -> str:
    """Очистка и нормализация текста"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def find_in_knowledge_base(user_input: str) -> str:
    user_input = preprocess_text(user_input)
    
    # Проверка приветствий
    greeting_words = ['привет', 'здравствуй', 'здравствуйте', 'начать', 'start', 'hello', 'hi']
    if any(word in user_input for word in greeting_words) and len(user_input.split()) < 4:
        return knowledge_base["приветствия"]["default"]
    
    # Проверка общих вопросов
    general_questions = ['что ты умеешь', 'что можешь', 'твои возможности', 'функции']
    if any(question in user_input for question in general_questions):
        return "Я могу отвечать на вопросы о работе наставника: термины, расписание, выплаты, Planfix, воркшопы и многое другое. Попробуйте спросить о чем-то конкретном!"
    
    # Поиск в терминах
    for term, definition in knowledge_base["термины"].items():
        if term in user_input:
            return f"📚 {term.upper()}: {definition}"
    
    # Поиск в вопросах
    best_match = None
    max_matches = 0
    
    for question, answer in knowledge_base["вопросы"].items():
        question_words = set(preprocess_text(question).split())
        input_words = set(user_input.split())
        matches = len(question_words.intersection(input_words))
        
        if matches > max_matches and matches > 0:
            max_matches = matches
            best_match = answer
    
    if best_match:
        return best_match
    
    return None

@app.post("/chat")
async def chat_endpoint(message: Message):
    logger.info(f"Получен вопрос: {message.text}")
    
    # Сначала проверяем базу знаний
    kb_response = find_in_knowledge_base(message.text)
    
    if kb_response:
        logger.info("Ответ найден в базе знаний")
        return {"response": kb_response}
    
    # Если в базе нет ответа и Gemini доступен, используем его
    if model is not None:
        try:
            logger.info("Используем Gemini для генерации ответа")
            prompt = f"""Ты - помощник для наставников в образовательной компании CompanyName. 
            Отвечай кратко и по делу на русском языке только по рабочим вопросам.
            
            Контекст для ответа:
            - CompanyName - образовательная компания
            - Наставники проводят индивидуальные занятия со студентами
            - Работа строится через Planfix
            - Есть грейды: юнлинг, джедай-падаван, джедай-рыцарь, джедай-мастер, гранд-мастер
            - Важные термины: ОС (обратная связь), слот (время занятия), воркшопы (КК ВШ, ПП ВШ, АД ВШ)
            
            Если вопрос не по работе или ты не знаешь ответ - вежливо откажись отвечать.
            
            Вопрос: {message.text}
            
            Краткий ответ:"""
            
            response = model.generate_content(prompt)
            if response.text:
                logger.info("Успешный ответ от Gemini")
                return {"response": response.text}
            else:
                logger.warning("Пустой ответ от Gemini")
                raise Exception("Пустой ответ")
                
        except Exception as e:
            logger.error(f"Ошибка при обращении к Gemini: {str(e)}")
            # Продолжаем к fallback ответу
    
    # Fallback ответ
    fallback_responses = [
        "Извините, я не нашел ответа на этот вопрос в базе знаний. Попробуйте переформулировать вопрос или обратитесь к кураторам в бот.",
        "Этот вопрос пока не добавлен в мою базу знаний. Вы можете задать его кураторам через бот.",
        "К сожалению, я не могу ответить на этот вопрос. Обратитесь, пожалуйста, к кураторам для получения помощи."
    ]
    
    import random
    return {"response": random.choice(fallback_responses)}

@app.get("/health")
async def health_check():
    """Проверка статуса API"""
    status = {
        "status": "healthy",
        "gemini_available": model is not None,
        "knowledge_base_entries": len(knowledge_base["термины"]) + len(knowledge_base["вопросы"])
    }
    return status

@app.get("/")
async def root():
    return {"message": "Chat API for CompanyName is running", "version": "1.0"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
