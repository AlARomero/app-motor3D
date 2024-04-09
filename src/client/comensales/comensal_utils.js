import ComensalListObject from './comensal_list_object';
import * as ComensalDrag from './comensal_drag';
import { v4 as uuid } from 'uuid';

class ComensalUtils {
    static initialId = 1;

    constructor(controls, controller, scene, container) {
        ComensalDrag.setControls(controls);
        ComensalDrag.setController(controller);
        ComensalDrag.addDeselectAllSelectedOnOutsideClickEvent();
        this.scene = scene;
        this.container = container;
        this.controls = controls;
        this.#fillComensalListObjectArray();
        this.controls.cameraMovedCallbacks.add(() => {this.#positionAllComensalList(controls)});
    }

    // Crea un comensalListObject y lo añade a la lista de todos los comensalListObject. Además actualiza la lista de comensales en ComensalDrag.
    #createComensalListObject(table) {

        const comensalListObject = new ComensalListObject(table);
        this.#positionComensalList(comensalListObject, this.controls);
        this.allComensalListObject.push(comensalListObject);
        
        // Se actualiza la lista de todos los comensales que hay en ComensalDrag.
        ComensalDrag.setAllComensalListObject(this.allComensalListObject);

        return comensalListObject;
    }


    // Selecciona la lista de comensales de la mesa, muestra el side menu de los comensales
    selected(table) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (!comensalListObject) {
            // Como todas las mesas deben tener una lista de comensales, se crea si no existe.
            comensalListObject = this.#createComensalListObject(table);
        }
        comensalListObject.selected(this.container);
    }

    // Esconde todos los objetos 3d de las listas de comensales de las mesas.
    hideAllLists() {
        this.allComensalListObject.forEach(comensalListObject => {
            comensalListObject.hideList();
        });
    }

    // Muestra todos los objetos 3d de comensales de las mesas.
    showAllLists() {
        this.allComensalListObject.forEach(comensalListObject => {
            comensalListObject.showList();
        });
    }

    // Muestra el objeto 3d de comensales de la mesa.
    showList(table) {
        const comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (comensalListObject) {
            comensalListObject.showList();
        }
    }

    // Esconde el objeto 3d de la lista de comensales de la mesa.
    hideList(table) {
        const comensalListObject = ComensalUtils.comensalListFromTable(table);
        if (comensalListObject) {
            comensalListObject.hideList();
        }
    }

    // Si hay un comensal seleccionado en el side menu de comensales, se le sube una posicion en el array de comensales.
    getComensalSideSelectedUp(table) {
        const comensalSideSelected = ComensalDrag.getComensalSideSelected();

        if (comensalSideSelected) {
            /* 
            Se obtiene el id del comensal seleccionado en el side menu de comensales 
            (a traves de su elemento html, que esta construido en comensal_drag).
            */
            const id = comensalSideSelected.split('_')[2];
            // Se obtiene la lista de comensales a traves de la mesa.
            const comensalListObject = ComensalUtils.comensalListFromTable(table);
            // Se obtiene el indice del comensal en la lista de comensales comparando con el extraido previamente (-1 si no lo encuentra).
            const index = comensalListObject.comensales.findIndex(c => c.comensal.id === id);

            /* 
            Si existe y no es el primero, se intercambia el comensal seleccionado con 
            el previo en la lista de comensales y se redibuja el side menu de comensales.
            */
            if (index > 0) {
                let auxVar = comensalListObject.comensales[index];
                comensalListObject.comensales[index] = comensalListObject.comensales[index - 1];
                comensalListObject.comensales[index - 1] = auxVar;
                // Se reordenan las listas en el html.
                comensalListObject.reorderComensals(this.container);
            }
        }
    }

    // Si hay un comensal seleccionado en el side menu de comensales, se le baja una posicion en el array de comensales.
    getComensalSideSelectedDown(table) {
        const comensalSideSelected = ComensalDrag.getComensalSideSelected();

        if (comensalSideSelected) {
            /* 
            Se obtiene el id del comensal seleccionado en el side menu de comensales 
            (a traves de su elemento html, que esta construido en comensal_drag).
            */
            const id = comensalSideSelected.split('_')[2];
            const comensalListObject = ComensalUtils.comensalListFromTable(table);
            // Se busca el indice (-1 si no lo encuentra)
            const index = comensalListObject.comensales.findIndex(c => c.comensal.id === id);
            /* 
            Si existe y no es el ultimo comensal, 
            se intercambia el comensal seleccionado con el siguiente en la lista de comensales y se redibuja el side menu de comensales.
            */
            if (index >= 0 && index < comensalListObject.comensales.length - 1) {
                let auxVar = comensalListObject.comensales[index + 1];
                comensalListObject.comensales[index + 1] = comensalListObject.comensales[index];
                comensalListObject.comensales[index] = auxVar;
                // Se reordenan las listas en el html.
                comensalListObject.reorderComensals(this.container);
            }
        }
    }

    // Actualiza la posición de todas las listas de comensales para que miren a la cámara.
    #positionAllComensalList(controls) {
        this.allComensalListObject.forEach(comensalListObject => {
            this.#positionComensalList(comensalListObject, controls);
        });
    }

    // Actualiza la posición de la lista de comensales para que mire a la cámara.
    #positionComensalList(comensalListObject, controls) {
        comensalListObject.comensalList.lookAt(controls.object.position);
    }

    // Crea un nuevo uuid para darselo a un comensal
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

    /* 
    Al cargar un floorplan ya existente, comensalListObject es reconocido como solo Object (json),
    por lo que se crea una nueva instancia y se transfieren los comensales.
    */
    comensalListFromObject(comensalListFromObject, table) {
        const comensales = comensalListFromObject.comensales;

        // Si no hay comensales, se crea la lista de comensales vacia y se sale de la funcion.
        if (comensales.length === 0) {
            this.#createComensalListObject(table);
            return;
        }

        // Si hay comensales se añaden comensales a la mesa (esto crea automaticamente la lista de comensales si esta no existe).
        comensales.forEach(comensal => {
            const opts = {
                id: comensal.comensal.id,
                nombre: comensal.comensal.nombre,
                descripcion: comensal.comensal.descripcion
            };
            
            this.addComensal(table, opts);
        });
    }

    changeComensalListName(comensalListObject, newName) {
        comensalListObject.changeListName(newName);
    }

    addComensal(table, opts = undefined) {
        let comensalListObject = ComensalUtils.comensalListFromTable(table);
        let idComensal, nameComensal, descripcion;
        if(!comensalListObject) {
            comensalListObject = this.#createComensalListObject(table);
        }
        if (opts){
            idComensal = opts.id;
            nameComensal = opts.nombre;
            descripcion = opts.descripcion;
        }
        else {
            idComensal = this.#getNewComensalId();
            nameComensal = `Comensal ${ComensalUtils.initialId}`;
        }
        const comensal = {
            id: idComensal,
            nombre: nameComensal,
            descripcion: descripcion
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