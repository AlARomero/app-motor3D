let prevComensalListObject = null;
let allComensalListObject = [];

function addDragEvent(comensalHTMLElement) {
    comensalHTMLElement.setAttribute('draggable', 'true');
    comensalHTMLElement.addEventListener('dragstart', handleDragStart);
    comensalHTMLElement.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(event) {
    prevComensalListObject = findComensalListFromHTML(this);
    // event.dataTransfer.setData('text/plain', this.id);
    // event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    const newComensalListObject = findComensalListFromHTML(this);
    if (newComensalList && prevComensalListObject !== newComensalListObject) {
        // Se maneja el cambio de lista.

        const comensal = {
            id: parseInt(this.id.split('-')[1]),
            nombre: this.textContent,
            listObject: newComensalListObject
        }

        // Se elimina de la lista anterior.
        prevComensalListObject.comensales = prevComensalListObject.comensales.filter(c => c.id !== comensal.id);
        prevComensalListObject.comensalList.element.removeChild(this);

        // Se añade a la nueva lista.
        newComensalListObject.comensales.push(comensal);
        newComensalListObject.comensalList.element.appendChild(this);
    }

    prevComensalListObject = null;
}

function findComensalListFromHTML(comensalHTML) {
    // Rectangulo del html del comensal que se está arrastrando.
    const rect = comensalHTML.getBoundingClientRect();
    let comensalIter = 0;

    while (comensalIter < allComensalList.length) {
        // Rectangulo del html de la lista de comensales.
        const css2dRect = allComensalList[comensalIter].comensalList.element.getBoundingClientRect();

        // Si se solapan los rectangulos, se devuelve la lista de comensales.
        if (rect.left < css2dRect.right && rect.right > css2dRect.left &&
            rect.top < css2dRect.bottom && rect.bottom > css2dRect.top) {

            return allComensalList[comensalIter];
        }
        comensalIter++;
    }
    // Si no se encuentra en ninguna lista, se devuelve undefined, pero esto nunca deberia pasar.
    return undefined;
}

function fillComensalListObjectArray(tables) {
    tables.forEach(table => {
        const comensalListObject = ComensalListObject.comensalListFromTable(table);
        if (comensalListObject) {
            allComensalList.push(comensalListObject);
        }
    })
}

export { addDragEvent, fillComensalListObjectArray }