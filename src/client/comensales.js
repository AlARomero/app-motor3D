const OnFloorItemGroup = require('./lib/items/wall_itemGroup.js');

// TODO para recargar el numero de comensales de un modelo a otro habria que hacerlo con una variable global o con una CLASE (la mejor opcion prob.)
let numeroComensales = 1;

/**
 * Convierte los comensales de una mesa a HTML.
 * @param {OnFloorItemGroup} mesa - La mesa cuyos comensales se van a convertir a HTML.
 * @param {string} container - El contenedor donde se van a añadir los comensales.
 */
function comensalesToHtml(mesa, container) {

    const comensales = mesa.itemsBounded;
    $(`#${container}`).html('');
    comensales.forEach(comensal => {
        comensalToHtml(comensal, container);
    });
}

/**
 * Crea un nuevo comensal y lo añade a una mesa.
 * @param {OnFloorItemGroup} mesa - La mesa a la que se va a añadir el nuevo comensal.
 */
function creaComensal(mesa, container) {
    const comensal = {
        id: numeroComensales,
        nombre: `Comensal ${numeroComensales}`,
        mesa: mesa
    }
    mesa.boundItem(comensal);
    numeroComensales++;
    comensalToHtml(comensal, container);
}

/**
 * Modifica un comensal en una mesa específica.
 * @param {OnFloorItemGroup} mesa - El número de la mesa donde se encuentra el comensal.
 * @param {key: value} params - Un objeto que contiene los nuevos valores para el comensal.
 */
function modificaComensal(mesa, params) {
    const comensal = mesa.findBoundItem(params.id);
    if (comensal){
        Object.assign(comensal, params);
        $(`#comensal-nombre-${comensal.id}`).text(comensal.nombre);
    }
}

function borraComensal(comensal) {
    comensal.mesa.unboundItem(comensal);
    $(`#btn-edit-${comensal.id}`).parent().parent().remove();
}

// Rellena el campo de nombre con el nombre del comensal seleccionado para modificar.
function rellenaPlaceholder(comensal) {
    //TODO Busca en el html, no se si seria una buena practica
    $('#comensales-modal-label').text('Modificar Comensal ' + comensal.id);
    $('#nombre-comensal').val(comensal.nombre);
}

// Añade eventos a los botones de la interfaz de comensales.
function addEvent(comensal) {

    $(`#btn-edit-${comensal.id}`).on('click', () => {rellenaPlaceholder(comensal)});
    $(`#btn-delete-${comensal.id}`).on('click', () => {borraComensal(comensal)});

}

/**
 * Convierte un comensal a HTML.
 * @param {Object} comensal - El comensal que se va a convertir a HTML. El comensal es un objeto que tiene dos propiedades: id y nombre.
 * @param {string} container - El contenedor donde se van a añadir los comensales.
 */
function comensalToHtml(comensal, container) {
    const html =  `
        <div class="d-flex justify-content-between align-items-center">
            <p id="comensal-nombre-${comensal.id}" >${comensal.nombre}</p>
            <div>
                <button type="button" data-bs-toggle="modal" data-bs-target="#comensales-modal" class="btn btn-outline-primary btn-sm" id='btn-edit-${comensal.id}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" id='btn-delete-${comensal.id}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    $(`#${container}`).append(`\n${html}`);
    addEvent(comensal);
}


export { comensalesToHtml, creaComensal, modificaComensal };