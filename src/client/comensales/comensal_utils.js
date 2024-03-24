import ComensalListObject from './comensal_list_object';
import * as ComensalDrag from './comensal_drag';

class ComensalUtils {
    // static sideContainer = 'comensales-content';
    static initialId = 1;

    constructor(controls, controller, items, container) {
        ComensalDrag.setControls(controls);
        ComensalDrag.setController(controller);
        this.#fillComensalListObjectArray(items);
        this.container = container;
    }


    selected(table) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (!comensalListObject) {
            // Como todas las mesas deben tener una lista de comensales, se crea si no existe.
            comensalListObject = new ComensalListObject(table);
            this.allComensalListObject.push(comensalListObject);

            // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
            ComensalDrag.setAllComensalListObject(this.allComensalListObject);
        }
        comensalListObject.selected(this.container);
    }

    #fillComensalListObjectArray(items) {
        // Funcion extra que puede servir en el futuro para rellenar la lista de comensales.

        this.allComensalListObject = [];

        items.forEach(item => {
            if (item.metadata.istable){
                const comensalListObject = ComensalUtils.comensalListFromTable(table);
                if (comensalListObject) {
                    this.allComensalListObject.push(comensalListObject);
                }
            }
        })
        // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
        ComensalDrag.setAllComensalListObject(this.allComensalListObject);
    }

    addComensal(table) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        if(!comensalListObject) {
            // Como todas las mesas deben tener una lista de comensales, se crea si no existe.
            comensalListObject = new ComensalListObject(table);
            this.allComensalListObject.push(comensalListObject);
            // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
            ComensalDrag.setAllComensalListObject(this.allComensalListObject);
        }
        const comensal = {
            id: ComensalUtils.initialId,
            nombre: `Comensal ${ComensalUtils.initialId}`,
            listObject: this
        };
        comensalListObject.addComensal(comensal, this.container);
        ComensalUtils.initialId++;
    }

    modificaComensal(table, params) {
        const comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (comensalListObject) 
            comensalListObject.modifyComensal(params);
        else
            console.error('No se ha encontrado la lista de comensales de la mesa');
    }

    /**
     * Busca el objeto three de comensales de la mesa
     * @param {OnFloorItemGroup} table
     * @returns {ComensalListObject | undefined}
     */
    static comensalListFromTable(table) {
        // Se busca el hijo de la mesa que tenga la instancia CSS2DObject (solo la usaré para los comensales)
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
        return !!ComensalUtils.comensalListFromTable(table);
    }
}

export default ComensalUtils;