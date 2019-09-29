namespace CANNON
{
    export class Box extends Shape
    {

        halfExtents: feng3d.Vector3;

        /**
         * Used by the contact generator to make contacts with other convex polyhedra for example
         */
        convexPolyhedronRepresentation: ConvexPolyhedron;

        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        constructor(halfExtents: feng3d.Vector3)
        {
            super({
                type: Shape.types.BOX
            });

            this.halfExtents = halfExtents;
            this.convexPolyhedronRepresentation = null;

            this.updateConvexPolyhedronRepresentation();
            this.updateBoundingSphereRadius();
        }

        /**
         * Updates the local convex polyhedron representation used for some collisions.
         */
        updateConvexPolyhedronRepresentation()
        {
            var sx = this.halfExtents.x;
            var sy = this.halfExtents.y;
            var sz = this.halfExtents.z;
            var V = feng3d.Vector3;

            var vertices = [
                new V(-sx, -sy, -sz),
                new V(sx, -sy, -sz),
                new V(sx, sy, -sz),
                new V(-sx, sy, -sz),
                new V(-sx, -sy, sz),
                new V(sx, -sy, sz),
                new V(sx, sy, sz),
                new V(-sx, sy, sz)
            ];

            var indices = [
                [3, 2, 1, 0], // -z
                [4, 5, 6, 7], // +z
                [5, 4, 0, 1], // -y
                [2, 3, 7, 6], // +y
                [0, 4, 7, 3], // -x
                [1, 2, 6, 5], // +x
            ];

            var axes = [
                new V(0, 0, 1),
                new V(0, 1, 0),
                new V(1, 0, 0)
            ];

            var h = new ConvexPolyhedron(vertices, indices);
            this.convexPolyhedronRepresentation = h;
            h.material = this.material;
        }

        calculateLocalInertia(mass: number, target = new feng3d.Vector3())
        {
            Box.calculateInertia(this.halfExtents, mass, target);
            return target;
        }

        static calculateInertia(halfExtents: feng3d.Vector3, mass: number, target: feng3d.Vector3)
        {
            var e = halfExtents;
            target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
            target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
            target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
        }

        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        getSideNormals(sixTargetVectors: feng3d.Vector3[], quat: Quaternion)
        {
            var sides = sixTargetVectors;
            var ex = this.halfExtents;
            sides[0].init(ex.x, 0, 0);
            sides[1].init(0, ex.y, 0);
            sides[2].init(0, 0, ex.z);
            sides[3].init(-ex.x, 0, 0);
            sides[4].init(0, -ex.y, 0);
            sides[5].init(0, 0, -ex.z);

            if (quat !== undefined)
            {
                for (var i = 0; i !== sides.length; i++)
                {
                    quat.vmult(sides[i], sides[i]);
                }
            }

            return sides;
        }

        volume()
        {
            return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
        }

        updateBoundingSphereRadius()
        {
            this.boundingSphereRadius = this.halfExtents.length;
        }

        forEachWorldCorner(pos: feng3d.Vector3, quat: Quaternion, callback: Function)
        {
            var e = this.halfExtents;
            var corners = [[e.x, e.y, e.z],
            [-e.x, e.y, e.z],
            [-e.x, -e.y, e.z],
            [-e.x, -e.y, -e.z],
            [e.x, -e.y, -e.z],
            [e.x, e.y, -e.z],
            [-e.x, e.y, -e.z],
            [e.x, -e.y, e.z]];
            for (var i = 0; i < corners.length; i++)
            {
                worldCornerTempPos.init(corners[i][0], corners[i][1], corners[i][2]);
                quat.vmult(worldCornerTempPos, worldCornerTempPos);
                pos.addTo(worldCornerTempPos, worldCornerTempPos);
                callback(worldCornerTempPos.x,
                    worldCornerTempPos.y,
                    worldCornerTempPos.z);
            }
        }

        calculateWorldAABB(pos: feng3d.Vector3, quat: Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            var e = this.halfExtents;
            worldCornersTemp[0].init(e.x, e.y, e.z);
            worldCornersTemp[1].init(-e.x, e.y, e.z);
            worldCornersTemp[2].init(-e.x, -e.y, e.z);
            worldCornersTemp[3].init(-e.x, -e.y, -e.z);
            worldCornersTemp[4].init(e.x, -e.y, -e.z);
            worldCornersTemp[5].init(e.x, e.y, -e.z);
            worldCornersTemp[6].init(-e.x, e.y, -e.z);
            worldCornersTemp[7].init(e.x, -e.y, e.z);

            var wc = worldCornersTemp[0];
            quat.vmult(wc, wc);
            pos.addTo(wc, wc);
            max.copy(wc);
            min.copy(wc);
            for (var i = 1; i < 8; i++)
            {
                var wc = worldCornersTemp[i];
                quat.vmult(wc, wc);
                pos.addTo(wc, wc);
                var x = wc.x;
                var y = wc.y;
                var z = wc.z;
                if (x > max.x)
                {
                    max.x = x;
                }
                if (y > max.y)
                {
                    max.y = y;
                }
                if (z > max.z)
                {
                    max.z = z;
                }

                if (x < min.x)
                {
                    min.x = x;
                }
                if (y < min.y)
                {
                    min.y = y;
                }
                if (z < min.z)
                {
                    min.z = z;
                }
            }

            // Get each axis max
            // min.set(Infinity,Infinity,Infinity);
            // max.set(-Infinity,-Infinity,-Infinity);
            // this.forEachWorldCorner(pos,quat,function(x,y,z){
            //     if(x > max.x){
            //         max.x = x;
            //     }
            //     if(y > max.y){
            //         max.y = y;
            //     }
            //     if(z > max.z){
            //         max.z = z;
            //     }

            //     if(x < min.x){
            //         min.x = x;
            //     }
            //     if(y < min.y){
            //         min.y = y;
            //     }
            //     if(z < min.z){
            //         min.z = z;
            //     }
            // });
        }
    }


    var worldCornerTempPos = new feng3d.Vector3();
    var worldCornerTempNeg = new feng3d.Vector3();

    var worldCornersTemp = [
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3()
    ];
}