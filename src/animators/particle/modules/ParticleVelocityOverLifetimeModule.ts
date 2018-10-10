namespace feng3d
{
    /**
     * 粒子系统 速度随时间变化模块
     * 
     * Controls the velocity of each particle during its lifetime.
     * 控制每个粒子在其生命周期内的速度。
     */
    export class ParticleVelocityOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        velocity = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number)
        {
            var velocity = this.velocity;

            //
            particle.position.x += velocity.x * (time - preTime);
            particle.position.y += velocity.y * (time - preTime);
            particle.position.z += velocity.z * (time - preTime);
        }
    }
}