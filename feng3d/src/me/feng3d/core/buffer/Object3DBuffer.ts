module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        private context3D: WebGLRenderingContext;
        private object3D: Object3D;
        squareVerticesBuffer: WebGLBuffer;
        count: number;

        constructor(context3D: WebGLRenderingContext, object3D: Object3D) {
            this.context3D = context3D;
            this.object3D = object3D;
        }

        /**
         * 激活缓冲
         */
        active(programBuffer: ProgramBuffer) {

            this.activeAttributes(programBuffer);
        }

        /**
         * 激活属性
         */
        activeAttributes(programBuffer: ProgramBuffer) {

            var attribLocations: ProgramAttributeLocation[] = programBuffer.getAttribLocations();

            var vaBuffers = this.getVaBuffers(attribLocations);

            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];
                this.activeAttribute(attribLocation);
            }
        }

        /**
         * 获取顶点缓冲列表
         */
        getVaBuffers(attribLocations: ProgramAttributeLocation[]) {

            var vaBuffers: AttributeBuffer[] = [];
            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];

                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { attribLocation: attribLocation, attributeBuffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData));
                assert(eventData.attributeBuffer != null);
                vaBuffers.push(eventData.attributeBuffer);
            }
            return vaBuffers;
        }

        /**
         * 激活属性
         */
        activeAttribute(attribLocation: ProgramAttributeLocation) {

            var squareVerticesBuffer = this.squareVerticesBuffer;
            if (squareVerticesBuffer == null) {
                var geometry = this.object3D.getComponentByClass(Geometry);
                // Create a buffer for the square's vertices.
                var positionData = geometry.getVAData(attribLocation.name);
                squareVerticesBuffer = this.squareVerticesBuffer = this.context3D.createBuffer();
                this.context3D.bindBuffer(this.context3D.ARRAY_BUFFER, squareVerticesBuffer);
                this.context3D.bufferData(this.context3D.ARRAY_BUFFER, positionData, this.context3D.STATIC_DRAW);
            }

            this.context3D.bindBuffer(this.context3D.ARRAY_BUFFER, this.squareVerticesBuffer);
            this.context3D.vertexAttribPointer(attribLocation.location, 3, this.context3D.FLOAT, false, 0, 0);
        }

        /**
         * 绘制
         */
        draw() {

            //从Object3D中获取顶点缓冲
            var eventData: GetIndexBufferEventData = { indexBuffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData));
            assert(eventData.indexBuffer != null);
            var indexBuffer = eventData.indexBuffer;
            indexBuffer.getBuffer

                this.context3D.bindBuffer(this.context3D.ELEMENT_ARRAY_BUFFER, indexBuffer);
            this.context3D.drawElements(this.context3D.TRIANGLES, this.count, this.context3D.UNSIGNED_SHORT, 0);
        }
    }
}