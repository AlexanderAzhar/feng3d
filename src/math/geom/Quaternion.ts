namespace feng3d
{
	/**
	 * 可用于表示旋转的四元数对象
	 */
    export class Quaternion
    {
        static fromArray(array: ArrayLike<number>, offset = 0)
        {
            return new Quaternion().fromArray(array, offset);
        }

		/**
		 * 虚基向量i的乘子
		 */
        @serialize
        x = 0;

		/**
		 * 虚基向量j的乘子
		 */
        @serialize
        y = 0;

		/**
		 * 虚基向量k的乘子
		 */
        @serialize
        z = 0;

		/**
		 * 实部的乘数
		 */
        @serialize
        w = 1;

		/**
		 * 四元数描述三维空间中的旋转。四元数的数学定义为Q = x*i + y*j + z*k + w，其中(i,j,k)为虚基向量。(x,y,z)可以看作是一个与旋转轴相关的向量，而实际的乘法器w与旋转量相关。
         * 
		 * @param x 虚基向量i的乘子
		 * @param y 虚基向量j的乘子
		 * @param z 虚基向量k的乘子
		 * @param w 实部的乘数
		 */
        constructor(x = 0, y = 0, z = 0, w = 1)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

		/**
		 * 返回四元数对象的大小
		 */
        get magnitude(): number
        {
            return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
         * 设置四元数的值。
         * 
		 * @param x 虚基向量i的乘子
		 * @param y 虚基向量j的乘子
		 * @param z 虚基向量k的乘子
		 * @param w 实部的乘数
         */
        set(x = 0, y = 0, z = 0, w = 1)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }

        fromArray(array: ArrayLike<number>, offset = 0)
        {
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            this.w = array[offset + 3];
            return this;
        }

        /**
         * 转换为数组
         * 
         * @param array 
         * @param offset 
         */
        toArray(array?: number[], offset = 0)
        {
            array = array || [];
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;
            return array;
        }

		/**
         * 四元数乘法
		 *
         * @param q
         * @param this
         */
        mult(q: Quaternion)
        {
            var ax = this.x, ay = this.y, az = this.z, aw = this.w,
                bx = q.x, by = q.y, bz = q.z, bw = q.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;
            return this;
        }

		/**
         * 四元数乘法
		 *
         * @param q
         * @param target
         */
        multTo(q: Quaternion, target = new Quaternion())
        {
            return target.copy(this).mult(q);
        }

        /**
         * 得到反四元数旋转
         */
        inverse()
        {
            var x = this.x, y = this.y, z = this.z, w = this.w;

            this.conjugate();
            var inorm2 = 1 / (x * x + y * y + z * z + w * w);
            this.x *= inorm2;
            this.y *= inorm2;
            this.z *= inorm2;
            this.w *= inorm2;

            return this;
        }

        /**
         * 得到反四元数旋转
         */
        inverseTo(target = new Quaternion())
        {
            return target.copy(this).inverse();
        }

        /**
         * 得到四元数共轭
         */
        conjugate()
        {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;

            return this;
        }

        /**
         * 得到四元数共轭
         * 
         * @param target
         */
        conjugateTo(target = new Quaternion())
        {
            return target.copy(this).conjugate();
        }

        multiplyVector(vector: Vector3, target = new Quaternion())
        {
            var x2 = vector.x;
            var y2 = vector.y;
            var z2 = vector.z;

            target.w = -this.x * x2 - this.y * y2 - this.z * z2;
            target.x = this.w * x2 + this.y * z2 - this.z * y2;
            target.y = this.w * y2 - this.x * z2 + this.z * x2;
            target.z = this.w * z2 + this.x * y2 - this.y * x2;

            return target;
        }

		/**
		 * 用表示给定绕向量旋转的值填充四元数对象。
		 *
		 * @param axis 要绕其旋转的轴
		 * @param angle 以弧度为单位的旋转角度。
		 */
        fromAxisAngle(axis: Vector3, angle: number)
        {
            var sin_a = Math.sin(angle / 2);
            var cos_a = Math.cos(angle / 2);

            this.x = axis.x * sin_a;
            this.y = axis.y * sin_a;
            this.z = axis.z * sin_a;
            this.w = cos_a;
            this.normalize();
            return this;
        }

        /**
         * 将四元数转换为轴/角表示形式
         * 
         * @param targetAxis 要重用的向量对象，用于存储轴
         * @return 一个数组，第一个元素是轴，第二个元素是弧度
         */
        toAxisAngle(targetAxis = new feng3d.Vector3())
        {
            this.normalize(); // 如果w>1 acos和sqrt会产生错误，那么如果四元数被标准化，就不会发生这种情况
            var angle = 2 * Math.acos(this.w);
            var s = Math.sqrt(1 - this.w * this.w); // 假设四元数归一化了，那么w小于1，所以项总是正的。
            if (s < 0.001)
            { // 为了避免除以零，s总是正的，因为是根号
                // 如果s接近于零，那么轴的方向就不重要了
                targetAxis.x = this.x; // 如果轴归一化很重要，则用x=1替换;y = z = 0;
                targetAxis.y = this.y;
                targetAxis.z = this.z;
            } else
            {
                targetAxis.x = this.x / s; // 法线轴
                targetAxis.y = this.y / s;
                targetAxis.z = this.z / s;
            }
            return [targetAxis, angle];
        }

        /**
         * 给定两个向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
         * 
         * @param u
         * @param v
         */
        setFromVectors(u: Vector3, v: Vector3)
        {
            if (u.isAntiparallelTo(v))
            {
                var t1 = new Vector3();
                var t2 = new Vector3();

                u.tangents(t1, t2);
                this.fromAxisAngle(t1, Math.PI);
            } else
            {
                var a = u.crossTo(v);
                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = Math.sqrt(Math.pow(u.length, 2) * Math.pow(v.length, 2)) + u.dot(v);
                this.normalize();
            }
            return this;
        }

		/**
		 * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
		 * @param qa The first quaternion to interpolate.
		 * @param qb The second quaternion to interpolate.
		 * @param t The interpolation weight, a value between 0 and 1.
		 */
        slerp(qa: Quaternion, qb: Quaternion, t: number)
        {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var dot = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;

            // shortest direction
            if (dot < 0)
            {
                dot = -dot;
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }

            if (dot < 0.95)
            {
                // interpolate angle linearly
                var angle = Math.acos(dot);
                var s = 1 / Math.sin(angle);
                var s1 = Math.sin(angle * (1 - t)) * s;
                var s2 = Math.sin(angle * t) * s;
                this.w = w1 * s1 + w2 * s2;
                this.x = x1 * s1 + x2 * s2;
                this.y = y1 * s1 + y2 * s2;
                this.z = z1 * s1 + z2 * s2;
            }
            else
            {
                // nearly identical angle, interpolate linearly
                this.w = w1 + t * (w2 - w1);
                this.x = x1 + t * (x2 - x1);
                this.y = y1 + t * (y2 - y1);
                this.z = z1 + t * (z2 - z1);
                var len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
                this.w *= len;
                this.x *= len;
                this.y *= len;
                this.z *= len;
            }
        }

		/**
		 * 线性求插值
		 * @param qa 第一个四元素
		 * @param qb 第二个四元素
		 * @param t 权重
		 */
        lerp(qa: Quaternion, qb: Quaternion, t: number)
        {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var len: number;

            // shortest direction
            if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0)
            {
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }

            this.w = w1 + t * (w2 - w1);
            this.x = x1 + t * (x2 - x1);
            this.y = y1 + t * (y2 - y1);
            this.z = z1 + t * (z2 - z1);

            len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        }

		/**
		 * Fills the quaternion object with values representing the given euler rotation.
		 *
		 * @param    ax        The angle in radians of the rotation around the ax axis.
		 * @param    ay        The angle in radians of the rotation around the ay axis.
		 * @param    az        The angle in radians of the rotation around the az axis.
		 */
        fromEulerAngles(ax: number, ay: number, az: number)
        {
            var halfX = ax * .5, halfY = ay * .5, halfZ = az * .5;
            var cosX = Math.cos(halfX), sinX = Math.sin(halfX);
            var cosY = Math.cos(halfY), sinY = Math.sin(halfY);
            var cosZ = Math.cos(halfZ), sinZ = Math.sin(halfZ);

            this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
            this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
            this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
            this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;
        }

		/**
		 * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
		 * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
		 * @return The Vector3 containing the Euler angles.
		 */
        toEulerAngles(target?: Vector3): Vector3
        {
            target = target || new Vector3();
            target.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y));
            var asinvalue = 2 * (this.w * this.y - this.z * this.x);
            //防止超出范围，获取NaN值
            asinvalue = Math.max(-1, Math.min(asinvalue, 1));
            target.y = Math.asin(asinvalue);
            target.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z));
            return target;
        }

		/**
		 * Normalises the quaternion object.
		 */
        normalize(val = 1)
        {
            var l = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
            if (l === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            } else
            {
                l = Math.sqrt(l);
                l = 1 / l;
                this.x *= l;
                this.y *= l;
                this.z *= l;
                this.w *= l;
            }
            return this;
        }


        /**
         * 四元数归一化的近似。当quat已经几乎标准化时，效果最好。
         * 
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        normalizeFast()
        {
            var f = (3.0 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2.0;
            if (f === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            } else
            {
                this.x *= f;
                this.y *= f;
                this.z *= f;
                this.w *= f;
            }
            return this;
        }

		/**
		 * 转换为可读格式
		 */
        toString()
        {
            return "{this.x:" + this.x + " this.y:" + this.y + " this.z:" + this.z + " this.w:" + this.w + "}";
        }

		/**
		 * Converts the quaternion to a Matrix4x4 object representing an equivalent rotation.
		 * @param target An optional Matrix4x4 container to store the transformation in. If not provided, a new object is created.
		 * @return A Matrix4x4 object representing an equivalent rotation.
		 */
        toMatrix3D(target?: Matrix4x4): Matrix4x4
        {
            if (!target)
                target = new Matrix4x4();

            var rawData = target.rawData;
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;

            rawData[0] = xx - yy - zz + ww;
            rawData[4] = xy2 - zw2;
            rawData[8] = xz2 + yw2;
            rawData[12] = 0;
            rawData[1] = xy2 + zw2;
            rawData[5] = -xx + yy - zz + ww;
            rawData[9] = yz2 - xw2;
            rawData[13] = 0;
            rawData[2] = xz2 - yw2;
            rawData[6] = yz2 + xw2;
            rawData[10] = -xx - yy + zz + ww;
            rawData[14] = 0;
            rawData[3] = 0.0;
            rawData[7] = 0.0;
            rawData[11] = 0;
            rawData[15] = 1;

            target.copyRawDataFrom(rawData);

            return target;
        }

		/**
		 * Extracts a quaternion rotation matrix out of a given Matrix4x4 object.
		 * @param matrix The Matrix4x4 out of which the rotation will be extracted.
		 */
        fromMatrix(matrix: Matrix4x4)
        {
            var v: Vector3 = matrix.decompose()[1];
            this.fromEulerAngles(v.x, v.y, v.z);
            return this;
        }

		/**
		 * Converts the quaternion to a Vector.&lt;number&gt; matrix representation of a rotation equivalent to this quaternion.
		 * @param target The Vector.&lt;number&gt; to contain the raw matrix data.
		 * @param exclude4thRow If true, the last row will be omitted, and a 4x3 matrix will be generated instead of a 4x4.
		 */
        toRawData(target: number[], exclude4thRow = false)
        {
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;

            target[0] = xx - yy - zz + ww;
            target[1] = xy2 - zw2;
            target[2] = xz2 + yw2;
            target[4] = xy2 + zw2;
            target[5] = -xx + yy - zz + ww;
            target[6] = yz2 - xw2;
            target[8] = xz2 - yw2;
            target[9] = yz2 + xw2;
            target[10] = -xx - yy + zz + ww;
            target[3] = target[7] = target[11] = 0;

            if (!exclude4thRow)
            {
                target[12] = target[13] = target[14] = 0;
                target[15] = 1;
            }
        }

		/**
		 * Clones the quaternion.
		 * @return An exact duplicate of the current Quaternion.
		 */
        clone(): Quaternion
        {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

		/**
		 * Rotates a point.
		 * @param vector The Vector3 object to be rotated.
		 * @param target An optional Vector3 object that will contain the rotated coordinates. If not provided, a new object will be created.
		 * @return A Vector3 object containing the rotated point.
		 */
        rotatePoint(vector: Vector3, target?: Vector3): Vector3
        {
            var x1: number, y1: number, z1: number, w1: number;
            var x2 = vector.x, y2 = vector.y, z2 = vector.z;

            target = target || new Vector3();

            // p*q'
            w1 = -this.x * x2 - this.y * y2 - this.z * z2;
            x1 = this.w * x2 + this.y * z2 - this.z * y2;
            y1 = this.w * y2 - this.x * z2 + this.z * x2;
            z1 = this.w * z2 + this.x * y2 - this.y * x2;

            target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return target;
        }

        /**
          * 将四元数乘以一个向量
          * 
          * @param v
          * @param target
          */
        vmult(v: Vector3, target = new Vector3())
        {
            var x = v.x,
                y = v.y,
                z = v.z;

            var qx = this.x,
                qy = this.y,
                qz = this.z,
                qw = this.w;

            // q*v
            var ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            return target;
        }

		/**
		 * 将源的值复制到此四元数
         * 
		 * @param q 要复制的四元数
		 */
        copy(q: Quaternion)
        {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
            return this;
        }
    }
}
