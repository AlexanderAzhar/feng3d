namespace feng3d
{
    export interface MaterialMap { Material: Material }

    export type Materials = MaterialMap[keyof MaterialMap];

    /**
     * 材质
     */
    export class Material extends Feng3dAssets
    {
        /**
         * shader名称
         */
        @oav({ component: "OAVMaterialName" })
        @serialize
        @watch("onShaderChanged")
        shaderName = "standard";

        /**
         * Uniform数据
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        uniforms = {};

        /**
         * 渲染参数
         */
        @serialize
        @oav({ block: "渲染参数", component: "OAVObjectView" })
        renderParams = new RenderParams();

        /**
         * 渲染程序
         */
        shader: Shader;

        constructor()
        {
            super();
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
        }

        beforeRender(renderAtomic: RenderAtomic)
        {
            for (const key in this.uniforms)
            {
                if (this.uniforms.hasOwnProperty(key))
                {
                    renderAtomic.uniforms[<any>key] = this.uniforms[key];
                }
            }
            renderAtomic.shader = this.shader;
            renderAtomic.renderParams = this.renderParams;

            renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode == RenderMode.POINTS;
        }

        private onShaderChanged()
        {
            var cls = shaderConfig.shaders[this.shaderName].cls;
            if (cls)
            {
                if (!(this.uniforms instanceof cls))
                {
                    var newuniforms = new cls();
                    serialization.setValue(newuniforms, <any>this.uniforms);
                    this.uniforms = newuniforms;
                }
            }
            this.shader = new Shader(this.shaderName);
        }
    }
}
