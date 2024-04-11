import ComensalListObject from "./comensal_list_object";

let prevComensalListObject = null;
let allComensalListObject = [];
let controls;
let controller;
let dropX, dropY;
let dragShadow;
let selectedComensalListObject;
let comensalSideSelected = null;

function setControls(newControls) {
    controls = newControls;
}

function setController(newController) {
    controller = newController;
    // Cuando se mueven los items no interesa tener el evento mouseleave activo ya que puede habilitar los controls.
    controller.itemStartDragCallbacks.add(unableMouseLeaveEvent);
    controller.itemDraggedCallbacks.add(ableMouseLeaveEvent);
}

function getComensalSideSelected() {
    return comensalSideSelected;
}

function removeDragOverDefault(html) {
    html.addEventListener('dragover', (event) => {
        event.preventDefault();
    });
}

function setAllComensalListObject(newAllComensalListObject) {
    allComensalListObject = newAllComensalListObject;
}

function addDeactivateControlsEvent(htmlElement) {
    $(htmlElement).on('mousedown', () => {
        controls.enabled = false;
        controller.enabled = false;
    });
    $(htmlElement).on('mouseleave', () => {
        controls.enabled = true;
        controller.enabled = true;
    });
}

// Deshabilita el evento mouseleave de todos los comensales.
function unableMouseLeaveEvent() {
    console.log('unableMouseLeaveEvent')
    allComensalListObject.forEach(comensalListObject => {
        console.log($(`#btn-${comensalListObject.uuid}`));
        $(`#btn-${comensalListObject.uuid}`).off('mousedown');
        $(`#btn-${comensalListObject.uuid}`).off('mouseleave');
    })
}

// Habilita el evento mouseleave de todos los comensales.
function ableMouseLeaveEvent() {
    console.log('ableMouseLeaveEvent')
    allComensalListObject.forEach(comensalListObject => {
        $(`#btn-${comensalListObject.uuid}`).on('mousedown');
        $(`#btn-${comensalListObject.uuid}`).on('mouseleave');
    })
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

    if (newComensalListObject?.comensalList.visible && prevComensalListObject !== newComensalListObject) {
        // Si se soltó en una lista y las listas son diferentes, se maneja el cambio de lista.

        // Se obtiene el comensal que se está moviendo a traves de su html.
        const comensal = {
            id: this.id.split('_')[1],
            nombre: this.querySelector('p').textContent,
            descripcion: prevComensalListObject.comensales.find(c => c.comensal.id === this.id.split('_')[1]).comensal.descripcion
        }

        // Se elimina de la lista anterior.
        deleteComensal(prevComensalListObject, comensal);

        // Se añade a la nueva lista.
        const comensalJson = {
            comensal: comensal,
            html: this
        }
        newComensalListObject.comensales.push(comensalJson);

        $(`#comensales-${newComensalListObject.uuid}`).append(this);

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

// Funcion que sirve añadir evento para deseleccionar cualquier cosa seleccionable (que este seleccionado) si se hace clic fuera de ellos.
function addDeselectAllSelectedOnOutsideClickEvent() {
    // Si se hace clic fuera del container_comensal seleccionado, se deselecciona.
    $(document).on('click', function(event) {
        /* 
        Si el clic no fue dentro del div seleccionado ni de los botones up/down 
        (para esto hay que saber los id's de los botones up y down del comensal side menu).
        Una vez se saben, se mira a ver si el clic fue dentro de alguno de esos elementos
        o en alguno de sus descendientes o dentro del div (o en sus desdendientes).
        */
        if (!$(event.target).closest('.comensal-selected, #up-comensal-side-button, #down-comensal-side-button').length){

            // Elimina la clase de selección
            $('.comensal-selected').removeClass('comensal-selected');
            // Actualiza el comensal seleccionado
            comensalSideSelected = null;
        }
    });
}

/**
 * Añade eventos a los botones de la interfaz de comensales.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal a cuyos botones se les van a añadir eventos.
 */
function addEvent(comensalListObject, comensal) {

    $(`#btn-edit-${comensal.id}`).on('click', () => {fillPlaceholder(comensal)});
    $(`#btn-delete-${comensal.id}`).on('click', () => {deleteComensal(comensalListObject, comensal)});
    $(`#container_comensal_${comensal.id}`).on('click', function() {changeComensalSideSelected(`container_comensal_${comensal.id}`);});
}

// Cambia el estilo del comensal seleccionado en el side menu de comensales.
function changeComensalSideSelected(newComensalSideSelected) {
    const $comensalSideSelected = $(`#${comensalSideSelected}`);
    const $newComensalSideSelected = $(`#${newComensalSideSelected}`);

    // Se deselecciona el comensal seleccionado (si hay comensal seleccionado).
    if ($comensalSideSelected)
        $comensalSideSelected.removeClass('comensal-selected');

    // Si se ha vuelto a seleccionar el mismo comensal no se hace nada mas, no hay nuevo comensal seleccionado.
    if (comensalSideSelected === newComensalSideSelected) {
        comensalSideSelected = null;
    }
    else { // Si son diferentes, se deselecciona el anterior y se selecciona el nuevo.
        $comensalSideSelected.removeClass('comensal-selected');
        $newComensalSideSelected.addClass('comensal-selected');
        // Se actualiza el comensal seleccionado.
        comensalSideSelected = newComensalSideSelected;
    }
}

/**
 * Borra un comensal de una mesa.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal que se va a borrar.
 */
function deleteComensal(comensalListObject, comensal) {
    // Se quita de la lista
    comensalListObject.comensales = comensalListObject.comensales.filter(c => c.comensal.id !== comensal.id);
    // Se elimina del menu lateral del html
    $(`#btn-edit-${comensal.id}`).parent().parent().remove();
    // Se elimina del html de la mesa
    const comensalLi = comensalListObject.comensalList.element.querySelector(`#comensal_${comensal.id}`);
    comensalListObject.comensalList.element.querySelector(`#comensales-${comensalListObject.uuid}`).removeChild(comensalLi);
}

/**
 * Rellena el campo de nombre con el nombre del comensal seleccionado para modificar.
 * @param {Object} comensal - El comensal cuyo nombre se va a utilizar para rellenar el campo.
 */
function fillPlaceholder(comensal) {
    $('#id-del-comensal-seleccionado').text(comensal.id);
    $('#comensales-modal-label').text('Rename comensal: ' + comensal.nombre);
    $('#nombre-comensal').val(comensal.nombre);
    $('#descripcion-comensal').val(comensal.descripcion);
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
    comensales.forEach(comensalJson => {
        comensalToHtml(comensalListObject, comensalJson.comensal, container);
    });
}

/**
 * Convierte un comensal a HTML.
 * @param {ComensalListObject} comensalListObject - El objeto que contiene la lista de comensales.
 * @param {Object} comensal - El comensal que se va a convertir a HTML. El comensal es un objeto que tiene dos propiedades: id y nombre.
 * @param {string} container - El contenedor donde se van a añadir los comensales.
 */
function comensalToHtml(comensalListObject, comensal, container) {

    /* 
    Se añade la clase comensal-selected si el comensal está seleccionado. 
    Si no, se deja en blanco. Se hace para que se siga viendo seleccionado si antes lo estaba. 
    */
    let selectedClass = '';
    if (comensalSideSelected && comensalSideSelected === `container_comensal_${comensal.id}`)
        selectedClass = 'comensal-selected';

    // Se crea el html comensal del comensal side menu y se añade al contenedor.
    const html =  `
        <div class="d-flex justify-content-between align-items-center ${selectedClass}" id="container_comensal_${comensal.id}">
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

// Funcion que añade un badge a un li de comensal de la lista 3D.
function addBadge(comensalLi) {
    const html = document.createElement('span');
    html.style.margin = '0';
    html.classList.add('badge', 'text-bg-secondary');
    html.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16" id="comensal_badge_${comensalLi.id.split('_')[2]}">
    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>`;
    html.style.marginRight = '1rem';
    comensalLi.appendChild(html);
}

// Funcion que elimina un badge de un li de comensal de la lista 3D.
function removeBadge(comensalLi) {
    $(`#comensal_badge_${comensalLi.id.split('_')[2]}`).remove();
}

export { 
    addDeactivateControlsEvent,
    addDragEvent, 
    addEvent,
    deleteComensal,
    fillPlaceholder,
    comensalToHtml,
    comensalesToHtml,
    setControls,
    setController,
    setAllComensalListObject,
    removeDragOverDefault,
    getComensalSideSelected,
    addDeselectAllSelectedOnOutsideClickEvent,
    addBadge,
    removeBadge
}