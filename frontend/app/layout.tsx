'use client';

import { ReactNode } from 'react';
import '../styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <title>Malla Académica - Prueba de Concepto</title>
        <meta name="description" content="Sistema de diseño de malla académica interactiva" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
