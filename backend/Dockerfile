FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Assicurati che il tuo file Python si chiami main.py (altrimenti cambia 'main:app')
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]