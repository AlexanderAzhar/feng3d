module me.feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private gl: WebGLRenderingContext;
        private shaderProgram: WebGLProgram;
        private vertexPositionAttribute: number;

        private _camera: Object3D;

        private plane: Object3D;

        private _scene: Scene3D;

        vertexShaderStr = //
        `
attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}`;
        fragmentShaderStr = //
        `
void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas, scene: Scene3D = null, camera: Object3D = null) {

            assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this.scene = scene || new Scene3D();
            this._camera = camera || factory.createCamera();

            this.gl = canvas.getContext("experimental-webgl");
            this.gl || alert("Unable to initialize WebGL. Your browser may not support it.");

            this.initGL();

            this.initShaders();

            this.initObject3D();

            setInterval(this.drawScene.bind(this), 15);
        }

        /** 3d场景 */
        public get scene(): Scene3D {
            return this._scene;
        }

        public set scene(value: Scene3D) {
            this._scene = value;
        }

        private initGL() {
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this.gl.clearDepth(1.0);                 // Clear everything
            this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
            this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
        }

        private initShaders() {
            var vertexShader = this.getShader(this.vertexShaderStr, 1);
            var fragmentShader = this.getShader(this.fragmentShaderStr, 2);

            // Create the shader program

            this.shaderProgram = this.gl.createProgram();
            this.gl.attachShader(this.shaderProgram, vertexShader);
            this.gl.attachShader(this.shaderProgram, fragmentShader);
            this.gl.linkProgram(this.shaderProgram);

            // If creating the shader program failed, alert

            if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
                alert("Unable to initialize the shader program.");
            }

            this.gl.useProgram(this.shaderProgram);

            this.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        }

        private getShader(theSource: string, type: number) {

            // Now figure out what type of shader script we have,
            // based on its MIME type.

            var shader: WebGLShader;

            if (type == 2) {
                shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            } else if (type == 1) {
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
            } else {
                return null;  // Unknown shader type
            }

            // Send the source to the shader object

            this.gl.shaderSource(shader, theSource);

            // Compile the shader program

            this.gl.compileShader(shader);

            // See if it compiled successfully

            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }

        private initObject3D() {

            var plane = this.plane = new Object3D();
            plane.addComponent(primitives.createPlane(1, 1));
            plane.space3D.z = 3;
            plane.space3D.rx = 90;
        }

        private drawScene() {
            // Clear the canvas before we start drawing on it.

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            var renderables = this._scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element);
            });

            this.drawObject3D(this.plane);
        }

        private setMatrixUniforms() {

            var perspectiveMatrix = this.getPerspectiveMatrix();
            var pUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.rawData));
        }

        private getPerspectiveMatrix(): Matrix3D {

            var camSpace3D = this._camera.space3D;
            var camera = this._camera.getComponentByClass(Camera);

            var perspectiveMatrix = camSpace3D.transform3D;
            perspectiveMatrix.invert();
            perspectiveMatrix.append(camera.projectionMatrix3D);

            return perspectiveMatrix;
        }

        private drawObject3D(object3D: Object3D) {

            var object3DBuffer = object3DBufferManager.getBuffer(this.gl, object3D);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object3DBuffer.squareVerticesBuffer);
            this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            var mvMatrix = object3D.space3D.transform3D;
            var mvUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
            this.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.rawData));

            this.setMatrixUniforms();
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    class Object3DBuffer {

        squareVerticesBuffer: WebGLBuffer;
    }

    class Object3DBufferManager {

        buffer: Object3DBuffer;

        getBuffer(gl: WebGLRenderingContext, object3D: Object3D) {

            if (this.buffer == null) {
                this.buffer = new Object3DBuffer();

                var geometry = object3D.getComponentByClass(Geometry);
                var positionData = geometry.getVAData(GLAttribute.position);

                // Create a buffer for the square's vertices.
                var squareVerticesBuffer = this.buffer.squareVerticesBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);
            }

            return this.buffer;
        }
    }

    var object3DBufferManager = new Object3DBufferManager();
}