const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =======================================================
// 1. Asegurar que las carpetas de destino existan
// =======================================================
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// =======================================================
// 2. CONFIGURACIÓN DE ALMACENAMIENTO
// =======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest;

    if (file.fieldname === 'avatar') {
      dest = path.join(__dirname, '../uploads/avatars');
    } else {
      dest = path.join(__dirname, '../uploads/submissions');
    }

    ensureDir(dest); // 🔥 crea la carpeta si no existe
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_');

    if (file.fieldname === 'avatar' && req.user) {
      cb(null, `${req.user.id}-avatar-${Date.now()}${ext}`);
    } else if (file.fieldname === 'submissionFile' && req.user) {
      const missionId = req.params?.id || 'mission';
      cb(null, `${req.user.id}-${missionId}-${Date.now()}${ext}`);
    } else {
      cb(null, `${baseName}-${Date.now()}${ext}`);
    }
  },
});

// =======================================================
// 3. FILTRO DE ARCHIVOS
// =======================================================
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Tipo de archivo no soportado. Solo PDF, Word, JPG, PNG o GIF.'
      ),
      false
    );
  }
};

// =======================================================
// 4. EXPORTAR MULTER
// =======================================================
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter,
});

module.exports = upload;
