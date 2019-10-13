namespace CANNON
{
    export class Ray
    {
        from: feng3d.Vector3;

        to: feng3d.Vector3;

        _direction: feng3d.Vector3;

        /**
         * The precision of the ray. Used when checking parallelity etc.
         */
        precision: number;

        /**
         * Set to true if you want the Ray to take .collisionResponse flags into account on bodies and shapes.
         */
        checkCollisionResponse: boolean;

        /**
         * If set to true, the ray skips any hits with normal.dot(rayDirection) < 0.
         */
        skipBackfaces: boolean;

        collisionFilterMask: number;

        collisionFilterGroup: number;

        /**
         * The intersection mode. Should be Ray.ANY, Ray.ALL or Ray.CLOSEST.
         */
        mode: number;

        /**
         * Current result object.
         */
        result: RaycastResult;

        /**
         * Will be set to true during intersectWorld() if the ray hit anything.
         */
        hasHit: boolean;

        /**
         * Current, user-provided result callback. Will be used if mode is Ray.ALL.
         */
        callback: Function;

        /**
         * A line in 3D space that intersects bodies and return points.
         * @param from
         * @param to
         */
        constructor(from?: feng3d.Vector3, to?: feng3d.Vector3)
        {
            this.from = from ? from.clone() : new feng3d.Vector3();
            this.to = to ? to.clone() : new feng3d.Vector3();
            this._direction = new feng3d.Vector3();
            this.precision = 0.0001;
            this.checkCollisionResponse = true;
            this.skipBackfaces = false;
            this.collisionFilterMask = -1;
            this.collisionFilterGroup = -1;
            this.mode = Ray.ANY;
            this.result = new RaycastResult();
            this.hasHit = false;
            this.callback = function (result) { };
        }

        static CLOSEST = 1;
        static ANY = 2;
        static ALL = 4;

        /**
         * Do itersection against all bodies in the given World.
         * @param world
         * @param options
         * @return True if the ray hit anything, otherwise false.
         */
        intersectWorld(world: World, options: {
            mode?: number, result?: RaycastResult, skipBackfaces?: boolean, collisionFilterMask?: number,
            collisionFilterGroup?: number, from?: feng3d.Vector3, to?: feng3d.Vector3, callback?: Function
        })
        {
            this.mode = options.mode || Ray.ANY;
            this.result = options.result || new RaycastResult();
            this.skipBackfaces = !!options.skipBackfaces;
            this.collisionFilterMask = typeof (options.collisionFilterMask) !== 'undefined' ? options.collisionFilterMask : -1;
            this.collisionFilterGroup = typeof (options.collisionFilterGroup) !== 'undefined' ? options.collisionFilterGroup : -1;
            if (options.from)
            {
                this.from.copy(options.from);
            }
            if (options.to)
            {
                this.to.copy(options.to);
            }
            this.callback = options.callback || function () { };
            this.hasHit = false;

            this.result.reset();
            this._updateDirection();

            this.getAABB(tmpAABB);
            tmpArray.length = 0;
            world.broadphase.aabbQuery(world, tmpAABB, tmpArray);
            this.intersectBodies(tmpArray);

            return this.hasHit;
        }

        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        private intersectBody(body: Body, result?: RaycastResult)
        {
            if (result)
            {
                this.result = result;
                this._updateDirection();
            }
            var checkCollisionResponse = this.checkCollisionResponse;

            if (checkCollisionResponse && !body.collisionResponse)
            {
                return;
            }

            if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0)
            {
                return;
            }

            var xi = intersectBody_xi;
            var qi = intersectBody_qi;

            for (var i = 0, N = body.shapes.length; i < N; i++)
            {
                var shape = body.shapes[i];

                if (checkCollisionResponse && !shape.collisionResponse)
                {
                    continue; // Skip
                }

                body.quaternion.multTo(body.shapeOrientations[i], qi);
                body.quaternion.vmult(body.shapeOffsets[i], xi);
                xi.addTo(body.position, xi);

                this.intersectShape(
                    shape,
                    qi,
                    xi,
                    body
                );

                if (this.result._shouldStop)
                {
                    break;
                }
            }
        }

        /**
         * @param bodies An array of Body objects.
         * @param result Deprecated
         */
        intersectBodies(bodies: Body[], result?: RaycastResult)
        {
            if (result)
            {
                this.result = result;
                this._updateDirection();
            }

            for (var i = 0, l = bodies.length; !this.result._shouldStop && i < l; i++)
            {
                this.intersectBody(bodies[i]);
            }
        };

        /**
         * Updates the _direction vector.
         */
        private _updateDirection()
        {
            this.to.subTo(this.from, this._direction);
            this._direction.normalize();
        };

        private intersectShape(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body)
        {
            var from = this.from;

            // Checking boundingSphere
            var distance = distanceFromIntersection(from, this._direction, position);
            if (distance > shape.boundingSphereRadius)
            {
                return;
            }

            var intersectMethod = this[shape.type];
            if (intersectMethod)
            {
                intersectMethod.call(this, shape, quat, position, body, shape);
            }
        }

        private intersectBox(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            return this.intersectConvex(shape, quat, position, body, reportedShape);
        }

        private intersectPlane(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            var from = this.from;
            var to = this.to;
            var direction = this._direction;

            // Get plane normal
            var worldNormal = new feng3d.Vector3(0, 1, 0);
            quat.vmult(worldNormal, worldNormal);

            var len = new feng3d.Vector3();
            from.subTo(position, len);
            var planeToFrom = len.dot(worldNormal);
            to.subTo(position, len);
            var planeToTo = len.dot(worldNormal);

            if (planeToFrom * planeToTo > 0)
            {
                // "from" and "to" are on the same side of the plane... bail out
                return;
            }

            if (from.distance(to) < planeToFrom)
            {
                return;
            }

            var n_dot_dir = worldNormal.dot(direction);

            if (Math.abs(n_dot_dir) < this.precision)
            {
                // No intersection
                return;
            }

            var planePointToFrom = new feng3d.Vector3();
            var dir_scaled_with_t = new feng3d.Vector3();
            var hitPointWorld = new feng3d.Vector3();

            from.subTo(position, planePointToFrom);
            var t = -worldNormal.dot(planePointToFrom) / n_dot_dir;
            direction.scaleNumberTo(t, dir_scaled_with_t);
            from.addTo(dir_scaled_with_t, hitPointWorld);

            this.reportIntersection(worldNormal, hitPointWorld, reportedShape, body, -1);
        }

        /**
         * Get the world AABB of the ray.
         */
        getAABB(result: AABB)
        {
            var to = this.to;
            var from = this.from;
            result.lowerBound.x = Math.min(to.x, from.x);
            result.lowerBound.y = Math.min(to.y, from.y);
            result.lowerBound.z = Math.min(to.z, from.z);
            result.upperBound.x = Math.max(to.x, from.x);
            result.upperBound.y = Math.max(to.y, from.y);
            result.upperBound.z = Math.max(to.z, from.z);
        }

        private intersectHeightfield(shape: any, transform: Transform, body: Body, reportedShape: Shape)
        {
            var quat = transform.quaternion;

            var data = shape.data,
                w = shape.elementSize;

            // Convert the ray to local heightfield coordinates
            var localRay = intersectHeightfield_localRay; //new Ray(this.from, this.to);
            localRay.from.copy(this.from);
            localRay.to.copy(this.to);
            Transform.pointToLocalFrame(transform, localRay.from, localRay.from);
            Transform.pointToLocalFrame(transform, localRay.to, localRay.to);
            localRay._updateDirection();

            // Get the index of the data points to test against
            var index = intersectHeightfield_index;
            var iMinX, iMinY, iMaxX, iMaxY;

            // Set to max
            iMinX = iMinY = 0;
            iMaxX = iMaxY = shape.data.length - 1;

            var aabb = new AABB();
            localRay.getAABB(aabb);

            shape.getIndexOfPosition(aabb.lowerBound.x, aabb.lowerBound.y, index, true);
            iMinX = Math.max(iMinX, index[0]);
            iMinY = Math.max(iMinY, index[1]);
            shape.getIndexOfPosition(aabb.upperBound.x, aabb.upperBound.y, index, true);
            iMaxX = Math.min(iMaxX, index[0] + 1);
            iMaxY = Math.min(iMaxY, index[1] + 1);

            for (var i = iMinX; i < iMaxX; i++)
            {
                for (var j = iMinY; j < iMaxY; j++)
                {

                    if (this.result._shouldStop)
                    {
                        return;
                    }

                    shape.getAabbAtIndex(i, j, aabb);
                    if (!aabb.overlapsRay(localRay))
                    {
                        continue;
                    }

                    // Lower triangle
                    shape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(transform, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);

                    if (this.result._shouldStop)
                    {
                        return;
                    }

                    // Upper triangle
                    shape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(transform, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
                }
            }
        }

        private intersectSphere(shape: any, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            var from = this.from,
                to = this.to,
                r = shape.radius;

            var a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
            var b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
            var c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);

            var delta = Math.pow(b, 2) - 4 * a * c;

            var intersectionPoint = Ray_intersectSphere_intersectionPoint;
            var normal = Ray_intersectSphere_normal;

            if (delta < 0)
            {
                // No intersection
                return;

            } else if (delta === 0)
            {
                // single intersection point
                from.lerpNumberTo(to, delta, intersectionPoint);

                intersectionPoint.subTo(position, normal);
                normal.normalize();

                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);

            } else
            {
                var d1 = (- b - Math.sqrt(delta)) / (2 * a);
                var d2 = (- b + Math.sqrt(delta)) / (2 * a);

                if (d1 >= 0 && d1 <= 1)
                {
                    from.lerpNumberTo(to, d1, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }

                if (this.result._shouldStop)
                {
                    return;
                }

                if (d2 >= 0 && d2 <= 1)
                {
                    from.lerpNumberTo(to, d2, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
            }
        }

        private intersectConvex(
            shape: Shape,
            quat: feng3d.Quaternion,
            position: feng3d.Vector3,
            body: Body,
            reportedShape: Shape,
            options: { faceList?: any[] } = {}
        )
        {
            var minDistNormal = intersectConvex_minDistNormal;
            var normal = intersectConvex_normal;
            var vector = intersectConvex_vector;
            var minDistIntersect = intersectConvex_minDistIntersect;
            var faceList = (options && options.faceList) || null;

            // Checking faces
            var faces = shape.faces,
                vertices = <feng3d.Vector3[]>shape.vertices,
                normals = shape.faceNormals;
            var direction = this._direction;

            var from = this.from;
            var to = this.to;
            var fromToDistance = from.distance(to);

            var minDist = -1;
            var Nfaces = faceList ? faceList.length : faces.length;
            var result = this.result;

            for (var j = 0; !result._shouldStop && j < Nfaces; j++)
            {
                var fi = faceList ? faceList[j] : j;

                var face = faces[fi];
                var faceNormal = normals[fi];
                var q = quat;
                var x = position;

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                vector.copy(vertices[face[0]]);
                q.vmult(vector, vector);
                vector.addTo(x, vector);

                // ...but make it relative to the ray from. We'll fix this later.
                vector.subTo(from, vector);

                // Get plane normal
                q.vmult(faceNormal, normal);

                // If this dot product is negative, we have something interesting
                var dot = direction.dot(normal);

                // Bail out if ray and plane are parallel
                if (Math.abs(dot) < this.precision)
                {
                    continue;
                }

                // calc distance to plane
                var scalar = normal.dot(vector) / dot;

                // if negative distance, then plane is behind ray
                if (scalar < 0)
                {
                    continue;
                }

                // if (dot < 0) {

                // Intersection point is from + direction * scalar
                direction.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(from, intersectPoint);

                // a is the point we compare points b and c with.
                a.copy(vertices[face[0]]);
                q.vmult(a, a);
                x.addTo(a, a);

                for (var i = 1; !result._shouldStop && i < face.length - 1; i++)
                {
                    // Transform 3 vertices to world coords
                    b.copy(vertices[face[i]]);
                    c.copy(vertices[face[i + 1]]);
                    q.vmult(b, b);
                    q.vmult(c, c);
                    x.addTo(b, b);
                    x.addTo(c, c);

                    var distance = intersectPoint.distance(from);

                    if (!(Ray.pointInTriangle(intersectPoint, a, b, c) || Ray.pointInTriangle(intersectPoint, b, a, c)) || distance > fromToDistance)
                    {
                        continue;
                    }

                    this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
                }
                // }
            }
        }

        /**
         * @method intersectTrimesh
         * @private
         * @param  {Shape} shape
         * @param  {Quaternion} quat
         * @param  {Vector3} position
         * @param  {Body} body
         * @param {object} [options]
         */
        /**
         * 
         * @param mesh 
         * @param quat 
         * @param position 
         * @param body 
         * @param reportedShape 
         * @param options 
         * 
         * @todo Optimize by transforming the world to local space first.
         * @todo Use Octree lookup
         */
        private intersectTrimesh(
            mesh: any,
            quat: feng3d.Quaternion,
            position: feng3d.Vector3,
            body: Body,
            reportedShape: Shape,
            options
        )
        {
            var normal = intersectTrimesh_normal;
            var triangles = intersectTrimesh_triangles;
            var treeTransform = intersectTrimesh_treeTransform;
            var minDistNormal = intersectConvex_minDistNormal;
            var vector = intersectConvex_vector;
            var minDistIntersect = intersectConvex_minDistIntersect;
            var localAABB = intersectTrimesh_localAABB;
            var localDirection = intersectTrimesh_localDirection;
            var localFrom = intersectTrimesh_localFrom;
            var localTo = intersectTrimesh_localTo;
            var worldIntersectPoint = intersectTrimesh_worldIntersectPoint;
            var worldNormal = intersectTrimesh_worldNormal;
            var faceList = (options && options.faceList) || null;

            // Checking faces
            var indices = mesh.indices,
                vertices = mesh.vertices,
                normals = mesh.faceNormals;

            var from = this.from;
            var to = this.to;
            var direction = this._direction;

            var minDist = -1;
            treeTransform.position.copy(position);
            treeTransform.quaternion.copy(quat);

            // Transform ray to local space!
            Transform.vectorToLocalFrame(treeTransform, direction, localDirection);
            Transform.pointToLocalFrame(treeTransform, from, localFrom);
            Transform.pointToLocalFrame(treeTransform, to, localTo);

            localTo.x *= mesh.scale.x;
            localTo.y *= mesh.scale.y;
            localTo.z *= mesh.scale.z;
            localFrom.x *= mesh.scale.x;
            localFrom.y *= mesh.scale.y;
            localFrom.z *= mesh.scale.z;

            localTo.subTo(localFrom, localDirection);
            localDirection.normalize();

            var fromToDistanceSquared = localFrom.distanceSquared(localTo);

            mesh.tree.rayQuery(this, treeTransform, triangles);

            for (var i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++)
            {
                var trianglesIndex = triangles[i];

                mesh.getNormal(trianglesIndex, normal);

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                mesh.getVertex(indices[trianglesIndex * 3], a);

                // ...but make it relative to the ray from. We'll fix this later.
                a.subTo(localFrom, vector);

                // If this dot product is negative, we have something interesting
                var dot = localDirection.dot(normal);

                // Bail out if ray and plane are parallel
                // if (Math.abs( dot ) < this.precision){
                //     continue;
                // }

                // calc distance to plane
                var scalar = normal.dot(vector) / dot;

                // if negative distance, then plane is behind ray
                if (scalar < 0)
                {
                    continue;
                }

                // Intersection point is from + direction * scalar
                localDirection.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(localFrom, intersectPoint);

                // Get triangle vertices
                mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
                mesh.getVertex(indices[trianglesIndex * 3 + 2], c);

                var squaredDistance = intersectPoint.distanceSquared(localFrom);

                if (!(Ray.pointInTriangle(intersectPoint, b, a, c) || Ray.pointInTriangle(intersectPoint, a, b, c)) || squaredDistance > fromToDistanceSquared)
                {
                    continue;
                }

                // transform intersectpoint and normal to world
                Transform.vectorToWorldFrame(treeTransform, normal, worldNormal);
                Transform.pointToWorldFrame(treeTransform, intersectPoint, worldIntersectPoint);
                this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
            }
            triangles.length = 0;
        }

        private reportIntersection(normal: feng3d.Vector3, hitPointWorld: feng3d.Vector3, shape: Shape, body: Body, hitFaceIndex?: number)
        {
            var from = this.from;
            var to = this.to;
            var distance = from.distance(hitPointWorld);
            var result = this.result;

            // Skip back faces?
            if (this.skipBackfaces && normal.dot(this._direction) > 0)
            {
                return;
            }

            result.hitFaceIndex = typeof (hitFaceIndex) !== 'undefined' ? hitFaceIndex : -1;

            switch (this.mode)
            {
                case Ray.ALL:
                    this.hasHit = true;
                    result.set(
                        from,
                        to,
                        normal,
                        hitPointWorld,
                        shape,
                        body,
                        distance
                    );
                    result.hasHit = true;
                    this.callback(result);
                    break;

                case Ray.CLOSEST:

                    // Store if closer than current closest
                    if (distance < result.distance || !result.hasHit)
                    {
                        this.hasHit = true;
                        result.hasHit = true;
                        result.set(
                            from,
                            to,
                            normal,
                            hitPointWorld,
                            shape,
                            body,
                            distance
                        );
                    }
                    break;

                case Ray.ANY:

                    // Report and stop.
                    this.hasHit = true;
                    result.hasHit = true;
                    result.set(
                        from,
                        to,
                        normal,
                        hitPointWorld,
                        shape,
                        body,
                        distance
                    );
                    result._shouldStop = true;
                    break;
            }
        }

        /*
         * As per "Barycentric Technique" as named here http://www.blackpawn.com/texts/pointinpoly/default.html But without the division
         */
        static pointInTriangle(p: feng3d.Vector3, a: feng3d.Vector3, b: feng3d.Vector3, c: feng3d.Vector3)
        {
            c.subTo(a, v0);
            b.subTo(a, v1);
            p.subTo(a, v2);

            var dot00 = v0.dot(v0);
            var dot01 = v0.dot(v1);
            var dot02 = v0.dot(v2);
            var dot11 = v1.dot(v1);
            var dot12 = v1.dot(v2);

            var u: number, v: number;

            return ((u = dot11 * dot02 - dot01 * dot12) >= 0) &&
                ((v = dot00 * dot12 - dot01 * dot02) >= 0) &&
                (u + v < (dot00 * dot11 - dot01 * dot01));
        }

    }

    var tmpAABB = new AABB();
    var tmpArray = [];

    var v1 = new feng3d.Vector3();
    var v2 = new feng3d.Vector3();

    var intersectBody_xi = new feng3d.Vector3();
    var intersectBody_qi = new feng3d.Quaternion();


    var vector = new feng3d.Vector3();
    var normal = new feng3d.Vector3();
    var intersectPoint = new feng3d.Vector3();

    var a = new feng3d.Vector3();
    var b = new feng3d.Vector3();
    var c = new feng3d.Vector3();
    var d = new feng3d.Vector3();

    var tmpRaycastResult = new RaycastResult();


    var v0 = new feng3d.Vector3();
    var intersect = new feng3d.Vector3();


    var intersectTrimesh_normal = new feng3d.Vector3();
    var intersectTrimesh_localDirection = new feng3d.Vector3();
    var intersectTrimesh_localFrom = new feng3d.Vector3();
    var intersectTrimesh_localTo = new feng3d.Vector3();
    var intersectTrimesh_worldNormal = new feng3d.Vector3();
    var intersectTrimesh_worldIntersectPoint = new feng3d.Vector3();
    var intersectTrimesh_localAABB = new AABB();
    var intersectTrimesh_triangles = [];
    var intersectTrimesh_treeTransform = new Transform();

    var intersectConvexOptions = {
        faceList: [0]
    };
    var worldPillarOffset = new feng3d.Vector3();
    var intersectHeightfield_localRay = new Ray();
    var intersectHeightfield_index = [];
    var intersectHeightfield_minMax = [];

    var Ray_intersectSphere_intersectionPoint = new feng3d.Vector3();
    var Ray_intersectSphere_normal = new feng3d.Vector3();

    var intersectConvex_normal = new feng3d.Vector3();
    var intersectConvex_minDistNormal = new feng3d.Vector3();
    var intersectConvex_minDistIntersect = new feng3d.Vector3();
    var intersectConvex_vector = new feng3d.Vector3();

    Ray.prototype[ShapeType.BOX] = Ray.prototype["intersectBox"];
    Ray.prototype[ShapeType.PLANE] = Ray.prototype["intersectPlane"];

    Ray.prototype[ShapeType.HEIGHTFIELD] = Ray.prototype["intersectHeightfield"];
    Ray.prototype[ShapeType.SPHERE] = Ray.prototype["intersectSphere"];

    Ray.prototype[ShapeType.TRIMESH] = Ray.prototype["intersectTrimesh"];
    Ray.prototype[ShapeType.CONVEXPOLYHEDRON] = Ray.prototype["intersectConvex"];

    function distanceFromIntersection(from, direction, position)
    {

        // v0 is vector from from to position
        position.vsub(from, v0);
        var dot = v0.dot(direction);

        // intersect = direction*dot + from
        direction.mult(dot, intersect);
        intersect.addTo(from, intersect);

        var distance = position.distanceTo(intersect);

        return distance;
    }
}