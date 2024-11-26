import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as COW from '../../libs/objects/cow.js';

import * as STACK from '../../libs/stack.js';

let isAnimating = false;
let program; // To store the active WebGL program

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    CUBE.init(gl);
    SPHERE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    TORUS.init(gl);
    BUNNY.init(gl);
    COW.init(gl);

    

    // Function to rebuild the program based on the selected shader
    function updateShaders(gl, shaderType) {
        let vertexShader = shaderType === "gouraud" ? shaders["gShader.vert"] : shaders["pShader.vert"];
        const fragmentShader = shaderType === "gouraud" ? shaders["gShader.frag"] : shaders["pShader.frag"];
        
        // Build a new program
        program = buildProgramFromSources(gl, vertexShader, fragmentShader);
        gl.useProgram(program);
    }

    // Initialize with the Gouraud shader
    updateShaders(gl, "gouraud");




    // Camera  
    let camera = {
        eye: vec3(0, 0, 5),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    }

    let options = {
        wireframe: false,
        normals: true,
        backfaceCulling:true,
        zBuffer: true
    }

    // Data structure for lights
    let lightsData = {
        worldLight: {
        position: { x: 0, y: 10, z: 0 },
        ambient: [255, 255, 255], // Ambient color (RGB)
        diffuse: [255, 255, 255], // Diffuse color (RGB)
        specular: [255, 255, 255], // Specular color (RGB)
        directional: false,
        active: true,
        type: 0
        },
        cameraLight: {
        position: { x: 0, y: 5, z: 5 },
        ambient: [255, 255, 255], // Ambient color (RGB)
        diffuse: [255, 255, 255], // Diffuse color (RGB)
        specular: [255, 255, 255], // Specular color (RGB)
        directional: false,
        active: true,
        type: 1
        },
        objectLight: {
        position: { x: 0.2, y: 0.2, z: 1.5 },
        ambient: [255, 255, 255], // Ambient color (RGB)
        diffuse: [255, 255, 255], // Diffuse color (RGB)
        specular: [255, 255, 255], // Specular color (RGB)
        directional: true,
        active: true,
        type: 2
        },
    };

    const gui = new dat.GUI();
    gui.domElement.id = "ligths-gui";
    
    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "wireframe");
    optionsGui.add(options, "normals");
    optionsGui.add(options, "backfaceCulling");//TODO
    optionsGui.add(options, "zBuffer");//TODO

    const cameraGui = gui.addFolder("camera");

    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";

    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    // Lights folder
    const lightsFolder = gui.addFolder("lights");
    
    // Add a subfolder for each light
    ["worldLight", "cameraLight", "objectLight"].forEach((lightName) => {
        const lightFolder = lightsFolder.addFolder(`${lightName.replace("Light", " Light")}`);
    
        // Position folder
        const positionFolder = lightFolder.addFolder("Position");
        positionFolder.add(lightsData[lightName].position, "x", -5, 5, 0.01).name("X").listen();
        positionFolder.add(lightsData[lightName].position, "y", -5, 5, 0.01).name("Y").listen();
        positionFolder.add(lightsData[lightName].position, "z", -5, 5, 0.01).name("Z").listen();

        positionFolder.open();
    
        // Color pickers
        lightFolder.addColor(lightsData[lightName], "ambient").name("Ambient");
        lightFolder.addColor(lightsData[lightName], "diffuse").name("Diffuse");
        lightFolder.addColor(lightsData[lightName], "specular").name("Specular");
    
        // Directional and Active checkboxes
        lightFolder.add(lightsData[lightName], "directional").name("Directional");
        lightFolder.add(lightsData[lightName], "active").name("Active");
    });

    // Create the GUI
    const objectGUI = new dat.GUI();
    objectGUI.domElement.id = "object-gui";

    // Define the available objects and their corresponding draw functions
    const objectMapping = {
        "Bunny": BUNNY,
        "Cow": COW,
        "Sphere": SPHERE,
        "Cylinder": CYLINDER,
        "Cube": CUBE,
        "Pyramid": PYRAMID,
        "Torus": TORUS
    };

    // Data object to manipulate
    let data = {
      name: "Bunny",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: {
        shader: "gouraud",
        Ka: [31, 66, 142], // Ambient color (RGB)
        Kd: [50, 152, 247], // Diffuse color (RGB)
        Ks: [255, 255, 255], // Specular color (RGB)
        shininess: 100,
      },
      animate: false
    };

    objectGUI.add(data, "name",["Bunny","Cow","Sphere","Cylinder","Cube","Pyramid","Torus"]).name("Name");
    // GUI Folders
    const objectTransform = objectGUI.addFolder("Transform");
    const positionFolder = objectTransform.addFolder("Position");
    positionFolder.add(data.position, "x", -1.5, 1.5, 0.1).name("X").listen();
    positionFolder.add(data.position, "y", 0, 2, 0.1).name("Y").domElement.style.pointerEvents = "none";;
    positionFolder.add(data.position, "z", -1.5, 1.5, 0.1).name("Z").listen();

    const rotationFolder = objectTransform.addFolder("Rotation");
    rotationFolder.add(data.rotation, "x", -180, 180, 1).name("X").domElement.style.pointerEvents = "none";
    rotationFolder.add(data.rotation, "y", -180, 180, 0.1).name("Y").listen();   
    rotationFolder.add(data.rotation, "z", -180, 180, 1).name("Z").domElement.style.pointerEvents = "none";

    const scaleFolder = objectTransform.addFolder("Scale");
    scaleFolder.add(data.scale, "x", 0.1, 2, 0.1).name("X");
    scaleFolder.add(data.scale, "y", 0.1, 2, 0.1).name("Y");
    scaleFolder.add(data.scale, "z", 0.1, 2, 0.1).name("Z");

    const materialFolder = objectGUI.addFolder("Material");
    // Watch for changes to the shader in the GUI
    materialFolder.add(data.material, "shader", ["gouraud", "phong"]).name("Shader").onChange(function(newShader) {
    updateShaders(gl, newShader); // Update shaders dynamically
    });

    // Ambient (Ka) color
    materialFolder.addColor(data.material, "Ka").name("Ka (Ambient)");

    // Diffuse (Kd) color
    materialFolder.addColor(data.material, "Kd").name("Kd (Diffuse)");

    // Specular (Ks) color
    materialFolder.addColor(data.material, "Ks").name("Ks (Specular)");

    // Shininess
    materialFolder.add(data.material, "shininess", 0, 200, 1).name("Shininess");

    objectGUI.add(data,"animate").name("Animate").onChange(function(){isAnimating=!isAnimating;});

    // Open folders by default
    positionFolder.open();
    rotationFolder.open();
    scaleFolder.open();
    
    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function (event) {


        if (!event.shiftKey && !event.metaKey ) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.shiftKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.shiftKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {
                // Do something here...

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.2, 0.0, 0.0, 1.0);
    });

    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
    });

    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            isAnimating = !isAnimating; // Toggle animation state
        }
    });
    

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function uploadModelView() {
        const modelViewMatrix = STACK.modelView(); // Get the current top matrix from the stack
        uploadMatrix("u_model_view", modelViewMatrix);
    }
    

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function base() {
        STACK.pushMatrix();

        STACK.multTranslation([0, -0.6, 0]);
        STACK.multScale([4, 0.05, 4]);
        uploadModelView();

        gl.uniform3fv(gl.getUniformLocation(program, 'baseColor'), [1.0,0.5,0.3]);
        CUBE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
        
        STACK.popMatrix();
    }

    function object() {
        STACK.pushMatrix();
    
        // Apply transformations
        STACK.multScale([data.scale.x, data.scale.y, data.scale.z]); // Apply scale
        uploadModelView();
        // Draw the selected object
        const selectedObject = objectMapping[data.name];
        selectedObject.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    
        STACK.popMatrix();
    }

    function objectLight() {
        STACK.pushMatrix();
    
        // Apply transformations
        STACK.multTranslation([lightsData.objectLight.position.x, lightsData.objectLight.position.y, lightsData.objectLight.position.z]); // Apply position
        STACK.multScale([0.1, 0.1, 0.1]); // Apply scale
        uploadModelView();
        // Draw the selected object
        SPHERE.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    
        STACK.popMatrix();
    }

    function objectWithLight() {
        STACK.pushMatrix();
    
        // Apply transformations
        STACK.multTranslation([data.position.x, data.position.y, data.position.z]); // Apply position
        STACK.multRotationY(data.rotation.y); // Apply rotation on the Y-axis
        uploadModelView();

        object();
        objectLight();

        STACK.popMatrix();        
    }

    function animateObject(time) {
        STACK.pushMatrix();
    
        const amplitude = 1;
        const frequency = 0.002;
        const yPosition = amplitude + Math.sin(frequency * time);
    
        const rotationSpeed = 0.05;
        const yRotation = (time * rotationSpeed) % 360;
    
        STACK.multTranslation([data.position.x, yPosition, data.position.z]);
        STACK.multRotationY(yRotation);
        STACK.multScale([data.scale.x, data.scale.y, data.scale.z]);
        uploadModelView();
    
        objectWithLight();
    
        STACK.popMatrix();
    }
    
    function uploadLights(gl, program, lightsData, mView) {
        const activeLights = Object.values(lightsData).filter(light => light.active);
        const numLights = Math.min(activeLights.length, 8); // Max lights = 8
    
        // Upload the number of active lights
        gl.uniform1i(gl.getUniformLocation(program, "u_n_lights"), numLights);
    
        // Loop through each light and upload its data
        for (let i = 0; i < numLights; i++) {
            const light = activeLights[i];
    
            const w = light.directional ? 0.0 : 1.0; // Directional or point light
            let pos = vec4(light.position.x, light.position.y, light.position.z, w);
    
            // Transform light position to camera space
            pos = mult(mView, pos);
    
            // Normalize color values to [0, 1]
            const ia = [light.ambient[0] / 255, light.ambient[1] / 255, light.ambient[2] / 255];
            const id = [light.diffuse[0] / 255, light.diffuse[1] / 255, light.diffuse[2] / 255];
            const is = [light.specular[0] / 255, light.specular[1] / 255, light.specular[2] / 255];
    
            // Construct uniform names dynamically
            gl.uniform4fv(gl.getUniformLocation(program, `u_light[${i}].pos`), pos);
            gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Ia`), ia);
            gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Id`), id);
            gl.uniform3fv(gl.getUniformLocation(program, `u_light[${i}].Is`), is);
        }
    }
    
    
    function uploadMaterial(gl, program, material) {
        
        const materialAmb = [material.Ka[0] / 255, material.Ka[1] / 255, material.Ka[2] / 255] // Ambient (vec3)
        const materialDif = [material.Kd[0] / 255, material.Kd[1] / 255, material.Kd[2] / 255] // Diffuse (vec3)
        const materialSpe = [material.Ks[0] / 255, material.Ks[1] / 255, material.Ks[2] / 255] // Specular (vec3)
            
    
        // Skip the block index and binding block steps
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), materialAmb);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), materialDif);
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), materialSpe);
        gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), material.shininess);
    }

    function teste(gl, program) {
        
        const light = lightsData.cameraLight;
        
        const w = light.directional ? 0.0 : 1.0; // Directional or point light
        
        const pos = [light.position.x, light.position.y, light.position.z, w];
        const ia = [light.ambient[0] / 255, light.ambient[1] / 255, light.ambient[2] / 255];
        const id =  [light.diffuse[0] / 255, light.diffuse[1] / 255, light.diffuse[2] / 255];
        const is = [light.specular[0] / 255, light.specular[1] / 255, light.specular[2] / 255];
        
    
        gl.uniform4fv(gl.getUniformLocation(program, "u_light.pos"), pos);
        gl.uniform3fv(gl.getUniformLocation(program, "u_light.Ia"), ia);
        gl.uniform3fv(gl.getUniformLocation(program, "u_light.Id"), id);
        gl.uniform3fv(gl.getUniformLocation(program, "u_light.Is"), is);
    } 

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Configurações de Z-Buffer
        if (options.zBuffer) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        // Configurações de Backface Culling
        if (options.backfaceCulling) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK); // Define as faces traseiras para serem ignoradas
        } else {
            gl.disable(gl.CULL_FACE);
        }

        gl.useProgram(program);
        
        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);
        
        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        
        // Upload lights and materials
        //uploadLights(gl, program, lightsData);
        //teste(gl,program);
        
        uploadMaterial(gl, program, data.material);
        uploadLights(gl, program, lightsData, mView);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_view"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_view_normals"), false, flatten(normalMatrix(mView)));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_projection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));

        gl.uniform1i(gl.getUniformLocation(program, "u_use_normals"), options.normals);

        // Draw the base
        base();

        // Animate the object if the flag is active
        if (isAnimating) {
            animateObject(time);
        } else {
            // Draw the object in its current static position
            objectWithLight();
        }
    }
}

const urls = ['gShader.vert', 'gShader.frag','pShader.vert','pShader.frag'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));