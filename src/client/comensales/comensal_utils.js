import ComensalListObject from './comensal_list_object';
import * as ComensalDrag from './comensal_drag';
import { v4 as uuid } from 'uuid';

class ComensalUtils {
    static initialId = 1;

    constructor(controls, controller, scene, container) {
        ComensalDrag.setControls(controls);
        ComensalDrag.setController(controller);
        this.scene = scene;
        this.container = container;
        this.controls = controls;
        this.#fillComensalListObjectArray();
        this.controls.cameraMovedCallbacks.add(() => {this.#positionAllComensalList(controls)});
    }


    selected(table) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (!comensalListObject) {
            // Como todas las mesas deben tener una lista de comensales, se crea si no existe.
            comensalListObject = new ComensalListObject(table);
            comensalListObject.comensalList.lookAt(this.controls.object.position);
            this.allComensalListObject.push(comensalListObject);

            // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
            ComensalDrag.setAllComensalListObject(this.allComensalListObject);
        }
        comensalListObject.selected(this.container);
    }

    // Actualiza la posición de todas las listas de comensales para que miren a la cámara.
    #positionAllComensalList(controls) {
        this.allComensalListObject.forEach(comensalListObject => {
            comensalListObject.comensalList.lookAt(controls.object.position);
            console.log(comensalListObject.comensalList.element.style.transform);
        });
    }

    #getNewComensalId() {
        return uuid();
    }

    #fillComensalListObjectArray() {
        // Funcion extra que puede servir en el futuro para rellenar la lista de comensales.

        this.allComensalListObject = [];
        const items = this.scene.getItems();

        items.forEach(item => {
            if (item.metadata.istable){
                const comensalListObject = ComensalUtils.comensalListFromTable(item);
                if (comensalListObject) {
                    this.allComensalListObject.push(comensalListObject);
                }
            }
        })
        // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
        ComensalDrag.setAllComensalListObject(this.allComensalListObject);
    }

    comensalListFromObject(comensalListFromObject, table) {
        const comensales = comensalListFromObject.comensales;

        comensales.forEach(comensal => {
            const opts = {
                id: comensal.id,
                nombre: comensal.nombre
            };
            
            this.addComensal(table, opts);
        });
    }

    addComensal(table, opts = undefined) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        let idComensal, nameComensal;
        if(!comensalListObject) {
            // Como todas las mesas deben tener una lista de comensales, se crea si no existe.
            comensalListObject = new ComensalListObject(table);
            comensalListObject.comensalList.lookAt(this.controls.object.position);
            this.allComensalListObject.push(comensalListObject);
            // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
            ComensalDrag.setAllComensalListObject(this.allComensalListObject);
        }
        if (opts){
            idComensal = opts.id;
            nameComensal = opts.nombre;
        }
        else {
            idComensal = this.#getNewComensalId();
            nameComensal = `Comensal ${ComensalUtils.initialId}`;
        }
        const comensal = {
            id: idComensal,
            nombre: nameComensal
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

    clearLists() {
        ComensalUtils.initialId = 1;
        this.allComensalListObject.forEach(comensalListObject => {
            const table = this.tableFromComensalListObject(comensalListObject);
            comensalListObject.remove(table);
        })
        this.allComensalListObject = [];
        ComensalDrag.setAllComensalListObject(this.allComensalListObject);
    }

    tableFromComensalListObject(comensalListObject) {
        const items = this.scene.getItems();
        let itemIndex = 0;
        while (itemIndex < items.length) {
            if (items[itemIndex].metadata.isTable) {
                const tableComensalListObject = ComensalUtils.comensalListFromTable(items[itemIndex]);
                if (tableComensalListObject && tableComensalListObject.uuid === comensalListObject.uuid) 
                    return items[itemIndex];
            }
            itemIndex++;
        }
        return undefined;
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