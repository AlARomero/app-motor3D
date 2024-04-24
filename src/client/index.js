const Blueprint3d = require('./lib/blueprint3d');
import ComensalUtils from './comensales/comensal_utils';
import gsap from 'gsap';
import * as THREE from 'three';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) {

    var orbitControls = blueprint3d.three.controls;
    var three = blueprint3d.three;
  
    var panSpeed = 30;
    var directions = {
      UP: 1,
      DOWN: 2,
      LEFT: 3,
      RIGHT: 4
    }
  
    function init() {
      // Camera controls
      $("#zoom-in").on('click', zoomIn);
      $("#zoom-out").on('click', zoomOut);  
      $("#zoom-in").on('dblclick', preventDefault);
      $("#zoom-out").on('dblclick', preventDefault);
  
      $("#reset-view").on('click', three.centerCamera)
  
      $("#move-left").on('click', function(){
        pan(directions.LEFT)
      })
      $("#move-right").on('click', function(){
        pan(directions.RIGHT)
      })
      $("#move-up").on('click', function(){
        pan(directions.UP)
      })
      $("#move-down").on('click', function(){
        pan(directions.DOWN)
      })
  
      $("#move-left").on('dblclick', preventDefault);
      $("#move-right").on('dblclick', preventDefault);
      $("#move-up").on('dblclick', preventDefault);
      $("#move-down").on('dblclick', preventDefault);
    }
  
    function preventDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    function pan(direction) {
      switch (direction) {
        case directions.UP:
          orbitControls.panXY(0, panSpeed);
          break;
        case directions.DOWN:
          orbitControls.panXY(0, -panSpeed);
          break;
        case directions.LEFT:
          orbitControls.panXY(panSpeed, 0);
          break;
        case directions.RIGHT:
          orbitControls.panXY(-panSpeed, 0);
          break;
      }
    }
  
    function zoomIn(e) {
      e.preventDefault();
      orbitControls.dollyIn(1.1);
      orbitControls.update();
    }
  
    function zoomOut(e) {
      e.preventDefault;
      orbitControls.dollyOut(1.1);
      orbitControls.update();
    }
  
    init();
  }
  
  /*
   * Context menu for selected item
   */ 
  
  var ContextMenu = function(blueprint3d, comensalUtils, mainMenu) {
  
    let selectedItem;
    let three = blueprint3d.three;

    // Sirve para saber que categorias que quieren añadir o borrar de un comensal y cuantas veces se ha pulsado.
    let categoryStack = []; // Contiene [{categoryName, addTimes, removeTimes}]

    /* The flag that determines whether the wheel event is supported. */
    let supportsWheel = false;
  
    function init() {

      // Se inicializa el objeto de control de comensales

      // Se agrega el evento para el boton de borrar objeto
      $("#context-menu-delete").on('click', function(event) {
          selectedItem.remove();
      });

      // Se agrega el evento para el boton de guardar edicion del item
      $("#save-item-options").on('click', () => {

        selectedItem.metadata.itemDescription = $("#description-textarea").val();
        const newName = $("#item-name-input").val();

        // Se verifica si el objeto seleccionado es una mesa, si tiene una lista de comensales y si ha cambiado el nombre
        if (selectedItem.metadata.isTable) {
          const comensalListObject = ComensalUtils.comensalListFromTable(selectedItem);
          if (comensalListObject && selectedItem.metadata.itemName !== newName){
            // Se modifica su nombre
            comensalUtils.changeComensalListName(comensalListObject, newName)
          }
        }

        // Se terminan de realizar los cambios generales al item
        selectedItem.metadata.itemName = newName;
        changeItemOnDisplay();
        $('#close-description-modal').trigger('click');
      });

      // Añadir comensales
      $("#add-first-comensal").on('click', () => {
        comensalUtils.addComensal(selectedItem);
      })


      // Evento del boton que agrega categoria a comensales (dentro del modal de edicion)
      $("#btn-add-category-from-comensal").on('click', () => {
        const categoryName = $("#comensal-category-selector").val();

        // NA se refiere a la opcion de selector por defecto, no es una categoria
        if (categoryName && categoryName === 'NA')
          return;

        if (categoryStack.some(element => element.categoryName === categoryName)){
          // Se aumenta en uno el contador de veces que se ha pulsado el boton de añadir
          let index = categoryStack.findIndex(element => element.categoryName === categoryName);
          categoryStack[index].addTimes++;
        }
        else {
          // Si no existe, se crea
          categoryStack.push({categoryName: categoryName, addTimes: 1, removeTimes: 0});
        }

        // Se muestra el toast de adicion de categoria
        const additionToast = document.getElementById('addition-category-toast');
        const toastBoostrap1 = bootstrap.Toast.getOrCreateInstance(additionToast);
        toastBoostrap1.show();

      })

      // Evento del boton que borra categoria a comensales (dentro del modal de edicion)
      $("#btn-remove-category-from-comensal").on('click', () => {
        const categoryName = $("#comensal-category-selector").val();

        // NA se refiere a la opcion de selector por defecto, no es una categoria
        if (categoryName && categoryName === 'NA')
          return;

        // Si ya se ha pulsado alguno de los botones, el elemento ya tiene json en el array. 
        if (categoryStack.some(element => element.categoryName === categoryName)){
          // Se aumenta en uno el contador de veces que se ha pulsado el boton de borrar
          let index = categoryStack.findIndex(element => element.categoryName === categoryName);
          categoryStack[index].removeTimes++;
        }
        else {
          // Si no existe, se crea
          categoryStack.push({categoryName: categoryName, addTimes: 0, removeTimes: 1});
        }


        // Se muestra el toast de borrado de categoria
        const deletionToast = document.getElementById('deletion-category-toast');
        const toastBoostrap2 = bootstrap.Toast.getOrCreateInstance(deletionToast);
        toastBoostrap2.show();
        
      })

      // Se agrega el evento para el boton de guardar edicion de comensales
      $("#save-comensal").on('click', (e) => {
        const id = $('#id-del-comensal-seleccionado').text();
        const params = {id: id, nombre: $("#nombre-comensal").val(), descripcion: $("#descripcion-comensal").val()};

        // Se añaden las categorias que se quieren añadir y se borran las demas.
        categoryStack.forEach((element) => {
          // Se restan las veces que se le ha dado al boton de añadir con las veces dadas al boton de borrar del mismo elemento
          const rest = element.addTimes - element.removeTimes;

          // Si es mayor, se añade. Si es menor, se resta ya que se le habria dado mas veces al boton de borrar
          if (rest > 0)
            addCategoryToComensal(element.categoryName);
          else if (rest < 0)
            removeCategoryFromComensal(element.categoryName);

          // Si el resto es 0, la categoria ni se añade ni se borra.
        });

        comensalUtils.modificaComensal(selectedItem, params);
        $('#close-comensal-modal').trigger('click');

        // Se reinician el stack de categorias ya que se quita el modal.
        categoryStack = [];
      });

      $("#up-comensal-side-button").on('click', () => {
        comensalUtils.getComensalSideSelectedUp(selectedItem);
      });
      $("#down-comensal-side-button").on('click', () => {
        comensalUtils.getComensalSideSelectedDown(selectedItem);
      });
  
      three.itemSelectedCallbacks.add(itemSelected);
      three.itemUnselectedCallbacks.add(itemUnselected);
      three.getScene().itemRemovedCallbacks.add(removeComensalList);
      three.getScene().comensalListLoaded.add(convertObjectToComensalListAndAddToTable);

      //Add the event listeners for each event of mousewheel (for floorplanner zooming).
      document.addEventListener('wheel', doSomething);
      document.addEventListener('mousewheel', doSomething);
      document.addEventListener('DOMMouseScroll', doSomething); 
      
      initResize();
  
      $("#fixed").on('click', function() {
          var checked = $(this).prop('checked');
          selectedItem.setFixed(checked);
      });
      $("#context-menu").hide();
    }

    /* The function that will run when the events are triggered. */
    function doSomething (e) {
      /* Check whether the wheel event is supported. */
      if ($('#floorplan_tab').is(':checked')) {
    
        if (e.type == "wheel") supportsWheel = true;
        else if (supportsWheel) return;
    
        /* Determine the direction of the scroll (< 0 → up, > 0 → down). */
        const delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;
    
        /* ... */
        if (delta > 0) {
            blueprint3d.floorplanner.zoomOut(1.05);
        } else {
            blueprint3d.floorplanner.zoomIn(1.05);
        }
      }
    }
  
    function cmToIn(cm) {
      return cm / 2.54;
    }
  
    function inToCm(inches) {
      return inches * 2.54;
    }
  
    function changeItemOnDisplay() {
      $("#context-menu-name").text(selectedItem.metadata.itemName);
      $("#item-description").text(selectedItem.metadata.itemDescription);
    }

    function itemSelected(item) {
      selectedItem = item;

      // Se actualiza la descripcion (tambien la del modal de edicion de descripcion)
      changeItemOnDisplay();
      $("#item-name-input").val(item.metadata.itemName);
      $("#description-textarea").val(item.metadata.itemDescription);
      
      
      // Se actualizan los valores de ancho, alto y profundidad del objeto seleccionado

      $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
      $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
      $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

      // Si es tipo 8 se muestra el control de elevacion con el valor correspondiente al objeto seleccionado

      if (item.metadata.itemType == 8){
        $("#actual-elevation-value").val((selectedItem.position.y - selectedItem.desfaseAltura).toFixed(2));
        $("#elevation-controls-btn").show();
      }

      // Si no es tipo 8 se oculta el control de elevacion y el boton que permite mostrarlo

      else {
        if($("#elevation-controls-btn").attr('aria-expanded') === 'true'){
          $("#elevation-controls-btn").trigger('click');
        }
        $("#elevation-controls-btn").hide();
      }
      
      // Se inicializan los comensales (en el caso de ser una mesa)
      initComensales();

      /*
      Se muestra el context menu (sin el control de elevacion aunque este esta
      dentro del context menu, se muestra o no segun el tipo de objeto seleccionado)
      */
      $("#context-menu").show();

      $("#fixed").prop('checked', item.fixed);
    }

    function initComensales() {
      if(selectedItem.metadata.isTable) {
        // Si es mesa puede tener comensales, se construye el html y se muestra dentro del contenedor
        comensalUtils.selected(selectedItem)
          
        $("#comensales-container").show();
      }
      else{
        // Si no es una mesa, se esconde el control de comensales
        $("#comensales-container").hide();
      }
    }
  
    function resize() {
      selectedItem.resize(
        inToCm($("#item-height").val()),
        inToCm($("#item-width").val()),
        inToCm($("#item-depth").val())
      );
    }

    //Funcion que actualiza la posicion del objeto seleccionado
    function setNewItemPosition() {
      let x = selectedItem.position.x;
      let y = $("#actual-elevation-value").val();
      let z = selectedItem.position.z;
      
      y = (parseFloat(y)+ parseFloat(selectedItem.desfaseAltura));
      
      $("#actual-elevation-value").val((y - selectedItem.desfaseAltura).toFixed(2));
      selectedItem.setPosition(x, y, z);      
    }
  
    function initResize() {
      $("#item-height").on('change', resize);
      $("#item-width").on('change', resize);
      $("#item-depth").on('change', resize);
      //Se agrega el evento para el control de elevacion
      $("#actual-elevation-value").on('change', setNewItemPosition);
    }
  
    // Se deselecciona el objeto, se oculta el context menu
    function itemUnselected() {
      selectedItem = null;
      $("#context-menu").hide();
    }

    function convertObjectToComensalListAndAddToTable(table, comensalList) {
      comensalUtils.comensalListFromObject(comensalList, table);
    }

    function removeComensalList(item) {
      if (item.metadata.isTable && item.itemsBounded[0] && item.itemsBounded[0].constructor.name === 'ComensalListObject') {
        const list = item.itemsBounded[0];
        list.remove(item);
        list.comensalList.element.parentNode.removeChild(list.comensalList.element);
      }
    }

    // Funcion para añadir una categoria de un comensal
    function addCategoryToComensal(categoryName) {
        const category = comensalUtils.getCategoryByName(categoryName);
        const id = $('#id-del-comensal-seleccionado').text();
        const table = selectedItem;

        comensalUtils.sumarCategoriaComensal(table, id, category);
    }

    // Funcion para borrar una categoria de un comensal
    function removeCategoryFromComensal(categoryName) {
        const category = comensalUtils.getCategoryByName(categoryName);
        const id = $('#id-del-comensal-seleccionado').text();
        const table = selectedItem;

        comensalUtils.restarCategoriaComensal(table, id, category);
    }
  
    init();
  }

  const MainMenu = function(blueprint3d, comensalUtils, sideMenu, mainControls){
    const scope = this;
    const three = blueprint3d.three;
    const camera = three.getCamera();
    this.selectedItem = undefined; 
    this.lastSelectedItem = undefined;
    this.cameraViewButtons = [];
    
    this.comensalViewStates = {
      'CLEAN': 0,
      'LIST_VIEW_MODE': 1,
      'LIST_EDIT_MODE': 2
    }
    this.cameraViewPointStates = {
      'SELECTING': 0,
      'SAVING': 1
    }
    this.actualComensalViewState = this.comensalViewStates.LIST_EDIT_MODE;
    this.actualCameraViewState = this.cameraViewPointStates.SELECTING;

    function init() {
      
      $("#main-menu-mode-clean").on('click', () => {changeState(scope.comensalViewStates.CLEAN)});
      $("#main-menu-mode-list-view").on('click', () => {changeState(scope.comensalViewStates.LIST_VIEW_MODE)});
      $("#main-menu-mode-list-edit").on('click', () => {changeState(scope.comensalViewStates.LIST_EDIT_MODE)});

      $("#camera-view-save-btn").on('click', savingMode);
      scope.cameraViewButtons.push($("#camera-view-1"));
      scope.cameraViewButtons.push($("#camera-view-2"));
      scope.cameraViewButtons.push($("#camera-view-3"));
      scope.cameraViewButtons.push($("#camera-view-4"));
      scope.cameraViewButtons.push($("#camera-view-5"));
      scope.cameraViewButtons[0].on('click', () => {viewPointClicked(scope.cameraViewButtons[0])});
      scope.cameraViewButtons[1].on('click', () => {viewPointClicked(scope.cameraViewButtons[1])});
      scope.cameraViewButtons[2].on('click', () => {viewPointClicked(scope.cameraViewButtons[2])});
      scope.cameraViewButtons[3].on('click', () => {viewPointClicked(scope.cameraViewButtons[3])});
      scope.cameraViewButtons[4].on('click', () => {viewPointClicked(scope.cameraViewButtons[4])});


      // Se agregan a las callbacks cuando debe mostrarse o no el menu principal
      three.itemSelectedCallbacks.add(hideMenu);
      three.itemSelectedCallbacks.add(checkSelectedTable);
      three.itemUnselectedCallbacks.add(checkUnselectedTable);
      three.nothingClicked.add(showMenu);
      three.wallClicked.add(hideMenu);
      three.floorClicked.add(hideMenu);
      three.getScene().itemLoadedCallbacks.add(checkNewTable);
      sideMenu.stateChangeCallbacks.add(changeMenuVisibility);
      mainControls.newModelLoadedCallbacks.add(loadNewFloorplanViewPoints);
      mainControls.newModelLoadedCallbacks.add(getCategoriesToComensalUtils);
      mainControls.newModelLoadedCallbacks.add(() => {changeState($("#main-menu-mode-list-edit").trigger('click'))});

      // Evento para generar la lista de comensales en el offcanvas de lista de comensales
      $("#offcanvas-conmensal-button").on('click', () => {
        // Obtengo la primera opcion del select
        let firstOptionValue = $('#category-offcanvas-selector option:first').val();

        // Si el selector no tiene la primera opcion puesta, se pulsa con la opcion predeterminada, la primera
        if ($('#category-offcanvas-selector').val() !== firstOptionValue){
          $('#category-offcanvas-selector').prop('selectedIndex', 0).trigger('change');
        }
        // Si no, se obtiene la lista
        else
          getComensalOffCanvasList();

      });

      // Evento para borrar el contenido del modal de nueva categoria
      $('#add-new-category').on('click', () => {
        $("#new-category-name").val('');
        $("#new-category-color").val('#cccccc');
      })

      // Evento de guardado de nueva categoria
      $("#save-new-category").on('click', () => {
        const name = $("#new-category-name").val();
        const color = $("#new-category-color").val();
        comensalUtils.crearCategoria(name, color);
        $("#close-new-category-modal").trigger('click');
      });

      // Evento de guardado de edicion de categoria
      $("#save-edit-category").on('click', () => {
        const name = $("#edit-category-name").val();
        const newColor = $("#edit-category-color").val();
        const category = comensalUtils.getCategoryByName(name);
        comensalUtils.modificarCategoria(category, newColor);
        $("#close-edit-category-modal").trigger('click');
      });

      // Se agregan los eventos para los botones de descarga de pdf del modal de lista de comensales
      $("#download-comensal-pdf").on('click', () => {
        const categoryName = $("#category-offcanvas-selector").val();
        const category = comensalUtils.getCategoryByName(categoryName);
        // Si la categoria no es la de por defecto (Todos, esta categoria no es guardada), se descarga filtrando por categoria
        if (category)
          downloadComensalPDF(category);
        else
          downloadComensalPDF();
      });

      /* 
      Cuando se pulsa un elemento del dropdown de categorias del modal de lista de comensales, 
      se cambia el texto del boton de dropdown y se filtra la lista por la categoria
      */
      $("#category-offcanvas-selector").on('change', function() {
        const categoryName = $(this).val();
        const category = comensalUtils.getCategoryByName(categoryName);

        // Se filtran los comensales de esa categoria
        getComensalOffCanvasList(category);
      })

      $("#main-menu-mode-list-edit").trigger('click');
    }

    function savingMode() {
      if (scope.actualCameraViewState === scope.cameraViewPointStates.SELECTING){
        scope.actualCameraViewState = scope.cameraViewPointStates.SAVING;
        addSavingViewPointStyle();
      }
      else {
        scope.actualCameraViewState = scope.cameraViewPointStates.SELECTING;
        removeSavingViewPointStyle();
      }
    }

    function getCategoriesToComensalUtils() {
      comensalUtils.setCategoriesByScene();
    }

    function viewPointClicked(buttonClicked) {
      // Si el modo actual es guardar, se guarda el punto de vista actual de la camara
      if (scope.actualCameraViewState === scope.cameraViewPointStates.SAVING) {
        // Se consigue el indice del boton pulsado
        const index = scope.cameraViewButtons.indexOf(buttonClicked);

        // Se obtienen las coordenadas de la camara y se guarda el punto de vista
        const position = camera.position.clone();
        const rotation = camera.rotation.clone();
        const target = three.controls.target.clone();

        // Se guarda el punto de vista
        const viewPoint = {position: position, rotation: rotation, target: target};
        three.getModel().floorplan.addViewPoint(viewPoint, index);

        // Si no tenia una posicion guardada anteriormente, se cambia su estilo
        if (!buttonClicked.hasClass("btn-secondary")){
          buttonClicked.removeClass("btn-outline-secondary");
          buttonClicked.addClass("btn-secondary");
        }

        // Se cambia el estado de la camara a seleccionar
        savingMode();
      }

      // Si no, se cambia al punto de vista de la camara, si este contiene un punto de vista guardado
      else if (scope.actualCameraViewState === scope.cameraViewPointStates.SELECTING){
        const index = scope.cameraViewButtons.indexOf(buttonClicked);
        const viewPoint = three.getModel().floorplan.getViewPoint(index);
        if (viewPoint){
          // Se cambia la camara a la posicion guardada con una animacion gsap
          moveCamera(viewPoint.position, viewPoint.rotation, viewPoint.target);
        }
      }
    }

    // GSAP Animation para mover la cámara
    function moveCamera(position, rotation, target) {
      // Mientras se realizan las animaciones, se actualiza la escena y los controls

      // Position Animation
      gsap.to(camera.position, {
        duration: 1.5, x: position.x, y: position.y, z: position.z, ease: "power2.inOut",
        onUpdate: () => {three.getScene().needsUpdate = true; three.controls.update();},
        onComplete: () => {three.getScene().needsUpdate = true; three.controls.update();}
      });
      // Rotation Animation
      gsap.to(camera.rotation, 
        { duration: 1.5, x: rotation.x, y: rotation.y, z: rotation.z,  ease: "power2.inOut",
          onUpdate: () => {three.getScene().needsUpdate = true; three.controls.update();},
          onComplete: () => {three.getScene().needsUpdate = true; three.controls.update();}
        });
      // TargetPosition Animation
      gsap.to(three.controls.target,
        { duration: 1.5, x: target.x, y: target.y, z: target.z,  ease: "power2.inOut",
          onUpdate: () => {three.getScene().needsUpdate = true; three.controls.update();},
          onComplete: () => {three.getScene().needsUpdate = true; three.controls.update();}
        });
    }

    function resetCameraViewButtons() {
      scope.cameraViewButtons.forEach((button) => {
        button.removeClass("btn-secondary");
        button.addClass("btn-outline-secondary");
      });
    }

    function loadNewFloorplanViewPoints() {
      resetCameraViewButtons();
      const viewPoints = three.getModel().floorplan.getViewPoints();
      viewPoints.forEach((viewPoint, index) => {
        const button = scope.cameraViewButtons[index];
        if (viewPoint){
          button.removeClass("btn-outline-secondary");
          button.addClass("btn-secondary");
        }
      });
    }

    function removeSavingViewPointStyle() {
      scope.cameraViewButtons.forEach((button) => {
        if (button.hasClass("btn-outline-warning"))
          button.removeClass("btn-outline-warning");
        else
          button.removeClass("btn-warning");
      });
    }

    function addSavingViewPointStyle() {
      scope.cameraViewButtons.forEach((button) => {
        if (button.hasClass("btn-outline-secondary"))
          button.addClass("btn-outline-warning");
        else
          button.addClass("btn-warning");
      });
    }

    // Muestra o esconde el menu principal segun deba verse
    function changeMenuVisibility(state) {
      if (state === sideMenu.states.DEFAULT)
        showMenu();
      else 
        hideMenu();
    }

    // Esconde el menu principal
    function hideMenu() {
      $("#main-menu").hide();
    }
    
    // Muestra el menu principal
    function showMenu() {
      $("#main-menu").show();
    }

    // Funcion que cambia el estado del menu principal al nuevo indicado
    function changeState(newState) {
      if (scope.actualComensalViewState === newState)
        return;
      switch (newState) {
        case scope.comensalViewStates.CLEAN:
          comensalUtils.hideAllLists();
          scope.actualComensalViewState = scope.comensalViewStates.CLEAN;
          break;
        case scope.comensalViewStates.LIST_VIEW_MODE:
          comensalUtils.hideAllLists();
          scope.actualComensalViewState = scope.comensalViewStates.LIST_VIEW_MODE;
          break;
        case scope.comensalViewStates.LIST_EDIT_MODE:
          comensalUtils.showAllLists();
          scope.actualComensalViewState = scope.comensalViewStates.LIST_EDIT_MODE;
          break;
      }
      three.getScene().needsUpdate = true;
    }

    // Revisa si el nuevo item es una mesa y, si lo es y el actual estado indica que hay que ocultar listas, se oculta la lista de la mesa
    function checkNewTable(table) {
      if (table.metadata.isTable && (scope.actualComensalViewState === scope.comensalViewStates.LIST_VIEW_MODE || scope.actualComensalViewState === scope.comensalViewStates.CLEAN)) {
        comensalUtils.hideList(table);
        three.getScene().needsUpdate = true;
      }
    }

    // Funcion que revisa los items seleccionados y esconde o muestra listas segun corresponda
    function checkSelectedTable(item) {
      // Se actualiza el item seleccionado
      scope.lastSelectedItem = scope.selectedItem;
      scope.selectedItem = item;
      
      // Si el anterior era una mesa y el actual es una mesa, se oculta la lista del anterior y se muestra la del actual
      if (scope.lastSelectedItem?.metadata.isTable && scope.selectedItem?.metadata.isTable && scope.actualComensalViewState === scope.comensalViewStates.LIST_VIEW_MODE) {
        comensalUtils.hideList(scope.lastSelectedItem);
        comensalUtils.showList(scope.selectedItem);
        three.getScene().needsUpdate = true;
      }

      // Si el anterior no era una mesa pero el actual sí, se muestra la lista del actual.
      else if (scope.selectedItem?.metadata.isTable && scope.actualComensalViewState === scope.comensalViewStates.LIST_VIEW_MODE) {
        comensalUtils.showList(scope.selectedItem);
        three.getScene().needsUpdate = true;
      }

      // En los demas casos no se hace nada
    }

    function checkUnselectedTable() {
      if (scope.selectedItem?.metadata.isTable && scope.actualComensalViewState === scope.comensalViewStates.LIST_VIEW_MODE) {
        comensalUtils.hideList(scope.selectedItem);
        three.getScene().needsUpdate = true;
      }
    }

    // Funcion que genera la lista de comensales. Si se le pasa una categoria, filtra la lista por esa categoria
    function getAllComensals(category = undefined) {
      let comensals;
      // Si la categoria existe, se filtra por categoria
      if (category)
        comensals = comensalUtils.getAllComensalsByCategory(category);
      else
        comensals = comensalUtils.getAllComensals();
      return comensals;
    }

    // Funcion que genera la lista de comensales del offcanvas
    function getComensalOffCanvasList(category = undefined) {
      const comensals = getAllComensals(category);

      let html = '';
      // Si no hay comensales se devuelve un mensaje
      if (comensals.length === 0)
        html = '<li class="list-group-item"> Aun no hay comensales en esta categoria </li>';
      else {
        comensals.forEach(comensal => {
          html += `<li class="list-group-item"> ${comensal.nombre} </li>`;
        });
      }

      // Se reemplaza la lista con la nueva
      $("#offcanvas-comensal-list").html(html);


    }

  
    // Captura del diseño
    function designScreenshot() {
      return blueprint3d.three.dataUrl();
    }


    // Crea un pdf con una tabla que contiene a la lista actual de comensales y lo descarga
    function downloadComensalPDF(category = undefined) {

      // Crea un nuevo documento PDF
      const doc = new jsPDF();

      // Establece el estilo del texto
      doc.setFont('helvetica');
      doc.setFontSize(14);
      doc.setTextColor(40);
      // Añade el titulo
      let title = 'Lista de Comensales';
      if (category)
        title += ' - ' + category.displayName;
      doc.text(title, 10, 10);

      // Crea una matriz de objetos para la tabla
      const tableData = [];
      getAllComensals(category).forEach(comensal => {
        const data = [ comensal.nombre, comensal.descripcion ];
        tableData.push(data);
      });

      // Añade la tabla al PDF
      autoTable(doc, {
        head: [['Nombre', 'Descripción']],
        body: tableData,
        startY: 20,
      });
      const finalY = doc.autoTable.previous.finalY;

      const imgUrl = designScreenshot();

      // Añade la imagen al PDF
      doc.addImage(imgUrl, 'PNG', 10, finalY + 10, 180, 80);

      // Guarda el PDF
      doc.save('comensales.pdf');
    }

    // Se inicializa
    init();
  }
  
  /*
   * Side menu
   */
  
  var SideMenu = function(blueprint3d, floorplanControls) {
    var blueprint3d = blueprint3d;
    var floorplanControls = floorplanControls;
  
    const CHECKED = "checked";
  
    const tabs = {
      "FLOORPLAN" : $("#floorplan_tab"),
      "SHOP" : $("#items_tab"),
      "DESIGN" : $("#design_tab")
    }
  
    const scope = this;
    this.stateChangeCallbacks = $.Callbacks();
  
    this.states = {
      "DEFAULT" : {
        "div" : $("#viewer"),
        "tab" : tabs.DESIGN
      },
      "FLOORPLAN" : {
        "div" : $("#floorplanner"),
        "tab" : tabs.FLOORPLAN
      },
      "SHOP" : {
        "div" : $("#add-items"),
        "tab" : tabs.SHOP
      }
    }
  
    // sidebar state
    let currentState = scope.states.FLOORPLAN;
  
    function init() {
      for (let tab in tabs) {
        const elem = tabs[tab];
        elem.click(tabClicked(elem));
      }
  
      $("#update-floorplan").on('click', floorplanUpdate);
  
      initLeftMenu();
  
      blueprint3d.three.updateWindowSize();
      handleWindowResize();
  
      initItems();
  
      scope.stateChangeCallbacks.add((state) => {
        if (state !== scope.states.DEFAULT) {
          $('.3d-viewer-control').hide();
        }
        else {
          $('.3d-viewer-control').show();
        }
      })
      setCurrentState(scope.states.DEFAULT);
    }
  
    function floorplanUpdate() {
      setCurrentState(scope.states.DEFAULT);
    }
  
    function tabClicked(tab) {
      return function() {
        // Stop three from spinning
        blueprint3d.three.stopSpin();
  
        // Selected a new tab
        for (let key in scope.states) {
          const state = scope.states[key];
          if (state.tab == tab) {
            setCurrentState(state);
            break;
          }
        }
      }
    }
    
    function setCurrentState(newState) {
  
      if (currentState == newState) {
        return;
      }
  
      // show the right tab as active
      if (currentState.tab !== newState.tab) {
        if (currentState.tab != null) {
          currentState.tab.prop(CHECKED, false);          
        }
        if (newState.tab != null) {
          newState.tab.prop(CHECKED, true);
        }
      }
  
      // set item unselected
      blueprint3d.three.getController().setSelectedObject(null);
  
      // show and hide the right divs
      currentState.div.hide()
      newState.div.show()
  
      // custom actions
      if (newState == scope.states.FLOORPLAN) {
        floorplanControls.updateFloorplanView();
        floorplanControls.handleWindowResize();
      } 
  
      if (currentState == scope.states.FLOORPLAN) {
        blueprint3d.model.floorplan.update();
      }
  
      if (newState == scope.states.DEFAULT) {
        blueprint3d.three.updateWindowSize();
      }
   
      // set new state
      handleWindowResize();    
      currentState = newState;
  
      scope.stateChangeCallbacks.fire(newState);
    }
  
    function initLeftMenu() {
      $( window ).on('resize', handleWindowResize );
      handleWindowResize();
    }
  
    function handleWindowResize() {
      $(".sidebar").height(window.innerHeight);
      $("#add-items").height(window.innerHeight);
  
    };
  
    // TODO: this doesn't really belong here
    function initItems() {
      $("#add-items").find(".add-item").on('mousedown', function(e) {
        const modelUrl = $(this).attr("model-url");
        const itemType = parseInt($(this).attr("model-type"));
        const isTable = $(this).attr("model-is-table") === 'true';
        const metadata = {
          itemName: $(this).attr("model-name"),
          resizable: true,
          modelUrl: modelUrl,
          itemType: itemType,
          itemDescription: "",
          isTable: isTable
        }
  
        blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
        setCurrentState(scope.states.DEFAULT);
      });
    }
  
    init();
  
  }
  
  /*
   * Change floor and wall textures and adjust wall height
   */
  
  var WallAndFloorSelector = function (blueprint3d, sideMenu) {
  
    var scope = this;
    var three = blueprint3d.three;
    var isAdmin = isAdmin;
    this.floorPlanner = blueprint3d.floorplanner;
  
    var currentTarget = null;
  
    function initSelectors() {
      $(".texture-select-thumbnail").on('click', function(e) {
        var textureUrl = $(this).attr("texture-url");
        var textureStretch = ($(this).attr("texture-stretch") == "true");
        var textureScale = parseInt($(this).attr("texture-scale"));
        currentTarget.setTexture(textureUrl, textureStretch, textureScale);
  
        e.preventDefault();
      });
    }

    function init() {
      three.wallClicked.add(wallClicked);
      three.floorClicked.add(floorClicked);
      three.itemSelectedCallbacks.add(reset);
      three.nothingClicked.add(reset);
      sideMenu.stateChangeCallbacks.add(reset);

      //Se agrega el evento para el control de altura de los muros
      $("#actual-wall-height").on('change', updateWallsHeight);
      $("#actual-floor-height").on('change', updateFloorHeight);
      $("#transparent-floor").on('change', transparent);

      initSelectors();
    }
  
    function wallClicked(halfEdge) {
      currentTarget = halfEdge;
      $("#floorTexturesDiv").hide();  
      $("#actual-wall-height").val(halfEdge.height);
      // Recoge tambien el boton de altura
      $("#wallTextures").show();  
    }
  
    function floorClicked(room) {
      currentTarget = room;
      $("#transparent-floor").val(room.transparence);
      $("#wallTextures").hide(); 
      $("#actual-floor-height").val(room.altitude); 
      $("#floorTexturesDiv").show();  
    }

    // Si el suelo es visible lo vuelve transparente, si no, lo vuelve opaco para que vuelva a ser visible
    function transparent() {
      const room = currentTarget;
      const floorplan = three.getModel().floorplan;

      const transparence = $("#transparent-floor").val();

      // Cambia la transparencia de el suelo de la habitacion
      floorplan.changeRoomTransparency(room, transparence);
      // Actualiza el plano
      floorplan.update();
    }
  
    function reset() {
      $("#wallTextures").hide();  
      $("#floorTexturesDiv").hide();  
    }

    //Funcion que actualiza la altura de los muros
    function updateWallsHeight() {
      // Obtengo el muro seleccionado (ya que se selecciona un half edge)
      const wall = currentTarget.wall;
      const floorplan = three.getModel().floorplan;

      // Se obtiene la altura que se quiere cambiar desde el boton
      let height = parseFloat($("#actual-wall-height").val());
    
      // Control de valores minimos
      if (height < 0) { 
        height = 0;
        $("#actual-wall-height").val(0);
      }

      // Se cambia la altura a los half edges que tenga el muro
      if(wall.frontEdge)
        wall.frontEdge.height = height;
      if(wall.backEdge)
        wall.backEdge.height = height;

      // Finalmente se le cambia la altura al muro
      wall.setWallHeight(height);

      // Se pide que se actualice el plano de suelo (los muros y suelos en general)
      floorplan.update();
    }

    function updateFloorHeight() {
      const room = currentTarget;
      const floorplan = three.getFloorPlan().floorplan;
      
      let altitude = parseFloat($("#actual-floor-height").val());

      floorplan.changeRoomAltitude(room.getUuid(), altitude);
    }
  
    init();
  }
  
  /*
   * Floorplanner controls
   */
  
  var ViewerFloorplanner = function(blueprint3d) {
  
    var canvasWrapper = '#floorplanner';
  
    // buttons
    var move = '#move';
    var remove = '#delete';
    var draw = '#draw';
  
    var activeStlye = 'btn-primary disabled';
  
    this.floorplanner = blueprint3d.floorplanner;
  
    var scope = this;
  
    function init() {
  
      $( window ).on('resize', scope.handleWindowResize );
      scope.handleWindowResize();
  
      // mode buttons
      scope.floorplanner.modeResetCallbacks.add(function(mode) {
        $(draw).removeClass(activeStlye);
        $(remove).removeClass(activeStlye);
        $(move).removeClass(activeStlye);
        if (mode == scope.floorplanner.modes.MOVE) {
            $(move).addClass(activeStlye);
        } else if (mode == scope.floorplanner.modes.DRAW) {
            $(draw).addClass(activeStlye);
        } else if (mode == scope.floorplanner.modes.DELETE) {
            $(remove).addClass(activeStlye);
        }
  
        if (mode == scope.floorplanner.modes.DRAW) {
          $("#draw-walls-hint").show();
          scope.handleWindowResize();
        } else {
          $("#draw-walls-hint").hide();
        }
      });
  
      $(move).on('click', function(){
        scope.floorplanner.setMode(scope.floorplanner.modes.MOVE);
      });
  
      $(draw).on('click', function(){
        scope.floorplanner.setMode(scope.floorplanner.modes.DRAW);
      });
  
      $(remove).on('click', function(){
        scope.floorplanner.setMode(scope.floorplanner.modes.DELETE);
      });
    }
  
    this.updateFloorplanView = function() {
      scope.floorplanner.reset();
    }
  
    this.handleWindowResize = function() {
      $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
      
      scope.floorplanner.resizeView();
    };
  
    init();
  }; 
  
  var MainControls = function(blueprint3d, comensalUtils) {

    const scope = this;
    this.newModelLoadedCallbacks = $.Callbacks();

    function newDesign(skyBox) {

      comensalUtils.clearLists();

      let usedSkyBox = skyBox;

      // Se mira si se le ha pasado un skybox o se usa el por defecto (llamada a traves de evento jquery)
      if (!(usedSkyBox instanceof THREE.Object3D))
        usedSkyBox = blueprint3d.three.skyBox.getModel();

      // Calcula el bounding box de skyBox
      const boundingBox = new THREE.Box3().setFromObject(usedSkyBox);
    
      // Obtiene las coordenadas de las esquinas del bounding box
      const min = boundingBox.min;
      const max = boundingBox.max;
    
      // Crea un objeto con las posiciones de las esquinas
      const corners = {
        "f90da5e3-9e0e-eba7-173d-eb0b071e838e": { x: min.x, y: max.z },
        "da026c08-d76a-a944-8e7b-096b752da9ed": { x: max.x, y: max.z },
        "4e3d65cb-54c0-0681-28bf-bddcc7bdb571": { x: max.x, y: min.z },
        "71d4f128-ae80-3d58-9bd2-711c6ce6cdf2": { x: min.x, y: min.z }
      };
    
      // Carga el modelo con las nuevas posiciones de las esquinas
      blueprint3d.model.loadSerialized(JSON.stringify({
        "floorplan": {
          "corners": corners,
          "walls": [{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2", "corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}, "height": 0},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}, "height": 0},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}, "height": 0},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}, "height": 0}],
          "wallTextures":[],
          "floorTextures":{},
          "newFloorTextures":{},
          "roomsTransparence": {"4e3d65cb-54c0-0681-28bf-bddcc7bdb571,71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,da026c08-d76a-a944-8e7b-096b752da9ed,f90da5e3-9e0e-eba7-173d-eb0b071e838e": 0}
          },
        "items": [],
        "categories": [],
      }));

      scope.newModelLoadedCallbacks.fire();
    }
  
    function loadDesign() {
      // Se limpian las lista de comensales
      comensalUtils.clearLists();
      
      const fileInput = $("#loadFile").get(0);
      const files = fileInput.files;
      
      const reader  = new FileReader();
      reader.onload = function(event) {
          const data = event.target.result;
          blueprint3d.model.loadSerialized(data);
          scope.newModelLoadedCallbacks.fire();
      }
      reader.readAsText(files[0]);

      // Limpio el valor del elemento de carga del navegador (ya que las cargas se manejan mediante el evento change)
      fileInput.value = '';
    }
  
    function saveDesign() {
      const data = blueprint3d.model.exportSerialized();
      const a = document.createElement('a');
      const blob = new Blob([data], {type : 'text'});
      a.href = URL.createObjectURL(blob);
      a.download = 'design.blueprint3d';
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a)
    }

    function loadSkyboxModel() {
      const fileInput = $("#load-new-model").get(0);
      const files = fileInput.files;

      const reader = new FileReader();
      reader.onload = function(event) {
        const data = event.target.result;
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);

        blueprint3d.three.skyBox.loadNewModel(url);
      }

      reader.readAsArrayBuffer(files[0]);
      fileInput.value = '';
    }
  
    function init() {
      $("#new").on('click', newDesign);
      $("#loadFile").on('change', loadDesign);
      $("#saveFile").on('click', saveDesign);
      $("#load-new-model").on('change', loadSkyboxModel);
      blueprint3d.three.skyBox.onSkyBoxLoad(newDesign);
    }
  
    init();
  }

  /*
   * Initialize!
   */
  
  $(function() {
  
    // main setup
    const opts = {
      floorplannerElement: 'floorplanner-canvas',
      threeElement: '#viewer',
      threeCanvasElement: 'three-canvas',
      textureDir: "models/textures/",
      widget: false
    }
    const blueprint3d = new Blueprint3d(opts);
    const comensalUtils = new ComensalUtils(blueprint3d.three.controls, blueprint3d.three.getController(), blueprint3d.three.getScene(), 'comensales-content');
  
    const viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    const sideMenu = new SideMenu(blueprint3d, viewerFloorplanner);
    const wallAndFloorSelector = new WallAndFloorSelector(blueprint3d, sideMenu);        
    const cameraButtons = new CameraButtons(blueprint3d);
    const mainControls = new MainControls(blueprint3d, comensalUtils);
    const mainMenu = new MainMenu(blueprint3d, comensalUtils, sideMenu, mainControls);
    const contextMenu = new ContextMenu(blueprint3d, comensalUtils, mainMenu);
  });
  