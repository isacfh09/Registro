const express = require('express');
const router = express.Router();

let historialAsistencias = [];

function calcularHorasTrabajadas(horaEntrada, horaSalida) {
  const [h1, m1, s1] = horaEntrada.split(':').map(Number);
  const [h2, m2, s2] = horaSalida.split(':').map(Number);

  const entradaSec = h1 * 3600 + m1 * 60 + (s1 || 0);
  const salidaSec = h2 * 3600 + m2 * 60 + (s2 || 0);

  const diffSegundos = salidaSec - entradaSec;
  if (diffSegundos <= 0) return 0;

  const horas = diffSegundos / 3600;
  return parseFloat(horas.toFixed(2));
}

// POST /api/asistencia -> Registrar Fichaje
router.post('/asistencia', (req, res) => {
  const { dni, pin } = req.body;

  if (!dni) {
    return res.status(400).json({ error: 'El DNI es requerido' });
  }

  // Buscar último registro del DNI
  const ultimosRegistros = historialAsistencias.filter(a => a.dni === dni);
  const ultimoRegistro = ultimosRegistros[0]; // Como usas unshift, el más reciente es el índice 0

  let tipoNuevo = 'ENTRADA';
  if (ultimoRegistro && ultimoRegistro.tipo === 'ENTRADA') {
    tipoNuevo = 'SALIDA';
  }

  // --- CORRECCIÓN DE FECHA LOCAL ---
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('sv-SE'); // Mantiene formato YYYY-MM-DD en hora local
  const hora = ahora.toTimeString().split(' ')[0];  // Formato HH:MM:SS

  const nuevoRegistro = {
    id: historialAsistencias.length + 1,
    empleado: `Empleado (${dni})`,
    dni: dni,
    pin: pin || null, // --- CORRECCIÓN: Se guarda el PIN recibido ---
    tipo: tipoNuevo,
    fecha: fecha,
    hora: hora
  };

  historialAsistencias.unshift(nuevoRegistro);

  res.json({
    mensaje: '¡Asistencia registrada con éxito!',
    ...nuevoRegistro
  });
});

// GET /api/asistencia -> Obtener todas las asistencias o filtradas
router.get('/asistencia', (req, res) => {
  const { dni, mes } = req.query;

  let resultado = [...historialAsistencias];

  if (dni) {
    resultado = resultado.filter(a => a.dni === dni);
  }

  if (mes) {
    resultado = resultado.filter(a => a.fecha.startsWith(mes));
  }

  res.json(resultado);
});

module.exports = router;