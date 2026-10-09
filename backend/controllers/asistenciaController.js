const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.registrarAsistencia = async (req, res) => {
  const { dni, pin } = req.body;

  if (!dni || !pin) {
    return res.status(400).json({ error: 'DNI y PIN son obligatorios.' });
  }

  try {
    // 1. Verificar empleado por DNI
    const [empleados] = await db.query('SELECT * FROM empleados WHERE dni = ? AND estado = 1', [dni]);
    if (empleados.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado o inactivo.' });
    }

    const empleado = empleados[0];

    // 2. Verificar PIN (bcrypt)
    const pinValido = await bcrypt.compare(pin, empleado.pin_hash);
    if (!pinValido) {
      return res.status(401).json({ error: 'PIN incorrecto.' });
    }

    // Fecha y Hora actuales
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().split(' ')[0];

    // 3. Buscar el último registro del día para determinar Entrada o Salida
    const [registrosHoy] = await db.query(
      'SELECT tipo FROM asistencias WHERE empleado_id = ? AND fecha = ? ORDER BY id DESC LIMIT 1',
      [empleado.id, fechaActual]
    );

    let nuevoTipo = 'ENTRADA';
    if (registrosHoy.length > 0 && registrosHoy[0].tipo === 'ENTRADA') {
      nuevoTipo = 'SALIDA';
    }

    // 4. Guardar el registro de asistencia
    await db.query(
      'INSERT INTO asistencias (empleado_id, fecha, hora, tipo) VALUES (?, ?, ?, ?)',
      [empleado.id, fechaActual, horaActual, nuevoTipo]
    );

    // 5. Retornar confirmación
    return res.status(200).json({
      mensaje: '¡Asistencia registrada!',
      empleado: `${empleado.nombre} ${empleado.apellido}`,
      dni: empleado.dni,
      tipo: nuevoTipo,
      fecha: fechaActual,
      hora: horaActual
    });

  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.listarAsistencias = async (req, res) => {
  try {
    const [asistencias] = await db.query(`
      SELECT a.id, a.fecha, a.hora, a.tipo, e.nombre, e.apellido, e.dni, e.sector
      FROM asistencias a
      JOIN empleados e ON a.empleado_id = e.id
      ORDER BY a.fecha DESC, a.hora DESC
    `);
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asistencias.' });
  }
};