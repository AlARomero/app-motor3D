import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as ComensalUtils from './comensal_utils';
import * as ComensalHTML from './comensal_drag';

class ComensalListObject {

    constructor(table) {

        // TODO darle mejor formato
        const ul = document.createElement('ul');
        ul.className = 'list-group';
        ul.textContent = 'Comensales';
        ul.id = `comensales-${table.uuid}`;
    
        this.comensalList = new CSS2DObject(ul);
        this.comensales = [];
        this.table = table;
        this.boundToTable(table);
    }

    selected(container) {
        ComensalHTML.comensalesToHtml(this, container);
    }

    addComensal(comensal, container) {
        const html = document.createElement('li');
        html.textContent = comensal.nombre;
        html.id = `comensal-${comensal.id}`;
        html.className = 'list-group-item';
        ComensalHTML.addDragEvent(html);
        this.comensalList.element.appendChild(html);
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
            const comensalLi = this.comensalList.element.querySelector(`#comensal-${comensal.id}`);
            comensalLi.textContent = comensal.nombre;
        }
        else 
            console.error('El comensal no existe en esta mesa');
    }

    boundToTable(table) {
        table.boundItem(this);
        table.add(this.comensalList);
    }

    unBoundComensalList() {
        this.table.unBoundItem(this);
        this.table.remove(this.comensalList);
    }
}

export default ComensalListObject;
