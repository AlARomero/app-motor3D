import ComensalListObject from "./comensal_list_object";

let prevComensalListObject = null;
let allComensalListObject = [];
let controls;
let controller;
let dropX, dropY;
let dragShadow;
let selectedComensalListObject;

function setControls(newControls) {
    controls = newControls;
}

function setController(newController) {
    controller = newController;
}

function setAllComensalListObject(newAllComensalListObject) {
    allComensalListObject = newAllComensalListObject;
}

function addDragEvent(comensalHTMLElement) {
    comensalHTMLElement.draggable = true;
    comensalHTMLElement.addEventListener('mousedown', handleMouseDown);
    comensalHTMLElement.addEventListener('dragstart', handleDragStart);
    comensalHTMLElement.addEventListener('dragend', handleDragEnd);
    comensalHTMLElement.addEventListener('drag', handleDrag);
}

// Como el drag no puede realizarse debido a controlls y controller, primero se deshabilitan y ya no se solapan.
function handleMouseDown(event) {
    controller.enabled = false;
    controls.enabled = false;
}

function handleDragStart(event) {

    // Se añade la clase dragging para que el elemento se vea diferente mientras se arrastra.
    this.classList.add('dragging');
    // Se busca la lista de comensales en la que se encuentra el elemento.
    prevComensalListObject = findComensalListFromPoint(event.clientX, event.clientY);

    // Crea una copia del elemento que se está arrastrando
    dragShadow = this.cloneNode(true);
    dragShadow.style.position = 'fixed';
    dragShadow.style.pointerEvents = 'none';
    document.body.appendChild(dragShadow);
}

function handleDrag(event) {
    // Obtiene las nuevas coordenadas del ratón.
    dropX = event.clientX;
    dropY = event.clientY;

    // Cambia la posición de la copia
    dragShadow.style.left = dropX + 'px';
    dragShadow.style.top = dropY + 'px';
}

// Una vez que se termina el drag, se habilitan los controles y el controller.
function handleDragEnd(event) {

    // Ya no se esta arrastrando.
    this.classList.remove('dragging');
    document.body.removeChild(dragShadow);

    // Se busca si el punto donde se soltó el elemento está dentro de alguna lista de comensales.
    const newComensalListObject = findComensalListFromPoint(dropX, dropY);

    if (newComensalListObject && prevComensalListObject !== newComensalListObject) {
        // Si se soltó en una lista y las listas son diferentes, se maneja el cambio de lista.

        // Se obtiene el comensal que se está moviendo a traves de su html.
        const comensal = {
            id: this.id.split('_')[1],
            nombre: this.textContent,
        }

        // Se elimina de la lista anterior.
        deleteComensal(prevComensalListObject, comensal);

        // Se añade a la nueva lista.
        newComensalListObject.comensales.push(comensal);
        newComensalListObject.comensalList.element.appendChild(this);
        // Si la lista esta seleccionada, se añade el comensal al menu lateral.
        if (newComensalListObject === selectedComensalListObject) {
            comensalToHtml(newComensalListObject, comensal, 'comensales-content');
        }
    }

    // Se devuelven los controls y el controller a su estado original y se reinicia la variable de lista previa.
    prevComensalListObject = null;
    controls.enabled = true;
    controller.enabled = true;
}

function findComensalListFromPoint(x, y) {
    let comensalIter = 0;

    // Se busca en todas las listas de comensales.
    while (comensalIter < allComensalListObject.length) {
        // HTML de la lista de comensales.
        const comensalListHTML = allComensalListObject[comensalIter].comensalList.element;

        // Obtiene las coordenadas y dimensiones del elemento.
        const rect = comensalListHTML.getBoundingClientRect();

        // Comprueba si el punto (x, y) está dentro del rectángulo del elemento.
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return allComensalListObject[comensalIter];
        }
        comensalIter++;
    }
    // Si no se encuentra en ninguna lista, se devuelve undefined, pero esto nunca deberia pasar.
    return undefined;
}

/**
 * Añade eventos a los botones de la interfaz de comensales.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal a cuyos botones se les van a añadir eventos.
 */
function addEvent(comensalListObject, comensal) {

    $(`#btn-edit-${comensal.id}`).on('click', () => {fillPlaceholder(comensal)});
    $(`#btn-delete-${comensal.id}`).on('click', () => {deleteComensal(comensalListObject, comensal)});

}

/**
 * Borra un comensal de una mesa.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal que se va a borrar.
 */
function deleteComensal(comensalListObject, comensal) {
    // Se quita de la lista
    comensalListObject.comensales = comensalListObject.comensales.filter(c => c.id !== comensal.id);
    // Se elimina del menu lateral del html
    $(`#btn-edit-${comensal.id}`).parent().parent().remove();
    // Se elimina del html de la mesa
    const comensalLi = comensalListObject.comensalList.element.querySelector(`#comensal_${comensal.id}`);
    comensalListObject.comensalList.element.removeChild(comensalLi);
}

/**
 * Rellena el campo de nombre con el nombre del comensal seleccionado para modificar.
 * @param {Object} comensal - El comensal cuyo nombre se va a utilizar para rellenar el campo.
 */
function fillPlaceholder(comensal) {
    $('#id-del-comensal-seleccionado').text(comensal.id);
    $('#comensales-modal-label').text('Rename comensal: ' + comensal.nombre);
    $('#nombre-comensal').val(comensal.nombre);
}

/**
 * Convierte los comensales de una mesa a HTML.
 * @param {OnFloorItemGroup} mesa - La mesa cuyos comensales se van a convertir a HTML.
 * @param {string} container - El contenedor donde se van a añadir los comensales.
 */

function comensalesToHtml(comensalListObject, container) {
    selectedComensalListObject = comensalListObject;
    const comensales = comensalListObject.comensales;
    $(`#${container}`).html('');
    comensales.forEach(comensal => {
        comensalToHtml(comensalListObject, comensal, container);
    });
}

/**
 * Convierte un comensal a HTML.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal que se va a convertir a HTML. El comensal es un objeto que tiene dos propiedades: id y nombre.
 * @param {string} container - El contenedor donde se van a añadir los comensales.
 */
function comensalToHtml(comensalListObject, comensal, container) {
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
    addEvent(comensalListObject, comensal);
}

export { 
    addDragEvent, 
    addEvent,
    deleteComensal,
    fillPlaceholder,
    comensalToHtml,
    comensalesToHtml,
    setControls,
    setController,
    setAllComensalListObject
}