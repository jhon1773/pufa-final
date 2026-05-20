const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } = require('docx');

const reportDir = path.join(__dirname, '..', 'reportes');
const outputPath = path.join(reportDir, 'seguimiento_practica_pufa.docx');

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const semanas = [
  'Semana del 16 al 20 de marzo: Se dio inicio al desarrollo del backend. Se estructuro la base del proyecto en NestJS, la configuracion inicial de TypeORM y las primeras validaciones de conexion a base de datos.',
  'Semana del 23 al 27 de marzo: Se implementaron modulos base de autenticacion y registro. Se trabajo sobre DTOs, controladores y validacion de datos para el flujo de usuarios.',
  'Semana del 30 de marzo al 3 de abril: Se avanzo con entidades y relaciones principales (proyectos y tramites), ajustando el modelo de datos para soportar la creacion y vinculacion correcta.',
  'Semana del 6 al 10 de abril: Se desarrollo la gestion de documentos: carga, listado y descarga, incluyendo almacenamiento en servidor y hash de integridad.',
  'Semana del 13 al 17 de abril: Se agrego la generacion del recibo en PDF para tramites, con endpoint de descarga para uso desde la interfaz.',
  'Semana del 20 al 24 de abril: Se integro frontend con backend en formularios criticos, corrigiendo payloads y mapeos de campos para registro y creacion de tramites.',
  'Semana del 27 de abril al 1 de mayo: Se fortalecio el modulo administrativo para la gestion de imagenes de locaciones (subir, listar, eliminar, reordenar) y se corrigieron errores de modal.',
  'Semana del 4 al 8 de mayo: Se completaron mejoras de portafolio proveedor (servicios y galeria), visualizacion de tramites en detalle de proyecto y ajuste del script de arranque productivo.',
];

const capturas = [
  'Login e ingreso: pantalla de inicio de sesion centrada (public/iniciar-sesion/index.html).',
  'Registro: formulario completo y mensaje de confirmacion de alta (public/registro/index.html).',
  'Crear tramite: seleccion de locacion existente y seccion de adjuntos (public/crear-tramite/index.html).',
  'Detalle de tramite: listado de documentos y boton de descarga de recibo PDF (public/detalle-tramite/index.html).',
  'Detalle de proyecto: seccion de tramites asociados al proyecto (public/detalle-proyecto/index.html).',
  'Crear proyecto: selector de servicio del proveedor y carga de documentos (public/crear-proyecto/index.html).',
  'Administracion: modal de imagenes de locacion con carga y gestion (public/admin/admin-4.html).',
  'Proveedor/Portafolio: bloques de servicios y galeria con acciones de agregar (public/proveedor/proveedor-2.html).',
];

const imagenesFront = [
  {
    file: '1.jpg',
    caption: 'Imagen 14. Portada visual para la pagina de inicio del portal.',
  },
  {
    file: '2.jpg',
    caption: 'Imagen 15. Imagen de apoyo para la seccion institucional del frontend.',
  },
  {
    file: '3.jpeg',
    caption: 'Imagen 16. Imagen de apoyo para formularios de registro y presentacion del sistema.',
  },
  {
    file: '4.jpg',
    caption: 'Imagen 17. Imagen panoramica para secciones de proyectos y tramites.',
  },
  {
    file: '5.jpg',
    caption: 'Imagen 18. Imagen de apoyo para el portal de contenidos y galeria visual.',
  },
];

function imageParagraph(fileName) {
  const imagePath = path.join(__dirname, '..', 'imgs', fileName);
  const imageBuffer = fs.readFileSync(imagePath);

  return new Paragraph({
    children: [
      new ImageRun({
        data: imageBuffer,
        transformation: { width: 600, height: 338 },
      }),
    ],
  });
}

const children = [
  new Paragraph({ text: 'Seguimiento de Trabajo - Proyecto PUFA', heading: HeadingLevel.TITLE }),
  new Paragraph({ text: 'Fecha de elaboracion: 07 de mayo de 2026' }),
  new Paragraph({ text: '' }),
  new Paragraph({ text: '1. Seguimiento semanal', heading: HeadingLevel.HEADING_1 }),
  ...semanas.flatMap((s) => [
    new Paragraph({
      children: [new TextRun({ text: s })],
      bullet: { level: 0 },
    }),
    new Paragraph({ text: '' }),
  ]),
  new Paragraph({ text: '2. Evidencias visuales del frontend', heading: HeadingLevel.HEADING_1 }),
  ...imagenesFront.flatMap((imagen) => [
    imageParagraph(imagen.file),
    new Paragraph({ text: imagen.caption, alignment: 'center' }),
    new Paragraph({ text: '' }),
  ]),
  new Paragraph({ text: '3. Capturas recomendadas por apartado', heading: HeadingLevel.HEADING_1 }),
  ...capturas.map((c, idx) => new Paragraph({ text: `${idx + 1}. ${c}` })),
  new Paragraph({ text: '' }),
  new Paragraph({ text: '4. Evidencias tecnicas sugeridas', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: 'Complementar con capturas de endpoints y archivos clave en backend: src/modules/documentos/documentos.controller.ts, src/modules/tramites/tramites.controller.ts, src/app.controller.ts.' }),
];

const doc = new Document({
  sections: [{ children }],
});

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`OK: ${outputPath}`);
  })
  .catch((error) => {
    console.error('ERROR:', error.message);
    process.exit(1);
  });
