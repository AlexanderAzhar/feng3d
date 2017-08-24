declare namespace feng3d {
    /**
     *
     * @author feng 2015-5-28
     */
    class FreeMatrixLens extends LensBase {
        constructor();
        protected updateMatrix(): void;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
    }
}
