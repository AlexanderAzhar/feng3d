module feng3d
{

    /**
     * 标准材质
     * @author feng 2016-05-02
     * @see 物理渲染-基于物理的光照模型 http://blog.csdn.net/leonwei/article/details/44539217
     */
    export class StandardMaterial extends Material
    {
        /**
         * 漫反射函数
         */
        public diffuseMethod = new DiffuseMethod();

        /**
         * 环境颜色
         */
        public ambientColor = new Color(0, 0, 0, 1);

        /**
         * 反射率
         */
        public reflectance: number = 1.0;

        /**
         * 粗糙度
         */
        public roughness: number = 1.0;

        /**
         * 金属度
         */
        public metalic: number = 1.0;

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.shaderName = "standard";

            this.addComponent(this.diffuseMethod);

            Watcher.watch(this, ["ambientColor"], this.invalidateRenderData, this);
            Watcher.watch(this, ["reflectance"], this.invalidateRenderData, this);
            Watcher.watch(this, ["roughness"], this.invalidateRenderData, this);
            Watcher.watch(this, ["metalic"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms[RenderDataID.u_reflectance] = this.reflectance;
            renderData.uniforms[RenderDataID.u_roughness] = this.roughness;
            renderData.uniforms[RenderDataID.u_metalic] = this.metalic;
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}