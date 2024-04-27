import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
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
        button.id = `btn-${this.uuid}`;
        button.className = 'accordion-button collapsed comensal-list-title';
        button.type = 'button';
        button.dataset.bsToggle = 'collapse';
        button.dataset.bsTarget = `#collapse-${this.uuid}`;
        button.textContent = table.metadata.itemName;

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
        ComensalHTML.addDeactivateControlsEvent(div);

        // Se elimina el comportamiento por defecto de dragover (chrome no permite el drop en otros elementos por defecto)
        ComensalHTML.removeDragOverDefault(div);

        // Crea el objeto CSS2D
        this.comensalList = new CSS3DObject(div);
        this.comensales = [];
        this.boundToTable(table);
        this.comensalList.position.set(0, 50, 0);
        this.previousScale = table.scale.clone();

        table.onItemResized.add(() => {
            console.log('resized!!!')
            let currentScale = table.scale;
            let scaleChange = this.previousScale.clone().divide(currentScale);
            this.comensalList.scale.multiply(scaleChange);
            this.previousScale = currentScale.clone();
        });
    }

    selected(container) {
        ComensalHTML.comensalesToHtml(this, container);
    }

    changeListName(newName) {
        this.comensalList.element.querySelector(`#btn-${this.uuid}`).textContent = newName;
    }

    hideList() {
        // Para evitar que funcione la api drag and drop, el elemento debe ser invisible, luego se usa para comprarar
        this.comensalList.visible = false;
    }

    showList() {
        // Para que funcione la api drag and drop, el elemento debe estar visible, luego se usa para comprarar
        this.comensalList.visible = true;
    }

    addComensal(comensal, container) {
        const html = document.createElement('li');
        html.id = `comensal_${comensal.id}`;
        html.className = 'list-group-item small d-flex gap-1';
        ComensalHTML.addDragEvent(html);

        const textHtml = document.createElement('p');
        textHtml.style.width = 'fit-content';
        textHtml.style.margin = '0';
        textHtml.textContent = comensal.nombre;
        html.appendChild(textHtml);

        // Añade el elemento li al ul dentro del div de colapso
        this.comensalList.element.querySelector(`#comensales-${this.uuid}`).appendChild(html);

        const comensalJson = {
            comensal: comensal,
            html: html
        }
        this.comensales.push(comensalJson);
        ComensalHTML.comensalToHtml(this, comensal, container);
        
        // Se añade el badge si tiene descripcion el nuevo comensal
        if (comensal.descripcion)
            ComensalHTML.addBadge(comensalJson.html);

        // Si ya tenia categorias, se añaden
        comensal.categorias.forEach(category => {
            ComensalHTML.addCategoryToComensal(html, category);
        });
    }

    /**
     * Modifica un comensal.
     * @param {key: value} params - Un objeto que contiene los nuevos valores para el comensal.
     */
    modifyComensal(params) {
        const comensalJson = this.comensales.find(c => c.comensal.id === params.id);
        let addBadge = false;

        // Si el comensal existe en la mesa
        if (comensalJson) {
            /* 
            Se mira si se debe añadir un badge (Solo si pasa de no tener descripción a tenerla)
            o si se le debe quitar (pasa de tenerla a no tenerla).
            */
            const comensal = comensalJson.comensal;
            if (params.descripcion)
                addBadge = true;

            // Se actualiza el comensal
            Object.assign(comensal, params);
            // Se modifica el html del comensal del comensal side menu
            $(`#comensal-nombre-${comensal.id}`).text(comensal.nombre);
            // Se actualiza el html de la lista 3D del comensal
            $(comensalJson.html).find('p').text(comensal.nombre);

            // Se añade o se quita el badge
            if (addBadge)
                ComensalHTML.addBadge(comensalJson.html);
        }
        else 
            console.error('El comensal no existe en esta mesa');
    }

    getComensal(comensalId) {
        return this.comensales.find(c => c.comensal.id === comensalId);
    }

    // Elimina una categoria de un comensal de esta lista
    removeComensalCategory(comensalId, category) {
        const comensal = this.getComensal(comensalId);
        // Si existe el comensal
        if (comensal && category) {
            // Si el comensal contiene esta categoria, se elimina y se quita de su html de la lista de la mesa
            if (comensal.comensal.categorias.some(c => c.name === category.name)) {
                // Se obtiene su indice y se borra
                let index = comensal.comensal.categorias.indexOf(category);
                comensal.comensal.categorias.splice(index, 1);
                // Quita el html de la categoria del comensal
                ComensalHTML.removeCategoryFromComensal(comensal.html.id.split('_')[1], category);
            }
            else {
                alert('El comensal no tiene la categoria')
                console.error('El comensal no tiene la categoria');
            }
        }
        else 
            console.error("El comensal o la categoria no existen");
    }

    // Añade una categoria a un comensal de esta lista
    addComensalCategory(comensalId, category) {
        const comensal = this.getComensal(comensalId);
        // Si existe el comensal
        if (comensal && category) {
            // Si este no tiene todavia esa categoria se añade
            if (!comensal.comensal.categorias.includes(category)) {
                comensal.comensal.categorias.push(category);
                
                ComensalHTML.addCategoryToComensal(comensal.html, category);
            }
            else {
                alert('El comensal ya tiene la categoria');
                console.error('El comensal ya tiene la categoria');
            }
        
        }
        else
            console.error("El comensal o la categoria no existen");
    }

    // Reordena las listas tanto del comensal side menu como de la mesa
    reorderComensals(container) {
        // Selected hace que se rehaga la lista de comensales en el side menu
        this.selected(container);

        // Se borra la lista de comensales de la mesa
        const ul = this.comensalList.element.querySelector(`#comensales-${this.uuid}`);
        ul.innerHTML = '';

        // Se rehace en el orden correcto
        this.comensales.forEach(comensalJson => {
            ul.appendChild(comensalJson.html);
        });
    }

    boundToTable(table) {
        table.boundItem(this);
        table.add(this.comensalList);
    }

    remove(table) {
        table.remove(this.comensalList);
        table.unboundItem(this)
    }
}

export default ComensalListObject;
