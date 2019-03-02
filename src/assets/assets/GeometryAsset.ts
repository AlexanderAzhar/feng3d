namespace feng3d
{
    /**
     * 几何体资源
     */
    export class GeometryAsset extends ObjectAsset
    {
        /**
         * 几何体
         */
        @oav({ component: "OAVObjectView" })
        data: Geometry;

        assetType = AssetType.geometry;

        extenson = ".json";
    }
}