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

    const program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);

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
        normals: true
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
        },
        cameraLight: {
        position: { x: 0, y: 5, z: 5 },
        ambient: [255, 255, 255], // Ambient color (RGB)
        diffuse: [255, 255, 255], // Diffuse color (RGB)
        specular: [255, 255, 255], // Specular color (RGB)
        directional: false,
        active: true,
        },
        objectLight: {
        position: { x: 0, y: 0, z: 10 },
        ambient: [255, 255, 255], // Ambient color (RGB)
        diffuse: [255, 255, 255], // Diffuse color (RGB)
        specular: [255, 255, 255], // Specular color (RGB)
        directional: false,
        active: true,
        },
    };

    const gui = new dat.GUI();
    gui.domElement.id = "ligths-gui";
    
    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "wireframe");
    optionsGui.add(options, "normals");

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
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    // Lights folder
    const lightsFolder = gui.addFolder("lights");
    
    // Add a subfolder for each light
    ["worldLight", "cameraLight", "objectLight"].forEach((lightName) => {
        const lightFolder = lightsFolder.addFolder(`${lightName.replace("Light", " Light")}`);
    
        // Position folder
        const positionFolder = lightFolder.addFolder("Position");
        positionFolder.add(lightsData[lightName].position, "x", -50, 50, 1).name("X");
        positionFolder.add(lightsData[lightName].position, "y", -50, 50, 1).name("Y");
        positionFolder.add(lightsData[lightName].position, "z", -50, 50, 1).name("Z");

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
    const data = {
      name: "Bunny",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: -90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: {
        shader: "gouraud",
        Ka: [31, 66, 142], // Ambient color (RGB)
        Kd: [50, 152, 247], // Diffuse color (RGB)
        Ks: [255, 255, 255], // Specular color (RGB)
        shininess: 100,
      }
    };

    objectGUI.add(data, "name",["Bunny","Cow","Sphere","Cylinder","Cube","Pyramid","Torus"]).name("Name");
    // GUI Folders
    const objectTransform = objectGUI.addFolder("Transform");
    const positionFolder = objectTransform.addFolder("Position");
    positionFolder.add(data.position, "x", -100, 100, 1).name("X");
    positionFolder.add(data.position, "y", -100, 100, 1).name("Y");
    positionFolder.add(data.position, "z", -100, 100, 1).name("Z");

    const rotationFolder = objectTransform.addFolder("Rotation");
    rotationFolder.add(data.rotation, "x", -180, 180, 1).name("X");
    rotationFolder.add(data.rotation, "y", -180, 180, 1).name("Y");
    rotationFolder.add(data.rotation, "z", -180, 180, 1).name("Z");

    const scaleFolder = objectTransform.addFolder("Scale");
    scaleFolder.add(data.scale, "x", 0.1, 5, 0.1).name("X");
    scaleFolder.add(data.scale, "y", 0.1, 5, 0.1).name("Y");
    scaleFolder.add(data.scale, "z", 0.1, 5, 0.1).name("Z");

    const materialFolder = objectGUI.addFolder("Material");
    materialFolder.add(data.material, "shader", ["gouraud", "phong"]).name("Shader");

    // Ambient (Ka) color
    materialFolder.addColor(data.material, "Ka").name("Ka (Ambient)");

    // Diffuse (Kd) color
    materialFolder.addColor(data.material, "Kd").name("Kd (Diffuse)");

    // Specular (Ks) color
    materialFolder.addColor(data.material, "Ks").name("Ks (Specular)");

    // Shininess
    materialFolder.add(data.material, "shininess", 0, 200, 1).name("Shininess");

    // Open folders by default
    positionFolder.open();
    rotationFolder.open();
    scaleFolder.open();
    

    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function (event) {


        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
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
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);


        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_projection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));

        gl.uniform1i(gl.getUniformLocation(program, "u_use_normals"), options.normals);

        // Use the object mapping to call the appropriate draw function
        const selectedObject = objectMapping[data.name];
        selectedObject.draw(gl, program, options.wireframe ? gl.LINES : gl.TRIANGLES);
    }
}

const urls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));