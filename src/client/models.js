$(function() {
    const models = [
     {
        "name" : "Chalet",
        "image" : "models/thumbnails/Chalet.png",
        "model" : "models/gltf/Chalet_Bodas_02.gltf"
      }, 
      {
        "name" : "Finca",
        "image" : "models/thumbnails/Finca.png",
        "model" : "models/glb/FincaLowPoly.glb"
      }
    ]

    const modelsDiv = $("#models-wrapper");
    for (const model of models) {
      const html = '<div class="col-sm-4">' +
                  '<a class="thumbnail add-model" model-name="' + 
                  model.name + 
                  '" model-url="' +
                  model.model + 
                  '"><img class="img-fluid" src="' +
                  model.image + 
                  '" alt="Model Img"> '+
                  model.name +
                  '</a></div>';
      modelsDiv.append(html);
    }
  });