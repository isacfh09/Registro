CREATE DATABASE IF NOT EXISTS sistema_asistencia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_asistencia;

-- Tabla Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla Asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo ENUM('ENTRADA', 'SALIDA') NOT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Tabla Usuarios (Administradores / Supervisores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'SUPERVISOR') DEFAULT 'ADMIN'
);

-- Inserción de un empleado de prueba (DNI: 12345678, PIN: 1234)
-- NOTA: El PIN debe estar encriptado con bcrypt en producción.
INSERT INTO empleados (dni, nombre, apellido, sector, pin_hash, estado) 
VALUES ('12345678', 'Juan', 'Pérez', 'Ventas', '$2b$10$wT8L.O10o4M2D5fG2b1M.uXm5K1I5.Jz8O/sEaU1EaG5K5K5K5K5K', 1);
