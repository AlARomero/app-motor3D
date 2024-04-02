import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as ComensalHTML from './comensal_drag';
import { v4 as uuid } from 'uuid';

class ComensalListObject {

    constructor(table) {
        this.uuid = uuid();

        // Crea el div contenedor
        const div = document.createElement('div');
        div.className = 'accordion';

        // Crea el elemento de la lista desplegable
        const item = document.createElement('div');
        item.className = 'accordion-item';

        // Crea el encabezado de la lista desplegable
        const header = document.createElement('h2');
        header.className = 'accordion-header';
        header.id = `heading-${this.uuid}`;

        // Crea el botón para desplegar la lista
        const button = document.createElement('button');
        button.className = 'accordion-button collapsed';
        button.type = 'button';
        button.dataset.bsToggle = 'collapse';
        button.dataset.bsTarget = `#collapse-${this.uuid}`;
        button.textContent = 'Comensales';
        ComensalHTML.addDeactivateControlsEvent(button);

        // Añade el botón al encabezado
        header.appendChild(button);

        // Crea el contenido de la lista desplegable
        const collapse = document.createElement('div');
        collapse.className = 'accordion-collapse collapse';
        collapse.id = `collapse-${this.uuid}`;
        collapse.dataset.bsParent = `#accordion-${this.uuid}`;

        // Crea la lista
        const ul = document.createElement('ul');
        ul.className = 'list-group';
        ul.id = `comensales-${this.uuid}`;

        // Añade la lista al contenido de la lista desplegable
        collapse.appendChild(ul);

        // Añade el encabezado y el contenido a la lista desplegable
        item.appendChild(header);
        item.appendChild(collapse);

        // Añade la lista desplegable al div contenedor
        div.appendChild(item);

        // Se elimina el comportamiento por defecto de dragover (chrome no permite el drop en otros elementos por defecto)
        ComensalHTML.removeDragOverDefault(div);

        // Crea el objeto CSS2D
        this.comensalList = new CSS2DObject(div);
        this.comensales = [];
        this.boundToTable(table);
    }

    selected(container) {
        ComensalHTML.comensalesToHtml(this, container);
    }

    addComensal(comensal, container) {
        const html = document.createElement('li');
        html.textContent = comensal.nombre;
        html.id = `comensal_${comensal.id}`;
        html.className = 'list-group-item small';
        ComensalHTML.addDragEvent(html);

        // Añade el elemento li al ul dentro del div de colapso
        this.comensalList.element.querySelector(`#comensales-${this.uuid}`).appendChild(html);

        this.comensales.push(comensal);
        ComensalHTML.comensalToHtml(this, comensal, container);
    }

    /**
     * Modifica un comensal.
     * @param {key: value} params - Un objeto que contiene los nuevos valores para el comensal.
     */
    modifyComensal(params) {
        const comensal = this.comensales.find(c => c.id === params.id);
        if (comensal) {
            Object.assign(comensal, params);
            $(`#comensal-nombre-${comensal.id}`).text(comensal.nombre);
            const comensalLi = this.comensalList.element.querySelector(`#comensal_${comensal.id}`);
            comensalLi.textContent = comensal.nombre;
        }
        else 
            console.error('El comensal no existe en esta mesa');
    }

    boundToTable(table) {
        table.boundItem(this);
        table.add(this.comensalList);
    }

    remove(table) {
        table.unboundItem(this)
        table.remove(this.comensalList);
    }
}

export default ComensalListObject;
