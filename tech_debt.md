# 🧾 Deuda Técnica (`tech_debt.md`)

Este documento detalla los puntos actuales de deuda técnica identificados en el proyecto para su eventual resolución.

---

## 1. ReModelar Relaciones entre Grafos
ReAjustar el modelado de grafos incluyendo las Resoluciones como Normas (Jurídicas), pues actualmente son entidades separadas (Resoluciones ≠ Normas)

## 2. Printear Logs
Agregar un logger para calcular tiempos, tokens consumidos, mostrar funciones completadas ( o errores ) y guardar provisionalmente la data como un filesystem como un .txt o en una base de datos como mongoDB

## 3. Mejorar Agent Router
Mejorar el router basado en búsquedas de grafos y semánticas: en un futuro implementar librerías como LangGraph o LangChain y separar el backend en tools usando MCP
