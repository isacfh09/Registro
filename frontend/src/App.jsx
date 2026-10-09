import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [vista, setVista] = useState('fichaje'); // 'fichaje', 'dashboard', 'reporte'
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [asistencias, setAsistencias] = useState([]);

  // Estados para el reporte mensual
  const [filtroDni, setFiltroDni] = useState('');
  const [filtroMes, setFiltroMes] = useState('2026-09');
  const [reporteProcesado, setReporteProcesado] = useState([]);
  const [totalHorasMes, setTotalHorasMes] = useState(0);

  const cargarAsistencias = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/asistencia');
      const data = await res.json();
      setAsistencias(data);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    }
  };

  useEffect(() => {
    if (vista === 'dashboard') {
      cargarAsistencias();
    }
  }, [vista]);

  // Manejar fichaje
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, pin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

      setResultado(data);
      setDni('');
      setPin('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Generar Reporte Mensual por Empleado
  const buscarReporteMensual = async () => {
    if (!filtroDni) {
      alert('Ingresa el DNI del empleado.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/asistencia?dni=${filtroDni}&mes=${filtroMes}`);
      const data = await res.json();

      // Agrupar registros por fecha para vincular Entrada y Salida
      const agrupadoPorFecha = {};
      data.forEach(item => {
        if (!agrupadoPorFecha[item.fecha]) {
          agrupadoPorFecha[item.fecha] = { entrada: '-', salida: '-', horas: 0 };
        }
        if (item.tipo === 'ENTRADA') agrupadoPorFecha[item.fecha].entrada = item.hora;
        if (item.tipo === 'SALIDA') agrupadoPorFecha[item.fecha].salida = item.hora;
      });

      // Calcular horas trabajadas por día
      let sumaTotalHoras = 0;
      const listaFinal = Object.keys(agrupadoPorFecha).sort().map(fecha => {
        const reg = agrupadoPorFecha[fecha];
        let horasDia = 0;

        if (reg.entrada !== '-' && reg.salida !== '-') {
          const [h1, m1] = reg.entrada.split(':').map(Number);
          const [h2, m2] = reg.salida.split(':').map(Number);
          const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diffMin > 0) {
            horasDia = parseFloat((diffMin / 60).toFixed(2));
          }
        }

        sumaTotalHoras += horasDia;
        return {
          fecha,
          entrada: reg.entrada,
          salida: reg.salida,
          horas: horasDia
        };
      });

      setReporteProcesado(listaFinal);
      setTotalHorasMes(parseFloat(sumaTotalHoras.toFixed(2)));
    } catch (err) {
      console.error('Error al generar reporte:', err);
    }
  };

  // Exportar PDF con jsPDF y AutoTable
  const exportarPDF = () => {
    const doc = new jsPDF();

    // Encabezado del documento
    doc.setFontSize(18);
    doc.setTextColor(24, 144, 255);
    doc.text("Reporte Mensual de Asistencia", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Empleado DNI: ${filtroDni}`, 14, 30);
    doc.text(`Período (Mes): ${filtroMes}`, 14, 37);
    doc.text(`Total de Horas Trabajadas: ${totalHorasMes} hs`, 14, 44);

    // Tabla de Registros
    const columnas = ["Fecha", "Hora Entrada", "Hora Salida", "Horas Trab."];
    const filas = reporteProcesado.map(r => [
      r.fecha,
      r.entrada,
      r.salida,
      `${r.horas} hs`
    ]);

    autoTable(doc, {
      startY: 52,
      head: [columnas],
      body: filas,
      headStyles: { fillColor: [24, 144, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Guardar archivo PDF
    doc.save(`Reporte_Asistencia_${filtroDni}_${filtroMes}.pdf`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
      
      {/* Navegación Principal */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        <button 
          onClick={() => setVista('fichaje')}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: vista === 'fichaje' ? '#1890ff' : '#fff', color: vista === 'fichaje' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Reloj de Fichaje
        </button>
        <button 
          onClick={() => setVista('dashboard')}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: vista === 'dashboard' ? '#1890ff' : '#fff', color: vista === 'dashboard' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Dashboard Panel
        </button>
        <button 
          onClick={() => setVista('reporte')}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: vista === 'reporte' ? '#1890ff' : '#fff', color: vista === 'reporte' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Reporte Mensual PDF
        </button>
      </nav>

      {/* VISTA 1: FICHAJE */}
      {vista === 'fichaje' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {!resultado ? (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '350px' }}>
              <h2 style={{ textAlign: 'center', color: '#1a2b4c', marginBottom: '8px' }}>Control de Asistencia</h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '20px' }}>Ingresa tu DNI y PIN</p>
              
              {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>DNI</label>
                  <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>PIN</label>
                  <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Registrar</button>
              </form>
            </div>
          ) : (
            <div style={{ background: '#e6f7ff', padding: '30px', borderRadius: '12px', border: '1px solid #91d5ff', width: '350px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', color: '#52c41a' }}>✔</div>
              <h2 style={{ color: '#237804', margin: '10px 0' }}>{resultado.mensaje}</h2>
              <h3 style={{ margin: '5px 0' }}>{resultado.empleado}</h3>
              <p style={{ color: '#555', margin: '5px 0' }}>DNI: {resultado.dni}</p>
              <p style={{ fontWeight: 'bold', fontSize: '18px', color: resultado.tipo === 'ENTRADA' ? '#2f54eb' : '#fa8c16' }}>
                Tipo: {resultado.tipo}
              </p>
              <p style={{ color: '#888', fontSize: '14px' }}>Fecha: {resultado.fecha} | Hora: {resultado.hora}</p>
              <button onClick={() => setResultado(null)} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: '#52c41a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Volver</button>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: DASHBOARD */}
      {vista === 'dashboard' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1a2b4c', marginBottom: '20px' }}>Dashboard de Asistencias</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                <th style={{ padding: '12px' }}>Empleado / DNI</th>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Hora</th>
                <th style={{ padding: '12px' }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No hay registros de asistencia aún.</td>
                </tr>
              ) : (
                asistencias.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{item.empleado} <br/><small style={{ color: '#888' }}>DNI: {item.dni}</small></td>
                    <td style={{ padding: '12px' }}>{item.fecha}</td>
                    <td style={{ padding: '12px' }}>{item.hora}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold', 
                        fontSize: '12px',
                        backgroundColor: item.tipo === 'ENTRADA' ? '#e6f7ff' : '#fff7e6',
                        color: item.tipo === 'ENTRADA' ? '#1890ff' : '#fa8c16',
                        border: `1px solid ${item.tipo === 'ENTRADA' ? '#91d5ff' : '#ffd591'}`
                      }}>
                        {item.tipo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 3: REPORTE MENSUAL PDF */}
      {vista === 'reporte' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1a2b4c', marginBottom: '20px' }}>Generar Reporte Mensual</h2>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>DNI Empleado</label>
              <input 
                type="text" 
                placeholder="324" 
                value={filtroDni} 
                onChange={(e) => setFiltroDni(e.target.value)} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Mes / Año</label>
              <input 
                type="month" 
                value={filtroMes} 
                onChange={(e) => setFiltroMes(e.target.value)} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
            <button 
              onClick={buscarReporteMensual} 
              style={{ padding: '10px 20px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Consultar
            </button>
          </div>

          {reporteProcesado.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e6f7ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1890ff' }}>Total de horas del mes: {totalHorasMes} hs</h3>
                  <small style={{ color: '#555' }}>DNI: {filtroDni} | Período: {filtroMes}</small>
                </div>
                <button 
                  onClick={exportarPDF} 
                  style={{ padding: '10px 20px', backgroundColor: '#52c41a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📄 Exportar a PDF
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '12px' }}>Fecha</th>
                    <th style={{ padding: '12px' }}>Entrada</th>
                    <th style={{ padding: '12px' }}>Salida</th>
                    <th style={{ padding: '12px' }}>Horas Trabajadas</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteProcesado.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{row.fecha}</td>
                      <td style={{ padding: '12px' }}>{row.entrada}</td>
                      <td style={{ padding: '12px' }}>{row.salida}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.horas} hs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}