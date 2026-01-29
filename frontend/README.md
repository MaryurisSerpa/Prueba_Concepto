# Frontend - Malla Académica

Interfaz moderna para diseño interactivo de malla académica.

## Características

- **Drag & Drop**: Arrastra cursos al canvas
- **Validación en Tiempo Real**: Análisis automático de prerequisitos
- **Estadísticas**: Panel de control con análisis de carga
- **Responsive**: Adaptado para desktop

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Accede en `http://localhost:3000`

## Build Producción

```bash
npm run build
npm run start
```

## Estructura

- `app/` - App Router de Next.js
- `components/` - Componentes React reutilizables
- `lib/` - Utilidades y tipos TypeScript
- `styles/` - Estilos CSS y Tailwind

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Componentes Principales

- **MallaDesign**: Componente principal con drag & drop
- **CursosDisponibles**: Panel de cursos
- **CursoItem**: Tarjeta de curso individual
- **Estadisticas**: Panel de análisis

## Dependencias Clave

- **React 18**: Framework UI
- **Next.js 14**: Framework React
- **Tailwind CSS**: Estilos
- **axios**: Cliente HTTP
