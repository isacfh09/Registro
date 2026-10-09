const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Importación directa desde ./routes/asistenciaRoutes
const asistenciaRoutes = require('./routes/asistenciaRoutes');
app.use('/api', asistenciaRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo correctamente en http://localhost:${PORT}`);
});