namespace feng3d
{
    /**
     * 粒子系统 发射圆锥体
     */
    export class ParticleSystemShapeCone extends ParticleSystemShape
    {
        @serialize
        @oav({ tooltip: "圆锥体开口角度。" })
        angle = 25;

        @serialize
        @oav({ tooltip: "圆锥体底部半径。" })
        radius = 1;

        @serialize
        @oav({ tooltip: "圆锥体高度" })
        height = 5;

        @serialize
        @oav({ tooltip: "在弧线周围产生了新的粒子。" })
        arc = 360;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.startVelocity.length;

            // 计算位置
            var angle = Math.random() * FMath.degToRad(this.arc);
            var r = Math.random();
            var p = new Vector3(Math.sin(angle), Math.cos(angle), 0);
            particle.startPosition.copy(p).scale(this.radius).scale(r);

            // 计算速度
            p.scale(this.radius + this.height * Math.tan(FMath.degToRad(this.angle))).scale(r);
            p.z = this.height;
            var dir = p.sub(particle.startPosition).normalize();
            particle.startVelocity.copy(dir).scale(speed);
        }
    }
}