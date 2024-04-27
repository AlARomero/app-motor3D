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
    // Si se hace doble click, se activan los controles y el controller #fix.
    $(htmlElement).on('dblclick', () => {
        controls.enabled = true;
        controller.enabled = true;
    });
}

// Deshabilita el evento mouseleave de todos los comensales.
function unableMouseLeaveEvent() {
    allComensalListObject.forEach(comensalListObject => {
        $(comensalListObject.comensalList.element).off('mousedown');
        $(comensalListObject.comensalList.element).off('mouseleave');
    })
}

// Habilita el evento mouseleave de todos los comensales.
function ableMouseLeaveEvent() {
    allComensalListObject.forEach(comensalListObject => {
        $(comensalListObject.comensalList.element).on('mousedown');
        $(comensalListObject.comensalList.element).on('mouseleave');
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
        const comensalJson = prevComensalListObject.comensales.find(c => c.comensal.id === this.id.split('_')[1]);

        // Se elimina de la lista anterior.
        deleteComensal(prevComensalListObject, comensalJson);

        // Se añade a la nueva lista.
        newComensalListObject.comensales.push(comensalJson);

        $(`#comensales-${newComensalListObject.uuid}`).append(this);

        // Si la lista esta seleccionada, se añade el comensal al menu lateral.
        if (newComensalListObject === selectedComensalListObject) {
            comensalToHtml(newComensalListObject, comensalJson.comensal, 'comensales-content');
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
function addEvent(comensalListObject, comensalJson) {

    $(`#btn-edit-${comensalJson.comensal.id}`).on('click', () => {fillPlaceholder(comensalJson.comensal)});
    $(`#btn-delete-${comensalJson.comensal.id}`).on('click', () => {deleteComensal(comensalListObject, comensalJson)});
    $(`#container_comensal_${comensalJson.comensal.id}`).on('click', function() {changeComensalSideSelected(`container_comensal_${comensalJson.comensal.id}`);});
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
    comensalListObject.comensales = comensalListObject.comensales.filter(c => c.comensal.id !== comensal.comensal.id);
    // Se elimina del menu lateral del html
    $(`#btn-edit-${comensal.comensal.id}`).parent().parent().remove();
    // Se elimina del html de la mesa

    comensalListObject.comensalList.element.querySelector(`#comensales-${comensalListObject.uuid}`).removeChild(comensal.html);
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
    $('#comensal-category-selector').prop('selectedIndex', 0).trigger('change');
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
            <div class="d-flex justify-content-between" id="container_nombre_comensal_${comensal.id}">
                <div class="d-flex justify-content-between" id="comensal-badge-container-${comensal.id}">
                    <p id="comensal-nombre-${comensal.id}" style="margin: 0;">
                        ${comensal.nombre}
                    </p>
                </div>
            </div>
            
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

    const comensalJson = comensalListObject.getComensal(comensal.id);
    addEvent(comensalListObject, comensalJson);

    // Si el comensal tiene descripcion, se añade un badge.
    if (comensal.descripcion)
        addBadge(comensalJson.html, false);

    // Si el comensal tiene categorias, se añaden
    comensal.categorias.forEach(category => {
        addCategoryToComensal(comensalJson.html, category, false);
    });
}

// Funcion que añade un badge a un li de comensal de la lista 3D y a la lista side.
function addBadge(comensalLi, both = true) {
    const html = document.createElement('span');
    html.style.margin = '0';
    html.classList.add('badge', 'text-bg-secondary');
    html.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>`;
    html.style.marginRight = '1rem';
    html.style.marginLeft = '1rem';

    const clone = html.cloneNode(true);

    clone.id = `comensal_side_badge_${comensalLi.id.split('_')[1]}`;
    html.id = `comensal_badge_${comensalLi.id.split('_')[1]}`

    if (both)
    comensalLi.querySelector('p').appendChild(html);
    $(`#comensal-nombre-${comensalLi.id.split('_')[1]}`).append(clone);
}

// Funcion que elimina un badge de un li de comensal de la lista 3D.
function removeBadge(comensalLi) {
    $(`#comensal_badge_${comensalLi.id.split('_')[1]}`).remove();
    $(`#comensal_side_badge_${comensalLi.id.split('_')[1]}`).remove();
}

function addCategoryToComensal(comensalLi, category, both = true) {
    const span = generateCircleSpan(category.color);
    span.id = `${comensalLi.id.split('_')[1]}_category_badge_${category.name}`;
    if (both)
        comensalLi.appendChild(span);
    
    const clone = span.cloneNode(true);
    clone.id = `${comensalLi.id.split('_')[1]}_side_category_badge_${category.name}`;
    $(`#comensal-badge-container-${comensalLi.id.split('_')[1]}`).append(clone);
}

// La categoria ha sido modificada, por lo que cambia el color de la etiqueta (es la unica opcion modificable).
function modifyCategoryFromComensal(comensal, category) {
    $(`#${comensal.id}_category_badge_${category.name}`).css('background-color', category.color);
    $(`#${comensal.id}_side_category_badge_${category.name}`).css('background-color', category.color);
}

function removeCategoryFromComensal(comensalId, category) {
    $(`#${comensalId}_category_badge_${category.name}`).remove();
    $(`#${comensalId}_side_category_badge_${category.name}`).remove();
}

function createCategorySideItemHtml(category) {
    // Se crea el html comensal del comensal side menu y se añade al contenedor.
    const circle = generateCircleSpan(category.color);
    circle.id = `category-badge-${category.name}`;
    const html =  `
        <div class="d-flex justify-content-between" id="container-category-${category.name}">
            <div class="d-flex justify-content-between">
                <p id="category-nombre-${category.name}" style="margin: 0">${category.displayName} </p>
                ${circle.outerHTML}
            </div>
            <div>
                <button type="button" data-bs-toggle="modal" data-bs-target="#edit-category-modal" class="btn btn-outline-primary btn-sm" id='btn-edit-${category.name}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" id='btn-delete-${category.name}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    

    return html;
}

function generateCircleSpan(color) {
    // <div class="rounded" style="width: 15px; height: 15px; background-color: darkseagreen;"></div>
    const html = document.createElement('div');
    html.setAttribute('class', 'rounded');
    html.style.width = '15px';
    html.style.height = '15px';
    html.style.backgroundColor = color;
    html.style.display = 'inline-block';
    html.style.alignSelf = 'center';


    return html;
}

function createCategoryListSelectorItemHtml(category) {
    const html = `
        <option value="${category.name}" id="category-offcanvas-option-${category.name}">${category.displayName}</option>
    `;
    return html;
}

function createCategoryComensalSelectorItemHtml(category) {
    const html = `
        <option value="${category.name}" id="category-comensal-option-${category.name}">${category.displayName}</option>
    `;
    return html;
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
    removeBadge,
    addCategoryToComensal,
    removeCategoryFromComensal,
    createCategorySideItemHtml,
    createCategoryListSelectorItemHtml,
    createCategoryComensalSelectorItemHtml,
    modifyCategoryFromComensal
    //TODO: Eliminar removeBadge, no se usa
}