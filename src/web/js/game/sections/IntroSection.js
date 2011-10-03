/*
IntroSection.js
Intro module, handles introduction to story and teaching user basic game mechanics.
*/
var KAIOPUA = (function (main) {
    
    var shared = main.shared = main.shared || {},
        game = main.game = main.game || {},
        sections = game.sections = game.sections || {},
        intro = sections.intro = sections.intro || {},
        assets,
        renderer, 
        renderTarget,
        camera,
        scene,
        ambient,
        composerScene,
        renderPasses;
    
    /*===================================================
    
    external init
    
    =====================================================*/
    
    function init () {
        
        assets = main.utils.loader.assets;
        
        init_environment();
        
        init_render_processing();
        
    }
    
    function init_environment () {
        
        // camera
        
        //camera = new THREE.Camera(60, shared.screenWidth / shared.screenHeight, 1, 10000);
        
        camera = new THREE.FirstPersonCamera( { fov: 60, aspect:shared.screenWidth / shared.screenHeight, near: 1, far: 20000, movementSpeed: 1000, lookSpeed: 0.1, noFly: false, lookVertical: true } );
        
        // scene
        
        scene = new THREE.Scene();
        
        // lights
        
        ambient = new THREE.AmbientLight( 0xCCCCCC );
        
        scene.addLight( ambient );
        
        var light1 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
        light1.position = new THREE.Vector3(-1, -1, 1).normalize();
        
        scene.addLight( light1 );
        
        // fog
        
        scene.fog = new THREE.Fog( 0xffffff, -100, 10000 );
        
        // kaiopua
        
        var geometry = assets["assets/models/kaiopua_head.js"];
        var material = new THREE.MeshLambertMaterial( { color: 0xffaa55 } );
        var mesh = new THREE.Mesh( geometry, material );
        var scale = 100;
    	
		mesh.scale.set( scale, scale, scale );
        console.log('mesh in');
        scene.addChild( mesh );
    }
    
    function init_render_processing () {
        
        var shaderScreen = THREE.ShaderExtras[ "screen" ];
        
        // render passes
        
        renderPasses = {
            env: new THREE.RenderPass( scene, camera ),
            screen: new THREE.ShaderPass( shaderScreen )
        };
        
        renderPasses.screen.renderToScreen = true;
        
        // renderer
        
        renderer = shared.renderer;
        renderTarget = shared.renderTarget;
        
        // composer
        
        composerScene = new THREE.EffectComposer( renderer );
        
        composerScene.addPass( renderPasses.env );
        composerScene.addPass( renderPasses.screen );
        
    }
    
    /*===================================================
    
    section functions
    
    =====================================================*/
    
    function show () {
        
        shared.signals.windowresized.add( resize );
        
    }
    
    function hide () {
        
        shared.signals.windowresized.remove( resize );
        
    }
    
    function remove () {
        
    }
    
    function update () {
        
        // render
        
        renderer.setViewport( 0, 0, shared.screenWidth, shared.screenHeight );

        renderer.clear();
        
		composerScene.render();
        
    }
    
    function resize ( W, H ) {
        
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        
        composerScene.reset();
        
    }
    
    /*===================================================
    
    public properties
    
    =====================================================*/
    
    intro.init = init;
    intro.show = show;
    intro.hide = hide;
    intro.remove = remove;
    intro.update = update;
    intro.resize = resize;
    intro.domElement = function () {};
    
    return main; 
    
}(KAIOPUA || {}));