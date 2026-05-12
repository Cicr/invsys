const zlib = require('zlib');

function encode64(data) {
    let r = "";
    for (let i = 0; i < data.length; i += 3) {
        if (i + 2 === data.length) {
            r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
        } else if (i + 1 === data.length) {
            r += append3bytes(data.charCodeAt(i), 0, 0);
        } else {
            r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
        }
    }
    return r;
}

function append3bytes(b1, b2, b3) {
    let c1 = b1 >> 2;
    let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    let c4 = b3 & 0x3F;
    let r = "";
    r += encode6bit(c1 & 0x3F);
    r += encode6bit(c2 & 0x3F);
    r += encode6bit(c3 & 0x3F);
    r += encode6bit(c4 & 0x3F);
    return r;
}

function encode6bit(b) {
    if (b < 10) return String.fromCharCode(48 + b);
    if (b < 36) return String.fromCharCode(65 + b - 10);
    if (b < 62) return String.fromCharCode(97 + b - 36);
    if (b === 62) return '-';
    if (b === 63) return '_';
    return '?';
}

const puml = `@startuml invsys-component
!include <C4/C4_Component>

LAYOUT_WITH_LEGEND()

title Diagrama de Componentes - Sistema Invsys

Container_Boundary(auth_service, "Auth Service (Node.js/Express)") {
    Component(auth_ctrl, "Auth Controller", "Express Router", "Gestiona registro y autenticación")
    Component(user_svc, "User Service", "Domain Service", "Lógica de gestión de usuarios")
    Component(jwt_prov, "JWT Provider", "jsonwebtoken", "Generación y validación de tokens")
    ComponentDb(auth_db, "Auth DB", "PostgreSQL", "Almacena credenciales y roles")
}

Container_Boundary(prod_service, "Product Service (NestJS)") {
    Component(prod_ctrl, "Product Controller", "NestJS Controller", "Endpoints REST para catálogo")
    Component(prod_svc, "Product Service", "NestJS Service", "Lógica de negocio de productos")
    Component(price_hist_svc, "Price History Service", "NestJS Service", "Seguimiento de cambios de precio")
    Component(curr_svc, "Currency Service", "External Integration", "Conversión de divisas con caché")
    Component(prod_event_prod, "Event Producer", "KafkaJS", "Emite product.created/updated")
    ComponentDb(prod_db, "Product DB", "PostgreSQL", "Almacena productos e historial")
}

Container_Boundary(inv_service, "Inventory Service (Go/Gin)") {
    Component(inv_handlers, "Inventory Handlers", "Gin Handlers", "Gestión de stock y auditoría")
    Component(inv_logic, "Stock Engine", "Go Logic", "Cálculo de balances y bloqueos pesimistas")
    Component(inv_event_cons, "Event Consumer", "Confluent Kafka", "Escucha cambios en productos")
    Component(inv_event_prod, "Event Producer", "Confluent Kafka", "Emite inventory.adjusted")
    ComponentDb(inv_db, "Inventory DB", "PostgreSQL", "Almacena stock y movimientos")
}

System_Ext(exchange_api, "ExchangeRate API", "Proveedor externo de tasas de cambio")
Container(kafka, "Message Broker", "Kafka", "Bus de eventos del sistema")

Rel(auth_ctrl, user_svc, "Usa")
Rel(user_svc, jwt_prov, "Solicita tokens")
Rel(user_svc, auth_db, "Lee/Escribe")

Rel(prod_ctrl, prod_svc, "Usa")
Rel(prod_svc, price_hist_svc, "Registra cambios")
Rel(prod_svc, curr_svc, "Consulta conversión")
Rel(prod_svc, prod_event_prod, "Dispara eventos")
Rel(prod_svc, prod_db, "Lee/Escribe")
Rel(curr_svc, exchange_api, "Fetch rates", "JSON/HTTPS")

Rel(inv_handlers, inv_logic, "Usa")
Rel(inv_logic, inv_db, "Lee/Escribe (FOR UPDATE)")
Rel(inv_event_cons, inv_logic, "Notifica creación")
Rel(inv_logic, inv_event_prod, "Dispara eventos")

Rel(prod_event_prod, kafka, "Publica en product.events")
Rel(kafka, inv_event_cons, "Suscrito a product.events")

@enduml`;

const compressed = zlib.deflateRawSync(puml);
const encoded = encode64(compressed.toString('binary'));
console.log('https://www.plantuml.com/plantuml/svg/' + encoded);
