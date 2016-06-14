module me.feng3d {

	/**
	 * 属性缓冲
	 * @author feng 2014-8-14
	 */
    export class AttributeBuffer extends Component {

        /**
         * 属性缓冲名称
         */
        name: string;

        /** 顶点数据 */
        data: Float32Array;

        /** 与每个顶点关联的 32 位（4 字节）数据值的数量。 */
        size: number;

        /**
         * 构建属性缓冲
         */
        constructor() {
            super();

            this.addEventListener(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, this.onGetAttributeBuffer, this)
        }

        /**
         * 获取缓冲
         * @param context3D    3D渲染环境
         */
        getBuffer(context3D: WebGLRenderingContext) {

            var buffer = Context3DBufferCenter.getInstance(context3D)//
                .getVABuffer(this.data);
            return buffer;
        }

        /**
         * 处理获取属性缓冲事件
         */
        onGetAttributeBuffer(event: Context3DBufferEvent) {

            var eventData: GetAttributeBufferEventData = event.data;
            if (eventData.attribLocation.name == this.name)
                eventData.attributeBuffer = this;
        }
    }
}