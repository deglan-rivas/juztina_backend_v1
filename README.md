# 🧠 Graph RAG - Resoluciones Judiciales

Este proyecto implementa un sistema RAG (Retrieval-Augmented Generation) que combina **Neo4j (grafos)**, **MongoDB/Qdrant (vector semántico)** y un LLM de Google Gemini para responder preguntas complejas sobre resoluciones judiciales.

---

## 🚀 Pasos para levantar el demo

### 1. Crear una carpeta vacía

```bash
mkdir demo && cd demo
````

### 2. Clonar el repositorio

```bash
git clone --depth=3 https://github.com/deglan-rivas/juztina_backend_v1.git .
```

### 3. Instalar las dependencias

```bash
pnpm install
```

> Asegúrate de tener instalado `pnpm`. Si no lo tienes:

```bash
npm install -g pnpm
```

### 4. Crear archivo `.env` con tu API Key de Gemini

```bash
cp .env.template .env
```

Edita el archivo `.env` y coloca tu API Key de Gemini en la variable `GEMINI_API_KEY`.

---

## 🧱 Bases de datos

### 5. Levantar los contenedores con Docker

```bash
docker compose up -d
```

Esto inicia:

* 🧠 Neo4j (base de grafos)
* 📦 MongoDB (base documental)
* 📈 Qdrant (base vectorial)

---

## 🛠️ Backend y Seed

### 6. Levantar el proyecto en modo desarrollo

```bash
pnpm start:dev
```

### 7. Poblar las bases de datos con el seed

Puedes hacerlo con:

#### cURL

```bash
curl -X POST http://localhost:3000/seed/populate
```

#### o Postman / Insomnia

Método: `POST`
URL: `http://localhost:3000/seed/populate`

---

## 💬 Probar una consulta compleja al Graph RAG

### 8. Ejecutar un prompt de ejemplo:

```bash
curl --request POST \
  --url http://localhost:3000/gpt/ask-graph-rag \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/11.0.2' \
  --data '{
    "prompt": "¿Qué resoluciones del 2025 que tienen competencia en Lima citan normas de tipo '\''Memorando'\''? y qué mencionan sobre el “plan estratégico”?"
  }'
```

---

## 🧹 Apagar todo

### 9. Cerrar backend y contenedores

Presiona `Ctrl + C` para apagar el backend.

Luego ejecuta:

```bash
docker compose down
```

---

### 10. Eliminar la carpeta `demo`

```bash
cd ..
rm -rf demo
docker volume rm graph_rag_resoluciones_graph_mongo_data graph_rag_resoluciones_neo4j_data graph_rag_resoluciones_qdrant_data
```

---

## 📌 Requisitos

* Node.js >= 18.x
* pnpm >= 8.x
* Docker y Docker Compose
* Cuenta con acceso a Google Gemini API (y su API Key)

---

## 🧠 Créditos

Este sistema fue desarrollado como una prueba de concepto para preguntas complejas sobre resoluciones administrativas del Poder Judicial del Perú.