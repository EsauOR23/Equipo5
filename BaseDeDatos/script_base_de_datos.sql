-- Crear y usar la base de datos EQUIPO5
CREATE DATABASE IF NOT EXISTS EQUIPO5;
USE EQUIPO5;

CREATE TABLE Tipo (
  id_tipo INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_producto VARCHAR(50) NULL,
  PRIMARY KEY(id_tipo)
);

CREATE TABLE Proveedor (
  id_proveedor INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_empresa VARCHAR(50) NULL,
  nombre_proveedor VARCHAR(50) NULL,
  contacto INTEGER(12) UNSIGNED NULL,
  descripcion VARCHAR(200) NULL,
  PRIMARY KEY(id_proveedor)
);

CREATE TABLE Usuario (
  id_usuario INT(10) NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(20) NULL,
  contrasena VARCHAR(15) NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'trabajador',
  PRIMARY KEY(id_usuario)
);

CREATE TABLE Unidades (
  id_unidad INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_unidad VARCHAR(35) NULL,
  PRIMARY KEY(id_unidad)
);

CREATE TABLE MetodoPago (
  id_metodopago INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  metodopago VARCHAR(50) NULL,
  PRIMARY KEY(id_metodopago)
);

CREATE TABLE EstadoPago (
  id_estadopago INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  estado VARCHAR(30) NULL,
  PRIMARY KEY(id_estadopago)
);

CREATE TABLE Venta (
  id_ticket INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_metodopago INTEGER(10) UNSIGNED NOT NULL,
  id_usuario INT(10) NOT NULL,
  dia_compra DATE NULL,
  total INTEGER(10) UNSIGNED NULL,
  PRIMARY KEY(id_ticket),
  CONSTRAINT fk_venta_metodopago
    FOREIGN KEY (id_metodopago) REFERENCES MetodoPago(id_metodopago)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE Producto (
  id_producto INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_proveedor INTEGER(10) UNSIGNED NOT NULL,
  Id_unidad INTEGER(10) UNSIGNED NOT NULL,
  id_tipo INTEGER(10) UNSIGNED NOT NULL,
  producto VARCHAR(20) NULL,
  precio_compra DECIMAL(6,2) NULL,
  precio_venta DECIMAL(6,2) NULL,
  stock INTEGER(10) UNSIGNED NULL,
  stock_min INTEGER(10) UNSIGNED NULL,
  stock_max INTEGER(10) UNSIGNED NULL,
  PRIMARY KEY(id_producto),
  CONSTRAINT fk_producto_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_producto_unidad
    FOREIGN KEY (Id_unidad) REFERENCES Unidades(id_unidad)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_producto_tipo
    FOREIGN KEY (id_tipo) REFERENCES Tipo(id_tipo)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE Pagos (
  id_pago INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_estadopago INTEGER(10) UNSIGNED NOT NULL,
  id_metodopago INTEGER(10) UNSIGNED NOT NULL,
  id_usuario INT(10) NOT NULL,
  id_proveedor INTEGER(10) UNSIGNED NOT NULL,
  monto INTEGER(10) UNSIGNED NULL,
  dia DATE NULL,
  hora TIME NULL,
  PRIMARY KEY(id_pago),
  CONSTRAINT fk_pagos_estadopago
    FOREIGN KEY (id_estadopago) REFERENCES EstadoPago(id_estadopago)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_pagos_metodopago
    FOREIGN KEY (id_metodopago) REFERENCES MetodoPago(id_metodopago)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_pagos_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_pagos_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE Ticket (
  Producto_id_producto INTEGER(10) UNSIGNED NOT NULL,
  Venta_id_ticket INTEGER(10) UNSIGNED NOT NULL,
  PRIMARY KEY (Producto_id_producto, Venta_id_ticket),
  INDEX Producto_has_Venta_FKIndex1 (Producto_id_producto),
  INDEX Producto_has_Venta_FKIndex2 (Venta_id_ticket),
  CONSTRAINT fk_ticket_producto
    FOREIGN KEY (Producto_id_producto)
    REFERENCES Producto(id_producto)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_ticket_venta
    FOREIGN KEY (Venta_id_ticket)
    REFERENCES Venta(id_ticket)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

INSERT INTO Usuario (usuario, contrasena, rol) VALUES
  ('dueño', 'dueño', 'dueño'),
  ('trabajador', 'trabajador', 'trabajador');

INSERT INTO Tipo (tipo_producto) VALUES
  ('Lácteos'),
  ('Bebidas'),
  ('Abarrotes'),
  ('Limpieza'),
  ('Panadería'),
  ('Carnes frías'),
  ('Dulcería'),
  ('Frutas y verduras'),
  ('Higiene personal'),
  ('Congelados');

INSERT INTO Unidades (tipo_unidad) VALUES
  ('Piezas'),
  ('Litros'),
  ('Mililitros'),
  ('Kilogramos'),
  ('Gramos'),
  ('Paquete'),
  ('Bolsa'),
  ('Caja'),
  ('Botella'),
  ('Lata');

INSERT INTO Proveedor (nombre_empresa, nombre_proveedor, contacto, descripcion) VALUES
  ('Abarrotes La Central', 'Juan Pérez', 4294967295, 'Proveedor de abarrotes'),
  ('Lácteos Frescos S.A.', 'María López', 4123456789, 'Lácteos y derivados'),
  ('Bebidas y Más', 'Carlos Mendoza', 3999999999, 'Distribuidor de bebidas'),
  ('Distribuidora La Esperanza', 'Roberto Gómez', 551234568, 'Distribuidor mayorista de abarrotes y limpieza'),
  ('Lácteos San Antonio', 'Laura Fernández', 442345789, 'Lácteos frescos, quesos y yogures'),
  ('Cárnicos El Rancho', 'Miguel Ángel Torres', 333456890, 'Carnes frías, embutidos y jamones'),
  ('Bebidas Refrescantes S.A.', 'Verónica Cruz', 664568901, 'Refrescos, aguas, jugos y bebidas energéticas');

INSERT INTO MetodoPago (metodopago) VALUES
  ('Efectivo'),
  ('Tarjeta de débito'),
  ('Tarjeta de crédito'),
  ('Transferencia bancaria'),
  ('Cheque'),
  ('Vale / Voucher'),
  ('Pago móvil');

INSERT INTO EstadoPago (estado) VALUES
  ('Pendiente'),
  ('Pagado'),
  ('Cancelado'),
  ('Reembolsado'),
  ('En proceso');