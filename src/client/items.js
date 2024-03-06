// add items to the "Add Items" tab
$(function() {
  var items = [
   {
      "name" : "Closed Door",
      "image" : "models/thumbnails/EE-PCI-04_1_G2BH.jpg",
      "model" : "models/gltf/EE-PCI-04_1_G2BH.gltf",
      "type" : "7"
    }, 
    {
      "name" : "Open Door",
      "image" : "models/thumbnails/EE-PAB-02_1_SRG0.jpg",
      "model" : "models/gltf/EE-PAB-02_1_SRG0.gltf",
      "type" : "7"
    }, 
  {
    "name": "PC Sobremesa",
    "image": "models/thumbnails/ED-PPC-02_1_5V7L.jpg",
    "model": "models/gltf/ED-PPC-02_1_5V7L.gltf",
    "type": "8"
  },
  {
    "name": "Smartphone",
    "image": "models/thumbnails/ED-SMP-01_1_P0K6.jpg",
    "model": "models/gltf/ED-SMP-01_1_P0K6.gltf",
    "type": "8"
  },
  {
    "name": "Interruptor doble",
    "image": "models/thumbnails/EE-INT-02_1_71NL.jpg",
    "model": "models/gltf/EE-INT-02_1_71NL.gltf",
    "type": "2"
  },
  {
    "name": "Interruptor simple",
    "image": "models/thumbnails/EE-INT-01_1_KR0I.jpg",
    "model": "models/gltf/EE-INT-01_1_KR0I.gltf",
    "type": "2"
  },
  {
    "name": "Alfombra",
    "image": "models/thumbnails/ED-ALF-03_1_TPZ7.jpg",
    "model": "models/gltf/ED-ALF-03_1_TPZ7.gltf",
    "type": "8"
  },
  {
    "name": "Aire acondicionado. Split",
    "image": "models/thumbnails/EE-AAC-01_1_8H7G.jpg",
    "model": "models/gltf/EE-AAC-01_1_8H7G.gltf",
    "type": "2"
  },
  {
    "name": "Enchufe triple",
    "image": "models/thumbnails/EE-ENC-03_1_WZRL.jpg",
    "model": "models/gltf/EE-ENC-03_1_WZRL.gltf",
    "type": "2"
  },
  {
    "name": "Radiador",
    "image": "models/thumbnails/EE-RAD-01_1_MFTK.jpg",
    "model": "models/gltf/EE-RAD-01_1_MFTK.gltf",
    "type": "2"
  },
  {
    "name": "Estor bajo abierto",
    "image": "models/thumbnails/ED-EST-02_1_OC5Q.jpg",
    "model": "models/gltf/ED-EST-02_1_OC5Q.gltf",
    "type": "2"
  },
  {
    "name": "Soporte",
    "image": "models/thumbnails/1564_69_XX3K.jpg",
    "model": "models/gltf/1564_69_XX3K.gltf",
    "type": "1"
  },
  {
    "name": "Encimera curvo izquierda",
    "image": "models/thumbnails/1729_69_5EQ8.jpg",
    "model": "models/gltf/1729_69_5EQ8.gltf",
    "type": "8"
  },
  {
    "name": "Armario rinconera curvo",
    "image": "models/thumbnails/5987_69_BL9H.jpg",
    "model": "models/gltf/5987_69_BL9H.gltf",
    "type": "1"
  },
  {
    "name": "Módulo colgante",
    "image": "models/thumbnails/2119_69_KLAL.jpg",
    "model": "models/gltf/2119_69_KLAL.gltf",
    "type": "8"
  },
  {
    "name": "Planta alta",
    "image": "models/thumbnails/ED-PLA-02_1_O3NS.jpg",
    "model": "models/gltf/ED-PLA-02_1_O3NS.gltf",
    "type": "8"
  },
  {
    "name": "Arcón dos cajones",
    "image": "models/thumbnails/1958_69_AG39.jpg",
    "model": "models/gltf/1958_69_AG39.gltf",
    "type": "1"
  },
  {
    "name": "Armario estantería izquierdo",
    "image": "models/thumbnails/6105_69_W2Y4.jpg",
    "model": "models/gltf/6105_69_W2Y4.gltf",
    "type": "1"
  },
  {
    "name": "Armario una puerta",
    "image": "models/thumbnails/5532_69_QX64.jpg",
    "model": "models/gltf/5532_69_QX64.gltf",
    "type": "1"
  },
  {
    "name": "Coche de juguete",
    "image": "models/thumbnails/ED-JCO-01_1_L6X9.jpg",
    "model": "models/gltf/ED-JCO-01_1_L6X9.gltf",
    "type": "8"
  },
  {
    "name": "Compacto alto 74cm",
    "image": "models/thumbnails/3392_69_TOIB.jpg",
    "model": "models/gltf/3392_69_TOIB.gltf",
    "type": "1"
  }
    /*{
      "name" : "Chair",
      "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model" : "models/js/gus-churchchair-whiteoak.js",
      "type" : "1"
    }, 
    {
      "name" : "Red Chair",
      "image" : "models/thumbnails/thumbnail_tn-orange.png",
      "model" : "models/js/ik-ekero-orange_baked.js",
      "type" : "1"
    },
    {
      "name" : "Blue Chair",
      "image" : "models/thumbnails/thumbnail_ekero-blue3.png",
      "model" : "models/js/ik-ekero-blue_baked.js",
      "type" : "1"
    },
    {
      "name" : "Dresser - Dark Wood",
      "image" : "models/thumbnails/thumbnail_matera_dresser_5.png",
      "model" : "models/js/DWR_MATERA_DRESSER2.js",
      "type" : "1"
    }, 
    {
      "name" : "Dresser - White",
      "image" : "models/thumbnails/thumbnail_img25o.jpg",
      "model" : "models/js/we-narrow6white_baked.js",
      "type" : "1"
    },  
    {
      "name" : "Bedside table - Shale",
      "image" : "models/thumbnails/thumbnail_Blu-Dot-Shale-Bedside-Table.jpg",
      "model" : "models/js/bd-shalebedside-smoke_baked.js",
      "type" : "1"
    }, 
    {
      "name" : "Bedside table - White",
      "image" : "models/thumbnails/thumbnail_arch-white-oval-nightstand.jpg",
      "model" : "models/js/cb-archnight-white_baked.js",
      "type" : "1"
    }, 
    {
      "name" : "Wardrobe - White",
      "image" : "models/thumbnails/thumbnail_TN-ikea-kvikine.png",
      "model" : "models/js/ik-kivine_baked.js",
      "type" : "1"
    }, 
    {
      "name" : "Full Bed",
      "image" : "models/thumbnails/thumbnail_nordli-bed-frame__0159270_PE315708_S4.JPG",
      "model" : "models/js/ik_nordli_full.js",
      "type" : "1"
    }, 
    {
      "name" : "Bookshelf",
      "image" : "models/thumbnails/thumbnail_kendall-walnut-bookcase.jpg",
      "model" : "models/js/cb-kendallbookcasewalnut_baked.js",
      "type" : "1"
    }, 
        {
      "name" : "Media Console - White",
      "image" : "models/thumbnails/thumbnail_clapboard-white-60-media-console-1.jpg",
      "model" : "models/js/cb-clapboard_baked.js",
      "type" : "1"
    }, 
        {
      "name" : "Media Console - Black",
      "image" : "models/thumbnails/thumbnail_moore-60-media-console-1.jpg",
      "model" : "models/js/cb-moore_baked.js",
      "type" : "1"
    }, 
       {
      "name" : "Sectional - Olive",
      "image" : "models/thumbnails/thumbnail_img21o.jpg",
      "model" : "models/js/we-crosby2piece-greenbaked.js",
      "type" : "1"
    }, 
    {
      "name" : "Sofa - Grey",
      "image" : "models/thumbnails/thumbnail_rochelle-sofa-3.jpg",
      "model" : "models/js/cb-rochelle-gray_baked.js",
      "type" : "1"
    }, 
        {
      "name" : "Wooden Trunk",
      "image" : "models/thumbnails/thumbnail_teca-storage-trunk.jpg",
      "model" : "models/js/cb-tecs_baked.js",
      "type" : "1"
    }, 
        {
      "name" : "Floor Lamp",
      "image" : "models/thumbnails/thumbnail_ore-white.png",
      "model" : "models/js/ore-3legged-white_baked.js",
      "type" : "1"
    },
    {
      "name" : "Coffee Table - Wood",
      "image" : "models/thumbnails/thumbnail_stockholm-coffee-table__0181245_PE332924_S4.JPG",
      "model" : "models/js/ik-stockholmcoffee-brown.js",
      "type" : "1"
    }, 
    {
      "name" : "Side Table",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-02-21_at_1.24.58_PM.png",
      "model" : "models/js/GUSossingtonendtable.js",
      "type" : "1"
    }, 
    {
      "name" : "Dining Table",
      "image" : "models/thumbnails/thumbnail_scholar-dining-table.jpg",
      "model" : "models/js/cb-scholartable_baked.js",
      "type" : "1"
    }, 
    {
      "name" : "Dining table",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-01-28_at_6.49.33_PM.png",
      "model" : "models/js/BlakeAvenuejoshuatreecheftable.js",
      "type" : "1"
    },
    {
      "name" : "Blue Rug",
      "image" : "models/thumbnails/thumbnail_cb-blue-block60x96.png",
      "model" : "models/js/cb-blue-block-60x96.js",
      "type" : "8"
    },
    {
      "name" : "NYC Poster",
      "image" : "models/thumbnails/thumbnail_nyc2.jpg",
      "model" : "models/js/nyc-poster2.js",
      "type" : "2"
    }
   /*     
   {
      "name" : "",
      "image" : "",
      "model" : "",
      "type" : "1"
    }, 
    */
  ]



  var itemsDiv = $("#items-wrapper")
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var html = '<div class="col-sm-4">' +
                '<a class="thumbnail add-item" model-name="' + 
                item.name + 
                '" model-url="' +
                item.model +
                '" model-type="' +
                item.type + 
                '"><img class="img-fluid" src="' +
                item.image + 
                '" alt="Add Item"> '+
                item.name +
                '</a></div>';
    itemsDiv.append(html);
  }
});