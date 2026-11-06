# Cap-For · ITSQMET

Aplicación de escritorio Electron para administrar capacitación y formación docente.

## Estado

Primera versión de desarrollo: biblioteca documental local, importación de PDF, filtros, actualización de estado, descarga individual y descarga masiva en ZIP.

Se trabaja **directamente en main**. Las plantillas institucionales, el generador de documentos y la conexión Firebase `cap-form-1c7c5` se incorporarán progresivamente.

## Uso

En Windows, instala Node.js y ejecuta:

```bash
npm install
npm start
```

Los PDF se conservan **en el almacenamiento privado de Electron del equipo** y no se publican en GitHub.

**Seguridad:** una cédula no es un mecanismo de autenticación. Antes de publicar portales que lean documentos personales desde Firebase, se deberá habilitar una comprobación segura de identidad y reglas restrictivas de Firestore/Storage.
