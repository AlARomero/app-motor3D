const Blueprint3d = require('./lib/blueprint3d');
import ComensalUtils from './comensales/comensal_utils';

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

      $("#add-first-comensal").on('click', () => {
        comensalUtils.addComensal(selectedItem);
      })

      // Se agrega el evento para el boton de guardar edicion de comensales
      $("#save-comensal").on('click', (e) => {
        const id = $('#id-del-comensal-seleccionado').text();
        const params = {id: id, nombre: $("#nombre-comensal").val(), descripcion: $("#descripcion-comensal").val()};
        comensalUtils.modificaComensal(selectedItem, params);
        $('#close-comensal-modal').trigger('click');
      });
  
      three.itemSelectedCallbacks.add(itemSelected);
      three.itemUnselectedCallbacks.add(itemUnselected);
      three.getScene().itemRemovedCallbacks.add(removeComensalList);
      three.getScene().comensalListLoaded.add(convertObjectToComensalListAndAddToTable);
  
      initResize();
  
      $("#fixed").on('click', function() {
          var checked = $(this).prop('checked');
          selectedItem.setFixed(checked);
      });
      $("#context-menu").hide();
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

      $("#fixed").prop('checked', item.fixed); //TODO Por que esto esta aqui?
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
      let x = selectedItem.position.x; //TODO Posicion x del objeto se cambia arrastrandolo, necesario tambien un control?
      let y = $("#actual-elevation-value").val();
      let z = selectedItem.position.z; //TODO Posicion z del objeto se cambia arrastrandolo, necesario tambien un control?

      //Control de valores minimos y maximos
      if(y > 300) // Maximo
        y = 300;
      else if(y < 0)  //Minimo
        y = 0;
      
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
  
    init();
  }

  const MainMenu = function(blueprint3d, comensalUtils, sideMenu, mainControls){
    const scope = this;
    const three = blueprint3d.three;
    this.selectedItem = undefined; 
    this.lastSelectedItem = undefined;
    
    this.mainMenuStates = {
      'CLEAN': 0,
      'LIST_VIEW_MODE': 1,
      'LIST_EDIT_MODE': 2
    }
    this.actualState = this.mainMenuStates.LIST_EDIT_MODE;

    function init() {
      
      $("#main-menu-mode-clean").on('click', () => {changeState(scope.mainMenuStates.CLEAN)});
      $("#main-menu-mode-list-view").on('click', () => {changeState(scope.mainMenuStates.LIST_VIEW_MODE)});
      $("#main-menu-mode-list-edit").on('click', () => {changeState(scope.mainMenuStates.LIST_EDIT_MODE)});


      // Se agregan a las callbacks cuando debe mostrarse o no el menu principal
      three.itemSelectedCallbacks.add(hideMenu);
      three.itemSelectedCallbacks.add(checkSelectedTable);
      three.itemUnselectedCallbacks.add(checkUnselectedTable);
      three.nothingClicked.add(showMenu);
      three.wallClicked.add(hideMenu);
      three.floorClicked.add(hideMenu);
      three.getScene().itemLoadedCallbacks.add(checkNewTable);
      sideMenu.stateChangeCallbacks.add(changeMenuVisibility);
      mainControls.newModelLoadedCallbacks.add(() => {changeState($("#main-menu-mode-list-edit").trigger('click'))});

      $("#main-menu-mode-list-edit").trigger('click');
    }

    function changeMenuVisibility(state) {
      if (state === sideMenu.states.DEFAULT)
        showMenu();
      else 
        hideMenu();
    }

    function hideMenu() {
      $("#main-menu").hide();
    }
    
    function showMenu() {
      $("#main-menu").show();
    }

    function changeState(newState) {
      if (scope.actualState === newState)
        return;
      switch (newState) {
        case scope.mainMenuStates.CLEAN:
          comensalUtils.hideAllLists();
          scope.actualState = scope.mainMenuStates.CLEAN;
          break;
        case scope.mainMenuStates.LIST_VIEW_MODE:
          comensalUtils.hideAllLists();
          scope.actualState = scope.mainMenuStates.LIST_VIEW_MODE;
          break;
        case scope.mainMenuStates.LIST_EDIT_MODE:
          comensalUtils.showAllLists();
          scope.actualState = scope.mainMenuStates.LIST_EDIT_MODE;
          break;
      }
      three.getScene().needsUpdate = true;
    }

    function checkNewTable(table) {
      if (table.metadata.isTable && (scope.actualState === scope.mainMenuStates.LIST_VIEW_MODE || scope.actualState === scope.mainMenuStates.CLEAN)) {
        comensalUtils.hideList(table);
        three.getScene().needsUpdate = true;
      }
    }

    function checkSelectedTable(item) {
      scope.lastSelectedItem = scope.selectedItem;
      scope.selectedItem = item;
      if (scope.lastSelectedItem?.metadata.isTable && scope.selectedItem && scope.lastSelectedItem !== scope.selectedItem && scope.actualState === scope.mainMenuStates.LIST_VIEW_MODE) {
        comensalUtils.hideList(scope.lastSelectedItem);
        three.getScene().needsUpdate = true;
      }
    }

    function checkUnselectedTable() {
      if (scope.selectedItem?.metadata.isTable && scope.actualState === scope.mainMenuStates.LIST_VIEW_MODE) {
        comensalUtils.hideList(scope.selectedItem);
        three.getScene().needsUpdate = true;
      }
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
      $("#wallTextures").hide(); 
      $("#actual-floor-height").val(room.altitude); 
      $("#floorTexturesDiv").show();  
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
      else if (height > 700) {
        height = 700;
        $("#actual-wall-height").val(700);
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

      if (altitude < 0) { 
        altitude = 0;
        $("#actual-floor-height").val(0);
      }
      else if (altitude > 700) {
        altitude = 700;
        $("#actual-floor-height").val(700);
      }
      
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

    function newDesign() {
      comensalUtils.clearLists();
      blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
      scope.newModelLoadedCallbacks.fire();
    }
  
    function loadDesign() {
      comensalUtils.clearLists();
      const files = $("#loadFile").get(0).files;
      
      const reader  = new FileReader();
      reader.onload = function(event) {
          var data = event.target.result;
          blueprint3d.model.loadSerialized(data);
      }
      reader.readAsText(files[0]);
      scope.newModelLoadedCallbacks.fire();
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
  
    function init() {
      $("#new").on('click', newDesign);
      $("#loadFile").on('change', loadDesign);
      $("#saveFile").on('click', saveDesign);
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
    
    // This serialization format needs work
    // Load a simple rectangle room
   blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":-104.0130000000003,"y":331.7239999999996},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":406.0189999999998,"y":331.7239999999996},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":406.0189999999998,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":-104.0130000000003,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
          
  });
  