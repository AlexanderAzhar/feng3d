namespace feng3d
{
    /**
     * 正射投影镜头
     */
    export class OrthographicLens extends LensBase
    {
        isOrthographicCamera = true;

        /**
         * 可视空间左边界
         */
        @serialize
        @oav()
        @watch("invalidateMatrix")
        left: number;

        /**
         * 可视空间右边界
         */
        @serialize
        @oav()
        @watch("invalidateMatrix")
        right: number;

        /**
         * 可视空间上边界
         */
        @serialize
        @oav()
        @watch("invalidateMatrix")
        top: number;

        /**
         * 可视空间下边界
         */
        @serialize
        @oav()
        @watch("invalidateMatrix")
        bottom: number;

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
        @serialize
        @oav()
        @watch("aspectRatioChanged")
        aspectRatio: number;

        /**
         * 构建正射投影镜头
         * @param left 可视空间左边界
         * @param right 可视空间右边界
         * @param top 可视空间上边界
         * @param bottom 可视空间下边界
         * @param near 可视空间近边界
         * @param far 可视空间远边界
         */
        constructor(left: number, right: number, top: number, bottom: number, near = 0.1, far = 2000)
        {
            super();
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
            this.near = near;
            this.far = far;
        }

        protected updateMatrix()
        {
            this._matrix.setOrtho(this.left, this.right, this.top, this.bottom, this.near, this.far);
        }

        private aspectRatioChanged()
        {
            var h = Math.abs(this.top - this.bottom);
            var center = (this.left + this.right) / 2;
            var w = h * this.aspectRatio;
            this.left = center + 0.5 * w * (this.left - center) / Math.abs(this.left - center);
            this.right = center + 0.5 * w * (this.right - center) / Math.abs(this.right - center);
        }
    }
}