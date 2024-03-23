import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as ComensalUtils from './comensal_utils';

class ComensalListObject {

    static initialId = 1;
    static sideContainer = 'comensales-content';
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

    selected() {
        ComensalUtils.comensalesToHtml(this, ComensalListObject.sideContainer);
    }

    addComensal() {
        const comensal = {
            id: ComensalListObject.initialId,
            nombre: `Comensal ${ComensalListObject.initialId}`,
            listObject: this
        };
        ComensalListObject.initialId++;

        ComensalUtils.addComensal(this, comensal, ComensalListObject.sideContainer);
    }

    /**
     * Modifica un comensal.
     * @param {key: value} params - Un objeto que contiene los nuevos valores para el comensal.
     */
    modifyComensal(params) {
        ComensalUtils.modificaComensal(this, params);
    }

    boundToTable(table) {
        table.boundItem(this);
        table.add(this.comensalList);
    }

    unBoundComensalList() {
        this.table.unBoundItem(this);
        this.table.remove(this.comensalList);
    }

    /**
     * Busca el objeto three de comensales de la mesa
     * @param {OnFloorItemGroup} table
     * @returns {ComensalListObject | undefined}
     */
    static comensalListFromTable(table) {
        //TODO hacer bien la busqueda
        // Se busca el hijo de la mesa que tenga la instancia CSS2DObject (solo la usaré para los comensales)
        console.log(table.itemsBounded)
        let childrenIter = 0;
        while (childrenIter < table.itemsBounded.length && table.itemsBounded[childrenIter].constructor.name !== 'ComensalListObject') {
            childrenIter++;
        }
        if (childrenIter < table.itemsBounded.length) 
            return table.itemsBounded[childrenIter];
        return undefined;
        // Si no se encuentra el contenedor de comensales algo ha ido mal, debería llamarse siempre cuando exista.
    }

    static hasComensalListObject(table) {
        return !!ComensalListObject.comensalListFromTable(table);
    }
}

export default ComensalListObject;
