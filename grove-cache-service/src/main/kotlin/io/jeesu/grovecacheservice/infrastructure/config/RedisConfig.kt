package io.jeesu.grovecacheservice.infrastructure.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.cache.annotation.EnableCaching

@Configuration
@EnableCaching
class RedisConfig(
    @Value("\${spring.data.redis.host:localhost}") private val host: String,
    @Value("\${spring.data.redis.port:6379}") private val port: Int
) {
    @Bean
    fun redisConnectionFactory(): LettuceConnectionFactory = LettuceConnectionFactory(host, port)

    @Bean
    fun stringRedisTemplate(factory: LettuceConnectionFactory): StringRedisTemplate = StringRedisTemplate(factory)
}
