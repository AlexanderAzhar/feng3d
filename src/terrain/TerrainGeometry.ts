namespace feng3d
{
    export interface GeometryMap { TerrainGeometry: TerrainGeometry }

    /**
     * 地形几何体
     */
    export class TerrainGeometry extends Geometry
    {
        /**
         * 高度图路径
         */
        @serialize
        @oav()
        get heightMap()
        {
            return this._heightMap;
        }
        set heightMap(v)
        {
            if (this._heightMap == v) return;
            this._heightMap = v;
            this.onHeightMapChanged();
        }
        private _heightMap = Texture2D.default;

        /**
         * 地形宽度
         */
        @serialize
        @oav()
        get width()
        {
            return this._width;
        }
        set width(v)
        {
            if (this._width == v) return;
            this._width = v;
            this.invalidateGeometry();
        }
        private _width = 10;

        /**
         * 地形高度
         */
        @serialize
        @oav()
        get height()
        {
            return this._height;
        }
        set height(v)
        {
            if (this._height == v) return;
            this._height = v;
            this.invalidateGeometry();
        }
        private _height = 1;

        /**
         * 地形深度
         */
        @serialize
        @oav()
        get depth()
        {
            return this._depth;
        }
        set depth(v)
        {
            if (this._depth == v) return;
            this._depth = v;
            this.invalidateGeometry();
        }
        private _depth = 10;

        /**
         * 横向网格段数
         */
        @serialize
        @oav()
        get segmentsW()
        {
            return this._segmentsW;
        }
        set segmentsW(v)
        {
            if (this._segmentsW == v) return;
            this._segmentsW = v;
            this.invalidateGeometry();
        }
        private _segmentsW = 30;

        /**
         * 纵向网格段数
         */
        @serialize
        @oav()
        get segmentsH()
        {
            return this._segmentsH;
        }
        set segmentsH(v)
        {
            if (this._segmentsH == v) return;
            this._segmentsH = v;
            this.invalidateGeometry();
        }
        private _segmentsH = 30;

        /**
         * 最大地形高度
         */
        @serialize
        @oav()
        get maxElevation()
        {
            return this._maxElevation;
        }
        set maxElevation(v)
        {
            if (this._maxElevation == v) return;
            this._maxElevation = v;
            this.invalidateGeometry();
        }
        private _maxElevation = 255;

        /**
         * 最小地形高度
         */
        @serialize
        @oav()
        get minElevation()
        {
            return this._minElevation;
        }
        set minElevation(v)
        {
            if (this._minElevation == v) return;
            this._minElevation = v;
            this.invalidateGeometry();
        }
        private _minElevation = 0;

        private _heightImageData = defaultHeightMap;

		/**
		 * 创建高度地形 拥有segmentsW*segmentsH个顶点
		 */
        constructor(raw?: gPartial<TerrainGeometry>)
        {
            super();
            this.name = "terrain";
            serialization.setValue(this, raw);
        }

        private onHeightMapChanged()
        {
            if (!this.heightMap["_pixels"]) 
            {
                this._heightImageData = defaultHeightMap;
                this.invalidateGeometry();

                this.heightMap.once("loadCompleted", () =>
                {
                    var img = <HTMLImageElement>this.heightMap["_pixels"];
                    this._heightImageData = ImageUtil.fromImage(img).imageData;
                    this.invalidateGeometry();
                });
                return;
            }
            var img = <HTMLImageElement>this.heightMap["_pixels"];
            this._heightImageData = ImageUtil.fromImage(img).imageData;
            this.invalidateGeometry();
        }

		/**
		 * 创建顶点坐标
		 */
        protected buildGeometry()
        {
            if (!this._heightImageData)
                return;
            var x: number, z: number;
            var numInds = 0;
            var base = 0;
            //一排顶点数据
            var tw = this.segmentsW + 1;
            //总顶点数量
            var numVerts = (this.segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv = (this._heightImageData.width - 1) / this.segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv = (this._heightImageData.height - 1) / this.segmentsH;
            var u: number, v: number;
            var y: number;

            var vertices: number[] = [];
            var indices: number[] = [];

            numVerts = 0;
            var col: number;
            for (var zi = 0; zi <= this.segmentsH; ++zi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    //顶点坐标
                    x = (xi / this.segmentsW - .5) * this.width;
                    z = (zi / this.segmentsH - .5) * this.depth;
                    //格子对应高度图uv坐标
                    u = xi * uDiv;
                    v = (this.segmentsH - zi) * vDiv;

                    //获取颜色值
                    col = this.getPixel(this._heightImageData, u, v) & 0xff;
                    //计算高度值
                    y = (col > this.maxElevation) ? (this.maxElevation / 0xff) * this.height : ((col < this.minElevation) ? (this.minElevation / 0xff) * this.height : (col / 0xff) * this.height);

                    //保存顶点坐标
                    vertices[numVerts++] = x;
                    vertices[numVerts++] = y;
                    vertices[numVerts++] = z;

                    if (xi != this.segmentsW && zi != this.segmentsH)
                    {
                        //增加 一个顶点同时 生成一个格子或两个三角形
                        base = xi + zi * tw;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base + 1;
                    }
                }
            }
            var uvs = this.buildUVs();
            this.setVAData("a_position", vertices, 3);
            this.setVAData("a_uv", uvs, 2);
            this.indices = indices;
        }

		/**
		 * 创建uv坐标
		 */
        private buildUVs()
        {
            var numUvs = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
            var uvs: number[] = [];

            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    uvs[numUvs++] = xi / this.segmentsW;
                    uvs[numUvs++] = 1 - yi / this.segmentsH;
                }
            }

            return uvs;
        }

		/**
		 * 获取位置在（x，z）处的高度y值
		 * @param x x坐标
		 * @param z z坐标
		 * @return 高度
		 */
        getHeightAt(x: number, z: number): number
        {

            //得到高度图中的值
            var u = (x / this.width + .5) * (this._heightImageData.width - 1);
            var v = (-z / this.depth + .5) * (this._heightImageData.height - 1);

            var col = this.getPixel(this._heightImageData, u, v) & 0xff;

            var h: number;
            if (col > this.maxElevation)
            {
                h = (this.maxElevation / 0xff) * this.height;
            }
            else if (col < this.minElevation)
            {
                h = (this.minElevation / 0xff) * this.height;
            }
            else
            {
                h = (col / 0xff) * this.height;
            }

            return h;
        }

        /**
         * 获取像素值
         */
        private getPixel(imageData: ImageData, u: number, v: number)
        {

            //取整
            u = ~~u;
            v = ~~v;

            var index = (v * imageData.width + u) * 4;
            var data = imageData.data;
            var red = data[index];//红色色深
            var green = data[index + 1];//绿色色深
            var blue = data[index + 2];//蓝色色深
            var alpha = data[index + 3];//透明度
            return blue;
        }
    }

    /**
     * 默认高度图
     */
    var defaultHeightMap = new ImageUtil(1024, 1024, new Color4(0, 0, 0, 0)).imageData;

    export interface DefaultGeometry
    {
        "Terrain-Geometry": TerrainGeometry;
    }
    Geometry.setDefault("Terrain-Geometry", new TerrainGeometry());
}