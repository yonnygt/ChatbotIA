ROL: PRINCIPAL SOFTWARE ARCHITECT & UI/UX DESIGNER (Claude Opus 4.5 Thinking)

Misión: Construir "ButcherAI", una PWA de próxima generación para carnicerías.
Filosofía: "Humanidad Digital". La app no se siente como un formulario, sino como una conversación fluida con un experto, utilizando voz bidireccional (Hablar y Escuchar) y una estética visual premium ("Stitch Style").

1. SISTEMA DE DISEÑO (ESTRICTO - "Stitch Style")

El proyecto debe replicar exactamente la estética proporcionada. Configura Tailwind CSS con estos valores obligatorios:

Tipografía: 'Plus Jakarta Sans' (Google Fonts).
Iconografía: 'Material Symbols Outlined' (Google Fonts).

Tailwind Config (Copiar e Implementar):

theme: {
  extend: {
    colors: {
      "primary": "#13ec5b",           // Verde Neón Stitch
      "primary-dark": "#0eb545",
      "primary-light": "#e0fde8",
      "background-light": "#f6f8f6",  // Blanco humo
      "background-dark": "#102216",   // Verde noche profundo
      "surface-light": "#ffffff",
      "surface-dark": "#1a3324",      // Verde bosque oscuro
      "surface-highlight": "#23482f", // Para bordes/inputs en dark mode
      "text-main": "#0d1b12",
      "text-secondary": "#4c9a66",
      "text-inverse": "#ffffff"
    },
    borderRadius: {
      "DEFAULT": "0.25rem",
      "lg": "0.5rem",
      "xl": "0.75rem",
      "2xl": "1rem",
      "3xl": "1.5rem", // Usado en tarjetas grandes
      "full": "9999px"
    },
    boxShadow: {
      'soft': '0 4px 20px -2px rgba(19, 236, 91, 0.15)',
      'glow': '0 0 15px rgba(19, 236, 91, 0.4)',
    },
    animation: {
      'scan': 'scan 2s infinite linear', // Para el scanner QR
    }
  }
}


Reglas de UI Mobile-First:

Navegación: Sticky Bottom Navigation con iconos Material Symbols.

Modo Oscuro: Soporte nativo darkMode: "class". Por defecto usar dark mode para una apariencia premium.

Tarjetas: Uso de backdrop-blur y bordes sutiles (border-primary/10).

2. STACK TECNOLÓGICO (VANILLA & ROBUSTO - GOOGLE EDITION)

Tú (Claude) eres el responsable de definir la estructura de carpetas y herramientas auxiliares, pero debes respetar estos pilares:

Core: Next.js 16+ (App Router, Turbopack).

Lenguaje: TypeScript (Strict Mode).

Base de Datos: PostgreSQL (Vanilla/Dockerizable). NO usar BaaS propietarios (Nada de Supabase/Firebase).

ORM: Drizzle ORM (Por su ligereza y tipado).

State Server: TanStack Query v5 (Para polling y caché).

State Client: Zustand (Para el estado del reproductor de audio y grabadora).

Cache Efímera: Upstash Redis (Solo para tokens de QR y sesiones temporales).

3. CORE IA: MOTOR MULTIMODAL (GOOGLE GEMINI STACK)

Esta es la característica estrella. Usaremos el poder multimodal de Gemini para reemplazar componentes externos.

A. Speech-to-Text (STT) - "El Oído"

Implementación: API Route /api/voice/transcribe.

Tecnología: Gemini 1.5 Flash.

Por qué: Gemini 1.5 es nativamente multimodal. No necesitamos convertir audio a texto con una API separada; podemos enviar el Blob de audio directamente al modelo con el prompt: "Transcribe esto y extrae la intención del pedido".

UX:

Botón de micrófono flotante grande (FAB) con animación de "ondas" al grabar.

Soporte para "Hold to record" (mantener presionado) y "Tap to toggle" (tocar para empezar/parar).

Feedback háptico al iniciar/terminar grabación.

B. Text-to-Speech (TTS) - "La Voz"

Implementación: API Route /api/voice/speak.

Tecnología: Google Cloud Text-to-Speech (Voces "Journey" o "Neural2").

Nota: Estas voces ofrecen la entonación más natural del mercado para español.

Comportamiento:

Cuando el Chatbot responde, genera audio automáticamente.

Reproducción en streaming (Buffer) para minimizar latencia.

Visualizador de audio simple mientras el bot habla (barras animadas en color #13ec5b).

Opción para silenciar (Mute toggle) visible en el header.

4. GESTIÓN DE BASE DE DATOS (MOCK/LOCAL)

Dado que estamos en un entorno de generación:

Conexión: Crea un archivo src/lib/db.ts preparado para conectar a una URL de Postgres estándar (DATABASE_URL).

Inicialización: Genera un archivo script_init_db.sql en la raíz. Este archivo debe contener todo el SQL DDL (CREATE TABLE...) para levantar la base de datos manualmente.

Tablas necesarias: products, orders (con jsonb para items), order_items, qr_sessions.

5. ESTRUCTURA Y FLUJO SOLICITADO

Por favor, estructura el proyecto para cubrir los siguientes módulos basados en los diseños HTML proporcionados:

Módulo Cliente (Chat Order):

Vista tipo chat (WhatsApp/Telegram style) pero con tarjetas de productos enriquecidas (imágenes, precios).

Input multimodal (Texto + Audio).

Header con "Tiempo Estimado" y estado del pedido.

Módulo Empleado (Dashboard & Inventory):

Gestión de pedidos (Kanban: Pendiente -> Preparando -> Listo).

Gestión de Stock rápida (Toggle switches para marcar "Agotado").

Scanner QR (usando la cámara del dispositivo) para validar entregas.

Módulo Favoritos:

Tarjetas grandes con imágenes de fondo para "Pedidos Frecuentes" (ej: "Asado del Domingo").

Lógica para "Repetir Pedido" con un click.

6. INSTRUCCIÓN DE EJECUCIÓN PARA CLAUDE

Analiza los requisitos visuales y la paleta de colores.

Define la estructura de carpetas óptima para Next.js 16.

Genera el código para:

Configuración de Tailwind y Tipografía.

Cliente de Base de Datos (Drizzle) y SQL de inicialización.

Hooks personalizados para STT (useGeminiRecorder) y TTS (useGoogleTTS).

Componentes UI clave (ChatBubble, ProductCard, NavBar).

Páginas principales (page.tsx para chat, /dashboard para empleados).

¡Adelante, construye la carnicería del futuro con el poder de Google Gemini!