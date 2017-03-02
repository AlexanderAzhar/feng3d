module feng3d
{

    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class Input extends EventDispatcher
    {
        public static readonly instance = new Input();

        private readonly _addedTypes: { [type: string]: boolean } = {};

        public clientX: number = 0;
        public clientY: number = 0;

        /**
		 * 键盘按下事件
		 */
        private onMouseKey(event: MouseEvent | WheelEvent | KeyboardEvent): void
        {
            if (event.hasOwnProperty("clientX"))
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }

            this.dispatchEvent(new InputEvent(event));
        }

        /**
         * 
         */
        public addEventListener(type: string, listener: (event: InputEvent) => void, thisObject: any, priority = 0): void
        {
            super.addEventListener(type, listener, thisObject, priority);

            if (!this._addedTypes[type])
            {
                window.addEventListener(type, this.onMouseKey.bind(this));
                this._addedTypes[type] = true;
            }
        }
    }

    export class InputEventType
    {
        public static readonly instance = new InputEventType();

        /** 鼠标单击 */
        public readonly CLICK = "click";
        /** 鼠标双击 */
        public readonly DOUBLE_CLICK = "dblclick";
        /** 鼠标按下 */
        public readonly MOUSE_DOWN = "mousedown";
        /** 鼠标移动 */
        public readonly MOUSE_MOVE = "mousemove";
        /** 鼠标移出 */
        public readonly MOUSE_OUT = "mouseout";
        /** 鼠标移入 */
        public readonly MOUSE_OVER = "mouseover";
        /** 鼠标弹起 */
        public readonly MOUSE_UP = "mouseup";
        /** 鼠标滚动滚轮 */
        public readonly MOUSE_WHEEL = "mousewheel";
        /** 键盘按下 */
        public readonly KEY_DOWN = "keydown";
        /** 键盘按着 */
        public readonly KEY_PRESS = "keypress";
        /** 键盘弹起 */
        public readonly KEY_UP = "keyup";
    }

    export class InputEvent extends Event
    {
        public static readonly types = InputEventType.instance;

        public clientX: number = 0;
        public clientY: number = 0;

        constructor(event: MouseEvent | WheelEvent | KeyboardEvent)
        {
            super(event.type, event, event.bubbles)
            if (event.hasOwnProperty("clientX"))
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }

        }
    }
}