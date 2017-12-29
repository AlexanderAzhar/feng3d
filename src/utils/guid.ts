namespace feng3d
{
    /**
     * @description Basically a very large random number (128-bit) which means the probability of creating two that clash is vanishingly small.
     * GUIDs are used as the unique identifiers for Entities.
     * @see https://github.com/playcanvas/engine/blob/master/src/core/guid.js
     */
    export var guid = {
        /**
         * @function
         * @name pc.guid.create
         * @description Create an RFC4122 version 4 compliant GUID
         * @return {String} A new GUID
         */
        create: function ()
        {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
            {
                var r = Math.random() * 16 | 0,
                    v = (c == 'x') ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }
}
