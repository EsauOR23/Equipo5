CREATE TABLE Proveedor (
  id_proveedor INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_empesa VARCHAR(50) NOT NULL,
  nombre_proveedor VARCHAR(50) NOT NULL,
  contacto INTEGER(12) UNSIGNED NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  PRIMARY KEY(id_proveedor)
);

CREATE TABLE Tipo (
  id_tipo INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_producto VARCHAR(50) NOT NULL,
  PRIMARY KEY(id_tipo)
);

CREATE TABLE Usuario (
  id_usuario INT(10) NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(20) NOT NULL,
  contraseńa VARCHAR(15) NOT NULL,
  PRIMARY KEY(id_usuario)
);

CREATE TABLE Unidades (
  id_unidad INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_unidad VARCHAR(35) NOT NULL,
  PRIMARY KEY(id_unidad)
);

CREATE TABLE Ticket (
  id_ticket INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT(10) NOT NULL,
  dia_compra DATE NOT NULL,
  metodo INTEGER UNSIGNED NOT NULL,
  total INTEGER(10) UNSIGNED NOT NULL,
  PRIMARY KEY(id_ticket),
  CONSTRAINT fk_ticket_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE Pagos (
  id_pago INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT(10) NOT NULL,
  id_proveedor INTEGER(10) UNSIGNED NOT NULL,
  estado VARCHAR(20) NOT NULL,
  monto INTEGER(10) UNSIGNED NOT NULL,
  dia DATE NOT NULL,
  hora TIME NOT NULL,
  metodo VARCHAR(20) NOT NULL,
  PRIMARY KEY(id_pago),
  CONSTRAINT fk_pagos_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_pagos_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE Producto (
  id_producto INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  id_ticket INTEGER(10) UNSIGNED NOT NULL,
  id_proveedor INTEGER(10) UNSIGNED NOT NULL,
  Id_unidad INTEGER(10) UNSIGNED NOT NULL,
  id_tipo INTEGER(10) UNSIGNED NOT NULL,
  producto VARCHAR(20) NOT NULL,
  precio_compra DECIMAL(6,2) NOT NULL,
  precio_venta DECIMAL(6,2) NOT NULL,
  stock INTEGER(10) UNSIGNED NOT NULL,
  stock_min INTEGER(10) UNSIGNED NOT NULL,
  stock_max INTEGER(10) UNSIGNED NOT NULL,
  PRIMARY KEY(id_producto),
  CONSTRAINT fk_producto_ticket
    FOREIGN KEY (id_ticket) REFERENCES Ticket(id_ticket)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_producto_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_producto_unidad
    FOREIGN KEY (Id_unidad) REFERENCES Unidades(id_unidad)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_producto_tipo
    FOREIGN KEY (id_tipo) REFERENCES Tipo(id_tipo)
    ON DELETE RESTRICT ON UPDATE RESTRICT
);
