QUnit.module("Queue", () =>
{
    QUnit.test("isEmpty", (assert) =>
    {
        var q = new ds.Queue<number>();

        assert.deepEqual(q.isEmpty(), true);
    });

    QUnit.test("empty", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        arr.forEach(element =>
        {
            q.enqueue(element);
        });
        q.empty();
        assert.deepEqual(q.isEmpty(), true);
    });

    QUnit.test("peek", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        arr.forEach(element =>
        {
            q.enqueue(element);
        });
        assert.deepEqual(q.peek(), arr[0]);
    });

    QUnit.test("enqueue", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        arr.forEach(element =>
        {
            q.enqueue(element);
        });
        assert.deepEqual(q.peek(), arr[0]);
    });

    QUnit.test("enqueue", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        arr.forEach(element =>
        {
            q.enqueue(element);
        });
        while (!q.isEmpty())
        {
            assert.deepEqual(q.dequeue(), arr.shift());
        }
    });

    QUnit.test("toString", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        arr.forEach(element =>
        {
            q.enqueue(element);
        });

        assert.ok(true, q.toString((v) => v.toFixed(3)));
    });


});