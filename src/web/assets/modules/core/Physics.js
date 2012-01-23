/*
Physics.js
Physics module, handles physics in game using JigLibJS.
*/
var KAIOPUA = (function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/core/Physics",
		physics = {},
		mathhelper,
		ready = false,
		collisionConfiguration,
		dispatcher,
		overlappingPairCache,
		solver,
		dynamicsWorld,
		gravitySource,
		gravityMagnitude,
		linkBaseName = 'visual_physical_link_',
		linkCount = 0,
		links = [],
		scaleSpeedExp = Math.log( 1.5 ),
		defaultContactProcessingThreshold = 1000000.0,
		shapesMap = {
			BOX_SHAPE_PROXYTYPE : 0,
			TRIANGLE_SHAPE_PROXYTYPE : 1,
			TETRAHEDRAL_SHAPE_PROXYTYPE : 2,
			CONVEX_TRIANGLEMESH_SHAPE_PROXYTYPE : 3,
			CONVEX_HULL_SHAPE_PROXYTYPE : 4,
			CONVEX_POINT_CLOUD_SHAPE_PROXYTYPE : 5,
			CUSTOM_POLYHEDRAL_SHAPE_TYPE : 6,
			IMPLICIT_CONVEX_SHAPES_START_HERE : 7,
			SPHERE_SHAPE_PROXYTYPE : 8,
			MULTI_SPHERE_SHAPE_PROXYTYPE : 9,
			CAPSULE_SHAPE_PROXYTYPE : 10,
			CONE_SHAPE_PROXYTYPE : 11,
			CONVEX_SHAPE_PROXYTYPE : 12,
			CYLINDER_SHAPE_PROXYTYPE : 13,
			UNIFORM_SCALING_SHAPE_PROXYTYPE : 14,
			MINKOWSKI_SUM_SHAPE_PROXYTYPE : 15,
			MINKOWSKI_DIFFERENCE_SHAPE_PROXYTYPE : 16,
			BOX_2D_SHAPE_PROXYTYPE : 17,
			CONVEX_2D_SHAPE_PROXYTYPE : 18,
			CUSTOM_CONVEX_SHAPE_TYPE : 19,
			CONCAVE_SHAPES_START_HERE : 20,
			TRIANGLE_MESH_SHAPE_PROXYTYPE : 21,
			SCALED_TRIANGLE_MESH_SHAPE_PROXYTYPE : 22,
			FAST_CONCAVE_MESH_PROXYTYPE : 23,
			TERRAIN_SHAPE_PROXYTYPE : 24,
			GIMPACT_SHAPE_PROXYTYPE : 25,
			MULTIMATERIAL_TRIANGLE_MESH_PROXYTYPE : 26,
			EMPTY_SHAPE_PROXYTYPE : 27,
			STATIC_PLANE_PROXYTYPE : 28,
			CUSTOM_CONCAVE_SHAPE_TYPE : 29,
			CONCAVE_SHAPES_END_HERE : 30,
			COMPOUND_SHAPE_PROXYTYPE : 31,
			SOFTBODY_SHAPE_PROXYTYPE : 32,
			HFFLUID_SHAPE_PROXYTYPE : 33,
			HFFLUID_BUOYANT_CONVEX_SHAPE_PROXYTYPE : 34,
			INVALID_SHAPE_PROXYTYPE : 35,
			MAX_BROADPHASE_COLLISION_TYPES : 36
		},
		utilBTTransformTranslate,
		utilBTQTranslate,
		utilBTVec3Translate,
		utilBTTransformRot,
		utilBTVec3Rot,
		utilBTTransformIntegrate,
		utilQ1RotMat,
		utilVec31Integrate,
		utilVec32Integrate,
		utilVec31Velocity,
		utilQ1Integrate,
		utilQ2Integrate,
		utilQ3Integrate;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	physics.translate = translate;
	physics.add = add;
	physics.remove = remove;
	physics.start = start;
	physics.stop = stop;
	physics.update = update;
	
	physics.body_pos = body_pos;
	physics.body_pos_x = body_pos_x;
	physics.body_pos_y = body_pos_y;
	physics.body_pos_z = body_pos_z;
	
	physics.body_rot = body_rot;
	physics.body_rot_q = body_rot_q;
	physics.body_rot_mat = body_rot_mat;
	physics.body_rot_axis_angle = body_rot_axis_angle;
	
	// getters and setters
	
	Object.defineProperty(physics, 'gravitySource', { 
		get : function () { return gravitySource; },
		set : set_gravity_source
	});
	
	Object.defineProperty(physics, 'gravityMagnitude', { 
		get : function () { return gravityMagnitude; },
		set : set_gravity_magnitude
	});
	
	Object.defineProperty(physics, 'dynamicsWorld', { 
		get : function () { return dynamicsWorld; }
	});
	
	physics = main.asset_register( assetPath, physics, true );
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	main.assets_require( [
		"assets/modules/utils/MathHelper",
		"js/lib/ammo.js"
	], init_internal, true );
	
	function init_internal ( mh ) {
		console.log('internal physics');
		
		if ( ready !== true ) {
			
			mathhelper = mh;
			
			init_system();
			
			ready = true;
			
			main.asset_ready( assetPath );
			
		}
		
	}
	
	function init_system() {
		
		// utility / conversion objects
		
		utilBTTransformTranslate = new Ammo.btTransform();
		utilBTQTranslate = new Ammo.btQuaternion( 0, 0, 0, 0 );
		utilBTVec3Translate = new Ammo.btVector3( 0, 0, 0 );
		
		utilBTTransformRot = new Ammo.btTransform();
		utilBTVec3Rot = new Ammo.btVector3( 0, 0, 0 );
		
		utilBTTransformIntegrate = new Ammo.btTransform();
		
		utilQ1RotMat = new THREE.Quaternion();
		
		utilVec31Integrate = new THREE.Vector3();
		utilVec32Integrate = new THREE.Vector3();
		utilQ1Integrate = new THREE.Quaternion();
		utilQ2Integrate = new THREE.Quaternion();
		utilQ3Integrate = new THREE.Quaternion();
		
		utilVec31Velocity = new THREE.Vector3();
		
		// setup collision detection
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		overlappingPairCache = new Ammo.btDbvtBroadphase();
		
		// setup solver and world
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		dynamicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
		
		// default gravity
		
		utilBTVec3Translate.setValue( 0, -100, 0 );
		dynamicsWorld.setGravity( utilBTVec3Translate );
		
		// spherical gravity properties
		
		set_gravity_source( new THREE.Vector3( 0, 0, 0 ) );
		set_gravity_magnitude( new THREE.Vector3( 0, -1, 0 ) );
		
	}
	
	/*===================================================
    
    translate / add / remove
    
    =====================================================*/
	
	// translates a mesh + parameters into a new rigid body
	
	function translate ( mesh, parameters ) {
		
		var i, l,
			link,
			ubttform = utilBTTransformTranslate,
			ubtv3 = utilBTVec3Translate,
			ubtq = utilBTQTranslate,
			geometry,
			bboxDimensions,
			bodyType,
			shape,
			meshInterface,
			vertices,
			faces,
			face,
			va,
			vb,
			vc,
			rigidBody,
			width,
			height,
			depth,
			dimMax,
			needWidth,
			needHeight,
			needDepth,
			mass,
			dynamic = false,
			localInertia,
			motionState,
			constructionInfo,
			position,
			rotation;
		
		// handle parameters
		
		parameters = parameters || {};
		
		bodyType = parameters.bodyType;
		
		// validity check
		console.log('PHYSX TRANSLATING...');
		if ( typeof mesh === 'undefined' || typeof bodyType !== 'string' ) {
			console.log(' > PHYSX stopped, invalid');
			return;
			
		}
		
		// handle mesh
		
		mesh = mesh || new THREE.Object3D();
		
		geometry = parameters.geometry || mesh.geometry;
		
		// physics width/height/depth
		
		width = parameters.width;
		
		height = parameters.height;
		
		depth = parameters.depth;
		
		if ( mathhelper.is_number( width ) === false ) {
			
			needWidth = true;
			
		}
		
		if ( mathhelper.is_number( height ) === false ) {
			
			needHeight = true;
			
		}
		
		if ( mathhelper.is_number( depth ) === false ) {
			
			needDepth = true;
			
		}
		
		if ( needWidth === true || needHeight === true || needDepth === true ) {
			
			// model bounding box
			
			bboxDimensions = dimensions_from_bounding_box_scaled( mesh );
			
			if ( needWidth === true ) {
				
				width = bboxDimensions.x;
				
			}
			
			if ( needHeight === true ) {
				
				height = bboxDimensions.y;
			
			}
			
			if ( needDepth === true ) {
				
				depth = bboxDimensions.z;
				
			}
			
		}
		
		// mass
		
		mass = parameters.mass || width * height * depth;
		console.log(' > PHYSX mass: ' + mass);
		// create shape
		
		switch ( bodyType ) {
			
			case 'capsule':
				
				dimMax = Math.max( width, depth );
				
				shape = new Ammo.btCapsuleShape( parameters.radius || dimMax * 0.5, height - dimMax );
				
				break;
			
			case 'sphere':
				
				dimMax = Math.max( width, height, depth );
				
				shape = new Ammo.btSphereShape( parameters.radius || dimMax * 0.5 );
				
				break;
			
			case 'plane':
				
				ubtv3.setValue( 0, 0, 1 );
				
				shape = new Ammo.btStaticPlaneShape( ubtv3, 0);
				
				break;
			
			case 'trimesh':
				
				meshInterface = new Ammo.btTriangleMesh( true, false );
				
				// get all triangles
				
				vertices = geometry.vertices;
				
				faces = geometry.faces;
				
				for( i = 0, l = faces.length; i < l; i++ ) {
					
					face = faces[ i ];
					
					va = vertices[ face.a ];
					vb = vertices[ face.b ];
					vc = vertices[ face.c ];
					
					meshInterface.addTriangle( 
						new Ammo.btVector3( va.x, va.y, va.z ),
						new Ammo.btVector3( vb.x, vb.y, vb.z ),
						new Ammo.btVector3( vc.x, vc.y, vc.z )
					);
					
				}
				
				shape = new Ammo.btBvhTriangleMeshShape( meshInterface, true );
				
				break;
			
			case 'box':
				
				ubtv3.setValue( width * 0.5, height * 0.5, depth * 0.5 );

				shape = new Ammo.btBoxShape( ubtv3 );
				
				break;
			
		}
		console.log(' > PHYSX shape type: ' + shape.getShapeType() );
		console.log(shape);
		// dynamic or static
		
		if ( mass <= 0 ) {
			
			dynamic = false;
			
		}
		else if ( parameters.hasOwnProperty('dynamic') === true ) {
			
			dynamic = parameters.dynamic;
			
		}
		
		console.log(' > PHYSX dynamic? ' + dynamic );
		// local inertia
		
		localInertia = new Ammo.btVector3( 0, 0, 0 );
		
		// if dynamic find local inertia based on mass
		
		if ( dynamic === true ) {
			
			shape.calculateLocalInertia( mass, localInertia );
			
		}
		// else set mass to 0 for a static object
		else {
			
			mass = 0;
			
		}
		console.log(' > PHYSX local intertia: ', localInertia.x(), localInertia.y(), localInertia.z() );
		// reset utility transform
		
		ubttform.setIdentity();
		
		// set transform position
		
		position = mesh.position;
		
		ubtv3.setValue( position.x, position.y, position.z );
		
		ubttform.setOrigin( ubtv3 );
		
		// set transform rotation
		
		if ( mesh.useQuaternion === true ) {
			
			rotation = mesh.quaternion;
			
			ubtq.setValue( rotation.x, rotation.y, rotation.z, rotation.w );
		}
		else {
			
			rotation = mesh.rotation;
			
			ubtq.setEulerZYX( rotation.z, rotation.y, rotation.x );
		}
		
		ubttform.setRotation( ubtq );
		
		console.log( ' > PHYSX init position: ', ubtv3.x(), ubtv3.y(), ubtv3.z() );
		console.log( ' > PHYSX init rotation: ', ubtq.x(), ubtq.y(), ubtq.z(), ubtq.w() );
		
		// motion state
		
		motionState = new Ammo.btDefaultMotionState( ubttform );
		console.log(' > PHYSX motion state');
		console.log(motionState);
		// construction info
		
		constructionInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
		console.log(' > PHYSX construction info');
		console.log(constructionInfo);
		// rigid body
		
		rigidBody = new Ammo.btRigidBody( constructionInfo );
		console.log(' > PHYSX rigid body');
		console.log(rigidBody);
		// rigid body properties
		
		rigidBody.setLinearVelocity( new Ammo.btVector3( 0, 0, 0 ) );
		
		rigidBody.setAngularVelocity( new Ammo.btVector3( 0, 0, 0 ) );
		
		rigidBody.setContactProcessingThreshold( parameters.defaultContactProcessingThreshold || defaultContactProcessingThreshold );
		
		// store link
		
		linkCount++;
		
		link = {
			name: parameters.name || linkBaseName + linkCount,
			mesh: mesh,
			rigidBody: rigidBody,
			centerOffset: center_offset_from_bounding_box( mesh ),
			
			rotationGravity: new THREE.Quaternion(),
			velocityMovement: generate_velocity_tracker( { 
				damping: parameters.movementDamping,
				offset: parameters.movementOffset
			} ),
			velocityGravity: generate_velocity_tracker( { 
				damping: parameters.gravityDamping,
				offset: parameters.gravityOffset
			} ),
			axes: {
				up: shared.cardinalAxes.up.clone(),
				forward: shared.cardinalAxes.forward.clone(),
				right: shared.cardinalAxes.right.clone()
			}
		};
		
		return link;
	}
	
	// adds mesh's rigid body to physics world
	// creates new mesh to rigid body link if one is not passed
	
	function add ( mesh, link, parameters ) {
		
		link = link || translate( mesh, parameters );
		
		// add to system
		
		dynamicsWorld.addRigidBody( link.rigidBody );
		
		// add to links list
		
		links.push( link );
		
	}
	
	// removes mesh's rigid body from physics world
	
	function remove ( linkorMeshOrBodyOrName ) {
		
		var i, l,
			link,
			index;
			
		for ( i = 0, l = links.length; i < l; i ++ ) {
			
			links = links[ i ];
			
			if ( link === linkorMeshOrBodyOrName || link.mesh === linkorMeshOrBodyOrName || link.rigidBody === linkorMeshOrBodyOrName || link.name === linkorMeshOrBodyOrName ) {
				
				links.splice( i, 1 );
				
				dynamicsWorld.removeRigidBody( link.rigidBody );
				
				break;
				
			}
			
		}
		
	}
	
	/*===================================================
    
    helper functions
    
    =====================================================*/
	
	function body_pos ( rigidBody, x, y, z ) {
		
		rigidBody.getCenterOfMassPosition().setValue( x, y, z );
		
	}
	
	function body_pos_x ( rigidBody, val ) {
		
		rigidBody.getCenterOfMassPosition().setX( val );
		
	}
	
	function body_pos_y ( rigidBody, val ) {
		
		rigidBody.getCenterOfMassPosition().setY( val );
		
	}
	
	function body_pos_z ( rigidBody, val ) {
		
		rigidBody.getCenterOfMassPosition().setZ( val );
		
	}
	
	function body_rot ( rigidBody, x, y, z, w ) {
		
		var motionState = rigidBody.getMotionState(),
			transform = utilBTTransformRot,
			rotation;
		
		// get physics transform
		
		motionState.getWorldTransform( transform );

		// get physics rotation, returns quaternion
		
		rotation = transform.getRotation();
		console.log('rot: ', rigidBody.getOrientation().x(), rigidBody.getOrientation().y(), rigidBody.getOrientation().z(), rigidBody.getOrientation().w());
		rotation.setValue( x, y, z, w );
		
		
		
		transform.setRotation( rotation );
		
		motionState.setWorldTransform( transform );
		
		rigidBody.setMotionState( motionState );
		console.log('rot: ', rigidBody.getOrientation().x(), rigidBody.getOrientation().y(), rigidBody.getOrientation().z(), rigidBody.getOrientation().w());
	}
	
	function body_rot_q ( rigidBody, q ) {
		
		if ( q instanceof Ammo.btQuaternion ) {
			
			rigidBody.getOrientation().setValue( q.x(), q.y(), q.z(), q.w() );
			
		}
		else {
		
			rigidBody.getOrientation().setValue( q.x, q.y, q.z, q.w );
		
		}
	}
	
	function body_rot_mat ( rigidBody, mat ) {

		if ( mat instanceof THREE.Matrix4 ) {
			
			utilQ1RotMat.setFromRotationMatrix( mat );
			
			rigidBody.getOrientation().setValue( utilQ1RotMat.x, utilQ1RotMat.y, utilQ1RotMat.z, utilQ1RotMat.w );
			
		}
		
	}
	
	function body_rot_axis_angle ( rigidBody, axis, angle ) {
		
		if ( axis instanceof THREE.Vector3 ) {
			
			axis = utilBTVec3Rot.setValue( axis.x, axis.y, axis.z );
			
		}
		
		rigidBody.getOrientation().setRotation( axis, angle );
		
	}
	
	/*===================================================
    
    utility functions
    
    =====================================================*/
	
	function set_gravity_source ( source ) {
		gravitySource = new THREE.Vector3( source.x, source.y, source.z );
	}
	
	function set_gravity_magnitude ( magnitude ) {
		gravityMagnitude = new THREE.Vector3( magnitude.x, magnitude.y, magnitude.z );
	}
	
	function generate_velocity_tracker ( parameters ) {
		var velocity = {};
		
		// handle parameters
		
		parameters = parameters || {};
		
		parameters.damping = parameters.damping || 0.99;
		
		// init velocity
		
		velocity.force = new THREE.Vector3();
		velocity.forceRotated = new THREE.Vector3();
		velocity.damping = new THREE.Vector3().addScalar( parameters.damping );
		velocity.offset = parameters.offset && parameters.offset instanceof THREE.Vector3 ? parameters.offset : new THREE.Vector3();
		velocity.moving = false;
		
		return velocity;
	}
	
	function dimensions_from_bounding_box_scaled ( mesh ) {
		var geometry = mesh.geometry,
			scale = mesh.scale,
			bbox,
			dimensions;
		
		// if needs calculation
		
		if ( !geometry.boundingBox ) {
			geometry.computeBoundingBox();
		}
		
		bbox = geometry.boundingBox;
		
		// get original dimensions and scale to mesh's scale
		
		dimensions = new THREE.Vector3( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z ).multiplySelf( scale );
		
		return dimensions;
	}
	
	function center_offset_from_bounding_box ( mesh ) {
		
		var geometry = mesh.geometry,
			bbox,
			centerOffset;
		
		// if needs calculation
		
		if ( !geometry.boundingBox ) {
			geometry.computeBoundingBox();
		}
		
		bbox = geometry.boundingBox;
		
		// get mesh's center offset
		
		//centerOffset = new THREE.Vector3( bbox.x[0] + (bbox.x[1] - bbox.x[0]) * 0.5, bbox.y[0] + (bbox.y[1] - bbox.y[0]) * 0.5, bbox.z[0] + (bbox.z[1] - bbox.z[0]) * 0.5 );
		centerOffset = new THREE.Vector3( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z ).multiplyScalar( 0.5 ).addSelf( bbox.min );
		
		return centerOffset;
		
	}
	
	function rotate_vector3_to_mesh_rotation ( mesh, vec3, rotatedVec3 ) {
		
		if ( rotatedVec3 instanceof THREE.Vector3 ) {
			rotatedVec3.copy( vec3 );
		}
		else {
			rotatedVec3 = vec3.clone();
		}
		
		if ( mesh.useQuaternion === true ) {
			
			mesh.quaternion.multiplyVector3( rotatedVec3 );
			
		}
		else {
			
			mesh.matrix.multiplyVector3( rotatedVec3 );
			
		}
		
		return rotatedVec3;
		
	}
	
	/*===================================================
    
    start/stop/update functions
    
    =====================================================*/
	
	function start () {
		
		shared.signals.update.add( update );
		
	}
	
	function stop () {
		
		shared.signals.update.remove( update );
		
	}
	
	function update ( timeDelta ) {
		
		var i, l = 1,
			refreshInterval = shared.refreshInterval,
			currentInterval = timeDelta,
			timeStep;
		
		// handle time
		
		if ( currentInterval > refreshInterval ) {
			
			l = Math.ceil( currentInterval / refreshInterval );
			
		}
		
		// integrate
		
		//for ( i = 0; i < l; i ++ ) {
			
			currentInterval = refreshInterval;
			
			timeStep = currentInterval / 1000;
		
			integrate( timeStep );
			
		//}
		
	}
	
	/*===================================================
    
    integrate functions
    
    =====================================================*/
	
	function integrate ( timeStep ) {
		
		var i, l,
			uv31 = utilVec31Integrate,
			uv32 = utilVec32Integrate,
			uq1 = utilQ1Integrate,
			uq2 = utilQ2Integrate,
			uq3 = utilQ3Integrate,
			ca = shared.cardinalAxes,
			lerpDelta = 0.1,
			link,
			rigidBody,
			mesh,
			centerOffset,
			rbMotionState,
			rbTransform = utilBTTransformIntegrate,
			rbPosition,
			rbRotation,
			mPosition,
			mRotation,
			axes,
			axisUp,
			axisUpNew,
			axisUpToUpNewDist,
			axisForward,
			axisRight,
			velocityGravity,
			velocityMovement,
			gravSrc,
			gravMag,
			gravUp,
			gravDown,
			upToUpNewAngle,
			upToUpNewAxis,
			upToUpNewQ;
		
		// step world
		
		dynamicsWorld.stepSimulation( timeStep );
		
		// handle rotation and check velocity
		
		for ( i = 0, l = links.length; i < l; i ++ ) {
			
			link = links[ i ];
			
			rigidBody = link.rigidBody;
			
			mesh = link.mesh;
			
			centerOffset = link.centerOffset;
			
			//rigidBody.isStaticObject()
			
			// get physics motion state
			
			rbMotionState = rigidBody.getMotionState();
			
			// get physics transform
			
			rbMotionState.getWorldTransform( rbTransform );
			
			// get physics position
			
			rbPosition = rbTransform.getOrigin();
			
			// set mesh position
			
			mPosition = mesh.position;
			
			mPosition.set( centerOffset.x + rbPosition.x(), centerOffset.y + rbPosition.y(), centerOffset.z + rbPosition.z() );

			// get physics rotation, returns quaternion
			
			rbRotation = rbTransform.getRotation();
			
			// set mesh rotation
			
			if ( mesh.useQuaternion === true ) {
				
				mRotation = mesh.quaternion;
				
				mRotation.set( rbRotation.x(), rbRotation.y(), rbRotation.z(), rbRotation.w() );
				
			}
			else {
				
				mRotation = mesh.matrix;
				
				uq1.set( rbRotation.x(), rbRotation.y(), rbRotation.z(), rbRotation.w() );
				
				mRotation.setRotationFromQuaternion( uq1 );
				
			}
			
			/*
			// is movable
			
			if ( rigidBody.movable === true ) {
				
				// localize movable basics
				
				collider = rigidBody.collider;
				
				mesh = rigidBody.mesh;
				
				position = mesh.position;
				
				rotation = ( mesh.useQuaternion === true ? mesh.quaternion : mesh.matrix );
				
				rotationGravity = rigidBody.rotationGravity;
				
				velocityGravity = rigidBody.velocityGravity;
				
				velocityMovement = rigidBody.velocityMovement;
				
				axes = rigidBody.axes;
				
				axisUp = axes.up;
				
				axisForward = axes.forward;
				
				axisRight = axes.right;
				
				gravSrc = rigidBody.gravitySource || gravitySource;
				
				gravMag = rigidBody.gravityMagnitude || gravityMagnitude;
				
				// get normalized up vector between character and gravity source
				
				gravUp = uv31.sub( position, gravSrc ).normalize();
				
				// negate gravity up
				
				gravDown = gravUp.clone().negate();//axisUp.clone().negate();//
				
				// movement velocity
				
				handle_velocity( rigidBody, velocityMovement );
				
				// ray cast in the direction of gravity
				
				//collisionGravity = raycast_in_direction( rigidBody, gravDown, undefined, true );
				
				// handle collision to find new up orientation
				
				if( collisionGravity ) {
					
					// get normal of colliding face as new up axis
					// this causes severe jitter 
					// when crossing faces that are not close in angle
					// tried many things to fix...
					
					axisUpNew = gravUp;//collisionGravity.normal;
					
				} else {
					
					// TODO
					// assume object has fallen through world
					// reset to ground plane
					
					axisUpNew = gravUp;
					
				}
				
				// get new rotation based on gravity
				
				// find dist between axis up and new axis up
				
				axisUpToUpNewDist = Math.max( -1, Math.min( 1, axisUp.dot( axisUpNew ) ) );
				
				// if up axes are not same
				
				if ( axisUpToUpNewDist !== 1 ) {
					
					// axis / angle
					
					upToUpNewAngle = Math.acos( axisUpToUpNewDist );
					upToUpNewAxis = uv32.cross( axisUp, axisUpNew );
					upToUpNewAxis.normalize();
					
					// if new up axis is exactly opposite of current up
					// replace upToUpNew axis with the player's current forward axis
					
					if ( upToUpNewAxis.length() === 0 ) {
						upToUpNewAxis = axisForward;
					}
					
					// rotation change
					
					upToUpNewQ = uq3.setFromAxisAngle( upToUpNewAxis, upToUpNewAngle );
					
					// add to rotation
					
					uq1.multiply( upToUpNewQ, rotationGravity );
					
					THREE.Quaternion.nlerp( rotationGravity, uq1, rotationGravity, lerpDelta );
					
					if ( mesh.useQuaternion === true ) {
						
						// quaternion rotations
						
						uq1.multiply( upToUpNewQ, rotation );
						
						// normalized lerp to new rotation
						
						THREE.Quaternion.nlerp( rotation, uq1, rotation, lerpDelta );
					
					}
					else {
						
						// matrix rotations
						
						uq1.setFromRotationMatrix( rotation );
						
						uq2.multiply( upToUpNewQ, uq1 );
						
						rotation.setRotationFromQuaternion( uq2 );
						
					}
					
					// find new axes based on new rotation
					
					rotation.multiplyVector3( axisUp.copy( ca.up ) );
					
					rotation.multiplyVector3( axisForward.copy( ca.forward ) );
					
					rotation.multiplyVector3( axisRight.copy( ca.right ) );
					
				}
				
				// add non rotated gravity to gravity velocity
				
				velocityGravity.force.addSelf( gravMag );
				
				// check gravity velocity
				
				handle_velocity( rigidBody, velocityGravity );
				
			}
			*/
		}
		
	}
	
	/*===================================================
    
    velocity functions
    
    =====================================================*/
	
	function handle_velocity ( rigidBody, velocity, offset ) {
		
		var mesh = rigidBody.mesh,
			position = mesh.position,
			scale = mesh.scale,
			scaleExp = scaleSpeedExp,
			scaleModded = utilVec31Velocity.copy( scale ),
			velocityForce = velocity.force,
			velocityForceRotated = velocity.forceRotated,
			velocityForceRotatedLength,
			velocityForceScalar,
			velocityOffset = velocity.offset,
			velocityDamping = velocity.damping,
			boundingOffset,
			boundingOffsetLength,
			collision,
			collisionDist;
		
		if ( rigidBody.movable !== true || velocityForce.isZero() === true ) {
			
			velocity.moving = false;
			
			return;
			
		} 
		else {
			
			velocity.moving = true;
			
		}
		
		// rotate velocity to mesh's rotation
		
		velocityForceRotated = rotate_vector3_to_mesh_rotation( mesh, velocityForce, velocityForceRotated );
		
		// scale velocity
		
		scaleModded.x = Math.pow( scaleModded.x, scaleExp );
		scaleModded.y = Math.pow( scaleModded.y, scaleExp );
		scaleModded.z = Math.pow( scaleModded.z, scaleExp );
		
		velocityForceRotated.multiplySelf( scaleModded );
		
		// get rotated length
		
		velocityForceRotatedLength = velocityForceRotated.length();
		
		// get bounding box offset
		
		boundingOffset = offset_from_dimensions_in_direction( mesh, velocityForceRotated, dimensions_from_collider_scaled( rigidBody ) );//dimensions_from_bounding_box_scaled( mesh ) );
		
		boundingOffsetLength = boundingOffset.length();
		
		// override offset
		
		if ( typeof offset !== 'undefined' ) {
		
			velocityOffset = offset;
			
		}
		
		// rotate offset if needed
		
		if ( velocityOffset.length() > 0 ) {
			
			velocityOffset = rotate_vector3_to_mesh_rotation( mesh, velocityOffset );
			
		}
		
		var castDistance = boundingOffsetLength + velocityForceRotatedLength;
		
		// get collision
		//for ( var i = 0; i < 2; i++ ) {
			collision = raycast_in_direction( rigidBody, velocityForceRotated, castDistance, velocityOffset );
		//}
		// modify velocity based on collision distances to avoid passing through or into objects
		
		if ( collision ) {
			
			collisionDist = collision.distance;
			
			// set the rotated velocity to be no more than collision distance
			
			if ( collisionDist - velocityForceRotatedLength <= boundingOffsetLength ) {
				
				velocityForceScalar = ( collisionDist - boundingOffsetLength ) / velocityForceRotatedLength;
				
				velocityForceRotated.multiplyScalar( velocityForceScalar );
				
				// set the base velocity to 0
				
				velocityForce.set( 0, 0, 0 );
				
				velocity.moving = false;
				
			}
			
		}
		
		// add velocity to position
		
		position.addSelf( velocityForceRotated );
		
		// damp velocity
		
		velocityForce.multiplySelf( velocityDamping );
		
		// return velocity
		
		return collision;
	}
	
	return main;
	
}(KAIOPUA || {}));