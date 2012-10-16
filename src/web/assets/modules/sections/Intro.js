/*
 *
 * Intro.js
 * Handles introduction to story and teaching user basic game mechanics.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/sections/Intro.js",
		intro = {},
		_Game,
		_WorldIsland,
		_Player,
		_Model,
		_ObjectHelper,
        _ready = false,
		waitingToShow = false,
		player,
		world,
		skybox,
		ambient,
		light;
    
    /*===================================================
    
    public properties
    
    =====================================================*/
    
    intro.show = show;
    intro.hide = hide;
    intro.remove = remove;
    intro.update = update;
    intro.resize = resize;
    intro.domElement = function () {};
	
	main.asset_register( assetPath, { 
		data: intro,
		requirements: [
			"assets/modules/core/Game.js",
			"assets/modules/env/WorldIsland.js",
			"assets/modules/core/Player.js",
			"assets/modules/core/Model.js",
			"assets/modules/utils/ObjectHelper.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	} );
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal ( g, w, p, m, oh ) {
		console.log('internal intro');
		if ( _ready !== true ) {
			
			// assets
			
			_Game = g;
			_WorldIsland = w;
			_Player = p;
			_Model = m;
			_ObjectHelper = oh;
			
			// environment
			
			init_environment();
			
			_ready = true;
			
			if ( waitingToShow === true ) {
				
				waitingToShow = false;
				
				show();
				
			}
			
		}
		
	}
    
    function init_environment () {
		
		world = new _WorldIsland.Instance();
		
    }
    
    /*===================================================
    
    section functions
    
    =====================================================*/
    
    function show () {
		
		if ( _ready === true ) {
			
			// camera
			
			_ObjectHelper.revert_change( _Game.cameraControls.options, true );
			_Game.cameraControls.enabled = true;
			_Game.cameraControls.controllable = false;
			
			// add world
			
			world.show();
			
			// TODO: player created in main or game, not in intro
			
			player = new _Player.Instance();
			player.respawn( _Game.scene, new THREE.Vector3( 35, 2200, 300 ) );
			player.enable();
			
			// signals
			
			shared.signals.onWindowResized.add( resize );
			shared.signals.onGameUpdated.add( update );
			
		}
		else {
			
			waitingToShow = true;
			
		}
        
    }
	
	function hide () {
		
		waitingToShow = false;
		
		shared.signals.onWindowResized.remove( resize );
        
        shared.signals.onGameUpdated.remove( update );
		
    }
    
    function remove () {
		
		if ( _ready === true ) {
			
			_Game.scene.remove( player );
			
			// hide world
			
			world.hide();
			
		}
		else {
			
			waitingToShow = false;
			
		}
        
    }
    
    function update () {
		
    }
    
    function resize ( W, H ) {
        
    }
    
} ( KAIOPUA ) );