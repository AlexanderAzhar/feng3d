namespace feng3d
{
    /**
     * 粒子系统 发射球体
     */
    export class ParticleSystemShapeSphere extends ParticleSystemShape
    {
        @oav({ tooltip: "球体半径" })
        radius = 1;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            // 计算位置
            var dir = Vector3.random().scale(2).subNumber(1).normalize();

            var p = dir.scaleTo(Math.random() * this.radius);

            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scale(particle.startSpeed);
        }
    }
}